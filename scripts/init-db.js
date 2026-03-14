import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initDatabase() {
  try {
    console.log('Running Prisma migrations...');
    const { stdout } = await execAsync('cd /vercel/share/v0-next-shadcn && npx prisma migrate dev --name init --skip-generate');
    console.log(stdout);
    
    console.log('Generating Prisma client...');
    const { stdout: stdout2 } = await execAsync('cd /vercel/share/v0-next-shadcn && npx prisma generate');
    console.log(stdout2);
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error.message);
    process.exit(1);
  }
}

initDatabase();
