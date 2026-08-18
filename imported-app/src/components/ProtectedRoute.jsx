import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, getUserRole } from '../lib/auth';
import toast from 'react-hot-toast';

function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        
        if (!user) {
          toast.error('Please login to access this page');
          setLoading(false);
          return;
        }

        const role = await getUserRole(user.id);
        setUserRole(role);
        
        if (!allowedRoles.includes(role)) {
          toast.error('You do not have permission to access this page');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        toast.error('Authentication failed');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wood-600"></div>
      </div>
    );
  }

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
