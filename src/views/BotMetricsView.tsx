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
import { API_URL, getHeaders, fetchConvScores, type ConvScoreSummary } from '@/lib/api';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
  ReferenceLine
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

interface HistoryItem {
  date: string;
  messages_received: number;
  messages_sent: number;
  ai_responses: number;
  order_queries: number;
  tracking_queries: number;
  new_users: number;
}

export function BotMetricsView() {
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [period, setPeriod] = useState('today');
  const [convScores, setConvScores] = useState<ConvScoreSummary | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/metrics`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      } else {
        toast.error('Error al cargar metricas');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${API_URL}/api/metrics/history?days=7`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchHistory();
    fetchConvScores(7).then(setConvScores).catch(() => {});
    const interval = setInterval(fetchMetrics, 120000);
    return () => clearInterval(interval);
  }, []);

  const totalErrors = metrics?.errors ?
    Number(metrics.errors.ai || 0) + Number(metrics.errors.send || 0) + Number(metrics.errors.webhook || 0) : 0;

  const successRate = metrics?.messages_sent ?
    Math.max(0, Math.round(((metrics.messages_sent - (metrics.errors?.send || 0)) / metrics.messages_sent) * 100)) : 100;

  const hasHistoryData = history.some(h => h.messages_received > 0 || h.ai_responses > 0);

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
            Metricas y actividad del asistente virtual
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · Actualizado {lastUpdated.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]" aria-label="Periodo de metricas">
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
            aria-label="Actualizar metricas"
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
                  Respondiendo con GPT-4o · {successRate}% tasa de exito
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
                    <p className="text-xs text-muted-foreground mt-1">Automaticas</p>
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
                    <span className="text-muted-foreground">Errores de envio</span>
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
                  Tasa de Exito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <svg className="w-40 h-40 transform -rotate-90" aria-label={`Tasa de exito: ${successRate}%`}>
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
                      <span className="text-sm text-muted-foreground">exito</span>
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

      {/* Historical Chart — Real Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial (ultimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="h-[280px] flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !hasHistoryData ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium">Sin datos historicos</p>
              <p className="text-sm mt-1">Las metricas apareceran a medida que el bot reciba mensajes</p>
            </div>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} barGap={8}>
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
                  <Bar dataKey="messages_received" fill="#3b82f6" name="Mensajes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ai_responses" fill="#10b981" name="Respuestas IA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Quality Chart */}
      {convScores && convScores.days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-500" />
                Calidad de Conversaciones (7 dias)
              </span>
              <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${
                convScores.trend === 'improving' ? 'bg-green-100 text-green-700' :
                convScores.trend === 'declining' ? 'bg-red-100 text-red-700' :
                convScores.trend === 'stable' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {convScores.trend === 'improving' ? 'Mejorando' :
                 convScores.trend === 'declining' ? 'Declinando' :
                 convScores.trend === 'stable' ? 'Estable' : 'Datos insuficientes'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{Math.round(convScores.overall_avg)}</p>
                <p className="text-xs text-muted-foreground">Score promedio</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">
                  {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.excellent || 0), 0)}
                </p>
                <p className="text-xs text-emerald-600">Excelentes</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.regular || 0), 0)}
                </p>
                <p className="text-xs text-amber-600">Regulares</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.poor || 0), 0)}
                </p>
                <p className="text-xs text-red-600">Malas</p>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={convScores.days}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      try { return format(parseISO(date), 'dd/MM'); } catch { return date; }
                    }}
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis domain={[0, 100]} className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    labelFormatter={(label) => {
                      try { return format(parseISO(label as string), 'dd/MM/yyyy'); } catch { return label; }
                    }}
                    formatter={(value: number) => [`${Math.round(value)}`, 'Score promedio']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Meta', position: 'right', fontSize: 10 }} />
                  <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Alerta', position: 'right', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="avg_score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                    activeDot={{ r: 6 }}
                    name="Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {!metrics && loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Cargando metricas...</p>
        </div>
      )}
    </div>
  );
}
