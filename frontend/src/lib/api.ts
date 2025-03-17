import { logger } from './logger';
import { API_URL } from '@/config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
  withAuth?: boolean;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Cliente HTTP para fazer requisições à API
 * Inclui tratamento de erros, autenticação e logging
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Obtém o token de autenticação do armazenamento local
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
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
   * Faz uma requisição HTTP e trata a resposta
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options.params);
      const headers = this.prepareHeaders(options);
      
      logger.debug(`Requisição ${options.method || 'GET'} para ${url}`, {
        context: 'ApiClient',
        data: { headers: Object.fromEntries(headers.entries()) }
      });
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
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
export const api = new ApiClient(API_URL); 