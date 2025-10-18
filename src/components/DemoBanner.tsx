import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ArrowRight, X } from 'lucide-react';
import { useDemo } from '@/contexts/DemoContext';

const DemoBanner = () => {
  const navigate = useNavigate();
  const { exitDemoMode } = useDemo();

  const handleSignUp = () => {
    exitDemoMode();
    navigate('/signup');
  };

  return (
    <Alert className="border-warning bg-warning/10 rounded-none border-x-0 border-t-0">
      <Info className="h-4 w-4 text-warning-foreground" />
      <AlertDescription className="flex items-center justify-between w-full">
        <span className="text-sm text-warning-foreground font-medium">
          You're in Demo Mode - Explore with sample data. Create an account to save your work.
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSignUp}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Create Account
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default DemoBanner;
