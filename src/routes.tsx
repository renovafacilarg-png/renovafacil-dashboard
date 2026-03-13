import { createBrowserRouter, redirect, Outlet, Navigate, type LoaderFunctionArgs } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { Toaster } from '@/components/ui/sonner';

// Lazy-loaded views (preserves Vite code splitting)
const InboxView = lazy(() => import('@/views/InboxView').then(m => ({ default: m.InboxView })));
const PipelineView = lazy(() => import('@/views/PipelineView').then(m => ({ default: m.PipelineView })));
const ReEngagementView = lazy(() => import('@/views/ReEngagementView').then(m => ({ default: m.ReEngagementView })));
const OrdersView = lazy(() => import('@/views/OrdersView').then(m => ({ default: m.OrdersView })));
const TrackingView = lazy(() => import('@/views/TrackingView').then(m => ({ default: m.TrackingView })));
const ComprobantesView = lazy(() => import('@/views/ComprobantesView').then(m => ({ default: m.ComprobantesView })));
const FacebookCommentsView = lazy(() => import('@/views/FacebookCommentsView').then(m => ({ default: m.FacebookCommentsView })));
const SystemStatusView = lazy(() => import('@/views/SystemStatusView').then(m => ({ default: m.SystemStatusView })));
const SettingsView = lazy(() => import('@/views/SettingsView').then(m => ({ default: m.SettingsView })));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export async function authLoader({ request }: LoaderFunctionArgs) {
  const token = localStorage.getItem('auth_token');
  const expires = localStorage.getItem('auth_expires');

  // No token → go to login
  if (!token) {
    const params = new URLSearchParams();
    params.set('from', new URL(request.url).pathname);
    return redirect('/login?' + params.toString());
  }

  // Expired locally
  if (expires && new Date() > new Date(expires)) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    return redirect('/login');
  }

  // Verify with backend
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    if (!data.valid) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expires');
      return redirect('/login');
    }
  } catch {
    // Network error — let through (offline-tolerant). User will see auth errors in views.
  }

  return null;
}

function DashboardLayout() {
  const handleLogout = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    // Navigate to login by redirecting
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 min-h-screen overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px]">
          <Suspense fallback={<ViewLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage onLogin={() => { window.location.href = '/inbox'; }} />,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    loader: authLoader,
    children: [
      { index: true, element: <Navigate to="/inbox" replace /> },
      { path: 'inbox', element: <InboxView channel="wa" /> },
      { path: 'pipeline', element: <PipelineView /> },
      { path: 're-engagement', element: <ReEngagementView /> },
      { path: 'orders', element: <OrdersView /> },
      { path: 'tracking', element: <TrackingView /> },
      { path: 'comprobantes', element: <ComprobantesView /> },
      { path: 'facebook', element: <FacebookCommentsView /> },
      { path: 'system', element: <SystemStatusView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
]);
