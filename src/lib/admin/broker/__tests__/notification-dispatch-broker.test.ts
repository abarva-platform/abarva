/**
 * W4-PR-5 · Notification dispatch broker tests
 *
 * Coverage:
 *   • Empty queue → tick returns zeroes without DB writes.
 *   • Eligibility cutoff: rows newer than QUEUE_GRACE_SECONDS skipped.
 *   • Backoff cutoff: retry_count rows wait for their backoff window.
 *   • in_app: claim transition queued → sent.
 *   • email + success: template rendered, sendEmail called, status sent.
 *   • email + no template: status failed with `no_template_for_event_type`.
 *   • email + no recipient: status failed with `no_recipient_email`.
 *   • email + retryable failure: retry_count bumped, status remains queued.
 *   • email + retryable failure at MAX_RETRIES: status failed.
 *   • email + non-retryable failure: status failed.
 *   • Idempotency: transitionDelivery returns false (no-op) when row already claimed.
 *   • Counters: processed / sent / failed / skipped accurate.
 *   • Deadline: tick exits when wall time exceeds deadlineMs.
 *   • Eligibility helper: pure-fn cutoff math correct.
 *   • Health snapshot returns counts + watermarks.
 */

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    select: jest.fn(),
    maybeSingle: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
    withSession: jest.fn(),
  },
}));

import {
  dispatchTick,
  dispatchHealth,
  __setEmailAdapterForTest,
  __setRecipientResolverForTest,
  __setTenantResolverForTest,
  __internals__,
} from '../notification-dispatch-broker';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { azureRead } from '@/lib/data-plane/azureRead';

type Mocked<T> = jest.MockedFunction<T extends (...args: never[]) => unknown ? T : never>;

const writeFactoryMock = getAzureWriteFluentClient as unknown as Mocked<
  typeof getAzureWriteFluentClient
>;
const queryMock = azureRead.query as unknown as jest.Mock;
const maybeSingleMock = azureRead.maybeSingle as unknown as jest.Mock;
const countMock = azureRead.count as unknown as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// Fake Supabase write client — captures every chained UPDATE call.
// ─────────────────────────────────────────────────────────────────────────────

interface Update {
  table: string;
  patch: Record<string, unknown>;
  filters: Array<{ col: string; value: unknown }>;
  affectedRowId?: string;
}

interface FakeClientOpts {
  /** If true, the chain returns `data: []` to simulate "row already claimed". */
  noAffectedRows?: boolean;
  /** If true, returns an error from the chain. */
  errorOnUpdate?: boolean;
}

function fakeWriteClient(opts: FakeClientOpts = {}) {
  const updates: Update[] = [];
  return {
    updates,
    from(table: string) {
      const chain = {
        _patch: null as Record<string, unknown> | null,
        _filters: [] as Array<{ col: string; value: unknown }>,
        update(patch: Record<string, unknown>) {
          chain._patch = patch;
          return chain;
        },
        eq(col: string, value: unknown) {
          chain._filters.push({ col, value });
          return chain;
        },
        select(cols: string) {
          void cols;
          const row: Update = {
            table,
            patch: chain._patch ?? {},
            filters: [...chain._filters],
            affectedRowId: opts.noAffectedRows
              ? undefined
              : (chain._filters.find((f) => f.col === 'id')?.value as string | undefined),
          };
          updates.push(row);
          if (opts.errorOnUpdate) {
            return Promise.resolve({ data: null, error: { message: 'forced-update-fail' } });
          }
          if (opts.noAffectedRows) {
            return Promise.resolve({ data: [], error: null });
          }
          return Promise.resolve({
            data: row.affectedRowId ? [{ id: row.affectedRowId }] : [],
            error: null,
          });
        },
      };
      return chain;
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-01T12:00:00Z');
const OLD_ENOUGH = new Date(NOW.getTime() - 60_000).toISOString(); // 60s ago
const TOO_NEW = new Date(NOW.getTime() - 1_000).toISOString(); // 1s ago

function queuedRow(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'delivery-1',
    event_id: 'event-1',
    user_id: 'user_clerk_1',
    tenant_id: 'tenant-uuid-1',
    channel: 'email',
    retry_count: 0,
    created_at: OLD_ENOUGH,
    ...over,
  };
}

const TENANT_BRAND = {
  name: 'Apex Retail',
  industryTag: 'Retail',
  canonicalKey: 'apex-retail',
};

beforeEach(() => {
  jest.clearAllMocks();
  queryMock.mockResolvedValue([]);
  maybeSingleMock.mockResolvedValue(null);
  countMock.mockResolvedValue(0);
  __setEmailAdapterForTest(null);
  __setRecipientResolverForTest({ resolveEmail: async () => 'recipient@example.com' });
  __setTenantResolverForTest({ resolveTenant: async () => TENANT_BRAND });
});

afterAll(() => {
  __setEmailAdapterForTest(null);
  __setRecipientResolverForTest(null);
  __setTenantResolverForTest(null);
});

describe('dispatchTick · queue selection', () => {
  it('returns zeroes when the queue is empty', async () => {
    queryMock.mockResolvedValueOnce([]);
    const result = await dispatchTick({ now: NOW });
    expect(result.processed).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('skips rows newer than the grace cutoff', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ created_at: TOO_NEW })]);
    const result = await dispatchTick({ now: NOW });
    // Filtered out before processing.
    expect(result.processed).toBe(0);
  });

  it('processes rows older than the grace cutoff', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'in_app' })]);
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );
    const result = await dispatchTick({ now: NOW });
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);
  });
});

describe('dispatchTick · in_app channel', () => {
  it('transitions queued → sent atomically', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'in_app' })]);
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );
    const result = await dispatchTick({ now: NOW });
    expect(result.sent).toBe(1);
    expect(fake.updates).toHaveLength(1);
    expect(fake.updates[0]?.patch.status).toBe('sent');
    expect(fake.updates[0]?.patch.sent_at).toBeDefined();
    // Idempotency precondition: both id and status='queued' filters.
    expect(fake.updates[0]?.filters).toEqual(
      expect.arrayContaining([
        { col: 'id', value: 'delivery-1' },
        { col: 'status', value: 'queued' },
      ]),
    );
  });

  it('counts skipped when row already claimed by a concurrent tick', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'in_app' })]);
    const fake = fakeWriteClient({ noAffectedRows: true });
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );
    const result = await dispatchTick({ now: NOW });
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe(1);
  });
});

describe('dispatchTick · email channel', () => {
  it('renders template + dispatches + records sent', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email' })]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'approval.requested',
      payload: {
        eventId: 'event-1',
        requestId: 'req-1',
        programName: 'Test Program',
        phase: '2 · Define',
        requesterName: 'Test Requester',
        producedAtIso: NOW.toISOString(),
      },
      tenant_id: 'tenant-uuid-1',
    });
    type SendArg = Parameters<typeof import('@/lib/notifications/channels/email-resend').sendEmail>[0];
    const sendEmailMock = jest.fn(async (_input: SendArg) => {
      void _input;
      return { ok: true as const, providerMessageId: 'resend-id-1' };
    });
    __setEmailAdapterForTest({ sendEmail: sendEmailMock });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.sent).toBe(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const sendArg = sendEmailMock.mock.calls[0]?.[0];
    expect(sendArg?.to).toBe('recipient@example.com');
    expect(sendArg?.subject).toContain('Approval requested');
    expect(sendArg?.html).toMatch(/AbarVa tenant/i); // CAN-SPAM footer
    expect(sendArg?.text).toMatch(/notification preferences/i); // text footer
    expect(sendArg?.headers?.['X-Entity-Ref-ID']).toBe('event-1');
    expect(sendArg?.headers?.['X-Delivery-Id']).toBe('delivery-1');
    expect(fake.updates).toHaveLength(1);
    expect(fake.updates[0]?.patch.status).toBe('sent');
    expect(fake.updates[0]?.patch.provider_message_id).toBe('resend-id-1');
  });

  it('marks failed when no template exists for the event_type', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email' })]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'intelligence.ask_submitted', // registered but no template
      payload: {},
      tenant_id: 'tenant-uuid-1',
    });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.failed).toBe(1);
    expect(fake.updates[0]?.patch.status).toBe('failed');
    expect(fake.updates[0]?.patch.bounce_reason).toBe('no_template_for_event_type');
  });

  it('marks failed when no recipient email can be resolved', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email' })]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'approval.requested',
      payload: { programName: 'X', phase: '2', requesterName: 'Y', producedAtIso: NOW.toISOString(), requestId: 'r', eventId: 'e' },
      tenant_id: 'tenant-uuid-1',
    });
    __setRecipientResolverForTest({ resolveEmail: async () => null });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.failed).toBe(1);
    expect(fake.updates[0]?.patch.bounce_reason).toBe('no_recipient_email');
  });

  it('marks failed when parent event row is missing', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email' })]);
    maybeSingleMock.mockResolvedValueOnce(null);
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.failed).toBe(1);
    expect(fake.updates[0]?.patch.bounce_reason).toBe('parent_event_not_found');
  });
});

describe('dispatchTick · retry + backoff', () => {
  it('bumps retry_count on retryable failure (does NOT mark failed yet)', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email', retry_count: 0 })]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'approval.requested',
      payload: {
        eventId: 'e', requestId: 'r', programName: 'P', phase: '2',
        requesterName: 'R', producedAtIso: NOW.toISOString(),
      },
      tenant_id: 'tenant-uuid-1',
    });
    __setEmailAdapterForTest({
      sendEmail: async () => ({
        ok: false as const,
        reason: 'rate_limit' as const,
        retryable: true,
        message: 'rate limited',
      }),
    });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    // bumpRetryCount UPDATE recorded retry_count=1 with status='queued' filter.
    expect(fake.updates).toHaveLength(1);
    expect(fake.updates[0]?.patch.retry_count).toBe(1);
    expect(fake.updates[0]?.patch.status).toBeUndefined();
  });

  it('promotes to failed when MAX_RETRIES is hit on a retryable error', async () => {
    queryMock.mockResolvedValueOnce([
      queuedRow({
        channel: 'email',
        retry_count: __internals__.MAX_RETRIES - 1,
        // Old enough for retry-2 cutoff (5min + grace) — push back 10 min.
        created_at: new Date(NOW.getTime() - 10 * 60_000).toISOString(),
      }),
    ]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'approval.requested',
      payload: {
        eventId: 'e', requestId: 'r', programName: 'P', phase: '2',
        requesterName: 'R', producedAtIso: NOW.toISOString(),
      },
      tenant_id: 'tenant-uuid-1',
    });
    __setEmailAdapterForTest({
      sendEmail: async () => ({
        ok: false as const,
        reason: 'provider_error' as const,
        retryable: true,
        message: 'transient',
      }),
    });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.failed).toBe(1);
    expect(fake.updates[0]?.patch.status).toBe('failed');
    expect(String(fake.updates[0]?.patch.bounce_reason)).toMatch(/max_retries_exhausted/);
  });

  it('marks failed immediately for non-retryable error', async () => {
    queryMock.mockResolvedValueOnce([queuedRow({ channel: 'email', retry_count: 0 })]);
    maybeSingleMock.mockResolvedValueOnce({
      event_type: 'approval.requested',
      payload: {
        eventId: 'e', requestId: 'r', programName: 'P', phase: '2',
        requesterName: 'R', producedAtIso: NOW.toISOString(),
      },
      tenant_id: 'tenant-uuid-1',
    });
    __setEmailAdapterForTest({
      sendEmail: async () => ({
        ok: false as const,
        reason: 'invalid_recipient' as const,
        retryable: false,
        message: 'bad address',
      }),
    });
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );

    const result = await dispatchTick({ now: NOW });
    expect(result.failed).toBe(1);
    expect(fake.updates[0]?.patch.status).toBe('failed');
    expect(String(fake.updates[0]?.patch.bounce_reason)).toMatch(/invalid_recipient/);
  });

  it('skips a row whose retry_count is too recent for its backoff window', async () => {
    // retry_count=1 needs >= 60s + grace. created_at only 20s ago.
    queryMock.mockResolvedValueOnce([
      queuedRow({
        channel: 'email',
        retry_count: 1,
        created_at: new Date(NOW.getTime() - 20_000).toISOString(),
      }),
    ]);
    const result = await dispatchTick({ now: NOW });
    expect(result.processed).toBe(0);
  });
});

describe('dispatchTick · deadline + idempotency', () => {
  it('exits the loop when deadlineMs is exceeded', async () => {
    // Two rows; deadline budget 0 forces only the first to be inspected.
    queryMock.mockResolvedValueOnce([
      queuedRow({ id: 'd1', channel: 'in_app' }),
      queuedRow({ id: 'd2', channel: 'in_app' }),
    ]);
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(
      fake as unknown as ReturnType<typeof getAzureWriteFluentClient>,
    );
    // deadlineMs negative → break before the first iteration.
    const result = await dispatchTick({ now: NOW, deadlineMs: -1 });
    expect(result.processed).toBe(0);
  });

  it('honors batchSize', async () => {
    queryMock.mockResolvedValueOnce([]);
    await dispatchTick({ now: NOW, batchSize: 7 });
    // The LIMIT param is the second arg of the parametrised query.
    expect(queryMock).toHaveBeenCalled();
    const args = queryMock.mock.calls[0];
    const params = args?.[1] as unknown[];
    expect(params?.[1]).toBe(7);
  });
});

describe('eligibilityCutoffSeconds (pure)', () => {
  it('retry_count=0 → grace only', () => {
    expect(__internals__.eligibilityCutoffSeconds(0)).toBe(
      __internals__.QUEUE_GRACE_SECONDS,
    );
  });
  it('retry_count=1 → grace + 60s', () => {
    expect(__internals__.eligibilityCutoffSeconds(1)).toBe(
      __internals__.QUEUE_GRACE_SECONDS + 60,
    );
  });
  it('retry_count=2 → grace + 60 + 300', () => {
    expect(__internals__.eligibilityCutoffSeconds(2)).toBe(
      __internals__.QUEUE_GRACE_SECONDS + 60 + 300,
    );
  });
  it('clamps retry_count beyond schedule', () => {
    const big = __internals__.eligibilityCutoffSeconds(99);
    const last = __internals__.eligibilityCutoffSeconds(
      __internals__.RETRY_BACKOFF_SECONDS.length - 1,
    );
    expect(big).toBe(last);
  });
});

describe('dispatchHealth', () => {
  it('returns counts + watermarks', async () => {
    countMock.mockResolvedValueOnce(3);
    maybeSingleMock
      .mockResolvedValueOnce({ created_at: '2026-06-01T11:50:00Z' })
      .mockResolvedValueOnce({ sent_at: '2026-06-01T11:59:00Z' })
      .mockResolvedValueOnce({ sent_at: '2026-06-01T11:30:00Z' });
    const snap = await dispatchHealth();
    expect(snap.queuedCount).toBe(3);
    expect(snap.oldestQueuedAt).toBe('2026-06-01T11:50:00Z');
    expect(snap.lastSentAt).toBe('2026-06-01T11:59:00Z');
    expect(snap.lastFailedAt).toBe('2026-06-01T11:30:00Z');
  });

  it('returns null watermarks when DB is empty', async () => {
    countMock.mockResolvedValueOnce(0);
    maybeSingleMock
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    const snap = await dispatchHealth();
    expect(snap.queuedCount).toBe(0);
    expect(snap.oldestQueuedAt).toBeNull();
    expect(snap.lastSentAt).toBeNull();
    expect(snap.lastFailedAt).toBeNull();
  });

  it('returns zeros when the underlying read fails', async () => {
    countMock.mockRejectedValueOnce(new Error('boom'));
    const snap = await dispatchHealth();
    expect(snap.queuedCount).toBe(0);
    expect(snap.oldestQueuedAt).toBeNull();
  });
});
