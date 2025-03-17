// Configurações do ambiente
const env = process.env.NODE_ENV || 'development';

// URLs da API
const API_URLS = {
  development: 'http://localhost:8000',
  production: 'https://api.meetingtranscriber.com.br',
  test: 'http://localhost:8000',
};

// Configuração da API
export const API_URL = process.env.NEXT_PUBLIC_API_URL || API_URLS[env];

// Configurações de autenticação
export const AUTH_CONFIG = {
  tokenKey: 'meeting_transcriber_token',
  refreshTokenKey: 'meeting_transcriber_refresh_token',
  tokenExpireTime: 60 * 60 * 1000, // 1 hora em milissegundos
};

// Plataformas suportadas
export const SUPPORTED_PLATFORMS = [
  { id: 'zoom', name: 'Zoom', icon: 'zoom.svg' },
  { id: 'google_meet', name: 'Google Meet', icon: 'google-meet.svg' },
  { id: 'ms_teams', name: 'Microsoft Teams', icon: 'ms-teams.svg' },
  { id: 'other', name: 'Outra', icon: 'other.svg' },
];

// Status de reunião
export const MEETING_STATUS = {
  scheduled: 'Agendada',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

// Configurações de paginação
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
};

// Configurações de exportação
export const EXPORT_FORMATS = [
  { id: 'pdf', name: 'PDF', icon: 'pdf.svg' },
  { id: 'docx', name: 'Word', icon: 'word.svg' },
  { id: 'txt', name: 'Texto', icon: 'text.svg' },
  { id: 'json', name: 'JSON', icon: 'json.svg' },
];

// Configurações de integração com RD Station
export const RD_STATION_CONFIG = {
  enabled: true,
  apiUrl: 'https://api.rd.services',
};

// Configurações de análise de sentimento
export const SENTIMENT_ANALYSIS_CONFIG = {
  enabled: true,
  thresholds: {
    positive: 0.6,
    negative: 0.4,
  },
};

// Configurações de resumo automático
export const SUMMARY_CONFIG = {
  enabled: true,
  maxLength: 500,
};

// Configurações de idioma
export const LANGUAGE_CONFIG = {
  default: 'pt-BR',
  supported: [
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'es', name: 'Español' },
  ],
};

// Configurações de tema
export const THEME_CONFIG = {
  colors: {
    primary: {
      light: '#3B82F6', // blue-500
      main: '#2563EB', // blue-600
      dark: '#1D4ED8', // blue-700
    },
    secondary: {
      light: '#6366F1', // indigo-500
      main: '#4F46E5', // indigo-600
      dark: '#4338CA', // indigo-700
    },
  },
}; 