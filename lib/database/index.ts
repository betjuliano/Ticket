// Export the optimized database client
export {
  prisma,
  databaseClient,
  disconnectPrisma,
  checkDatabaseConnection,
  executeTransaction,
  type DatabaseClient,
  type DatabaseMetrics,
} from './client';

// Re-export for convenience
export { default } from './client';