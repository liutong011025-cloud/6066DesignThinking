import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const database = await PGlite.create();
const server = new PGLiteSocketServer({ db: database, host: '127.0.0.1', port: 54330 });
await server.start();
async function deploy() {
  const child = spawn(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
    stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54330/postgres?sslmode=disable' }
  });
  const code = await new Promise(resolve => child.on('exit', resolve));
  assert.equal(code, 0, 'The real Prisma deployment migration must succeed.');
}
try {
  await deploy();
  const groups = await database.query('SELECT name FROM "Group" ORDER BY id');
  assert.equal(groups.rows.length, 23); assert.equal(groups.rows[0].name, 'wonderland'); assert.equal(groups.rows[21].name, 'TUFF'); assert.equal(groups.rows[22].name, 'Test');
  await deploy();
  const second = await database.query('SELECT COUNT(*)::int AS count FROM "Group"'); assert.equal(second.rows[0].count, 23);
  console.log('PASS: Prisma migrate deploy initializes a fresh database, registers all 22 course groups plus Test, and safely runs again.');
} finally { await server.stop(); await database.close(); }
