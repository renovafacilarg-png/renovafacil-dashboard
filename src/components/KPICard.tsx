import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * KPICard — métrica de dashboard.
 * Variant colors usan tokens semánticos, no clases hardcodeadas:
 *   success  → secondary (verde salvia)
 *   warning  → warning (dorado ámbar)
 *   danger   → destructive (rojo quemado)
 *   default  → muted
 */
export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: KPICardProps) {
  const variantStyles: Record<string, { container: string; icon: string; trend: string }> = {
    default: {
      container: 'bg-muted/60',
      icon: 'text-muted-foreground',
      trend: '',
    },
    success: {
      container: 'bg-secondary/10',
      icon: 'text-secondary',
      trend: 'text-secondary',
    },
    warning: {
      container: 'bg-warning/10',
      icon: 'text-warning',
      trend: 'text-warning',
    },
    danger: {
      container: 'bg-destructive/10',
      icon: 'text-destructive',
      trend: 'text-destructive',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 transition-colors hover:border-primary/20',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {/* Icon container — p-2.5 y h-5 w-5 para mayor presencia visual */}
        <div className={cn('p-2.5 rounded-lg', styles.container)}>
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="text-3xl font-bold text-foreground tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {/* Lucide icons instead of unicode arrows */}
          <span className={cn(
            'flex items-center gap-0.5 text-xs font-semibold',
            trend.positive
              ? (variant === 'default' ? 'text-secondary' : styles.trend || 'text-secondary')
              : 'text-destructive'
          )}>
            {trend.positive
              ? <TrendingUp className="h-3.5 w-3.5" />
              : <TrendingDown className="h-3.5 w-3.5" />
            }
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
