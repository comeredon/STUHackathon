import { ChatRequest, ChatResponse } from '../types/chat';

// Read API URL from runtime config (injected by Docker entrypoint) or Vite env
const getApiUrl = (): string => {
  const appConfig = (window as any).APP_CONFIG;
  if (appConfig?.VITE_API_URL) {
    return appConfig.VITE_API_URL;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const API_URL = getApiUrl();

// Cache configuration
const CACHE_ENABLED = true;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries

interface CacheEntry {
  response: ChatResponse;
  timestamp: number;
}

/**
 * Simple in-memory cache for chat responses
 */
class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generate a cache key from the message (normalized)
   */
  private generateKey(message: string): string {
    return message.toLowerCase().trim();
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > CACHE_TTL_MS;
  }

  /**
   * Evict oldest entries if cache is full
   */
  private evictOldest(): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      // Find and remove the oldest entry
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * Get cached response if available and not expired
   */
  get(message: string): ChatResponse | null {
    const key = this.generateKey(message);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`🎯 Cache hit for: "${message.substring(0, 50)}..."`);
    return entry.response;
  }

  /**
   * Store response in cache
   */
  set(message: string, response: ChatResponse): void {
    if (!response.success) {
      // Don't cache error responses
      return;
    }
    
    this.evictOldest();
    
    const key = this.generateKey(message);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
    
    console.log(`💾 Cached response for: "${message.substring(0, 50)}..." (${this.cache.size} entries)`);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttlMinutes: number } {
    return {
      size: this.cache.size,
      maxSize: MAX_CACHE_SIZE,
      ttlMinutes: CACHE_TTL_MS / 60000,
    };
  }
}

// Singleton cache instance
const responseCache = new ResponseCache();

/**
 * Backend API client - no authentication required
 * Calls the demo endpoint that uses Fabric Data Agent via MCP
 * Includes response caching for repeated questions
 */
export class BackendApiClient {
  private apiUrl: string;

  constructor(apiUrl: string = API_URL) {
    this.apiUrl = apiUrl;
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    responseCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return responseCache.getStats();
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.apiUrl) {
      return {
        success: false,
        message: 'Backend API URL is not configured',
        error: 'VITE_API_URL environment variable is missing',
      };
    }

    // Check cache first (if enabled)
    if (CACHE_ENABLED) {
      const cachedResponse = responseCache.get(request.message);
      if (cachedResponse) {
        // Return cached response with a note
        return {
          ...cachedResponse,
          message: cachedResponse.message + '\n\n---\n*⚡ Cached response*',
        };
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          threadId: request.threadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const chatResponse: ChatResponse = {
          success: true,
          message: data.data.content,
          threadId: data.data.threadId,
        };

        // Cache the successful response
        if (CACHE_ENABLED) {
          responseCache.set(request.message, chatResponse);
        }

        return chatResponse;
      } else {
        return {
          success: false,
          message: data.message || 'Request failed',
          error: data.error,
        };
      }
    } catch (error) {
      console.error('Backend API error:', error);
      return {
        success: false,
        message: 'Failed to communicate with backend API',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
