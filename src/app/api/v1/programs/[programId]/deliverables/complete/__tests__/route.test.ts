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
    tenancyErrorResponse: (err: unknown) => {
      if (err instanceof TenancyError) {
        return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
      }
      throw err;
    },
    TenancyError,
  };
});

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock('@/lib/auth/program-access-policy', () => ({
  __esModule: true,
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

const completeDeliverableMock = jest.fn();
jest.mock('@/lib/programs/mutations', () => ({
  __esModule: true,
  completeDeliverable: (...args: unknown[]) => completeDeliverableMock(...args),
}));

import { POST } from '../route';

const PROGRAM_ID = 'program-123';
const CTX = { clientId: 'client-1', userId: 'user-1', role: 'program_member' };

function makeRequest(body: unknown): Request {
  return new Request(`http://localhost/api/v1/programs/${PROGRAM_ID}/deliverables/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makePolicy(overrides: Record<string, unknown> = {}) {
  return {
    canGenerateDeliverables: true,
    outputPolicy: {
      exactFinancialValues: false,
      financialSummaries: true,
      restrictedSourceIds: false,
      saveRestrictedContentToDeliverables: false,
    },
    ...overrides,
  };
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  loadUserProgramAccessPolicyMock.mockReset();
  completeDeliverableMock.mockReset();
  requireTenancyMock.mockResolvedValue(CTX);
  loadUserProgramAccessPolicyMock.mockResolvedValue(makePolicy());
  completeDeliverableMock.mockResolvedValue({
    deliverableId: 'deliverable-1',
    versionId: 'version-1',
    status: 'signed_off',
  });
});

describe('POST /api/v1/programs/:programId/deliverables/complete', () => {
  it('rejects users without deliverable-generation permission before writing', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue(
      makePolicy({ canGenerateDeliverables: false }),
    );

    const res = await POST(makeRequest({
      deliverableTypeKey: 'charter',
      title: 'P2 Charter',
      content: 'Draft content',
    }) as never, { params: Promise.resolve({ programId: PROGRAM_ID }) });

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({
      error: 'forbidden',
      detail: 'can_generate_deliverables permission is required.',
    });
    expect(completeDeliverableMock).not.toHaveBeenCalled();
  });

  it('sanitizes exact financial values before saving deliverable content', async () => {
    const res = await POST(makeRequest({
      deliverableTypeKey: 'business_case',
      title: 'P5 Business Case',
      content: 'Program budget is $24M and ROI is 3x based on spend.',
      rationale: 'Generated in P5.',
    }) as never, { params: Promise.resolve({ programId: PROGRAM_ID }) });

    expect(res.status).toBe(200);
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      CTX,
      PROGRAM_ID,
      expect.objectContaining({
        deliverableTypeKey: 'business_case',
        title: 'P5 Business Case',
        content: 'Program budget is [restricted financial value] and ROI is [restricted financial metric] based on spend.',
        signOff: true,
        structuredData: expect.objectContaining({
          completed_via: 'api',
          rationale: 'Generated in P5.',
        }),
      }),
    );
  });

  it('preserves exact financial values for finance-authorized users', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue(
      makePolicy({
        outputPolicy: {
          exactFinancialValues: true,
          financialSummaries: true,
          restrictedSourceIds: true,
          saveRestrictedContentToDeliverables: true,
        },
      }),
    );

    const content = 'Program budget is $24M and ROI is 3x based on spend.';
    const res = await POST(makeRequest({
      deliverableTypeKey: 'business_case',
      title: 'P5 Business Case',
      content,
    }) as never, { params: Promise.resolve({ programId: PROGRAM_ID }) });

    expect(res.status).toBe(200);
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      CTX,
      PROGRAM_ID,
      expect.objectContaining({ content }),
    );
  });
});
