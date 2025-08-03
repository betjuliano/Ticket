import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: 'ADMIN' | 'COORDINATOR' | 'USER';
    image?: string;
  };
  size?: 'sm' | 'default' | 'lg';
  showTooltip?: boolean;
  showRole?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  default: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const roleConfig = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  COORDINATOR: {
    label: 'Coordenador',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  USER: {
    label: 'Usuário',
    className: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserAvatar({
  user,
  size = 'default',
  showTooltip = false,
  showRole = false,
  className,
}: UserAvatarProps) {
  const avatar = (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.image} alt={user.name} />
        <AvatarFallback className="bg-neutral-700 text-neutral-200">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>

      {showRole && user.role && (
        <Badge
          variant="outline"
          className={cn(roleConfig[user.role].className, 'text-xs px-2 py-0.5')}
        >
          {roleConfig[user.role].label}
        </Badge>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{avatar}</TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-neutral-400">{user.email}</p>
              {user.role && (
                <Badge
                  variant="outline"
                  className={cn(
                    roleConfig[user.role].className,
                    'text-xs mt-1'
                  )}
                >
                  {roleConfig[user.role].label}
                </Badge>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return avatar;
}
