/**
 * MongoDB Database Service
 * Handles all database operations for NAMASTE-SYNC
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Try to start local MongoDB instance first (with data folder)
      let uri = null;
      let useLocalStorage = false;

      // In Vercel or production environments, ALWAYS use the configured URI
      const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
      const isProd = process.env.NODE_ENV === 'production' || process.env.VITE_APP_ENV === 'production';

      if (isVercel || isProd) {
        uri = process.env.MONGODB_URI;
        if (!uri) {
          console.error('❌ MONGODB_URI environment variable is missing in production!');
          // Fallback to avoid complete crash during build
          this.isConnected = false;
          this.useLocalStorage = true;
          return null;
        }
        console.log('🔌 Using Production MongoDB URI');
      } else {
        // Local development logic
        try {
          console.log(' Attempting to start local MongoDB instance...');
          const { startLocalMongoDB } = require('./mongodb-local');
          const result = await startLocalMongoDB();

          if (result.success && result.uri) {
            uri = result.uri;
            console.log('✅ Using local MongoDB instance');
          } else {
            useLocalStorage = true;
          }
        } catch (localError) {
          console.log('⚠️ Could not start local MongoDB:', localError.message);
          useLocalStorage = true;
        }
      }

      // If we should use local storage, mark it and continue without MongoDB
      if (useLocalStorage) {
        this.isConnected = false;
        this.useLocalStorage = true;
        console.log('✅ File-based local storage ready (local-data/users.json)');
        return null; // Signal that we're using local storage
      }

      const dbName = process.env.MONGODB_DB_NAME || 'namaste-sync';

      this.client = new MongoClient(uri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`✅ Connected to MongoDB: ${dbName}`);

      // Create indexes
      await this.createIndexes();

      return this.db;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    try {
      const mappingsCollection = this.db.collection('mappings');
      const auditLogsCollection = this.db.collection('auditLogs');
      const notificationsCollection = this.db.collection('notifications');
      const userSessionsCollection = this.db.collection('userSessions');
      const supportTicketsCollection = this.db.collection('supportTickets');
      const systemMetricsCollection = this.db.collection('systemMetrics');
      const usersCollection = this.db.collection('users');

      // Create indexes for mappings collection
      try {
        await mappingsCollection.createIndexes([
          { key: { namaste_code: 1 }, unique: true },
          { key: { namaste_term: 'text', icd11_tm2_description: 'text' } },
          { key: { category: 1 } },
          { key: { chapter_name: 1 } },
          { key: { confidence_score: -1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create mappings indexes:', err.message);
      }

      // Create indexes for audit logs collection
      try {
        await auditLogsCollection.createIndexes([
          { key: { timestamp: -1 } },
          { key: { userId: 1 } },
          { key: { action: 1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create audit logs indexes:', err.message);
      }

      // Create indexes for notifications collection
      try {
        await notificationsCollection.createIndexes([
          { key: { userId: 1 } },
          { key: { read: 1 } },
          { key: { createdAt: -1 } },
          { key: { priority: -1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create notifications indexes:', err.message);
      }

      // Create indexes for user sessions collection
      try {
        await userSessionsCollection.createIndexes([
          { key: { userId: 1 } },
          { key: { sessionId: 1 }, unique: true },
          { key: { expiresAt: 1 }, expireAfterSeconds: 0 }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create user sessions indexes:', err.message);
      }

      // Create indexes for support tickets collection
      try {
        await supportTicketsCollection.createIndexes([
          { key: { userId: 1 } },
          { key: { status: 1 } },
          { key: { priority: -1 } },
          { key: { createdAt: -1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create support tickets indexes:', err.message);
      }

      // Create indexes for system metrics collection
      try {
        await systemMetricsCollection.createIndexes([
          { key: { timestamp: -1 } },
          { key: { metricType: 1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create system metrics indexes:', err.message);
      }

      // Create indexes for users collection
      try {
        await usersCollection.createIndexes([
          { key: { email: 1 }, unique: true },
          { key: { username: 1 }, unique: true },
          { key: { createdAt: -1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create users indexes:', err.message);
      }

      // Create indexes for ABHA profiles collection
      try {
        const abhaProfilesCollection = this.db.collection('abhaProfiles');
        await abhaProfilesCollection.createIndexes([
          { key: { userId: 1 }, unique: true },
          { key: { abhaAddress: 1 }, unique: true },
          { key: { healthIdNumber: 1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create ABHA profiles indexes:', err.message);
      }

      // Create indexes for ICD-11 links collection
      try {
        const icd11LinksCollection = this.db.collection('icd11Links');
        await icd11LinksCollection.createIndexes([
          { key: { namasteCode: 1 }, unique: true },
          { key: { icd11Uri: 1 } }
        ]);
      } catch (err) {
        console.warn('⚠️ Warning: Could not create ICD-11 links indexes:', err.message);
      }

      console.log('✅ Database index creation attempted');
    } catch (error) {
      console.warn('⚠️ Warning: Database index creation failed:', error.message);
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✅ Disconnected from MongoDB');
    }
  }

  // Mappings operations
  async insertMappings(mappings) {
    const collection = this.db.collection('mappings');
    const result = await collection.insertMany(mappings, { ordered: false });
    return result;
  }

  async searchMappings(query = '', filters = {}, page = 1, limit = 20) {
    const collection = this.db.collection('mappings');

    // Build MongoDB query
    const mongoQuery = {};

    // Text search
    if (query) {
      mongoQuery.$or = [
        { namaste_term: { $regex: query, $options: 'i' } },
        { namaste_code: { $regex: query, $options: 'i' } },
        { icd11_tm2_description: { $regex: query, $options: 'i' } }
      ];
    }

    // Filters
    if (filters.category) mongoQuery.category = filters.category;
    if (filters.chapter) mongoQuery.chapter_name = filters.chapter;
    if (filters.minConfidence) mongoQuery.confidence_score = { $gte: filters.minConfidence };
    if (filters.maxConfidence) {
      mongoQuery.confidence_score = {
        ...mongoQuery.confidence_score,
        $lte: filters.maxConfidence
      };
    }

    // Count total results
    const total = await collection.countDocuments(mongoQuery);

    // Get paginated results
    const skip = (page - 1) * limit;
    const mappings = await collection
      .find(mongoQuery)
      .sort({ confidence_score: -1, namaste_code: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { mappings, total, page, limit };
  }

  async getMappingByCode(code) {
    const collection = this.db.collection('mappings');
    return await collection.findOne({ namaste_code: code });
  }

  async getMappingStats() {
    const collection = this.db.collection('mappings');

    try {
      const stats = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalMappings: { $sum: 1 },
            avgConfidenceScore: { $avg: '$confidence_score' }
          }
        }
      ]).toArray();

      return stats[0] || { totalMappings: 0, avgConfidenceScore: 0 };
    } catch (error) {
      console.warn('Warning: Could not get mapping stats:', error.message);
      // Return default stats if aggregation fails
      const count = await collection.countDocuments({});
      return { totalMappings: count, avgConfidenceScore: 0 };
    }
  }

  async getCategories() {
    const collection = this.db.collection('mappings');
    return await collection.distinct('category');
  }

  async getChapters() {
    const collection = this.db.collection('mappings');
    return await collection.distinct('chapter_name');
  }

  async clearMappings() {
    const collection = this.db.collection('mappings');
    return await collection.deleteMany({});
  }

  // Audit log operations
  async insertAuditEntry(entry) {
    const collection = this.db.collection('auditLogs');
    const auditEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      _id: entry.id ? new ObjectId(entry.id) : new ObjectId()
    };
    return await collection.insertOne(auditEntry);
  }

  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const collection = this.db.collection('auditLogs');

    // Build query
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.userId) query.userId = filters.userId;
    if (filters.success !== undefined) query.success = filters.success;
    if (filters.startDate) query.timestamp = { $gte: filters.startDate };
    if (filters.endDate) {
      query.timestamp = { ...query.timestamp, $lte: filters.endDate };
    }

    const total = await collection.countDocuments(query);
    const skip = (page - 1) * limit;

    const entries = await collection
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { entries, total, page, limit };
  }

  async clearAuditLogs() {
    const collection = this.db.collection('auditLogs');
    return await collection.deleteMany({});
  }

  // User Sessions Management
  async createUserSession(sessionData) {
    const collection = this.db.collection('userSessions');
    const session = {
      sessionId: sessionData.sessionId || new ObjectId().toString(),
      userId: sessionData.userId,
      userAgent: sessionData.userAgent,
      ipAddress: sessionData.ipAddress,
      location: sessionData.location || 'Unknown',
      device: sessionData.device || 'Unknown',
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      active: true
    };
    return await collection.insertOne(session);
  }

  async getUserSessions(userId) {
    const collection = this.db.collection('userSessions');
    return await collection.find({
      userId,
      active: true,
      expiresAt: { $gt: new Date() }
    }).sort({ lastActivity: -1 }).toArray();
  }

  async updateSessionActivity(sessionId) {
    const collection = this.db.collection('userSessions');
    return await collection.updateOne(
      { sessionId },
      { $set: { lastActivity: new Date() } }
    );
  }

  async terminateSession(sessionId) {
    const collection = this.db.collection('userSessions');
    return await collection.updateOne(
      { sessionId },
      { $set: { active: false, terminatedAt: new Date() } }
    );
  }

  // Notifications Management
  async createNotification(notificationData) {
    const collection = this.db.collection('notifications');
    const notification = {
      _id: new ObjectId(),
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info', // info, success, warning, error
      priority: notificationData.priority || 'medium', // low, medium, high, critical
      read: false,
      createdAt: new Date(),
      data: notificationData.data || {}
    };
    return await collection.insertOne(notification);
  }

  async getNotifications(filters = {}, page = 1, limit = 20) {
    const collection = this.db.collection('notifications');

    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.read !== undefined) query.read = filters.read;
    if (filters.type) query.type = filters.type;
    if (filters.priority) query.priority = filters.priority;

    const total = await collection.countDocuments(query);
    const skip = (page - 1) * limit;

    const notifications = await collection
      .find(query)
      .sort({ createdAt: -1, priority: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { notifications, total, page, limit };
  }

  async markNotificationRead(notificationId, read = true) {
    const collection = this.db.collection('notifications');
    return await collection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { read, readAt: read ? new Date() : null } }
    );
  }

  async getUnreadNotificationCount(userId) {
    const collection = this.db.collection('notifications');
    return await collection.countDocuments({ userId, read: false });
  }

  // Data Export and Management
  async exportUserData(userId, format = 'json') {
    try {
      const mappingsCollection = this.db.collection('mappings');
      const auditLogsCollection = this.db.collection('auditLogs');
      const notificationsCollection = this.db.collection('notifications');

      const [mappings, auditLogs, notifications] = await Promise.all([
        mappingsCollection.find({}).toArray(),
        auditLogsCollection.find({ userId }).toArray(),
        notificationsCollection.find({ userId }).toArray()
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        userId,
        data: {
          mappings: mappings.length,
          auditLogs,
          notifications
        }
      };

      if (format === 'csv') {
        // Convert to CSV format for audit logs
        const csvHeader = 'timestamp,action,query,success,duration\n';
        const csvData = auditLogs.map(log =>
          `${log.timestamp},${log.action},"${log.query || ''}",${log.success},${log.duration}`
        ).join('\n');
        return csvHeader + csvData;
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Export user data error:', error);
      throw error;
    }
  }

  async createBackup(userId) {
    const backupData = await this.exportUserData(userId, 'json');
    const backup = {
      _id: new ObjectId(),
      userId,
      createdAt: new Date(),
      size: Buffer.byteLength(backupData, 'utf8'),
      status: 'completed'
    };

    const collection = this.db.collection('backups');
    await collection.insertOne(backup);
    return backup;
  }

  async getUserDataStats(userId) {
    try {
      const [mappingCount, auditCount, notificationCount, unreadNotifications] = await Promise.all([
        this.db.collection('mappings').countDocuments({}),
        this.db.collection('auditLogs').countDocuments({ userId }),
        this.db.collection('notifications').countDocuments({ userId }),
        this.getUnreadNotificationCount(userId)
      ]);

      return {
        totalMappings: mappingCount,
        auditLogs: auditCount,
        notifications: notificationCount,
        unreadNotifications,
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get user data stats error:', error);
      throw error;
    }
  }

  // Support Tickets Management
  async createSupportTicket(ticketData) {
    const collection = this.db.collection('supportTickets');
    const ticket = {
      _id: new ObjectId(),
      ticketId: `TICKET-${Date.now()}`,
      userId: ticketData.userId,
      userName: ticketData.userName || 'Anonymous',
      email: ticketData.email,
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || 'general', // general, technical, billing, feature
      priority: ticketData.priority || 'medium',
      status: 'open', // open, in_progress, resolved, closed
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: []
    };
    return await collection.insertOne(ticket);
  }

  async getSupportTickets(filters = {}, page = 1, limit = 10) {
    const collection = this.db.collection('supportTickets');

    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;

    const total = await collection.countDocuments(query);
    const skip = (page - 1) * limit;

    const tickets = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return { tickets, total, page, limit };
  }

  // System Statistics
  async getSystemStats() {
    try {
      const [mappingStats, auditStats, userStats] = await Promise.all([
        this.getMappingStats(),
        this.db.collection('auditLogs').countDocuments({}),
        this.db.collection('userSessions').countDocuments({ active: true })
      ]);

      return {
        mappings: mappingStats,
        totalAuditEntries: auditStats,
        activeUsers: userStats,
        systemHealth: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get system stats error:', error);
      throw error;
    }
  }

  async logSystemMetric(metricType, value, metadata = {}) {
    const collection = this.db.collection('systemMetrics');
    const metric = {
      _id: new ObjectId(),
      metricType,
      value,
      metadata,
      timestamp: new Date()
    };
    return await collection.insertOne(metric);
  }

  // ============================================
  // Integration: ABHA & ICD-11 Operations
  // ============================================

  // ABHA Profiles
  async createAbhaProfile(profileData) {
    const collection = this.db.collection('abhaProfiles');
    const profile = {
      _id: new ObjectId(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Upsert based on userId to prevent duplicates
    return await collection.updateOne(
      { userId: profileData.userId },
      { $set: profile },
      { upsert: true }
    );
  }

  async getAbhaProfileByUserId(userId) {
    const collection = this.db.collection('abhaProfiles');
    return await collection.findOne({ userId });
  }

  // ICD-11 Links
  async createIcdLink(namasteCode, icd11Data) {
    const collection = this.db.collection('icd11Links');
    const link = {
      namasteCode,
      icd11Uri: icd11Data.uri,
      icd11Code: icd11Data.code,
      icd11Title: icd11Data.title,
      linkedAt: new Date(),
      metadata: icd11Data.metadata || {}
    };

    return await collection.updateOne(
      { namasteCode },
      { $set: link },
      { upsert: true }
    );
  }

  async getIcdLink(namasteCode) {
    const collection = this.db.collection('icd11Links');
    return await collection.findOne({ namasteCode });
  }
}

module.exports = new DatabaseService();