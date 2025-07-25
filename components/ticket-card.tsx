import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, User, MessageSquare, Paperclip } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { PriorityIndicator } from './priority-indicator'
import { UserAvatar } from './user-avatar'

interface TicketCardProps {
  ticket: {
    id: string
    title: string
    description: string
    status: 'open' | 'in_progress' | 'resolved' | 'closed'
    priority: 'low' | 'medium' | 'high' | 'critical'
    category: string
    createdAt: string
    updatedAt: string
    assignedTo?: {
      id: string
      name: string
      email: string
    }
    createdBy: {
      id: string
      name: string
      email: string
    }
    _count?: {
      comments: number
      attachments: number
    }
  }
  onClick?: () => void
  showActions?: boolean
  compact?: boolean
}

export function TicketCard({ ticket, onClick, showActions = true, compact = false }: TicketCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card 
      className={`bg-neutral-800 border-neutral-700 hover:border-blue-500/50 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className={`pb-3 ${compact ? 'p-4' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`font-semibold text-white truncate ${
                compact ? 'text-sm' : 'text-base'
              }`}>
                {ticket.title}
              </h3>
              <Badge variant="outline" className="text-xs font-mono text-neutral-400 border-neutral-600">
                #{ticket.id.slice(-6)}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={ticket.status} size={compact ? 'sm' : 'default'} />
              <PriorityIndicator priority={ticket.priority} size={compact ? 'sm' : 'default'} />
              <Badge variant="secondary" className="text-xs">
                {ticket.category}
              </Badge>
            </div>
          </div>
          
          {ticket.assignedTo && (
            <UserAvatar 
              user={ticket.assignedTo} 
              size={compact ? 'sm' : 'default'}
              showTooltip
            />
          )}
        </div>
      </CardHeader>
      
      {!compact && (
        <CardContent className="pt-0">
          <p className="text-sm text-neutral-300 mb-4 line-clamp-2">
            {ticket.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{ticket.createdBy.name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(ticket.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {ticket._count?.comments && ticket._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{ticket._count.comments}</span>
                </div>
              )}
              
              {ticket._count?.attachments && ticket._count.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{ticket._count.attachments}</span>
                </div>
              )}
            </div>
          </div>
          
          {showActions && (
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="flex-1">
                Ver Detalhes
              </Button>
              {ticket.status === 'open' && (
                <Button size="sm" className="flex-1">
                  Assumir
                </Button>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}