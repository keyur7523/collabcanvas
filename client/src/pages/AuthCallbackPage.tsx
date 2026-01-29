import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUser } from '@/api/auth';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, setUser, logout } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!accessToken || !refreshToken) {
        setError('Missing authentication tokens');
        return;
      }

      // Set tokens in store
      setTokens(accessToken, refreshToken);

      try {
        // Fetch user info
        const user = await getCurrentUser();
        setUser(user);

        // Check for pending invite
        const pendingInvite = sessionStorage.getItem('pending-invite');
        if (pendingInvite) {
          sessionStorage.removeItem('pending-invite');
          navigate(`/invite/${pendingInvite}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
        logout();
        setError('Failed to complete authentication');
      }
    };

    handleCallback();
  }, [searchParams, setTokens, setUser, logout, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-error"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text mb-2">
            Authentication Failed
          </h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-accent hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Completing sign in...</p>
      </div>
    </div>
  );
}
