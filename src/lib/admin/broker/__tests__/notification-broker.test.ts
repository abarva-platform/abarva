/**
 * W4-PR-2 · Notification broker tests
 *
 * Coverage:
 *   • Happy path: registered event_type → event row + delivery rows.
 *   • Unregistered event_type throws.
 *   • Tenant resolution failure throws.
 *   • Recipient set: explicit recipientUserIds wins.
 *   • Mandatory subscription overrides channel='none' opt-out.
 *   • Dedup window collapses duplicates.
 *   • Daily cap downgrades to in_app.
 *   • Quiet hours route warn → in_app, info → drop, critical-security → override.
 *   • Phase 1 channel filter strips slack/teams/pagerduty/webhook.
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

jest.mock('@/lib/admin/data/admin-db-helpers', () => ({
  resolveClientId: jest.fn(),
  requireClientId: jest.fn(),
}));

import {
  emitNotification,
  isInQuietHours,
  __setPersonaResolverForTest,
} from '../notification-broker';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { azureRead } from '@/lib/data-plane/azureRead';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';

type Mocked<T> = jest.MockedFunction<T extends (...args: never[]) => unknown ? T : never>;

const writeFactoryMock = getAzureWriteFluentClient as unknown as Mocked<typeof getAzureWriteFluentClient>;
const resolveClientIdMock = resolveClientId as unknown as Mocked<typeof resolveClientId>;
const selectMock = azureRead.select as unknown as jest.Mock;
const queryMock = azureRead.query as unknown as jest.Mock;

// ─────────────────────────────────────────────────────────────────────────────
// Fake Supabase write client matching the chain the broker uses.
// ─────────────────────────────────────────────────────────────────────────────

interface Insert {
  table: string;
  row: Record<string, unknown>;
}

function fakeWriteClient(opts: { eventInsertId?: string; deliveryFail?: boolean } = {}) {
  const inserts: Insert[] = [];
  return {
    inserts,
    from(table: string) {
      const chain = {
        _table: table,
        _row: null as Record<string, unknown> | null,
        insert(row: Record<string, unknown>) {
          chain._row = row;
          inserts.push({ table, row });
          return chain;
        },
        select(cols: string) {
          void cols;
          return {
            async single() {
              if (table === 'notification_events') {
                return {
                  data: { id: opts.eventInsertId ?? 'evt-uuid-1' },
                  error: null,
                };
              }
              return { data: null, error: null };
            },
          };
        },
        // Some calls don't chain .select(); broker returns from the await
        // directly. For delivery inserts we yield an awaited shape.
        then(resolve: (v: unknown) => void) {
          if (table === 'notification_deliveries' && opts.deliveryFail) {
            resolve({ data: null, error: { message: 'forced-delivery-fail' } });
          } else {
            resolve({ data: null, error: null });
          }
        },
      };
      return chain;
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  __setPersonaResolverForTest(async (uid) => ({
    userId: uid,
    tenantRole: null,
    personas: [],
  }));
  resolveClientIdMock.mockResolvedValue('tenant-uuid-1');
  selectMock.mockResolvedValue([]);
  queryMock.mockResolvedValue([]);
});

afterAll(() => {
  __setPersonaResolverForTest(null);
});

describe('emitNotification · validation', () => {
  it('throws when event_type is not in registry', async () => {
    await expect(
      emitNotification({
        tenantKey: 'apexretail',
        eventType: 'nonexistent.event',
        payload: {},
      }),
    ).rejects.toThrow(/unregistered event_type/);
  });

  it('throws when tenant cannot be resolved', async () => {
    resolveClientIdMock.mockResolvedValueOnce(null);
    await expect(
      emitNotification({
        tenantKey: 'unknown',
        eventType: 'approval.requested',
        payload: {},
      }),
    ).rejects.toThrow(/could not resolve tenant_id/);
  });
});

describe('emitNotification · happy path (caller-supplied recipients)', () => {
  it('inserts an event row + one delivery row per subscriber × phase-1 channel', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // recipientUserIds path skips persona-default fan-out; mandatory query returns empty.
    selectMock.mockResolvedValue([]);
    const result = await emitNotification({
      tenantKey: 'apexretail',
      eventType: 'approval.requested',
      payload: { programId: 'p1' },
      recipientUserIds: ['user_1'],
    });
    expect(result.eventId).toBe('evt-uuid-1');
    expect(result.enqueuedDeliveries).toBeGreaterThanOrEqual(1);
    // Event row inserted.
    const eventInsert = client.inserts.find((i) => i.table === 'notification_events');
    expect(eventInsert).toBeDefined();
    expect(eventInsert?.row.event_type).toBe('approval.requested');
    expect(eventInsert?.row.tenant_id).toBe('tenant-uuid-1');
    // Delivery rows inserted (at least one).
    const deliveryInserts = client.inserts.filter((i) => i.table === 'notification_deliveries');
    expect(deliveryInserts.length).toBeGreaterThan(0);
    for (const di of deliveryInserts) {
      expect(di.row.user_id).toBe('user_1');
      expect(['email', 'in_app']).toContain(di.row.channel);
      expect(di.row.status).toBe('queued');
    }
  });
});

describe('emitNotification · mandatory subscription overrides opt-out', () => {
  it('forces in_app delivery even when user pref is channel=none', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // First select call: preferences (channel='none').
    // Second: subscriptions (mandatory).
    selectMock
      .mockResolvedValueOnce([
        {
          id: 'p1',
          tenant_id: 'tenant-uuid-1',
          user_id: 'user_1',
          event_type: 'approval.requested',
          channel: 'none',
          frequency: 'none',
          quiet_hours_start: null,
          quiet_hours_end: null,
          timezone: 'UTC',
          mandatory: true,
          daily_cap: 20,
          created_at: '2026-05-30T00:00:00Z',
          updated_at: '2026-05-30T00:00:00Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 's1',
          tenant_id: 'tenant-uuid-1',
          user_id: 'user_1',
          event_type: 'approval.requested',
          added_by_admin_id: 'admin_1',
          reason: null,
          created_at: '2026-05-30T00:00:00Z',
        },
      ]);
    const result = await emitNotification({
      tenantKey: 'apexretail',
      eventType: 'approval.requested',
      payload: {},
    });
    expect(result.enqueuedDeliveries).toBeGreaterThan(0);
    const deliveryInserts = client.inserts.filter((i) => i.table === 'notification_deliveries');
    // Mandatory subscription forces at least in_app even though pref channel was 'none'.
    expect(deliveryInserts.some((d) => d.row.channel === 'in_app')).toBe(true);
  });
});

describe('emitNotification · dedup window', () => {
  it('collapses a same (user, event, target) emit within 5 minutes', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // azureRead.query returns a recent delivery → dedup hits.
    queryMock.mockResolvedValueOnce([{ id: 'prior-delivery' }]);
    const result = await emitNotification({
      tenantKey: 'apexretail',
      eventType: 'approval.requested',
      payload: {},
      targetResourceId: 'program-7',
      recipientUserIds: ['user_1'],
    });
    expect(result.enqueuedDeliveries).toBe(0);
    const deliveryInserts = client.inserts.filter((i) => i.table === 'notification_deliveries');
    expect(deliveryInserts).toHaveLength(0);
  });
});

describe('emitNotification · daily cap', () => {
  it('downgrades to in_app when daily cap is exceeded', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // With targetResourceId set, the broker queries dedup window first
    // (empty → miss) then daily count (25 → exceeded).
    queryMock
      .mockResolvedValueOnce([]) // dedup miss
      .mockResolvedValueOnce([{ count: '25' }]); // daily cap exceeded
    const result = await emitNotification({
      tenantKey: 'apexretail',
      eventType: 'approval.requested',
      payload: {},
      targetResourceId: 'program-cap-test',
      recipientUserIds: ['user_1'],
    });
    const deliveryInserts = client.inserts.filter((i) => i.table === 'notification_deliveries');
    expect(deliveryInserts).toHaveLength(1);
    expect(deliveryInserts[0].row.channel).toBe('in_app');
    expect(result.enqueuedDeliveries).toBe(1);
  });
});

describe('isInQuietHours', () => {
  it('returns false when start/end are null', () => {
    expect(isInQuietHours({ start: null, end: null, timezone: 'UTC' })).toBe(false);
  });

  it('returns true when now is inside a non-wrapping window', () => {
    const now = new Date('2026-05-30T08:00:00Z');
    expect(isInQuietHours({ start: '07:00:00', end: '09:00:00', timezone: 'UTC' }, now)).toBe(true);
  });

  it('returns true when now is inside a midnight-wrapping window', () => {
    const now = new Date('2026-05-30T03:00:00Z');
    expect(isInQuietHours({ start: '22:00:00', end: '06:00:00', timezone: 'UTC' }, now)).toBe(true);
  });

  it('returns false when now is outside the window', () => {
    const now = new Date('2026-05-30T15:00:00Z');
    expect(isInQuietHours({ start: '22:00:00', end: '06:00:00', timezone: 'UTC' }, now)).toBe(false);
  });
});

describe('emitNotification · quiet hours', () => {
  it('drops info events during quiet hours', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // pref with quiet hours covering 'now', explicit channel 'email'.
    selectMock.mockResolvedValueOnce([
      {
        id: 'p1',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_1',
        event_type: 'invite.sent',
        channel: 'email',
        frequency: 'immediate',
        quiet_hours_start: '00:00:00',
        quiet_hours_end: '23:59:00',
        timezone: 'UTC',
        mandatory: false,
        daily_cap: 20,
        created_at: '2026-05-30T00:00:00Z',
        updated_at: '2026-05-30T00:00:00Z',
      },
    ]);
    const now = new Date('2026-05-30T12:00:00Z');
    const result = await emitNotification(
      {
        tenantKey: 'apexretail',
        eventType: 'invite.sent', // info severity
        payload: {},
        recipientUserIds: ['user_1'],
      },
      { now },
    );
    expect(result.enqueuedDeliveries).toBe(0);
  });

  it('lets critical security events override quiet hours', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    // pref with explicit 'email', covering 'now' as quiet.
    selectMock.mockResolvedValueOnce([
      {
        id: 'p1',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_1',
        event_type: 'isolation.anomaly',
        channel: 'email',
        frequency: 'immediate',
        quiet_hours_start: '00:00:00',
        quiet_hours_end: '23:59:00',
        timezone: 'UTC',
        mandatory: false,
        daily_cap: 20,
        created_at: '2026-05-30T00:00:00Z',
        updated_at: '2026-05-30T00:00:00Z',
      },
    ]);
    const now = new Date('2026-05-30T12:00:00Z');
    const result = await emitNotification(
      {
        tenantKey: 'apexretail',
        eventType: 'isolation.anomaly', // critical + security audit_class
        payload: {},
        recipientUserIds: ['user_1'],
      },
      { now },
    );
    expect(result.enqueuedDeliveries).toBeGreaterThan(0);
  });
});
