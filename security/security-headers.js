// ===========================================
// NAMASTE-SYNC Security Headers Middleware
// ===========================================
// Comprehensive security headers and CSP configuration

const helmet = require('helmet');

// Content Security Policy configuration
const contentSecurityPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com"
    ],
    fontSrc: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com"
    ],
    imgSrc: [
      "'self'",
      "data:",
      "https:",
      "https://ytstlikzmgpynffuvsmw.supabase.co" // Supabase storage
    ],
    scriptSrc: [
      "'self'",
      "'unsafe-eval'", // Required for some frameworks
      "https://cdnjs.cloudflare.com"
    ],
    connectSrc: [
      "'self'",
      "https://api.namaste-sync.com",
      "https://staging-api.namaste-sync.com",
      "https://ytstlikzmgpynffuvsmw.supabase.co" // Supabase API
    ],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
    upgradeInsecureRequests: [],
  },
};

// Security configuration
const securityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    ...contentSecurityPolicy,
    reportOnly: process.env.NODE_ENV === 'development'
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // Referrer Policy
  referrerPolicy: {
    policy: ['strict-origin-when-cross-origin']
  },

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false
  },

  // X-Download-Options
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true
  }
};

// Custom rate limiting
const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  // General API rate limit
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP'
  ),

  // Strict rate limit for authentication endpoints
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth requests per windowMs
    'Too many authentication attempts'
  ),

  // Very strict rate limit for login
  login: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    3, // limit each IP to 3 login attempts per windowMs
    'Too many login attempts. Try again later.'
  ),

  // Upload rate limit
  upload: createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 uploads per hour
    'Too many upload requests'
  )
};

// Input validation and sanitization
const { body, validationResult } = require('express-validator');

const validationRules = {
  // User registration validation
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name required (max 50 characters)'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name required (max 50 characters)')
  ],

  // Login validation
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .notEmpty()
      .withMessage('Password required')
  ]
};

// CSRF protection
const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Security middleware function
const securityMiddleware = (app) => {
  // Apply helmet for security headers
  app.use(helmet(securityConfig));

  // Apply rate limiting
  app.use('/api/', rateLimits.general);
  app.use('/api/auth/', rateLimits.auth);
  app.use('/api/auth/login', rateLimits.login);
  app.use('/api/upload', rateLimits.upload);

  // Apply CSRF protection (only for state-changing requests)
  app.use(csrfProtection);

  // Make CSRF token available to frontend
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Input validation error handler
  app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  });
};

// IP-based blocking for suspicious activity
const suspiciousIpStore = new Map();

const suspiciousActivityMiddleware = (req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!suspiciousIpStore.has(clientIp)) {
    suspiciousIpStore.set(clientIp, {
      attempts: 0,
      lastAttempt: Date.now(),
      blocked: false
    });
  }

  const ipData = suspiciousIpStore.get(clientIp);

  // Block IP if too many failed attempts
  if (ipData.blocked) {
    // Check if block period has expired (24 hours)
    if (Date.now() - ipData.lastAttempt > 24 * 60 * 60 * 1000) {
      ipData.blocked = false;
      ipData.attempts = 0;
    } else {
      return res.status(429).json({
        error: 'Too many failed attempts. IP temporarily blocked.'
      });
    }
  }

  // Track failed authentication attempts
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.path.includes('/auth/')) {
      ipData.attempts++;
      ipData.lastAttempt = Date.now();

      // Block after 10 failed attempts
      if (ipData.attempts >= 10) {
        ipData.blocked = true;
      }
    }
  });

  next();
};

module.exports = {
  securityMiddleware,
  suspiciousActivityMiddleware,
  validationRules,
  rateLimits,
  contentSecurityPolicy
};