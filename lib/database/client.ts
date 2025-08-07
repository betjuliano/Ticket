import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

// Database metrics interface
export interface DatabaseMetrics {
  activeConnections: number;
  queryCount: number;
  avgQueryTime: number;
  totalQueries: number;
  slowQueries: number;
  errorCount: number;
  lastQueryTime: number;
}

// Database client interface
export interface DatabaseClient {
  getInstance(): PrismaClient;
  getMetrics(): Promise<DatabaseMetrics>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
}

// Performance metrics storage
class MetricsCollector {
  private queryTimes: number[] = [];
  private totalQueries = 0;
  private slowQueries = 0;
  private errorCount = 0;
  private lastQueryTime = 0;
  private readonly slowQueryThreshold = 1000; // 1 second

  recordQuery(duration: number, isError = false): void {
    this.totalQueries++;
    this.lastQueryTime = Date.now();
    
    if (isError) {
      this.errorCount++;
      return;
    }

    this.queryTimes.push(duration);
    
    // Keep only last 1000 query times for memory efficiency
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }

    if (duration > this.slowQueryThreshold) {
      this.slowQueries++;
    }
  }

  getMetrics(): Omit<DatabaseMetrics, 'activeConnections'> {
    const avgQueryTime = this.queryTimes.length > 0 
      ? this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length 
      : 0;

    return {
      queryCount: this.queryTimes.length,
      avgQueryTime: Math.round(avgQueryTime * 100) / 100,
      totalQueries: this.totalQueries,
      slowQueries: this.slowQueries,
      errorCount: this.errorCount,
      lastQueryTime: this.lastQueryTime,
    };
  }

  reset(): void {
    this.queryTimes = [];
    this.totalQueries = 0;
    this.slowQueries = 0;
    this.errorCount = 0;
    this.lastQueryTime = 0;
  }
}

// Optimized Database Client implementation
class OptimizedDatabaseClient implements DatabaseClient {
  private static instance: OptimizedDatabaseClient;
  private prismaClient: PrismaClient | null = null;
  private metricsCollector = new MetricsCollector();
  private isShuttingDown = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  static getInstance(): OptimizedDatabaseClient {
    if (!OptimizedDatabaseClient.instance) {
      OptimizedDatabaseClient.instance = new OptimizedDatabaseClient();
    }
    return OptimizedDatabaseClient.instance;
  }

  getInstance(): PrismaClient {
    if (!this.prismaClient) {
      this.prismaClient = this.createPrismaClient();
    }
    return this.prismaClient;
  }

  private createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
      // Only override datasource URL if DATABASE_URL is provided
      ...(process.env.DATABASE_URL && {
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      }),
    });

    // Performance monitoring middleware
    client.$use(this.createPerformanceMiddleware());
    
    // Sanitization middleware (optimized - only for write operations)
    client.$use(this.createSanitizationMiddleware());

    // Error tracking middleware
    client.$use(this.createErrorTrackingMiddleware());

    return client;
  }

  private createPerformanceMiddleware() {
    return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
      const startTime = Date.now();
      
      try {
        const result = await next(params);
        const duration = Date.now() - startTime;
        
        // Record successful query
        this.metricsCollector.recordQuery(duration);
        
        // Log slow queries in development
        if (process.env.NODE_ENV === 'development' && duration > 500) {
          console.warn(
            `🐌 Slow Query: ${params.model ?? 'Unknown'}.${params.action} took ${duration}ms`
          );
        }
        
        // Log all queries in development with performance info
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `🔍 Query ${params.model ?? 'Unknown'}.${params.action} took ${duration}ms`
          );
        }

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordQuery(duration, true);
        
        console.error(
          `❌ Query Error: ${params.model ?? 'Unknown'}.${params.action} failed after ${duration}ms:`,
          error
        );
        
        throw error;
      }
    };
  }

  private createSanitizationMiddleware() {
    return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
      // Only apply sanitization to write operations for performance
      if (params.action === 'create' || params.action === 'update' || params.action === 'upsert') {
        if (params.args?.data && typeof params.args.data === 'object') {
          params.args.data = this.sanitizeData(params.args.data as Record<string, unknown>);
        }
      }

      return next(params);
    };
  }

  private createErrorTrackingMiddleware() {
    return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
      try {
        return await next(params);
      } catch (error) {
        // Enhanced error logging with context
        console.error('Database operation failed:', {
          model: params.model,
          action: params.action,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    };
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Optimized sanitization - only remove dangerous characters
        sanitized[key] = value
          .replace(/[<>]/g, '') // Remove < and >
          .trim();
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  async getMetrics(): Promise<DatabaseMetrics> {
    const baseMetrics = this.metricsCollector.getMetrics();
    
    // Get active connections count (approximation)
    let activeConnections = 0;
    try {
      if (this.prismaClient) {
        // This is an approximation - Prisma doesn't expose exact connection count
        activeConnections = 1; // At least one connection if client exists
      }
    } catch {
      activeConnections = 0;
    }

    return {
      ...baseMetrics,
      activeConnections,
    };
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!this.prismaClient) {
        return false;
      }
      await this.prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('❌ Database connection check failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    
    try {
      if (this.prismaClient) {
        console.log('🔌 Disconnecting from database...');
        await this.prismaClient.$disconnect();
        this.prismaClient = null;
        console.log('✅ Database disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Error during database disconnection:', error);
    } finally {
      this.isShuttingDown = false;
    }
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.metricsCollector.reset();
  }
}

// Singleton instance
const databaseClient = OptimizedDatabaseClient.getInstance();

// Export the Prisma client instance for backward compatibility
export const prisma = databaseClient.getInstance();

// Export the database client for advanced usage
export { databaseClient };

// Helper functions for backward compatibility
export const disconnectPrisma = async (): Promise<void> => {
  await databaseClient.disconnect();
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  return databaseClient.isConnected();
};

export const executeTransaction = async <T>(
  fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> => {
  return prisma.$transaction(fn);
};

// Graceful shutdown setup
const setupGracefulShutdown = () => {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    try {
      await databaseClient.disconnect();
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await databaseClient.disconnect();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await databaseClient.disconnect();
    process.exit(1);
  });
};

// Initialize graceful shutdown only in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_GRACEFUL_SHUTDOWN === 'true') {
  setupGracefulShutdown();
}

export default prisma;