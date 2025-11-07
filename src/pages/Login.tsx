import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Loader2, 
  Play, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Stethoscope,
  ChevronLeft,
  Shield,
  CheckCircle
} from 'lucide-react';
import NAMASTELogo from '@/components/NAMASTELogo';

const Login = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const { enterDemoMode } = useDemo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { ref: headerRef, inView: headerInView } = useInView({ 
    threshold: 0.1, 
    triggerOnce: true 
  });

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered-email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors and try again.');
      return;
    }

    setLoading(true);

    try {
      // Remember email if checked
      if (rememberMe) {
        localStorage.setItem('remembered-email', email);
      } else {
        localStorage.removeItem('remembered-email');
      }

      await login(email, password);
      toast.success('Welcome back! Logging you in...');
      navigate('/app');
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          toast.error('Invalid email or password. Please check your credentials.');
          setErrors({ password: 'Invalid credentials' });
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          toast.error('Unable to connect to authentication service. Please ensure MongoDB and the backend server are running.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    toast.info('Password reset link will be sent to ' + email, { duration: 3000 });
    // TODO: Implement password reset functionality
  };

  const handleDemoMode = () => {
    enterDemoMode();
    navigate('/app');
    toast.success('Welcome to Demo Mode!');
  };

  // Floating particles animation
  const particleVariants = {
    animate: {
      y: [0, -10, 0],
      opacity: [0.3, 0.8, 0.3],
      scale: [1, 1.2, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 2
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  const backgroundVariants = {
    animate: {
      background: [
        "radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 80% 20%, rgba(255, 99, 72, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%)",
      ],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      variants={backgroundVariants}
      animate="animate"
      style={{
        background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)"
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            variants={particleVariants}
            animate="animate"
          />
        ))}
      </div>

      {/* Animated Background Gradients */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-secondary/20 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Navigation Header */}
      <motion.header 
        ref={headerRef}
        className="relative z-10 p-6"
        initial={{ y: -50, opacity: 0 }}
        animate={headerInView ? { y: 0, opacity: 1 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Stethoscope className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NAMASTE</h1>
              <p className="text-xs text-muted-foreground">FHIR Terminology Service</p>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Already Logged In Notice */}
      {user && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-success/10 border border-success/20 mx-6 mt-6 p-4 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-success font-medium">
                You are already logged in as {user.email}
              </span>
            </div>
            <Button 
              onClick={() => navigate('/app')} 
              size="sm" 
              className="bg-success hover:bg-success/90"
            >
              Go to App
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-md"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="login-form"
              layout
            >
              {/* Animated Logo */}
              <motion.div 
                className="text-center mb-8"
                variants={itemVariants}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.1,
                    rotate: [0, -5, 5, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  <NAMASTELogo className="text-3xl mb-2" showSubtext={false} />
                </motion.div>
                <motion.h2 
                  className="text-2xl font-bold text-foreground mb-2"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  style={{
                    background: "linear-gradient(90deg, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--foreground)))",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Welcome Back
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Sign in to access your account
                </motion.p>
              </motion.div>

              {/* Login Card */}
              <motion.div
                variants={itemVariants}
                whileHover={{ 
                  y: -5,
                  transition: { type: "spring", stiffness: 400 }
                }}
              >
                <Card className="relative overflow-hidden backdrop-blur-xl bg-card/80 border border-border/50 shadow-2xl">
                  {/* Card Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <motion.div
                        animate={focusedField ? { rotate: [0, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <Shield className="w-5 h-5 text-primary" />
                      </motion.div>
                      Secure Login
                    </CardTitle>
                    <CardDescription>
                      Access your FHIR terminology dashboard
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <form onSubmit={handleLogin} className="space-y-6">
                      {/* Email Field */}
                      <motion.div 
                        className="space-y-2"
                        whileFocusWithin={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                            required
                            disabled={loading}
                            className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={focusedField === 'email' ? { 
                              scale: [1, 1.2, 1],
                              color: "hsl(var(--primary))"
                            } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Password Field */}
                      <motion.div 
                        className="space-y-2"
                        whileFocusWithin={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Label htmlFor="password" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
                            required
                            disabled={loading}
                            className="pl-10 pr-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={focusedField === 'password' ? { 
                              scale: [1, 1.2, 1],
                              color: "hsl(var(--primary))"
                            } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                        </div>
                      </motion.div>

                      {/* Error Messages */}
                      {errors.email && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
                        >
                          {errors.email}
                        </motion.div>
                      )}
                      {errors.password && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
                        >
                          {errors.password}
                        </motion.div>
                      )}

                      {/* Remember Me & Forgot Password */}
                      <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            disabled={loading}
                            className="w-4 h-4 rounded border-2 border-border transition-colors cursor-pointer"
                          />
                          <span className="text-muted-foreground hover:text-foreground transition-colors">
                            Remember me
                          </span>
                        </label>
                        <motion.button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-primary hover:text-primary/80 transition-colors font-medium"
                          whileHover={{ x: 2 }}
                        >
                          Forgot password?
                        </motion.button>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                          disabled={loading}
                          size="lg"
                        >
                          {loading ? (
                            <motion.div 
                              className="flex items-center gap-2"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Signing In...
                            </motion.div>
                          ) : (
                            <motion.div 
                              className="flex items-center gap-2"
                              whileHover={{ x: 2 }}
                            >
                              <Sparkles className="w-4 h-4" />
                              Sign In
                              <ArrowRight className="w-4 h-4" />
                            </motion.div>
                          )}
                          
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          />
                        </Button>
                      </motion.div>
                    </form>

                    {/* Divider */}
                    <motion.div 
                      className="relative my-6"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.6 }}
                    >
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-3 text-muted-foreground">Or</span>
                      </div>
                    </motion.div>

                    {/* Demo Button */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDemoMode}
                        className="w-full relative overflow-hidden border-2 border-dashed border-border hover:border-primary/50"
                        disabled={loading}
                      >
                        <motion.div 
                          className="flex items-center gap-2"
                          animate={{ 
                            y: [0, -1, 0],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          >
                            <Play className="w-4 h-4" />
                          </motion.div>
                          Try Demo Mode
                        </motion.div>
                      </Button>
                    </motion.div>

                    {/* Sign Up Link */}
                    <motion.div 
                      className="text-center mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <p className="text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-block"
                        >
                          <Link 
                            to="/signup" 
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Create one here
                          </Link>
                        </motion.span>
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Login;