/**
 * MongoDB Database Initialization Script
 * Sets up collections, indexes, and seeds initial data
 */

const { MongoClient } = require('mongodb');
const { MAPPINGS, AUDIT_LOGS } = require('./seed-data');
require('dotenv').config();

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'namaste-sync';

async function initializeDatabase() {
  let client;
  
  try {
    console.log('🚀 Starting MongoDB Database Initialization...\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);
    console.log(`   Database: ${DB_NAME}\n`);
    
    client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
    });
    
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!\n');
    
    const db = client.db(DB_NAME);
    
    // ============================================
    // 1. Create Collections
    // ============================================
    console.log('📦 Creating Collections...');
    
    const collections = [
      'mappings',
      'auditLogs',
      'users',
      'notifications',
      'userSessions',
      'supportTickets',
      'systemMetrics',
      'abhaProfiles',
      'icd11Links',
      'backups'
    ];
    
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`   ✓ Created collection: ${collectionName}`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`   ⚠ Collection already exists: ${collectionName}`);
        } else {
          console.log(`   ✗ Error creating collection ${collectionName}:`, error.message);
        }
      }
    }
    console.log('');
    
    // ============================================
    // 2. Create Indexes
    // ============================================
    console.log('🔍 Creating Indexes...');
    
    // Mappings collection indexes
    try {
      const mappingsCollection = db.collection('mappings');
      await mappingsCollection.createIndexes([
        { key: { namaste_code: 1 }, unique: true, name: 'idx_namaste_code' },
        { key: { namaste_term: 'text', icd11_tm2_description: 'text' }, name: 'idx_text_search' },
        { key: { category: 1 }, name: 'idx_category' },
        { key: { chapter_name: 1 }, name: 'idx_chapter' },
        { key: { confidence_score: -1 }, name: 'idx_confidence' }
      ]);
      console.log('   ✓ Mappings indexes created');
    } catch (error) {
      console.log('   ⚠ Mappings indexes:', error.message);
    }
    
    // Audit logs collection indexes
    try {
      const auditLogsCollection = db.collection('auditLogs');
      await auditLogsCollection.createIndexes([
        { key: { timestamp: -1 }, name: 'idx_timestamp' },
        { key: { userId: 1 }, name: 'idx_userId' },
        { key: { action: 1 }, name: 'idx_action' }
      ]);
      console.log('   ✓ Audit logs indexes created');
    } catch (error) {
      console.log('   ⚠ Audit logs indexes:', error.message);
    }
    
    // Users collection indexes
    try {
      const usersCollection = db.collection('users');
      await usersCollection.createIndexes([
        { key: { email: 1 }, unique: true, name: 'idx_email' },
        { key: { username: 1 }, unique: true, name: 'idx_username' },
        { key: { createdAt: -1 }, name: 'idx_created' }
      ]);
      console.log('   ✓ Users indexes created');
    } catch (error) {
      console.log('   ⚠ Users indexes:', error.message);
    }
    
    // Notifications collection indexes
    try {
      const notificationsCollection = db.collection('notifications');
      await notificationsCollection.createIndexes([
        { key: { userId: 1 }, name: 'idx_userId' },
        { key: { read: 1 }, name: 'idx_read' },
        { key: { createdAt: -1 }, name: 'idx_created' },
        { key: { priority: -1 }, name: 'idx_priority' }
      ]);
      console.log('   ✓ Notifications indexes created');
    } catch (error) {
      console.log('   ⚠ Notifications indexes:', error.message);
    }
    
    // User sessions collection indexes
    try {
      const userSessionsCollection = db.collection('userSessions');
      await userSessionsCollection.createIndexes([
        { key: { userId: 1 }, name: 'idx_userId' },
        { key: { sessionId: 1 }, unique: true, name: 'idx_sessionId' },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0, name: 'idx_ttl' }
      ]);
      console.log('   ✓ User sessions indexes created');
    } catch (error) {
      console.log('   ⚠ User sessions indexes:', error.message);
    }
    
    // Support tickets collection indexes
    try {
      const supportTicketsCollection = db.collection('supportTickets');
      await supportTicketsCollection.createIndexes([
        { key: { userId: 1 }, name: 'idx_userId' },
        { key: { status: 1 }, name: 'idx_status' },
        { key: { priority: -1 }, name: 'idx_priority' },
        { key: { createdAt: -1 }, name: 'idx_created' }
      ]);
      console.log('   ✓ Support tickets indexes created');
    } catch (error) {
      console.log('   ⚠ Support tickets indexes:', error.message);
    }
    
    // System metrics collection indexes
    try {
      const systemMetricsCollection = db.collection('systemMetrics');
      await systemMetricsCollection.createIndexes([
        { key: { timestamp: -1 }, name: 'idx_timestamp' },
        { key: { metricType: 1 }, name: 'idx_metricType' }
      ]);
      console.log('   ✓ System metrics indexes created');
    } catch (error) {
      console.log('   ⚠ System metrics indexes:', error.message);
    }
    
    // ABHA profiles collection indexes
    try {
      const abhaProfilesCollection = db.collection('abhaProfiles');
      await abhaProfilesCollection.createIndexes([
        { key: { userId: 1 }, unique: true, name: 'idx_userId' },
        { key: { abhaAddress: 1 }, unique: true, name: 'idx_abhaAddress' },
        { key: { healthIdNumber: 1 }, name: 'idx_healthId' }
      ]);
      console.log('   ✓ ABHA profiles indexes created');
    } catch (error) {
      console.log('   ⚠ ABHA profiles indexes:', error.message);
    }
    
    // ICD-11 links collection indexes
    try {
      const icd11LinksCollection = db.collection('icd11Links');
      await icd11LinksCollection.createIndexes([
        { key: { namasteCode: 1 }, unique: true, name: 'idx_namasteCode' },
        { key: { icd11Uri: 1 }, name: 'idx_icd11Uri' }
      ]);
      console.log('   ✓ ICD-11 links indexes created');
    } catch (error) {
      console.log('   ⚠ ICD-11 links indexes:', error.message);
    }
    
    console.log('');
    
    // ============================================
    // 3. Seed Initial Data
    // ============================================
    console.log('🌱 Seeding Initial Data...');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('   🗑️  Clearing existing data...');
    await db.collection('mappings').deleteMany({});
    await db.collection('auditLogs').deleteMany({});
    console.log('   ✓ Existing data cleared\n');
    
    // Insert mappings
    console.log('   📝 Inserting mappings...');
    try {
      const mappingsResult = await db.collection('mappings').insertMany(MAPPINGS);
      console.log(`   ✅ Inserted ${mappingsResult.insertedCount} mappings`);
      
      // Show breakdown by category
      const categories = {};
      MAPPINGS.forEach(m => {
        categories[m.category] = (categories[m.category] || 0) + 1;
      });
      console.log('   📊 Breakdown by category:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`      - ${cat}: ${count} mappings`);
      });
    } catch (error) {
      console.log('   ✗ Error inserting mappings:', error.message);
    }
    console.log('');
    
    // Insert audit logs
    console.log('   📋 Inserting audit logs...');
    try {
      const auditResult = await db.collection('auditLogs').insertMany(AUDIT_LOGS);
      console.log(`   ✅ Inserted ${auditResult.insertedCount} audit log entries`);
    } catch (error) {
      console.log('   ✗ Error inserting audit logs:', error.message);
    }
    console.log('');
    
    // ============================================
    // 4. Verification
    // ============================================
    console.log('🔍 Verifying Database Setup...');
    
    const mappingsCount = await db.collection('mappings').countDocuments();
    const auditLogsCount = await db.collection('auditLogs').countDocuments();
    const collectionsCount = (await db.listCollections().toArray()).length;
    
    console.log(`   ✓ Total collections: ${collectionsCount}`);
    console.log(`   ✓ Mappings count: ${mappingsCount}`);
    console.log(`   ✓ Audit logs count: ${auditLogsCount}`);
    console.log('');
    
    // Get some sample data
    console.log('📄 Sample Data:');
    const sampleMapping = await db.collection('mappings').findOne();
    if (sampleMapping) {
      console.log('   Sample Mapping:');
      console.log(`      Code: ${sampleMapping.namaste_code}`);
      console.log(`      Term: ${sampleMapping.namaste_term}`);
      console.log(`      Category: ${sampleMapping.category}`);
      console.log(`      Confidence: ${sampleMapping.confidence_score}`);
    }
    console.log('');
    
    // ============================================
    // 5. Summary
    // ============================================
    console.log('═══════════════════════════════════════════════════');
    console.log('✨ Database Initialization Complete!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`📦 Collections: ${collectionsCount}`);
    console.log(`📝 Mappings: ${mappingsCount}`);
    console.log(`📋 Audit Logs: ${auditLogsCount}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('🎉 You can now start the backend server!');
    console.log('   Run: npm run backend:dev');
    console.log('');
    console.log('🔍 To view your data:');
    console.log('   - MongoDB Compass: mongodb://localhost:27017');
    console.log('   - Database: namaste-sync');
    console.log('');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('👋 Disconnected from MongoDB');
    }
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };
