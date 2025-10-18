import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Check localStorage for demo mode persistence
    return localStorage.getItem('demo_mode') === 'true';
  });

  useEffect(() => {
    // Persist demo mode state
    localStorage.setItem('demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  const enterDemoMode = () => {
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    localStorage.removeItem('demo_mode');
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
