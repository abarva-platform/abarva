#!/usr/bin/env node
import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/data-plane/tenantConnectionResolver.ts',
    includes: [
      'ABARVA_CLIENT_DATABASE_URL_',
      'ABARVA_TENANT_DATABASE_URL_',
      'AZURE_CLIENT_DATABASE_URL_',
      'refusing shared fallback',
      'maskConnectionString',
    ],
  },
  {
    file: 'src/lib/data-plane/postgresCompat.ts',
    includes: ['resolveDatabaseUrlCandidatesForScope'],
  },
  {
    file: 'src/lib/data-plane/read-adapters/azureSession.ts',
    includes: ['resolveDatabaseUrlCandidatesForScope'],
  },
  {
    file: 'src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts',
    includes: ['resolveDatabaseUrlCandidatesForScope'],
  },
  {
    file: 'src/lib/__tests__/supabase-server.test.ts',
    includes: [
      'uses a tenant-scoped projected secret',
      'fails closed instead of falling back',
      'allows shared fallback only when explicitly enabled',
    ],
  },
  {
    file: 'docs/runbooks/tenant-connection-resolution.md',
    includes: [
      'one client and one client only',
      'ABARVA_CLIENT_DATABASE_URL_<CLIENT_TOKEN>',
      'ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK',
    ],
  },
];

const failures = [];
for (const check of checks) {
  const text = fs.existsSync(check.file) ? fs.readFileSync(check.file, 'utf8') : '';
  if (!text) {
    failures.push(`${check.file} missing`);
    continue;
  }
  for (const expected of check.includes) {
    if (!text.includes(expected)) failures.push(`${check.file} missing "${expected}"`);
  }
}

if (failures.length > 0) {
  console.error('tenant-connection-resolution verifier failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('tenant-connection-resolution verifier passed');
