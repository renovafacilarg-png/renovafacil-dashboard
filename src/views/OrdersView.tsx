import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Search,
  Package,
  Copy,
  MessageSquare,
  AlertCircle,
  Loader2,
  Truck,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { API_URL, getHeaders } from '@/lib/api';

interface Order {
  order_number: string;
  message: string;
  tracking_url?: string;
  tracking_number?: string;
  status?: string;
  payment_status?: string;
}

export function OrdersView() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  const searchOrder = async () => {
    if (!orderNumber.trim()) {
      toast.error('Ingresa un número de pedido');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/order/${orderNumber.trim()}`, { headers: getHeaders() });
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else if (response.status === 404) {
        toast.error('Pedido no encontrado');
        setOrder(null);
      } else {
        toast.error('Error al buscar el pedido');
        setOrder(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Buscar Pedido</h1>
        <p className="text-muted-foreground">
          Consulta el estado de un pedido por su número
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ingresa el número de pedido (ej: 12345)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                className="pl-10"
              />
            </div>
            <Button onClick={searchOrder} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {order && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Pedido #{order.order_number}</h2>
                <p className="text-muted-foreground">Información del pedido</p>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4 whitespace-pre-wrap">
              {order.message}
            </div>

            {/* Tracking Button */}
            {order.tracking_url && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Seguimiento del envío</p>
                      {order.tracking_number && (
                        <p className="text-sm text-muted-foreground">
                          Tracking: {order.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button asChild>
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver en Andreani
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(order.message)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar info
              </Button>
              <Button
                variant="outline"
                asChild
              >
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Hola! Te paso la info de tu pedido #${order.order_number}:\n\n${order.message}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Compartir por WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      {!order && !loading && (
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">¿Cómo buscar?</p>
                <p>Ingresa el número de pedido sin el #. Por ejemplo: 12345</p>
                <p className="mt-2">El sistema consultará directamente en TiendaNube y mostrará:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Estado del pedido</li>
                  <li>Información del cliente</li>
                  <li>Tracking de Andreani (si está disponible)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
