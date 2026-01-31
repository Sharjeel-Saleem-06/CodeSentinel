/**
 * Multi-Provider AI Service
 * Supports multiple AI providers with automatic fallback and load balancing
 * 
 * Providers:
 * 1. Groq (Primary) - 10 API keys with rotation
 * 2. Google Gemini - Free tier: 15 RPM, 1500 RPD
 * 3. HuggingFace - Free tier inference API
 * 4. Together AI - Free tier available
 */

import { groqKeyManager, GROQ_CONFIG } from './groqConfig';

// ============ TYPES ============

export interface AIProvider {
  name: string;
  isAvailable: () => Promise<boolean>;
  chat: (messages: AIMessage[], options?: AIOptions) => Promise<string>;
  stream?: (messages: AIMessage[], callbacks: StreamCallbacks) => Promise<void>;
  getStatus: () => ProviderStatus;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface StreamCallbacks {
  onUpdate: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  requestsRemaining?: number;
  rateLimitReset?: number;
  lastError?: string;
}

// ============ GROQ PROVIDER ============

class GroqProvider implements AIProvider {
  name = 'Groq';
  private lastError: string | null = null;
  
  async isAvailable(): Promise<boolean> {
    return groqKeyManager.hasKeys() && groqKeyManager.getStatus().available > 0;
  }
  
  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    const apiKey = groqKeyManager.getNextKey();
    
    try {
      const response = await fetch(GROQ_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options?.model || GROQ_CONFIG.model,
          messages,
          temperature: options?.temperature ?? GROQ_CONFIG.temperature,
          max_tokens: options?.maxTokens ?? GROQ_CONFIG.maxTokens,
        }),
      });
      
      if (response.status === 429) {
        groqKeyManager.markRateLimited(apiKey);
        this.lastError = 'Rate limited';
        throw new Error('Rate limited');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        this.lastError = errorText;
        throw new Error(`Groq API error: ${response.status}`);
      }
      
      const data = await response.json();
      this.lastError = null;
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      groqKeyManager.markRateLimited(apiKey);
      throw error;
    }
  }
  
  async stream(messages: AIMessage[], callbacks: StreamCallbacks): Promise<void> {
    const apiKey = groqKeyManager.getNextKey();
    
    try {
      const response = await fetch(GROQ_CONFIG.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_CONFIG.model,
          messages,
          temperature: GROQ_CONFIG.temperature,
          max_tokens: GROQ_CONFIG.maxTokens,
          stream: true,
        }),
      });
      
      if (response.status === 429) {
        groqKeyManager.markRateLimited(apiKey);
        callbacks.onError('Rate limited');
        return;
      }
      
      if (!response.ok) {
        callbacks.onError(`API error: ${response.status}`);
        return;
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError('No response body');
        return;
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              callbacks.onComplete();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                callbacks.onUpdate(content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
      
      callbacks.onComplete();
    } catch (error) {
      groqKeyManager.markRateLimited(apiKey);
      callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  getStatus(): ProviderStatus {
    const status = groqKeyManager.getStatus();
    return {
      name: this.name,
      available: status.available > 0,
      requestsRemaining: status.available,
      lastError: this.lastError || undefined,
    };
  }
}

// ============ GEMINI PROVIDER ============

class GeminiProvider implements AIProvider {
  name = 'Gemini';
  private apiKey: string | null = null;
  private lastError: string | null = null;
  private rateLimitedUntil: number = 0;
  
  // Free tier limits: 15 requests per minute, 1500 requests per day
  
  constructor() {
    // Get Gemini API key from environment
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || null;
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    if (Date.now() < this.rateLimitedUntil) return false;
    return true;
  }
  
  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
    
    // Add system prompt to first user message if present
    const systemMsg = messages.find(m => m.role === 'system');
    if (systemMsg && contents.length > 0) {
      contents[0].parts[0].text = `${systemMsg.content}\n\n${contents[0].parts[0].text}`;
    }
    
    const model = options?.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 4096,
          },
        }),
      });
      
      if (response.status === 429) {
        this.rateLimitedUntil = Date.now() + 60000; // Block for 1 minute
        this.lastError = 'Rate limited';
        throw new Error('Rate limited');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        this.lastError = errorText;
        throw new Error(`Gemini API error: ${response.status}`);
      }
      
      const data = await response.json();
      this.lastError = null;
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      throw error;
    }
  }
  
  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: !!this.apiKey && Date.now() >= this.rateLimitedUntil,
      rateLimitReset: this.rateLimitedUntil > Date.now() ? this.rateLimitedUntil : undefined,
      lastError: this.lastError || undefined,
    };
  }
}

// ============ HUGGINGFACE PROVIDER ============

class HuggingFaceProvider implements AIProvider {
  name = 'HuggingFace';
  private apiKey: string | null = null;
  private lastError: string | null = null;
  private rateLimitedUntil: number = 0;
  
  // Free models: DEFAULT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1'
  // CODE_MODEL = 'codellama/CodeLlama-34b-Instruct-hf'
  private readonly DEFAULT_MODEL = 'mistralai/Mixtral-8x7B-Instruct-v0.1';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || null;
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    if (Date.now() < this.rateLimitedUntil) return false;
    return true;
  }
  
  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('HuggingFace API key not configured');
    }
    
    // Format messages for HuggingFace chat completion
    const prompt = messages.map(m => {
      if (m.role === 'system') return `<s>[INST] <<SYS>>\n${m.content}\n<</SYS>>\n\n`;
      if (m.role === 'user') return `${m.content} [/INST]`;
      return `${m.content}</s><s>[INST] `;
    }).join('');
    
    const model = options?.model || this.DEFAULT_MODEL;
    const url = `https://api-inference.huggingface.co/models/${model}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            temperature: options?.temperature ?? 0.7,
            max_new_tokens: options?.maxTokens ?? 2048,
            return_full_text: false,
          },
        }),
      });
      
      if (response.status === 429) {
        this.rateLimitedUntil = Date.now() + 60000;
        this.lastError = 'Rate limited';
        throw new Error('Rate limited');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        this.lastError = errorText;
        throw new Error(`HuggingFace API error: ${response.status}`);
      }
      
      const data = await response.json();
      this.lastError = null;
      
      if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
      }
      return data.generated_text || '';
    } catch (error) {
      throw error;
    }
  }
  
  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: !!this.apiKey && Date.now() >= this.rateLimitedUntil,
      rateLimitReset: this.rateLimitedUntil > Date.now() ? this.rateLimitedUntil : undefined,
      lastError: this.lastError || undefined,
    };
  }
}

// ============ TOGETHER AI PROVIDER ============

class TogetherAIProvider implements AIProvider {
  name = 'Together AI';
  private apiKey: string | null = null;
  private lastError: string | null = null;
  private rateLimitedUntil: number = 0;
  
  // Free tier models
  private readonly DEFAULT_MODEL = 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo';
  
  constructor() {
    this.apiKey = import.meta.env.VITE_TOGETHER_API_KEY || null;
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    if (Date.now() < this.rateLimitedUntil) return false;
    return true;
  }
  
  async chat(messages: AIMessage[], options?: AIOptions): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Together AI API key not configured');
    }
    
    const model = options?.model || this.DEFAULT_MODEL;
    const url = 'https://api.together.xyz/v1/chat/completions';
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 2048,
        }),
      });
      
      if (response.status === 429) {
        this.rateLimitedUntil = Date.now() + 60000;
        this.lastError = 'Rate limited';
        throw new Error('Rate limited');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        this.lastError = errorText;
        throw new Error(`Together AI error: ${response.status}`);
      }
      
      const data = await response.json();
      this.lastError = null;
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      throw error;
    }
  }
  
  getStatus(): ProviderStatus {
    return {
      name: this.name,
      available: !!this.apiKey && Date.now() >= this.rateLimitedUntil,
      rateLimitReset: this.rateLimitedUntil > Date.now() ? this.rateLimitedUntil : undefined,
      lastError: this.lastError || undefined,
    };
  }
}

// ============ MULTI-PROVIDER AI ENGINE ============

export class MultiProviderAI {
  private providers: AIProvider[];
  private cache: Map<string, { result: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  constructor() {
    this.providers = [
      new GroqProvider(),      // Primary - fastest, 10 keys
      new GeminiProvider(),    // Fallback - good for complex analysis
      new TogetherAIProvider(), // Fallback - free tier
      new HuggingFaceProvider(), // Fallback - free inference
    ];
  }
  
  /**
   * Generate a cache key from messages
   */
  private getCacheKey(messages: AIMessage[], options?: AIOptions): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const optStr = options ? JSON.stringify(options) : '';
    return btoa(content + optStr).substring(0, 64);
  }
  
  /**
   * Check if cached result exists and is valid
   */
  private getCachedResult(key: string): string | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }
  
  /**
   * Main chat method with automatic fallback
   */
  async chat(
    messages: AIMessage[],
    options?: AIOptions & { useCache?: boolean }
  ): Promise<string> {
    // Check cache first
    if (options?.useCache !== false) {
      const cacheKey = this.getCacheKey(messages, options);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        console.log('[AI] Cache hit');
        return cached;
      }
    }
    
    let lastError: Error | null = null;
    
    // Try each provider in order
    for (const provider of this.providers) {
      if (!(await provider.isAvailable())) {
        continue;
      }
      
      try {
        console.log(`[AI] Using ${provider.name}`);
        const result = await provider.chat(messages, options);
        
        // Cache the result
        if (options?.useCache !== false) {
          const cacheKey = this.getCacheKey(messages, options);
          this.cache.set(cacheKey, { result, timestamp: Date.now() });
        }
        
        return result;
      } catch (error) {
        console.warn(`[AI] ${provider.name} failed:`, error);
        lastError = error as Error;
        // Continue to next provider
      }
    }
    
    throw lastError || new Error('All AI providers unavailable');
  }
  
  /**
   * Stream chat response
   */
  async stream(
    messages: AIMessage[],
    callbacks: StreamCallbacks
  ): Promise<void> {
    // Find first provider that supports streaming
    for (const provider of this.providers) {
      if (!(await provider.isAvailable())) continue;
      if (!provider.stream) continue;
      
      try {
        console.log(`[AI] Streaming with ${provider.name}`);
        await provider.stream(messages, callbacks);
        return;
      } catch (error) {
        console.warn(`[AI] ${provider.name} stream failed:`, error);
        // Continue to next provider
      }
    }
    
    // No streaming available, fall back to regular chat
    try {
      const result = await this.chat(messages);
      callbacks.onUpdate(result);
      callbacks.onComplete();
    } catch (error) {
      callbacks.onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Quick analysis - uses faster model/settings
   */
  async quickAnalysis(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    return this.chat(messages, {
      temperature: 0.3,
      maxTokens: 1024,
    });
  }
  
  /**
   * Deep analysis - uses more capable model/settings
   */
  async deepAnalysis(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    
    return this.chat(messages, {
      temperature: 0.7,
      maxTokens: 4096,
    });
  }
  
  /**
   * Get status of all providers
   */
  getAllStatus(): ProviderStatus[] {
    return this.providers.map(p => p.getStatus());
  }
  
  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============ SINGLETON INSTANCE ============

export const aiEngine = new MultiProviderAI();

// ============ CONVENIENCE FUNCTIONS ============

export async function chatWithAI(
  prompt: string,
  systemPrompt?: string,
  options?: AIOptions
): Promise<string> {
  const messages: AIMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  return aiEngine.chat(messages, options);
}

export async function streamAIChat(
  prompt: string,
  systemPrompt: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];
  
  return aiEngine.stream(messages, callbacks);
}
