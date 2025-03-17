import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY, TOKEN_EXPIRATION_TIME } from '@/config';
import Cookies from 'js-cookie';

// Tipos
export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  createdAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

/**
 * Realiza o login do usuário
 */
export async function login(data: LoginData): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Tentativa de login', { context: 'AuthService', data: { email: data.email } });
    
    const response = await api.post<AuthResponse>('/auth/login', data);
    
    if (response.error || !response.data) {
      logger.warn('Falha no login', { 
        context: 'AuthService', 
        data: { error: response.error, status: response.status } 
      });
      return { success: false, error: response.error || 'Erro desconhecido no login' };
    }
    
    const { user, token, refreshToken } = response.data;
    
    // Armazena os tokens e dados do usuário
    setTokens(token, refreshToken);
    setUserData(user);
    
    logger.info('Login realizado com sucesso', { context: 'AuthService', data: { userId: user.id } });
    return { success: true };
  } catch (error) {
    logger.error('Erro no processo de login', error instanceof Error ? error : new Error(String(error)), {
      context: 'AuthService'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no login' 
    };
  }
}

/**
 * Registra um novo usuário
 */
export async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('Tentativa de registro', { context: 'AuthService', data: { email: data.email } });
    
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    if (response.error || !response.data) {
      logger.warn('Falha no registro', { 
        context: 'AuthService', 
        data: { error: response.error, status: response.status } 
      });
      return { success: false, error: response.error || 'Erro desconhecido no registro' };
    }
    
    const { user, token, refreshToken } = response.data;
    
    // Armazena os tokens e dados do usuário
    setTokens(token, refreshToken);
    setUserData(user);
    
    logger.info('Registro realizado com sucesso', { context: 'AuthService', data: { userId: user.id } });
    return { success: true };
  } catch (error) {
    logger.error('Erro no processo de registro', error instanceof Error ? error : new Error(String(error)), {
      context: 'AuthService'
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no registro' 
    };
  }
}

/**
 * Realiza o logout do usuário
 */
export function logout(): void {
  try {
    logger.info('Realizando logout', { context: 'AuthService' });
    
    // Remove tokens e dados do usuário
    removeTokens();
    removeUserData();
    
    // Redireciona para a página de login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  } catch (error) {
    logger.error('Erro ao realizar logout', error instanceof Error ? error : new Error(String(error)), {
      context: 'AuthService'
    });
  }
}

/**
 * Renova o token de autenticação
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const currentRefreshToken = getRefreshToken();
    
    if (!currentRefreshToken) {
      logger.warn('Tentativa de refresh sem token', { context: 'AuthService' });
      return false;
    }
    
    logger.info('Tentativa de renovação de token', { context: 'AuthService' });
    
    const response = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken: currentRefreshToken
    }, { withAuth: false });
    
    if (response.error || !response.data) {
      logger.warn('Falha na renovação de token', { 
        context: 'AuthService', 
        data: { error: response.error, status: response.status } 
      });
      return false;
    }
    
    const { token, refreshToken: newRefreshToken } = response.data;
    
    // Atualiza os tokens
    setTokens(token, newRefreshToken);
    
    logger.info('Token renovado com sucesso', { context: 'AuthService' });
    return true;
  } catch (error) {
    logger.error('Erro na renovação de token', error instanceof Error ? error : new Error(String(error)), {
      context: 'AuthService'
    });
    return false;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getAuthToken();
  return !!token;
}

/**
 * Obtém os dados do usuário atual
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    if (!userData) return null;
    
    return JSON.parse(userData) as User;
  } catch (error) {
    logger.error('Erro ao obter dados do usuário', error instanceof Error ? error : new Error(String(error)), {
      context: 'AuthService'
    });
    return null;
  }
}

// Funções auxiliares para gerenciar tokens e dados do usuário

function setTokens(token: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  
  // Armazena o token principal em cookie para segurança
  Cookies.set(AUTH_TOKEN_KEY, token, { 
    expires: TOKEN_EXPIRATION_TIME / (60 * 60 * 24), // Converte segundos para dias
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  
  // Armazena o refresh token em localStorage
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function removeTokens(): void {
  if (typeof window === 'undefined') return;
  
  Cookies.remove(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return Cookies.get(AUTH_TOKEN_KEY) || null;
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setUserData(user: User): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

function removeUserData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(USER_DATA_KEY);
} 