import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { mongoAuthService } from '@/services/mongoAuthService';

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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  updateProfile: (updateData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = mongoAuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    mongoAuthService.logout();
    setUser(null);
  };

  const login = async (email: string, password: string) => {
    const result = await mongoAuthService.login(email, password);
    setUser(result.user);
  };

  const signup = async (email: string, password: string, fullName: string) => {
    const result = await mongoAuthService.register(email, password, fullName);
    // Note: User needs to login after signup
    setUser(result.user);
  };

  const updateProfile = async (updateData: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    const result = await mongoAuthService.updateProfile(user._id, updateData);
    setUser(result.user);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        logout,
        loading,
        login,
        signup,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};