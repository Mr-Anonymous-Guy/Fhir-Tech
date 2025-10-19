/**
 * NAMASTE-SYNC Enhanced MongoDB Backend API Server
 * Provides comprehensive REST API with security, notifications, data management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: database.isConnected,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// System stats endpoint
app.get('/api/system/stats', async (req, res) => {
  try {
    const [mappingStats, auditCount] = await Promise.all([
      database.getMappingStats(),
      database.getAuditLogCount()
    ]);

    res.json({
      database: {
        mappings: mappingStats.totalMappings,
        auditLogs: auditCount,
        avgConfidence: mappingStats.avgConfidenceScore
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ error: 'Failed to get system statistics' });
  }
});

// =============================================================================
// MAPPINGS ENDPOINTS
// =============================================================================

app.get('/api/mappings/search', async (req, res) => {
  try {
    const { q: query = '', category, chapter, minConfidence, maxConfidence, page = 1, limit = 20 } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (chapter) filters.chapter = chapter;
    if (minConfidence) filters.minConfidence = parseFloat(minConfidence);
    if (maxConfidence) filters.maxConfidence = parseFloat(maxConfidence);

    const result = await database.searchMappings(query, filters, parseInt(page), parseInt(limit));
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
    
    // Log bulk upload activity
    await database.insertAuditEntry({
      action: 'bulk_upload',
      userId: 'system',
      userName: 'System',
      query: `${mappings.length} mappings uploaded`,
      resultCount: mappings.length,
      success: true,
      duration: 0
    });
    
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
    const categories = await database.getCategories();
    const chapters = await database.getChapters();
    
    res.json({
      ...stats,
      categoriesCount: categories.length,
      chaptersCount: chapters.length,
      categories,
      chapters
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get mapping statistics' });
  }
});

app.delete('/api/mappings', async (req, res) => {
  try {
    const result = await database.clearMappings();
    
    // Log data clear activity
    await database.insertAuditEntry({
      action: 'data_clear',
      userId: req.headers['user-id'] || 'system',
      userName: req.headers['user-name'] || 'System',
      query: 'All mappings cleared',
      resultCount: result.deletedCount,
      success: true,
      duration: 0
    });
    
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Clear mappings error:', error);
    res.status(500).json({ error: 'Failed to clear mappings' });
  }
});

// =============================================================================
// DATA MANAGEMENT ENDPOINTS
// =============================================================================

app.get('/api/data/export', async (req, res) => {
  try {
    const { format = 'json', category, chapter } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (chapter) filters.chapter = chapter;
    
    const result = await database.searchMappings('', filters, 1, 10000);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (format === 'csv') {
      const csvHeader = 'namaste_code,namaste_term,category,chapter_name,icd11_tm2_code,icd11_tm2_description,icd11_biomedicine_code,confidence_score\n';
      const csvData = result.mappings.map(m => 
        `"${m.namaste_code}","${m.namaste_term}","${m.category}","${m.chapter_name}","${m.icd11_tm2_code}","${m.icd11_tm2_description}","${m.icd11_biomedicine_code}",${m.confidence_score}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="namaste-mappings-${timestamp}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      const exportData = {
        export_info: {
          timestamp: new Date().toISOString(),
          total_records: result.total,
          filters_applied: filters,
          exported_by: 'NAMASTE-SYNC System'
        },
        mappings: result.mappings
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="namaste-mappings-${timestamp}.json"`);
      res.json(exportData);
    }
    
    // Log export activity
    await database.insertAuditEntry({
      action: 'data_export',
      userId: req.headers['user-id'] || 'system',
      userName: req.headers['user-name'] || 'System',
      query: `Export ${format.toUpperCase()}: ${result.total} records`,
      resultCount: result.total,
      success: true,
      duration: 0
    });
    
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.post('/api/data/backup', async (req, res) => {
  try {
    const [mappings, auditLogs] = await Promise.all([
      database.searchMappings('', {}, 1, 100000),
      database.getAuditLogs({}, 1, 100000)
    ]);
    
    const backup = {
      backup_info: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        total_mappings: mappings.total,
        total_audit_logs: auditLogs.total
      },
      data: {
        mappings: mappings.mappings,
        auditLogs: auditLogs.entries
      }
    };
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="namaste-backup-${timestamp}.json"`);
    res.json(backup);
    
    // Log backup activity
    await database.insertAuditEntry({
      action: 'data_backup',
      userId: req.headers['user-id'] || 'system',
      userName: req.headers['user-name'] || 'System',
      query: `Full backup created: ${mappings.total} mappings, ${auditLogs.total} logs`,
      resultCount: mappings.total + auditLogs.total,
      success: true,
      duration: 0
    });
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// =============================================================================
// AUDIT AND SECURITY ENDPOINTS
// =============================================================================

app.post('/api/audit', async (req, res) => {
  try {
    const auditEntry = {
      ...req.body,
      timestamp: req.body.timestamp || new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    const result = await database.insertAuditEntry(auditEntry);
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

app.get('/api/security/activity-summary', async (req, res) => {
  try {
    const summary = await database.getSecurityActivitySummary();
    res.json(summary);
  } catch (error) {
    console.error('Security summary error:', error);
    res.status(500).json({ error: 'Failed to get security activity summary' });
  }
});

// =============================================================================
// NOTIFICATIONS ENDPOINTS
// =============================================================================

app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await database.getNotifications(req.query.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  try {
    const { notificationIds } = req.body;
    await database.markNotificationsAsRead(notificationIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// =============================================================================
// HELP & SUPPORT ENDPOINTS
// =============================================================================

app.get('/api/help/documentation', (req, res) => {
  const documentation = {
    api_version: '1.0.0',
    base_url: `http://localhost:${PORT}/api`,
    endpoints: {
      mappings: {
        search: 'GET /mappings/search?q=term&category=Ayurveda&page=1&limit=20',
        get_by_code: 'GET /mappings/{code}',
        create: 'POST /mappings',
        stats: 'GET /mappings/stats/summary'
      },
      data_management: {
        export: 'GET /data/export?format=json|csv&category=Ayurveda',
        backup: 'POST /data/backup'
      },
      audit: {
        get_logs: 'GET /audit?action=search&page=1&limit=50',
        create_entry: 'POST /audit'
      }
    },
    data_models: {
      mapping: {
        namaste_code: 'string (unique)',
        namaste_term: 'string',
        category: 'Ayurveda|Siddha|Unani',
        chapter_name: 'string',
        icd11_tm2_code: 'string',
        icd11_tm2_description: 'string',
        icd11_biomedicine_code: 'string',
        confidence_score: 'number (0-1)'
      }
    }
  };
  
  res.json(documentation);
});

app.post('/api/help/support-ticket', async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    
    // In a real implementation, this would send to a support system
    const ticket = {
      id: `TICKET-${Date.now()}`,
      subject,
      message,
      category,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
      user_id: req.headers['user-id'] || 'anonymous'
    };
    
    // Log support ticket
    await database.insertAuditEntry({
      action: 'support_ticket',
      userId: ticket.user_id,
      userName: req.headers['user-name'] || 'Anonymous',
      query: `Support ticket: ${subject}`,
      success: true,
      duration: 0
    });
    
    res.json({ 
      success: true, 
      ticket_id: ticket.id,
      message: 'Support ticket created successfully. You will receive a response within 24 hours.'
    });
  } catch (error) {
    console.error('Support ticket error:', error);
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    
    // Initialize with sample data if empty
    const stats = await database.getMappingStats();
    if (stats.totalMappings === 0) {
      console.log('📥 Initializing database with sample data...');
      await initializeSampleData();
    }

    // Start server
    app.listen(PORT, () => {
      console.log('🎉 ===============================================');
      console.log('🚀 NAMASTE-SYNC Enhanced Backend Server Started');
      console.log('🎉 ===============================================');
      console.log(`📊 Port: ${PORT}`);
      console.log(`📊 MongoDB: ${database.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
      console.log(`📍 API Base: http://localhost:${PORT}/api`);
      console.log(`📋 Health: http://localhost:${PORT}/health`);
      console.log(`📚 Docs: http://localhost:${PORT}/api/help/documentation`);
      console.log('===============================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Enhanced sample data initialization
async function initializeSampleData() {
  const sampleMappings = [
    // Ayurveda
    { namaste_code: 'AYU-001', namaste_term: 'Kasa (Cough)', category: 'Ayurveda', chapter_name: 'Respiratory System Disorders', icd11_tm2_code: 'XF78172', icd11_tm2_description: 'Traditional cough disorder', icd11_biomedicine_code: 'BB498', confidence_score: 0.95 },
    { namaste_code: 'AYU-002', namaste_term: 'Amlapitta (Hyperacidity)', category: 'Ayurveda', chapter_name: 'Digestive System Disorders', icd11_tm2_code: 'XB20847', icd11_tm2_description: 'Traditional digestive disorder', icd11_biomedicine_code: 'BB769', confidence_score: 0.92 },
    { namaste_code: 'AYU-003', namaste_term: 'Madhumeha (Diabetes)', category: 'Ayurveda', chapter_name: 'Endocrine and Metabolic Disorders', icd11_tm2_code: 'XE94567', icd11_tm2_description: 'Traditional diabetes disorder', icd11_biomedicine_code: 'BC123', confidence_score: 0.98 },
    { namaste_code: 'AYU-004', namaste_term: 'Sandhivata (Arthritis)', category: 'Ayurveda', chapter_name: 'Musculoskeletal Disorders', icd11_tm2_code: 'XF34521', icd11_tm2_description: 'Traditional joint disorder', icd11_biomedicine_code: 'BD456', confidence_score: 0.90 },
    { namaste_code: 'AYU-005', namaste_term: 'Tvak Roga (Skin Disease)', category: 'Ayurveda', chapter_name: 'Skin and Tissue Disorders', icd11_tm2_code: 'XH78901', icd11_tm2_description: 'Traditional skin disorder', icd11_biomedicine_code: 'BE789', confidence_score: 0.87 },
    
    // Siddha  
    { namaste_code: 'SID-001', namaste_term: 'Vayu Gunmam (Joint Pain)', category: 'Siddha', chapter_name: 'Musculoskeletal Disorders', icd11_tm2_code: 'XF89234', icd11_tm2_description: 'Traditional joint disorder', icd11_biomedicine_code: 'BD234', confidence_score: 0.88 },
    { namaste_code: 'SID-002', namaste_term: 'Soolai (Abdominal Pain)', category: 'Siddha', chapter_name: 'Digestive System Disorders', icd11_tm2_code: 'XB45678', icd11_tm2_description: 'Traditional abdominal disorder', icd11_biomedicine_code: 'BB567', confidence_score: 0.85 },
    { namaste_code: 'SID-003', namaste_term: 'Kumayam (Fever)', category: 'Siddha', chapter_name: 'Infectious Diseases', icd11_tm2_code: 'XI12345', icd11_tm2_description: 'Traditional fever disorder', icd11_biomedicine_code: 'BF890', confidence_score: 0.93 },
    
    // Unani
    { namaste_code: 'UNA-001', namaste_term: 'Nazla (Common Cold)', category: 'Unani', chapter_name: 'Respiratory System Disorders', icd11_tm2_code: 'XF67892', icd11_tm2_description: 'Traditional cold disorder', icd11_biomedicine_code: 'BB123', confidence_score: 0.90 },
    { namaste_code: 'UNA-002', namaste_term: 'Ziabetus (Diabetes)', category: 'Unani', chapter_name: 'Endocrine and Metabolic Disorders', icd11_tm2_code: 'XE56789', icd11_tm2_description: 'Traditional diabetes disorder', icd11_biomedicine_code: 'BC456', confidence_score: 0.96 },
    { namaste_code: 'UNA-003', namaste_term: 'Waja ul Mafasil (Joint Pain)', category: 'Unani', chapter_name: 'Musculoskeletal Disorders', icd11_tm2_code: 'XF23456', icd11_tm2_description: 'Traditional joint pain disorder', icd11_biomedicine_code: 'BD567', confidence_score: 0.89 },
    { namaste_code: 'UNA-004', namaste_term: 'Baras (Skin Disorder)', category: 'Unani', chapter_name: 'Skin and Tissue Disorders', icd11_tm2_code: 'XH34567', icd11_tm2_description: 'Traditional skin disorder', icd11_biomedicine_code: 'BE345', confidence_score: 0.84 }
  ];

  try {
    await database.insertMappings(sampleMappings);
    console.log(`✅ Initialized database with ${sampleMappings.length} sample mappings`);
  } catch (error) {
    console.error('⚠️ Failed to initialize sample data:', error.message);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server gracefully...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await database.disconnect();
  process.exit(0);
});

// Start the server
startServer();