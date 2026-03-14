import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  if (process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build' || (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL)) {
    const handler: any = {
      get: function(target: any, prop: any) {
        if (prop === 'then') return undefined;
        if (typeof prop === 'string' && prop.startsWith('$')) return () => Promise.resolve([]);
        return new Proxy(() => Promise.resolve([]), handler);
      }
    };
    return new Proxy({}, handler) as PrismaClient;
  }
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (dbUrl?.startsWith('file:')) {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({ url: dbUrl });
    return new PrismaClient({ adapter });
  }

  // Use the @prisma/adapter-pg for standard PostgreSQL connection in Prisma 7
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
