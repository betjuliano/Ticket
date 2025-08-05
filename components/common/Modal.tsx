import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Tipos para o componente Modal
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  contentClassName?: string;
}

// Tipos para ações do modal
interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  loading?: boolean;
}

interface ModalWithActionsProps extends ModalProps {
  actions?: ModalAction[];
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
}

/**
 * Componente de Modal Reutilizável
 * 
 * Este componente oferece:
 * - Acessibilidade completa (ARIA, foco, teclado)
 * - Animações suaves
 * - Diferentes tamanhos e variantes
 * - Ações customizáveis
 * - Integração com tema tático
 * - Portal para renderização
 * 
 * @param isOpen - Se o modal está aberto
 * @param onClose - Função para fechar o modal
 * @param title - Título do modal
 * @param description - Descrição do modal
 * @param children - Conteúdo do modal
 * @param size - Tamanho do modal
 * @param variant - Variante visual do modal
 * @param showCloseButton - Se deve mostrar botão de fechar
 * @param closeOnOverlayClick - Se deve fechar ao clicar no overlay
 * @param closeOnEscape - Se deve fechar ao pressionar ESC
 * @param className - Classes CSS customizadas
 * @param contentClassName - Classes CSS para o conteúdo
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  variant = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  contentClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Classes baseadas no tamanho
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  // Classes baseadas na variante
  const variantClasses = {
    default: 'border-neutral-700',
    success: 'border-green-500/30 bg-green-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  };

  // Ícones baseados na variante
  const variantIcons = {
    default: null,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
    info: Info,
  };

  // Gerenciar foco e teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    const handleTab = (event: KeyboardEvent) => {
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Focar no modal quando abrir
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }

    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Handler para clique no overlay
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === overlayRef.current) {
      onClose();
    }
  };

  // Se não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Renderizar via portal
  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full bg-slate-800 border border-neutral-700 rounded-lg shadow-xl',
          'transform transition-all duration-200 ease-out',
          'animate-in fade-in-0 zoom-in-95',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        role="document"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <CardHeader className="flex items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-3">
              {variantIcons[variant] && React.createElement(variantIcons[variant], {
                className: "w-5 h-5 text-neutral-400"
              })}
              <div>
                {title && (
                  <CardTitle
                    id="modal-title"
                    className="text-lg font-bold text-white"
                  >
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="text-sm text-neutral-400 mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-neutral-400 hover:text-white"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </CardHeader>
        )}

        {/* Content */}
        <CardContent className={cn('pt-0', contentClassName)}>
          {children}
        </CardContent>
      </div>
    </div>,
    document.body
  );
}

/**
 * Componente Modal com Ações
 * 
 * Versão do modal que inclui botões de ação padronizados
 */
export function ModalWithActions({
  actions,
  primaryAction,
  secondaryAction,
  ...modalProps
}: ModalWithActionsProps) {
  return (
    <Modal {...modalProps}>
      <div className="space-y-6">
        {/* Conteúdo do modal */}
        {modalProps.children}

        {/* Ações */}
        {(actions || primaryAction || secondaryAction) && (
          <div className="flex gap-3 pt-4 border-t border-neutral-700">
            {/* Ações customizadas */}
            {actions?.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                disabled={action.disabled}
                className="flex-1"
              >
                {action.loading ? 'Carregando...' : action.label}
              </Button>
            ))}

            {/* Ação secundária */}
            {secondaryAction && (
              <Button
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.disabled}
                className="flex-1"
              >
                {secondaryAction.loading ? 'Carregando...' : secondaryAction.label}
              </Button>
            )}

            {/* Ação primária */}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
                className="flex-1"
              >
                {primaryAction.loading ? 'Carregando...' : primaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Hook para gerenciar estado do modal
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = React.useState(initialState);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Componente de confirmação rápida
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  return (
    <ModalWithActions
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      primaryAction={{
        label: confirmText,
        onClick: () => {
          onConfirm();
          onClose();
        },
        variant: variant === 'error' ? 'destructive' : 'default',
      }}
      secondaryAction={{
        label: cancelText,
        onClick: onClose,
        variant: 'outline',
      }}
    >
      <p className="text-neutral-300">{message}</p>
    </ModalWithActions>
  );
}

/**
 * Componente de modal de informação
 */
export function InfoModal({
  isOpen,
  onClose,
  title = 'Informação',
  message,
  variant = 'info',
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  return (
    <ModalWithActions
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant}
      primaryAction={{
        label: 'OK',
        onClick: onClose,
      }}
    >
      <p className="text-neutral-300">{message}</p>
    </ModalWithActions>
  );
} 