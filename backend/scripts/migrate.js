import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabasePool, closeDatabasePool } from '../services/database.js';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const migrationsDirectory = path.resolve(scriptsDirectory, '../db/migrations');
const migrationLockId = 817_030_126;

async function run() {
  const database = getDatabasePool();
  const client = await database.connect();
  try {
    await client.query('SELECT pg_advisory_lock($1)', [migrationLockId]);
    await client.query('CREATE SCHEMA IF NOT EXISTS platform');
    await client.query(`
      CREATE TABLE IF NOT EXISTS platform.schema_migrations (
        name text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const names = (await fs.readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of names) {
      const sql = await fs.readFile(path.join(migrationsDirectory, name), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const existing = await client.query('SELECT checksum FROM platform.schema_migrations WHERE name = $1', [name]);
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration ${name} has changed.`);
        console.log(`[Migrate] Already applied: ${name}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO platform.schema_migrations (name, checksum) VALUES ($1, $2)', [name, checksum]);
        await client.query('COMMIT');
        console.log(`[Migrate] Applied: ${name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [migrationLockId]).catch(() => {});
    client.release();
    await closeDatabasePool();
  }
}

run().catch((error) => {
  console.error('[Migrate] Failed:', error.message);
  process.exitCode = 1;
});
