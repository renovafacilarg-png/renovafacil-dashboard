import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type OrderStatus = 'open' | 'closed' | 'cancelled' | 'pending' | 'paid' | 'refunded';
export type ShippingStatus = 'unpacked' | 'packed' | 'shipped' | 'delivered' | 'in_transit' | 'preparation' | 'transit' | 'branch';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type ComprobanteStatus = 'pending' | 'verified' | 'rejected';

interface StatusBadgeProps {
  status: OrderStatus | ShippingStatus | PaymentStatus | ComprobanteStatus;
  type?: 'order' | 'shipping' | 'payment' | 'comprobante';
  className?: string;
}

const statusConfig = {
  // Order statuses
  open: { label: 'Abierto', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  closed: { label: 'Cerrado', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  
  // Shipping statuses
  unpacked: { label: 'En preparación', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  packed: { label: 'Empaquetado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  shipped: { label: 'Despachado', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  delivered: { label: 'Entregado', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  in_transit: { label: 'En tránsito', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  preparation: { label: 'En preparación', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  transit: { label: 'En tránsito', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
  branch: { label: 'En sucursal', className: 'bg-violet-100 text-violet-800 hover:bg-violet-100' },
  
  // Payment statuses
  paid: { label: 'Pagado', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  refunded: { label: 'Reembolsado', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
  
  // Comprobante statuses
  verified: { label: 'Verificado', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
  rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
