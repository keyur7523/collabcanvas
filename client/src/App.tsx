import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HomePage } from '@/pages/HomePage';
import { BoardPage } from '@/pages/BoardPage';
import { LoginPage } from '@/pages/LoginPage';
import { AuthCallbackPage } from '@/pages/AuthCallbackPage';
import { InvitePage } from '@/pages/InvitePage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useThemeStore } from '@/stores/themeStore';

function App() {
  // Initialize theme on mount
  const theme = useThemeStore((state) => state.theme);
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && systemDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/board/:boardId"
          element={
            <ProtectedRoute>
              <BoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invite/:inviteId"
          element={
            <ProtectedRoute>
              <InvitePage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
