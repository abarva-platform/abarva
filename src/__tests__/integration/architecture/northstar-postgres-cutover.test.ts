import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const DEMO_CRITICAL_PATHS = [
  'scripts/seed/load-tenant-substrate.ts',
  'scripts/audit/db-substrate-audit.mjs',
  'scripts/audit/demo-question-readiness.mjs',
  'src/lib/knowledge/tenant-enterprise-context.ts',
];

describe('Northstar demo-critical data path uses direct Postgres', () => {
  it.each(DEMO_CRITICAL_PATHS)('%s does not use Supabase runtime clients', (relativePath) => {
    const source = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');

    expect(source).not.toMatch(/@supabase\/supabase-js/);
    expect(source).not.toMatch(/\bgetServerSupabase\b/);
    expect(source).not.toMatch(/\bNEXT_PUBLIC_SUPABASE_/);
    expect(source).not.toMatch(/\bSUPABASE_SERVICE_ROLE_KEY\b/);
  });
});
