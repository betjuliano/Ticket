import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Minus, ArrowUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const priorityConfig = {
  low: {
    label: 'Baixa',
    icon: Minus,
    className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  },
  medium: {
    label: 'Média',
    icon: ArrowUp,
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  high: {
    label: 'Alta',
    icon: AlertTriangle,
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  critical: {
    label: 'Crítica',
    icon: Zap,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

const iconSizes = {
  sm: 'w-3 h-3',
  default: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

export function PriorityIndicator({
  priority,
  size = 'default',
  showIcon = true,
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium flex items-center gap-1',
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
}
