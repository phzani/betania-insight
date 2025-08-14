import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, WifiOff, Server, Clock } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorDisplayProps {
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  lastUpdate?: Date | null;
  type?: 'network' | 'api' | 'data' | 'unknown';
  showDetails?: boolean;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          error={this.state.error?.message || 'Erro inesperado'}
          loading={false}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined, errorInfo: undefined });
            window.location.reload();
          }}
          type="unknown"
          showDetails={true}
        />
      );
    }

    return this.props.children;
  }
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  loading,
  onRetry,
  lastUpdate,
  type = 'unknown',
  showDetails = false
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff className="h-5 w-5 text-orange-400" />;
      case 'api':
        return <Server className="h-5 w-5 text-red-400" />;
      case 'data':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
    }
  };

  const getErrorType = () => {
    if (error.toLowerCase().includes('fetch')) return 'network';
    if (error.toLowerCase().includes('api')) return 'api';
    if (error.toLowerCase().includes('dados') || error.toLowerCase().includes('data')) return 'data';
    return type;
  };

  const getErrorMessage = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return 'Problema de conexão detectado';
      case 'api':
        return 'Serviço temporariamente indisponível';
      case 'data':
        return 'Falha no processamento dos dados';
      default:
        return 'Ocorreu um erro inesperado';
    }
  };

  const getErrorSuggestion = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'network':
        return 'Verifique sua conexão com a internet';
      case 'api':
        return 'Os dados serão atualizados automaticamente quando o serviço estiver disponível';
      case 'data':
        return 'Tentando processar com dados alternativos';
      default:
        return 'Tente atualizar a página ou entre em contato com o suporte';
    }
  };

  const getRetryDelay = () => {
    if (!lastUpdate) return null;
    
    const diffMs = Date.now() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Última tentativa há instantes';
    if (diffMins < 60) return `Última tentativa há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `Última tentativa há ${diffHours}h`;
  };

  return (
    <Card className="border-red-500/30 bg-red-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {getErrorIcon()}
          <span className="text-red-400">{getErrorMessage()}</span>
          <Badge 
            variant="outline" 
            className="text-xs border-red-500/30 text-red-400"
          >
            {getErrorType().toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {getErrorSuggestion()}
        </p>
        
        {showDetails && (
          <details className="text-xs">
            <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
              Detalhes técnicos
            </summary>
            <pre className="mt-2 p-2 bg-black/20 rounded text-xs overflow-x-auto">
              {error}
            </pre>
          </details>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lastUpdate && (
              <>
                <Clock className="h-3 w-3" />
                <span>{getRetryDelay()}</span>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={loading}
            className="text-xs h-7 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Tentando...' : 'Tentar Novamente'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for handling errors with retry logic
export function useErrorHandler() {
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastRetryTime, setLastRetryTime] = React.useState<Date | null>(null);

  const handleError = React.useCallback((error: Error, context: string) => {
    console.error(`[${context}] Error:`, error);
    
    // Could implement error reporting service here
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { context, retryCount });
    }
  }, []);

  const handleRetry = React.useCallback((retryFn: () => void | Promise<void>) => {
    setRetryCount(prev => prev + 1);
    setLastRetryTime(new Date());
    
    // Add exponential backoff for multiple retries
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30 seconds
    
    setTimeout(() => {
      retryFn();
    }, delay);
  }, [retryCount]);

  const reset = React.useCallback(() => {
    setRetryCount(0);
    setLastRetryTime(null);
  }, []);

  return {
    handleError,
    handleRetry,
    reset,
    retryCount,
    lastRetryTime
  };
}