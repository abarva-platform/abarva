#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const keyVaultName = process.env.AZURE_KEY_VAULT_NAME?.trim() || 'kv-abarva-lab-001';
const secretName = process.env.AZURE_SOURCE_DATABASE_URL_SECRET_NAME?.trim() || 'source-postgres-database-url';
const sourceDatabaseUrl = process.env.SOURCE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!sourceDatabaseUrl) {
  console.error('x SOURCE_DATABASE_URL or DATABASE_URL is required.');
  process.exit(1);
}

execFileSync(
  'az',
  [
    'keyvault',
    'secret',
    'set',
    '--vault-name',
    keyVaultName,
    '--name',
    secretName,
    '--value',
    sourceDatabaseUrl,
    '--only-show-errors',
    '--output',
    'none',
  ],
  { stdio: 'inherit' },
);

console.log(`ok: set Key Vault secret ${secretName} in ${keyVaultName}`);
