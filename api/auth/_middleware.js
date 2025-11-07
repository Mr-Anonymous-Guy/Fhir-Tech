// ===========================================
// NAMASTE-SYNC Authentication Middleware
// ===========================================
// Simple in-memory user storage for demo purposes
// In production, use Vercel KV, Redis, or external database

// In-memory user storage (will reset on function cold start)
let users = new Map([
  ['admin@namaste-sync.com', {
    id: '1',
    email: 'admin@namaste-sync.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJflHQrxq', // password: Admin123!
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isActive: true
  }]
]);

// For demo purposes, we also save users to environment variables for persistence
function getUsers() {
  try {
    // Try to get users from environment (Vercel KV or similar)
    if (process.env.USERS_DATA) {
      const parsed = JSON.parse(process.env.USERS_DATA);
      return new Map(Object.entries(parsed));
    }
  } catch (e) {
    // Fall back to in-memory
  }
  return users;
}

function saveUsers(userMap) {
  try {
    // Save to environment for persistence (in production, use proper database)
    process.env.USERS_DATA = JSON.stringify(Object.fromEntries(userMap));
  } catch (e) {
    // Ignore if can't save to env
  }
  users = userMap;
}

module.exports = {
  getUsers,
  saveUsers
};