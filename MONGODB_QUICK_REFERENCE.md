# MongoDB Database Quick Reference

## Database Information
- **Database Name**: `namaste-sync`
- **Connection URI**: `mongodb://localhost:27017`
- **Total Collections**: 10
- **Total Mappings**: 15
- **Total Audit Logs**: 3

## Quick Start

### Initialize Database (First Time)
```bash
cd backend
node init-mongodb.js
```

### Verify Database
```bash
cd backend
node verify-mongodb.js
```

### Start Backend Server
```bash
npm run backend:dev
```

## Collections Overview

| Collection | Records | Purpose |
|------------|---------|---------|
| mappings | 15 | NAMASTE to ICD-11 terminology mappings |
| auditLogs | 3 | User activity and search history |
| users | 0 | User accounts (empty, ready for use) |
| notifications | 0 | User notifications (empty) |
| userSessions | 0 | Active sessions (empty) |
| supportTickets | 0 | Support tickets (empty) |
| systemMetrics | 0 | Performance metrics (empty) |
| abhaProfiles | 0 | ABHA health profiles (empty) |
| icd11Links | 0 | ICD-11 links (empty) |
| backups | 0 | Database backups (empty) |

## Sample Data

### Mappings by Category
- **Ayurveda**: 9 mappings (91% avg confidence)
- **Siddha**: 3 mappings (88% avg confidence)
- **Unani**: 3 mappings (87% avg confidence)

### Example Mappings
```
AYU-001: Kasa (Cough) - Confidence: 0.95
AYU-006: Madhumeha (Diabetes) - Confidence: 0.96
SID-001: Suram (Fever) - Confidence: 0.94
UNA-001: Waja-ul-Mafasil (Arthritis) - Confidence: 0.90
```

## MongoDB Compass
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `namaste-sync`
4. Browse collections and data

## MongoDB Shell Commands
```bash
# Connect to database
mongosh
use namaste-sync

# View all mappings
db.mappings.find()

# Search by category
db.mappings.find({category: "Ayurveda"})

# Search by term
db.mappings.find({namaste_term: /diabetes/i})

# High confidence mappings
db.mappings.find({confidence_score: {$gte: 0.95}})

# Count by category
db.mappings.aggregate([
  {$group: {_id: "$category", count: {$sum: 1}}}
])

# View audit logs
db.auditLogs.find().sort({timestamp: -1})
```

## Files Created
- `backend/init-mongodb.js` - Database initialization script
- `backend/verify-mongodb.js` - Database verification script
- `backend/.env` - MongoDB configuration

## Environment Variables
```bash
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=namaste-sync
```

---
**Status**: ✅ Database ready for use!
