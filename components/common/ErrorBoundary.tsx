import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// Tipos para o Error Boundary
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Este componente captura erros JavaScript em qualquer lugar da árvore de componentes
 * e exibe uma UI de fallback em vez da árvore de componentes que quebrou.
 * 
 * Características:
 * - Captura erros de renderização, lifecycle e construtores
 * - Logs detalhados para debugging
 * - UI de fallback amigável ao usuário
 * - Funcionalidade de reset automático
 * - Integração com sistema de logging
 * 
 * @param children - Componentes filhos a serem renderizados
 * @param fallback - Componente customizado de fallback
 * @param onError - Callback executado quando erro é capturado
 * @param resetOnPropsChange - Se deve resetar automaticamente quando props mudam
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Método chamado quando um erro é capturado
   * Este é o ponto central de tratamento de erros
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Atualizar estado para que a próxima renderização mostre a UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Método chamado após um erro ser capturado
   * Ideal para logging e side effects
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado do erro para debugging
    console.error('Error Boundary capturou um erro:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Atualizar estado com informações do erro
    this.setState({
      error,
      errorInfo,
    });

    // Executar callback customizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Aqui você pode integrar com serviços de logging como Sentry, LogRocket, etc.
    // this.logErrorToService(error, errorInfo);
  }

  /**
   * Resetar o estado de erro
   * Permite que o usuário tente novamente
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Navegar para a página inicial
   */
  handleGoHome = () => {
    window.location.href = '/';
  };

  /**
   * Recarregar a página
   */
  handleReload = () => {
    window.location.reload();
  };

  /**
   * Renderizar UI de fallback padrão
   */
  renderFallback() {
    const { error } = this.state;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 tactical-layout">
        <Card className="w-full max-w-md tactical-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Ops! Algo deu errado
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-300 text-center">
              Encontramos um problema inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>

            {/* Mostrar detalhes do erro apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="bg-slate-800 border border-slate-700 rounded p-3 text-xs">
                <summary className="cursor-pointer text-neutral-400 mb-2">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="space-y-2 text-neutral-300">
                  <div>
                    <strong>Erro:</strong> {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="mt-1 text-xs overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1 border-slate-600 text-neutral-300 hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </Button>
            </div>

            <div className="text-center">
              <Button
                onClick={this.handleReload}
                variant="ghost"
                size="sm"
                className="text-xs text-neutral-400 hover:text-neutral-300"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  render() {
    // Se há erro, renderizar UI de fallback
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, usá-lo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Caso contrário, usar fallback padrão
      return this.renderFallback();
    }

    // Se não há erro, renderizar children normalmente
    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary em componentes funcionais
 * 
 * @param errorHandler - Função para tratar erros
 * @returns Função para lançar erros
 */
export function useErrorHandler() {
  const throwError = (error: Error) => {
    throw error;
  };

  return throwError;
}

/**
 * HOC para adicionar Error Boundary a qualquer componente
 * 
 * @param Component - Componente a ser envolvido
 * @param errorBoundaryProps - Props para o Error Boundary
 * @returns Componente envolvido com Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
} 