import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShoppingCart,
  MessageCircle,
  Clock,
  TrendingUp,
  CheckCircle,
  Send,
  ExternalLink,
  AlertCircle,
  Package,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_URL, getHeaders } from '@/lib/api';
import { getInitials, getAvatarColor } from '@/lib/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartProduct {
  name: string;
  quantity: number;
  price: number;
}

interface AbandonedCart {
  id: number;
  contact_name: string;
  contact_phone: string;
  email?: string;
  products: CartProduct[];
  total: number;
  currency: string;
  recovery_url: string;
  created_at: string;
  hours_abandoned: number;
}

interface RecoveryLog {
  timestamp: string;
  checkout_id: number;
  phone_masked: string;
  customer_name: string;
  products: string;
  total: string;
  success: boolean;
}

interface RecoveryResponse {
  timestamp: string;
  checkout_id: number;
  phone_masked: string;
  customer_name: string;
  products: string;
  total: string;
  sent_at: string;
  response_message: string;
}

interface RecoveryStats {
  today: { sent: number; sent_ok: number; responses: number; response_rate: number };
  week: { sent: number; sent_ok: number; responses: number; response_rate: number };
  totals: { sent: number; sent_ok: number; responses: number };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AbandonedCartsView() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);
  const [recoveryResponses, setRecoveryResponses] = useState<RecoveryResponse[]>([]);
  const [stats, setStats] = useState<RecoveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<number | null>(null);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [activeTab, setActiveTab] = useState('pendientes');

  // ---- Fetchers ----

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/abandoned-carts?hours=48&limit=50`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCarts(data.carts || data.abandoned_carts || []);
      } else {
        toast.error('Error al cargar carritos abandonados');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecoveryLogs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/recovery-logs?limit=50`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRecoveryLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchRecoveryResponses = async () => {
    try {
      const response = await fetch(`${API_URL}/api/recovery-responses?limit=50`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setRecoveryResponses(data.responses || []);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/cart-recovery-stats`, {
        headers: getHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchCarts();
    fetchRecoveryLogs();
    fetchRecoveryResponses();
    fetchStats();
  }, []);

  // ---- Actions ----

  const handleRecover = async (cart: AbandonedCart) => {
    setRecovering(cart.id);
    try {
      const response = await fetch(`${API_URL}/api/abandoned-carts/${cart.id}/recover`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ force: false }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Mensaje de recuperación enviado', {
            description: `WhatsApp enviado a ${cart.contact_name}`,
          });
          fetchCarts();
          fetchRecoveryLogs();
        } else {
          toast.info('No se pudo enviar', { description: data.message });
        }
      } else {
        toast.error('Error al enviar recuperación');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setRecovering(null);
      setSelectedCart(null);
    }
  };

  const handleRecoverAll = async () => {
    try {
      const response = await fetch(`${API_URL}/recover-carts`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ hours: 6, dry_run: dryRun, limit: 20 }),
      });
      if (response.ok) {
        const data = await response.json();
        if (dryRun) {
          toast.info('Simulación completada', {
            description: `Se enviarían ${data.results.processed} mensajes`,
          });
        } else {
          toast.success('Recuperación completada', {
            description: `${data.results.sent} mensajes enviados`,
          });
          fetchCarts();
          fetchRecoveryLogs();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  // ---- Helpers ----

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);

  const formatTimeAgo = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);
  const cartsToday = carts.filter((c) => c.hours_abandoned <= 24).length;

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carritos Abandonados</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {carts.length} carritos pendientes &middot; {formatCurrency(totalValue)} en ventas potenciales
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-900"
          onClick={() => { fetchCarts(); fetchStats(); fetchRecoveryLogs(); fetchRecoveryResponses(); }}
          disabled={loading}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
          Actualizar
        </Button>
      </div>

      {/* Stats row - 4 mini-cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Pendientes (48h)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{carts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">{cartsToday} hoy</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Valor total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {carts.length > 0 ? `~${formatCurrency(totalValue / carts.length)} promedio` : '-'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Enviados hoy</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.today.sent_ok ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats?.today.responses ?? 0} respuestas ({stats?.today.response_rate ?? 0}%)
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">Semana</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.week.sent_ok ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats?.week.responses ?? 0} resp. ({stats?.week.response_rate ?? 0}%)
          </p>
        </div>
      </div>

      {/* Tabs: Pendientes / Enviados / Respuestas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pendientes" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Pendientes
              {carts.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ml-1">
                  {carts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="enviados" className="gap-1.5">
              <Send className="h-4 w-4" />
              Enviados
              {recoveryLogs.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ml-1">
                  {recoveryLogs.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="respuestas" className="gap-1.5">
              <MessageCircle className="h-4 w-4" />
              Respuestas
              {recoveryResponses.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ml-1">
                  {recoveryResponses.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'pendientes' && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'text-gray-500 hover:text-gray-900',
                  !dryRun && 'text-gray-900 bg-gray-100'
                )}
                onClick={() => setDryRun(!dryRun)}
              >
                {dryRun ? 'Simulación' : 'Modo Real'}
              </Button>
              <Button size="sm" onClick={handleRecoverAll} disabled={loading || carts.length === 0}>
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {dryRun ? 'Simular Todos' : 'Recuperar Todos'}
              </Button>
            </div>
          )}
        </div>

        {/* ---- TAB: Pendientes ---- */}
        <TabsContent value="pendientes" className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">Cargando carritos...</p>
            </div>
          ) : carts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sin carritos abandonados</h3>
              <p className="text-sm text-gray-500">No hay carritos pendientes en las ultimas 48 horas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {carts.map((cart) => (
                <div
                  key={cart.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full ${getAvatarColor(cart.contact_phone || String(cart.id))} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-white text-sm font-bold">{getInitials(cart.contact_name)}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{cart.contact_name}</span>
                        <span className="text-xs text-gray-500">{cart.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {cart.created_at
                            ? new Date(cart.created_at).toLocaleString('es-AR', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                              })
                            : formatTimeAgo(cart.hours_abandoned)}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                          hace {Math.round(cart.hours_abandoned)}h
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {cart.products.length} {cart.products.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                      {/* Compact product list */}
                      <div className="space-y-1 mt-2">
                        {cart.products.map((p, idx) => (
                          <p key={idx} className="text-sm text-gray-600">
                            {p.name}{p.quantity > 1 ? ` x${p.quantity}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(cart.total)}
                      </p>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="text-gray-500" asChild>
                          <a href={cart.recovery_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedCart(cart)}
                          disabled={recovering === cart.id}
                        >
                          {recovering === cart.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <MessageCircle className="mr-1.5 h-4 w-4" />
                              Recuperar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- TAB: Enviados ---- */}
        <TabsContent value="enviados" className="mt-4">
          {recoveryLogs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sin mensajes enviados</h3>
              <p className="text-sm text-gray-500">Los mensajes de recuperacion aparecen aca</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {recoveryLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 p-4">
                  <div
                    className={`w-9 h-9 rounded-full ${getAvatarColor(log.phone_masked)} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white text-xs font-bold">{getInitials(log.customer_name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{log.customer_name}</span>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          log.success
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        )}
                      >
                        {log.success ? 'Enviado' : 'Error'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{log.products}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">${log.total}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- TAB: Respuestas ---- */}
        <TabsContent value="respuestas" className="mt-4">
          {recoveryResponses.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Sin respuestas todavia</h3>
              <p className="text-sm text-gray-500">Cuando un cliente responda al mensaje de recuperacion, aparece aca</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recoveryResponses.map((resp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div
                    className={`w-9 h-9 rounded-full ${getAvatarColor(resp.phone_masked)} flex items-center justify-center flex-shrink-0`}
                  >
                    <span className="text-white text-xs font-bold">{getInitials(resp.customer_name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{resp.customer_name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        Respondio
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {new Date(resp.timestamp).toLocaleString('es-AR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {/* Response bubble */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-tl-sm p-3 mb-2">
                      <p className="text-sm text-gray-700">"{resp.response_message}"</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{resp.products}</span>
                      <span>&middot;</span>
                      <span className="font-medium text-gray-900">${resp.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recovery Confirmation Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <MessageCircle className="h-5 w-5" />
              Recuperar Carrito
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Se enviará un mensaje de WhatsApp a {selectedCart?.contact_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-4">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full ${getAvatarColor(selectedCart.contact_phone || String(selectedCart.id))} flex items-center justify-center`}
                >
                  <span className="text-white text-sm font-bold">{getInitials(selectedCart.contact_name)}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedCart.contact_name}</p>
                  <p className="text-sm text-gray-500">{selectedCart.contact_phone}</p>
                </div>
              </div>

              {/* Products */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Productos:</p>
                <ul className="space-y-1">
                  {selectedCart.products.map((product, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex justify-between">
                      <span>
                        {product.name} {product.quantity > 1 && `(x${product.quantity})`}
                      </span>
                      {product.price > 0 && (
                        <span className="font-medium text-gray-900">
                          {formatCurrency(product.price * product.quantity)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Total</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedCart.total)}
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Se enviara un template de WhatsApp aprobado con la info del carrito.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-gray-500 hover:text-gray-900"
                  onClick={() => setSelectedCart(null)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRecover(selectedCart)}
                  disabled={recovering === selectedCart.id}
                >
                  {recovering === selectedCart.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Ahora
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
