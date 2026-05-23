import fs from 'node:fs';
import path from 'node:path';

describe('AI egress migration contract', () => {
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260522170000_ai_egress_control_plane.sql'),
    'utf8',
  );

  it('adds policy to the real tenant table and creates both audit ledgers', () => {
    expect(migration).toContain('ALTER TABLE public.clients');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS ai_policy JSONB');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.ai_egress_audit');
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.tenant_policy_audit');
  });

  it('backfills the three demo tenants without loosening the new-tenant default', () => {
    expect(migration).toContain('"allowExternalAI": false');
    expect(migration).toContain('"kernelOnlyMode": true');
    expect(migration).toContain("'apexretail', 'apex-retail', 'apex retail'");
    expect(migration).toContain('"allowGamma": true');
    expect(migration).toContain("'meridian'");
    expect(migration).toContain("'first-capital'");
    expect(migration).toContain('"allowGamma": false');
  });
});
