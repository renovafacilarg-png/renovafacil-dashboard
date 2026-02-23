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
  iconClassName?: string;
  variant?: 'default' | 'gradient' | 'glow';
}

const iconColorMap: Record<string, { bg: string; text: string }> = {
  'bg-emerald-100': { bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600' },
  'bg-blue-100':    { bg: 'bg-blue-50 text-blue-600',       text: 'text-blue-600' },
  'bg-amber-100':   { bg: 'bg-amber-50 text-amber-600',     text: 'text-amber-600' },
  'bg-red-100':     { bg: 'bg-red-50 text-red-600',         text: 'text-red-600' },
  'bg-violet-100':  { bg: 'bg-violet-50 text-violet-600',   text: 'text-violet-600' },
  'bg-primary/10':  { bg: 'bg-primary/10 text-primary',     text: 'text-primary' },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: KPICardProps) {
  const iconColors = iconColorMap[iconClassName || 'bg-primary/10'] || iconColorMap['bg-primary/10'];

  return (
    <div className={cn(
      'bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors',
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <div className={cn('p-2 rounded-lg', iconColors.bg)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-0.5">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className={cn(
            'text-xs font-semibold',
            trend.positive ? 'text-emerald-600' : 'text-red-500'
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
