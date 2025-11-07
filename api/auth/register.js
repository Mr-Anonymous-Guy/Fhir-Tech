// ===========================================
// NAMASTE-SYNC Register API (Vercel Serverless)
// ===========================================

const bcrypt = require('bcryptjs');

// Mock user database (in production, use Vercel KV or external DB)
const users = new Map();

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse request body for Vercel serverless
    let body = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        body = {};
      }
    } else if (req.body) {
      body = req.body;
    }

    const { email, password, firstName, lastName } = body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long'
      });
    }

    // Check if user already exists
    if (users.has(email.toLowerCase())) {
      return res.status(409).json({
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = {
      id: Date.now().toString(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Save user
    users.set(email.toLowerCase(), user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        message: 'User registered successfully'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}