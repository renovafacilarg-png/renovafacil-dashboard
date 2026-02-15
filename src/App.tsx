import { useState, useEffect, lazy, Suspense } from 'react';
import { Sidebar, type ViewType } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { API_URL } from '@/lib/api';
import { Loader2 } from 'lucide-react';

// Lazy load all views — Vite splits them into separate chunks
const DashboardView = lazy(() => import('@/views/DashboardView').then(m => ({ default: m.DashboardView })));
const OrdersView = lazy(() => import('@/views/OrdersView').then(m => ({ default: m.OrdersView })));
const TrackingView = lazy(() => import('@/views/TrackingView').then(m => ({ default: m.TrackingView })));
const AbandonedCartsView = lazy(() => import('@/views/AbandonedCartsView').then(m => ({ default: m.AbandonedCartsView })));
const BotMetricsView = lazy(() => import('@/views/BotMetricsView').then(m => ({ default: m.BotMetricsView })));
const SystemStatusView = lazy(() => import('@/views/SystemStatusView').then(m => ({ default: m.SystemStatusView })));
const InboxView = lazy(() => import('@/views/InboxView').then(m => ({ default: m.InboxView })));
const SelfImprovementView = lazy(() => import('@/views/SelfImprovementView').then(m => ({ default: m.SelfImprovementView })));
const FacebookCommentsView = lazy(() => import('@/views/FacebookCommentsView').then(m => ({ default: m.FacebookCommentsView })));

function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificar token al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const expires = localStorage.getItem('auth_expires');

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Verificar si expiró localmente
      if (expires) {
        const expiresDate = new Date(expires);
        if (new Date() > expiresDate) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_expires');
          setIsAuthenticated(false);
          return;
        }
      }

      // Verificar con el servidor
      try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();

        if (data.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_expires');
          setIsAuthenticated(false);
        }
      } catch {
        // Si hay error de red, mostrar login para que reintente
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expires');
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (_token: string) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('auth_token');

    if (token) {
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(() => {});
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expires');
    setIsAuthenticated(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onViewChange={(view) => setCurrentView(view)} />;
      case 'orders':
        return <OrdersView />;
      case 'tracking':
        return <TrackingView />;
      case 'carts':
        return <AbandonedCartsView />;
      case 'bot':
        return <BotMetricsView />;
      case 'inbox':
        return <InboxView />;
      case 'improvements':
        return <SelfImprovementView />;
      case 'facebook':
        return <FacebookCommentsView />;
      case 'system':
        return <SystemStatusView />;
      default:
        return <DashboardView onViewChange={(view) => setCurrentView(view)} />;
    }
  };

  // Mostrar loading mientras verifica auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mostrar login si no está autenticado
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-screen p-4 lg:p-8",
          "lg:ml-0"
        )}>
          {/* Mobile header spacer */}
          <div className="h-14 lg:hidden" />

          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<ViewLoader />}>
              {renderView()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
