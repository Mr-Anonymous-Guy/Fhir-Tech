import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  Settings, 
  LogOut, 
  Play, 
  Power,
  Sun,
  Moon,
  Monitor,
  Bell,
  Shield,
  Database,
  Download,
  HelpCircle,
  ChevronRight,
  X,
  Palette
} from 'lucide-react';

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isDemoMode, exitDemoMode } = useDemo();
  const { theme, setTheme, actualTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(3);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/auth');
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const menuItems = [
    {
      icon: Settings,
      label: 'Settings',
      description: 'Account & preferences',
      action: () => console.log('Settings')
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: `${notifications} unread`,
      badge: notifications,
      action: () => console.log('Notifications')
    },
    {
      icon: Shield,
      label: 'Security',
      description: 'Password & privacy',
      action: () => console.log('Security')
    },
    {
      icon: Database,
      label: 'Data Management',
      description: 'Export & sync',
      action: () => console.log('Data Management')
    },
    {
      icon: Download,
      label: 'Downloads',
      description: 'Generated FHIR files',
      action: () => console.log('Downloads')
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Documentation & contact',
      action: () => console.log('Help')
    }
  ];

  // Animation variants
  const sidebarVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        staggerChildren: 0.1,
        staggerDirection: -1
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        staggerChildren: 0.1,
        staggerDirection: 1
      }
    }
  };

  const itemVariants = {
    closed: {
      x: 50,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    },
    open: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25
      }
    }
  };

  const backdropVariants = {
    closed: {
      opacity: 0,
      backdropFilter: 'blur(0px)',
      transition: {
        duration: 0.2
      }
    },
    open: {
      opacity: 1,
      backdropFilter: 'blur(8px)',
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Animated Backdrop */}
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={backdropVariants}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Animated Sidebar */}
          <motion.div 
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            className="fixed top-0 right-0 h-full w-80 bg-background/95 backdrop-blur-xl border-l border-border/50 shadow-2xl z-50"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex flex-col h-full">
              {/* Animated Header */}
              <motion.div 
                variants={itemVariants}
                className="p-6 border-b border-border/50"
              >
                <motion.div 
                  className="flex items-center justify-between mb-4"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                >
                  <motion.h2 
                    className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Profile
                  </motion.h2>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </motion.div>
                
                {/* Animated User Info */}
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                >
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative overflow-hidden"
                    whileHover={{ scale: 1.05 }}
                    animate={{ 
                      boxShadow: ['0 0 0 0 rgba(var(--primary), 0.3)', '0 0 0 10px rgba(var(--primary), 0)', '0 0 0 0 rgba(var(--primary), 0.3)'] 
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <motion.div
                      animate={{ rotate: isDemoMode ? [0, 360] : 0 }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      {isDemoMode ? (
                        <Play className="w-6 h-6 text-primary" />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    className="flex-1"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                  >
                    <motion.h3 
                      className="font-semibold"
                      whileHover={{ scale: 1.02 }}
                    >
                      {isDemoMode ? 'Demo User' : (user?.user_metadata?.full_name || 'User')}
                    </motion.h3>
                    <motion.p 
                      className="text-sm text-muted-foreground"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {isDemoMode ? 'Exploring with sample data' : user?.email}
                    </motion.p>
                  </motion.div>
                </motion.div>

                {/* Animated Demo Mode Badge */}
                <AnimatePresence>
                  {isDemoMode && (
                    <motion.div 
                      className="mt-3"
                      initial={{ scale: 0, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0, y: -10 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <motion.div
                        animate={{ 
                          scale: [1, 1.02, 1],
                          boxShadow: ['0 0 0 0 rgba(var(--primary), 0.2)', '0 0 0 4px rgba(var(--primary), 0.1)', '0 0 0 0 rgba(var(--primary), 0.2)']
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Badge variant="secondary" className="w-full justify-center bg-gradient-to-r from-primary/10 to-primary/5">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            <Play className="w-3 h-3 mr-1" />
                          </motion.div>
                          Demo Mode Active
                        </Badge>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Animated Content */}
              <motion.div 
                className="flex-1 overflow-y-auto p-6 space-y-6"
                variants={itemVariants}
              >
                {/* Animated Theme Selection */}
                <motion.div 
                  className="space-y-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                >
                  <motion.div 
                    className="flex items-center gap-2"
                    whileHover={{ x: 5 }}
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    >
                      <Palette className="w-4 h-4" />
                    </motion.div>
                    <h4 className="font-medium">Appearance</h4>
                  </motion.div>
                  <motion.div 
                    className="grid grid-cols-3 gap-2"
                    variants={{
                      show: {
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                  >
                    {themeOptions.map(({ value, label, icon: Icon }, index) => (
                      <motion.div
                        key={value}
                        variants={{
                          hidden: { scale: 0, rotate: -180 },
                          show: { scale: 1, rotate: 0 }
                        }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          transition: { type: 'spring', stiffness: 400 }
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={theme === value ? 'default' : 'outline'}
                          size="sm"
                          className="flex flex-col gap-1 h-auto py-3 relative overflow-hidden"
                          onClick={() => setTheme(value as any)}
                        >
                          <motion.div
                            animate={theme === value ? { 
                              rotateY: [0, 360],
                              scale: [1, 1.1, 1]
                            } : {}}
                            transition={{ duration: 0.6 }}
                          >
                            <Icon className="w-4 h-4" />
                          </motion.div>
                          <span className="text-xs">{label}</span>
                          {theme === value && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            />
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                  <motion.p 
                    className="text-xs text-muted-foreground"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    Current: {actualTheme === 'dark' ? 'Dark' : 'Light'} mode
                  </motion.p>
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                >
                  <Separator />
                </motion.div>

                {/* Animated Menu Items */}
                <motion.div 
                  className="space-y-2"
                  variants={{
                    show: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                  initial="hidden"
                  animate="show"
                >
                  {menuItems.map((item, index) => (
                    <motion.div
                      key={index}
                      variants={{
                        hidden: { x: 50, opacity: 0, scale: 0.9 },
                        show: { 
                          x: 0, 
                          opacity: 1, 
                          scale: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 400,
                            damping: 25
                          }
                        }
                      }}
                      whileHover={{ 
                        scale: 1.02, 
                        x: 5,
                        transition: { type: 'spring', stiffness: 400 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      onHoverStart={() => setHoveredItem(index)}
                      onHoverEnd={() => setHoveredItem(null)}
                    >
                      <Card 
                        className="cursor-pointer relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm"
                        style={{
                          boxShadow: hoveredItem === index 
                            ? '0 8px 32px rgba(var(--primary), 0.15), 0 0 0 1px rgba(var(--primary), 0.1)'
                            : '0 2px 8px rgba(0, 0, 0, 0.04)'
                        }}
                        onClick={item.action}
                      >
                        <CardContent className="p-4 relative">
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                              <motion.div 
                                className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center relative overflow-hidden"
                                animate={hoveredItem === index ? {
                                  scale: [1, 1.1, 1],
                                  rotate: [0, 5, -5, 0]
                                } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                <motion.div
                                  animate={hoveredItem === index ? { y: [0, -2, 0] } : {}}
                                  transition={{ duration: 0.6, repeat: Infinity }}
                                >
                                  <item.icon className="w-5 h-5 text-primary" />
                                </motion.div>
                                {hoveredItem === index && (
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 2, ease: 'linear' }}
                                  />
                                )}
                              </motion.div>
                              <div>
                                <motion.h5 
                                  className="font-medium"
                                  animate={hoveredItem === index ? { x: [0, 2, 0] } : {}}
                                  transition={{ duration: 0.3 }}
                                >
                                  {item.label}
                                </motion.h5>
                                <motion.p 
                                  className="text-sm text-muted-foreground"
                                  animate={hoveredItem === index ? { opacity: [0.7, 1] } : { opacity: 0.7 }}
                                >
                                  {item.description}
                                </motion.p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <AnimatePresence>
                                {item.badge && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ 
                                      scale: 1,
                                      y: [0, -1, 0]
                                    }}
                                    transition={{ 
                                      scale: { type: 'spring', stiffness: 400 },
                                      y: { duration: 1, repeat: Infinity }
                                    }}
                                  >
                                    <Badge variant="destructive" className="text-xs">
                                      {item.badge}
                                    </Badge>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <motion.div
                                animate={hoveredItem === index ? { x: [0, 3, 0] } : {}}
                                transition={{ duration: 0.4, repeat: Infinity }}
                              >
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </motion.div>
                            </div>
                          </div>
                          {hoveredItem === index && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 1.5, ease: 'linear' }}
                            />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Animated Footer Actions */}
              <motion.div 
                className="p-6 border-t border-border/50 space-y-3 bg-gradient-to-t from-background/80 to-transparent backdrop-blur-sm"
                variants={itemVariants}
              >
                {isDemoMode ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleExitDemo}
                      variant="destructive"
                      className="w-full flex items-center gap-2 relative overflow-hidden bg-gradient-to-r from-destructive to-destructive/80"
                    >
                      <motion.div
                        animate={{ rotate: [0, 90, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Power className="w-4 h-4" />
                      </motion.div>
                      <span>Exit Demo Mode</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleLogout}
                      variant="destructive"
                      className="w-full flex items-center gap-2 relative overflow-hidden"
                    >
                      <motion.div
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <LogOut className="w-4 h-4" />
                      </motion.div>
                      Logout
                    </Button>
                  </motion.div>
                )}
                
                <motion.div 
                  className="text-center space-y-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.p 
                    className="text-xs text-muted-foreground font-medium"
                    animate={{ 
                      opacity: [0.6, 1, 0.6],
                      scale: [1, 1.01, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    NAMASTE-SYNC v1.0.0
                  </motion.p>
                  <motion.p 
                    className="text-xs text-muted-foreground"
                    animate={{ opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 5, repeat: Infinity }}
                  >
                    Ministry of AYUSH, Government of India
                  </motion.p>
                  <motion.div
                    className="w-8 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mt-2"
                    animate={{ 
                      opacity: [0, 1, 0],
                      scaleX: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileSidebar;