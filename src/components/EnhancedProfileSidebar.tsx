import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  LogOut,
  Play,
  Shield,
  Bell,
  Database,
  HelpCircle,
  Download,
  Settings,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Lock,
  Activity,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

interface SecuritySession {
  sessionId: string;
  device: string;
  location: string;
  lastActivity: string;
  current: boolean;
}

const EnhancedProfileSidebar = ({ isOpen, onClose }: EnhancedProfileSidebarProps) => {
  const { user, logout } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // State for different sections
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Animation values
  const springConfig = { damping: 25, stiffness: 300 };
  const sidebarX = useSpring(isOpen ? 0 : 400, springConfig);

  // Load profile data
  useEffect(() => {
    if (isOpen && !isDemoMode) {
      loadProfileData();
    } else if (isOpen && isDemoMode) {
      loadDemoData();
    }
  }, [isOpen, isDemoMode]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      // Mock API calls - replace with actual backend calls
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      
      setNotifications([
        {
          id: '1',
          title: 'Welcome to NAMASTE-SYNC',
          message: 'Your account has been successfully verified.',
          type: 'success',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'System Update',
          message: 'New FHIR mapping features are now available.',
          type: 'info',
          read: true,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setSecuritySessions([
        {
          sessionId: '1',
          device: 'Windows PC - Chrome',
          location: 'New Delhi, India',
          lastActivity: 'Active now',
          current: true
        },
        {
          sessionId: '2',
          device: 'Mobile - Safari',
          location: 'Mumbai, India',
          lastActivity: '2 hours ago',
          current: false
        }
      ]);

      setUnreadCount(1);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDemoData = () => {
    setNotifications([
      {
        id: 'demo-1',
        title: 'Demo Mode Active',
        message: 'You are exploring NAMASTE-SYNC with sample data.',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      }
    ]);
    setUnreadCount(1);
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemoMode();
      navigate('/');
      toast.success('Exited Demo Mode');
    } else {
      await logout();
      navigate('/');
      toast.success('Logged out successfully');
    }
    onClose();
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  const handleDownload = (type: 'json' | 'csv') => {
    toast.success(`Downloading data as ${type.toUpperCase()}...`);
    // Implement actual download logic
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    open: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', damping: 25, stiffness: 300 }
    },
    closed: {
      x: 50,
      opacity: 0
    }
  };

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor
  };

  const ThemeIcon = themeIcons[theme];

  const sections = [
    { id: 'overview', label: 'Overview', icon: User, color: 'text-primary' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-red-500', badge: securitySessions.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-blue-500', badge: unreadCount },
    { id: 'data', label: 'Data Management', icon: Database, color: 'text-green-500' },
    { id: 'support', label: 'Help & Support', icon: HelpCircle, color: 'text-purple-500' },
    { id: 'downloads', label: 'Downloads', icon: Download, color: 'text-orange-500' }
  ];

  const renderOverviewSection = () => (
    <motion.div variants={itemVariants} className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {isDemoMode ? (
                  <Play className="w-6 h-6 text-primary" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <CardTitle className="text-lg">
                {isDemoMode ? 'Demo User' : (user?.user_metadata?.full_name || user?.email)}
              </CardTitle>
              <CardDescription>
                {isDemoMode ? 'Exploring with sample data' : 'FHIR Terminology Service User'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemoMode && (
            <motion.div
              className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              animate={{ boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 20px rgba(59, 130, 246, 0.3)', '0 0 0 rgba(59, 130, 246, 0)'] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Demo Mode Active</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Create an account to save your work and access advanced features
              </p>
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Active</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">System Status</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Online</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Connection</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Quick Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <ThemeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <div className="flex space-x-1">
              {(['light', 'dark', 'system'] as const).map((t) => {
                const Icon = themeIcons[t];
                return (
                  <Button
                    key={t}
                    variant={theme === t ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleThemeChange(t)}
                    className="w-8 h-8 p-0"
                  >
                    <Icon className="w-3 h-3" />
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSecuritySection = () => (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Shield className="w-4 h-4 text-red-500" />
            <span>Active Sessions</span>
          </CardTitle>
          <CardDescription>Manage your login sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-40">
            <div className="space-y-3">
              {securitySessions.map((session, index) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border ${
                    session.current ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3 h-3" />
                        <span className="text-sm font-medium">{session.device}</span>
                        {session.current && <Badge variant="outline" className="text-xs">Current</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {session.location} • {session.lastActivity}
                      </p>
                    </div>
                    {!session.current && (
                      <Button variant="destructive" size="sm" className="text-xs">
                        Terminate
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderNotificationsSection = () => (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-blue-500" />
              <span>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <Badge variant="default" className="animate-pulse">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-60">
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'
                  }`}
                  onClick={() => !notification.read && markNotificationRead(notification.id)}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.read ? 'bg-muted-foreground' : 'bg-primary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderDataSection = () => (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Database className="w-4 h-4 text-green-500" />
            <span>Data Management</span>
          </CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-500 mb-2" />
              <p className="text-sm font-medium">Search History</p>
              <p className="text-xs text-muted-foreground">24 queries</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-green-500 mb-2" />
              <p className="text-sm font-medium">Saved Mappings</p>
              <p className="text-xs text-muted-foreground">12 items</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('json')}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data (JSON)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('csv')}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderSupportSection = () => (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-purple-500" />
            <span>Help & Support</span>
          </CardTitle>
          <CardDescription>Get help and submit feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Documentation
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Report Issue
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Zap className="w-4 h-4 mr-2" />
            Feature Request
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderDownloadsSection = () => (
    <motion.div variants={itemVariants} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Download className="w-4 h-4 text-orange-500" />
            <span>Downloads</span>
          </CardTitle>
          <CardDescription>Download your data and reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => handleDownload('json')}
              className="w-full justify-start"
            >
              <Download className="w-4 h-4 mr-2" />
              Complete Data Export (JSON)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload('csv')}
              className="w-full justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              Search History (CSV)
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'security':
        return renderSecuritySection();
      case 'notifications':
        return renderNotificationsSection();
      case 'data':
        return renderDataSection();
      case 'support':
        return renderSupportSection();
      case 'downloads':
        return renderDownloadsSection();
      default:
        return renderOverviewSection();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Profile</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </motion.div>

            {/* Navigation */}
            <motion.div variants={itemVariants} className="p-4 border-b border-border">
              <div className="grid grid-cols-3 gap-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => handleSectionChange(section.id)}
                      className={`relative p-3 rounded-lg transition-all ${
                        isActive 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'hover:bg-muted/50'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <div className="relative">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : section.color}`} />
                          {section.badge && section.badge > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                            >
                              {section.badge}
                            </motion.div>
                          )}
                        </div>
                        <span className="text-xs font-medium">{section.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderActiveSection()}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>

            {/* Footer */}
            <motion.div variants={itemVariants} className="p-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isDemoMode ? 'Exit Demo' : 'Logout'}
              </Button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EnhancedProfileSidebar;