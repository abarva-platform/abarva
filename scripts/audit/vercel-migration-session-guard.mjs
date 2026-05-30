#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const files = [
  'scripts/vercel-build.sh',
  'src/scripts/run-migrations.ts',
];

const forbidden = [
  /Session"? mode pooler/i,
  /Supabase Dashboard.*Connection string/i,
  /NEXT_PUBLIC_SUPABASE_URL.*run-migrations/i,
  /SUPABASE_SERVICE_ROLE_KEY.*run-migrations/i,
];

const findings = [];
for (const file of files) {
  const body = readFileSync(path.join(ROOT, file), 'utf8');
  for (const pattern of forbidden) {
    if (pattern.test(body)) {
      findings.push(`${file}: forbidden migration-session wording matched ${pattern}`);
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'));
  process.exit(1);
}

console.log('vercel-migration-session-guard: clean');
