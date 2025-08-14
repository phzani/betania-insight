import { useState, useCallback, useRef } from 'react';

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
}

/**
 * Creates a debounced version of a function
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @param options - Additional options
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const argsRef = useRef<Parameters<T>>();
  const thisRef = useRef<any>();

  const invokeFunc = useCallback(() => {
    const args = argsRef.current;
    const thisArg = thisRef.current;
    
    argsRef.current = undefined;
    thisRef.current = undefined;
    
    lastInvokeTimeRef.current = Date.now();
    
    if (args) {
      return func.apply(thisArg, args);
    }
  }, [func]);

  const leadingEdge = useCallback(() => {
    lastInvokeTimeRef.current = Date.now();
    
    if (maxWait !== undefined) {
      maxTimeoutRef.current = setTimeout(() => {
        invokeFunc();
      }, maxWait);
    }
    
    if (leading) {
      return invokeFunc();
    }
  }, [invokeFunc, leading, maxWait]);

  const remainingWait = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTimeRef.current;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
    const timeWaiting = delay - timeSinceLastCall;

    if (maxWait !== undefined) {
      return Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
    }
    
    return timeWaiting;
  }, [delay, maxWait]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - lastCallTimeRef.current;
    const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

    return (
      lastCallTimeRef.current === 0 ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const trailingEdge = useCallback(() => {
    timeoutRef.current = null;
    
    if (trailing && argsRef.current) {
      return invokeFunc();
    }
    
    argsRef.current = undefined;
    thisRef.current = undefined;
  }, [invokeFunc, trailing]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
    
    lastInvokeTimeRef.current = 0;
    lastCallTimeRef.current = 0;
    argsRef.current = undefined;
    thisRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      return trailingEdge();
    }
  }, [trailingEdge]);

  const debounced = useCallback((...args: Parameters<T>) => {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastCallTimeRef.current = time;
    argsRef.current = args;
    thisRef.current = this;

    if (isInvoking) {
      if (!timeoutRef.current) {
        return leadingEdge();
      }
      
      if (maxWait !== undefined) {
        timeoutRef.current = setTimeout(trailingEdge, delay);
        return invokeFunc();
      }
    }
    
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(trailingEdge, delay);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(trailingEdge, remainingWait(time));
    }
  }, [shouldInvoke, leadingEdge, trailingEdge, delay, remainingWait, invokeFunc, maxWait]) as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

/**
 * Hook for batching API requests
 */
interface BatchRequest {
  id: string;
  endpoint: string;
  params: Record<string, any>;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

export function useBatchedRequests() {
  const batchRef = useRef<BatchRequest[]>([]);
  const processingRef = useRef(false);
  
  const processBatch = useCallback(async () => {
    if (processingRef.current || batchRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const currentBatch = [...batchRef.current];
    batchRef.current = [];

    try {
      console.log(`[BatchedRequests] Processing batch of ${currentBatch.length} requests`);
      
      // Group requests by endpoint for optimization
      const groupedRequests = currentBatch.reduce((acc, request) => {
        const key = `${request.endpoint}_${JSON.stringify(request.params)}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(request);
        return acc;
      }, {} as Record<string, BatchRequest[]>);

      // Execute unique requests in parallel
      const uniqueRequests = Object.values(groupedRequests).map(group => group[0]);
      
      const results = await Promise.allSettled(
        uniqueRequests.map(async (request) => {
          const url = new URL('https://skeauyjradscjgfebkqa.supabase.co/functions/v1/api-sports');
          url.searchParams.set('endpoint', request.endpoint);
          Object.entries(request.params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              url.searchParams.set(key, String(value));
            }
          });

          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8',
              authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZWF1eWpyYWRzY2pnZmVia3FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwNTg3MjAsImV4cCI6MjA3MDYzNDcyMH0.jdVE76iSSqfJkc_3OhrIH1K538w-Vfip3WIbK972VQ8',
              'content-type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return { request, data: await response.json() };
        })
      );

      // Resolve all requests in each group with the same result
      results.forEach((result, index) => {
        const originalRequest = uniqueRequests[index];
        const groupKey = `${originalRequest.endpoint}_${JSON.stringify(originalRequest.params)}`;
        const groupRequests = groupedRequests[groupKey];

        if (result.status === 'fulfilled') {
          groupRequests.forEach(req => req.resolve(result.value.data));
        } else {
          groupRequests.forEach(req => req.reject(result.reason));
        }
      });

    } catch (error) {
      // Reject all requests in case of unexpected error
      currentBatch.forEach(req => req.reject(error));
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Process batch with a small delay to allow more requests to accumulate
  const debouncedProcessBatch = useDebounce(processBatch, 100, { 
    leading: false, 
    trailing: true,
    maxWait: 300 
  });

  const addToBatch = useCallback((
    endpoint: string, 
    params: Record<string, any>
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: `${endpoint}_${Date.now()}_${Math.random()}`,
        endpoint,
        params,
        resolve,
        reject
      };

      batchRef.current.push(request);
      debouncedProcessBatch();
    });
  }, [debouncedProcessBatch]);

  return { addToBatch };
}

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): [T, () => void] {
  const [isThrottled, setIsThrottled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const throttledFunc = useCallback((...args: Parameters<T>) => {
    if (isThrottled) return;

    func(...args);
    setIsThrottled(true);

    timeoutRef.current = setTimeout(() => {
      setIsThrottled(false);
    }, delay);
  }, [func, delay, isThrottled]) as T;

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsThrottled(false);
  }, []);

  return [throttledFunc, cancel];
}

/**
 * Hook for intelligent request scheduling
 */
export function useRequestScheduler() {
  const priorityQueueRef = useRef<{
    high: (() => Promise<any>)[];
    medium: (() => Promise<any>)[];
    low: (() => Promise<any>)[];
  }>({
    high: [],
    medium: [],
    low: []
  });
  
  const processingRef = useRef(false);
  const maxConcurrent = 3;
  const activeRequestsRef = useRef(0);

  const processQueue = useCallback(async () => {
    if (processingRef.current || activeRequestsRef.current >= maxConcurrent) {
      return;
    }

    processingRef.current = true;

    const { high, medium, low } = priorityQueueRef.current;
    
    // Process high priority first, then medium, then low
    const nextRequest = high.shift() || medium.shift() || low.shift();
    
    if (nextRequest) {
      activeRequestsRef.current++;
      
      try {
        await nextRequest();
      } catch (error) {
        console.error('[RequestScheduler] Request failed:', error);
      } finally {
        activeRequestsRef.current--;
      }
    }

    processingRef.current = false;

    // Continue processing if there are more requests
    if (high.length > 0 || medium.length > 0 || low.length > 0) {
      setTimeout(processQueue, 10); // Small delay to prevent blocking
    }
  }, []);

  const scheduleRequest = useCallback((
    requestFn: () => Promise<any>,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      priorityQueueRef.current[priority].push(wrappedRequest);
      processQueue();
    });
  }, [processQueue]);

  return { scheduleRequest };
}