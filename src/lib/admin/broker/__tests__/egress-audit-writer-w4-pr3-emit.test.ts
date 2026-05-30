/**
 * W4-PR-3 · egress-audit-writer → emitNotification("isolation.anomaly")
 *
 * Verifies that a tenant-key mismatch fans out to the notification
 * broker AFTER the canonical `ai_egress_audit` row lands, and that the
 * payload obeys the PII allowlist (no user identifiers, no payload
 * fingerprints — tenant slugs only).
 *
 * Also asserts:
 *   • A matching context does NOT emit.
 *   • A broker failure does NOT propagate.
 *   • A failed insert does NOT emit (the row is the source of truth).
 */

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

const emitNotificationMock = jest.fn(async () => ({
  eventId: 'evt_1',
  enqueuedDeliveries: 1,
}));

jest.mock('@/lib/admin/broker/notification-broker', () => ({
  emitNotification: (...args: unknown[]) => emitNotificationMock(...args),
}));

import { writeEgressAudit } from '../egress-audit-writer';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

const getClientMock = getAzureWriteFluentClient as jest.MockedFunction<
  typeof getAzureWriteFluentClient
>;

function fakeClient(opts: { fail?: string } = {}) {
  return {
    from(_table: string) {
      void _table;
      return {
        insert(row: Record<string, unknown>) {
          return {
            select(_cols: string) {
              void _cols;
              return {
                async single() {
                  if (opts.fail) {
                    return { data: null, error: { message: opts.fail } };
                  }
                  return {
                    data: {
                      ...row,
                      id: 'audit-uuid-1',
                      created_at: '2026-05-30T12:00:00Z',
                    },
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

const baseInput = () => ({
  tenantId: 'client-uuid-1',
  userId: 'user_secret_42',
  workflow: 'intelligence.ask',
  provider: 'anthropic' as const,
  route: 'anthropic-direct' as const,
  dataClass: 'internal' as const,
  policyDecision: 'allow' as const,
  decisionReason: 'policy allows',
  promptHash: 'PROMPT_HASH_DO_NOT_LEAK',
});

describe('W4-PR-3 · writeEgressAudit · isolation.anomaly fan-out', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    emitNotificationMock.mockClear();
    emitNotificationMock.mockResolvedValue({ eventId: 'evt_1', enqueuedDeliveries: 1 });
    getClientMock.mockReturnValue(fakeClient() as unknown as ReturnType<typeof getAzureWriteFluentClient>);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits isolation.anomaly when intended ≠ resolved', async () => {
    await writeEgressAudit(baseInput(), {
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'meridian-health',
      tenantId: 'client-uuid-1',
    });

    await new Promise((r) => setImmediate(r));

    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
    const [arg] = emitNotificationMock.mock.calls[0];
    expect(arg).toMatchObject({
      tenantKey: 'meridian-health',
      eventType: 'isolation.anomaly',
      targetResourceId: 'client-uuid-1',
    });
    // PII allowlist · tenant slugs only, no user id, no prompt hash.
    expect(arg.payload).toMatchObject({
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'meridian-health',
      detector: expect.stringContaining('tenant_mismatch'),
      severity: 'critical',
    });
    expect(JSON.stringify(arg.payload)).not.toContain('user_secret_42');
    expect(JSON.stringify(arg.payload)).not.toContain('PROMPT_HASH_DO_NOT_LEAK');
  });

  it('does NOT emit when intended === resolved (no mismatch)', async () => {
    await writeEgressAudit(baseInput(), {
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'apex-retail',
      tenantId: 'client-uuid-1',
    });

    await new Promise((r) => setImmediate(r));
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT emit when the audit row insert fails', async () => {
    getClientMock.mockReturnValue(
      fakeClient({ fail: 'rls denied' }) as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    await expect(
      writeEgressAudit(baseInput(), {
        intendedTenantKey: 'apex-retail',
        resolvedTenantKey: 'meridian-health',
        tenantId: 'client-uuid-1',
      }),
    ).rejects.toThrow(/AI egress audit write failed/);

    await new Promise((r) => setImmediate(r));
    expect(emitNotificationMock).not.toHaveBeenCalled();
  });

  it('does NOT propagate broker failures into the caller', async () => {
    emitNotificationMock.mockRejectedValueOnce(new Error('broker down'));

    const out = await writeEgressAudit(baseInput(), {
      intendedTenantKey: 'apex-retail',
      resolvedTenantKey: 'meridian-health',
      tenantId: 'client-uuid-1',
    });
    await new Promise((r) => setImmediate(r));

    expect(out.id).toBe('audit-uuid-1');
    expect(emitNotificationMock).toHaveBeenCalledTimes(1);
  });
});
