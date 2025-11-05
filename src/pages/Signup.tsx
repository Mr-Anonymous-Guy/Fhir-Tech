import { useState } from 'react';
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
  User, 
  ArrowRight, 
  Sparkles,
  Stethoscope,
  ChevronLeft,
  UserPlus,
  Check,
  X
} from 'lucide-react';
import NAMASTELogo from '@/components/NAMASTELogo';

const Signup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enterDemoMode } = useDemo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { ref: headerRef, inView: headerInView } = useInView({ 
    threshold: 0.1, 
    triggerOnce: true 
  });

  // Note: Removed automatic redirect to allow access even when logged in

  // Password validation
  const passwordRequirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const { signup } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast.error('Please ensure password meets all requirements');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(email, password, fullName);
      toast.success('Account created successfully! You are now logged in.');
      navigate('/app');
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          toast.error('User with this email or username already exists');
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          toast.error('Unable to connect to authentication service. Please ensure MongoDB and the backend server are running.');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    navigate('/app');
    toast.success('Welcome to Demo Mode!');
  };

  // Floating particles animation
  const particleVariants = {
    animate: {
      y: [0, -15, 0],
      opacity: [0.2, 0.7, 0.2],
      scale: [0.8, 1.3, 0.8],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay: Math.random() * 3
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        duration: 0.8
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  const backgroundVariants = {
    animate: {
      background: [
        "radial-gradient(circle at 30% 40%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
        "radial-gradient(circle at 50% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)",
      ],
      transition: {
        duration: 10,
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
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary/25 rounded-full"
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
        className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-green-400/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, 120, 240, 360],
          opacity: [0.3, 0.7, 0.3]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1.3, 1, 1.3],
          rotate: [360, 240, 120, 0],
          opacity: [0.4, 0.8, 0.4]
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-400/10 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.4, 1],
          rotate: [0, -180, -360],
          opacity: [0.2, 0.6, 0.2]
        }}
        transition={{
          duration: 14,
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
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
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

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full max-w-lg"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="signup-form"
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
                    rotate: [0, -3, 3, 0],
                    transition: { duration: 0.6 }
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
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Join NAMASTE
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  Create your account to get started
                </motion.p>
              </motion.div>

              {/* Signup Card */}
              <motion.div
                variants={itemVariants}
                whileHover={{ 
                  y: -5,
                  transition: { type: "spring", stiffness: 400 }
                }}
              >
                <Card className="relative overflow-hidden backdrop-blur-xl bg-card/90 border border-border/60 shadow-2xl">
                  {/* Card Glow Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-green-400/5 via-blue-500/5 to-purple-500/5"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                  
                  <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <motion.div
                        animate={focusedField ? { 
                          rotate: [0, 15, -15, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        <UserPlus className="w-5 h-5 text-primary" />
                      </motion.div>
                      Create Account
                    </CardTitle>
                    <CardDescription>
                      Join the FHIR terminology community
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10">
                    <form onSubmit={handleSignup} className="space-y-5">
                      {/* Full Name Field */}
                      <motion.div 
                        className="space-y-2"
                        whileFocusWithin={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        <div className="relative">
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            onFocus={() => setFocusedField('fullName')}
                            onBlur={() => setFocusedField(null)}
                            required
                            disabled={loading}
                            className="pl-10 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                          />
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={focusedField === 'fullName' ? { 
                              scale: [1, 1.2, 1],
                              color: "hsl(var(--primary))"
                            } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <User className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.div>

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

                        {/* Password Requirements */}
                        <AnimatePresence>
                          {password && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="bg-muted/50 rounded-md p-3 space-y-1"
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
                              <div className="grid grid-cols-1 gap-1 text-xs">
                                {Object.entries({
                                  'At least 8 characters': passwordRequirements.length,
                                  'One uppercase letter': passwordRequirements.uppercase,
                                  'One lowercase letter': passwordRequirements.lowercase,
                                  'One number': passwordRequirements.number,
                                  'One special character': passwordRequirements.special
                                }).map(([requirement, met]) => (
                                  <motion.div
                                    key={requirement}
                                    className="flex items-center gap-2"
                                    animate={met ? { x: [0, 5, 0] } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <motion.div
                                      animate={{ 
                                        scale: met ? [1, 1.2, 1] : 1,
                                        color: met ? "#22c55e" : "#ef4444"
                                      }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      {met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                    </motion.div>
                                    <span className={met ? "text-green-600" : "text-red-500"}>
                                      {requirement}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Confirm Password Field */}
                      <motion.div 
                        className="space-y-2"
                        whileFocusWithin={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
                            required
                            disabled={loading}
                            className={`pl-10 pr-12 transition-all duration-300 focus:ring-2 focus:ring-primary/20 ${
                              confirmPassword && !passwordsMatch ? 'border-red-500 focus:ring-red-200' : ''
                            }`}
                          />
                          <motion.div
                            className="absolute left-3 top-1/2 transform -translate-y-1/2"
                            animate={focusedField === 'confirmPassword' ? { 
                              scale: [1, 1.2, 1],
                              color: passwordsMatch ? "hsl(var(--primary))" : "#ef4444"
                            } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                          <motion.button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                        </div>

                        {/* Password Match Indicator */}
                        <AnimatePresence>
                          {confirmPassword && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.3 }}
                              className="flex items-center gap-2"
                            >
                              <motion.div
                                animate={{ 
                                  scale: passwordsMatch ? [1, 1.2, 1] : 1,
                                  color: passwordsMatch ? "#22c55e" : "#ef4444"
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                {passwordsMatch ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                              </motion.div>
                              <span className={`text-sm ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
                                {passwordsMatch ? "Passwords match" : "Passwords don't match"}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Submit Button */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          type="submit" 
                          className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                          disabled={loading || !isPasswordValid || !passwordsMatch}
                          size="lg"
                        >
                          {loading ? (
                            <motion.div 
                              className="flex items-center gap-2"
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Creating Account...
                            </motion.div>
                          ) : (
                            <motion.div 
                              className="flex items-center gap-2"
                              whileHover={{ x: 2 }}
                            >
                              <Sparkles className="w-4 h-4" />
                              Create Account
                              <ArrowRight className="w-4 h-4" />
                            </motion.div>
                          )}
                          
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                          />
                        </Button>
                      </motion.div>
                    </form>

                    {/* Divider */}
                    <motion.div 
                      className="relative my-6"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.7 }}
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
                          transition={{ duration: 2.5, repeat: Infinity }}
                        >
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                          >
                            <Play className="w-4 h-4" />
                          </motion.div>
                          Try Demo Mode
                        </motion.div>
                      </Button>
                    </motion.div>

                    {/* Login Link */}
                    <motion.div 
                      className="text-center mt-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <motion.span
                          whileHover={{ scale: 1.05 }}
                          className="inline-block"
                        >
                          <Link 
                            to="/login" 
                            className="text-primary hover:text-primary/80 font-medium transition-colors"
                          >
                            Sign in here
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

export default Signup;