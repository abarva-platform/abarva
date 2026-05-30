/**
 * savePreferences server-action tests · W4-PR-4
 *
 * Coverage:
 *   - unauthenticated caller → `unauthenticated`.
 *   - missing tenancy → `no_active_tenant`.
 *   - unresolved tenant id → `unresolved_tenant`.
 *   - happy path → upserts every row and returns ok with savedAt + count.
 *   - mandatory event toggled to channel='none' → `mandatory_locked`.
 *   - unknown event_type in the payload → `unknown_event_type`.
 *   - rate-limit guard after burst saves.
 *   - audit row written on success (writeAudit invoked through the
 *     supabase write client).
 */

const mockAuth = jest.fn();
const mockRequireTenancy = jest.fn();
const mockResolveTenantId = jest.fn();
const mockUpsertPreference = jest.fn();
const mockLoadSubs = jest.fn();
const mockInsert = jest.fn();
const mockIsFixtureMode = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

jest.mock('@/lib/auth/tenancy', () => {
  const actual = jest.requireActual('@/lib/auth/tenancy');
  return {
    ...actual,
    requireTenancy: () => mockRequireTenancy(),
  };
});

jest.mock('@/lib/admin/broker/notifications-preferences-broker', () => ({
  resolveTenantId: (key: string) => mockResolveTenantId(key),
  upsertPreference: (args: unknown) => mockUpsertPreference(args),
  loadUserMandatorySubscriptions: (args: unknown) => mockLoadSubs(args),
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({
    from: () => ({ insert: (row: unknown) => mockInsert(row) }),
  }),
  getAzureReadFluentClient: () => ({ from: () => ({}) }),
}));

jest.mock('@/lib/admin/data/admin-data-mode', () => ({
  isFixtureMode: () => mockIsFixtureMode(),
}));

import { TenancyError } from '@/lib/auth/tenancy';
import { savePreferences } from '../save-preferences';
import { __resetSavePreferencesRateLimitForTests } from '@/lib/admin/save-preferences-rate-limit';

const VALID_INPUT = {
  rows: [
    {
      event_type: 'system.daily_digest',
      channel: 'email' as const,
      frequency: 'digest_daily' as const,
      quiet_hours_start: null,
      quiet_hours_end: null,
      timezone: 'UTC',
      daily_cap: 20,
    },
  ],
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: 'UTC',
  dailyCap: 20,
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetSavePreferencesRateLimitForTests();
  mockAuth.mockResolvedValue({ userId: 'user_admin' });
  mockRequireTenancy.mockResolvedValue({ clientKey: 'apex-retail' });
  mockResolveTenantId.mockResolvedValue('tenant-uuid-1');
  mockLoadSubs.mockResolvedValue([]);
  mockUpsertPreference.mockResolvedValue({ ok: true, row: { id: 'r1' } });
  mockInsert.mockResolvedValue({ error: null });
  mockIsFixtureMode.mockReturnValue(false);
});

describe('savePreferences', () => {
  it('rejects unauthenticated callers', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const result = await savePreferences(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unauthenticated');
  });

  it('rejects callers with no active tenancy', async () => {
    mockRequireTenancy.mockRejectedValueOnce(new TenancyError('unauthenticated'));
    const result = await savePreferences(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('no_active_tenant');
  });

  it('rejects when tenant id cannot be resolved', async () => {
    mockResolveTenantId.mockResolvedValueOnce(null);
    const result = await savePreferences(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unresolved_tenant');
  });

  it('upserts every row on the happy path', async () => {
    const input = {
      ...VALID_INPUT,
      rows: [
        ...VALID_INPUT.rows,
        {
          event_type: 'system.weekly_digest',
          channel: 'email' as const,
          frequency: 'digest_weekly' as const,
          quiet_hours_start: null,
          quiet_hours_end: null,
          timezone: 'UTC',
          daily_cap: 20,
        },
      ],
    };
    const result = await savePreferences(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.count).toBe(2);
      expect(result.savedAt).toMatch(/T\d/);
    }
    expect(mockUpsertPreference).toHaveBeenCalledTimes(2);
  });

  it('returns mandatory_locked when the broker rejects a mandatory toggle-off', async () => {
    mockLoadSubs.mockResolvedValueOnce([{ event_type: 'approval.requested' }]);
    mockUpsertPreference.mockResolvedValueOnce({
      ok: false,
      code: 'mandatory_locked',
      message: 'cannot disable',
    });
    const result = await savePreferences({
      ...VALID_INPUT,
      rows: [
        {
          event_type: 'approval.requested',
          channel: 'none',
          frequency: 'none',
          quiet_hours_start: null,
          quiet_hours_end: null,
          timezone: 'UTC',
          daily_cap: 20,
        },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('mandatory_locked');
  });

  it('returns unknown_event_type when the broker rejects an unknown event', async () => {
    mockUpsertPreference.mockResolvedValueOnce({
      ok: false,
      code: 'unknown_event_type',
      message: 'unknown',
    });
    const result = await savePreferences(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unknown_event_type');
  });

  it('writes an audit row on success', async () => {
    await savePreferences(VALID_INPUT);
    // Audit write is fire-and-forget — give the microtask queue a tick.
    await new Promise((r) => setImmediate(r));
    expect(mockInsert).toHaveBeenCalledTimes(1);
    const row = mockInsert.mock.calls[0][0];
    expect(row.client_id).toBe('tenant-uuid-1');
    expect(row.action).toBe('notification_preferences_updated');
    expect(row.category).toBe('governance');
    expect(row.metadata.row_count).toBe(1);
    expect(row.metadata.event_types).toEqual(['system.daily_digest']);
  });

  it('does not write an audit row in fixture mode', async () => {
    mockIsFixtureMode.mockReturnValue(true);
    await savePreferences(VALID_INPUT);
    await new Promise((r) => setImmediate(r));
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rate-limits an actor after 30 saves in the window', async () => {
    for (let i = 0; i < 30; i += 1) {
      const r = await savePreferences(VALID_INPUT);
      expect(r.ok).toBe(true);
    }
    const limited = await savePreferences(VALID_INPUT);
    expect(limited.ok).toBe(false);
    if (!limited.ok) expect(limited.code).toBe('rate_limited');
  });
});
