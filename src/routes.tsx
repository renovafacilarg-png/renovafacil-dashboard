import { createBrowserRouter, redirect, Outlet, Navigate, useRouteError, type LoaderFunctionArgs } from 'react-router';
import { lazy, Suspense } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { Toaster } from '@/components/ui/sonner';

// ── Lazy loader with stale-chunk auto-reload ─────────────────────────────────
// After a Vercel deploy, old cached HTML may reference chunks that no longer exist.
// This wrapper detects that case and reloads the page once to get fresh assets.
function lazyWithReload<T extends React.ComponentType>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err: Error) => {
      const isChunkError =
        err?.message?.includes('dynamically imported module') ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('Loading chunk');
      if (isChunkError && !sessionStorage.getItem('chunk_reloaded')) {
        sessionStorage.setItem('chunk_reloaded', '1');
        window.location.reload();
        return new Promise(() => {});  // suspend while reloading
      }
      throw err;
    })
  );
}

// ── Route-level error boundary ────────────────────────────────────────────────
function RouteError() {
  const error = useRouteError() as Error | null;
  const isChunkError =
    error?.message?.includes('dynamically imported module') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('Loading chunk');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {isChunkError ? 'Nueva versión disponible' : 'Error al cargar la vista'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isChunkError
            ? 'El panel se actualizó. Recargá para ver la versión más reciente.'
            : error?.message || 'Ocurrió un error inesperado.'}
        </p>
      </div>
      <button
        onClick={() => { sessionStorage.removeItem('chunk_reloaded'); window.location.reload(); }}
        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Recargar
      </button>
    </div>
  );
}

// Lazy-loaded views — lazyWithReload handles stale chunk errors after deploy
const InboxView = lazyWithReload(() => import('@/views/InboxView').then(m => ({ default: m.InboxView })));
const PipelineView = lazyWithReload(() => import('@/views/PipelineView').then(m => ({ default: m.PipelineView })));
const ReEngagementView = lazyWithReload(() => import('@/views/ReEngagementView').then(m => ({ default: m.ReEngagementView })));
const OrdersView = lazyWithReload(() => import('@/views/OrdersView').then(m => ({ default: m.OrdersView })));
const TrackingView = lazyWithReload(() => import('@/views/TrackingView').then(m => ({ default: m.TrackingView })));
const ComprobantesView = lazyWithReload(() => import('@/views/ComprobantesView').then(m => ({ default: m.ComprobantesView })));
const FacebookCommentsView = lazyWithReload(() => import('@/views/FacebookCommentsView').then(m => ({ default: m.FacebookCommentsView })));
const SystemStatusView = lazyWithReload(() => import('@/views/SystemStatusView').then(m => ({ default: m.SystemStatusView })));
const MejorasView = lazyWithReload(() => import('@/views/MejorasView').then(m => ({ default: m.MejorasView })));
const SettingsView = lazyWithReload(() => import('@/views/SettingsView').then(m => ({ default: m.SettingsView })));

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
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/inbox" replace /> },
      { path: 'inbox', element: <InboxView channel="wa" /> },
      { path: 'pipeline', element: <PipelineView /> },
      { path: 're-engagement', element: <ReEngagementView /> },
      { path: 'mejoras', element: <MejorasView /> },
      { path: 'orders', element: <OrdersView /> },
      { path: 'tracking', element: <TrackingView /> },
      { path: 'comprobantes', element: <ComprobantesView /> },
      { path: 'facebook', element: <FacebookCommentsView /> },
      { path: 'system', element: <SystemStatusView /> },
      { path: 'settings', element: <SettingsView /> },
    ],
  },
]);
