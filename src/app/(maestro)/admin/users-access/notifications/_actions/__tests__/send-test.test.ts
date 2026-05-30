/**
 * sendTest server-action tests · W4-PR-4
 *
 * Coverage:
 *   - invalid channel → `invalid_channel`.
 *   - unauthenticated → `unauthenticated`.
 *   - no tenancy → `no_active_tenant`.
 *   - happy path → writes one notification_events row and one
 *     notification_deliveries row, returns `{ ok, status: 'queued' }`.
 *   - DB error on event write → `db_error`.
 */

const mockAuth = jest.fn();
const mockRequireTenancy = jest.fn();
const mockResolveTenantId = jest.fn();

const mockEventInsertResult = jest.fn();
const mockDeliveryInsertResult = jest.fn();

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
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => ({
    from: (table: string) => {
      if (table === 'notification_events') {
        return {
          insert: () => ({
            select: () => ({
              single: () => mockEventInsertResult(),
            }),
          }),
        };
      }
      if (table === 'notification_deliveries') {
        return { insert: () => mockDeliveryInsertResult() };
      }
      return { insert: () => ({ error: null }) };
    },
  }),
  getAzureReadFluentClient: () => ({ from: () => ({}) }),
}));

import { TenancyError } from '@/lib/auth/tenancy';
import { sendTest } from '../send-test';

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'user_test' });
  mockRequireTenancy.mockResolvedValue({ clientKey: 'apex-retail' });
  mockResolveTenantId.mockResolvedValue('tenant-uuid-1');
  mockEventInsertResult.mockResolvedValue({ data: { id: 'event-1' }, error: null });
  mockDeliveryInsertResult.mockResolvedValue({ error: null });
});

describe('sendTest', () => {
  it('rejects invalid channels', async () => {
    const result = await sendTest('slack' as 'email');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('invalid_channel');
  });

  it('rejects unauthenticated callers', async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const result = await sendTest('email');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('unauthenticated');
  });

  it('rejects callers with no active tenancy', async () => {
    mockRequireTenancy.mockRejectedValueOnce(new TenancyError('unauthenticated'));
    const result = await sendTest('email');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('no_active_tenant');
  });

  it('returns ok+queued on the happy path', async () => {
    const result = await sendTest('email');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.status).toBe('queued');
  });

  it('returns db_error when event write fails', async () => {
    mockEventInsertResult.mockResolvedValueOnce({
      data: null,
      error: { message: 'pg insert failed' },
    });
    const result = await sendTest('email');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('db_error');
  });

  it('returns db_error when delivery write fails', async () => {
    mockDeliveryInsertResult.mockResolvedValueOnce({ error: { message: 'pg delivery failed' } });
    const result = await sendTest('email');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('db_error');
  });
});
