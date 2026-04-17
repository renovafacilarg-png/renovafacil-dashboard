import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from '@/components/Logo';
import {
  Package,
  Truck,
  MessageSquare,
  Server,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  Facebook,
  Kanban,
  Send,
  Receipt,
  Sparkles,
  Settings2,
  BarChart2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router';
import { API_URL } from '@/lib/api';
import { IMPROVEMENT_QUERY_KEYS } from '@/views/MejorasView';
import { fetchImprovementStats } from '@/lib/api';

const FRONTEND_VERSION = '2.1.0';

interface SidebarProps {
  onLogout?: () => void;
  className?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { path: '/inbox', label: 'Inbox WA', icon: MessageSquare },
  { path: '/pipeline', label: 'Pipeline', icon: Kanban },
  { path: '/re-engagement', label: 'Re-engagement', icon: Send },
  { path: '/mejoras', label: 'Auto-mejoras', icon: Sparkles },
  { path: '/orders', label: 'Buscar Pedido', icon: Package },
  { path: '/tracking', label: 'Envíos', icon: Truck },
  { path: '/comprobantes', label: 'Comprobantes', icon: Receipt },
  { path: '/facebook', label: 'FB / Instagram', icon: Facebook },
  { path: '/meta-ops', label: 'Meta Ops', icon: BarChart2 },
  { path: '/system', label: 'Sistema', icon: Server },
  { path: '/settings', label: 'Ajustes', icon: Settings2 },
];

export function Sidebar({ onLogout, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const location = useLocation();

  // Badge sincronizado con React Query — se actualiza automáticamente
  // cuando MejorasView aprueba/rechaza sugerencias
  const { data: improvementStats } = useQuery({
    queryKey: IMPROVEMENT_QUERY_KEYS.stats,
    queryFn: fetchImprovementStats,
    refetchInterval: 300_000, // fallback polling cada 5 min
    refetchOnWindowFocus: true,
  });
  const pendingSuggestions = improvementStats?.pending_suggestions ?? 0;

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.version) setBackendVersion(data.version); })
      .catch(() => {});
  }, []);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          {/* Logo SVG monogram */}
          <div className="w-9 h-9 shrink-0 flex items-center justify-center">
            <Logo size={36} className="text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-sidebar-foreground leading-tight">Renovafacil</p>
              <p className="text-[11px] text-sidebar-foreground/50 leading-tight">Admin</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/inbox' && location.pathname === '/');
            const badge = item.path === '/mejoras' ? (pendingSuggestions > 0 ? pendingSuggestions : undefined) : item.badge;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'sidebar-item-active text-sidebar-primary font-semibold'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="flex-1 text-left truncate">{item.label}</span>
                )}
                {!collapsed && badge !== undefined && badge > 0 && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-sidebar-primary/20 text-sidebar-primary">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bot status */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-3 py-3 bg-sidebar-accent rounded-lg">
                        {/* secondary = verde salvia, semántico para "online/activo" */}
            <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">Bot activo · GPT-4o-mini</p>
              <p className="text-[10px] text-sidebar-foreground/40 mt-0.5">Respondiendo mensajes</p>
            </div>
          </div>
        </div>
      )}

      {/* Version */}
      {!collapsed && (
        <div className="px-4 pb-2 flex items-center justify-center gap-1.5 text-[10px] text-sidebar-foreground/30">
          <span>dash v{FRONTEND_VERSION}</span>
          <span>·</span>
          <span className={backendVersion ? 'text-secondary/80' : 'text-destructive/60'}>
            bot {backendVersion ? `v${backendVersion}` : 'offline'}
          </span>
        </div>
      )}

      {/* Logout */}
      {onLogout && (
        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent transition-colors duration-100',
              collapsed && 'justify-center px-2'
            )}
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Cerrar menu' : 'Abrir menu'}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 sidebar-gradient border-r border-sidebar-border transition-all duration-200',
          collapsed ? 'w-[60px]' : 'w-60',
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
