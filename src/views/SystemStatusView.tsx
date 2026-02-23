import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Server,
  Database,
  Bot,
  MessageSquare,
  Truck,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Timer
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL, getHeaders } from '@/lib/api';

interface SchedulerStatus {
  running: boolean;
  last_check?: string;
  delay_minutes?: number;
  template?: string;
  stats?: { sent: number; skipped: number; errors: number };
  [key: string]: unknown;
}

interface SystemHealth {
  status: string;
  service: string;
  version: string;
  features: string[];
  redis: string;
  timestamp: string;
  schedulers?: Record<string, SchedulerStatus>;
}

export function SystemStatusView() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/health`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
        setLastUpdated(new Date());
      } else {
        toast.error('Error al obtener estado del sistema');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const features = health?.features || [];

  const featureGroups = {
    'IA': features.filter(f => f.includes('ai') || f.includes('groq')),
    'Tracking': features.filter(f => f.includes('tracking') || f.includes('andreani')),
    'Pedidos': features.filter(f => f.includes('order') || f.includes('tiendanube')),
    'Infraestructura': features.filter(f => f.includes('redis') || f.includes('limit') || f.includes('retry')),
    'WhatsApp': features.filter(f => f.includes('button') || f.includes('sheet')),
    'Pagos': features.filter(f => f.includes('comprobante')),
    'Marketing': features.filter(f => f.includes('cart') || f.includes('abandoned')),
  };

  const isConnected = health?.redis === 'connected';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estado del Sistema</h1>
          <p className="text-sm text-gray-500">
            Monitoreo de servicios y componentes
            {lastUpdated && (
              <span className="ml-2">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loading} className="text-gray-500 hover:text-gray-900">
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && !health && (
        <div className="space-y-3">
          <div className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-32 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {health && (
        <>
          {/* Main Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-emerald-500" : "bg-red-500"
                  )} />
                  <h2 className="text-base font-semibold text-gray-900">Bot de WhatsApp</h2>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  isConnected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                )}>
                  {isConnected ? (
                    <><CheckCircle className="h-3 w-3" /> Operativo</>
                  ) : (
                    <><XCircle className="h-3 w-3" /> Error</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-gray-500">Versión</span>
                  <p className="text-sm text-gray-900 font-medium">{health.version}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Servicio</span>
                  <p className="text-sm text-gray-900 font-medium">{health.service}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Redis</span>
                  <p className={cn(
                    "text-sm font-medium",
                    isConnected ? "text-emerald-600" : "text-red-600"
                  )}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* AI */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Inteligencia Artificial</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['IA'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Orders */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Pedidos</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['Pedidos'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tracking */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Tracking</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['Tracking'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Infrastructure */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Infraestructura</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['Infraestructura'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">WhatsApp</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['WhatsApp'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Marketing */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Marketing</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {featureGroups['Marketing'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Schedulers */}
          {health.schedulers && Object.keys(health.schedulers).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Procesos Automáticos</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {Object.entries(health.schedulers).map(([name, scheduler]) => {
                  const label = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const isRunning = scheduler.running;
                  return (
                    <div key={name} className="flex items-center justify-between py-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          isRunning ? "bg-emerald-500" : "bg-red-400"
                        )} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          {scheduler.last_check && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(scheduler.last_check).toLocaleTimeString('es-AR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {scheduler.stats && (
                          <span className="text-xs text-gray-500">{scheduler.stats.sent} enviados</span>
                        )}
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          isRunning
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        )}>
                          {isRunning ? 'Activo' : 'Detenido'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Features */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Todas las Características</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Enlaces Útiles</h3>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" asChild>
                <a href={`${API_URL}/metrics`} target="_blank" rel="noopener noreferrer">
                  <Activity className="mr-2 h-4 w-4" />
                  Ver métricas JSON
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`${API_URL}/health`} target="_blank" rel="noopener noreferrer">
                  <Server className="mr-2 h-4 w-4" />
                  Ver health JSON
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </>
      )}

      {!health && !loading && (
        <div>
          <XCircle className="h-10 w-10 text-gray-300 mx-auto" />
          <div className="text-sm text-gray-500 text-center mt-3">
            <p className="font-medium text-gray-700">No se pudo conectar</p>
            <p className="mt-1">Verifica que el bot esté corriendo en {API_URL}</p>
          </div>
        </div>
      )}
    </div>
  );
}
