import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { acceptInvite } from '@/api/sharing';
import { Button } from '@/components/ui/Button';

export function InvitePage() {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);

  useEffect(() => {
    const handleAccept = async () => {
      if (!inviteId) {
        setStatus('error');
        setError('Invalid invite link');
        return;
      }

      if (!isAuthenticated) {
        // Store invite ID and redirect to login
        sessionStorage.setItem('pending-invite', inviteId);
        navigate('/login');
        return;
      }

      try {
        const result = await acceptInvite(inviteId);
        setBoardId(result.board_id);
        setStatus('success');
        toast.success(result.message);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to accept invite');
      }
    };

    handleAccept();
  }, [inviteId, isAuthenticated, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Joining board...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
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
            Couldn't Join Board
          </h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="bg-surface border border-border rounded-xl p-8 max-w-md text-center">
        <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-text mb-2">
          Successfully Joined!
        </h2>
        <p className="text-text-secondary mb-4">
          You now have access to this board.
        </p>
        <Button onClick={() => navigate(`/board/${boardId}`)}>
          Open Board
        </Button>
      </div>
    </div>
  );
}
