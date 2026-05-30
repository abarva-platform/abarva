/**
 * POST /api/admin/switch-tenant · diagnostic-log coverage.
 *
 * Motivation (P1 silent-fail post-mortem · 2026-05-30): when the
 * TenantSwitcher click failed on prod, the server logs carried no
 * structured rejection breadcrumb — every reject path returned a JSON
 * error to the client but emitted nothing to Vercel logs. This made
 * correlating the browser symptom with the server cause impossible.
 *
 * The route now emits a structured `console.warn` JSON line on every
 * reject path with `event=tenant_switch_rejected`, a `reject_reason`,
 * and the `actor_user_id` / `actor_email` / `requested_tenant` fields
 * we already know. This test pins that contract so it does not
 * regress.
 */

// Ensures TypeScript treats this file as a module (not a script), so the
// `const mockAuth` declarations don't collide with route.test.ts in the
// global scope.
export {};

const mockAuth = jest.fn();
const mockCanSwitch = jest.fn();
const mockWriteAudit = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
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

function postRequest(body: unknown): Request {
  return new Request('http://test/api/admin/switch-tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  mockWriteAudit.mockResolvedValue(true);
  mockCurrentUser.mockResolvedValue({
    primaryEmailAddress: { emailAddress: 'anand.sundaram@thesundaram.com' },
  });
});

afterEach(() => {
  warnSpy.mockRestore();
});

function findRejectionLog(): Record<string, unknown> | null {
  for (const call of warnSpy.mock.calls) {
    const arg = call[0];
    if (typeof arg !== 'string') continue;
    try {
      const parsed = JSON.parse(arg) as Record<string, unknown>;
      if (parsed.event === 'tenant_switch_rejected') return parsed;
    } catch {
      // not our JSON line — keep scanning
    }
  }
  return null;
}

describe('switch-tenant diagnostic logs', () => {
  it('logs reject_reason=unauthenticated when there is no session', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'apex-retail' }));
    expect(res.status).toBe(401);
    const log = findRejectionLog();
    expect(log).not.toBeNull();
    expect(log).toMatchObject({
      event: 'tenant_switch_rejected',
      reject_reason: 'unauthenticated',
      actor_user_id: null,
      actor_email: null,
      requested_tenant: null,
    });
    expect(typeof log!.ts).toBe('string');
  });

  it('logs reject_reason=forbidden_not_switch_admin with actor identity', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_demo' });
    mockCanSwitch.mockResolvedValue(false);
    mockCurrentUser.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'demo-apexretail+clerk_test@abarva.com' },
    });
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'meridian-health' }));
    expect(res.status).toBe(403);
    const log = findRejectionLog();
    expect(log).toMatchObject({
      reject_reason: 'forbidden_not_switch_admin',
      actor_user_id: 'user_demo',
      actor_email: 'demo-apexretail+clerk_test@abarva.com',
      requested_tenant: null,
    });
  });

  it('logs reject_reason=invalid_json_body when body is not JSON', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest('not-json'));
    expect(res.status).toBe(400);
    const log = findRejectionLog();
    expect(log).toMatchObject({
      reject_reason: 'invalid_json_body',
      actor_user_id: 'user_admin',
    });
  });

  it('logs reject_reason=non_canonical_tenant_key with the bad key', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'totally-not-a-tenant' }));
    expect(res.status).toBe(400);
    const log = findRejectionLog();
    expect(log).toMatchObject({
      reject_reason: 'non_canonical_tenant_key',
      actor_user_id: 'user_admin',
      requested_tenant: 'totally-not-a-tenant',
    });
  });

  it('logs reject_reason=non_canonical_tenant_key with null when key is not a string', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 42 }));
    expect(res.status).toBe(400);
    const log = findRejectionLog();
    expect(log).toMatchObject({
      reject_reason: 'non_canonical_tenant_key',
      requested_tenant: null,
    });
  });

  it('logs reject_reason=audit_write_failed_nonfatal but still returns 200', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    mockWriteAudit.mockRejectedValueOnce(new Error('admin_audit_log unreachable'));
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'meridian-health' }));
    // The audit failure must NOT block the switch.
    expect(res.status).toBe(200);
    const log = findRejectionLog();
    expect(log).toMatchObject({
      reject_reason: 'audit_write_failed_nonfatal',
      actor_user_id: 'user_admin',
      requested_tenant: 'meridian-health',
    });
  });

  it('does NOT emit a rejection log on the happy 200 path', async () => {
    mockAuth.mockResolvedValue({ userId: 'user_admin' });
    mockCanSwitch.mockResolvedValue(true);
    const { POST } = await import('../route');
    const res = await POST(postRequest({ tenantKey: 'meridian-health' }));
    expect(res.status).toBe(200);
    expect(findRejectionLog()).toBeNull();
  });
});
