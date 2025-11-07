/**
 * MongoDB-based Authentication Service for Frontend
 * Communicates with the MongoDB backend API for user authentication
 */

interface User {
  _id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

interface RegisterResponse {
  success: boolean;
  user: User;
  message: string;
}

// Create service object without class instantiation
const mongoAuthService = {
  baseUrl: 'http://localhost:3001/api/auth',
  tokenKey: 'namaste-auth-token',
  userKey: 'namaste-auth-user',

  /**
   * Register a new user
   */
  async register(email: string, password: string, fullName: string = ''): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${mongoAuthService.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          username: email.split('@')[0],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${mongoAuthService.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data: LoginResponse = await response.json();

      // Store token and user data
      localStorage.setItem(mongoAuthService.tokenKey, data.token);
      localStorage.setItem(mongoAuthService.userKey, JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem(mongoAuthService.tokenKey);
    localStorage.removeItem(mongoAuthService.userKey);
  },

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem(mongoAuthService.tokenKey);
  },

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(mongoAuthService.userKey);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Verify token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${mongoAuthService.baseUrl}/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = mongoAuthService.getToken();
    const user = mongoAuthService.getCurrentUser();
    return !!(token && user);
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<{ success: boolean; user: User; message: string }> {
    try {
      const token = mongoAuthService.getToken();
      const response = await fetch(`${mongoAuthService.baseUrl}/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Profile update failed');
      }

      const data = await response.json();

      // Update stored user data
      localStorage.setItem(mongoAuthService.userKey, JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  /**
   * Change password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = mongoAuthService.getToken();
      const response = await fetch(`${mongoAuthService.baseUrl}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Password change failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },
};

export { mongoAuthService };
