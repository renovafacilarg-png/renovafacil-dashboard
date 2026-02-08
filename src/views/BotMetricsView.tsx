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
  Activity
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
  Bar
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bot de WhatsApp</h1>
          <p className="text-muted-foreground">
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
          <Button variant="outline" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Status Card */}
      {metrics && (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Bot Activo
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h3>
                <p className="text-muted-foreground">
                  Respondiendo con DeepSeek AI • {successRate}% éxito
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Mensajes</p>
                    <p className="text-2xl font-bold">{metrics.messages_received}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Respuestas IA</p>
                    <p className="text-2xl font-bold text-emerald-600">{metrics.ai_responses}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pedidos</p>
                    <p className="text-2xl font-bold text-blue-600">{metrics.order_queries}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking</p>
                    <p className="text-2xl font-bold text-amber-600">{metrics.tracking_queries}</p>
                  </div>
                  <Truck className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nuevos</p>
                    <p className="text-2xl font-bold text-violet-600">{metrics.new_users}</p>
                  </div>
                  <Users className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Errores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Errores IA</span>
                  <span className="font-medium">{metrics.errors.ai}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Errores de envío</span>
                  <span className="font-medium">{metrics.errors.send}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Errores webhook</span>
                  <span className="font-medium">{metrics.errors.webhook}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className={`font-bold text-lg ${totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {totalErrors}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tasa de Éxito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
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
                  <span className="absolute text-3xl font-bold">{successRate}%</span>
                </div>
                <p className="text-muted-foreground mt-4">
                  {metrics.messages_sent - (metrics.errors?.send || 0)} de {metrics.messages_sent} mensajes enviados
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Historical Chart (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial (últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(parseISO(date), 'dd/MM')}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(label) => format(parseISO(label), 'dd/MM/yyyy')}
                />
                <Bar dataKey="messages" fill="#3b82f6" name="Mensajes" />
                <Bar dataKey="ai_responses" fill="#10b981" name="Respuestas IA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {!metrics && loading && (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
