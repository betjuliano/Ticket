// Legacy file - now uses the optimized database client
// This file is kept for backward compatibility

// Import from the new optimized client
export {
  prisma,
  databaseClient,
  disconnectPrisma,
  checkDatabaseConnection,
  executeTransaction,
  type DatabaseClient,
  type DatabaseMetrics,
} from './database/client';

// Re-export default for backward compatibility
export { default } from './database/client';

