import fs from 'node:fs';
import path from 'node:path';

describe('/api/v1/atlas tenancy boundary', () => {
  const authSource = fs.readFileSync(
    path.join(process.cwd(), 'src/app/api/v1/atlas/_auth.ts'),
    'utf8',
  );

  it('uses the shared active-tenant resolver instead of caller-controlled membership switching', () => {
    expect(authSource).toContain('@/lib/auth/tenancy');
    expect(authSource).toContain('requireTenancy');
    expect(authSource).not.toContain('userCanAccessClient');
    expect(authSource).not.toContain('currentUser');
  });

  it('only accepts an explicit clientId when it matches the active tenant id or key', () => {
    expect(authSource).toContain('requestedClientId !== tenancy.clientId');
    expect(authSource).toContain('requestedClientId !== tenancy.clientKey');
    expect(authSource).toContain("throw new TenancyError('no_client')");
  });
});
