import fs from 'fs';
import path from 'path';

// Níveis de log
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Interface para entrada de log
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private logFile: string;
  private enableConsole: boolean;

  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.logFile = process.env.LOG_FILE || '/tmp/app.log';
    this.enableConsole = process.env.NODE_ENV !== 'production';

    // Criar diretório de logs se não existir
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    return `${JSON.stringify(entry)}\n`;
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const formattedEntry = this.formatLogEntry(entry);
      fs.appendFileSync(this.logFile, formattedEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const { timestamp, level, message, meta } = entry;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

    switch (level) {
      case 'ERROR':
        console.error(`[${timestamp}] ${level}: ${message}${metaStr}`);
        break;
      case 'WARN':
        console.warn(`[${timestamp}] ${level}: ${message}${metaStr}`);
        break;
      case 'INFO':
        console.info(`[${timestamp}] ${level}: ${message}${metaStr}`);
        break;
      case 'DEBUG':
        console.debug(`[${timestamp}] ${level}: ${message}${metaStr}`);
        break;
      default:
        console.log(`[${timestamp}] ${level}: ${message}${metaStr}`);
    }
  }

  private log(
    level: LogLevel,
    message: string,
    meta?: any,
    context?: Partial<LogEntry>
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      meta,
      ...context,
    };

    if (this.enableConsole) {
      this.writeToConsole(entry);
    }

    this.writeToFile(entry);
  }

  debug(message: string, meta?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, message, meta, context);
  }

  info(message: string, meta?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, message, meta, context);
  }

  warn(message: string, meta?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, message, meta, context);
  }

  error(message: string, meta?: any, context?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, message, meta, context);
  }

  // Métodos específicos para diferentes tipos de eventos
  apiRequest(
    method: string,
    url: string,
    userId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    this.info('API Request', {
      method,
      url,
      userId,
      ip,
      userAgent,
    });
  }

  apiResponse(
    method: string,
    url: string,
    status: number,
    duration: number,
    userId?: string
  ): void {
    this.info('API Response', {
      method,
      url,
      status,
      duration,
      userId,
    });
  }

  userAction(action: string, userId: string, details?: any): void {
    this.info('User Action', {
      action,
      userId,
      details,
    });
  }

  securityEvent(
    event: string,
    userId?: string,
    ip?: string,
    details?: any
  ): void {
    this.warn('Security Event', {
      event,
      userId,
      ip,
      details,
    });
  }

  databaseQuery(query: string, duration: number, error?: any): void {
    if (error) {
      this.error('Database Query Failed', {
        query,
        duration,
        error: error.message,
      });
    } else {
      this.debug('Database Query', {
        query,
        duration,
      });
    }
  }

  cacheOperation(
    operation: string,
    key: string,
    hit: boolean,
    duration?: number
  ): void {
    this.debug('Cache Operation', {
      operation,
      key,
      hit,
      duration,
    });
  }

  // Método para logs de auditoria
  audit(action: string, resource: string, userId: string, changes?: any): void {
    this.info('Audit Log', {
      action,
      resource,
      userId,
      changes,
    });
  }

  // Método para logs de performance
  performance(operation: string, duration: number, details?: any): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, 'Performance Log', {
      operation,
      duration,
      details,
    });
  }

  // Método para rotacionar logs (implementação básica)
  rotateLogs(): void {
    try {
      const stats = fs.statSync(this.logFile);
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (stats.size > maxSize) {
        const rotatedFile = `${this.logFile}.${Date.now()}`;
        fs.renameSync(this.logFile, rotatedFile);

        // Manter apenas os últimos 5 arquivos rotacionados
        const logDir = path.dirname(this.logFile);
        const logFiles = fs
          .readdirSync(logDir)
          .filter(file => file.startsWith(path.basename(this.logFile)))
          .sort();

        if (logFiles.length > 5) {
          const filesToDelete = logFiles.slice(0, logFiles.length - 5);
          filesToDelete.forEach(file => {
            fs.unlinkSync(path.join(logDir, file));
          });
        }
      }
    } catch (error) {
      this.error('Log rotation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Instância singleton do logger
export const logger = new Logger();

// Middleware para logging de requisições Express/Next.js
export function requestLogger(req: any, res: any, next: any) {
  const start = Date.now();
  const { method, url, ip, headers } = req;
  const userAgent = headers['user-agent'];
  const userId = req.user?.id;

  logger.apiRequest(method, url, userId, ip, userAgent);

  // Override do método end para capturar a resposta
  const originalEnd = res.end;
  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    logger.apiResponse(method, url, res.statusCode, duration, userId);
    originalEnd.apply(this, args);
  };

  if (next) next();
}

// Decorator para logging automático de métodos
export function logged(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const className = target.constructor.name;

    logger.debug(`${className}.${propertyName} started`, { args });

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;

      logger.debug(`${className}.${propertyName} completed`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error(`${className}.${propertyName} failed`, {
        duration,
        error: error instanceof Error ? error.message : String(error),
        args,
      });

      throw error;
    }
  };
}

export default logger;
