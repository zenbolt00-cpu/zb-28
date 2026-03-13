import { PrismaClient } from '@prisma/client'

import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  if (process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    // Return a mock handler during build if DATABASE_URL is not present
    // This prevents build failures while allowing Prisma to be called in Server Components
    const handler: any = {
      get: function(target: any, prop: any) {
        if (prop === 'then') return undefined; // Promise check
        if (typeof prop === 'string' && prop.startsWith('$')) return () => Promise.resolve([]);
        return new Proxy(() => Promise.resolve([]), handler);
      }
    };
    return new Proxy({}, handler) as PrismaClient;
  }
  
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  
  // Use SQLite only if the URL is a local file path
  if (dbUrl.startsWith('file:')) {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    return new PrismaClient({ adapter });
  }

  // Default to standard PrismaClient for PostgreSQL / other providers
  return new PrismaClient();
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
