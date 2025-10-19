# 🗄️ Local MongoDB Setup Guide

This guide explains how to set up and use the NAMASTE-SYNC application with **local MongoDB storage**.

## 📍 **Data Storage Location**

Your data is now stored in **MongoDB locally** on your machine:

### **Database Details:**
- **Database**: `namaste-sync` (MongoDB database)
- **Host**: `localhost:27017` (your local machine)
- **Collections**: 
  - `mappings` - NAMASTE terminology mappings
  - `auditLogs` - User activity and search history

### **Physical Storage Location:**
```
Windows: C:\Program Files\MongoDB\Server\[version]\data\
```

### **Access Your Data:**
1. **MongoDB Compass** (GUI):
   - Open MongoDB Compass
   - Connect to: `mongodb://localhost:27017`
   - Browse database: `namaste-sync`

2. **MongoDB Shell**:
   ```bash
   mongosh
   use namaste-sync
   db.mappings.find()
   db.auditLogs.find()
   ```

## 🚀 **How to Run the Application**

### **Option 1: Run Both Services Together (Recommended)**
```bash
npm run dev:full
```
This starts:
- **Backend API** on `http://localhost:3001`
- **Frontend** on `http://localhost:8080`

### **Option 2: Run Services Separately**

**Terminal 1 - Backend:**
```bash
npm run backend:dev
# or
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🔧 **Backend API Endpoints**

Your data is accessed through REST API endpoints:

### **Mappings:**
- `GET /api/mappings/search?q=cough` - Search mappings
- `GET /api/mappings/AYU-001` - Get specific mapping
- `POST /api/mappings` - Add new mappings
- `GET /api/mappings/stats/summary` - Get statistics

### **Audit Logs:**
- `GET /api/audit` - Get audit logs
- `POST /api/audit` - Add audit entry

### **Health Check:**
- `GET /health` - Check if backend is running

## 💾 **Data Persistence Benefits**

✅ **Persistent Storage**: Data survives browser restarts, computer restarts  
✅ **Professional Database**: Full MongoDB features (indexes, aggregations, etc.)  
✅ **Better Performance**: Optimized database queries instead of browser storage  
✅ **Scalable**: Can handle large amounts of terminology data  
✅ **Backup Ready**: Easy to backup/restore MongoDB data  
✅ **Multi-User Ready**: Can be configured for multiple users if needed  

## 🔍 **How to View Your Data**

### **Using MongoDB Compass (Recommended):**
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Select `namaste-sync` database
4. Browse collections:
   - **mappings** - All NAMASTE to ICD-11 terminology mappings
   - **auditLogs** - Search history and user activities

### **Sample Queries:**
```javascript
// Find all Ayurveda mappings
db.mappings.find({category: "Ayurveda"})

// Search for respiratory conditions
db.mappings.find({namaste_term: /respiratory/i})

// Get recent searches
db.auditLogs.find({action: "search"}).sort({timestamp: -1}).limit(10)

// Get mapping statistics
db.mappings.aggregate([
  {$group: {
    _id: "$category", 
    count: {$sum: 1},
    avgConfidence: {$avg: "$confidence_score"}
  }}
])
```

## 🔒 **Database Security**

- **Local Only**: MongoDB runs only on your machine
- **No External Access**: Not accessible from internet
- **Private Data**: All your searches and data stay on your computer

## 🛠️ **Troubleshooting**

### **Backend Not Starting?**
1. Check MongoDB service:
   ```powershell
   Get-Service MongoDB
   ```
2. Start MongoDB if stopped:
   ```powershell
   Start-Service MongoDB
   ```

### **Cannot Connect to API?**
1. Ensure backend is running on port 3001
2. Check if port is available:
   ```bash
   netstat -ano | findstr :3001
   ```

### **Data Not Appearing?**
1. Check backend logs for errors
2. Verify MongoDB connection in backend console
3. Use MongoDB Compass to verify data exists

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    HTTP API    ┌─────────────────┐    MongoDB    ┌─────────────────┐
│   Frontend      │   (REST API)   │   Backend       │   Queries     │   MongoDB       │
│   (React)       │ ◄─────────────► │   (Express.js)  │ ◄───────────► │   Database      │
│   Port: 8080    │                │   Port: 3001    │               │   Port: 27017   │
└─────────────────┘                └─────────────────┘               └─────────────────┘
```

- **Frontend**: React app (unchanged user experience)
- **Backend**: Express.js API server (handles MongoDB operations)
- **Database**: Local MongoDB instance (stores all data)

## 📊 **Data Migration**

Your previous IndexedDB data is not automatically migrated. The system starts fresh with sample data. If you need to migrate existing data, you can:

1. Export data from IndexedDB (browser dev tools)
2. Use the bulk upload feature in the application
3. Or manually insert via MongoDB tools

---

**🎉 Enjoy your new persistent, professional MongoDB storage for NAMASTE-SYNC!**