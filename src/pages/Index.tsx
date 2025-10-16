import { Navigate } from 'react-router-dom';

const Index = () => {
  // Redirect to dashboard for authenticated users, login for unauthenticated
  return <Navigate to="/" replace />;
};

export default Index;
