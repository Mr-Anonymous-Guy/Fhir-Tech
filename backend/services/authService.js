/**
 * MongoDB-based Authentication Service
 * Handles user authentication and session management using MongoDB
 * Falls back to local storage if MongoDB requires authentication
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const database = require('../database');
const localUserStorage = require('../localUserStorage');

class AuthService {
  constructor() {
    this.SALT_ROUNDS = 12;
    this.JWT_SECRET = process.env.JWT_SECRET || 'namaste-sync-jwt-secret-key-change-in-production';
    this.JWT_EXPIRES_IN = '24h';
    this.useLocalStorage = false; // Will be set to true if MongoDB fails
  }

  /**
   * Try MongoDB operation, fallback to local storage if it fails
   */
  async tryMongoOrFallback(mongoOperation) {
    try {
      return await mongoOperation();
    } catch (error) {
      if (error.message && error.message.includes('authentication')) {
        console.warn('⚠️ MongoDB authentication failed, using local storage for this session');
        this.useLocalStorage = true;
        return null; // Indicate fallback is needed
      }
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(userData) {
    // Use local storage if needed
    if (this.useLocalStorage) {
      return await localUserStorage.register(userData);
    }

    try {
      const usersCollection = database.db.collection('users');
      
      // Check if user already exists
      let existingUser;
      try {
        existingUser = await usersCollection.findOne({ 
          $or: [
            { email: userData.email },
            { username: userData.username }
          ]
        });
      } catch (findError) {
        // If find fails due to auth, fallback to local storage
        if (findError.message && findError.message.includes('authentication')) {
          console.warn('⚠️ MongoDB authentication required, using local storage');
          this.useLocalStorage = true;
          return await localUserStorage.register(userData);
        }
        console.warn('Warning: Could not check existing user:', findError.message);
      }
      
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      
      // Create user object
      const user = {
        _id: new require('mongodb').ObjectId(),
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
      
      // Insert user
      try {
        const result = await usersCollection.insertOne(user);
      } catch (insertError) {
        if (insertError.message && insertError.message.includes('authentication')) {
          console.warn('⚠️ MongoDB authentication required, using local storage');
          this.useLocalStorage = true;
          return await localUserStorage.register(userData);
        }
        if (insertError.code === 11000) {
          throw new Error('User with this email or username already exists');
        }
        throw insertError;
      }
      
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
    // Use local storage if needed
    if (this.useLocalStorage) {
      return await localUserStorage.login(email, password);
    }

    try {
      const usersCollection = database.db.collection('users');
      
      // Find user by email
      let user;
      try {
        user = await usersCollection.findOne({ email });
      } catch (findError) {
        // If find fails due to auth, fallback to local storage
        if (findError.message && findError.message.includes('authentication')) {
          console.warn('⚠️ MongoDB authentication required, using local storage');
          this.useLocalStorage = true;
          return await localUserStorage.login(email, password);
        }
        console.error('Find user error:', findError.message);
        throw new Error('Unable to authenticate. Please try again.');
      }
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      
      // Update last login
      try {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date(), updatedAt: new Date() } }
        );
      } catch (updateError) {
        console.warn('Warning: Could not update last login:', updateError.message);
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
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
      const usersCollection = database.db.collection('users');
      const user = await usersCollection.findOne({ 
        _id: new require('mongodb').ObjectId(userId) 
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, updateData) {
    try {
      const usersCollection = database.db.collection('users');
      
      // Remove sensitive fields from update data
      const { password, email, role, ...safeUpdateData } = updateData;
      safeUpdateData.updatedAt = new Date();
      
      const result = await usersCollection.updateOne(
        { _id: new require('mongodb').ObjectId(userId) },
        { $set: safeUpdateData }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }
      
      const updatedUser = await this.getUserById(userId);
      return {
        success: true,
        user: updatedUser,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const usersCollection = database.db.collection('users');
      
      // Find user
      const user = await usersCollection.findOne({ 
        _id: new require('mongodb').ObjectId(userId) 
      });
      
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
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { password: hashedNewPassword, updatedAt: new Date() } }
      );
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();