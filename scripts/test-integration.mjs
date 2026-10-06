import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';

// A fresh in-memory database ensures QA registrations never occupy course places.
const database = await PGlite.create();
await database.exec(await readFile('prisma/migrations/20261006000000_initial/migration.sql', 'utf8'));
await database.exec(await readFile('prisma/migrations/20261006010000_test_group/migration.sql', 'utf8'));
const socket = new PGLiteSocketServer({ db: database, port: 54331, host: '127.0.0.1' });
await socket.start();
const base = 'http://127.0.0.1:3001';
const password = randomBytes(16).toString('hex');
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', '3001'], {
  stdio: 'inherit', env: { ...process.env, DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:54331/postgres?sslmode=disable', LOCAL_DATABASE: '1', SESSION_SECRET: randomBytes(32).toString('hex'), TEACHER_PASSWORD: password }
});
let appExit;
app.on('exit', code => { appExit = code ?? -1; });
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (appExit !== undefined) throw new Error('The isolated test server exited before becoming ready. Build the project first.');
    try { const r = await fetch(base + '/api/studio'); if (r.status === 401) { ready = true; break; } } catch { /* Wait for the isolated server. */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'The isolated test server must start.');
  const worker = spawn(process.execPath, ['tests/integration.mjs'], { stdio: 'inherit', env: { ...process.env, ISOLATED_INTEGRATION: '1', TEST_BASE_URL: base, TEST_TEACHER_PASSWORD: password } });
  const [code] = await once(worker, 'exit');
  assert.equal(code, 0, 'The isolated integration suite must pass.');
  console.log('Test database discarded. The course preview database was not touched.');
} finally {
  if (appExit === undefined) { const exited = once(app, 'exit'); app.kill(); await exited; }
  await socket.stop(); await database.close();
}
