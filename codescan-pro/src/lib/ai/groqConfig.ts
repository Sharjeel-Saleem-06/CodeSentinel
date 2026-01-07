/**
 * Groq API Configuration
 * Load balancing across multiple API keys for rate limit handling
 * 
 * SECURITY NOTE: All API keys should be stored in environment variables
 * Create a .env file with VITE_GROQ_API_KEY_1, VITE_GROQ_API_KEY_2, etc.
 */

// Get API keys from environment variables
const getApiKeysFromEnv = (): string[] => {
  const keys: string[] = [];
  
  // Primary key
  const primaryKey = import.meta.env.VITE_GROQ_API_KEY;
  if (primaryKey) keys.push(primaryKey);
  
  // Additional keys for load balancing (optional)
  for (let i = 1; i <= 10; i++) {
    const key = import.meta.env[`VITE_GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  
  return keys;
};

// API Keys for load balancing (loaded from environment)
const API_KEYS = getApiKeysFromEnv();

// Track key usage and rate limits
interface KeyStatus {
  key: string;
  lastUsed: number;
  requestCount: number;
  isRateLimited: boolean;
  rateLimitResetTime: number;
}

class GroqKeyManager {
  private keys: KeyStatus[];
  private currentIndex: number = 0;
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 30; // Conservative limit per key

  constructor() {
    this.keys = API_KEYS.map(key => ({
      key,
      lastUsed: 0,
      requestCount: 0,
      isRateLimited: false,
      rateLimitResetTime: 0,
    }));
  }

  /**
   * Check if any API keys are configured
   */
  hasKeys(): boolean {
    return this.keys.length > 0;
  }

  /**
   * Get the next available API key using round-robin with rate limit awareness
   */
  getNextKey(): string {
    if (!this.hasKeys()) {
      console.warn('No Groq API keys configured. Please set VITE_GROQ_API_KEY in your .env file.');
      return '';
    }

    const now = Date.now();
    
    // Try to find a non-rate-limited key
    for (let i = 0; i < this.keys.length; i++) {
      const index = (this.currentIndex + i) % this.keys.length;
      const keyStatus = this.keys[index];

      // Reset rate limit if window has passed
      if (keyStatus.isRateLimited && now > keyStatus.rateLimitResetTime) {
        keyStatus.isRateLimited = false;
        keyStatus.requestCount = 0;
      }

      // Reset request count if window has passed
      if (now - keyStatus.lastUsed > this.RATE_LIMIT_WINDOW) {
        keyStatus.requestCount = 0;
      }

      // Use this key if not rate limited and under request limit
      if (!keyStatus.isRateLimited && keyStatus.requestCount < this.MAX_REQUESTS_PER_MINUTE) {
        keyStatus.lastUsed = now;
        keyStatus.requestCount++;
        this.currentIndex = (index + 1) % this.keys.length;
        return keyStatus.key;
      }
    }

    // All keys are rate limited, use the one with earliest reset time
    const sortedByReset = [...this.keys].sort((a, b) => a.rateLimitResetTime - b.rateLimitResetTime);
    return sortedByReset[0].key;
  }

  /**
   * Mark a key as rate limited
   */
  markRateLimited(key: string): void {
    const keyStatus = this.keys.find(k => k.key === key);
    if (keyStatus) {
      keyStatus.isRateLimited = true;
      keyStatus.rateLimitResetTime = Date.now() + this.RATE_LIMIT_WINDOW;
    }
  }

  /**
   * Get status of all keys
   */
  getStatus(): { total: number; available: number; rateLimited: number } {
    const now = Date.now();
    let available = 0;
    let rateLimited = 0;

    this.keys.forEach(keyStatus => {
      if (keyStatus.isRateLimited && now <= keyStatus.rateLimitResetTime) {
        rateLimited++;
      } else {
        available++;
      }
    });

    return { total: this.keys.length, available, rateLimited };
  }
}

// Singleton instance
export const groqKeyManager = new GroqKeyManager();

// Groq API configuration
export const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 2000,
};

/**
 * Get the next available Groq API key
 */
export function getNextGroqApiKey(): string {
  return groqKeyManager.getNextKey();
}

/**
 * Get the count of available API keys
 */
export function getAvailableKeysCount(): number {
  return groqKeyManager.getStatus().available;
}

/**
 * Mark a key as rate limited
 */
export function markKeyRateLimited(key: string): void {
  groqKeyManager.markRateLimited(key);
}

/**
 * Check if Groq API is configured
 */
export function isGroqConfigured(): boolean {
  return groqKeyManager.hasKeys();
}
