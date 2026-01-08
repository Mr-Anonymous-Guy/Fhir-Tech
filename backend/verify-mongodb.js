/**
 * MongoDB Database Verification Script
 * Tests database connection and queries
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'namaste-sync';

async function verifyDatabase() {
    let client;

    try {
        console.log('🔍 MongoDB Database Verification\n');

        // Connect
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(DB_NAME);

        // Test 1: List all collections
        console.log('📦 Collections:');
        const collections = await db.listCollections().toArray();
        collections.forEach(col => console.log(`   - ${col.name}`));
        console.log('');

        // Test 2: Count documents
        console.log('📊 Document Counts:');
        const mappingsCount = await db.collection('mappings').countDocuments();
        const auditLogsCount = await db.collection('auditLogs').countDocuments();
        console.log(`   - Mappings: ${mappingsCount}`);
        console.log(`   - Audit Logs: ${auditLogsCount}`);
        console.log('');

        // Test 3: Sample queries
        console.log('🔎 Sample Queries:\n');

        // Query by category
        console.log('   1. Ayurveda mappings:');
        const ayurvedaMappings = await db.collection('mappings')
            .find({ category: 'Ayurveda' })
            .limit(3)
            .toArray();
        ayurvedaMappings.forEach(m => {
            console.log(`      - ${m.namaste_code}: ${m.namaste_term}`);
        });
        console.log('');

        // Search query
        console.log('   2. Search for "diabetes":');
        const diabetesResults = await db.collection('mappings')
            .find({ namaste_term: /diabetes/i })
            .toArray();
        diabetesResults.forEach(m => {
            console.log(`      - ${m.namaste_code}: ${m.namaste_term} (Confidence: ${m.confidence_score})`);
        });
        console.log('');

        // High confidence mappings
        console.log('   3. High confidence mappings (>= 0.95):');
        const highConfidence = await db.collection('mappings')
            .find({ confidence_score: { $gte: 0.95 } })
            .toArray();
        highConfidence.forEach(m => {
            console.log(`      - ${m.namaste_code}: ${m.namaste_term} (${m.confidence_score})`);
        });
        console.log('');

        // Test 4: Aggregation
        console.log('📈 Statistics by Category:');
        const stats = await db.collection('mappings').aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgConfidence: { $avg: '$confidence_score' }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        stats.forEach(stat => {
            console.log(`   - ${stat._id}: ${stat.count} mappings (Avg confidence: ${stat.avgConfidence.toFixed(2)})`);
        });
        console.log('');

        // Test 5: Audit logs
        console.log('📋 Recent Audit Logs:');
        const recentLogs = await db.collection('auditLogs')
            .find()
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();
        recentLogs.forEach(log => {
            console.log(`   - ${log.action}: "${log.query}" (${log.resultCount} results)`);
        });
        console.log('');

        // Test 6: Indexes
        console.log('🔍 Indexes on mappings collection:');
        const indexes = await db.collection('mappings').indexes();
        indexes.forEach(idx => {
            console.log(`   - ${idx.name}`);
        });
        console.log('');

        console.log('═══════════════════════════════════════════════════');
        console.log('✅ All Verification Tests Passed!');
        console.log('═══════════════════════════════════════════════════');
        console.log('Your MongoDB database is ready to use! 🎉');
        console.log('');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('👋 Disconnected from MongoDB');
        }
    }
}

if (require.main === module) {
    verifyDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { verifyDatabase };
