import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/LoadingSpinner';
import { AnimatedSection, AnimatedCard, FloatingBadge } from '@/components/PageTransition';
import { motion } from 'framer-motion';
import {
  Search,
  Database,
  Upload,
  Activity,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  Play
} from 'lucide-react';

interface DashboardStats {
  totalMappings: number;
  categories: { [key: string]: number };
  recentSearches: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

const Dashboard = () => {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredAction, setHoveredAction] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasMounted = useRef(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Always set loading to true when this effect runs
      setLoading(true);
      setStats(null); // Clear previous stats
      
      try {
        console.log('Dashboard: Loading data...');
        const [mappingsData, auditData] = await Promise.all([
          enhancedFhirService.getAllMappings({}, 1, 1000),
          enhancedFhirService.getAuditLog(1, 100)
        ]);
        
        const categoryCount: { [key: string]: number } = {};
        mappingsData.mappings.forEach(mapping => {
          categoryCount[mapping.category] = (categoryCount[mapping.category] || 0) + 1;
        });

        const recentSearches = auditData.entries.filter(
          entry => entry.action === 'search' && 
          new Date(entry.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length;

        const newStats = {
          totalMappings: mappingsData.total,
          categories: categoryCount,
          recentSearches,
          systemStatus: 'healthy' as const
        };
        
        console.log('Dashboard: Data loaded successfully', newStats);
        setStats(newStats);
      } catch (error) {
        console.error('Dashboard: Failed to load data:', error);
        setStats({
          totalMappings: 0,
          categories: {},
          recentSearches: 0,
          systemStatus: 'error'
        });
      } finally {
        setLoading(false);
        hasMounted.current = true;
      }
    };

    // Load data immediately when component mounts or refreshTrigger changes
    loadDashboardData();

    // Return cleanup function that resets hasMounted when component unmounts
    return () => {
      // Reset hasMounted on unmount to ensure proper loading when returning to dashboard
      hasMounted.current = false;
    };
  }, [refreshTrigger]); // Re-run when refresh is triggered
  
  // Effect to handle component focus/visibility and location changes
  useEffect(() => {
    // Force refresh when component mounts
    setRefreshTrigger(prev => prev + 1);
    
    const handleFocus = () => {
      console.log('Dashboard: Window focused, refreshing data');
      setRefreshTrigger(prev => prev + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Dashboard: Page became visible, refreshing data');
        setRefreshTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Search & Map Terms',
      description: 'Find NAMASTE to ICD-11 mappings',
      icon: Search,
      href: '/app/search',
      variant: 'medical' as const,
      color: 'text-primary'
    },
    {
      title: 'Browse All Mappings',
      description: 'View complete terminology database',
      icon: Database,
      href: '/app/mappings',
      variant: 'default' as const,
      color: 'text-accent'
    },
    {
      title: 'Bulk Upload',
      description: 'Process multiple terms at once',
      icon: Upload,
      href: '/app/bulk-upload',
      variant: 'success' as const,
      color: 'text-success'
    },
    {
      title: 'Audit Trail',
      description: 'Review system activity logs',
      icon: Activity,
      href: '/app/audit',
      variant: 'info' as const,
      color: 'text-info'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <AlertTriangle className="w-5 h-5 text-destructive" />;
    }
  };

  return (
    <motion.div 
key="dashboard-main" // Stable key
      className="space-y-6 animated-bg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <AnimatedSection className="flex items-center justify-between">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            Welcome, {isDemoMode ? 'Demo User' : (user?.user_metadata?.full_name || user?.email)}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {isDemoMode ? (
              <>
                <motion.div
                  className="inline-block"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Play className="inline w-4 h-4 mr-1" />
                </motion.div>
                Exploring with sample data - Create an account to save your work
              </>
            ) : (
              'FHIR R4-compliant terminology service for traditional Indian medicine'
            )}
          </motion.p>
        </motion.div>
      </AnimatedSection>

      {/* Statistics Cards */}
      <AnimatedSection>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={{
            animate: {
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          <AnimatedCard 
            delay={0.1}
            className="shadow-dark-card hover:shadow-dark-elevated transition-all duration-300 dark:glass-card dark:hover:dark-glow-primary"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: 'easeInOut'
                  }}
                >
                  <Database className="h-4 w-4 text-primary" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                >
                  {stats?.totalMappings || 0}
                </motion.div>
                <FloatingBadge className="text-xs text-muted-foreground mt-1">
                  NAMASTE ⟷ ICD-11 mappings
                </FloatingBadge>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard 
            delay={0.2}
            className="shadow-dark-card hover:shadow-dark-elevated transition-all duration-300 dark:glass-card dark:hover:dark-glow-success"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  <TrendingUp className="h-4 w-4 text-success" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                >
                  {stats?.recentSearches || 0}
                </motion.div>
                <FloatingBadge delay={0.2} className="text-xs text-muted-foreground mt-1">
                  Last 24 hours
                </FloatingBadge>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard 
            delay={0.3}
            className="shadow-dark-card hover:shadow-dark-elevated transition-all duration-300 dark:glass-card"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                >
                  {getStatusIcon(stats?.systemStatus || 'healthy')}
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
                >
                  Healthy
                </motion.div>
                <FloatingBadge delay={0.3} className="text-xs text-muted-foreground mt-1">
                  All services operational
                </FloatingBadge>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard 
            delay={0.4}
            className="shadow-dark-card hover:shadow-dark-elevated transition-all duration-300 dark:glass-card dark:hover:dark-glow-accent"
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active User</CardTitle>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                >
                  <Users className="h-4 w-4 text-info" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="text-2xl font-bold text-info"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                >
                  Live
                </motion.div>
                <FloatingBadge delay={0.4} className="text-xs text-muted-foreground mt-1">
                  {user?.email}
                </FloatingBadge>
              </CardContent>
            </Card>
          </AnimatedCard>
        </motion.div>
      </AnimatedSection>

      {/* Category Distribution */}
      <AnimatedSection>
        <AnimatedCard delay={0.9} className="shadow-dark-card dark:glass-card">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <BarChart3 className="w-5 h-5 text-primary" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 }}
                >
                  Category Distribution
                </motion.span>
              </CardTitle>
              <CardDescription>
                Distribution of mappings across traditional medicine systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && Object.entries(stats.categories).map(([category, count], index) => {
                const percentage = (count / stats.totalMappings) * 100;
                return (
                  <motion.div 
                    key={category} 
                    className="space-y-2"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + (index * 0.1) }}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <FloatingBadge delay={1.3 + (index * 0.1)} className="text-muted-foreground">
                        {count} mappings
                      </FloatingBadge>
                    </div>
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 1.4 + (index * 0.1), duration: 0.8 }}
                      style={{ transformOrigin: 'left' }}
                    >
                      <Progress value={percentage} className="h-2" />
                    </motion.div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </AnimatedCard>
      </AnimatedSection>

      {/* Quick Actions with Welcome-style Animations */}
      <AnimatedSection>
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <motion.h2 
            className="text-3xl font-bold text-foreground mb-4"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
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
            Quick Actions
          </motion.h2>
          <motion.p 
            className="text-muted-foreground text-lg"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Access all NAMASTE-SYNC features from here
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                duration: 0.6
              }
            }
          }}
          initial="hidden"
          animate="visible"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              variants={{
                hidden: { opacity: 0, y: 50, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    duration: 0.6
                  }
                }
              }}
              whileHover={{
                y: -10,
                scale: 1.05,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              onHoverStart={() => setHoveredAction(index)}
              onHoverEnd={() => setHoveredAction(null)}
            >
              <Card className="p-6 border-border relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm h-full">
                {/* Animated Background Gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
                  animate={hoveredAction === index ? {
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.1, 1]
                  } : { opacity: 0.3 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Floating Particles Effect */}
                {hoveredAction === index && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                          y: [0, -20, 0],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Icon with Animation */}
                <motion.div
                  className="relative z-10 mb-4"
                  animate={hoveredAction === index ? {
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center relative overflow-hidden"
                    animate={hoveredAction === index ? {
                      boxShadow: ['0 0 0 0 rgba(var(--primary), 0.3)', '0 0 0 10px rgba(var(--primary), 0)', '0 0 0 0 rgba(var(--primary), 0.3)']
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <action.icon className="w-8 h-8 text-primary relative z-10" />
                    {hoveredAction === index && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </motion.div>
                
                {/* Content */}
                <div className="relative z-10">
                  <motion.h4 
                    className="text-xl font-semibold text-foreground mb-2"
                    animate={hoveredAction === index ? {
                      x: [0, 3, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {action.title}
                  </motion.h4>
                  <motion.p 
                    className="text-muted-foreground text-sm leading-relaxed mb-4"
                    animate={hoveredAction === index ? {
                      opacity: [0.7, 1]
                    } : { opacity: 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    {action.description}
                  </motion.p>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      asChild 
                      variant={action.variant} 
                      className="w-full"
                    >
                      <Link to={action.href}>
                        <motion.span
                          animate={{
                            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          Get Started
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
                
                {/* Hover Shimmer Effect */}
                {hoveredAction === index && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                )}
                
                {/* Success Indicator */}
                <motion.div
                  className="absolute top-4 right-4"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={hoveredAction === index ? {
                    scale: [0, 1.2, 1],
                    opacity: [0, 1, 1]
                  } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-success/20 to-success/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* System Information */}
      <AnimatedSection>
        <AnimatedCard delay={1.5} className="shadow-dark-card dark:glass-card">
          <Card className="border-0 bg-transparent shadow-none">
            <CardHeader>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  >
                    <Shield className="w-5 h-5 text-primary" />
                  </motion.div>
                  System Information
                </CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.7 }}
              >
                <h4 className="font-semibold text-primary mb-2">Standards Compliance</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• FHIR R4 Specification</li>
                  <li>• India EHR Standards 2016</li>
                  <li>• ICD-11 TM2 + Biomedicine</li>
                  <li>• NAMASTE Terminology</li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
              >
                <h4 className="font-semibold text-primary mb-2">Supported Systems</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Ayurveda Medicine</li>
                  <li>• Siddha Medicine</li>
                  <li>• Unani Medicine</li>
                  <li>• Modern Biomedicine</li>
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.9 }}
              >
                <h4 className="font-semibold text-primary mb-2">Features</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Dual Coding Support</li>
                  <li>• FHIR Bundle Generation</li>
                  <li>• Bulk Processing</li>
                  <li>• Audit Logging</li>
                </ul>
              </motion.div>
            </CardContent>
          </Card>
        </AnimatedCard>
      </AnimatedSection>
    </motion.div>
  );
};

export default Dashboard;