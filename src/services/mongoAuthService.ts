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

const resolveBaseUrl = () => {
  // 1. Check for manual environment variable override
  const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL;
  if (envBase && !envBase.includes("yourdomain.com") && !envBase.startsWith("@")) {
    return `${envBase.replace(/\/$/, "")}/api/auth`;
  }

  // 2. In local development (localhost), try to hit the backend directly on port 3001
  // This helps when running frontend/backend separately without a proxy
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname === "[::1]";

    // If we're on localhost and NOT on the backend port already
    if (isLocal && window.location.port !== "3001") {
      return "http://localhost:3001/api/auth";
    }
  }

  // 3. Fallback: Use relative path (works with Vite proxy and Vercel/production)
  return "/api/auth";
};

/**
 * Robust JSON fetch wrapper that handles non-JSON responses gracefully
 */
async function safeJsonFetch(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type");

  // If not JSON, it's likely a 404/500 HTML error page
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    const isHtml = text.trim().startsWith('<') || text.includes('The page could not be found');

    if (isHtml) {
      throw new Error(`API returned an HTML error instead of JSON. This usually means the backend server is not running or the route is incorrect. (Status: ${response.status})`);
    }

    throw new Error(`Unexpected response format: ${text.slice(0, 100)}...`);
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || `API Error (${response.status})`);
  }

  return result;
}

// Create service object without class instantiation
const mongoAuthService = {
  tokenKey: 'namaste-auth-token',
  userKey: 'namaste-auth-user',

  /**
   * Register a new user
   */
  async register(email: string, password: string, fullName: string = ''): Promise<RegisterResponse> {
    try {
      const baseUrl = resolveBaseUrl();
      const [firstName, ...lastNameParts] = fullName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const response = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName: firstName || email.split('@')[0],
          lastName: lastName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(`Unexpected response format: ${text.slice(0, 100)}`);
      }

      const result = await response.json();

      // Handle both response formats: { success, data: { user } } or { success, user }
      const data = result.data ? {
        success: result.success,
        user: result.data.user,
        message: result.data.message || 'Registration successful'
      } : result;

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
      const baseUrl = resolveBaseUrl();
      const result = await safeJsonFetch(`${baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login API response:', result);

      // Handle both response formats: { success, data: { user, token } } or { success, user, token }
      const data = result.data ? {
        success: result.success,
        user: result.data.user,
        token: result.data.token,
        message: result.data.message || 'Login successful'
      } : result;

      // Store token and user data
      if (data.token) {
        localStorage.setItem(mongoAuthService.tokenKey, data.token);
      }
      if (data.user) {
        localStorage.setItem(mongoAuthService.userKey, JSON.stringify(data.user));
      }

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
      const baseUrl = resolveBaseUrl();
      const response = await fetch(`${baseUrl}/verify-token`, {
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
      const baseUrl = resolveBaseUrl();
      const token = mongoAuthService.getToken();
      const response = await fetch(`${baseUrl}/profile/${userId}`, {
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
      const baseUrl = resolveBaseUrl();
      const token = mongoAuthService.getToken();
      const response = await fetch(`${baseUrl}/change-password`, {
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
