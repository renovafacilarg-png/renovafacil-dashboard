import { cn } from '@/lib/utils';
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

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: KPICardProps) {
  const variantColors = {
    default: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 transition-colors',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <div className={cn('p-2 rounded-lg', variantColors[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="text-3xl font-bold text-foreground">
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
          <span className={cn(
            'text-xs font-semibold',
            trend.positive ? 'text-emerald-500' : 'text-destructive'
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
