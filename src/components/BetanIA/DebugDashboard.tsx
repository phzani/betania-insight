import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useSystemMonitor } from '@/hooks/useSystemMonitor';
import { useSmartCache } from '@/hooks/useSmartCache';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Gauge,
  BarChart3,
  Wifi,
  WifiOff,
  Server,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  Bug,
  Settings
} from 'lucide-react';

interface DebugDashboardProps {
  isVisible: boolean;
  onToggle: () => void;
}

export const DebugDashboard: React.FC<DebugDashboardProps> = ({ 
  isVisible, 
  onToggle 
}) => {
  const {
    health,
    performance,
    alerts,
    systemStatus,
    resolveAlert,
    performHealthCheck,
    reset
  } = useSystemMonitor();
  
  const { cache, stats, refreshStats } = useSmartCache();
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

  // Real-time updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleHealthCheck = async () => {
    setIsRunningHealthCheck(true);
    try {
      await performHealthCheck();
    } finally {
      setIsRunningHealthCheck(false);
    }
  };

  const statusColor = useMemo(() => {
    switch (systemStatus) {
      case 'healthy':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'degraded':
        return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'critical':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      default:
        return 'text-gray-400 border-gray-500/30 bg-gray-500/10';
    }
  }, [systemStatus]);

  const unreadAlerts = alerts.filter(alert => !alert.resolved);
  const recentAlerts = alerts.slice(0, 10);

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-black/50 hover:bg-black/70 border border-white/10"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
        {unreadAlerts.length > 0 && (
          <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
            {unreadAlerts.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-4 bg-background border border-border rounded-lg overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Dashboard de Debug</h2>
                <Badge className={`text-xs ${statusColor}`}>
                  {systemStatus.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHealthCheck}
                  disabled={isRunningHealthCheck}
                >
                  <RefreshCw className={`h-3 w-3 mr-2 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
                  Health Check
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                >
                  <Settings className="h-3 w-3 mr-2" />
                  Reset
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="overview" className="h-full">
              <TabsList className="grid w-full grid-cols-5 m-2">
                <TabsTrigger value="overview" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="performance" className="text-xs">
                  <Gauge className="h-3 w-3 mr-1" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="cache" className="text-xs">
                  <Database className="h-3 w-3 mr-1" />
                  Cache
                </TabsTrigger>
                <TabsTrigger value="alerts" className="text-xs relative">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Alertas
                  {unreadAlerts.length > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs">
                      {unreadAlerts.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="network" className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  Network
                </TabsTrigger>
              </TabsList>

              <div className="p-4 pt-2 h-[calc(100%-3rem)] overflow-hidden">
                <TabsContent value="overview" className="h-full mt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* System Status */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <p className={`text-lg font-semibold ${statusColor.split(' ')[0]}`}>
                              {systemStatus}
                            </p>
                          </div>
                          {systemStatus === 'healthy' ? (
                            <CheckCircle className="h-8 w-8 text-green-400" />
                          ) : systemStatus === 'degraded' ? (
                            <AlertTriangle className="h-8 w-8 text-yellow-400" />
                          ) : (
                            <AlertTriangle className="h-8 w-8 text-red-400" />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Success Rate */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                            <p className="text-lg font-semibold">
                              {health.totalRequests > 0 
                                ? ((health.successfulRequests / health.totalRequests) * 100).toFixed(1)
                                : '0'
                              }%
                            </p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-400" />
                        </div>
                        <Progress 
                          value={health.totalRequests > 0 ? (health.successfulRequests / health.totalRequests) * 100 : 0}
                          className="mt-2 h-1"
                        />
                      </CardContent>
                    </Card>

                    {/* Response Time */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Tempo Médio</p>
                            <p className="text-lg font-semibold">
                              {performance.avgResponseTime > 0 
                                ? `${(performance.avgResponseTime / 1000).toFixed(1)}s`
                                : '-'
                              }
                            </p>
                          </div>
                          <Clock className="h-8 w-8 text-purple-400" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cache Hit Rate */}
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Cache Hit</p>
                            <p className="text-lg font-semibold">
                              {(stats.hitRate * 100).toFixed(1)}%
                            </p>
                          </div>
                          <Database className="h-8 w-8 text-green-400" />
                        </div>
                        <Progress 
                          value={stats.hitRate * 100}
                          className="mt-2 h-1"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Atividade Recente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Total de Requisições:</span>
                          <span className="font-mono">{health.totalRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Requisições com Sucesso:</span>
                          <span className="font-mono text-green-400">{health.successfulRequests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Falhas Consecutivas:</span>
                          <span className="font-mono text-red-400">{health.consecutiveFailures}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between">
                          <span>Última Atualização:</span>
                          <span className="font-mono">
                            {health.lastSuccessfulFetch 
                              ? health.lastSuccessfulFetch.toLocaleTimeString()
                              : 'Nunca'
                            }
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="performance" className="h-full mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Gauge className="h-4 w-4" />
                          Métricas de Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Tempo Médio de Resposta:</span>
                            <span className="font-mono">
                              {performance.avgResponseTime > 0 
                                ? `${(performance.avgResponseTime / 1000).toFixed(2)}s`
                                : '-'
                              }
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span>P95 Tempo de Resposta:</span>
                            <span className="font-mono">
                              {performance.p95ResponseTime > 0 
                                ? `${(performance.p95ResponseTime / 1000).toFixed(2)}s`
                                : '-'
                              }
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span>Requests por Minuto:</span>
                            <span className="font-mono">{performance.requestsPerMinute}</span>
                          </div>
                        </div>

                        {health.apiResponseTime.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs text-muted-foreground mb-2">
                              Últimos Tempos de Resposta (ms)
                            </p>
                            <div className="h-20 flex items-end space-x-1">
                              {health.apiResponseTime.slice(-20).map((time, i) => (
                                <div
                                  key={i}
                                  className="bg-blue-400/50 w-2"
                                  style={{
                                    height: `${Math.max((time / Math.max(...health.apiResponseTime)) * 100, 2)}%`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Estatísticas de Erro
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Taxa de Erro:</span>
                            <span className={`font-mono ${health.errorRate > 0.1 ? 'text-red-400' : 'text-green-400'}`}>
                              {(health.errorRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          
                          <Progress
                            value={health.errorRate * 100}
                            className="h-2"
                          />
                          
                          <div className="flex justify-between text-xs">
                            <span>Falhas Consecutivas:</span>
                            <span className={`font-mono ${health.consecutiveFailures > 2 ? 'text-red-400' : 'text-green-400'}`}>
                              {health.consecutiveFailures}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="cache" className="h-full mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Estatísticas do Cache
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-muted-foreground">Total de Entradas</p>
                            <p className="text-lg font-mono">{stats.totalEntries}</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Entradas Válidas</p>
                            <p className="text-lg font-mono text-green-400">{stats.validEntries}</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Entradas Expiradas</p>
                            <p className="text-lg font-mono text-red-400">{stats.expiredEntries}</p>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground">Taxa de Hit</p>
                            <p className="text-lg font-mono text-blue-400">
                              {(stats.hitRate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Eficiência do Cache</p>
                          <Progress value={stats.hitRate * 100} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Ações do Cache</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cache.clear()}
                          className="w-full"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Limpar Todo Cache
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cache.invalidatePattern('fixtures_.*')}
                          className="w-full"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Invalidar Cache de Fixtures
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cache.invalidatePattern('topscorers_.*')}
                          className="w-full"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Invalidar Cache de Artilheiros
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="alerts" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {recentAlerts.length === 0 ? (
                        <Card>
                          <CardContent className="p-6 text-center">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Nenhum alerta no momento. Sistema funcionando normalmente!
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        recentAlerts.map((alert) => (
                          <Card key={alert.id} className={`${alert.resolved ? 'opacity-50' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {alert.type === 'error' ? (
                                      <AlertTriangle className="h-4 w-4 text-red-400" />
                                    ) : alert.type === 'warning' ? (
                                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-blue-400" />
                                    )}
                                    <Badge 
                                      variant={alert.type === 'error' ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {alert.type.toUpperCase()}
                                    </Badge>
                                    {alert.resolved && (
                                      <Badge variant="outline" className="text-xs">
                                        RESOLVIDO
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <p className="text-sm font-medium">{alert.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {alert.timestamp.toLocaleString()}
                                  </p>
                                  
                                  {alert.context && (
                                    <details className="mt-2">
                                      <summary className="text-xs cursor-pointer text-muted-foreground">
                                        Detalhes técnicos
                                      </summary>
                                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                        {JSON.stringify(alert.context, null, 2)}
                                      </pre>
                                    </details>
                                  )}
                                </div>
                                
                                {!alert.resolved && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => resolveAlert(alert.id)}
                                    className="text-xs"
                                  >
                                    Resolver
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="network" className="h-full mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Wifi className="h-4 w-4" />
                        Status da Rede
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Conectividade:</span>
                        <div className="flex items-center gap-2">
                          {navigator.onLine ? (
                            <>
                              <Wifi className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-green-400">Online</span>
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-4 w-4 text-red-400" />
                              <span className="text-sm text-red-400">Offline</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">API Status:</span>
                        <div className="flex items-center gap-2">
                          {systemStatus === 'healthy' ? (
                            <>
                              <Server className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-green-400">Operacional</span>
                            </>
                          ) : (
                            <>
                              <Server className="h-4 w-4 text-red-400" />
                              <span className="text-sm text-red-400">Problemas</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleHealthCheck}
                        disabled={isRunningHealthCheck}
                        className="w-full"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
                        Testar Conectividade
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};