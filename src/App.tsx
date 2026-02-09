import { useState } from 'react';
import { Sidebar, type ViewType } from '@/components/Sidebar';
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

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          currentView={currentView} 
          onViewChange={setCurrentView} 
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
