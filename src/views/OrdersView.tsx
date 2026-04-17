import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  Search,
  Package,
  Copy,
  MessageSquare,
  Truck,
  ExternalLink
} from 'lucide-react';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from '@/components/ui/empty';
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
        <h1 className="text-2xl font-bold text-foreground">Buscar Pedido</h1>
        <p className="text-sm text-muted-foreground">
          Consulta el estado de un pedido por su número
        </p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ingresa el número de pedido (ej: 12345)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
            />
          </div>
          <Button onClick={searchOrder} disabled={loading}>
            {loading ? (
              <Search className={cn("mr-2 h-4 w-4", loading && "animate-pulse")} />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Buscar
          </Button>
        </div>
      </div>

      {/* Result */}
      {order && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-5 w-5 text-muted-foreground" />
            <div>
              <h2 className="text-xl font-bold text-foreground">Pedido #{order.order_number}</h2>
              <p className="text-sm text-muted-foreground">Información del pedido</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-5 whitespace-pre-wrap text-sm text-foreground mb-6">
            {order.message}
          </div>

          {/* Tracking Button */}
          {order.tracking_url && (
            <div className="mb-6 bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Seguimiento del envío</p>
                    {order.tracking_number && (
                      <p className="text-xs text-muted-foreground">
                        Tracking: {order.tracking_number}
                      </p>
                    )}
                  </div>
                </div>
                <Button asChild size="sm">
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

          <div className="flex gap-2">
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
        </div>
      )}

      {/* Empty state — instrucciones cuando aún no se buscó nada */}
      {!order && !loading && (
        <Empty className="border border-dashed border-border bg-card/50">
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>Buscar un pedido</EmptyTitle>
            <EmptyDescription>
              Ingresá el número de pedido sin el #. Por ejemplo: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-xs">12345</code>
              <br />
              <span className="text-xs mt-2 block">
                El sistema consultará en TiendaNube y mostrará estado, datos del cliente y tracking Andreani.
              </span>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
