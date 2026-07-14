import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from './Spinner';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
    if (loading) return ( 
      <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg)' }}>
        <Spinner size="lg" />
      </div> ); 
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children; 
};
export default GuestRoute;