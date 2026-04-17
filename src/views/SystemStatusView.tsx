import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Timer,
  AlertTriangle,
  Wifi,
  WifiOff
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

interface ChannelStatus {
  status: 'ok' | 'stale' | 'no_data' | 'pending_meta_review';
  last_activity?: string | null;
  elapsed_human?: string;
  reason?: string;
}

interface IntegrationHealth {
  channels: Record<string, ChannelStatus>;
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: string }> = {
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  messenger: { label: 'Messenger', icon: '📘' },
  instagram: { label: 'Instagram DM', icon: '📷' },
};

function ChannelBadge({ status, reason }: { status: string; reason?: string }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
        <CheckCircle className="h-3 w-3" /> Activo
      </span>
    );
  }
  if (status === 'stale') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
        <AlertTriangle className="h-3 w-3" /> Sin actividad reciente
      </span>
    );
  }
  if (status === 'pending_meta_review') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive" title={reason}>
        <WifiOff className="h-3 w-3" /> OFFLINE — Pendiente App Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
      <Wifi className="h-3 w-3" /> Sin datos
    </span>
  );
}

export function SystemStatusView() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [integrationHealth, setIntegrationHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const [mainRes, intRes] = await Promise.all([
        fetch(`${API_URL}/health`, { headers: getHeaders() }),
        fetch(`${API_URL}/health/integrations`, { headers: getHeaders() }),
      ]);
      if (mainRes.ok) {
        setHealth(await mainRes.json());
        setLastUpdated(new Date());
      } else {
        toast.error('Error al obtener estado del sistema');
      }
      if (intRes.ok) {
        setIntegrationHealth(await intRes.json());
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
  const channels = integrationHealth?.channels || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Estado del Sistema</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de servicios y componentes
            {lastUpdated && (
              <span className="ml-2">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span className="ml-2">Actualizar</span>
        </Button>
      </div>

      {/* Loading skeleton — usa el componente Skeleton para consistencia */}
      {loading && !health && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-5 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      )}

      {health && (
        <>
          {/* Main Status */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    isConnected ? "bg-secondary" : "bg-destructive"
                  )} />
                  <h2 className="text-base font-semibold text-foreground">Bot de WhatsApp</h2>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  isConnected
                    ? "bg-secondary/10 text-secondary"
                    : "bg-destructive/10 text-destructive"
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
                  <span className="text-xs text-muted-foreground">Versión</span>
                  <p className="text-sm text-foreground font-medium">{health.version}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Servicio</span>
                  <p className="text-sm text-foreground font-medium">{health.service}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Redis</span>
                  <p className={cn(
                    "text-sm font-medium",
                    isConnected ? "text-secondary" : "text-destructive"
                  )}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Channels */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Canales de Atención</h3>
            </div>
            <div className="divide-y divide-border">
              {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                const ch = channels[key];
                return (
                  <div key={key} className="flex items-center justify-between py-3 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cfg.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                        {ch?.last_activity && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            Último: {ch.last_activity}
                            {ch.elapsed_human && ` (hace ${ch.elapsed_human})`}
                          </p>
                        )}
                        {ch?.status === 'pending_meta_review' && (
                          <p className="text-xs text-destructive mt-0.5">
                            Verificación de negocio enviada el 01/03/2026 — esperando aprobación Meta
                          </p>
                        )}
                      </div>
                    </div>
                    <ChannelBadge status={ch?.status ?? 'no_data'} reason={ch?.reason} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Inteligencia Artificial</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['IA'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Orders */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Pedidos</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['Pedidos'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tracking */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Tracking</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['Tracking'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Infrastructure */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Infraestructura</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['Infraestructura'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* WhatsApp */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">WhatsApp</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['WhatsApp'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>

            {/* Marketing */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Marketing</h3>
              </div>
              <ul className="divide-y divide-border/50">
                {featureGroups['Marketing'].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Schedulers */}
          {health.schedulers && Object.keys(health.schedulers).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Procesos Automáticos</h3>
              </div>
              <div className="divide-y divide-border/50">
                {Object.entries(health.schedulers).map(([name, scheduler]) => {
                  const label = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  const isRunning = scheduler.running;
                  return (
                    <div key={name} className="flex items-center justify-between py-3 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          isRunning ? "bg-secondary" : "bg-destructive"
                        )} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          {scheduler.last_check && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(scheduler.last_check).toLocaleTimeString('es-AR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {scheduler.stats && (
                          <span className="text-xs text-muted-foreground">{scheduler.stats.sent} enviados</span>
                        )}
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          isRunning
                            ? "bg-secondary/10 text-secondary"
                            : "bg-destructive/10 text-destructive"
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
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Todas las Características</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground"
                >
                  {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Enlaces Útiles</h3>
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
          <XCircle className="h-10 w-10 text-muted-foreground mx-auto" />
          <div className="text-sm text-muted-foreground text-center mt-3">
            <p className="font-medium text-foreground">No se pudo conectar</p>
            <p className="mt-1">Verifica que el bot esté corriendo en {API_URL}</p>
          </div>
        </div>
      )}
    </div>
  );
}
