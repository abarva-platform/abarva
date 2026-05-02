/** complete_deliverables tool tests */

const requireTenancyMock = jest.fn();
jest.mock('@/app/api/v1/programs/_auth', () => {
  class TenancyError extends Error {
    constructor(public readonly code: 'unauthenticated' | 'no_client') {
      super(code);
    }
  }
  return {
    __esModule: true,
    requireTenancy: (...args: unknown[]) => requireTenancyMock(...args),
    TenancyError,
  };
});

const completeDeliverableMock = jest.fn();
jest.mock('@/lib/programs/mutations', () => ({
  __esModule: true,
  completeDeliverable: (...args: unknown[]) => completeDeliverableMock(...args),
}));

import { completeDeliverablesTool } from '../program/completeDeliverables';

function makeCtx(surface = '/programs/test-program') {
  return {
    request: new Request('http://localhost/'),
    surface,
    accessPolicy: { canViewFinancialData: false },
  };
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  completeDeliverableMock.mockReset();
});

describe('complete_deliverables tool', () => {
  it('persists a P5 approval package in one batch', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'user-1' });
    completeDeliverableMock
      .mockResolvedValueOnce({ deliverableId: 'business-case', versionId: 'v1', status: 'signed_off' })
      .mockResolvedValueOnce({ deliverableId: 'funding', versionId: 'v2', status: 'signed_off' })
      .mockResolvedValueOnce({ deliverableId: 'alignment', versionId: 'v3', status: 'signed_off' });

    const result = await completeDeliverablesTool.handler(
      {
        program_id: 'program-1',
        deliverables: [
          { deliverable_type_key: 'business_case', title: 'Business case', content_outline: ['Value narrative', 'Risks'] },
          { deliverable_type_key: 'funding_approval', title: 'Funding approval', content_outline: ['Capacity envelope approved'] },
          { deliverable_type_key: 'sponsor_alignment', title: 'Sponsor alignment', content_outline: ['Sarah Chen aligned'] },
        ],
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    if (result.success) expect(result.data?.deliverable_count).toBe(3);
    expect(completeDeliverableMock).toHaveBeenCalledTimes(3);
    expect(completeDeliverableMock).toHaveBeenNthCalledWith(
      2,
      { clientId: 'client-1', userId: 'user-1' },
      'program-1',
      expect.objectContaining({
        deliverableTypeKey: 'funding_approval',
        signOff: true,
        content: expect.stringContaining('Capacity envelope approved'),
      }),
    );
  });

  it('rejects unsupported deliverables before writing', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'user-1' });

    const result = await completeDeliverablesTool.handler(
      {
        program_id: 'program-1',
        deliverables: [{ deliverable_type_key: 'spreadsheet_dump', title: 'Bad' }],
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('unsupported_deliverable_type:spreadsheet_dump');
    expect(completeDeliverableMock).not.toHaveBeenCalled();
  });
});
