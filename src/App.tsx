import { useState, useEffect } from 'react';
import { Sidebar, type ViewType } from '@/components/Sidebar';
import { LoginPage } from '@/components/LoginPage';
import { DashboardView } from '@/views/DashboardView';
import { OrdersView } from '@/views/OrdersView';
import { TrackingView } from '@/views/TrackingView';
import { AbandonedCartsView } from '@/views/AbandonedCartsView';
import { BotMetricsView } from '@/views/BotMetricsView';
import { SystemStatusView } from '@/views/SystemStatusView';
import { InboxView } from '@/views/InboxView';
import { SelfImprovementView } from '@/views/SelfImprovementView';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
        // Si hay error de red, asumir que está autenticado si tiene token
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [API_URL]);

  const handleLogin = (token: string) => {
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
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
