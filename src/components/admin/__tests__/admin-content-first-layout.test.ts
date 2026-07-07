import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('admin content-first layout contract', () => {
  it('defaults Steward to an on-demand chip instead of a page-consuming chat lane', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/admin/AdminCanonShellV2.tsx'),
      'utf8',
    );

    expect(source).toContain('gridTemplateColumns: \'280px minmax(0, 1fr)\'');
    expect(source).toContain('surface="admin-steward-content-first-v1"');
    expect(source).toContain('defaultMode="collapsed"');
  });

  it('keeps the reasoning audit tenant-scoped instead of defaulting to all tenants', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/(maestro)/engineering/traces/page.tsx'),
      'utf8',
    );

    expect(source).toContain('resolveAdminTenant');
    expect(source).toContain('where: { trace_id: traceId, tenant_id: tenantId }');
    expect(source).toContain('Tenant: <strong>{tenant.tenantName}</strong>');
    expect(source).not.toContain('<option value="">All tenants</option>');
  });
});
