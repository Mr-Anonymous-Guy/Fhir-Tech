/**
 * NAMASTE-SYNC Enhanced MongoDB Database Service
 * Provides comprehensive database operations with security, notifications, and data management
 */

const { MongoClient, ObjectId } = require('mongodb');

class DatabaseService {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    
    // Connection configuration
    this.url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
    this.dbName = process.env.DATABASE_NAME || 'namaste-sync';
    
    // Collection names
    this.collections = {
      mappings: 'mappings',
      auditLogs: 'auditLogs',
      notifications: 'notifications',
      userSessions: 'userSessions',
      systemMetrics: 'systemMetrics'
    };
  }

  // =============================================================================
  // CONNECTION MANAGEMENT
  // =============================================================================

  async connect() {
    try {
      console.log('📡 Connecting to MongoDB...');
      this.client = new MongoClient(this.url, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;

      // Create indexes for optimal performance
      await this.createIndexes();

      console.log(`✅ Connected to MongoDB: ${this.dbName}`);
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('📴 Disconnected from MongoDB');
      }
    } catch (error) {
      console.error('⚠️ Error disconnecting from MongoDB:', error.message);
    }
  }

  async createIndexes() {
    try {
      const mappings = this.db.collection(this.collections.mappings);
      const auditLogs = this.db.collection(this.collections.auditLogs);
      const notifications = this.db.collection(this.collections.notifications);

      // Mappings indexes
      await Promise.all([
        mappings.createIndex({ namaste_code: 1 }, { unique: true }),
        mappings.createIndex({ category: 1, chapter_name: 1 }),
        mappings.createIndex({ namaste_term: "text", icd11_tm2_description: "text" }),
        mappings.createIndex({ confidence_score: -1 }),
        mappings.createIndex({ created_at: -1 }),
        
        // Audit logs indexes
        auditLogs.createIndex({ timestamp: -1 }),
        auditLogs.createIndex({ userId: 1, action: 1 }),
        auditLogs.createIndex({ success: 1 }),
        auditLogs.createIndex({ action: 1, timestamp: -1 }),
        
        // Notifications indexes
        notifications.createIndex({ userId: 1, read: 1 }),
        notifications.createIndex({ created_at: -1 }),
        notifications.createIndex({ priority: 1, read: 1 })
      ]);

      console.log('📊 Database indexes created successfully');
    } catch (error) {
      console.error('⚠️ Error creating indexes:', error.message);
    }
  }

  // =============================================================================
  // MAPPINGS OPERATIONS
  // =============================================================================

  async searchMappings(query = '', filters = {}, page = 1, limit = 20) {
    try {
      const collection = this.db.collection(this.collections.mappings);
      const skip = (page - 1) * limit;

      // Build MongoDB query
      const mongoQuery = {};
      
      // Text search
      if (query.trim()) {
        mongoQuery.$or = [
          { namaste_term: { $regex: query, $options: 'i' } },
          { namaste_code: { $regex: query, $options: 'i' } },
          { icd11_tm2_description: { $regex: query, $options: 'i' } },
          { icd11_biomedicine_code: { $regex: query, $options: 'i' } },
          { chapter_name: { $regex: query, $options: 'i' } }
        ];
      }

      // Filters
      if (filters.category) mongoQuery.category = filters.category;
      if (filters.chapter) mongoQuery.chapter_name = filters.chapter;
      if (filters.minConfidence || filters.maxConfidence) {
        mongoQuery.confidence_score = {};
        if (filters.minConfidence) mongoQuery.confidence_score.$gte = filters.minConfidence;
        if (filters.maxConfidence) mongoQuery.confidence_score.$lte = filters.maxConfidence;
      }

      const [mappings, total] = await Promise.all([
        collection.find(mongoQuery)
          .sort({ confidence_score: -1, namaste_code: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(mongoQuery)
      ]);

      return {
        mappings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query,
        filters
      };
    } catch (error) {
      console.error('❌ Search mappings error:', error);
      throw error;
    }
  }

  async getMappingByCode(code) {
    try {
      const collection = this.db.collection(this.collections.mappings);
      return await collection.findOne({ namaste_code: code });
    } catch (error) {
      console.error('❌ Get mapping by code error:', error);
      throw error;
    }
  }

  async insertMappings(mappings) {
    try {
      const collection = this.db.collection(this.collections.mappings);
      const timestamp = new Date().toISOString();
      
      // Add metadata to each mapping
      const mappingsWithMetadata = mappings.map(mapping => ({
        ...mapping,
        created_at: timestamp,
        updated_at: timestamp
      }));

      const result = await collection.insertMany(mappingsWithMetadata, { ordered: false });
      
      // Create system notification for bulk upload
      if (mappings.length > 100) {
        await this.createNotification({
          title: 'Bulk Data Upload Completed',
          message: `Successfully uploaded ${mappings.length} new mappings to the database`,
          type: 'success',
          priority: 'medium',
          userId: 'system'
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Insert mappings error:', error);
      throw error;
    }
  }

  async clearMappings() {
    try {
      const collection = this.db.collection(this.collections.mappings);
      return await collection.deleteMany({});
    } catch (error) {
      console.error('❌ Clear mappings error:', error);
      throw error;
    }
  }

  async getMappingStats() {
    try {
      const collection = this.db.collection(this.collections.mappings);
      
      const stats = await collection.aggregate([
        {
          $group: {
            _id: null,
            totalMappings: { $sum: 1 },
            avgConfidenceScore: { $avg: '$confidence_score' },
            categories: { $addToSet: '$category' },
            chapters: { $addToSet: '$chapter_name' }
          }
        }
      ]).toArray();

      if (stats.length === 0) {
        return {
          totalMappings: 0,
          avgConfidenceScore: 0,
          categoriesCount: 0,
          chaptersCount: 0
        };
      }

      const stat = stats[0];
      return {
        totalMappings: stat.totalMappings,
        avgConfidenceScore: Math.round(stat.avgConfidenceScore * 100) / 100,
        categoriesCount: stat.categories.length,
        chaptersCount: stat.chapters.length
      };
    } catch (error) {
      console.error('❌ Get mapping stats error:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const collection = this.db.collection(this.collections.mappings);
      return await collection.distinct('category');
    } catch (error) {
      console.error('❌ Get categories error:', error);
      throw error;
    }
  }

  async getChapters() {
    try {
      const collection = this.db.collection(this.collections.mappings);
      return await collection.distinct('chapter_name');
    } catch (error) {
      console.error('❌ Get chapters error:', error);
      throw error;
    }
  }

  // =============================================================================
  // AUDIT LOG OPERATIONS
  // =============================================================================

  async insertAuditEntry(entry) {
    try {
      const collection = this.db.collection(this.collections.auditLogs);
      const auditEntry = {
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
        _id: new ObjectId()
      };
      
      return await collection.insertOne(auditEntry);
    } catch (error) {
      console.error('❌ Insert audit entry error:', error);
      throw error;
    }
  }

  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const collection = this.db.collection(this.collections.auditLogs);
      const skip = (page - 1) * limit;

      const mongoQuery = {};
      if (filters.action) mongoQuery.action = filters.action;
      if (filters.userId) mongoQuery.userId = filters.userId;
      if (filters.success !== undefined) mongoQuery.success = filters.success;
      if (filters.startDate || filters.endDate) {
        mongoQuery.timestamp = {};
        if (filters.startDate) mongoQuery.timestamp.$gte = filters.startDate;
        if (filters.endDate) mongoQuery.timestamp.$lte = filters.endDate;
      }

      const [entries, total] = await Promise.all([
        collection.find(mongoQuery)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(mongoQuery)
      ]);

      return {
        entries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Get audit logs error:', error);
      throw error;
    }
  }

  async getAuditLogCount() {
    try {
      const collection = this.db.collection(this.collections.auditLogs);
      return await collection.countDocuments();
    } catch (error) {
      console.error('❌ Get audit log count error:', error);
      throw error;
    }
  }

  async getSecurityActivitySummary() {
    try {
      const collection = this.db.collection(this.collections.auditLogs);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const summary = await collection.aggregate([
        {
          $facet: {
            last24Hours: [
              { $match: { timestamp: { $gte: oneDayAgo } } },
              { 
                $group: {
                  _id: '$action',
                  count: { $sum: 1 },
                  successCount: { $sum: { $cond: ['$success', 1, 0] } },
                  failureCount: { $sum: { $cond: ['$success', 0, 1] } }
                }
              }
            ],
            lastWeek: [
              { $match: { timestamp: { $gte: oneWeekAgo } } },
              { 
                $group: {
                  _id: '$userId',
                  count: { $sum: 1 },
                  actions: { $addToSet: '$action' }
                }
              }
            ],
            topActions: [
              { $match: { timestamp: { $gte: oneWeekAgo } } },
              {
                $group: {
                  _id: '$action',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]).toArray();

      return summary[0];
    } catch (error) {
      console.error('❌ Get security activity summary error:', error);
      throw error;
    }
  }

  // =============================================================================
  // NOTIFICATIONS OPERATIONS
  // =============================================================================

  async createNotification(notification) {
    try {
      const collection = this.db.collection(this.collections.notifications);
      const notificationDoc = {
        ...notification,
        _id: new ObjectId(),
        created_at: new Date().toISOString(),
        read: false
      };
      
      return await collection.insertOne(notificationDoc);
    } catch (error) {
      console.error('❌ Create notification error:', error);
      throw error;
    }
  }

  async getNotifications(userId = 'system', page = 1, limit = 20) {
    try {
      const collection = this.db.collection(this.collections.notifications);
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        collection.find({ userId })
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({ userId })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('❌ Get notifications error:', error);
      throw error;
    }
  }

  async markNotificationsAsRead(notificationIds) {
    try {
      const collection = this.db.collection(this.collections.notifications);
      const objectIds = notificationIds.map(id => new ObjectId(id));
      
      return await collection.updateMany(
        { _id: { $in: objectIds } },
        { $set: { read: true, read_at: new Date().toISOString() } }
      );
    } catch (error) {
      console.error('❌ Mark notifications as read error:', error);
      throw error;
    }
  }

  // =============================================================================
  // SYSTEM METRICS OPERATIONS
  // =============================================================================

  async recordSystemMetrics() {
    try {
      const collection = this.db.collection(this.collections.systemMetrics);
      
      const metrics = {
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        
        // Database metrics
        mappingsCount: await this.db.collection(this.collections.mappings).countDocuments(),
        auditLogsCount: await this.db.collection(this.collections.auditLogs).countDocuments(),
        notificationsCount: await this.db.collection(this.collections.notifications).countDocuments()
      };

      return await collection.insertOne(metrics);
    } catch (error) {
      console.error('❌ Record system metrics error:', error);
      throw error;
    }
  }

  async getSystemMetrics(hours = 24) {
    try {
      const collection = this.db.collection(this.collections.systemMetrics);
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      return await collection.find({ timestamp: { $gte: cutoffTime } })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (error) {
      console.error('❌ Get system metrics error:', error);
      throw error;
    }
  }

  // =============================================================================
  // DATA MANAGEMENT OPERATIONS
  // =============================================================================

  async exportData(filters = {}) {
    try {
      const mappings = await this.searchMappings('', filters, 1, 100000);
      const auditLogs = await this.getAuditLogs({}, 1, 100000);
      
      return {
        export_metadata: {
          timestamp: new Date().toISOString(),
          total_mappings: mappings.total,
          total_audit_logs: auditLogs.total,
          filters_applied: filters
        },
        data: {
          mappings: mappings.mappings,
          audit_logs: auditLogs.entries
        }
      };
    } catch (error) {
      console.error('❌ Export data error:', error);
      throw error;
    }
  }

  async importData(data) {
    try {
      const results = {};
      
      if (data.mappings && data.mappings.length > 0) {
        results.mappings = await this.insertMappings(data.mappings);
      }
      
      if (data.audit_logs && data.audit_logs.length > 0) {
        const collection = this.db.collection(this.collections.auditLogs);
        results.auditLogs = await collection.insertMany(data.audit_logs);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Import data error:', error);
      throw error;
    }
  }

  async getDatabaseHealth() {
    try {
      const stats = await this.db.stats();
      
      return {
        connected: this.isConnected,
        database_name: this.dbName,
        collections_count: stats.collections,
        data_size: stats.dataSize,
        storage_size: stats.storageSize,
        indexes_count: stats.indexes,
        objects_count: stats.objects,
        avg_obj_size: stats.avgObjSize
      };
    } catch (error) {
      console.error('❌ Get database health error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;