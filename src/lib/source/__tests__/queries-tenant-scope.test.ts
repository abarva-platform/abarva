import { getSourcingEvent, listSourcingEvents } from '../queries';

const mockSourceEventsAdapter = {
  getPendingEventsForClient: jest.fn(),
  getActiveEventsForClient: jest.fn(),
  getEventByIdForClient: jest.fn(),
  getEventByCodeForClient: jest.fn(),
};

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

jest.mock('@/lib/data-plane/read-adapters/sourceEventsReadAdapter', () => ({
  selectSourceEventsReadAdapter: jest.fn(() => mockSourceEventsAdapter),
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
const { canReadSourceEvent } = jest.requireMock('@/lib/auth/source-access-policy') as {
  canReadSourceEvent: jest.Mock;
};
const { getServerSupabase } = jest.requireMock('@/lib/supabase-server') as {
  getServerSupabase: jest.Mock;
};

function mockEmptySourceEventsTable() {
  mockSourceEventsAdapter.getPendingEventsForClient.mockResolvedValue([]);
  mockSourceEventsAdapter.getActiveEventsForClient.mockResolvedValue([]);
  mockSourceEventsAdapter.getEventByIdForClient.mockResolvedValue(null);
  mockSourceEventsAdapter.getEventByCodeForClient.mockResolvedValue(null);

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

describe('getSourcingEvent tenant scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmptySourceEventsTable();
    canReadSourceEvent.mockResolvedValue(true);
  });

  it('does not return an Apex seed event for a Meridian active client', async () => {
    getActiveClientRow.mockResolvedValue({
      id: 'client-meridian',
      name: 'Meridian Health',
      industry_code: 'HEALTHCARE_IDN',
      key: 'meridian',
    });
    requireTenancy.mockResolvedValue({
      clientId: 'client-meridian',
      clientKey: 'meridian',
      userId: 'clerk:meridian-cdio',
      role: 'client_admin',
      email: 'cdio@meridian-health.example.com',
    });

    await expect(getSourcingEvent('apex-retail-ams-outsourcing-2026')).resolves.toBeNull();
    expect(canReadSourceEvent).not.toHaveBeenCalled();
  });

  it('still returns the Apex seed event for an Apex active client when policy allows it', async () => {
    getActiveClientRow.mockResolvedValue({
      id: 'client-apex',
      name: 'Apex Retail Group',
      industry_code: 'RETAIL',
      key: 'apexretail',
    });
    requireTenancy.mockResolvedValue({
      clientId: 'client-apex',
      clientKey: 'apexretail',
      userId: 'clerk:apex-cio',
      role: 'client_admin',
      email: 'cio@apex-retail.example.com',
    });

    const event = await getSourcingEvent('apex-retail-ams-outsourcing-2026');

    expect(event?.name).toBe('AMS Outsourcing 2026');
    expect(event?.accountName).toBe('Apex Retail');
    expect(canReadSourceEvent).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: 'apexretail' }),
      'apexretail',
      'apex-retail-ams-outsourcing-2026',
    );
  });

  it('does not return seed events without an active client boundary', async () => {
    getActiveClientRow.mockResolvedValue(null);
    requireTenancy.mockRejectedValue(new Error('no client'));

    await expect(getSourcingEvent('apex-retail-ams-outsourcing-2026')).resolves.toBeNull();
  });
});
