import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { createApp } from './app';

const key = (process.env.ADMIN_KEY_FILE ? readFileSync(process.env.ADMIN_KEY_FILE, 'utf8') : process.env.ADMIN_KEY ?? '').trim();
if (key.length < 32) throw new Error('ADMIN_KEY_FILE (or ADMIN_KEY) must hold a key of 32 characters or more');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const sql = postgres(process.env.DATABASE_URL, { max: 3, idle_timeout: 20, onnotice: () => {} });
const handle = createApp({ key, sql, gateFile: process.env.GATE_FILE ?? '/var/lib/mu-admin/online.json' });
const port = Number(process.env.PORT ?? 3200);
Bun.serve({ port, hostname: '0.0.0.0', maxRequestBodySize: 32_768, fetch: handle });
console.info(`mu-admin service on :${port}`);
