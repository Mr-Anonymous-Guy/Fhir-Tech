import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NAMASTELogo from '@/components/NAMASTELogo';

const Header = () => {
  const { user, logout } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const navigate = useNavigate();

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/');
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
        {isDemoMode ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-nav-foreground hover:bg-nav-foreground/10 transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                <span className="hidden md:inline">Demo User</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Demo Mode</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Exploring with sample data
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExitDemo}>
                <LogOut className="w-4 h-4 mr-2" />
                Exit Demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-nav-foreground hover:bg-nav-foreground/10 transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline">{user?.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Header;