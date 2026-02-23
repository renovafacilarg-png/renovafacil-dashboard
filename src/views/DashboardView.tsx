import { KPICard } from '@/components/KPICard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  Brain,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchDashboardSummary, fetchHealthStatus, fetchImprovementStats, type DashboardSummary, type ImprovementStats } from '@/lib/api';

interface DashboardViewProps {
  onViewChange: (view: 'orders' | 'tracking' | 'carts' | 'bot' | 'system' | 'improvements') => void;
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
  const [improvementStats, setImprovementStats] = useState<ImprovementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [summaryResult, healthResult, improvementResult] = await Promise.allSettled([
        fetchDashboardSummary(),
        fetchHealthStatus(),
        fetchImprovementStats(),
      ]);

      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value);
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value as unknown as SystemHealth);
      if (improvementResult.status === 'fulfilled') setImprovementStats(improvementResult.value);
      setLastUpdated(new Date());
    } catch (error) {
      void error;
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
    // Refresh every 15 minutes
    const interval = setInterval(fetchData, 900000);
    return () => clearInterval(interval);
  }, []);

  const metrics = summary?.bot_metrics;
  // Errores de procesamiento: solo IA y envío (afectan al usuario)
  const processingErrors = metrics?.errors ?
    Number(metrics.errors.ai || 0) + Number(metrics.errors.send || 0) : 0;
  // Errores de webhook son infraestructura (status updates, etc.), se muestran aparte
  const webhookErrors = metrics?.errors ? Number(metrics.errors.webhook || 0) : 0;

  const successRate = metrics?.messages_received ?
    Math.min(100, Math.round(((metrics.messages_received - processingErrors) / metrics.messages_received) * 100)) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Métricas en tiempo real de tu negocio
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="text-gray-500 hover:text-gray-900"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {/* System Status */}
      {health && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center gap-3">
            <span className={cn(
              "w-2 h-2 rounded-full",
              health.redis === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-red-500'
            )} />
            <div>
              <span className="text-sm font-medium text-gray-900">Bot de WhatsApp</span>
              <span className="ml-2 text-xs text-gray-500">
                v{health.version} · Redis: {health.redis === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('system')}
            className="text-xs text-gray-500"
          >
            Ver detalles <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
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
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-base font-semibold text-gray-900 mb-4">Tasa de Éxito del Bot</p>
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
                    className="text-gray-100"
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
                    className={cn(
                      "transition-all duration-1000",
                      successRate >= 95 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-red-500'
                    )}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{successRate}%</span>
                  <span className="text-xs text-gray-500">éxito</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Mensajes recibidos</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.messages_received}</span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500">Respuestas IA</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.ai_responses}</span>
                </div>
                {processingErrors > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-red-600">Errores de respuesta</span>
                    <span className="text-sm font-semibold text-red-600">{processingErrors}</span>
                  </div>
                )}
                {webhookErrors > 0 && (
                  <div className="text-xs text-gray-500 pt-2.5">
                    {webhookErrors} eventos de webhook con error (no afectan respuestas)
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <div
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors group"
          onClick={() => onViewChange('orders')}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Buscar Pedido</h3>
            <p className="text-xs text-gray-500">Consulta por número de orden</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors group"
          onClick={() => onViewChange('tracking')}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Truck className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Tracking</h3>
            <p className="text-xs text-gray-500">Rastrea envíos de Andreani</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>

        <div
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors group"
          onClick={() => onViewChange('carts')}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Carritos</h3>
            <p className="text-xs text-gray-500">Recupera ventas perdidas</p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* Auto-Mejora Widget */}
      {improvementStats && (
        <div
          className="p-5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-colors group"
          onClick={() => onViewChange('improvements')}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Brain className="h-4 w-4 text-gray-500" />
              Auto-Mejora del Bot
            </span>
            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className={cn(
                "text-xl font-bold",
                improvementStats.pending_suggestions > 0 ? 'text-amber-600' : 'text-gray-900'
              )}>
                {improvementStats.pending_suggestions}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Pendientes</p>
              {improvementStats.pending_suggestions > 0 && (
                <span className="mt-1 inline-block bg-amber-50 text-amber-700 text-[10px] rounded-full px-2 py-0.5">
                  Revisar
                </span>
              )}
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xl font-bold text-emerald-600">{improvementStats.active_mutations}</p>
              <p className="text-xs text-gray-500 mt-0.5">Activas</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{improvementStats.approval_rate}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Aprobación</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
        <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
        <p className="text-sm text-gray-500">
          ¿Cómo funciona? Este dashboard se conecta directamente a tu bot de WhatsApp y muestra datos reales en tiempo real. Las métricas se actualizan automáticamente cada 15 minutos.
        </p>
      </div>
    </div>
  );
}
