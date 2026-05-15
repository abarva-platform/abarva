import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('agent-quality violation migration', () => {
  it('creates a tenant-scoped append-only telemetry table with RLS', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260515210000_agent_quality_violation_events.sql'),
      'utf8',
    );

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS agent_quality_violation_events');
    expect(sql).toContain('tenant_client_key     TEXT NOT NULL');
    expect(sql).toContain('violation_types       TEXT[] NOT NULL');
    expect(sql).toContain('violations            JSONB NOT NULL');
    expect(sql).toContain('ALTER TABLE agent_quality_violation_events ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('can_read_tenant_by_key(tenant_client_key)');
    expect(sql).toContain('GRANT SELECT ON agent_quality_violation_events TO authenticated');
  });
});
