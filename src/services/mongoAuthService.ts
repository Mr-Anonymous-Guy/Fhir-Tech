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
  // 1. Check for manual override
  const envBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envBase && !envBase.includes("yourdomain.com") && !envBase.startsWith("@")) {
    return envBase.replace(/\/$/, "") + "/api/auth";
  }

  // 2. Handle environment-specific logic
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname === "[::1]";

    // If we're on a cloud IDE or tunnel (e.g. GitHub Codespaces, Gitpod)
    // they often use hostname patterns like xxxx-8080.something.com
    const isTunnel = hostname.includes("-8080") || hostname.includes("-3000");

    if (isLocal || isTunnel) {
      // If we are NOT on the backend port, try to hit the backend port explicitly
      if (window.location.port !== "3001") {
        if (isTunnel) return "/api";
        return "http://localhost:3001/api";
      }
    }
  }

  return "/api";
};

console.log('🛡️ Mongo Auth Service Loaded v2');

/**
 * Robust JSON fetch wrapper that handles non-JSON responses gracefully
 */
async function safeJsonFetch(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();

    // Check if it's empty
    if (!text || text.trim() === '') {
      if (!response.ok) throw new Error(`API returned empty response with status ${response.status}`);
      return {};
    }

    // Try to parse as JSON
    try {
      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(result.error || result.message || `API Error (${response.status})`);
      }

      return result;
    } catch (parseError) {
      // Not JSON, analyze the text to provide a better error
      const isHtml = text.trim().startsWith('<') ||
        text.toLowerCase().includes('<!doctype html>') ||
        text.includes('The page could not be found') ||
        text.includes('Vercel') ||
        text.includes('404');

      if (isHtml) {
        throw new Error(`The backend API returned an HTML page instead of JSON. This usually means the backend server is not running, or the URL "${url}" is incorrect. (Status: ${response.status})`);
      }

      throw new Error(`API returned invalid JSON: ${text.slice(0, 60)}...`);
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.message.includes('Load failed'))) {
      throw new Error(`Unable to connect to the backend server at "${url}". Please ensure your backend is running.`);
    }
    throw error;
  }
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

      const result = await safeJsonFetch(`${baseUrl}/register`, {
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
      const response = await fetch(`${baseUrl}/auth/verify-token`, {
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

      const data = await safeJsonFetch(`${baseUrl}/auth/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

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

      return await safeJsonFetch(`${baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },
};

export { mongoAuthService };
