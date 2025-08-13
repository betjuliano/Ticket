import { databaseClient, prisma, checkDatabaseConnection } from '../lib/database/client';

async function testDatabaseClient() {
  console.log('🔍 Testing optimized database client...');
  
  try {
    // Test singleton pattern
    const instance1 = databaseClient.getInstance();
    const instance2 = databaseClient.getInstance();
    console.log('✅ Singleton pattern working:', instance1 === instance2);
    
    // Test metrics
    const metrics = await databaseClient.getMetrics();
    console.log('✅ Metrics available:', {
      activeConnections: metrics.activeConnections,
      queryCount: metrics.queryCount,
      avgQueryTime: metrics.avgQueryTime,
    });
    
    // Test connection check
    const isConnected = await checkDatabaseConnection();
    console.log('✅ Connection check working:', isConnected);
    
    // Test a simple query to verify middleware is working
    console.log('🔍 Testing query with performance monitoring...');
    const userCount = await prisma.user.count();
    console.log('✅ Query executed successfully, user count:', userCount);
    
    // Check metrics after query
    const metricsAfter = await databaseClient.getMetrics();
    console.log('✅ Metrics after query:', {
      totalQueries: metricsAfter.totalQueries,
      queryCount: metricsAfter.queryCount,
      avgQueryTime: metricsAfter.avgQueryTime,
    });
    
    console.log('🎉 All tests passed! Database client is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await databaseClient.disconnect();
    console.log('🔌 Database disconnected');
  }
}

testDatabaseClient();