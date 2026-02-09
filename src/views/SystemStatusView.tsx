import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/health`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHealth(data);
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
    const interval = setInterval(fetchHealth, 30000);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estado del Sistema</h1>
          <p className="text-muted-foreground">
            Monitoreo de servicios y componentes
          </p>
        </div>
        <Button variant="outline" onClick={fetchHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {health && (
        <>
          {/* Main Status */}
          <Card className={health.redis === 'connected' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}>
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                  health.redis === 'connected' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <Server className={`h-10 w-10 ${health.redis === 'connected' ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">Bot de WhatsApp</h2>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      health.redis === 'connected' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {health.redis === 'connected' ? (
                        <><CheckCircle className="h-4 w-4" /> Operativo</>
                      ) : (
                        <><XCircle className="h-4 w-4" /> Error</>
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Versión</span>
                      <p className="font-medium">{health.version}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Servicio</span>
                      <p className="font-medium">{health.service}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Redis</span>
                      <p className={`font-medium ${health.redis === 'connected' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {health.redis === 'connected' ? 'Conectado' : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* AI */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-violet-500" />
                  Inteligencia Artificial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['IA'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Orders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['Pedidos'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tracking */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-amber-500" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['Tracking'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Infrastructure */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-500" />
                  Infraestructura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['Infraestructura'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['WhatsApp'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Marketing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-pink-500" />
                  Marketing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {featureGroups['Marketing'].map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Schedulers */}
          {health.schedulers && Object.keys(health.schedulers).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Procesos Automáticos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(health.schedulers).map(([name, scheduler]) => {
                    const label = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const isRunning = scheduler.running;
                    return (
                      <div key={name} className={`flex items-start gap-3 p-3 rounded-lg border ${isRunning ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                        <div className={`mt-0.5 w-3 h-3 rounded-full flex-shrink-0 ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{label}</p>
                          <p className={`text-xs ${isRunning ? 'text-emerald-700' : 'text-red-700'}`}>
                            {isRunning ? 'Activo' : 'Detenido'}
                          </p>
                          {scheduler.last_check && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(scheduler.last_check).toLocaleTimeString('es-AR')}
                            </p>
                          )}
                          {scheduler.stats && (
                            <p className="text-xs text-muted-foreground">
                              {scheduler.stats.sent} enviados
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Todas las Características
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {features.map((feature, idx) => (
                  <span 
                    key={idx} 
                    className="bg-muted px-3 py-1.5 rounded-full text-sm"
                  >
                    {feature.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces Útiles</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </>
      )}

      {!health && !loading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <XCircle className="h-10 w-10 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">No se pudo conectar</h3>
                <p className="text-red-700 text-sm">Verifica que el bot esté corriendo en {API_URL}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
