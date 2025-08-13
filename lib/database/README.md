# Optimized Database Client

This document describes the optimized database client implementation for the UFSM Ticket System.

## Overview

The optimized database client provides a singleton pattern implementation with performance monitoring, connection pooling, and graceful shutdown capabilities.

## Features Implemented

### 1. Singleton Pattern
- **Single Instance**: Ensures only one PrismaClient instance is created across the application
- **Memory Efficient**: Prevents multiple database connections from being created unnecessarily
- **Thread Safe**: Handles concurrent access properly

### 2. Performance Monitoring Middleware
- **Query Timing**: Tracks execution time for all database queries
- **Slow Query Detection**: Identifies queries that exceed performance thresholds
- **Error Tracking**: Monitors and logs database operation failures
- **Metrics Collection**: Provides comprehensive performance statistics

### 3. Connection Pool Configuration
- **Environment-Based**: Different pool sizes for development vs production
- **Database-Specific**: Optimized settings for PostgreSQL (SQLite uses single connection)
- **Timeout Management**: Configurable connection and pool timeouts

### 4. Graceful Shutdown System
- **Signal Handling**: Responds to SIGTERM, SIGINT, and SIGUSR2 signals
- **Clean Disconnection**: Properly closes database connections on shutdown
- **Error Handling**: Manages shutdown errors gracefully

### 5. Optimized Middleware Stack
- **Performance Middleware**: Tracks query execution time and identifies bottlenecks
- **Sanitization Middleware**: Applies data sanitization only to write operations (create/update/upsert)
- **Error Tracking Middleware**: Enhanced error logging with context information

## Usage

### Basic Usage
```typescript
import { prisma } from '@/lib/database/client';

// Use prisma as normal - it's now optimized
const users = await prisma.user.findMany();
```

### Advanced Usage
```typescript
import { databaseClient, executeTransaction } from '@/lib/database/client';

// Get performance metrics
const metrics = await databaseClient.getMetrics();
console.log('Query performance:', metrics);

// Execute transaction
const result = await executeTransaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const ticket = await tx.ticket.create({ data: { ...ticketData, createdById: user.id } });
  return { user, ticket };
});
```

## Performance Metrics

The client provides the following metrics:

- `activeConnections`: Number of active database connections
- `queryCount`: Number of queries executed (last 1000)
- `avgQueryTime`: Average query execution time in milliseconds
- `totalQueries`: Total number of queries since startup
- `slowQueries`: Number of queries exceeding the slow query threshold (1000ms)
- `errorCount`: Number of failed queries
- `lastQueryTime`: Timestamp of the last query execution

## Configuration

### Environment Variables
- `DATABASE_URL`: Database connection string (optional for SQLite)
- `NODE_ENV`: Environment mode (affects logging and pool size)
- `ENABLE_GRACEFUL_SHUTDOWN`: Enable graceful shutdown in development

### Connection Pool Settings
- **Production**: Up to 20 connections
- **Development**: Up to 5 connections
- **SQLite**: Single connection (no pooling)

## Migration from Direct PrismaClient

All API routes and services have been migrated from direct `new PrismaClient()` instantiation to use the optimized client:

### Before
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

### After
```typescript
import { prisma } from '@/lib/database/client';
```

## Files Updated

### API Routes
- `/api/dashboard/stats/route.ts`
- `/api/tickets/route.ts`
- `/api/tickets/[id]/route.ts`
- `/api/tickets/[id]/forward/route.ts`
- `/api/tickets/[id]/respond/route.ts`
- `/api/users/route.ts`
- `/api/users/support/route.ts`
- `/api/knowledge/articles/route.ts`

### Services
- `lib/notifications.ts`
- `lib/notification-service.ts`

### Test Configuration
- `jest.setup.js` - Updated to mock the new client path
- `jest.config.js` - Fixed moduleNameMapper configuration

## Testing

The implementation includes comprehensive tests:

```bash
# Run core functionality tests
npx tsx scripts/test-client-core.ts

# Run full database tests (requires working database)
npx tsx scripts/test-database-client.ts
```

## Benefits

1. **Reduced Memory Usage**: Single PrismaClient instance instead of multiple
2. **Better Performance Monitoring**: Detailed metrics for optimization
3. **Improved Error Handling**: Enhanced error tracking and logging
4. **Graceful Shutdowns**: Clean application termination
5. **Optimized Middleware**: Sanitization only where needed
6. **Connection Pooling**: Efficient database connection management

## Requirements Satisfied

This implementation satisfies the following requirements from the performance optimization spec:

- **1.1**: Single shared PrismaClient instance across all API routes
- **1.2**: Configurable connection pool with appropriate limits
- **1.3**: Performance metrics middleware for query monitoring
- **1.4**: Graceful shutdown system for database connections

## Next Steps

The optimized database client is now ready for use. The next tasks in the performance optimization plan can build upon this foundation:

1. Implement repository pattern using this optimized client
2. Add Redis caching layer
3. Create service layer with business logic
4. Optimize specific queries and add database indexes