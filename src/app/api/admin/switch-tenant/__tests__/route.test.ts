/**
 * POST /api/admin/switch-tenant route tests — Wave 2 PR-5.
 *
 * Coverage:
 *   - 401 when unauthenticated.
 *   - 403 when authenticated but not a tenant-switch admin.
 *   - 400 for non-canonical tenant key.
 *   - 400 for malformed JSON body.
 *   - 200 + ok:true + Set-Cookie header for canonical key.
 *   - admin_audit_log write fires on the 200 path (verified via mock).
 *   - Authority decision is sourced from canSwitchActiveTenant (mocked
 *     at the module boundary; never re-derived inside the route).
 */

// Force module-scope (not script-scope) so the mock declarations don't
// collide with other *.test.ts files in the global TypeScript scope.
export {};

const mockAuth = jest.fn();
const mockCanSwitch = jest.fn();
const mockWriteAudit = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  // The diagnostic-log path calls currentUser() via safePrimaryEmail()
  // for logging context. The route swallows failures here, so a no-op
  // mock is safe — see diagnostic-logs.test.ts for the structured-log
  // contract assertions.
  currentUser: () => Promise.resolve(null),
}));

jest.mock('@/lib/admin/tenant-switch-authority', () => {
  const actual = jest.requireActual('@/lib/admin/tenant-switch-authority');
  return {
    ...actual,
    canSwitchActiveTenant: () => mockCanSwitch(),
  };
});

jest.mock('@/lib/admin/tenant-switch-audit', () => ({
  writeTenantSwitchAudit: (input: unknown) => mockWriteAudit(input),
}));

function postRequest(body: unknown, cookie?: string): Request {
  return new Request('http://test/api/admin/switch-tenant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteAudit.mockResolvedValue(true);
});

describe('POST /api/admin/switch-tenant', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'apex-retail' }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: 'unauthenticated' });
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('returns 403 when the caller is not a tenant-switch admin', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_demo' });
    mockCanSwitch.mockResolvedValue(false);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'apex-retail' }));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: 'forbidden' });
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('returns 400 for a non-canonical tenant key', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'totally-not-a-tenant' }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'invalid_tenant' });
    expect(mockWriteAudit).not.toHaveBeenCalled();
  });

  it('returns 400 when the body is not JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest('this is not json'));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'invalid_tenant' });
  });

  it('rejects legacy app-client keys (only canonical keys are valid)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    // 'apexretail' is the legacy app-client key; canonical is 'apex-retail'.
    const res = await POST(postRequest({ tenantKey: 'apexretail' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 + ok:true and sets the active-client cookie on canonical input', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'meridian-health' }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    const setCookie = res.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('abarva_active_client=meridian');
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain('samesite=lax');
  });

  it('writes an admin_audit_log entry with from/to canonical keys', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(
      postRequest({ tenantKey: 'first-capital' }, 'abarva_active_client=apexretail'),
    );
    expect(res.status).toBe(200);
    expect(mockWriteAudit).toHaveBeenCalledTimes(1);
    expect(mockWriteAudit).toHaveBeenCalledWith({
      actorUserId: 'user_admin',
      fromCanonicalKey: 'apex-retail',
      toCanonicalKey: 'first-capital',
    });
  });

  it('still succeeds when the previous cookie is unset (fromCanonicalKey=null)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'skyharbor-air' }));
    expect(res.status).toBe(200);
    expect(mockWriteAudit).toHaveBeenCalledWith({
      actorUserId: 'user_admin',
      fromCanonicalKey: null,
      toCanonicalKey: 'skyharbor-air',
    });
  });

  it('honors all canonical tenants and rejects non-canonical keys', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const canonical = [
      'apex-retail',
      'meridian-health',
      'first-capital',
      'northstar-clinical',
      'skyharbor-air',
      'lakeshore-holdings',
    ];
    for (const key of canonical) {
      const res = await POST(postRequest({ tenantKey: key }));
      expect(res.status).toBe(200);
    }
    const denied = ['acme-corp', 'globex', 'apex_retail', '', null];
    for (const key of denied) {
      const res = await POST(postRequest({ tenantKey: key }));
      expect(res.status).toBe(400);
    }
  });
});
