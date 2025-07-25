import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Inbox, CheckCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// Loading State
interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function LoadingState({ 
  message = 'Carregando...', 
  size = 'default',
  className 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'p-4',
    default: 'p-8',
    lg: 'p-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size], className)}>
      <Loader2 className={cn('animate-spin text-blue-500 mb-3', iconSizes[size])} />
      <p className="text-neutral-400">{message}</p>
    </div>
  )
}

// Error State
interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({ 
  title = 'Ops! Algo deu errado',
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  className 
}: ErrorStateProps) {
  return (
    <Card className={cn('bg-red-500/10 border-red-500/20', className)}>
      <CardContent className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-red-200 mb-6">{message}</p>
        {onRetry && (
          <Button 
            onClick={onRetry}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Empty State
interface EmptyStateProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title = 'Nenhum item encontrado',
  message,
  action,
  icon,
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn('bg-neutral-800 border-neutral-700', className)}>
      <CardContent className="p-12 text-center">
        {icon || <Inbox className="w-16 h-16 text-neutral-500 mx-auto mb-4" />}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 mb-6 max-w-md mx-auto">{message}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Success State
interface SuccessStateProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function SuccessState({ 
  title = 'Sucesso!',
  message,
  action,
  className 
}: SuccessStateProps) {
  return (
    <Alert className={cn('bg-green-500/10 border-green-500/20 text-green-200', className)}>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription className="ml-2">
        <div className="font-medium">{title}</div>
        <div className="text-sm mt-1">{message}</div>
        {action && (
          <Button 
            onClick={action.onClick}
            size="sm"
            variant="outline"
            className="mt-3 border-green-500/30 text-green-400 hover:bg-green-500/10"
          >
            {action.label}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

// Skeleton Loader
interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-md bg-neutral-700', className)} />
  )
}

// Skeleton para Ticket Card
export function TicketCardSkeleton() {
  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}