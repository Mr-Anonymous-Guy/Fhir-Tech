import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SignupTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const testSignup = async () => {
    setLoading(true);
    console.log('Testing signup with:', { email, password, fullName });
    
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      console.log('Signup response:', response);
      setLastResponse(response);

      if (response.error) {
        console.error('Signup error:', response.error);
        toast.error(`Signup Error: ${response.error.message}`);
      } else {
        console.log('Signup success:', response.data);
        if (response.data.user && !response.data.session) {
          toast.success('Account created! Please check your email to confirm your account.');
        } else if (response.data.session) {
          toast.success('Account created and logged in!');
        }
      }
    } catch (error) {
      console.error('Signup exception:', error);
      toast.error(`Signup Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Current session:', { session, error });
      if (error) {
        toast.error(`Connection Error: ${error.message}`);
      } else {
        toast.success('Supabase connection is working!');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error(`Connection Failed: ${error}`);
    }
  };

  const testLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', response);

      if (response.error) {
        toast.error(`Login Error: ${response.error.message}`);
      } else {
        toast.success('Login successful!');
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast.error(`Login Exception: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Signup Debug Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 8 chars)"
              minLength={8}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button onClick={testConnection} variant="outline">
              Test Connection
            </Button>
            <Button onClick={testSignup} disabled={loading}>
              {loading ? 'Testing...' : 'Test Signup'}
            </Button>
            <Button onClick={testLogin} variant="outline">
              Test Login
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Environment:</strong></p>
            <ul className="list-disc pl-5">
              <li>SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL}</li>
              <li>SUPABASE_KEY: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Present' : 'Missing'}</li>
            </ul>
          </div>

          {lastResponse && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h3 className="font-medium mb-2">Last Response:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(lastResponse, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupTest;