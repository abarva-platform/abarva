/**
 * W5-PR-1 · Notification inbox broker tests
 */

jest.mock('@/lib/data-plane/azureRead', () => ({
  azureRead: {
    query: jest.fn(),
  },
}));

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: jest.fn(),
}));

import {
  countUnreadInboxNotifications,
  listInboxNotifications,
  markInboxNotificationsRead,
} from '../notification-inbox-broker';
import { azureRead } from '@/lib/data-plane/azureRead';
import { getAzureWriteFluentClient } from '@/lib/data-plane/postgresCompat';

const queryMock = azureRead.query as unknown as jest.Mock;
const writeFactoryMock = getAzureWriteFluentClient as unknown as jest.Mock;

function inboxRow(overrides: Record<string, unknown> = {}) {
  return {
    delivery_id: 'delivery-1',
    event_id: 'event-1',
    event_type: 'approval.requested',
    source_module: 'moves',
    severity: 'critical',
    category: 'governance',
    payload: {
      title: 'Approval requested',
      body: 'Phase gate needs review.',
      href: '/admin/programs/approvals',
    },
    user_id: 'user_1',
    tenant_id: 'tenant_1',
    channel: 'in_app',
    status: 'sent',
    created_at: '2026-05-30T12:00:00Z',
    sent_at: '2026-05-30T12:01:00Z',
    read_at: null,
    archived_at: null,
    ...overrides,
  };
}

function fakeWriteClient() {
  const state = {
    table: '',
    patch: {} as Record<string, unknown>,
    eqs: [] as Array<{ col: string; value: unknown }>,
    nulls: [] as string[],
    inFilter: null as { col: string; values: string[] } | null,
  };
  const chain = {
    update(patch: Record<string, unknown>) {
      state.patch = patch;
      return chain;
    },
    eq(col: string, value: unknown) {
      state.eqs.push({ col, value });
      return chain;
    },
    is(col: string, value: unknown) {
      if (value === null) state.nulls.push(col);
      return chain;
    },
    in(col: string, values: string[]) {
      state.inFilter = { col, values };
      return chain;
    },
    select(cols: string) {
      void cols;
      return Promise.resolve({ data: [{ id: 'delivery-1' }, { id: 'delivery-2' }], error: null });
    },
  };
  return {
    state,
    from(table: string) {
      state.table = table;
      return chain;
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('listInboxNotifications', () => {
  it('maps joined delivery/event rows into inbox items and counts unread rows', async () => {
    queryMock
      .mockResolvedValueOnce([inboxRow()])
      .mockResolvedValueOnce([{ count: '3' }]);

    const result = await listInboxNotifications({
      tenantId: 'tenant_1',
      userId: 'user_1',
    });

    expect(result.unreadCount).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'delivery-1',
      eventType: 'approval.requested',
      title: 'Approval requested',
      body: 'Phase gate needs review.',
      href: '/admin/programs/approvals',
      readAt: null,
    });
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['tenant_1', 'user_1', 50]);
  });

  it('falls back to module routes when payload has no href', async () => {
    queryMock
      .mockResolvedValueOnce([inboxRow({ source_module: 'source', payload: {} })])
      .mockResolvedValueOnce([{ count: '0' }]);

    const result = await listInboxNotifications({
      tenantId: 'tenant_1',
      userId: 'user_1',
    });

    expect(result.items[0]?.href).toBe('/source');
    expect(result.items[0]?.title).toBe('approval.requested');
  });
});

describe('countUnreadInboxNotifications', () => {
  it('returns zero when the table is missing or empty', async () => {
    queryMock.mockResolvedValueOnce([]);
    await expect(
      countUnreadInboxNotifications({ tenantId: 'tenant_1', userId: 'user_1' }),
    ).resolves.toBe(0);
  });
});

describe('markInboxNotificationsRead', () => {
  it('marks active in-app rows read for the scoped user and tenant', async () => {
    const fake = fakeWriteClient();
    writeFactoryMock.mockReturnValue(fake);

    const result = await markInboxNotificationsRead({
      tenantId: 'tenant_1',
      userId: 'user_1',
      deliveryIds: ['delivery-1', 'delivery-2'],
      readAt: new Date('2026-05-30T13:00:00Z'),
    });

    expect(result.updated).toBe(2);
    expect(fake.state.table).toBe('notification_deliveries');
    expect(fake.state.patch).toEqual({ read_at: '2026-05-30T13:00:00.000Z' });
    expect(fake.state.eqs).toEqual(
      expect.arrayContaining([
        { col: 'tenant_id', value: 'tenant_1' },
        { col: 'user_id', value: 'user_1' },
        { col: 'channel', value: 'in_app' },
      ]),
    );
    expect(fake.state.nulls).toEqual(expect.arrayContaining(['read_at', 'archived_at']));
    expect(fake.state.inFilter).toEqual({ col: 'id', values: ['delivery-1', 'delivery-2'] });
  });
});
