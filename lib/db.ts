import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Mock Prisma client for when database is unavailable
const createMockPrismaClient = () => {
  const handler: any = {
    get: function(target: any, prop: any) {
      if (prop === 'then') return undefined;
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return () => Promise.resolve([]);
      }
      // Return a proxy for nested properties
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
  if (process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build' || (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)) {
    console.log('[Prisma] Build mode detected, using mock client');
    return createMockPrismaClient();
  }
  
  try {
    const dbUrl = process.env.DATABASE_URL;
    console.log('[Prisma] Initializing with DATABASE_URL:', dbUrl?.substring(0, 50) + '...');
    
    if (dbUrl?.startsWith('file:')) {
      const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      console.log('[Prisma] Using SQLite adapter');
      return new PrismaClient({ adapter, errorFormat: 'pretty' });
    }

    // Use the @prisma/adapter-pg for standard PostgreSQL connection in Prisma 7
    console.log('[Prisma] Using PostgreSQL adapter');
    const pool = new Pool({ connectionString: dbUrl, max: 1 });
    const adapter = new PrismaPg(pool as any);
    return new PrismaClient({ adapter, errorFormat: 'pretty' });
  } catch (error) {
    console.error('[Prisma] Failed to initialize Prisma client:', error instanceof Error ? error.message : String(error));
    console.log('[Prisma] Falling back to mock client');
    return createMockPrismaClient();
  }
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
