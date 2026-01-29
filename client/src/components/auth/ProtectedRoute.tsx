import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUser } from '@/api/auth';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const location = useLocation();
  const { isAuthenticated, user, accessToken, setUser, logout, setLoading } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If we have a token but no user, try to fetch user
      if (accessToken && !user) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch {
          // Token is invalid
          logout();
        }
      }
      setLoading(false);
      setIsChecking(false);
    };

    checkAuth();
  }, [accessToken, user, setUser, logout, setLoading]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, saving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
