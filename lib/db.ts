import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import Database from 'better-sqlite3'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Mock Prisma client for when database is unavailable
const createMockPrismaClient = (reason: string) => {
  console.warn(`[DB] Using mock Prisma client. Reason: ${reason}`);
  const handler: any = {
    get: function(target: any, prop: any) {
      if (prop === '_isMock') return true;
      if (prop === '_mockReason') return reason;
      if (prop === 'then') return undefined;
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return () => Promise.resolve([]);
      }
      const mockReturn = (targetProp: string) => {
        if (targetProp === 'count') return 0;
        if (targetProp === 'findMany') return [];
        return { 
          id: 'mock_id', 
          shopifyId: 'mock_shopify_id', 
          handle: 'mock_handle', 
          domain: 'mock.myshopify.com',
          title: 'Mock Item',
          orders: []
        };
      };
      return new Proxy(
        function(...args: any[]) {
          return Promise.resolve(mockReturn(String(prop)));
        },
        handler
      );
    }
  };
  return new Proxy({}, handler) as unknown as PrismaClient;
};

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
  
  // Ensure DATABASE_URL is set in process.env because native Prisma looks for it
  if (!process.env.DATABASE_URL && dbUrl) {
    process.env.DATABASE_URL = dbUrl;
  }

  const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

  // During build phase, always use mock to avoid DB connection requirements
  if (isBuild) {
    return createMockPrismaClient('build');
  }

  // No DATABASE_URL set at all — use mock but log clearly
  if (!dbUrl || dbUrl.includes('placeholder') || dbUrl === '') {
    console.error('[DB] DATABASE_URL is not set. Admin features will not persist. Set DATABASE_URL in your environment variables.');
    return createMockPrismaClient('no_database_url');
  }

  try {
      // Local SQLite development
      if (dbUrl.startsWith('file:')) {
        const adapter = new PrismaBetterSqlite3({ url: dbUrl } as any);
        return new PrismaClient({ adapter: adapter as any });
      }

      // Production / PostgreSQL with Driver Adapter
      // Using direct POSTGRES_URL if available to avoid pooler SSL issues
      const connectionString = process.env.POSTGRES_URL || dbUrl;
      
      if (process.env.NODE_ENV === 'production') {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }

      const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
      }) as any
      const adapter = new PrismaPg(pool)

      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      
      return client;
  } catch (error: any) {
    console.error('[DB] Critical Prisma initialization error:', error.message, error.stack);
    return createMockPrismaClient(`init_error: ${error.message}`);
  }
};

declare const globalThis: {
  __prisma_fresh: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.__prisma_fresh ?? prismaClientSingleton();

export default prisma;

// Only cache the client globally in development (production uses fresh per-request)
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma_fresh = prisma;
}
