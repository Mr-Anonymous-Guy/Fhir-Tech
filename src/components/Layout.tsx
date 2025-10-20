import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import Header from './Header';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';
import DemoBanner from './DemoBanner';
import { PageTransition } from './PageTransition';

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const { isDemoMode } = useDemo();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading FHIR Terminology Service..." />
      </div>
    );
  }

  // Allow access if authenticated OR in demo mode
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        {isDemoMode && <DemoBanner />}
        <main className="flex-1 p-6 relative overflow-hidden">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
};

export default Layout;