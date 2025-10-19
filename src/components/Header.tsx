import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Play, Power } from 'lucide-react';
import NAMASTELogo from '@/components/NAMASTELogo';
import EnhancedProfileSidebar from '@/components/EnhancedProfileSidebar';

const Header = () => {
  const { user, logout } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/login');
  };

  return (
    <header className="bg-nav border-b border-border px-6 py-4 flex items-center justify-between shadow-elevated">
      <div className="flex items-center gap-6">
        <NAMASTELogo className="h-12" />
        
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-nav-foreground">
            FHIR Terminology Service
          </h1>
          <p className="text-sm text-nav-foreground/80">
            Ministry of AYUSH | FHIR R4 Compliant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isDemoMode && (
          <Button 
            onClick={handleExitDemo}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2 font-medium"
          >
            <Power className="w-4 h-4" />
            Exit Demo Mode
          </Button>
        )}
        
        {/* Profile Trigger Button */}
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 text-nav-foreground hover:bg-nav-foreground/10 transition-all duration-200"
          onClick={() => setIsProfileOpen(true)}
        >
          {isDemoMode ? (
            <>
              <Play className="w-4 h-4" />
              <span className="hidden md:inline">Demo User</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4" />
              <span className="hidden md:inline">{user?.email || 'User'}</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Enhanced Profile Sidebar */}
      <EnhancedProfileSidebar 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </header>
  );
};

export default Header;