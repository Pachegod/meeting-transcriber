/**
 * Configurações globais da aplicação
 */

// API URL - Usa a variável de ambiente ou fallback para localhost
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configurações de autenticação
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_DATA_KEY = 'user_data';
export const TOKEN_EXPIRATION_TIME = 3600; // 1 hora em segundos

// Configurações de gravação
export const MAX_RECORDING_DURATION = 14400; // 4 horas em segundos

// Plataformas de reunião suportadas
export const SUPPORTED_PLATFORMS = [
  'Zoom',
  'Google Meet',
  'Microsoft Teams',
  'Skype',
  'Outro'
];

// Configurações do RD Station
export const RD_STATION = {
  enabled: process.env.NEXT_PUBLIC_RD_STATION_ENABLED === 'true',
};

// Configurações de monitoramento e logging
export const MONITORING = {
  enabled: process.env.NODE_ENV === 'production',
  errorSamplingRate: 1.0, // Captura 100% dos erros em produção
  performanceSamplingRate: 0.1, // Captura 10% das métricas de performance
};

// Configurações de cache
export const CACHE = {
  meetingListTTL: 60, // 1 minuto
  meetingDetailsTTL: 300, // 5 minutos
  userProfileTTL: 600, // 10 minutos
}; 