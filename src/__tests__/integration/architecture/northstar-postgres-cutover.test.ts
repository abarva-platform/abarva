import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = process.cwd();

const DEMO_CRITICAL_PATHS = [
  'scripts/seed/load-tenant-substrate.ts',
  'scripts/audit/db-substrate-audit.mjs',
  'scripts/audit/demo-question-readiness.mjs',
  'src/lib/knowledge/tenant-enterprise-context.ts',
];

const ALL_TENANT_RUNTIME_CUTOVER_PATHS = [
  'src/lib/supabase-server.ts',
  'src/lib/supabase-client.ts',
  'src/lib/supabase.ts',
  'src/lib/programs/programs-auth-mode-server.ts',
  'src/lib/knowledge/tenant-data/supabase-adapter.ts',
  'src/lib/knowledge/tenant-data/graph-traversal.ts',
  'src/app/api/admin/upload-dataset/route.ts',
  'src/app/api/v1/_intel-auth.ts',
  'src/lib/intelligence/synthesis/violationsSupabaseBackend.ts',
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

describe('All-tenant runtime cutover avoids direct Supabase clients', () => {
  it.each(ALL_TENANT_RUNTIME_CUTOVER_PATHS)('%s has no direct Supabase runtime client', (relativePath) => {
    const source = fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');

    expect(source).not.toMatch(/import\s+\{[^}]*\bcreateClient\b[^}]*\}\s+from\s+['"]@supabase\/supabase-js['"]/);
    expect(source).not.toMatch(/await\s+import\(['"]@supabase\/supabase-js['"]\)/);
    expect(source).not.toMatch(/require\(['"]@supabase\/supabase-js['"]\)/);
    expect(source).not.toMatch(/\bNEXT_PUBLIC_SUPABASE_/);
    expect(source).not.toMatch(/\bSUPABASE_SERVICE_ROLE_KEY\b/);
  });
});
