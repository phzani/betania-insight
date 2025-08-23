import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface HealthMetrics {
  apiResponseTime: number[];
  cacheHitRate: number;
  errorRate: number;
  lastSuccessfulFetch: Date | null;
  consecutiveFailures: number;
  totalRequests: number;
  successfulRequests: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsPerMinute: number;
  activeConnections: number;
  memoryUsage: number;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
  context?: Record<string, any>;
}

interface MonitoringData {
  health: HealthMetrics;
  performance: PerformanceMetrics;
  alerts: SystemAlert[];
  systemStatus: 'healthy' | 'degraded' | 'critical';
}

class SystemMonitor {
  private metrics: HealthMetrics = {
    apiResponseTime: [],
    cacheHitRate: 0,
    errorRate: 0,
    lastSuccessfulFetch: null,
    consecutiveFailures: 0,
    totalRequests: 0,
    successfulRequests: 0
  };

  private performanceMetrics: PerformanceMetrics = {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    requestsPerMinute: 0,
    activeConnections: 0,
    memoryUsage: 0
  };

  private alerts: SystemAlert[] = [];
  private listeners: ((data: MonitoringData) => void)[] = [];
  
  // Keep only last 100 response times for performance
  private readonly MAX_RESPONSE_TIMES = 100;

  recordRequest(responseTime: number, success: boolean, fromCache: boolean = false) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastSuccessfulFetch = new Date();
      
      // Record response time only for non-cached requests
      if (!fromCache) {
        this.metrics.apiResponseTime.push(responseTime);
        if (this.metrics.apiResponseTime.length > this.MAX_RESPONSE_TIMES) {
          this.metrics.apiResponseTime.shift();
        }
      }
    } else {
      this.metrics.consecutiveFailures++;
    }

    // Update derived metrics
    this.updateDerivedMetrics();
    this.checkAlertConditions();
    this.notifyListeners();
  }

  recordCacheHit() {
    this.metrics.cacheHitRate = this.calculateCacheHitRate();
    this.notifyListeners();
  }

  private updateDerivedMetrics() {
    // Update error rate
    this.metrics.errorRate = this.metrics.totalRequests > 0 
      ? (this.metrics.totalRequests - this.metrics.successfulRequests) / this.metrics.totalRequests 
      : 0;

    // Update performance metrics
    if (this.metrics.apiResponseTime.length > 0) {
      const sortedTimes = [...this.metrics.apiResponseTime].sort((a, b) => a - b);
      this.performanceMetrics.avgResponseTime = 
        this.metrics.apiResponseTime.reduce((sum, time) => sum + time, 0) / this.metrics.apiResponseTime.length;
      
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      this.performanceMetrics.p95ResponseTime = sortedTimes[p95Index] || 0;
    }

    // Calculate requests per minute (approximate)
    const oneMinuteAgo = Date.now() - 60000;
    this.performanceMetrics.requestsPerMinute = this.metrics.totalRequests; // Simplified
  }

  private calculateCacheHitRate(): number {
    // This would be implemented based on actual cache statistics
    // For now, return a calculated value
    return Math.min(this.metrics.successfulRequests / Math.max(this.metrics.totalRequests, 1), 1);
  }

  private checkAlertConditions() {
    const now = new Date();

    // High error rate alert
    if (this.metrics.errorRate > 0.5 && this.metrics.totalRequests > 5) {
      this.addAlert({
        id: `high-error-rate-${now.getTime()}`,
        type: 'error',
        message: `High error rate detected: ${(this.metrics.errorRate * 100).toFixed(1)}%`,
        timestamp: now,
        resolved: false,
        context: { errorRate: this.metrics.errorRate, totalRequests: this.metrics.totalRequests }
      });
    }

    // Consecutive failures alert
    if (this.metrics.consecutiveFailures >= 3) {
      this.addAlert({
        id: `consecutive-failures-${now.getTime()}`,
        type: 'error',
        message: `${this.metrics.consecutiveFailures} consecutive API failures`,
        timestamp: now,
        resolved: false,
        context: { consecutiveFailures: this.metrics.consecutiveFailures }
      });
    }

    // Slow response time alert
    if (this.performanceMetrics.avgResponseTime > 5000) { // 5 seconds
      this.addAlert({
        id: `slow-response-${now.getTime()}`,
        type: 'warning',
        message: `Slow API response times: ${(this.performanceMetrics.avgResponseTime / 1000).toFixed(1)}s average`,
        timestamp: now,
        resolved: false,
        context: { avgResponseTime: this.performanceMetrics.avgResponseTime }
      });
    }
  }

  private addAlert(alert: SystemAlert) {
    // Check if similar alert already exists and is unresolved
    const similarAlert = this.alerts.find(a => 
      !a.resolved && 
      a.type === alert.type && 
      a.message.includes(alert.message.split(':')[0]) // Compare base message
    );

    if (!similarAlert) {
      this.alerts.unshift(alert);
      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(0, 50);
      }
    }
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.notifyListeners();
    }
  }

  getSystemStatus(): 'healthy' | 'degraded' | 'critical' {
    if (this.metrics.consecutiveFailures >= 5 || this.metrics.errorRate > 0.8) {
      return 'critical';
    }
    
    if (this.metrics.consecutiveFailures >= 2 || 
        this.metrics.errorRate > 0.3 || 
        this.performanceMetrics.avgResponseTime > 3000) {
      return 'degraded';
    }

    return 'healthy';
  }

  subscribe(listener: (data: MonitoringData) => void) {
    this.listeners.push(listener);
    
    // Send initial data
    listener(this.getMonitoringData());
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const data = this.getMonitoringData();
    this.listeners.forEach(listener => listener(data));
  }

  private getMonitoringData(): MonitoringData {
    return {
      health: { ...this.metrics },
      performance: { ...this.performanceMetrics },
      alerts: [...this.alerts],
      systemStatus: this.getSystemStatus()
    };
  }

  // Health check methods
  async performHealthCheck(): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Simple health check - try to fetch leagues (cached data is fine)
      const response = await fetch('https://skeauyjradscjgfebkqa.supabase.co/functions/v1/api-sports?endpoint=leagues&country=Brazil', {
        method: 'GET',
        headers: {
          apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8',
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8',
          'content-type': 'application/json'
        }
      });

      const responseTime = performance.now() - startTime;
      const isHealthy = response.ok;
      
      this.recordRequest(responseTime, isHealthy, false);
      
      return isHealthy;
    } catch (error) {
      this.recordRequest(0, false, false);
      return false;
    }
  }

  reset() {
    this.metrics = {
      apiResponseTime: [],
      cacheHitRate: 0,
      errorRate: 0,
      lastSuccessfulFetch: null,
      consecutiveFailures: 0,
      totalRequests: 0,
      successfulRequests: 0
    };
    this.alerts = [];
    this.notifyListeners();
  }
}

// Global monitor instance
const globalMonitor = new SystemMonitor();

export function useSystemMonitor() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    health: {
      apiResponseTime: [],
      cacheHitRate: 0,
      errorRate: 0,
      lastSuccessfulFetch: null,
      consecutiveFailures: 0,
      totalRequests: 0,
      successfulRequests: 0
    },
    performance: {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      requestsPerMinute: 0,
      activeConnections: 0,
      memoryUsage: 0
    },
    alerts: [],
    systemStatus: 'healthy'
  });

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = globalMonitor.subscribe((data) => {
      setMonitoringData(data);
      
      // Show toast for critical alerts
      const newCriticalAlerts = data.alerts.filter(alert => 
        !alert.resolved && 
        alert.type === 'error' && 
        Date.now() - alert.timestamp.getTime() < 5000 // Last 5 seconds
      );

      newCriticalAlerts.forEach(alert => {
        toast({
          title: "Sistema de Monitoramento",
          description: alert.message,
          variant: "destructive"
        });
      });
    });

    // Start periodic health checks
    const healthCheckInterval = setInterval(() => {
      globalMonitor.performHealthCheck();
    }, 30000); // Every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(healthCheckInterval);
    };
  }, [toast]);

  const resolveAlert = useCallback((alertId: string) => {
    globalMonitor.resolveAlert(alertId);
  }, []);

  const performHealthCheck = useCallback(async () => {
    return await globalMonitor.performHealthCheck();
  }, []);

  const recordApiCall = useCallback((responseTime: number, success: boolean, fromCache: boolean = false) => {
    globalMonitor.recordRequest(responseTime, success, fromCache);
  }, []);

  const recordCacheHit = useCallback(() => {
    globalMonitor.recordCacheHit();
  }, []);

  return {
    ...monitoringData,
    resolveAlert,
    performHealthCheck,
    recordApiCall,
    recordCacheHit,
    reset: globalMonitor.reset.bind(globalMonitor)
  };
}
