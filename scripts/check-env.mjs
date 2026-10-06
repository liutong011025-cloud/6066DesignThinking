import { config } from 'dotenv';
config({ path: '.env.local' }); config();
for (const key of ['DATABASE_URL', 'SESSION_SECRET', 'TEACHER_PASSWORD']) {
  if (!process.env[key]) throw new Error(`Add ${key} in Vercel Project Settings → Environment Variables before deploying.`);
}
if (!/^(postgres|postgresql):\/\//.test(process.env.DATABASE_URL)) throw new Error('Use the PostgreSQL connection URL from Prisma Postgres (postgres:// or postgresql://).');
if (process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.startsWith('REPLACE_')) throw new Error('Generate a new SESSION_SECRET containing at least 32 random characters.');
console.log('Deployment configuration is ready.');
