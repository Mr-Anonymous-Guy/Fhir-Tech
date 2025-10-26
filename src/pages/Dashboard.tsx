import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import LoadingSpinner from '@/components/LoadingSpinner';
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
  Play,
  RefreshCw
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
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load data when component mounts OR when location changes (navigation)
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        console.log('Dashboard: Loading data...', new Date().toISOString());
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
      }
    };

    loadDashboardData();
  }, [location.pathname, refreshKey]); // Re-run when navigation occurs or refresh is triggered

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await enhancedFhirService.forceRefresh();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      variant: 'default' as const
    },
    {
      title: 'Browse All Mappings',
      description: 'View complete terminology database',
      icon: Database,
      href: '/app/mappings',
      variant: 'secondary' as const
    },
    {
      title: 'Bulk Upload',
      description: 'Process multiple terms at once',
      icon: Upload,
      href: '/app/bulk-upload',
      variant: 'default' as const
    },
    {
      title: 'Audit Trail',
      description: 'Review system activity logs',
      icon: Activity,
      href: '/app/audit',
      variant: 'outline' as const
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section with Animations */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.h1 
            className="text-3xl font-bold text-foreground"
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
            transition={{ duration: 3, repeat: Infinity }}
          >
            Welcome, {isDemoMode ? 'Demo User' : (user?.user_metadata?.full_name || user?.email)}
          </motion.h1>
          <motion.p 
            className="text-muted-foreground mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {isDemoMode ? (
              <>
                <Play className="inline w-4 h-4 mr-1" />
                Exploring with sample data - Create an account to save your work
              </>
            ) : (
              'FHIR R4-compliant terminology service for traditional Indian medicine'
            )}
          </motion.p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Statistics Cards with Animations */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <motion.div
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
              <Database className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold text-primary"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.5
                }}
              >
                {stats?.totalMappings || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                NAMASTE ⟷ ICD-11 mappings
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.6
                }}
              >
                {stats?.recentSearches || 0}
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              {getStatusIcon(stats?.systemStatus || 'healthy')}
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.7
                }}
              >
                Healthy
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                All services operational
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active User</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-2xl font-bold text-blue-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: 0.8
                }}
              >
                Live
              </motion.div>
              <p className="text-xs text-muted-foreground mt-1">
                {user?.email}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Category Distribution with Animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Category Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && Object.entries(stats.categories).map(([category, count], index) => {
              const percentage = (count / stats.totalMappings) * 100;
              return (
                <motion.div 
                  key={category} 
                  className="space-y-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">
                      {count} mappings
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions with Animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <motion.h2 
          className="text-2xl font-bold text-foreground mb-4"
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
          transition={{ duration: 3, repeat: Infinity, delay: 0.6 }}
        >
          Quick Actions
        </motion.h2>
        <motion.p 
          className="text-muted-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          Access all NAMASTE-SYNC features from here
        </motion.p>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              whileHover={{ 
                y: -10,
                scale: 1.03,
                transition: { type: "spring", stiffness: 300 }
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
            >
              <Card className="p-6">
                <motion.div 
                  className="mb-4"
                  whileHover={{ 
                    scale: 1.1,
                    transition: { duration: 0.2 }
                  }}
                >
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <action.icon className="w-8 h-8 text-primary" />
                  </div>
                </motion.div>
                
                <motion.h4 
                  className="text-xl font-semibold text-foreground mb-2"
                  whileHover={{ 
                    x: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  {action.title}
                </motion.h4>
                <motion.p 
                  className="text-muted-foreground text-sm leading-relaxed mb-4"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {action.description}
                </motion.p>
                
                <Button asChild variant={action.variant} className="w-full">
                  <Link to={action.href}>
                    Get Started
                  </Link>
                </Button>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* System Information with Animations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
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
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
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
      </motion.div>
    </div>
  );
};

export default Dashboard;