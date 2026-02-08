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
  Inbox,
  Zap
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
  badge?: number;
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-lg">RF</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-sidebar-foreground">Renovafacil</h1>
              <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 h-11 font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'sidebar-item-active bg-sidebar-primary/15 text-sidebar-primary hover:bg-sidebar-primary/20'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileOpen(false);
                }}
              >
                <Icon className={cn(
                  "h-5 w-5 shrink-0 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Status Card */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-xl p-4 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-sidebar-primary/10 rounded-full blur-2xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-sidebar-primary" />
                <p className="text-sm font-semibold text-sidebar-foreground">Estado del Bot</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-dot status-dot-online animate-pulse" />
                <span className="text-sm text-sidebar-foreground/80">Activo y respondiendo</span>
              </div>
              <p className="text-xs text-sidebar-foreground/50 mt-2">DeepSeek AI</p>
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 sidebar-gradient border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64',
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
