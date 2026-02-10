import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
// Avatar helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
  'bg-pink-500', 'bg-cyan-600', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500',
];

function getInitials(name: string): string {
  if (!name || name.startsWith('Cliente ')) {
    const digits = name?.replace(/\D/g, '') || '';
    return digits.slice(-2) || '??';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('auth_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // ---- Fetchers ----

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/abandoned-carts?hours=48&limit=50`, {
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Carritos Abandonados
          </h1>
          <p className="text-muted-foreground mt-1">
            {carts.length} carritos pendientes &middot; {formatCurrency(totalValue)} en ventas potenciales
          </p>
        </div>
        <Button variant="outline" onClick={() => { fetchCarts(); fetchStats(); fetchRecoveryLogs(); fetchRecoveryResponses(); }} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats row - 4 cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pendientes (48h)</p>
                <p className="text-3xl font-bold mt-1">{carts.length}</p>
                <p className="text-xs text-muted-foreground">{cartsToday} hoy</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Valor total</p>
                <p className="text-3xl font-bold mt-1 text-blue-600">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-muted-foreground">
                  {carts.length > 0 ? `~${formatCurrency(totalValue / carts.length)} promedio` : '-'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Enviados hoy</p>
                <p className="text-3xl font-bold mt-1 text-emerald-600">{stats?.today.sent_ok ?? '-'}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.today.responses ?? 0} respuestas ({stats?.today.response_rate ?? 0}%)
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Send className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Semana</p>
                <p className="text-3xl font-bold mt-1 text-purple-600">{stats?.week.sent_ok ?? '-'}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.week.responses ?? 0} resp. ({stats?.week.response_rate ?? 0}%)
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Pendientes / Enviados / Respuestas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pendientes" className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Pendientes
              {carts.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{carts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="enviados" className="gap-1.5">
              <Send className="h-4 w-4" />
              Enviados
              {recoveryLogs.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{recoveryLogs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="respuestas" className="gap-1.5">
              <MessageCircle className="h-4 w-4" />
              Respuestas
              {recoveryResponses.length > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-xs bg-emerald-500">{recoveryResponses.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'pendientes' && (
            <div className="flex gap-2">
              <Button
                variant={dryRun ? 'outline' : 'default'}
                size="sm"
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
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Cargando carritos...</p>
            </div>
          ) : carts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Sin carritos abandonados</h3>
                <p className="text-sm text-muted-foreground">No hay carritos pendientes en las ultimas 48 horas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {carts.map((cart) => (
                <Card key={cart.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full ${getAvatarColor(cart.contact_phone || String(cart.id))} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-sm font-bold">{getInitials(cart.contact_name)}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{cart.contact_name}</span>
                          <span className="text-xs text-muted-foreground">{cart.contact_phone}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {cart.created_at
                              ? new Date(cart.created_at).toLocaleString('es-AR', {
                                  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                                })
                              : formatTimeAgo(cart.hours_abandoned)}
                          </span>
                          <Badge variant="outline" className="text-xs h-5">
                            hace {Math.round(cart.hours_abandoned)}h
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" />
                            {cart.products.length} {cart.products.length === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                        {/* Compact product list */}
                        <p className="text-xs text-muted-foreground mt-1.5 truncate">
                          {cart.products.map((p) => p.name + (p.quantity > 1 ? ` x${p.quantity}` : '')).join(' · ')}
                        </p>
                      </div>

                      {/* Price + actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <p className="font-bold text-lg whitespace-nowrap">{formatCurrency(cart.total)}</p>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="sm" asChild>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- TAB: Enviados ---- */}
        <TabsContent value="enviados" className="mt-4">
          {recoveryLogs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Sin mensajes enviados</h3>
                <p className="text-sm text-muted-foreground">Los mensajes de recuperacion aparecen aca</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recoveryLogs.map((log, idx) => (
                <Card key={idx} className={log.success ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-red-400'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(log.phone_masked)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{getInitials(log.customer_name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.customer_name}</span>
                          <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs h-5">
                            {log.success ? 'Enviado' : 'Error'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{log.products}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${log.total}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('es-AR', {
                            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---- TAB: Respuestas ---- */}
        <TabsContent value="respuestas" className="mt-4">
          {recoveryResponses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Sin respuestas todavia</h3>
                <p className="text-sm text-muted-foreground">Cuando un cliente responda al mensaje de recuperacion, aparece aca</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recoveryResponses.map((resp, idx) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(resp.phone_masked)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{getInitials(resp.customer_name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{resp.customer_name}</span>
                          <Badge className="text-xs h-5 bg-blue-500">Respondió</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(resp.timestamp).toLocaleString('es-AR', {
                              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {/* Response bubble */}
                        <div className="bg-muted/60 rounded-xl rounded-tl-sm p-3 mb-2">
                          <p className="text-sm">"{resp.response_message}"</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{resp.products}</span>
                          <span>&middot;</span>
                          <span className="font-medium">${resp.total}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recovery Confirmation Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Recuperar Carrito
            </DialogTitle>
            <DialogDescription>
              Se enviará un mensaje de WhatsApp a {selectedCart?.contact_name}
            </DialogDescription>
          </DialogHeader>

          {selectedCart && (
            <div className="space-y-4">
              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(selectedCart.contact_phone || String(selectedCart.id))} flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold">{getInitials(selectedCart.contact_name)}</span>
                </div>
                <div>
                  <p className="font-medium">{selectedCart.contact_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCart.contact_phone}</p>
                </div>
              </div>

              {/* Products */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Productos:</p>
                <ul className="space-y-1">
                  {selectedCart.products.map((product, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex justify-between">
                      <span>
                        {product.name} {product.quantity > 1 && `(x${product.quantity})`}
                      </span>
                      {product.price > 0 && (
                        <span className="font-medium">{formatCurrency(product.price * product.quantity)}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-3 pt-3 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedCart.total)}</span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-700">
                    Se enviara un template de WhatsApp aprobado con la info del carrito.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedCart(null)}>
                  Cancelar
                </Button>
                <Button
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
