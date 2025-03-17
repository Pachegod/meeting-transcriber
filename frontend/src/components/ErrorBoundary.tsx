'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente para capturar erros em qualquer parte da árvore de componentes abaixo dele
 * e exibir uma UI de fallback em vez de quebrar a aplicação inteira.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Registra o erro no serviço de logging
    logger.error('Erro capturado pelo ErrorBoundary', error, {
      context: 'ErrorBoundary',
      data: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderiza o fallback personalizado ou o fallback padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado</h2>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos trabalhando para resolver o problema.
            </p>
            <div className="bg-gray-100 p-4 rounded-md mb-4 overflow-auto max-h-40">
              <code className="text-sm text-gray-800">
                {this.state.error?.message || 'Erro desconhecido'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 