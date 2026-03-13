import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type OrderStatus = 'open' | 'closed' | 'cancelled' | 'pending' | 'paid' | 'refunded';
export type ShippingStatus = 'unpacked' | 'packed' | 'shipped' | 'delivered' | 'in_transit' | 'preparation' | 'transit' | 'branch';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
export type ComprobanteStatus = 'pending' | 'verified' | 'rejected';
export type PipelineStatus = 'nuevo' | 'interesado' | 'link_enviado' | 'pago' | 'entregado' | 'recurrente';

interface StatusBadgeProps {
  status: OrderStatus | ShippingStatus | PaymentStatus | ComprobanteStatus | PipelineStatus;
  type?: 'order' | 'shipping' | 'payment' | 'comprobante' | 'pipeline';
  className?: string;
}

const statusConfig = {
  // Order statuses
  open: { label: 'Abierto', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  closed: { label: 'Cerrado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  pending: { label: 'Pendiente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },

  // Shipping statuses
  unpacked: { label: 'En preparación', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  packed: { label: 'Empaquetado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  shipped: { label: 'Despachado', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  delivered: { label: 'Entregado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  in_transit: { label: 'En tránsito', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  preparation: { label: 'En preparación', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  transit: { label: 'En tránsito', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  branch: { label: 'En sucursal', className: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },

  // Payment statuses
  paid: { label: 'Pagado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  refunded: { label: 'Reembolsado', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },

  // Comprobante statuses
  verified: { label: 'Verificado', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rechazado', className: 'bg-red-500/10 text-red-400 border-red-500/20' },

  // Pipeline client states
  nuevo: { label: 'Nuevo', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  interesado: { label: 'Interesado', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  link_enviado: { label: 'Link enviado', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  pago: { label: 'Pagó', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  entregado: { label: 'Entregado', className: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  recurrente: { label: 'Recurrente', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
