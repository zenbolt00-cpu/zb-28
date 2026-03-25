import prisma from './lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  const username = 'admin';
  const password = 'admin123';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  await prisma.admin.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: { username, password: hashedPassword },
  });
  
  console.log('✅ Admin reset successfully to admin / admin123');
}

main().catch(console.error).finally(() => process.exit(0));
