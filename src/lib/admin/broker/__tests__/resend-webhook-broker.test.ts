/**
 * W4-PR-7 · Resend webhook broker tests
 *
 * Covers the broker's event-handling pipeline:
 *   • email.sent transitions queued → sent.
 *   • email.delivered transitions queued/sent → delivered.
 *   • email.bounced records bounce_reason + bounce_type.
 *   • Permanent bounce → channel disable + admin notify.
 *   • 3 transient bounces in 7d → channel disable.
 *   • email.complained → auto-unsubscribe non-mandatory.
 *   • Mandatory subscriptions survive complaint.
 *   • Duplicate webhook delivery is idempotent.
 *   • Unknown event_type returns no_op_no_delivery.
 *   • Missing email_id returns error.
 *   • Missing delivery row returns no_op_no_delivery.
 *   • Health probe last-received timestamp.
 */

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
    select: jest.fn(),
    maybeSingle: jest.fn(),
    count: jest.fn(),
    withSession: jest.fn(),
  },
}));

jest.mock('@/lib/admin/broker/notification-broker', () => ({
  emitNotification: jest.fn(),
}));

import {
  processResendWebhookEvent,
  recordWebhookReceived,
  getLastWebhookReceivedAt,
  __resetWebhookHealthForTest,
  PERSISTENT_BOUNCE_THRESHOLD,
  type ResendWebhookEvent,
} from '../resend-webhook-broker';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { azureRead } from '@/lib/data-plane/azureRead';
import { emitNotification } from '@/lib/admin/broker/notification-broker';

const writeFactoryMock = getAzureWriteFluentClient as unknown as jest.Mock;
const queryMock = azureRead.query as unknown as jest.Mock;
const selectMock = azureRead.select as unknown as jest.Mock;
const emitMock = emitNotification as unknown as jest.Mock;

interface UpdateOp {
  table: string;
  patch: Record<string, unknown>;
  filterCol: string;
  filterVal: unknown;
}
interface InsertOp {
  table: string;
  row: Record<string, unknown>;
}

function makeWriteClient(opts: { updateFail?: boolean; insertFail?: boolean } = {}) {
  const updates: UpdateOp[] = [];
  const inserts: InsertOp[] = [];

  return {
    updates,
    inserts,
    from(table: string) {
      let pendingPatch: Record<string, unknown> | null = null;
      let pendingInsert: Record<string, unknown> | null = null;
      const chain: Record<string, unknown> = {
        update(patch: Record<string, unknown>) {
          pendingPatch = patch;
          return chain;
        },
        insert(row: Record<string, unknown>) {
          pendingInsert = row;
          inserts.push({ table, row });
          if (opts.insertFail) {
            return Promise.resolve({ data: null, error: { message: 'forced_insert_fail' } });
          }
          return Promise.resolve({ data: null, error: null });
        },
        eq(col: string, val: unknown) {
          if (pendingPatch) {
            updates.push({ table, patch: pendingPatch, filterCol: col, filterVal: val });
            pendingPatch = null;
            if (opts.updateFail) {
              return Promise.resolve({ data: null, error: { message: 'forced_update_fail' } });
            }
            return Promise.resolve({ data: null, error: null });
          }
          return chain;
        },
      };
      // Make insert awaitable directly too (some callers don't chain .eq).
      void pendingInsert;
      return chain;
    },
  };
}

const baseDeliveryRow = {
  id: 'delivery-uuid-1',
  event_id: 'event-uuid-1',
  user_id: 'user_2abc123def456',
  tenant_id: 'tenant-uuid-1',
  channel: 'email',
  status: 'queued',
  provider_message_id: 'resend_msg_1',
  sent_at: null,
  delivered_at: null,
  bounce_reason: null,
  bounce_type: null,
  retry_count: 0,
  created_at: '2026-05-30T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  selectMock.mockResolvedValue([]);
  queryMock.mockReset();
  emitMock.mockReset();
  emitMock.mockResolvedValue({ eventId: 'evt-spawned-1', enqueuedDeliveries: 1 });
  __resetWebhookHealthForTest();
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — queryMock dispatcher keyed on which SQL is being executed.
// ─────────────────────────────────────────────────────────────────────────────

interface QueryDispatchConfig {
  deliveryRow?: Record<string, unknown> | null;
  bounceCount?: number;
  tenantCanonicalKey?: string | null;
  adminUserIds?: string[];
}

function configureQuery(cfg: QueryDispatchConfig) {
  queryMock.mockImplementation((sql: string) => {
    const lower = sql.toLowerCase();
    if (lower.includes('from notification_deliveries') && lower.includes('provider_message_id')) {
      return Promise.resolve(cfg.deliveryRow === null ? [] : [cfg.deliveryRow ?? baseDeliveryRow]);
    }
    if (lower.includes("status = 'bounced'")) {
      return Promise.resolve([{ count: String(cfg.bounceCount ?? 0) }]);
    }
    if (lower.includes('from clients')) {
      return Promise.resolve(
        cfg.tenantCanonicalKey === null
          ? []
          : [{ canonical_key: cfg.tenantCanonicalKey ?? 'apex-retail', slug: null }],
      );
    }
    if (lower.includes('from notification_subscriptions')) {
      return Promise.resolve((cfg.adminUserIds ?? ['user_admin_1']).map((uid) => ({ user_id: uid })));
    }
    return Promise.resolve([]);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('processResendWebhookEvent · email.sent', () => {
  it('transitions queued → sent', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: { ...baseDeliveryRow, status: 'queued' } });

    const ev: ResendWebhookEvent = {
      type: 'email.sent',
      data: { email_id: 'resend_msg_1' },
    };
    const result = await processResendWebhookEvent(ev);
    expect(result).toEqual({ ok: true, action: 'status_transitioned', from: 'queued', to: 'sent' });
    expect(client.updates).toHaveLength(1);
    expect(client.updates[0]).toMatchObject({
      table: 'notification_deliveries',
      patch: expect.objectContaining({ status: 'sent' }),
      filterCol: 'id',
      filterVal: 'delivery-uuid-1',
    });
  });

  it('no-ops if delivery already past sent', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: { ...baseDeliveryRow, status: 'delivered' } });

    const result = await processResendWebhookEvent({
      type: 'email.sent',
      data: { email_id: 'resend_msg_1' },
    });
    expect(result).toMatchObject({ action: 'no_op_already_in_final_state', status: 'delivered' });
    expect(client.updates).toHaveLength(0);
  });
});

describe('processResendWebhookEvent · email.delivered', () => {
  it('transitions sent → delivered', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: { ...baseDeliveryRow, status: 'sent', sent_at: '2026-05-30T01:00:00.000Z' } });

    const result = await processResendWebhookEvent({
      type: 'email.delivered',
      data: { email_id: 'resend_msg_1' },
    });
    expect(result).toMatchObject({ action: 'status_transitioned', from: 'sent', to: 'delivered' });
    const patch = client.updates[0]?.patch;
    expect(patch).toMatchObject({ status: 'delivered' });
    expect(patch?.delivered_at).toBeTruthy();
  });
});

describe('processResendWebhookEvent · email.bounced', () => {
  it('records bounce_reason and bounce_type for a transient bounce below threshold', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: baseDeliveryRow, bounceCount: 1 });

    const result = await processResendWebhookEvent({
      type: 'email.bounced',
      data: {
        email_id: 'resend_msg_1',
        bounce: { type: 'Transient', message: 'Mailbox temporarily unavailable' },
      },
    });
    expect(result).toMatchObject({ action: 'status_transitioned', to: 'bounced' });
    expect(client.updates[0]?.patch).toMatchObject({
      status: 'bounced',
      bounce_type: 'Transient',
      bounce_reason: 'Mailbox temporarily unavailable',
    });
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('immediately disables channel on Permanent bounce', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    selectMock.mockResolvedValue([
      {
        id: 'pref-1',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_2abc123def456',
        event_type: 'approval.requested',
        channel: 'email',
        frequency: 'immediate',
        mandatory: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        daily_cap: 20,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'pref-2',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_2abc123def456',
        event_type: 'connector.failed',
        channel: 'email',
        frequency: 'immediate',
        mandatory: true, // mandatory — must survive
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        daily_cap: 20,
        created_at: '',
        updated_at: '',
      },
    ]);
    configureQuery({ deliveryRow: baseDeliveryRow });

    const result = await processResendWebhookEvent({
      type: 'email.bounced',
      data: {
        email_id: 'resend_msg_1',
        bounce: { type: 'Permanent', message: 'Unknown recipient' },
      },
    });
    expect(result).toMatchObject({
      action: 'channel_disabled',
      reason: 'permanent_bounce',
      eventTypesAffected: 1,
    });
    // Exactly one downgrade (the non-mandatory pref).
    const downgrades = client.updates.filter((u) => u.table === 'notification_preferences');
    expect(downgrades).toHaveLength(1);
    expect(downgrades[0]?.filterVal).toBe('pref-1');
    expect(downgrades[0]?.patch).toEqual({ channel: 'none' });
    // Audit row written.
    const audits = client.inserts.filter((i) => i.table === 'admin_audit_log');
    expect(audits).toHaveLength(1);
    expect(audits[0]?.row).toMatchObject({ action: 'email_channel_auto_disabled' });
    // Admin notification emitted.
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'system.delivery_failed',
        recipientUserIds: ['user_admin_1'],
        payload: expect.objectContaining({
          reason: 'permanent_bounce',
          bounce_type: 'Permanent',
        }),
      }),
    );
  });

  it('disables channel after 3 transient bounces in 7 days', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    selectMock.mockResolvedValue([]);
    configureQuery({ deliveryRow: baseDeliveryRow, bounceCount: PERSISTENT_BOUNCE_THRESHOLD });

    const result = await processResendWebhookEvent({
      type: 'email.bounced',
      data: {
        email_id: 'resend_msg_1',
        bounce: { type: 'Transient', message: 'Greylisted' },
      },
    });
    expect(result).toMatchObject({
      action: 'channel_disabled',
      reason: 'persistent_bounce',
    });
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          reason: 'persistent_bounce',
          bounce_count_7d: PERSISTENT_BOUNCE_THRESHOLD,
        }),
      }),
    );
  });

  it('is idempotent when the same bounce event arrives twice', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: { ...baseDeliveryRow, status: 'bounced' } });

    const result = await processResendWebhookEvent({
      type: 'email.bounced',
      data: {
        email_id: 'resend_msg_1',
        bounce: { type: 'Permanent', message: 'Unknown recipient' },
      },
    });
    expect(result).toMatchObject({ action: 'no_op_already_in_final_state', status: 'bounced' });
    expect(client.updates).toHaveLength(0);
    expect(emitMock).not.toHaveBeenCalled();
  });
});

describe('processResendWebhookEvent · email.complained', () => {
  it('downgrades non-mandatory email preferences and preserves mandatory rows', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    selectMock.mockResolvedValue([
      {
        id: 'pref-marketing',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_2abc123def456',
        event_type: 'tower.weekly_brief',
        channel: 'email',
        frequency: 'digest_weekly',
        mandatory: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        daily_cap: 20,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'pref-security',
        tenant_id: 'tenant-uuid-1',
        user_id: 'user_2abc123def456',
        event_type: 'rls.policy_change',
        channel: 'email',
        frequency: 'immediate',
        mandatory: true, // MUST survive complaint
        quiet_hours_start: null,
        quiet_hours_end: null,
        timezone: 'UTC',
        daily_cap: 20,
        created_at: '',
        updated_at: '',
      },
    ]);
    configureQuery({ deliveryRow: baseDeliveryRow });

    const result = await processResendWebhookEvent({
      type: 'email.complained',
      data: { email_id: 'resend_msg_1' },
    });
    expect(result).toMatchObject({
      action: 'channel_disabled',
      reason: 'complaint',
      eventTypesAffected: 1,
    });
    const downgrades = client.updates.filter((u) => u.table === 'notification_preferences');
    expect(downgrades).toHaveLength(1);
    expect(downgrades[0]?.filterVal).toBe('pref-marketing');
    // Audit row written with action='email_complained'.
    const audits = client.inserts.filter((i) => i.table === 'admin_audit_log');
    expect(audits[0]?.row).toMatchObject({ action: 'email_complained' });
    // Admin notify.
    expect(emitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'system.delivery_failed',
        payload: expect.objectContaining({ reason: 'complaint' }),
      }),
    );
  });

  it('no-ops on duplicate complaint event', async () => {
    const client = makeWriteClient();
    writeFactoryMock.mockReturnValue(client);
    configureQuery({ deliveryRow: { ...baseDeliveryRow, status: 'complained' } });
    const result = await processResendWebhookEvent({
      type: 'email.complained',
      data: { email_id: 'resend_msg_1' },
    });
    expect(result).toMatchObject({ action: 'no_op_already_in_final_state', status: 'complained' });
    expect(client.updates).toHaveLength(0);
    expect(emitMock).not.toHaveBeenCalled();
  });
});

describe('processResendWebhookEvent · edge cases', () => {
  it('returns error when email_id is missing', async () => {
    const result = await processResendWebhookEvent({ type: 'email.bounced', data: {} });
    expect(result).toEqual({ ok: false, error: 'resend_webhook_missing_email_id' });
  });

  it('returns no_op_no_delivery when no matching delivery row exists', async () => {
    configureQuery({ deliveryRow: null });
    const result = await processResendWebhookEvent({
      type: 'email.delivered',
      data: { email_id: 'unknown_msg' },
    });
    expect(result).toEqual({ ok: true, action: 'no_op_no_delivery' });
  });

  it('ignores unsupported event types', async () => {
    configureQuery({ deliveryRow: baseDeliveryRow });
    const result = await processResendWebhookEvent({
      type: 'email.opened',
      data: { email_id: 'resend_msg_1' },
    });
    expect(result).toEqual({ ok: true, action: 'no_op_no_delivery' });
  });
});

describe('webhook health probe', () => {
  it('records and returns the last-received timestamp', () => {
    __resetWebhookHealthForTest();
    expect(getLastWebhookReceivedAt()).toBeNull();
    const now = new Date('2026-05-30T12:00:00.000Z');
    recordWebhookReceived(now);
    expect(getLastWebhookReceivedAt()).toBe('2026-05-30T12:00:00.000Z');
  });
});
