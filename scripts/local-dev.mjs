import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { config } from 'dotenv';
config({ path: '.env.local' }); config();
const port = Number(process.env.LOCAL_PG_PORT || 54329);
await mkdir('.local-data', { recursive: true });
const database = await PGlite.create('.local-data/postgres');
const exists = await database.query(`SELECT to_regclass('public."Group"') AS present`);
if (!exists.rows[0].present) await database.exec(await readFile('prisma/migrations/20261006000000_initial/migration.sql', 'utf8'));
await database.exec(await readFile('prisma/migrations/20261006010000_test_group/migration.sql', 'utf8'));
const server = new PGLiteSocketServer({ db: database, port, host: '127.0.0.1' });
await server.start();
const args = process.env.LOCAL_PRODUCTION ? ['start', '-H', '127.0.0.1', '-p', process.env.PORT || '3000'] : ['dev', '-H', '127.0.0.1', '-p', process.env.PORT || '3000'];
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', ...args], { stdio: 'inherit', env: {
  ...process.env, DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`,
  LOCAL_DATABASE: '1', SESSION_SECRET: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  TEACHER_PASSWORD: process.env.TEACHER_PASSWORD || 'yinyin2948'
} });
console.log('Local course preview: http://127.0.0.1:' + (process.env.PORT || '3000') + ' (persistent local PostgreSQL; no cloud credentials needed)');
async function close() { child.kill(); await server.stop(); await database.close(); process.exit(); }
process.on('SIGINT', close); process.on('SIGTERM', close);
child.on('exit', async code => { await server.stop(); await database.close(); process.exit(code ?? 0); });
