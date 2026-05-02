/** complete_deliverable tool tests */

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

import { completeDeliverableTool } from '../program/completeDeliverable';

function makeCtx(surface = '/programs/test-program') {
  return {
    request: new Request('http://localhost/'),
    surface,
  };
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  completeDeliverableMock.mockReset();
});

describe('complete_deliverable tool', () => {
  it('rejects unsupported deliverable types before writing', async () => {
    const result = await completeDeliverableTool.handler(
      {
        program_id: 'program-1',
        deliverable_type_key: 'random_slide',
        title: 'Random slide',
      },
      makeCtx(),
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('unsupported_deliverable_type');
    expect(requireTenancyMock).not.toHaveBeenCalled();
    expect(completeDeliverableMock).not.toHaveBeenCalled();
  });

  it('persists and signs off an accepted deliverable by default', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'user-1' });
    completeDeliverableMock.mockResolvedValue({
      deliverableId: 'deliv-1',
      versionId: 'version-1',
      status: 'signed_off',
    });

    const result = await completeDeliverableTool.handler(
      {
        program_id: 'program-1',
        deliverable_type_key: 'charter',
        title: 'P2 Charter',
        content: 'Accepted charter content',
        rationale: 'Sponsor approved in crawl',
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      { clientId: 'client-1', userId: 'user-1' },
      'program-1',
      expect.objectContaining({
        deliverableTypeKey: 'charter',
        title: 'P2 Charter',
        content: 'Accepted charter content',
        signOff: true,
      }),
    );
    if (result.success) {
      expect(result.data).toMatchObject({
        deliverable_id: 'deliv-1',
        version_id: 'version-1',
        status: 'signed_off',
      });
    }
  });

  it('can save a draft without sign-off when explicitly requested', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'user-1' });
    completeDeliverableMock.mockResolvedValue({
      deliverableId: 'deliv-2',
      versionId: 'version-2',
      status: 'draft',
    });

    const result = await completeDeliverableTool.handler(
      {
        program_id: 'program-1',
        deliverable_type_key: 'design_spec',
        title: 'Design draft',
        sign_off: false,
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      expect.anything(),
      'program-1',
      expect.objectContaining({ signOff: false }),
    );
  });

  it('allows P1 discovery artifacts that Nexus asks to save during live crawl', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', userId: 'user-1' });
    completeDeliverableMock.mockResolvedValue({
      deliverableId: 'deliv-3',
      versionId: 'version-3',
      status: 'draft',
    });

    const result = await completeDeliverableTool.handler(
      {
        program_id: 'program-1',
        deliverable_type_key: 'stakeholder_map',
        title: 'P1 Stakeholder Map',
        content: 'Draft stakeholder map content',
        sign_off: false,
      },
      makeCtx(),
    );

    expect(result.success).toBe(true);
    expect(completeDeliverableMock).toHaveBeenCalledWith(
      expect.anything(),
      'program-1',
      expect.objectContaining({
        deliverableTypeKey: 'stakeholder_map',
        signOff: false,
      }),
    );
  });
});
