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

/**
 * StatusBadge — todos los colores via tokens semánticos CSS o paleta brand.
 * Cada badge lleva un dot pequeño para ser más glanceable.
 *
 * Semántica de colores:
 *   success  → secondary (verde salvia)
 *   warning  → warning (dorado ámbar)
 *   danger   → destructive (rojo quemado)
 *   info     → primary (terracota) — para estados activos/new
 *   neutral  → muted — para estados inactivos/preparación
 *   purple   → color exacto para reembolso/recurrente (excepción documentada)
 */

type StatusDot = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface StatusConfig {
  label: string;
  dot: StatusDot;
  /** Clases Tailwind para el badge completo */
  className: string;
}

const statusConfig: Record<string, StatusConfig> = {
  // ── Order statuses ──
  open: {
    label: 'Abierto',
    dot: 'info',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  closed: {
    label: 'Cerrado',
    dot: 'success',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  cancelled: {
    label: 'Cancelado',
    dot: 'danger',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  pending: {
    label: 'Pendiente',
    dot: 'warning',
    className: 'bg-warning/10 text-warning border-warning/20',
  },

  // ── Shipping statuses ──
  unpacked: {
    label: 'En preparación',
    dot: 'neutral',
    className: 'bg-muted text-muted-foreground border-border',
  },
  packed: {
    label: 'Empaquetado',
    dot: 'info',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  shipped: {
    label: 'Despachado',
    dot: 'info',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  delivered: {
    label: 'Entregado',
    dot: 'success',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  in_transit: {
    label: 'En tránsito',
    dot: 'warning',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  preparation: {
    label: 'En preparación',
    dot: 'neutral',
    className: 'bg-muted text-muted-foreground border-border',
  },
  transit: {
    label: 'En tránsito',
    dot: 'warning',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  branch: {
    label: 'En sucursal',
    dot: 'purple',
    // purple: excepción documentada — no hay token semántico para "en sucursal"
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },

  // ── Payment statuses ──
  paid: {
    label: 'Pagado',
    dot: 'success',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  refunded: {
    label: 'Reembolsado',
    dot: 'purple',
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },

  // ── Comprobante statuses ──
  verified: {
    label: 'Verificado',
    dot: 'success',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  rejected: {
    label: 'Rechazado',
    dot: 'danger',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },

  // ── Pipeline client states ──
  nuevo: {
    label: 'Nuevo',
    dot: 'info',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  interesado: {
    label: 'Interesado',
    dot: 'warning',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  link_enviado: {
    label: 'Link enviado',
    dot: 'warning',
    className: 'bg-warning/15 text-warning border-warning/25',
  },
  pago: {
    label: 'Pagó',
    dot: 'success',
    className: 'bg-secondary/10 text-secondary border-secondary/20',
  },
  entregado: {
    label: 'Entregado',
    dot: 'success',
    className: 'bg-secondary/15 text-secondary border-secondary/25',
  },
  recurrente: {
    label: 'Recurrente',
    dot: 'purple',
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  },
};

/** Dot color map → inline style via currentColor heritage */
const dotClass: Record<StatusDot, string> = {
  success: 'bg-secondary',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-primary',
  neutral: 'bg-muted-foreground/50',
  purple: 'bg-purple-500',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    dot: 'neutral' as StatusDot,
    className: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}
    >
      {/* Dot indicador — más glanceable que solo texto */}
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass[config.dot])} />
      {config.label}
    </Badge>
  );
}
