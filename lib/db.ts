import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

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
      return new Proxy(
        function(...args: any[]) {
          return Promise.resolve(null);
        },
        handler
      );
    }
  };
  return new Proxy({}, handler) as unknown as PrismaClient;
};

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL;
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
      const pool = new Pool({ connectionString: dbUrl }) as any
      const adapter = new PrismaPg(pool)

      const client = new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    return client;
  } catch (error) {
    console.error('[DB] Critical Prisma initialization error:', error);
    return createMockPrismaClient('init_error');
  }
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

// Only cache the client globally in development (production uses fresh per-request)
if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
