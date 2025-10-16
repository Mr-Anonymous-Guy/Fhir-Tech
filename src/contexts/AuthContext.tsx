import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ABHAUser } from '@/types/fhir';
import { fhirService } from '@/services/fhirService';

interface AuthContextType {
  user: ABHAUser | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (abhaId: string, phoneNumber: string, otp: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => void;
  loading: boolean;
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
  const [user, setUser] = useState<ABHAUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('fhir-user');
    const savedDemoMode = localStorage.getItem('fhir-demo-mode');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsDemoMode(savedDemoMode === 'true');
    }
    
    setLoading(false);
  }, []);

  const login = async (abhaId: string, phoneNumber: string, otp: string) => {
    setLoading(true);
    try {
      const authenticatedUser = await fhirService.authenticateABHA(abhaId, phoneNumber, otp);
      setUser(authenticatedUser);
      setIsDemoMode(false);
      localStorage.setItem('fhir-user', JSON.stringify(authenticatedUser));
      localStorage.setItem('fhir-demo-mode', 'false');
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setLoading(true);
    try {
      const demoUser = await fhirService.authenticateABHA('demo', '', '123456');
      setUser(demoUser);
      setIsDemoMode(true);
      localStorage.setItem('fhir-user', JSON.stringify(demoUser));
      localStorage.setItem('fhir-demo-mode', 'true');
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsDemoMode(false);
    localStorage.removeItem('fhir-user');
    localStorage.removeItem('fhir-demo-mode');
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isDemoMode,
        login,
        loginDemo,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};