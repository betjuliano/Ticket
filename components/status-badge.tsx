import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status:
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed'
    | 'waiting_for_user'
    | 'waiting_for_third_party';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const statusConfig = {
  open: {
    label: 'Aberto',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  in_progress: {
    label: 'Em Andamento',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  waiting_for_user: {
    label: 'Aguardando Usuário',
    className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  waiting_for_third_party: {
    label: 'Aguardando Terceiros',
    className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  resolved: {
    label: 'Resolvido',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  closed: {
    label: 'Fechado',
    className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  default: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({
  status,
  size = 'default',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        config.className,
        sizeClasses[size],
        'font-medium',
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
