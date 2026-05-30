/**
 * W4-PR-2 · Notification seed-defaults tests
 *
 * Verifies:
 *   • seedDefaultPreferencesForAdmin inserts a row for each of the 5
 *     DEFAULT_ADMIN_MANDATORY_EVENT_TYPES with the correct channel/freq.
 *   • seedMandatorySecuritySubscriptionsForAdmin inserts 5 subscription rows.
 *   • Tenant resolution failure throws.
 *   • Idempotent — re-runs do not double-insert.
 *   • PII redaction: addedByAdminId required + non-blank.
 */

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

jest.mock('@/lib/admin/data/admin-db-helpers', () => ({
  resolveClientId: jest.fn(),
  requireClientId: jest.fn(),
}));

import {
  seedDefaultPreferencesForAdmin,
  seedMandatorySecuritySubscriptionsForAdmin,
  MANDATORY_SECURITY_SUBSCRIPTIONS,
} from '../notification-seed-defaults';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';
import { resolveClientId } from '@/lib/admin/data/admin-db-helpers';
import { DEFAULT_ADMIN_MANDATORY_EVENT_TYPES } from '@/lib/admin/broker/notifications-types';

const writeFactoryMock = getAzureWriteFluentClient as unknown as jest.MockedFunction<
  typeof getAzureWriteFluentClient
>;
const resolveClientIdMock = resolveClientId as unknown as jest.MockedFunction<typeof resolveClientId>;

interface Upsert {
  table: string;
  row: Record<string, unknown>;
  onConflict?: string;
}

function fakeWriteClient(opts: { existingRows?: number } = {}) {
  const upserts: Upsert[] = [];
  return {
    upserts,
    from(table: string) {
      return {
        upsert(
          row: Record<string, unknown>,
          options: { onConflict?: string; ignoreDuplicates?: boolean } = {},
        ) {
          upserts.push({ table, row, onConflict: options.onConflict });
          return {
            select(cols: string) {
              void cols;
              // Each successful upsert returns an array of inserted rows.
              // existingRows=0 means new row; > 0 means simulated dupe → empty array.
              if ((opts.existingRows ?? 0) > 0) {
                opts.existingRows = (opts.existingRows ?? 0) - 1;
                return Promise.resolve({ data: [], error: null });
              }
              return Promise.resolve({ data: [{ id: `row-${upserts.length}` }], error: null });
            },
          };
        },
      };
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  resolveClientIdMock.mockResolvedValue('tenant-uuid-1');
});

describe('seedDefaultPreferencesForAdmin', () => {
  it('upserts one row per DEFAULT_ADMIN_MANDATORY_EVENT_TYPE', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    const result = await seedDefaultPreferencesForAdmin('apexretail', 'user_1');
    expect(result.tenantId).toBe('tenant-uuid-1');
    expect(result.inserted).toBe(DEFAULT_ADMIN_MANDATORY_EVENT_TYPES.length);
    const prefRows = client.upserts.filter((u) => u.table === 'notification_preferences');
    expect(prefRows).toHaveLength(DEFAULT_ADMIN_MANDATORY_EVENT_TYPES.length);
    for (const u of prefRows) {
      expect(u.row.channel).toBe('email');
      expect(u.row.frequency).toBe('immediate');
      expect(u.row.mandatory).toBe(false);
      expect(u.onConflict).toBe('tenant_id,user_id,event_type');
    }
  });

  it('throws when tenant cannot be resolved', async () => {
    resolveClientIdMock.mockResolvedValueOnce(null);
    await expect(seedDefaultPreferencesForAdmin('bogus', 'u1')).rejects.toThrow(
      /could not resolve tenant/,
    );
  });

  it('throws when userId is blank', async () => {
    await expect(seedDefaultPreferencesForAdmin('apexretail', '')).rejects.toThrow(/userId/);
  });

  it('is idempotent across re-runs (skipped count grows)', async () => {
    const client = fakeWriteClient({
      existingRows: DEFAULT_ADMIN_MANDATORY_EVENT_TYPES.length,
    });
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    const result = await seedDefaultPreferencesForAdmin('apexretail', 'user_1');
    expect(result.skipped).toBe(DEFAULT_ADMIN_MANDATORY_EVENT_TYPES.length);
    expect(result.inserted).toBe(0);
  });
});

describe('seedMandatorySecuritySubscriptionsForAdmin', () => {
  it('upserts a row per mandatory security event_type', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    const result = await seedMandatorySecuritySubscriptionsForAdmin(
      'apexretail',
      'user_1',
      'admin_1',
      'pilot onboarding',
    );
    expect(result.tenantId).toBe('tenant-uuid-1');
    expect(result.inserted).toBe(MANDATORY_SECURITY_SUBSCRIPTIONS.size);
    const subs = client.upserts.filter((u) => u.table === 'notification_subscriptions');
    expect(subs).toHaveLength(MANDATORY_SECURITY_SUBSCRIPTIONS.size);
    for (const u of subs) {
      expect(u.row.added_by_admin_id).toBe('admin_1');
      expect(u.row.reason).toBe('pilot onboarding');
      expect(u.onConflict).toBe('tenant_id,user_id,event_type');
      expect(MANDATORY_SECURITY_SUBSCRIPTIONS.has(String(u.row.event_type))).toBe(true);
    }
  });

  it('requires addedByAdminId for audit attribution', async () => {
    await expect(
      seedMandatorySecuritySubscriptionsForAdmin('apexretail', 'user_1', ''),
    ).rejects.toThrow(/addedByAdminId/);
  });

  it('uses a default reason when none supplied', async () => {
    const client = fakeWriteClient();
    writeFactoryMock.mockReturnValue(client as unknown as ReturnType<typeof getAzureWriteFluentClient>);
    await seedMandatorySecuritySubscriptionsForAdmin('apexretail', 'user_1', 'admin_1');
    const subs = client.upserts.filter((u) => u.table === 'notification_subscriptions');
    expect(subs[0].row.reason).toMatch(/founder doctrine #4/);
  });
});
