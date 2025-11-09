/**
 * NAMASTE-SYNC MongoDB Backend API Server
 * Provides REST API endpoints for MongoDB operations
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./database');
const authService = require('./services/authService');
const { MAPPINGS, AUDIT_LOGS } = require('./seed-data');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:8080', 'http://localhost:8081'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: database.isConnected
  });
});

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.register({ email, password, username, fullName });
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/auth/verify-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = await authService.verifyToken(token);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.get('/api/auth/user/:id', async (req, res) => {
  try {
    const user = await authService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(404).json({ error: error.message });
  }
});

app.put('/api/auth/profile/:id', async (req, res) => {
  try {
    const result = await authService.updateUserProfile(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Mappings endpoints
app.get('/api/mappings', async (req, res) => {
  try {
    const { category, chapter, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (chapter) filters.chapter = chapter;

    const result = await database.searchMappings(
      '',
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Get mappings error:', error);
    res.status(500).json({ error: 'Failed to get mappings' });
  }
});

app.get('/api/mappings/search', async (req, res) => {
  try {
    const { q: query = '', category, chapter, minConfidence, maxConfidence, page = 1, limit = 20 } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (chapter) filters.chapter = chapter;
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence);
    if (maxConfidence) filters.maxConfidence = parseFloat(maxConfidence);

    const result = await database.searchMappings(
      query,
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (error) {
    console.error('Search mappings error:', error);
    res.status(500).json({ error: 'Failed to search mappings' });
  }
});

app.get('/api/mappings/:code', async (req, res) => {
  try {
    const mapping = await database.getMappingByCode(req.params.code);
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' });
    }
    res.json(mapping);
  } catch (error) {
    console.error('Get mapping error:', error);
    res.status(500).json({ error: 'Failed to get mapping' });
  }
});

app.post('/api/mappings', async (req, res) => {
  try {
    const mappings = Array.isArray(req.body) ? req.body : [req.body];
    const result = await database.insertMappings(mappings);
    res.json({
      success: true,
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds
    });
  } catch (error) {
    console.error('Insert mappings error:', error);
    res.status(500).json({ error: 'Failed to insert mappings' });
  }
});

app.get('/api/mappings/stats/summary', async (req, res) => {
  try {
    const stats = await database.getMappingStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get mapping statistics' });
  }
});

app.get('/api/mappings/metadata/categories', async (req, res) => {
  try {
    const categories = await database.getCategories();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

app.get('/api/mappings/metadata/chapters', async (req, res) => {
  try {
    const chapters = await database.getChapters();
    res.json(chapters);
  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({ error: 'Failed to get chapters' });
  }
});

app.delete('/api/mappings', async (req, res) => {
  try {
    const result = await database.clearMappings();
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Clear mappings error:', error);
    res.status(500).json({ error: 'Failed to clear mappings' });
  }
});

// Audit log endpoints
app.post('/api/audit', async (req, res) => {
  try {
    const result = await database.insertAuditEntry(req.body);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error('Insert audit entry error:', error);
    res.status(500).json({ error: 'Failed to insert audit entry' });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const { action, userId, success, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (success !== undefined) filters.success = success === 'true';
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await database.getAuditLogs(filters, parseInt(page), parseInt(limit));
    res.json(result);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

app.delete('/api/audit', async (req, res) => {
  try {
    const result = await database.clearAuditLogs();
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Clear audit logs error:', error);
    res.status(500).json({ error: 'Failed to clear audit logs' });
  }
});

// Profile Management Endpoints

// Security endpoints
app.get('/api/profile/security/sessions', async (req, res) => {
  try {
    const sessions = await database.getUserSessions(req.query.userId);
    res.json(sessions);
  } catch (error) {
    console.error('Get user sessions error:', error);
    res.status(500).json({ error: 'Failed to get user sessions' });
  }
});

app.post('/api/profile/security/session', async (req, res) => {
  try {
    const session = await database.createUserSession(req.body);
    res.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.delete('/api/profile/security/session/:sessionId', async (req, res) => {
  try {
    const result = await database.terminateSession(req.params.sessionId);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({ error: 'Failed to terminate session' });
  }
});

// Notifications endpoints
app.get('/api/profile/notifications', async (req, res) => {
  try {
    const { userId, unread, page = 1, limit = 20 } = req.query;
    const filters = { userId };
    if (unread === 'true') filters.read = false;

    const notifications = await database.getNotifications(filters, parseInt(page), parseInt(limit));
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

app.post('/api/profile/notifications', async (req, res) => {
  try {
    const notification = await database.createNotification(req.body);
    res.json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.patch('/api/profile/notifications/:notificationId', async (req, res) => {
  try {
    const result = await database.markNotificationRead(req.params.notificationId, req.body.read);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Data Management endpoints
app.get('/api/profile/data/export', async (req, res) => {
  try {
    const { format = 'json', userId } = req.query;
    const data = await database.exportUserData(userId, format);

    const filename = `namaste-sync-export-${new Date().toISOString().split('T')[0]}.${format}`;
    const contentType = format === 'json' ? 'application/json' : 'text/csv';

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(data);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/api/profile/data/backup', async (req, res) => {
  try {
    const backup = await database.createBackup(req.body.userId);
    res.json({ success: true, backup });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

app.get('/api/profile/data/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    const stats = await database.getUserDataStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Get data stats error:', error);
    res.status(500).json({ error: 'Failed to get data statistics' });
  }
});

// Help & Support endpoints
app.post('/api/profile/support/ticket', async (req, res) => {
  try {
    const ticket = await database.createSupportTicket(req.body);
    res.json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

app.get('/api/profile/support/tickets', async (req, res) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.query;
    const tickets = await database.getSupportTickets({ userId, status }, parseInt(page), parseInt(limit));
    res.json(tickets);
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ error: 'Failed to get support tickets' });
  }
});

// System Statistics endpoints
app.get('/api/profile/system/stats', async (req, res) => {
  try {
    const stats = await database.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();

    // Initialize with sample data - ALWAYS reinitialize to ensure fresh data
    try {
      console.log('🔍 Reinitializing database with fresh seed data...');
      await initializeSampleData();
    } catch (error) {
      console.warn('⚠️ Could not check mapping stats:', error.message);
      console.log('📥 Attempting to initialize sample data anyway...');
      try {
        await initializeSampleData();
      } catch (initError) {
        console.warn('⚠️ Could not initialize sample data:', initError.message);
      }
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 NAMASTE-SYNC Backend Server running on port ${PORT}`);
      console.log(`📊 MongoDB Database: ${database.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Initialize sample data
async function initializeSampleData() {
  console.log('\n==========================================');
  console.log('📊 DATABASE INITIALIZATION');
  console.log('==========================================\n');
  
  try {
    console.log('🔍 Clearing old data...');
    await database.clearMappings();
    await database.clearAuditLogs();
    console.log('✅ Old data cleared');
    
    console.log('\n📥 Inserting 15 sample mappings...');
    await database.insertMappings(MAPPINGS);
    console.log(`✅ Successfully inserted ${MAPPINGS.length} mappings`);
    
    console.log('\n📥 Inserting sample audit logs...');
    for (const entry of AUDIT_LOGS) {
      await database.insertAuditEntry(entry);
    }
    console.log(`✅ Successfully inserted ${AUDIT_LOGS.length} audit entries`);
    
    // Verify the data was inserted
    console.log('\n✔️  Verifying data...');
    const stats = await database.getMappingStats();
    console.log(`✔️  Database now contains ${stats.totalMappings} mappings`);
    console.log(`✔️  Average confidence score: ${(stats.avgConfidenceScore * 100).toFixed(1)}%`);
    
    const categories = await database.getCategories();
    console.log(`✔️  Categories: ${categories.join(', ')}`);
    
    console.log('\n✅ DATABASE INITIALIZATION COMPLETE');
    console.log('==========================================\n');
  } catch (error) {
    console.error('\n❌ INITIALIZATION FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();