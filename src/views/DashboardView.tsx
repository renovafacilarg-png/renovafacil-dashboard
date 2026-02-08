import { KPICard } from '@/components/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  TrendingUp,
  Package,
  Truck,
  Users,
  AlertCircle,
  Bot,
  RefreshCw,
  ArrowRight,
  Activity,
  Server,
  DollarSign,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchDashboardSummary, type DashboardSummary } from '@/lib/api';

interface DashboardViewProps {
  onViewChange: (view: 'orders' | 'tracking' | 'carts' | 'bot' | 'system') => void;
}

interface SystemHealth {
  status: string;
  service: string;
  version: string;
  features: string[];
  redis: string;
}

export function DashboardView({ onViewChange }: DashboardViewProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch dashboard summary (includes all metrics)
      try {
        const summaryData = await fetchDashboardSummary();
        setSummary(summaryData);
      } catch (e) {
        console.error('Error fetching summary:', e);
      }

      // Fetch health
      const healthRes = await fetch(`${API_URL}/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al conectar con el servidor', {
        description: 'Verifica que el bot esté corriendo'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = summary?.bot_metrics;
  const totalErrors = metrics?.errors ?
    metrics.errors.ai + metrics.errors.send + metrics.errors.webhook : 0;

  const successRate = metrics?.messages_received ?
    Math.round(((metrics.messages_received - totalErrors) / metrics.messages_received) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Dashboard
            <Sparkles className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas en tiempo real de tu negocio
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchData}
          disabled={loading}
          className="shadow-sm hover:shadow-md transition-shadow"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* System Status */}
      {health && (
        <Card className={`overflow-hidden ${
          health.redis === 'connected'
            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
            : 'border-red-200 bg-gradient-to-r from-red-50 to-orange-50'
        }`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                  health.redis === 'connected'
                    ? 'bg-emerald-500 shadow-emerald-500/30'
                    : 'bg-red-500 shadow-red-500/30'
                }`}>
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    Bot de WhatsApp
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      health.redis === 'connected'
                        ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50'
                        : 'bg-red-500'
                    }`} />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    v{health.version} • Redis: {health.redis === 'connected' ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewChange('system')}
                className="hover:bg-white/50"
              >
                Ver detalles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales & Orders Overview */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4 animate-stagger">
          <KPICard
            title="Ventas Hoy"
            value={formatCurrency(summary.sales.today)}
            subtitle={summary.sales.yesterday > 0 ?
              `Ayer: ${formatCurrency(summary.sales.yesterday)}` :
              'Sin ventas ayer'}
            icon={DollarSign}
            iconClassName="bg-emerald-100"
          />
          <KPICard
            title="Pedidos Hoy"
            value={summary.orders.today}
            subtitle={`${summary.orders.pending} pendientes`}
            icon={Package}
            iconClassName="bg-blue-100"
          />
          <KPICard
            title="Envíos en Tránsito"
            value={summary.tracking.active}
            subtitle={`${summary.tracking.delivered_today} entregados hoy`}
            icon={Truck}
            iconClassName="bg-amber-100"
          />
          <KPICard
            title="Carritos Abandonados"
            value={summary.abandoned_carts.last_24h}
            subtitle={`${summary.abandoned_carts.conversion_rate}% recuperados`}
            icon={ShoppingCart}
            iconClassName="bg-red-100"
          />
        </div>
      )}

      {/* Bot Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <KPICard
              title="Mensajes Hoy"
              value={metrics.messages_received}
              subtitle={`${metrics.messages_sent} enviados`}
              icon={MessageSquare}
              iconClassName="bg-blue-100"
            />
            <KPICard
              title="Respuestas IA"
              value={metrics.ai_responses}
              subtitle="Generadas automáticamente"
              icon={Bot}
              iconClassName="bg-emerald-100"
            />
            <KPICard
              title="Consultas"
              value={metrics.order_queries + metrics.tracking_queries}
              subtitle={`${metrics.order_queries} pedidos • ${metrics.tracking_queries} tracking`}
              icon={Package}
              iconClassName="bg-amber-100"
            />
            <KPICard
              title="Nuevos Usuarios"
              value={metrics.new_users}
              subtitle="Primer contacto hoy"
              icon={Users}
              iconClassName="bg-violet-100"
            />
          </div>

          {/* Success Rate */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Tasa de Éxito del Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="14"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      stroke="currentColor"
                      strokeWidth="14"
                      fill="transparent"
                      strokeDasharray={377}
                      strokeDashoffset={377 * (1 - successRate / 100)}
                      strokeLinecap="round"
                      className={`transition-all duration-1000 ${
                        successRate >= 95 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-red-500'
                      }`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold">{successRate}%</span>
                    <span className="text-xs text-muted-foreground">éxito</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Mensajes procesados</span>
                    <span className="font-semibold text-lg">{metrics.messages_received}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Errores totales</span>
                    <span className={`font-semibold text-lg ${totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {totalErrors}
                    </span>
                  </div>
                  {totalErrors > 0 && metrics.errors && (
                    <div className="text-sm text-muted-foreground pl-3 space-y-1">
                      {metrics.errors.ai > 0 && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Errores IA: {metrics.errors.ai}</div>}
                      {metrics.errors.send > 0 && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Errores de envío: {metrics.errors.send}</div>}
                      {metrics.errors.webhook > 0 && <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Errores webhook: {metrics.errors.webhook}</div>}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="cursor-pointer card-hover group overflow-hidden"
          onClick={() => onViewChange('orders')}
        >
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                <Package className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Buscar Pedido</h3>
                <p className="text-sm text-muted-foreground">Consulta por número de orden</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer card-hover group overflow-hidden"
          onClick={() => onViewChange('tracking')}
        >
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Truck className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Tracking</h3>
                <p className="text-sm text-muted-foreground">Rastrea envíos de Andreani</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer card-hover group overflow-hidden"
          onClick={() => onViewChange('carts')}
        >
          <CardContent className="p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Carritos</h3>
                <p className="text-sm text-muted-foreground">Recupera ventas perdidas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-dashed">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">¿Cómo funciona?</p>
              <p className="text-muted-foreground">Este dashboard se conecta directamente a tu bot de WhatsApp y muestra datos reales en tiempo real. Las métricas se actualizan automáticamente cada 30 segundos.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
