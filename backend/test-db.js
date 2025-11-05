const { MongoClient } = require('mongodb');

async function testConnection() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME || 'namaste-sync';
    
    console.log('Testing MongoDB connection...');
    console.log('URI:', uri);
    console.log('DB Name:', dbName);
    
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
  }
}

testConnection();