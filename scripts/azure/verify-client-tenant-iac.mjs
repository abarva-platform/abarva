#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'infra/azure/client-tenant-foundation.bicep',
  'infra/azure/parameters/client-tenant.preview.example.bicepparam',
  'infra/azure/parameters/lakeshore.pilot.bicepparam',
  'docs/runbooks/client-tenant-iac.md',
  'docs/runbooks/lakeshore-private-data-plane.md',
  'docs/build/CLIENT_TENANT_IAC_MANIFEST_2026-06-03.md',
];

const REQUIRED_BICEP_SNIPPETS = [
  "targetScope = 'subscription'",
  "param clientKey string",
  "clientIsolation: 'single-client'",
  "module foundation './foundation.bicep'",
  "module postgres './postgres-foundation.bicep'",
  "module eventIngestion './event-ingestion-foundation.bicep'",
  "module search './search-foundation.bicep'",
  "module immutableAuditLog './immutable-audit-log.bicep'",
  "module defenderStorageMalware './defender-storage-malware.bicep'",
  "module appRuntime './app-runtime-foundation.bicep'",
  "postgresAllowedExtensions: 'PGCRYPTO,UUID-OSSP,VECTOR'",
  "clientIsolation: 'single-client'",
];

const REQUIRED_PARAM_SNIPPETS = [
  "using '../client-tenant-foundation.bicep'",
  "param clientKey = 'example-client'",
  "readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')",
  "ABARVA_CLIENT_KEY",
  "ABARVA_DATA_PLANE_MODE",
  "param auditLogRetentionDays = 365",
  "param enableDefenderStorageMalwareScanning = true",
];

const REQUIRED_LAKESHORE_PARAM_SNIPPETS = [
  "using '../client-tenant-foundation.bicep'",
  "param clientKey = 'lakeshore'",
  "param environmentName = 'pilot'",
  "readEnvironmentVariable('POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD')",
  "param deployAppRuntime = false",
  "ABARVA_CLIENT_KEY",
  "Lakeshore Holdings",
];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function checkFile(relativePath) {
  return {
    name: `file.${relativePath}`,
    status: fs.existsSync(path.join(ROOT, relativePath)) ? 'pass' : 'fail',
  };
}

function checkSnippets(relativePath, snippets) {
  const text = read(relativePath);
  return snippets.map((snippet) => ({
    name: `snippet.${relativePath}.${snippet}`,
    status: text.includes(snippet) ? 'pass' : 'fail',
  }));
}

const checks = [
  ...REQUIRED_FILES.map(checkFile),
  ...checkSnippets('infra/azure/client-tenant-foundation.bicep', REQUIRED_BICEP_SNIPPETS),
  ...checkSnippets('infra/azure/parameters/client-tenant.preview.example.bicepparam', REQUIRED_PARAM_SNIPPETS),
  ...checkSnippets('infra/azure/parameters/lakeshore.pilot.bicepparam', REQUIRED_LAKESHORE_PARAM_SNIPPETS),
];

const summary = checks.reduce((acc, check) => {
  acc[check.status] = (acc[check.status] ?? 0) + 1;
  return acc;
}, {});
const status = checks.some((check) => check.status === 'fail') ? 'fail' : 'pass';

console.log(JSON.stringify({
  audit: 'client-tenant-iac-scaffold',
  status,
  summary,
  checks,
}, null, 2));

if (status !== 'pass') process.exit(1);
