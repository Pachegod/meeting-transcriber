/**
 * Serviço de logging para a aplicação
 * Centraliza todos os logs e permite configuração por ambiente
 */

import { MONITORING } from '@/config';

// Tipos para o logger
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext = string;
type LogData = Record<string, any>;

interface LogOptions {
  context?: LogContext;
  data?: LogData;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  error?: string;
  stack?: string;
  [key: string]: any;
}

class Logger {
  private isProduction: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isEnabled = true;
  }

  /**
   * Habilita ou desabilita o logger
   */
  enable(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Log de nível debug - apenas para desenvolvimento
   */
  debug(message: string, options?: LogOptions): void {
    if (!this.isEnabled) return;
    
    // Em produção, não exibe logs de debug
    if (this.isProduction) return;
    
    this.log('debug', message, null, options);
  }

  /**
   * Log de nível info - informações gerais
   */
  info(message: string, options?: LogOptions): void {
    if (!this.isEnabled) return;
    this.log('info', message, null, options);
  }

  /**
   * Log de nível warn - avisos que não quebram a aplicação
   */
  warn(message: string, options?: LogOptions): void {
    if (!this.isEnabled) return;
    this.log('warn', message, null, options);
  }

  /**
   * Log de nível error - erros que afetam a aplicação
   */
  error(message: string, error?: Error | null, options?: LogOptions): void {
    if (!this.isEnabled) return;
    this.log('error', message, error, options);
  }

  /**
   * Método interno para processar e exibir logs
   */
  private log(
    level: LogLevel, 
    message: string, 
    error: Error | null = null, 
    options?: LogOptions
  ): void {
    const timestamp = new Date().toISOString();
    const context = options?.context || 'App';
    const data = options?.data || {};

    // Formatar o log para console
    const logData: LogEntry = {
      timestamp,
      level,
      context,
      message,
      ...data
    };

    // Adicionar stack trace se for um erro
    if (error) {
      logData.error = error.message;
      logData.stack = error.stack;
    }

    // Em desenvolvimento, exibe no console
    if (!this.isProduction) {
      this.logToConsole(level, message, error, logData);
    }

    // Em produção, envia para serviço de monitoramento
    if (this.isProduction && MONITORING.enabled) {
      this.sendToMonitoringService(level, message, error, logData);
    }
  }

  /**
   * Exibe logs no console com formatação adequada
   */
  private logToConsole(
    level: LogLevel, 
    message: string, 
    error: Error | null, 
    data: LogEntry
  ): void {
    const styles = {
      debug: 'color: #6b7280',
      info: 'color: #2563eb',
      warn: 'color: #d97706',
      error: 'color: #dc2626; font-weight: bold'
    };

    const prefix = `%c[${data.timestamp}] [${level.toUpperCase()}] [${data.context}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, styles[level], message, data);
        break;
      case 'info':
        console.info(prefix, styles[level], message, data);
        break;
      case 'warn':
        console.warn(prefix, styles[level], message, data);
        break;
      case 'error':
        console.error(prefix, styles[level], message, error, data);
        break;
    }
  }

  /**
   * Envia logs para um serviço de monitoramento externo
   * Implementação depende do serviço escolhido (Sentry, LogRocket, etc)
   */
  private sendToMonitoringService(
    level: LogLevel, 
    message: string, 
    error: Error | null, 
    data: LogEntry
  ): void {
    // Implementação para enviar logs para serviço de monitoramento
    // Exemplo com Sentry:
    // if (window.Sentry) {
    //   if (level === 'error' && error) {
    //     window.Sentry.captureException(error, {
    //       extra: data,
    //       tags: { context: data.context }
    //     });
    //   } else {
    //     window.Sentry.captureMessage(message, {
    //       level,
    //       extra: data,
    //       tags: { context: data.context }
    //     });
    //   }
    // }
  }
}

// Exporta uma instância única do logger
export const logger = new Logger(); 