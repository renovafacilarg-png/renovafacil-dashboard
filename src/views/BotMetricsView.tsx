import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Bot de WhatsApp
            <Bot className="h-5 w-5 text-gray-400" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Metricas y actividad del asistente virtual
            {lastUpdated && (
              <span className="ml-2">
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
            variant="ghost"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            className="text-gray-500 hover:text-gray-900"
            aria-label="Actualizar metricas"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Status Card */}
      {metrics && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Bot Activo
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-sm text-gray-500">
                Respondiendo con GPT-4o · {successRate}% tasa de exito
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">Operativo</span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            {/* Mensajes */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mensajes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.messages_received}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {metrics.messages_sent} enviados
              </p>
            </div>

            {/* Respuestas IA */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Respuestas IA</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.ai_responses}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Automaticas
              </p>
            </div>

            {/* Pedidos */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.order_queries}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Package className="h-3 w-3" />
                Consultas
              </p>
            </div>

            {/* Tracking */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Tracking</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.tracking_queries}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Seguimientos
              </p>
            </div>

            {/* Nuevos usuarios */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Nuevos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.new_users}</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Usuarios hoy
              </p>
            </div>
          </div>

          {/* Errors & Success Rate */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Errors */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm font-semibold text-gray-900">Errores</p>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Errores IA</span>
                  <span className="text-sm text-gray-900 font-medium">{metrics.errors.ai}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Errores de envio</span>
                  <span className="text-sm text-gray-900 font-medium">{metrics.errors.send}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500">Errores webhook</span>
                  <span className="text-sm text-gray-900 font-medium">{metrics.errors.webhook}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs text-gray-500 font-medium">Total</span>
                  <span className={cn(
                    "text-sm font-bold",
                    totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'
                  )}>
                    {totalErrors}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Tasa de Exito</p>
              </div>
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
                      className="text-gray-100"
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
                      className={cn(
                        "transition-all duration-1000",
                        successRate >= 95 ? 'text-emerald-500' : successRate >= 80 ? 'text-amber-500' : 'text-red-500'
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">{successRate}%</span>
                    <span className="text-xs text-gray-500">exito</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500">
                {metrics.messages_sent - (metrics.errors?.send || 0)} de {metrics.messages_sent} mensajes enviados correctamente
              </p>
            </div>
          </div>
        </>
      )}

      {/* Historical Chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-900 mb-4">Historial (ultimos 7 dias)</p>
        {loadingHistory ? (
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : !hasHistoryData ? (
          <div className="h-64 flex flex-col items-center justify-center">
            <Activity className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center font-medium">Sin datos historicos</p>
            <p className="text-sm text-gray-500 text-center mt-1">Las metricas apareceran a medida que el bot reciba mensajes</p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="messages_received" fill="#3b82f6" name="Mensajes" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ai_responses" fill="#10b981" name="Respuestas IA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Conversation Quality Chart */}
      {convScores && Array.isArray(convScores.days) && convScores.days.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Calidad de Conversaciones (7 dias)</p>
            </div>
            <span className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              convScores.trend === 'improving' ? 'bg-green-50 text-green-700' :
              convScores.trend === 'declining' ? 'bg-red-50 text-red-700' :
              convScores.trend === 'stable' ? 'bg-blue-50 text-blue-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {convScores.trend === 'improving' ? 'Mejorando' :
               convScores.trend === 'declining' ? 'Declinando' :
               convScores.trend === 'stable' ? 'Estable' : 'Datos insuficientes'}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-2xl font-bold text-gray-900">{Math.round(convScores.overall_avg)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Score promedio</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">
                {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.excellent || 0), 0)}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Excelentes</p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-2xl font-bold text-amber-700">
                {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.regular || 0), 0)}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Regulares</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-2xl font-bold text-red-700">
                {convScores.days.reduce((acc, d) => acc + (d.tier_distribution?.poor || 0), 0)}
              </p>
              <p className="text-xs text-red-600 mt-0.5">Malas</p>
            </div>
          </div>

          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convScores.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
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
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
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
        </div>
      )}

      {/* Loading State */}
      {!metrics && loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">Cargando metricas...</p>
        </div>
      )}
    </div>
  );
}
