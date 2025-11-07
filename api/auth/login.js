// ===========================================
// NAMASTE-SYNC Login API (Vercel Serverless)
// ===========================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock user database (in production, use Vercel KV or external DB)
const users = new Map([
  ['admin@namaste-sync.com', {
    id: '1',
    email: 'admin@namaste-sync.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3QJflHQrxq', // password: Admin123!
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  }]
]);

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = users.get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '24h' }
    );

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        expiresIn: '24h'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}