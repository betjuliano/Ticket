import React from 'react';
import { Loader2, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para o componente de Loading
interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

// Tipos para Skeleton
interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

/**
 * Componente de Loading otimizado
 * 
 * Este componente oferece diferentes variantes de loading para diferentes contextos:
 * - Spinner: Para ações rápidas
 * - Dots: Para carregamentos de dados
 * - Pulse: Para estados de processamento
 * - Skeleton: Para carregamento de conteúdo
 * 
 * Características:
 * - Performance otimizada com CSS puro
 * - Acessibilidade com ARIA labels
 * - Responsivo e customizável
 * - Integração com tema tático
 */
export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  className,
  fullScreen = false,
  overlay = false,
}: LoadingProps) {
  // Classes base para diferentes tamanhos
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  // Classes para diferentes variantes
  const variantClasses = {
    spinner: 'animate-spin',
    dots: 'animate-pulse',
    pulse: 'animate-pulse',
    skeleton: '',
  };

  // Renderizar spinner
  const renderSpinner = () => (
    <Loader2
      className={cn(
        sizeClasses[size],
        variantClasses[variant],
        'text-primary',
        className
      )}
    />
  );

  // Renderizar dots
  const renderDots = () => (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full',
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3',
            'animate-pulse'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );

  // Renderizar pulse
  const renderPulse = () => (
    <div
      className={cn(
        'bg-primary rounded-full',
        sizeClasses[size],
        'animate-pulse',
        className
      )}
    />
  );

  // Renderizar skeleton
  const renderSkeleton = () => (
    <div
      className={cn(
        'bg-neutral-700 rounded animate-pulse',
        sizeClasses[size],
        className
      )}
    />
  );

  // Renderizar conteúdo baseado na variante
  const renderContent = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };

  // Se for fullScreen, renderizar overlay completo
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          {renderContent()}
          {text && (
            <p className="text-sm text-neutral-300 animate-pulse">{text}</p>
          )}
        </div>
      </div>
    );
  }

  // Se for overlay, renderizar overlay sobre o conteúdo
  if (overlay) {
    return (
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
        <div className="text-center space-y-2">
          {renderContent()}
          {text && (
            <p className="text-xs text-neutral-300">{text}</p>
          )}
        </div>
      </div>
    );
  }

  // Renderização padrão
  return (
    <div className="flex items-center justify-center space-x-2">
      {renderContent()}
      {text && (
        <span className="text-sm text-neutral-300">{text}</span>
      )}
    </div>
  );
}

/**
 * Componente Skeleton para carregamento de conteúdo
 * 
 * Este componente simula a estrutura do conteúdo que será carregado,
 * melhorando a percepção de performance do usuário.
 */
export function Skeleton({ className, count = 1, height = 'h-4' }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-neutral-700 rounded animate-pulse',
            height,
            className
          )}
        />
      ))}
    </div>
  );
}

/**
 * Componente de Loading para cards
 * 
 * Especializado para carregamento de conteúdo em cards
 */
export function CardLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-neutral-700 rounded-full animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-neutral-700 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-neutral-700 rounded animate-pulse w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-neutral-700 rounded animate-pulse" />
        <div className="h-4 bg-neutral-700 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-neutral-700 rounded animate-pulse w-4/6" />
      </div>
      {text && (
        <div className="flex items-center justify-center pt-4">
          <Clock className="w-4 h-4 text-neutral-400 mr-2" />
          <span className="text-sm text-neutral-400">{text}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de Loading para listas
 * 
 * Especializado para carregamento de listas de dados
 */
export function ListLoading({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border border-neutral-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-neutral-700 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-neutral-700 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-neutral-700 rounded animate-pulse w-1/2" />
            </div>
            <div className="w-16 h-6 bg-neutral-700 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Componente de Loading para tabelas
 * 
 * Especializado para carregamento de dados tabulares
 */
export function TableLoading({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex space-x-2 p-3 border-b border-neutral-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-neutral-700 rounded animate-pulse flex-1"
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-2 p-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="h-4 bg-neutral-700 rounded animate-pulse flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
} 