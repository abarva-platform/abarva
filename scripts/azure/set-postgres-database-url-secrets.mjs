#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const vaultName = process.env.AZURE_KEY_VAULT_NAME ?? 'kv-abarva-lab-001';
const loginSecret = process.env.AZURE_POSTGRES_LOGIN_SECRET ?? 'postgres-context-admin-login';
const passwordSecret = process.env.AZURE_POSTGRES_PASSWORD_SECRET ?? 'postgres-context-admin-password';
const fqdnSecret = process.env.AZURE_POSTGRES_FQDN_SECRET ?? 'postgres-context-fqdn';

const databases = [
  ['azure-postgres-control-database-url', 'abarva_control'],
  ['azure-postgres-context-database-url', 'abarva_context'],
  ['azure-postgres-audit-database-url', 'abarva_audit'],
];

function az(args) {
  return execFileSync('az', args, { encoding: 'utf8' }).trim();
}

function secret(name) {
  return az(['keyvault', 'secret', 'show', '--vault-name', vaultName, '--name', name, '--query', 'value', '-o', 'tsv']);
}

function setSecret(name, value) {
  az([
    'keyvault',
    'secret',
    'set',
    '--vault-name',
    vaultName,
    '--name',
    name,
    '--value',
    value,
    '--content-type',
    'application/x-postgresql-uri',
    '-o',
    'none',
  ]);
}

const login = secret(loginSecret);
const password = secret(passwordSecret);
const fqdn = secret(fqdnSecret);

for (const [secretName, databaseName] of databases) {
  const uri = `postgresql://${encodeURIComponent(login)}:${encodeURIComponent(password)}@${fqdn}:5432/${databaseName}?sslmode=require`;
  setSecret(secretName, uri);
  console.log(`✓ set ${secretName} for ${databaseName}`);
}
