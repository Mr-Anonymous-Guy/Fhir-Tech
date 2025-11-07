/**
 * Local MongoDB Instance Manager
 * Automatically creates and manages a local MongoDB instance
 * Data is stored in the project's mongodb-data folder
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');

class LocalMongoDBManager {
  constructor() {
    this.mongoServer = null;
    this.dataPath = path.join(__dirname, '..', 'mongodb-data');
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
      console.log(`📁 Created MongoDB data directory: ${this.dataPath}`);
    }
  }

  /**
   * Start local MongoDB instance
   */
  async start() {
    try {
      this.ensureDataDirectory();

      console.log('🔄 Starting local MongoDB instance...');
      
      this.mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbPath: this.dataPath,
          storageEngine: 'wiredTiger',
        },
        binary: {
          version: '6.0.12',
        },
      });

      const uri = this.mongoServer.getUri();
      console.log('✅ Local MongoDB instance started successfully');
      console.log(`📍 MongoDB URI: ${uri}`);
      console.log(`💾 Data stored in: ${this.dataPath}`);

      return uri;
    } catch (error) {
      console.error('❌ Failed to start local MongoDB instance:', error.message);
      throw error;
    }
  }

  /**
   * Stop local MongoDB instance
   */
  async stop() {
    if (this.mongoServer) {
      try {
        await this.mongoServer.stop();
        console.log('🛑 Local MongoDB instance stopped');
      } catch (error) {
        console.error('Error stopping MongoDB instance:', error.message);
      }
    }
  }

  /**
   * Get MongoDB connection URI
   */
  getUri() {
    return this.mongoServer ? this.mongoServer.getUri() : null;
  }
}

// Singleton instance
let mongoManager = null;

/**
 * Get or create MongoDB manager instance
 */
function getMongoManager() {
  if (!mongoManager) {
    mongoManager = new LocalMongoDBManager();
  }
  return mongoManager;
}

/**
 * Start local MongoDB and return connection URI
 */
async function startLocalMongoDB() {
  const manager = getMongoManager();
  return await manager.start();
}

/**
 * Stop local MongoDB instance
 */
async function stopLocalMongoDB() {
  const manager = getMongoManager();
  await manager.stop();
}

module.exports = {
  LocalMongoDBManager,
  getMongoManager,
  startLocalMongoDB,
  stopLocalMongoDB
};
