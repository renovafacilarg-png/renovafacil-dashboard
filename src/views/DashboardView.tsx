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
  ShoppingCart
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Métricas en tiempo real de tu negocio
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* System Status */}
      {health && (
        <Card className={health.redis === 'connected' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  health.redis === 'connected' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <Server className={`h-5 w-5 ${health.redis === 'connected' ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    Bot de WhatsApp
                    <span className={`w-2 h-2 rounded-full ${health.redis === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    v{health.version} • Redis: {health.redis === 'connected' ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onViewChange('system')}>
                Ver detalles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales & Orders Overview */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tasa de Éxito del Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={351.86}
                      strokeDashoffset={351.86 * (1 - successRate / 100)}
                      className={successRate >= 95 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-red-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{successRate}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mensajes procesados</span>
                    <span className="font-medium">{metrics.messages_received}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Errores totales</span>
                    <span className={`font-medium ${totalErrors > 0 ? 'text-red-600' : ''}`}>
                      {totalErrors}
                    </span>
                  </div>
                  {totalErrors > 0 && metrics.errors && (
                    <div className="text-sm text-muted-foreground space-y-1">
                      {metrics.errors.ai > 0 && <div>• Errores IA: {metrics.errors.ai}</div>}
                      {metrics.errors.send > 0 && <div>• Errores de envío: {metrics.errors.send}</div>}
                      {metrics.errors.webhook > 0 && <div>• Errores webhook: {metrics.errors.webhook}</div>}
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
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onViewChange('orders')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Buscar Pedido</h3>
                <p className="text-sm text-muted-foreground">Consulta por número de orden</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onViewChange('tracking')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Tracking</h3>
                <p className="text-sm text-muted-foreground">Rastrea envíos de Andreani</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => onViewChange('carts')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Carritos</h3>
                <p className="text-sm text-muted-foreground">Recupera ventas perdidas</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">¿Cómo funciona?</p>
              <p>Este dashboard se conecta directamente a tu bot de WhatsApp y muestra datos reales en tiempo real. Las métricas se actualizan automáticamente cada 30 segundos.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
