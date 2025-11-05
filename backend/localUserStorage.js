/**
 * Local User Storage Fallback
 * Uses in-memory storage when MongoDB authentication is unavailable
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class LocalUserStorage {
  constructor() {
    this.users = new Map();
    this.SALT_ROUNDS = 12;
    this.JWT_SECRET = process.env.JWT_SECRET || 'namaste-sync-jwt-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = '24h';
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = Array.from(this.users.values()).find(
        u => u.email === userData.email || u.username === userData.username
      );
      
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      
      // Create user object
      const user = {
        _id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        username: userData.username || userData.email.split('@')[0],
        fullName: userData.fullName || '',
        password: hashedPassword,
        role: userData.role || 'user',
        verified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null
      };
      
      // Store user
      this.users.set(user._id, user);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        message: 'User registered successfully. You are now logged in!'
      };
    } catch (error) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    try {
      // Find user by email
      const user = Array.from(this.users.values()).find(u => u.email === email);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Update last login
      user.lastLogin = new Date();
      user.updatedAt = new Date();
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          role: user.role
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = this.users.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user error:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const user = this.users.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove sensitive fields from update data
      const { password, email, role, ...safeUpdateData } = updateData;
      
      // Update user
      Object.assign(user, safeUpdateData, { updatedAt: new Date() });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        success: true,
        user: userWithoutPassword,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error.message);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = this.users.get(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
      
      // Update password
      user.password = hashedNewPassword;
      user.updatedAt = new Date();
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error.message);
      throw error;
    }
  }
}

module.exports = new LocalUserStorage();
