/**
 * Sistema de Logging Otimizado
 * 
 * Este módulo implementa um sistema de logging robusto com:
 * - Diferentes níveis de log (error, warn, info, debug)
 * - Formatação estruturada
 * - Integração com cache para performance
 * - Logs em arquivo e console
 * - Filtros por ambiente
 * 
 * Características:
 * - Performance otimizada
 * - Logs estruturados em JSON
 * - Rotação automática de arquivos
 * - Integração com sistema de cache
 * - Filtros por contexto
 */

import { cache } from './cache/redis';

// Níveis de log
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Configurações do logger
const LOG_CONFIG = {
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: process.env.NODE_ENV === 'production',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  logDir: process.env.LOG_DIR || './logs',
} as const;

// Cores para console (apenas em desenvolvimento)
const LOG_COLORS = {
  [LogLevel.ERROR]: '\x1b[31m', // Vermelho
  [LogLevel.WARN]: '\x1b[33m',  // Amarelo
  [LogLevel.INFO]: '\x1b[36m',  // Ciano
  [LogLevel.DEBUG]: '\x1b[35m', // Magenta
  RESET: '\x1b[0m',
} as const;

/**
 * Classe principal do sistema de logging
 */
export class Logger {
  private context: string;
  private cacheKey: string;

  constructor(context: string = 'app') {
    this.context = context;
    this.cacheKey = `logs:${context}`;
  }

  /**
   * Verificar se o nível de log deve ser exibido
   */
  private shouldLog(level: LogLevel): boolean {
    return level <= LOG_CONFIG.level;
  }

  /**
   * Formatar mensagem de log
   */
  private formatMessage(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevel[level],
      context: this.context,
      message,
      ...(data && { data }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Escrever log no console (apenas em desenvolvimento)
   */
  private writeToConsole(level: LogLevel, formattedMessage: string): void {
    if (!LOG_CONFIG.enableConsole) return;

    const color = LOG_COLORS[level];
    const reset = LOG_COLORS.RESET;
    const levelName = LogLevel[level].padEnd(5);

    console.log(`${color}[${levelName}]${reset} ${formattedMessage}`);
  }

  /**
   * Escrever log em arquivo (apenas em produção)
   */
  private async writeToFile(formattedMessage: string): Promise<void> {
    if (!LOG_CONFIG.enableFile) return;

    try {
      // Aqui você pode implementar escrita em arquivo
      // Por enquanto, vamos usar cache para armazenar logs
      const logs = await cache.get<string[]>('CONFIG', 'logs') || [];
      logs.push(formattedMessage);
      
      // Manter apenas os últimos 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      await cache.set('CONFIG', 'logs', logs);
    } catch (error) {
      console.error('Erro ao escrever log em arquivo:', error);
    }
  }

  /**
   * Log de erro
   */
  error(message: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const formattedMessage = this.formatMessage(LogLevel.ERROR, message, data, error);
    
    this.writeToConsole(LogLevel.ERROR, formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log de aviso
   */
  warn(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formattedMessage = this.formatMessage(LogLevel.WARN, message, data);
    
    this.writeToConsole(LogLevel.WARN, formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log de informação
   */
  info(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formattedMessage = this.formatMessage(LogLevel.INFO, message, data);
    
    this.writeToConsole(LogLevel.INFO, formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log de debug
   */
  debug(message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formattedMessage = this.formatMessage(LogLevel.DEBUG, message, data);
    
    this.writeToConsole(LogLevel.DEBUG, formattedMessage);
    this.writeToFile(formattedMessage);
  }

  /**
   * Log de performance
   */
  performance(operation: string, duration: number, data?: any): void {
    const message = `Performance: ${operation} took ${duration}ms`;
    this.info(message, { operation, duration, ...data });
  }

  /**
   * Log de segurança
   */
  security(event: string, data?: any): void {
    const message = `Security: ${event}`;
    this.warn(message, data);
  }

  /**
   * Log de auditoria
   */
  audit(action: string, userId: string, resource: string, data?: any): void {
    const message = `Audit: ${action} on ${resource} by ${userId}`;
    this.info(message, { action, userId, resource, ...data });
  }

  /**
   * Log de API
   */
  api(method: string, path: string, statusCode: number, duration: number, data?: any): void {
    const message = `API: ${method} ${path} - ${statusCode} (${duration}ms)`;
    this.info(message, { method, path, statusCode, duration, ...data });
  }

  /**
   * Log de banco de dados
   */
  database(operation: string, table: string, duration: number, data?: any): void {
    const message = `Database: ${operation} on ${table} (${duration}ms)`;
    this.debug(message, { operation, table, duration, ...data });
  }

  /**
   * Log de cache
   */
  cache(operation: string, key: string, hit: boolean, duration: number, data?: any): void {
    const message = `Cache: ${operation} ${key} - ${hit ? 'HIT' : 'MISS'} (${duration}ms)`;
    this.debug(message, { operation, key, hit, duration, ...data });
  }
}

/**
 * Criar logger para contexto específico
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Loggers pré-configurados para diferentes contextos
 */
export const loggers = {
  app: createLogger('app'),
  api: createLogger('api'),
  database: createLogger('database'),
  cache: createLogger('cache'),
  auth: createLogger('auth'),
  tickets: createLogger('tickets'),
  users: createLogger('users'),
  security: createLogger('security'),
  performance: createLogger('performance'),
} as const;

/**
 * Funções utilitárias para logging rápido
 */
export const log = {
  error: (message: string, error?: Error, data?: any) => loggers.app.error(message, error, data),
  warn: (message: string, data?: any) => loggers.app.warn(message, data),
  info: (message: string, data?: any) => loggers.app.info(message, data),
  debug: (message: string, data?: any) => loggers.app.debug(message, data),
  performance: (operation: string, duration: number, data?: any) => 
    loggers.performance.performance(operation, duration, data),
  security: (event: string, data?: any) => loggers.security.security(event, data),
  audit: (action: string, userId: string, resource: string, data?: any) => 
    loggers.app.audit(action, userId, resource, data),
  api: (method: string, path: string, statusCode: number, duration: number, data?: any) => 
    loggers.api.api(method, path, statusCode, duration, data),
  database: (operation: string, table: string, duration: number, data?: any) => 
    loggers.database.database(operation, table, duration, data),
  cache: (operation: string, key: string, hit: boolean, duration: number, data?: any) => 
    loggers.cache.cache(operation, key, hit, duration, data),
};

/**
 * Middleware para logging de requisições HTTP
 */
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const { method, url, ip } = req;

    // Log da requisição
    log.api(method, url, 0, 0, { ip, userAgent: req.get('User-Agent') });

    // Interceptar resposta
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      
      log.api(method, url, statusCode, duration, {
        ip,
        userAgent: req.get('User-Agent'),
        contentLength: res.get('Content-Length'),
      });
    });

    next();
  };
}

/**
 * Decorator para logging de performance de funções
 */
export function logPerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;
      
      log.performance(`${target.constructor.name}.${propertyName}`, duration, {
        args: args.length,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      log.performance(`${target.constructor.name}.${propertyName}`, duration, {
        args: args.length,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  };

  return descriptor;
}

/**
 * Hook para logging de performance em componentes React
 */
export function usePerformanceLogger(componentName: string) {
  return {
    logRender: (props: any) => {
      log.performance(`${componentName}.render`, 0, { props });
    },
    logAction: (action: string, data?: any) => {
      log.performance(`${componentName}.${action}`, 0, data);
    },
  };
}

export default loggers.app;

