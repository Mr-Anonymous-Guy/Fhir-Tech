import { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Database, 
  Upload, 
  Activity, 
  Shield, 
  Globe, 
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Play,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import NAMASTELogo from '@/components/NAMASTELogo';
import { useDemo } from '@/contexts/DemoContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemo();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const handleTryDemo = () => {
    enterDemoMode();
    navigate('/app');
  };

  const features = [
    {
      icon: Search,
      title: 'Smart Search & Mapping',
      description: 'Search AYUSH and NAMASTE terminologies with intelligent ICD-11 mapping suggestions'
    },
    {
      icon: Database,
      title: 'Comprehensive Database',
      description: 'Access extensive mappings between traditional medicine terms and ICD-11 codes'
    },
    {
      icon: Upload,
      title: 'Bulk Upload',
      description: 'Import large datasets via CSV for efficient batch processing'
    },
    {
      icon: Activity,
      title: 'Audit Trail',
      description: 'Complete activity logging for compliance and quality assurance'
    }
  ];

  const standards = [
    'FHIR R4 Compliant',
    'India EHR Standards 2016',
    'ICD-11 Foundation Entity',
    'Ministry of AYUSH Approved'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary via-background to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Stethoscope className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">NAMASTE</h1>
              <p className="text-xs text-muted-foreground">FHIR Terminology Service</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge variant="secondary" className="text-sm px-4 py-2">
            <Shield className="w-4 h-4 mr-2 inline" />
            Ministry of AYUSH Official Platform
          </Badge>
          
          <NAMASTELogo className="text-5xl md:text-6xl" showSubtext={false} />
          
          <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            FHIR-Compliant Terminology Service
            <br />
            <span className="text-primary">for Traditional Medicine</span>
          </h2>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Seamlessly map AYUSH and NAMASTE terminology to ICD-11 codes. 
            Built for healthcare interoperability and compliance with India EHR Standards.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            >
              Start Mapping Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={handleTryDemo}
              className="text-lg px-8 py-6"
            >
              <Play className="w-5 h-5 mr-2" />
              Try Demo Mode
            </Button>
          </div>
        </div>
      </section>

      {/* Animated Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h3 
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
            Powerful Features for Healthcare Professionals
          </motion.h3>
          <motion.p 
            className="text-muted-foreground text-lg"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Everything you need for accurate terminology mapping
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
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
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
              onHoverStart={() => setHoveredFeature(index)}
              onHoverEnd={() => setHoveredFeature(null)}
            >
              <Card className="p-6 border-border relative overflow-hidden bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm">
                {/* Animated Background Gradient */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
                  animate={hoveredFeature === index ? {
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.1, 1]
                  } : { opacity: 0.3 }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Floating Particles Effect */}
                {hoveredFeature === index && (
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
                  animate={hoveredFeature === index ? {
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.6 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center relative overflow-hidden"
                    animate={hoveredFeature === index ? {
                      boxShadow: ['0 0 0 0 rgba(var(--primary), 0.3)', '0 0 0 10px rgba(var(--primary), 0)', '0 0 0 0 rgba(var(--primary), 0.3)']
                    } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <feature.icon className="w-8 h-8 text-primary relative z-10" />
                    {hoveredFeature === index && (
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
                    animate={hoveredFeature === index ? {
                      x: [0, 3, 0]
                    } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {feature.title}
                  </motion.h4>
                  <motion.p 
                    className="text-muted-foreground text-sm leading-relaxed"
                    animate={hoveredFeature === index ? {
                      opacity: [0.7, 1]
                    } : { opacity: 0.7 }}
                    transition={{ duration: 0.3 }}
                  >
                    {feature.description}
                  </motion.p>
                </div>
                
                {/* Hover Shimmer Effect */}
                {hoveredFeature === index && (
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
                  animate={hoveredFeature === index ? {
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
        
        {/* Statistics Animation */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="grid md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="text-3xl font-bold text-primary"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                25+
              </motion.div>
              <p className="text-sm text-muted-foreground">Sample Mappings</p>
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="text-3xl font-bold text-success"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.4 }}
              >
                3
              </motion.div>
              <p className="text-sm text-muted-foreground">Traditional Systems</p>
            </motion.div>
            <motion.div 
              className="space-y-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.div 
                className="text-3xl font-bold text-accent"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
              >
                95%
              </motion.div>
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Standards Compliance */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-foreground mb-8">
              Built on Industry Standards
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {standards.map((standard, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 bg-background p-4 rounded-lg border border-border"
                >
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-foreground font-medium">{standard}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="max-w-4xl mx-auto p-12 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
          <Globe className="w-16 h-16 text-primary mx-auto mb-6" />
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join healthcare professionals using NAMASTE for accurate, 
            compliant terminology mapping between traditional and modern medicine.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/signup')}
            className="bg-primary hover:bg-primary/90 text-lg px-10 py-6"
          >
            Create Account
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-nav py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-nav-foreground/70 text-sm">
            © 2025 NAMASTE FHIR Terminology Service | Ministry of AYUSH, Government of India
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
