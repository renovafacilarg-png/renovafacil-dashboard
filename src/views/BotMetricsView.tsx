import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  TrendingUp,
  Package,
  Truck,
  Users,
  AlertCircle,
  RefreshCw,
  Bot,
  Clock,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface BotMetrics {
  date: string;
  messages_received: number;
  messages_sent: number;
  ai_responses: number;
  order_queries: number;
  tracking_queries: number;
  new_users: number;
  errors: {
    ai: number;
    send: number;
    webhook: number;
  };
}

// Mock historical data (esto vendría de una API en el futuro)
const mockHistory = [
  { date: '2025-01-25', messages: 32, ai_responses: 18, orders: 4, tracking: 8 },
  { date: '2025-01-26', messages: 41, ai_responses: 22, orders: 6, tracking: 10 },
  { date: '2025-01-27', messages: 38, ai_responses: 20, orders: 5, tracking: 9 },
  { date: '2025-01-28', messages: 52, ai_responses: 28, orders: 8, tracking: 14 },
  { date: '2025-01-29', messages: 45, ai_responses: 24, orders: 7, tracking: 11 },
  { date: '2025-01-30', messages: 39, ai_responses: 21, orders: 5, tracking: 10 },
  { date: '2025-01-31', messages: 45, ai_responses: 23, orders: 8, tracking: 12 },
];

export function BotMetricsView() {
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        toast.error('Error al cargar métricas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalErrors = metrics?.errors ?
    Number(metrics.errors.ai || 0) + Number(metrics.errors.send || 0) + Number(metrics.errors.webhook || 0) : 0;

  // Calcular tasa de éxito basada en mensajes enviados vs errores de envío
  const successRate = metrics?.messages_sent ?
    Math.max(0, Math.round(((metrics.messages_sent - (metrics.errors?.send || 0)) / metrics.messages_sent) * 100)) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Bot de WhatsApp
            <Zap className="h-6 w-6 text-primary" />
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas y actividad del asistente virtual
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Clock className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Status Card */}
      {metrics && (
        <Card className="overflow-hidden bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Bot Activo
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                </h3>
                <p className="text-muted-foreground">
                  Respondiendo con DeepSeek AI • {successRate}% tasa de éxito
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/60 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Operativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mensajes</p>
                    <p className="text-3xl font-bold mt-1">{metrics.messages_received}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metrics.messages_sent} enviados</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Respuestas IA</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{metrics.ai_responses}</p>
                    <p className="text-xs text-muted-foreground mt-1">Automáticas</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{metrics.order_queries}</p>
                    <p className="text-xs text-muted-foreground mt-1">Consultas</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{metrics.tracking_queries}</p>
                    <p className="text-xs text-muted-foreground mt-1">Seguimientos</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-hover group">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nuevos</p>
                    <p className="text-3xl font-bold text-violet-600 mt-1">{metrics.new_users}</p>
                    <p className="text-xs text-muted-foreground mt-1">Usuarios hoy</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors & Success Rate */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Errors */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  Errores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Errores IA</span>
                    <span className="font-semibold">{metrics.errors.ai}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Errores de envío</span>
                    <span className="font-semibold">{metrics.errors.send}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Errores webhook</span>
                    <span className="font-semibold">{metrics.errors.webhook}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-medium">Total</span>
                      <span className={`font-bold text-xl ${totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {totalErrors}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  Tasa de Éxito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="14"
                        fill="transparent"
                        className="text-muted"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="currentColor"
                        strokeWidth="14"
                        fill="transparent"
                        strokeDasharray={439.82}
                        strokeDashoffset={439.82 * (1 - successRate / 100)}
                        strokeLinecap="round"
                        className={`transition-all duration-1000 ${
                          successRate >= 95 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-red-500'
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold">{successRate}%</span>
                      <span className="text-sm text-muted-foreground">éxito</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  {metrics.messages_sent - (metrics.errors?.send || 0)} de {metrics.messages_sent} mensajes enviados correctamente
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Historical Chart (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial (últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockHistory} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(parseISO(date), 'dd/MM')}
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy')}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="messages" fill="#3b82f6" name="Mensajes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ai_responses" fill="#10b981" name="Respuestas IA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {!metrics && loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando métricas...</p>
        </div>
      )}
    </div>
  );
}
