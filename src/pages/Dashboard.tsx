import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { fhirService } from '@/services/fhirService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const mappingsData = fhirService.getAllMappings({}, 1, 1000);
        const auditData = fhirService.getAuditLog(1, 100);
        
        const categoryCount: { [key: string]: number } = {};
        mappingsData.mappings.forEach(mapping => {
          categoryCount[mapping.category] = (categoryCount[mapping.category] || 0) + 1;
        });

        const recentSearches = auditData.entries.filter(
          entry => entry.action === 'search' && 
          new Date(entry.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length;

        setStats({
          totalMappings: mappingsData.total,
          categories: categoryCount,
          recentSearches,
          systemStatus: 'healthy'
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {isDemoMode ? 'Demo User' : (user?.user_metadata?.full_name || user?.email)}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isDemoMode ? (
              <>
                <Play className="inline w-4 h-4 mr-1" />
                Exploring with sample data - Create an account to save your work
              </>
            ) : (
              'FHIR R4-compliant terminology service for traditional Indian medicine'
            )}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-medical transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mappings</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.totalMappings || 0}</div>
            <p className="text-xs text-muted-foreground">
              NAMASTE ⟷ ICD-11 mappings
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.recentSearches || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(stats?.systemStatus || 'healthy')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-medical transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active User</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">
              Live
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Category Distribution
          </CardTitle>
          <CardDescription>
            Distribution of mappings across traditional medicine systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && Object.entries(stats.categories).map(([category, count]) => {
            const percentage = (count / stats.totalMappings) * 100;
            return (
              <div key={category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category}</span>
                  <span className="text-muted-foreground">{count} mappings</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="shadow-card hover:shadow-medical transition-all group">
              <CardHeader className="text-center pb-2">
                <div className={`mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button asChild variant={action.variant} className="w-full">
                  <Link to={action.href}>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* System Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-semibold text-primary mb-2">Standards Compliance</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• FHIR R4 Specification</li>
              <li>• India EHR Standards 2016</li>
              <li>• ICD-11 TM2 + Biomedicine</li>
              <li>• NAMASTE Terminology</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Supported Systems</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Ayurveda Medicine</li>
              <li>• Siddha Medicine</li>
              <li>• Unani Medicine</li>
              <li>• Modern Biomedicine</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Features</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Dual Coding Support</li>
              <li>• FHIR Bundle Generation</li>
              <li>• Bulk Processing</li>
              <li>• Audit Logging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;