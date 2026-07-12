/** draft_artifact tool tests */

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

const getProgramByIdMock = jest.fn();
jest.mock('@/lib/programs/queries', () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const generateArtifactMock = jest.fn();
jest.mock('@/lib/deliverables/generate-artifact', () => ({
  __esModule: true,
  generateArtifact: (...args: unknown[]) => generateArtifactMock(...args),
}));

jest.mock('@/lib/deliverables/generated-phase-digest', () => ({
  __esModule: true,
  buildGeneratedPhaseDigest: jest.fn(() => 'digest-stub'),
}));

jest.mock('@/lib/deliverables/moves-generate-deps', () => ({
  __esModule: true,
  createMovesGenerateArtifactDeps: jest.fn(() => ({})),
  normalizeMovesDeliverableKey: jest.fn((key: string) => key),
}));

jest.mock('@/lib/deliverables/profiles/registry', () => ({
  __esModule: true,
  getDeliverableProfile: jest.fn(() => ({ title: 'Fallback Title' })),
}));

const draftModuleDeliverableMock = jest.fn();
jest.mock('@/lib/programs/nexus', () => ({
  __esModule: true,
  draftModuleDeliverable: (...args: unknown[]) => draftModuleDeliverableMock(...args),
}));

import { draftArtifactTool } from '../program/draftArtifact';

function baseInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    move_id: 'move-1',
    phase: 3,
    deliverable_key: 'design_spec',
    title: 'P3 Design Spec',
    prompt: 'Draft the design spec from P2 evidence.',
    ...overrides,
  };
}

beforeEach(() => {
  requireTenancyMock.mockReset();
  getProgramByIdMock.mockReset();
  generateArtifactMock.mockReset();
  draftModuleDeliverableMock.mockReset();
});

describe('draft_artifact tool', () => {
  it('rejects unsupported deliverable keys before touching tenancy or the network', async () => {
    const result = await draftArtifactTool.handler(
      baseInput({ deliverable_key: 'traceability_matrix' }),
      {} as never,
    );

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('unsupported_deliverable_key');
    expect(requireTenancyMock).not.toHaveBeenCalled();
    expect(generateArtifactMock).not.toHaveBeenCalled();
  });

  it('calls generateArtifact and draftModuleDeliverable directly — no self-referential fetch', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', clientKey: 'skyharbor-air', userId: 'user-1' });
    getProgramByIdMock.mockResolvedValue({ id: 'move-1', name: 'CANARY', archivedAt: null, deletedAt: null });
    generateArtifactMock.mockResolvedValue({
      status: 'generated',
      html: '<p>Design spec content</p>',
      context: { decisions: [] },
      goldenBar: { pass: true },
    });
    draftModuleDeliverableMock.mockResolvedValue({ deliverableId: 'deliv-1', versionId: 'version-1' });

    const globalFetchSpy = jest.spyOn(global, 'fetch');

    const result = await draftArtifactTool.handler(baseInput(), {} as never);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({ deliverable_id: 'deliv-1', version_id: 'version-1' });
    }
    expect(globalFetchSpy).not.toHaveBeenCalled();
    expect(generateArtifactMock).toHaveBeenCalledWith(
      expect.objectContaining({ moveId: 'move-1', tenantKey: 'skyharbor-air', phase: 3 }),
      expect.anything(),
    );
    expect(draftModuleDeliverableMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientKey: 'skyharbor-air' }),
      expect.objectContaining({ programId: 'move-1', draftContent: '<p>Design spec content</p>' }),
    );

    globalFetchSpy.mockRestore();
  });

  it('surfaces a blocked gate as a clear, actionable message instead of a network error', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', clientKey: 'skyharbor-air', userId: 'user-1' });
    getProgramByIdMock.mockResolvedValue({ id: 'move-1', name: 'CANARY', archivedAt: null, deletedAt: null });
    generateArtifactMock.mockResolvedValue({
      status: 'blocked_gate',
      httpStatus: 409,
      blockers: [{ code: 'gate_not_approved', phase: 3, reason: 'P2 gate not yet approved', severity: 'hard' }],
    });

    const result = await draftArtifactTool.handler(baseInput(), {} as never);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('gate_blocked');
      expect(result.error).toContain('P2 gate not yet approved');
    }
    expect(draftModuleDeliverableMock).not.toHaveBeenCalled();
  });

  it('surfaces missing context as a specific ask, not a generic failure', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', clientKey: 'skyharbor-air', userId: 'user-1' });
    getProgramByIdMock.mockResolvedValue({ id: 'move-1', name: 'CANARY', archivedAt: null, deletedAt: null });
    generateArtifactMock.mockResolvedValue({
      status: 'blocked_context',
      missing: ['baseline_metrics', 'root_cause_evidence'],
    });

    const result = await draftArtifactTool.handler(baseInput(), {} as never);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('baseline_metrics');
      expect(result.recovery).toContain('baseline_metrics');
    }
  });

  it('rejects archived or deleted Moves', async () => {
    requireTenancyMock.mockResolvedValue({ clientId: 'client-1', clientKey: 'skyharbor-air', userId: 'user-1' });
    getProgramByIdMock.mockResolvedValue({ id: 'move-1', name: 'CANARY', archivedAt: '2026-01-01', deletedAt: null });

    const result = await draftArtifactTool.handler(baseInput(), {} as never);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('archived_or_deleted');
    expect(generateArtifactMock).not.toHaveBeenCalled();
  });
});
