import { logger } from './logger';
import { API_URL, CACHE } from '@/config';

// Tipos para o cliente HTTP
interface RequestOptions extends Omit<RequestInit, 'cache'> {
  params?: Record<string, string | number | boolean>;
  withAuth?: boolean;
  timeout?: number;
  retry?: {
    attempts: number;
    delay: number;
  };
  cacheOptions?: {
    key: string;
    ttl: number;
  };
  cache?: RequestCache;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  cached?: boolean;
}

// Cache simples em memória
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

/**
 * Cliente HTTP avançado para fazer requisições à API
 * Inclui tratamento de erros, autenticação, retry, timeout e cache
 */
class ApiClient {
  private baseUrl: string;
  private cache: Map<string, CacheEntry<any>>;
  private defaultTimeout: number;
  private defaultRetry: { attempts: number; delay: number };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.defaultTimeout = 10000; // 10 segundos
    this.defaultRetry = { attempts: 3, delay: 1000 }; // 3 tentativas, 1 segundo de delay
  }

  /**
   * Obtém o token de autenticação do armazenamento local
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    try {
      // Verificar se o token está expirado
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Converter para milissegundos
      
      if (Date.now() >= expiryTime) {
        logger.warn('Token expirado, removendo do localStorage', { context: 'ApiClient' });
        localStorage.removeItem('auth_token');
        return null;
      }
      
      return token;
    } catch (error) {
      logger.warn('Erro ao decodificar token', { context: 'ApiClient', data: { error } });
      return token; // Retorna o token mesmo se não conseguir decodificar
    }
  }

  /**
   * Constrói a URL completa com parâmetros de consulta
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  /**
   * Prepara os headers da requisição
   */
  private prepareHeaders(options: RequestOptions): Headers {
    const headers = new Headers(options.headers);
    
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    if (options.withAuth !== false) {
      const token = this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    
    return headers;
  }

  /**
   * Verifica se há dados em cache para a requisição
   */
  private getCachedData<T>(cacheKey: string): T | null {
    if (!cacheKey) return null;
    
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    // Verificar se o cache expirou
    if (Date.now() > cached.expiry) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    logger.debug(`Usando dados em cache para ${cacheKey}`, { context: 'ApiClient' });
    return cached.data;
  }

  /**
   * Armazena dados em cache
   */
  private setCachedData<T>(cacheKey: string, data: T, ttl: number): void {
    if (!cacheKey) return;
    
    const expiry = Date.now() + ttl * 1000; // Converter TTL de segundos para milissegundos
    this.cache.set(cacheKey, { data, expiry });
    
    logger.debug(`Dados armazenados em cache para ${cacheKey}`, { 
      context: 'ApiClient',
      data: { ttl, expiry: new Date(expiry).toISOString() }
    });
  }

  /**
   * Limpa o cache para uma chave específica ou todo o cache
   */
  clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      logger.debug(`Cache limpo para ${cacheKey}`, { context: 'ApiClient' });
    } else {
      this.cache.clear();
      logger.debug('Cache limpo completamente', { context: 'ApiClient' });
    }
  }

  /**
   * Implementa timeout para a requisição fetch
   */
  private fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error(`Timeout de ${timeout}ms excedido`));
      }, timeout);
      
      fetch(url, {
        ...options,
        signal: controller.signal
      })
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  /**
   * Implementa retry para a requisição
   */
  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    { attempts, delay }: { attempts: number; delay: number }
  ): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fetch(url, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < attempts) {
          logger.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`, {
            context: 'ApiClient',
            data: { url, error: lastError.message }
          });
          
          // Esperar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Aumentar o delay para a próxima tentativa (exponential backoff)
          delay = Math.min(delay * 2, 10000); // Máximo de 10 segundos
        }
      }
    }
    
    throw lastError || new Error('Todas as tentativas falharam');
  }

  /**
   * Faz uma requisição HTTP e trata a resposta
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options.params);
      const headers = this.prepareHeaders(options);
      
      // Verificar cache se configurado
      if (options.cacheOptions?.key) {
        const cachedData = this.getCachedData<T>(options.cacheOptions.key);
        if (cachedData) {
          return {
            data: cachedData,
            error: null,
            status: 200,
            cached: true
          };
        }
      }
      
      logger.debug(`Requisição ${options.method || 'GET'} para ${url}`, {
        context: 'ApiClient',
        data: { headers: Object.fromEntries(headers.entries()) }
      });
      
      // Configurar timeout e retry
      const timeout = options.timeout || this.defaultTimeout;
      const retry = options.retry || this.defaultRetry;
      
      // Extrair as opções que não fazem parte do RequestInit padrão
      const { params, withAuth, timeout: _, retry: __, cacheOptions, ...fetchOptions } = options;
      
      // Fazer a requisição com timeout e retry
      let response: Response;
      try {
        if (retry.attempts > 1) {
          response = await this.fetchWithRetry(url, { ...fetchOptions, headers }, retry);
        } else {
          response = await this.fetchWithTimeout(url, { ...fetchOptions, headers }, timeout);
        }
      } catch (error) {
        logger.error('Erro na requisição', error instanceof Error ? error : new Error(String(error)), {
          context: 'ApiClient',
          data: { endpoint, options }
        });
        
        return {
          data: null,
          error: error instanceof Error ? error.message : 'Erro desconhecido na requisição',
          status: 0
        };
      }
      
      let data: T | null = null;
      let error: string | null = null;
      
      // Tenta parsear o corpo da resposta como JSON
      try {
        if (response.status !== 204) { // No Content
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          } else {
            data = await response.text() as unknown as T;
          }
        }
      } catch (e) {
        logger.warn('Erro ao parsear resposta', {
          context: 'ApiClient',
          data: { error: e instanceof Error ? e.message : String(e) }
        });
      }
      
      // Se a resposta não for bem-sucedida, extrai a mensagem de erro
      if (!response.ok) {
        error = (data as any)?.message || (data as any)?.error || response.statusText;
        data = null;
        
        logger.warn(`Erro na requisição: ${error}`, {
          context: 'ApiClient',
          data: { status: response.status, url }
        });
      } else if (options.cacheOptions?.key && data) {
        // Armazenar em cache se a resposta for bem-sucedida
        this.setCachedData(options.cacheOptions.key, data, options.cacheOptions.ttl);
      }
      
      return {
        data,
        error,
        status: response.status
      };
    } catch (e) {
      logger.error('Erro na requisição', e instanceof Error ? e : new Error(String(e)), {
        context: 'ApiClient',
        data: { endpoint, options }
      });
      
      return {
        data: null,
        error: e instanceof Error ? e.message : 'Erro desconhecido na requisição',
        status: 0
      };
    }
  }

  /**
   * Métodos HTTP
   */
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, data?: any, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Exporta uma instância única do cliente API
export const apiClient = new ApiClient(API_URL); 