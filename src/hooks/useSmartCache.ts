import { useState, useEffect, useCallback } from 'react';

interface CacheConfig {
  key: string;
  ttl: number; // time to live in milliseconds
  priority: 'low' | 'medium' | 'high';
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  priority: 'low' | 'medium' | 'high';
}

interface SmartCacheOptions {
  enableLocalStorage?: boolean;
  maxEntries?: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private options: SmartCacheOptions;

  constructor(options: SmartCacheOptions = {}) {
    this.options = {
      enableLocalStorage: true,
      maxEntries: 50,
      ...options
    };
    
    // Load from localStorage on initialization
    if (this.options.enableLocalStorage && typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set<T>(key: string, data: T, config: Omit<CacheConfig, 'key'>): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl,
      priority: config.priority
    };

    this.cache.set(key, entry);
    
    // Enforce max entries limit
    if (this.cache.size > (this.options.maxEntries || 50)) {
      this.evictLowPriorityEntries();
    }
    
    // Save to localStorage
    if (this.options.enableLocalStorage) {
      this.saveToLocalStorage(key, entry);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Try loading from localStorage
      if (this.options.enableLocalStorage) {
        const stored = this.loadFromLocalStorageKey(key);
        if (stored && this.isValid(stored)) {
          this.cache.set(key, stored);
          return stored.data as T;
        }
      }
      return null;
    }
    
    if (this.isValid(entry)) {
      return entry.data as T;
    }
    
    // Entry expired, remove it
    this.cache.delete(key);
    if (this.options.enableLocalStorage) {
      localStorage.removeItem(`smartcache_${key}`);
    }
    
    return null;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    if (this.options.enableLocalStorage) {
      localStorage.removeItem(`smartcache_${key}`);
    }
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.invalidate(key));
  }

  clear(): void {
    this.cache.clear();
    if (this.options.enableLocalStorage && typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('smartcache_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }

  private isValid(entry: CacheEntry<any>): boolean {
    return (Date.now() - entry.timestamp) < entry.ttl;
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if ((now - entry.timestamp) >= entry.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.invalidate(key));
    
    console.log(`[SmartCache] Cleaned up ${expiredKeys.length} expired entries`);
  }

  private evictLowPriorityEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by priority (low first) then by age (oldest first)
    entries.sort(([, a], [, b]) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });
    
    // Remove lowest priority entries
    const toRemove = Math.ceil(entries.length * 0.2); // Remove 20%
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.invalidate(key);
    }
    
    console.log(`[SmartCache] Evicted ${toRemove} low priority entries`);
  }

  private saveToLocalStorage(key: string, entry: CacheEntry<any>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`smartcache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('[SmartCache] Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorageKey(key: string): CacheEntry<any> | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(`smartcache_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('[SmartCache] Failed to load from localStorage:', error);
      return null;
    }
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('smartcache_')) {
        const cacheKey = key.replace('smartcache_', '');
        const entry = this.loadFromLocalStorageKey(cacheKey);
        
        if (entry && this.isValid(entry)) {
          this.cache.set(cacheKey, entry);
        } else if (entry) {
          // Remove expired entries from localStorage
          localStorage.removeItem(key);
        }
      }
    });
  }

  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    this.cache.forEach(entry => {
      if (this.isValid(entry)) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(this.cache.size, 1)
    };
  }
}

// Global cache instance
const globalCache = new SmartCache();

// Cache configurations for different data types
export const CACHE_CONFIGS = {
  LIVE_FIXTURES: { ttl: 30 * 1000, priority: 'high' as const }, // 30 seconds
  TODAY_FIXTURES: { ttl: 2 * 60 * 1000, priority: 'high' as const }, // 2 minutes
  TEAMS: { ttl: 60 * 60 * 1000, priority: 'medium' as const }, // 1 hour
  LEAGUES: { ttl: 24 * 60 * 60 * 1000, priority: 'low' as const }, // 24 hours
  ODDS_PRE: { ttl: 5 * 60 * 1000, priority: 'medium' as const }, // 5 minutes
  TOP_SCORERS: { ttl: 10 * 60 * 1000, priority: 'medium' as const }, // 10 minutes
  TOP_CARDS: { ttl: 15 * 60 * 1000, priority: 'low' as const }, // 15 minutes
};

export function useSmartCache() {
  const [stats, setStats] = useState(globalCache.getStats());

  const refreshStats = useCallback(() => {
    setStats(globalCache.getStats());
  }, []);

  useEffect(() => {
    const interval = setInterval(refreshStats, 10000); // Update stats every 10s
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    cache: globalCache,
    stats,
    refreshStats
  };
}