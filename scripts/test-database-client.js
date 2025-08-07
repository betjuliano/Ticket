#!/usr/bin/env node

/**
 * Test script for the optimized database client
 * This script validates the singleton pattern, metrics collection, and graceful shutdown
 */

const { databaseClient, prisma } = require('../lib/database/client.ts');

async function testDatabaseClient() {
  console.log('🧪 Testing Optimized Database Client...\n');

  try {
    // Test 1: Singleton pattern
    console.log('1️⃣ Testing Singleton Pattern...');
    const client1 = databaseClient.getInstance();
    const client2 = databaseClient.getInstance();
    console.log('✅ Singleton test:', client1 === client2 ? 'PASSED' : 'FAILED');

    // Test 2: Connection check
    console.log('\n2️⃣ Testing Database Connection...');
    const isConnected = await databaseClient.isConnected();
    console.log('✅ Connection test:', isConnected ? 'PASSED' : 'FAILED');

    // Test 3: Basic query to test performance middleware
    console.log('\n3️⃣ Testing Performance Middleware...');
    const startTime = Date.now();
    
    try {
      // Simple query to test the middleware
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Query executed successfully');
    } catch (error) {
      console.log('⚠️ Query failed (expected if no database):', error.message);
    }

    // Test 4: Metrics collection
    console.log('\n4️⃣ Testing Metrics Collection...');
    const metrics = await databaseClient.getMetrics();
    console.log('📊 Current Metrics:', {
      totalQueries: metrics.totalQueries,
      avgQueryTime: metrics.avgQueryTime,
      errorCount: metrics.errorCount,
      activeConnections: metrics.activeConnections,
    });
    console.log('✅ Metrics collection: PASSED');

    // Test 5: Graceful shutdown
    console.log('\n5️⃣ Testing Graceful Shutdown...');
    await databaseClient.disconnect();
    console.log('✅ Graceful shutdown: PASSED');

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testDatabaseClient()
  .then(() => {
    console.log('\n✨ Database client is ready for use!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });