import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  MessageCircle,
  Clock,
  TrendingUp,
  CheckCircle,
  Send,
  ExternalLink,
  AlertCircle,
  User,
  Package,
  Loader2,
  RefreshCw
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

export function AbandonedCartsView() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [recoveryLogs, setRecoveryLogs] = useState<RecoveryLog[]>([]);
  const [recoveryResponses, setRecoveryResponses] = useState<RecoveryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [recovering, setRecovering] = useState<number | null>(null);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [dryRun, setDryRun] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/abandoned-carts?hours=48&limit=50`);
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
      const response = await fetch(`${API_URL}/api/recovery-logs?limit=50`);
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
      const response = await fetch(`${API_URL}/api/recovery-responses?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setRecoveryResponses(data.responses || []);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  useEffect(() => {
    fetchCarts();
    fetchRecoveryLogs();
    fetchRecoveryResponses();
  }, []);

  const handleRecover = async (cart: AbandonedCart) => {
    setRecovering(cart.id);
    try {
      const response = await fetch(`${API_URL}/api/abandoned-carts/${cart.id}/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Mensaje de recuperación enviado', {
            description: `WhatsApp enviado a ${cart.contact_name}`
          });
          fetchCarts(); // Refresh list
          fetchRecoveryLogs(); // Refresh logs
        } else {
          toast.info('No se pudo enviar', {
            description: data.message
          });
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 6, dry_run: dryRun, limit: 20 })
      });

      if (response.ok) {
        const data = await response.json();
        if (dryRun) {
          toast.info('Simulación completada', {
            description: `Se enviarían ${data.results.processed} mensajes`
          });
        } else {
          toast.success('Recuperación completada', {
            description: `${data.results.sent} mensajes enviados`
          });
          fetchCarts();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTimeAgo = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() - hours);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const totalValue = carts.reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Carritos Abandonados</h1>
          <p className="text-muted-foreground">
            Recupera ventas perdidas contactando a clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCarts} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={() => setDryRun(!dryRun)} variant={dryRun ? 'outline' : 'default'}>
            {dryRun ? 'Modo: Simulación' : 'Modo: Real'}
          </Button>
          <Button onClick={handleRecoverAll} disabled={loading || carts.length === 0}>
            <Send className="mr-2 h-4 w-4" />
            {dryRun ? 'Simular Todos' : 'Recuperar Todos'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carritos (24h)</p>
                <p className="text-2xl font-bold">{carts.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {carts.length > 0 ? formatCurrency(totalValue / carts.length) : '$0'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : carts.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay carritos abandonados</h3>
          <p className="text-muted-foreground">
            No se encontraron carritos en las últimas 24 horas
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {carts.map((cart) => (
            <Card key={cart.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{cart.contact_name}</h3>
                        <p className="text-sm text-muted-foreground">{cart.contact_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {cart.created_at ? new Date(cart.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : formatTimeAgo(cart.hours_abandoned)}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        hace {cart.hours_abandoned}h
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {cart.products.length} producto(s)
                      </span>
                    </div>

                    <div className="bg-muted rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-2">Productos:</p>
                      <ul className="space-y-1">
                        {cart.products.map((product, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground">
                            • {product.name} {product.quantity > 1 && `(x${product.quantity})`}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg">{formatCurrency(cart.total)}</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={cart.recovery_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver carrito
                          </a>
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedCart(cart)}
                          disabled={recovering === cart.id}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {recovering === cart.id ? 'Enviando...' : 'Recuperar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recovery Logs Section */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mensajes de Recuperación Enviados
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowLogs(!showLogs);
                if (!showLogs) fetchRecoveryLogs();
              }}
            >
              {showLogs ? 'Ocultar' : 'Ver historial'}
            </Button>
          </div>

          {showLogs && (
            <div className="space-y-2">
              {recoveryLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay mensajes de recuperación enviados todavía
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {recoveryLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${log.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.customer_name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${log.success ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {log.success ? 'Enviado' : 'Error'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.products}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Tel: {log.phone_masked}</span>
                        <span>Total: ${log.total}</span>
                        <span>{new Date(log.timestamp).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Responses Section */}
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Clientes que Respondieron
              {recoveryResponses.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
                  {recoveryResponses.length}
                </span>
              )}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowResponses(!showResponses);
                if (!showResponses) fetchRecoveryResponses();
              }}
            >
              {showResponses ? 'Ocultar' : 'Ver respuestas'}
            </Button>
          </div>

          {showResponses && (
            <div className="space-y-2">
              {recoveryResponses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todavía no hay respuestas de clientes
                </p>
              ) : (
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {recoveryResponses.map((resp, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-blue-50 border-blue-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{resp.customer_name}</span>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                          Respondió
                        </span>
                      </div>
                      <div className="bg-white rounded p-2 my-2 border">
                        <p className="text-sm italic">"{resp.response_message}"</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{resp.products}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Tel: {resp.phone_masked}</span>
                        <span>Total: ${resp.total}</span>
                        <span>{new Date(resp.timestamp).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Carrito</DialogTitle>
            <DialogDescription>
              Se enviará un mensaje de WhatsApp a {selectedCart?.contact_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCart && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Productos:</p>
                <ul className="space-y-1">
                  {selectedCart.products.map((product, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      • {product.name} {product.quantity > 1 && `(x${product.quantity})`}
                    </li>
                  ))}
                </ul>
                <div className="border-t mt-3 pt-3">
                  <p className="font-bold">Total: {formatCurrency(selectedCart.total)}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Mensaje de recuperación</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Se enviará un template de WhatsApp aprobado con la información del carrito.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedCart(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleRecover(selectedCart)}
                  disabled={recovering === selectedCart.id}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {recovering === selectedCart.id ? 'Enviando...' : 'Enviar Ahora'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
