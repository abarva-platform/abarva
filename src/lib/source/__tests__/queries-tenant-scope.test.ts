import { listSourcingEvents } from '../queries';

jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
}));

jest.mock('@/lib/auth/source-access-policy', () => ({
  allowedSourceEventIdsForUser: jest.fn(),
  canReadSourceEvent: jest.fn(),
}));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: jest.fn(),
}));

const { getActiveClientRow } = jest.requireMock('@/lib/active-client') as {
  getActiveClientRow: jest.Mock;
};
const { requireTenancy } = jest.requireMock('@/lib/auth/tenancy') as {
  requireTenancy: jest.Mock;
};
const { getServerSupabase } = jest.requireMock('@/lib/supabase-server') as {
  getServerSupabase: jest.Mock;
};

function mockEmptySourceEventsTable() {
  const order = jest.fn().mockResolvedValue({ data: [], error: null });
  const neq = jest.fn(() => ({ order }));
  const eq = jest.fn(() => ({ neq }));
  const select = jest.fn(() => ({ eq }));
  getServerSupabase.mockReturnValue({ from: jest.fn(() => ({ select })) });
}

describe('listSourcingEvents tenant scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireTenancy.mockRejectedValue(new Error('no request tenancy in unit test'));
    mockEmptySourceEventsTable();
  });

  it('only returns Apex seed events for an Apex active client', async () => {
    getActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      name: 'Apex Retail Group',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });

    const events = await listSourcingEvents();

    expect(events).toHaveLength(1);
    expect(events.every((event) => event.accountName.includes('Apex'))).toBe(true);
    expect(events.map((event) => event.accountName)).not.toContain('Northstar Holdings');
  });

  it('returns no shared seed events for a First Capital active client until First Capital seeds exist', async () => {
    getActiveClientRow.mockResolvedValue({
      id: 'client-first-capital',
      name: 'First Capital',
      industry_code: 'FINSERV',
      key: 'arcturus',
    });

    const events = await listSourcingEvents();

    expect(events).toEqual([]);
  });

  it('uses the same tenant-scoped seed fallback if the persisted overlay query fails', async () => {
    const order = jest.fn().mockResolvedValue({ data: null, error: { message: 'relation does not exist' } });
    const neq = jest.fn(() => ({ order }));
    const eq = jest.fn(() => ({ neq }));
    const select = jest.fn(() => ({ eq }));
    getServerSupabase.mockReturnValue({ from: jest.fn(() => ({ select })) });
    getActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      name: 'Apex Retail Group',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });

    const events = await listSourcingEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.accountName).toBe('Apex Retail');
  });
});
