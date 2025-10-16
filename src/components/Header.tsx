import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield } from 'lucide-react';
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
  const { user, isDemoMode, logout } = useAuth();

  return (
    <header className="bg-nav border-b border-border px-6 py-4 flex items-center justify-between shadow-elevated">
      <div className="flex items-center gap-6">
        <NAMASTELogo className="h-12" />
        
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-nav-foreground">
            FHIR Terminology Service
          </h1>
          {isDemoMode && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/50 w-fit">
              <Shield className="w-3 h-3 mr-1" />
              Demo Mode
            </Badge>
          )}
          <p className="text-sm text-nav-foreground/80">
            Ministry of AYUSH | FHIR R4 Compliant
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-nav-foreground hover:bg-nav-foreground/10 transition-all duration-200"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  ABHA ID: {user?.abhaId}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.phoneNumber}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isDemoMode && (
              <DropdownMenuItem disabled>
                <Shield className="w-4 h-4 mr-2" />
                Demo Mode Active
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;