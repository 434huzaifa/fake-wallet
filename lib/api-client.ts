// API client with retry logic and caching
interface ApiClientOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  useCache?: boolean;
  cacheTtl?: number; // Cache time-to-live in milliseconds
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class ApiClient {
  private cache = new Map<string, CacheEntry>();
  private defaultOptions: Required<ApiClientOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 10000,
    useCache: false,
    cacheTtl: 5 * 60 * 1000, // 5 minutes default
  };

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private isValidCacheEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && this.isValidCacheEntry(entry)) {
      return entry.data;
    }
    if (entry) {
      this.cache.delete(key); // Remove expired entry
    }
    return null;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  async request<T = any>(
    url: string, 
    options: RequestInit & ApiClientOptions = {}
  ): Promise<T> {
    const {
      maxRetries,
      retryDelay,
      timeout,
      useCache,
      cacheTtl,
      ...fetchOptions
    } = { ...this.defaultOptions, ...options };

    const cacheKey = this.getCacheKey(url, fetchOptions);

    // Check cache for GET requests
    if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
      const cachedData = this.getFromCache(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status >= 400 && response.status < 500) {
            // Client errors shouldn't be retried
            const errorData = await response.json().catch(() => ({ error: 'Client error' }));
            throw new Error(errorData.error || `HTTP ${response.status}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache successful GET responses
        if (useCache && (!fetchOptions.method || fetchOptions.method === 'GET')) {
          this.setCache(cacheKey, data, cacheTtl);
        }

        return data;

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry client errors or if this is the last attempt
        if (error instanceof Error && 
            (error.message.includes('HTTP 4') || attempt === maxRetries)) {
          throw error;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }

    throw lastError!;
  }

  // Convenience methods
  async get<T = any>(url: string, options: ApiClientOptions = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET', useCache: true });
  }

  async post<T = any>(url: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    const { useCache, cacheTtl, maxRetries, retryDelay, timeout, ...restOptions } = options;
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      maxRetries,
      retryDelay,
      timeout,
      useCache: false, // Don't cache POST requests
      cacheTtl,
      ...restOptions,
    });
  }

  async put<T = any>(url: string, data?: any, options: ApiClientOptions = {}): Promise<T> {
    const { useCache, cacheTtl, maxRetries, retryDelay, timeout, ...restOptions } = options;
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      maxRetries,
      retryDelay,
      timeout,
      useCache: false, // Don't cache PUT requests
      cacheTtl,
      ...restOptions,
    });
  }

  async delete<T = any>(url: string, options: ApiClientOptions = {}): Promise<T> {
    const { useCache, cacheTtl, maxRetries, retryDelay, timeout, ...restOptions } = options;
    return this.request<T>(url, { 
      method: 'DELETE',
      maxRetries,
      retryDelay,
      timeout,
      useCache: false, // Don't cache DELETE requests
      cacheTtl,
      ...restOptions,
    });
  }

  // Clear specific cache entry or all cache
  clearCache(pattern?: string): void {
    if (pattern) {
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      });
    } else {
      this.cache.clear();
    }
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;