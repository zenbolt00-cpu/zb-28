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
  const dbUrl = process.env.DATABASE_URL;
  const isBuild = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';
  const isProdWithoutDb = process.env.NODE_ENV === 'production' && (!dbUrl || dbUrl.includes('placeholder'));

  if (isBuild || isProdWithoutDb) {
    const handler: any = {
      get: function(target: any, prop: any) {
        if (prop === 'then') return undefined;
        if (typeof prop === 'string' && prop.startsWith('$')) return () => Promise.resolve([]);
        return new Proxy(() => Promise.resolve(null), {
          get: (t, p) => {
            if (p === 'then') return undefined;
            return () => Promise.resolve(null);
          }
        });
      },
      apply: () => Promise.resolve(null)
    };
    return new Proxy({}, handler) as PrismaClient;
  }
  
  try {
    if (dbUrl?.startsWith('file:')) {
      const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
      const adapter = new PrismaBetterSqlite3({ url: dbUrl });
      return new PrismaClient({ adapter });
    }

    if (dbUrl) {
      const pool = new Pool({ connectionString: dbUrl });
      const adapter = new PrismaPg(pool as any);
      return new PrismaClient({ adapter });
    }
  } catch (error) {
    console.error('Prisma initialization error:', error);
  }

  // Final fallback to a safe proxy if everything fails
  const fallbackHandler: any = {
    get: (target: any, prop: any) => {
      if (prop === 'then') return undefined;
      if (typeof prop === 'string' && prop.startsWith('$')) return () => Promise.resolve([]);
      return new Proxy(() => Promise.resolve(null), {
        get: (t, p) => {
          if (p === 'then') return undefined;
          return () => Promise.resolve(null);
        }
      });
    }
  };
  return new Proxy({}, fallbackHandler) as PrismaClient;
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
