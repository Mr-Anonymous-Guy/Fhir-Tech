# MongoDB Setup and Migration Guide

This guide covers the complete setup of MongoDB for the NAMASTE-SYNC project, including installation, configuration, and migration from the previous in-memory storage system.

## Prerequisites

- Windows 10/11 (for winget installation)
- Administrative privileges for service installation
- Node.js 16+ installed
- Git for repository cloning

## MongoDB Installation

### Option 1: Using winget (Recommended)

```powershell
# Install MongoDB Community Server
winget install MongoDB.Server

# Install MongoDB Compass (GUI tool)
winget install MongoDB.Compass.Full

# Install MongoDB Shell
winget install MongoDB.Shell
```

### Option 2: Manual Installation

1. Download MongoDB Community Server from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Run the installer with default settings
3. MongoDB service will start automatically

## Verify Installation

```powershell
# Check MongoDB service status
Get-Service MongoDB

# Test connection with MongoDB Shell
mongosh

# In mongosh, test basic commands:
show dbs
use namaste-sync
db.test.insertOne({message: "Hello MongoDB"})
db.test.find()
```

## Project Configuration

### 1. Environment Setup

The project is already configured with MongoDB support. Verify your `.env` file contains:

```env
# MongoDB Configuration
VITE_MONGODB_URI=mongodb://localhost:27017/namaste-sync
VITE_MONGODB_DB_NAME=namaste-sync

# Supabase Configuration (for authentication)
VITE_SUPABASE_PROJECT_ID=ytstlikzmgpynffuvsmw
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://ytstlikzmgpynffuvsmw.supabase.co
```

### 2. Install Dependencies

```bash
npm install
```

The project includes MongoDB dependencies:
- `mongodb`: Official MongoDB Node.js driver
- Database service layer for abstractions
- TypeScript interfaces for type safety

## Database Architecture

### Collections Structure

#### 1. Mappings Collection
```javascript
{
  _id: ObjectId,
  namaste_code: String (unique, indexed),
  namaste_term: String (text-indexed),
  category: String (indexed: "Ayurveda" | "Siddha" | "Unani"),
  chapter_name: String (indexed),
  icd11_tm2_code: String,
  icd11_tm2_description: String (text-indexed),
  icd11_biomedicine_code: String,
  confidence_score: Number (indexed),
  created_at: Date,
  updated_at: Date
}
```

#### 2. Audit Logs Collection
```javascript
{
  _id: ObjectId,
  timestamp: Date (indexed),
  userId: String (indexed),
  action: String (indexed),
  query: String,
  results_count: Number,
  success: Boolean,
  error_message: String,
  duration: Number,
  ip_address: String
}
```

### Indexes

The following indexes are automatically created for optimal performance:

```javascript
// Mappings Collection Indexes
db.mappings.createIndex({ "namaste_code": 1 }, { unique: true })
db.mappings.createIndex({ "namaste_term": "text", "icd11_tm2_description": "text" })
db.mappings.createIndex({ "category": 1 })
db.mappings.createIndex({ "chapter_name": 1 })
db.mappings.createIndex({ "confidence_score": -1 })

// Audit Logs Collection Indexes
db.auditlogs.createIndex({ "timestamp": -1 })
db.auditlogs.createIndex({ "userId": 1 })
db.auditlogs.createIndex({ "action": 1 })
```

## Data Migration

### Automatic Initialization

The application automatically initializes the database on first run:

1. Connects to MongoDB
2. Creates necessary collections
3. Establishes indexes
4. Seeds with sample data if no data exists

### Manual Database Operations

You can use the database utilities for manual operations:

```javascript
import { initializeDatabase, clearDatabase, checkDatabaseStatus } from '@/utils/initializeDatabase';

// Initialize database with sample data
await initializeDatabase();

// Check database status
const status = await checkDatabaseStatus();
console.log(status);

// Clear all data (use with caution)
await clearDatabase();
```

### Data Import from CSV

If you have existing CSV data, place it in `public/data/ayush_icd11_mappings_200.csv` and the initialization will automatically import it.

CSV Format:
```csv
namaste_code,namaste_term,icd11_tm2_code,icd11_biomedicine_code,icd11_tm2_description
AYU-001,"Kasa (Cough)",XF78172,BB498,"Traditional cough disorder"
```

## Service Architecture

### Database Service Layer

The `database.ts` service provides:
- Connection management
- CRUD operations
- Search functionality
- Aggregation pipelines
- Error handling

### Enhanced FHIR Service

The `fhirServiceV2.ts` service provides:
- Hybrid storage (MongoDB + Supabase)
- FHIR R4 compliance
- Advanced search capabilities
- Audit logging
- Performance optimizations

## Performance Optimizations

### 1. Full-Text Search
```javascript
// Optimized search with text indexes and relevance scoring
const results = await db.collection('mappings').find(
  { $text: { $search: query } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } });
```

### 2. Aggregation Pipelines
```javascript
// Efficient statistics computation
const stats = await db.collection('mappings').aggregate([
  { $group: {
    _id: null,
    totalMappings: { $sum: 1 },
    avgConfidence: { $avg: "$confidence_score" }
  }}
]);
```

### 3. Compound Queries
```javascript
// Combined filtering with multiple indexes
const results = await db.collection('mappings').find({
  category: "Ayurveda",
  chapter_name: "Respiratory System Disorders",
  confidence_score: { $gte: 0.8 }
});
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

The application will:
- Connect to MongoDB automatically
- Initialize database if empty
- Serve on `http://localhost:8080`

### 2. Monitor Database

Use MongoDB Compass to:
- View collections and documents
- Monitor query performance
- Analyze index usage
- Set up alerts

### 3. Database Debugging

```javascript
// Enable MongoDB debug logging
import { dbService } from '@/services/database';

// Check connection status
console.log('Connected:', dbService.isConnected());

// View collection stats
const stats = await dbService.getMappingStats();
console.log('Database stats:', stats);
```

## Production Considerations

### 1. Security
```javascript
// Use MongoDB Atlas or secure local installation
const uri = process.env.MONGODB_URI || "mongodb://username:password@host:port/database";
```

### 2. Backup Strategy
```bash
# Regular database backups
mongodump --host localhost:27017 --db namaste-sync --out backup/

# Restore from backup
mongorestore --host localhost:27017 --db namaste-sync backup/namaste-sync/
```

### 3. Performance Monitoring
```javascript
// Monitor query performance
db.setProfilingLevel(2);
db.system.profile.find().limit(5).sort({ ts: -1 });
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Service Not Running
```powershell
# Start MongoDB service
net start MongoDB

# Check service status
Get-Service MongoDB
```

#### 2. Connection Refused
- Verify MongoDB is running on port 27017
- Check firewall settings
- Ensure MongoDB configuration allows connections

#### 3. Authentication Errors
```javascript
// Update connection string with credentials
VITE_MONGODB_URI=mongodb://username:password@localhost:27017/namaste-sync
```

#### 4. Performance Issues
- Check index usage with `db.collection.explain()`
- Monitor memory usage in MongoDB Compass
- Consider query optimization

### Debug Commands

```bash
# Check MongoDB logs
Get-EventLog -LogName Application -Source MongoDB

# Test connection
mongosh --eval "db.adminCommand('ping')"

# Check database size
mongosh --eval "db.stats()"
```

## Migration Benefits

### Before (In-Memory Storage)
- ❌ Data lost on restart
- ❌ Linear search O(n)
- ❌ No persistence
- ❌ Memory constraints
- ❌ No backup strategy

### After (MongoDB)
- ✅ Persistent storage
- ✅ Indexed queries O(log n)
- ✅ Full-text search
- ✅ Scalable architecture
- ✅ Professional database features
- ✅ Backup and recovery
- ✅ Query optimization
- ✅ Aggregation pipelines

## Support and Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB Compass Guide](https://docs.mongodb.com/compass/)
- [Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/)
- [MongoDB University](https://university.mongodb.com/)

This setup provides a robust, scalable foundation for the NAMASTE-SYNC terminology service with professional-grade database capabilities.