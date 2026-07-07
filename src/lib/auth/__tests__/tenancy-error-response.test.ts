// tenancyErrorResponse mapping proof (Fix B): a retryable tenant-lookup outage must surface
// as a distinct 503, not collapse to a misleading `no_client` 403. Pure mapping — no Clerk.

import { TenancyError, tenancyErrorResponse } from '../tenancy';

describe('tenancyErrorResponse', () => {
  it('maps unauthenticated → 401', async () => {
    const res = tenancyErrorResponse(new TenancyError('unauthenticated'));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('unauthenticated');
  });

  it('maps no_client → 403', async () => {
    const res = tenancyErrorResponse(new TenancyError('no_client'));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe('no_client');
  });

  it('maps tenant_lookup_unavailable → retryable 503 (not no_client)', async () => {
    const res = tenancyErrorResponse(new TenancyError('tenant_lookup_unavailable'));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('tenant_lookup_unavailable');
    expect(body.error).not.toBe('no_client');
  });

  it('re-throws a non-tenancy error', () => {
    const other = new Error('boom');
    expect(() => tenancyErrorResponse(other)).toThrow('boom');
  });
});
