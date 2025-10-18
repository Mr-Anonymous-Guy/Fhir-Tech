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
  Play
} from 'lucide-react';
import NAMASTELogo from '@/components/NAMASTELogo';
import { useDemo } from '@/contexts/DemoContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { enterDemoMode } = useDemo();

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
              onClick={() => navigate('/auth')}
            >
              Login
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
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
              onClick={() => navigate('/auth')}
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

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Powerful Features for Healthcare Professionals
          </h3>
          <p className="text-muted-foreground text-lg">
            Everything you need for accurate terminology mapping
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-border"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h4>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
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
            onClick={() => navigate('/auth')}
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
          <p className="text-nav-foreground/50 text-xs mt-2">
            Made by CodeMorph
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
