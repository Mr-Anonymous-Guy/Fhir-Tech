// Debug version of server.js with additional logging
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./database');

console.log('Starting debug server...');

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Setting up middleware...');

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
  console.log('Health endpoint called');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: database.isConnected
  });
});

console.log('Setting up routes...');

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Test endpoint working' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('Connecting to database...');
    // Connect to MongoDB
    await database.connect();
    console.log('Database connected');
    
    // Initialize with sample data if empty
    console.log('Checking for existing data...');
    const stats = await database.getMappingStats();
    console.log('Stats:', stats);
    if (stats.totalMappings === 0) {
      console.log('📥 Initializing database with sample data...');
      // Skip sample data for now to simplify debugging
    }

    // Start server
    console.log('Starting server on port', PORT);
    const server = app.listen(PORT, () => {
      console.log(`🚀 NAMASTE-SYNC Backend Server running on port ${PORT}`);
      console.log(`📊 MongoDB Database: ${database.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

console.log('Calling startServer...');
startServer().catch(console.error);