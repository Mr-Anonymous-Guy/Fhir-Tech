import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/LoadingSpinner';
import NAMASTELogo from '@/components/NAMASTELogo';
import { Stethoscope, Shield, Phone, Key, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const { isAuthenticated, login, loginDemo, loading } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    abhaId: '',
    phoneNumber: '',
    otp: ''
  });
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSendOtp = async () => {
    if (!formData.abhaId || !formData.phoneNumber) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both ABHA ID and phone number.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code.',
        variant: 'default'
      });
    }, 1500);
  };

  const handleLogin = async () => {
    if (!formData.otp) {
      toast({
        title: 'OTP Required',
        description: 'Please enter the OTP sent to your phone.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(formData.abhaId, formData.phoneNumber, formData.otp);
      toast({
        title: 'Login Successful',
        description: 'Welcome to the FHIR Terminology Service!',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      await loginDemo();
      toast({
        title: 'Demo Mode Activated',
        description: 'Logged in as demonstration user.',
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Demo Login Failed',
        description: 'Unable to activate demo mode.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <LoadingSpinner size="lg" text="Initializing FHIR Service..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nav flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Clean Logo at Top Center */}
        <div className="text-center mb-8">
          <NAMASTELogo />
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="space-y-1 text-center pb-6 pt-8">
            <Badge variant="outline" className="bg-success/10 text-success border-success/50 mx-auto mb-4">
              FHIR R4 Compliant • India EHR Standards 2016
            </Badge>
            <CardTitle className="text-2xl font-bold text-foreground">
              FHIR Terminology Service
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Ayurveda • Siddha • Unani ⟷ ICD-11
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'credentials' ? (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="abhaId" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      ABHA ID
                    </Label>
                    <Input
                      id="abhaId"
                      placeholder="12-3456-7890-1234"
                      value={formData.abhaId}
                      onChange={(e) => setFormData(prev => ({ ...prev, abhaId: e.target.value }))}
                      disabled={isLoading}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-primary" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+91-XXXXXXXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      disabled={isLoading}
                      className="transition-all duration-300 focus:ring-2 focus:ring-primary/20 rounded-lg"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSendOtp}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02] rounded-lg" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Phone className="w-4 h-4 mr-2" />
                  Send OTP
                </Button>
              </>
            ) : (
              <>
                <Alert className="border-info/50 bg-info/5">
                  <Key className="h-4 w-4 text-info" />
                  <AlertDescription>
                    OTP sent to {formData.phoneNumber}. Please enter the 6-digit code.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value }))}
                    disabled={isLoading}
                    maxLength={6}
                    className="text-center text-lg tracking-widest transition-all duration-300 focus:ring-2 focus:ring-primary/20 rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep('credentials')}
                    disabled={isLoading}
                    className="flex-1 transition-all duration-300 hover:scale-[1.02] rounded-lg"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleLogin}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-[1.02] rounded-lg" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify & Login
                  </Button>
                </div>
              </>
            )}

            <Separator />

            {/* Demo Mode */}
            <div className="space-y-4">
              <Alert className="border-success/50 bg-success/5 rounded-lg">
                <Shield className="h-4 w-4 text-success" />
                <AlertDescription className="text-sm">
                  <strong>Demo Mode Available:</strong> Test the system with sample data for offline judging.
                  <br />Demo credentials: Dr. Priya Sharma (ABHA: 12-3456-7890-1234)
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleDemoLogin}
                variant="outline" 
                className="w-full border-success/30 text-success hover:bg-success/10 hover:border-success/50 transition-all duration-300 hover:scale-[1.02] rounded-lg font-medium"
                disabled={isLoading}
              >
                <Shield className="mr-2 h-4 w-4" />
                Continue with Demo Mode
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-white/70 text-sm">
          <p className="font-medium">Ministry of AYUSH • Government of India</p>
          <p className="text-xs mt-1 text-white/60">Powered by FHIR R4 Standards</p>
        </div>
      </div>
    </div>
  );
};

export default Login;