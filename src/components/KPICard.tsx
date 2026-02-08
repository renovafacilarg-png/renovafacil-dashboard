import { Card, CardContent } from '@/components/ui/card';
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

const iconColorMap: Record<string, { bg: string; text: string; glow: string }> = {
  'bg-emerald-100': { bg: 'bg-emerald-500', text: 'text-white', glow: 'shadow-emerald-500/30' },
  'bg-blue-100': { bg: 'bg-blue-500', text: 'text-white', glow: 'shadow-blue-500/30' },
  'bg-amber-100': { bg: 'bg-amber-500', text: 'text-white', glow: 'shadow-amber-500/30' },
  'bg-red-100': { bg: 'bg-red-500', text: 'text-white', glow: 'shadow-red-500/30' },
  'bg-violet-100': { bg: 'bg-violet-500', text: 'text-white', glow: 'shadow-violet-500/30' },
  'bg-primary/10': { bg: 'bg-primary', text: 'text-primary-foreground', glow: 'shadow-primary/30' },
};

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
  variant = 'default'
}: KPICardProps) {
  const iconColors = iconColorMap[iconClassName || 'bg-primary/10'] || iconColorMap['bg-primary/10'];

  return (
    <Card className={cn(
      "overflow-hidden card-hover group relative",
      variant === 'glow' && "card-glow",
      className
    )}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <div className={cn(
            "p-2.5 rounded-xl transition-all duration-300 shadow-lg",
            iconColors.bg,
            iconColors.glow,
            "group-hover:scale-110 group-hover:shadow-xl"
          )}>
            <Icon className={cn("h-4 w-4", iconColors.text)} />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-3xl font-bold tracking-tight animate-fade-in">
            {value}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
              trend.positive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              <span className="text-sm">{trend.positive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </div>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
