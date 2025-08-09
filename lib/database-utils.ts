import { db } from "@/database/drizzle";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  timeout?: number;
}

/**
 * Execute a database query with retry logic and timeout handling
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    timeout = 15000,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add timeout to the query
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Database query timeout (${timeout}ms)`)), timeout);
        }),
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain types of errors
      if (isNonRetryableError(error)) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      console.warn(
        `Database query attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${delay}ms...`,
        error
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  
  // Don't retry on these types of errors
  const nonRetryablePatterns = [
    'syntax error',
    'invalid input',
    'constraint violation',
    'unique constraint',
    'foreign key constraint',
    'not null constraint',
    'authentication failed',
    'permission denied',
  ];

  return nonRetryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Execute a simple database query with built-in retry logic
 */
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await executeWithRetry(queryFn, {
      maxRetries: 2,
      baseDelay: 500,
      timeout: 10000,
    });
  } catch (error) {
    console.error('Database query failed after retries:', error);
    return fallback;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await executeWithRetry(
      async () => {
        // Simple query to test connection
        const result = await db.execute(`SELECT 1 as health_check`);
        return result;
      },
      {
        maxRetries: 1,
        timeout: 5000,
      }
    );
    
    const latency = Date.now() - startTime;
    return { healthy: true, latency };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
