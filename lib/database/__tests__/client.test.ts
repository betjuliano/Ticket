import { databaseClient, prisma, checkDatabaseConnection } from '../client';

describe('Optimized Database Client', () => {
  afterAll(async () => {
    await databaseClient.disconnect();
  });

  test('should return singleton instance', () => {
    const instance1 = databaseClient.getInstance();
    const instance2 = databaseClient.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  test('should provide metrics', async () => {
    const metrics = await databaseClient.getMetrics();
    
    expect(metrics).toHaveProperty('activeConnections');
    expect(metrics).toHaveProperty('queryCount');
    expect(metrics).toHaveProperty('avgQueryTime');
    expect(metrics).toHaveProperty('totalQueries');
    expect(metrics).toHaveProperty('slowQueries');
    expect(metrics).toHaveProperty('errorCount');
    expect(metrics).toHaveProperty('lastQueryTime');
    
    expect(typeof metrics.activeConnections).toBe('number');
    expect(typeof metrics.queryCount).toBe('number');
    expect(typeof metrics.avgQueryTime).toBe('number');
  });

  test('should check database connection', async () => {
    const isConnected = await checkDatabaseConnection();
    expect(typeof isConnected).toBe('boolean');
  });

  test('should export prisma instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  test('should reset metrics', async () => {
    // Record some metrics first
    await databaseClient.getMetrics();
    
    // Reset metrics
    databaseClient.resetMetrics();
    
    const metrics = await databaseClient.getMetrics();
    expect(metrics.queryCount).toBe(0);
    expect(metrics.totalQueries).toBe(0);
    expect(metrics.slowQueries).toBe(0);
    expect(metrics.errorCount).toBe(0);
  });

  test('should handle graceful disconnect', async () => {
    const isConnectedBefore = await databaseClient.isConnected();
    
    await databaseClient.disconnect();
    
    // Should be able to reconnect
    const newInstance = databaseClient.getInstance();
    expect(newInstance).toBeDefined();
  });
});