import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  MessageSquare,
  Server,
  ChevronLeft,
  ChevronRight,
  Menu,
  Inbox
} from 'lucide-react';
import { useState } from 'react';

export type ViewType = 'dashboard' | 'orders' | 'tracking' | 'carts' | 'bot' | 'inbox' | 'system';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inbox', label: 'Bandeja de Entrada', icon: Inbox },
  { id: 'orders', label: 'Buscar Pedido', icon: Package },
  { id: 'tracking', label: 'Tracking', icon: Truck },
  { id: 'carts', label: 'Carritos', icon: ShoppingCart },
  { id: 'bot', label: 'Bot WhatsApp', icon: MessageSquare },
  { id: 'system', label: 'Sistema', icon: Server },
];

export function Sidebar({ currentView, onViewChange, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RF</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-semibold text-sm">Renovafacil</h1>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  collapsed && 'justify-center px-2',
                  isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                )}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {!collapsed && (
        <div className="p-4 border-t">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-medium mb-1">Conexión</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Bot activo</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 bg-background border-r transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
