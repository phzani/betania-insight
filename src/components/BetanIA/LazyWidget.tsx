import React, { useState, useRef, useEffect } from 'react';

interface LazyWidgetProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  priority?: 'high' | 'medium' | 'low';
  delay?: number;
  className?: string;
}

interface IntersectionObserverEntry {
  isIntersecting: boolean;
  target: Element;
}

/**
 * LazyWidget component that loads children only when they come into view
 * with configurable priority and delay for performance optimization
 */
export const LazyWidget: React.FC<LazyWidgetProps> = ({
  children,
  fallback = <div className="animate-pulse bg-white/[0.02] rounded h-32" />,
  threshold = 0.1,
  rootMargin = '50px',
  priority = 'medium',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // For high priority components, load immediately
    if (priority === 'high') {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Apply delay based on priority
            const priorityDelay = priority === 'low' ? delay + 500 : delay;
            
            timeoutRef.current = setTimeout(() => {
              setShouldLoad(true);
            }, priorityDelay);
            
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [threshold, rootMargin, priority, delay]);

  return (
    <div ref={elementRef} className={className}>
      {shouldLoad ? children : fallback}
    </div>
  );
};

/**
 * Hook for progressive loading of widget data
 */
interface ProgressiveLoadingOptions {
  initialBatch?: number;
  batchSize?: number;
  loadDelay?: number;
}

export function useProgressiveLoading<T>(
  items: T[],
  options: ProgressiveLoadingOptions = {}
) {
  const {
    initialBatch = 3,
    batchSize = 2,
    loadDelay = 300
  } = options;

  const [loadedCount, setLoadedCount] = useState(initialBatch);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadMore = () => {
    if (isLoading || loadedCount >= items.length) return;
    
    setIsLoading(true);
    
    timeoutRef.current = setTimeout(() => {
      setLoadedCount(prev => Math.min(prev + batchSize, items.length));
      setIsLoading(false);
    }, loadDelay);
  };

  const loadedItems = items.slice(0, loadedCount);
  const hasMore = loadedCount < items.length;
  const remainingCount = items.length - loadedCount;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-load when user scrolls to bottom
  useEffect(() => {
    const handleScroll = () => {
      if (hasMore && !isLoading) {
        const scrollHeight = document.documentElement.scrollHeight;
        const scrollTop = document.documentElement.scrollTop;
        const clientHeight = document.documentElement.clientHeight;
        
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadedCount, items.length, batchSize, loadDelay]);

  return {
    loadedItems,
    loadMore,
    isLoading,
    hasMore,
    remainingCount,
    loadedCount,
    totalCount: items.length
  };
}

/**
 * Hook for intelligent preloading based on user interaction patterns
 */
interface PreloadingOptions {
  hoverDelay?: number;
  clickPrediction?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export function useIntelligentPreloading(
  preloadFn: () => Promise<void>,
  options: PreloadingOptions = {}
) {
  const {
    hoverDelay = 500,
    clickPrediction = true,
    priority = 'medium'
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionCountRef = useRef(0);

  const preload = async () => {
    if (isPreloading || isPreloaded) return;
    
    setIsPreloading(true);
    
    try {
      await preloadFn();
      setIsPreloaded(true);
    } catch (error) {
      console.warn('[IntelligentPreloading] Preload failed:', error);
    } finally {
      setIsPreloading(false);
    }
  };

  const handleMouseEnter = () => {
    if (priority === 'high') {
      preload();
      return;
    }

    hoverTimeoutRef.current = setTimeout(() => {
      preload();
    }, hoverDelay);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  const handleClick = () => {
    interactionCountRef.current++;
    
    // If user has interacted multiple times, preload similar content
    if (clickPrediction && interactionCountRef.current > 2) {
      preload();
    }
  };

  const handleFocus = () => {
    // Preload on focus for accessibility
    if (priority !== 'low') {
      preload();
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPreloading,
    isPreloaded,
    preload,
    eventHandlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      onFocus: handleFocus
    }
  };
}

/**
 * Component for skeleton loading states
 */
interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  className?: string;
  variant?: 'card' | 'list' | 'text' | 'circular';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  count = 1,
  height = 'h-4',
  className = '',
  variant = 'card'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'rounded-lg';
      case 'list':
        return 'rounded';
      case 'text':
        return 'rounded-sm';
      case 'circular':
        return 'rounded-full aspect-square';
      default:
        return 'rounded';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-white/[0.05] ${height} ${getVariantClasses()}`}
        />
      ))}
    </div>
  );
};

/**
 * Higher-order component for performance monitoring
 */
interface PerformanceMonitorProps {
  name: string;
  children: React.ReactNode;
  onRender?: (name: string, phase: 'mount' | 'update', duration: number) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  name,
  children,
  onRender
}) => {
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    const duration = performance.now() - renderStartRef.current;
    onRender?.(name, 'mount', duration);
  }, [name, onRender]);

  useEffect(() => {
    const duration = performance.now() - renderStartRef.current;
    onRender?.(name, 'update', duration);
  });

  return <>{children}</>;
};

/**
 * Hook for viewport-based optimizations
 */
export function useViewportOptimization() {
  const [isVisible, setIsVisible] = useState(true);
  const [isInViewport, setIsInViewport] = useState(true);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleFocus = () => setIsVisible(true);
    const handleBlur = () => setIsVisible(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return {
    isVisible,
    isInViewport,
    shouldOptimize: !isVisible || !isInViewport
  };
}