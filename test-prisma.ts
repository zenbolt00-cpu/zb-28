import { PrismaClient } from '@prisma/client';
const dbUrl = "postgresql://postgres:Zb-devop2026@db.nymlgypzrafgdkssjkgf.supabase.co:5432/postgres";
try {
  const prisma = new PrismaClient({ url: dbUrl } as any);
  console.log("Success with url!");
  process.exit(0);
} catch (e) {
  console.log("Error with url:", e.message);
}
try {
  const prisma2 = new PrismaClient({ datasourceUrl: dbUrl } as any);
  console.log("Success with datasourceUrl!");
} catch (e) {
  console.log("Error with datasourceUrl:", e.message);
}
