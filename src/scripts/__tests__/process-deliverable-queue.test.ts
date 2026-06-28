// Worker proof: process-deliverable-queue sweeps stale runs, claims the next queued row,
// reconstructs the GenerateDeliverableServiceInput from the row's job_payload + identity
// columns, runs the governed orchestrator, and completes the run with the route's mapping.
// Bounded per invocation. All collaborators mocked — no data plane, no Claude.

jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  sweepStaleDeliverableRuns: jest.fn(async () => [] as string[]),
  claimNextDeliverableRun: jest.fn(),
  completeDeliverableRun: jest.fn(async () => undefined),
  updateDeliverableRunProgress: jest.fn(async () => undefined),
}));
jest.mock('@/lib/deliverables/orchestrator/generate-service', () => ({
  runDeliverableForTenant: jest.fn(),
}));
jest.mock('@/lib/deliverables/generate-artifact', () => ({
  generateArtifact: jest.fn(),
}));
jest.mock('@/lib/deliverables/moves-generate-deps', () => ({
  createMovesGenerateArtifactDeps: jest.fn(() => ({})),
}));
jest.mock('@/lib/deliverables/persist-move-generated-artifact', () => ({
  persistMoveGeneratedArtifact: jest.fn(),
}));
jest.mock('@/lib/programs/queries', () => ({
  getProgramById: jest.fn(),
}));
jest.mock('@/lib/deliverables/orchestrator/tenant-invariant', () => ({
  validateDeliverableTenantInvariant: jest.fn(async () => ({ ok: true, sourceKind: 'move', sourceId: 'evt-1' })),
}));

import { processDeliverableQueue } from '../process-deliverable-queue';

// Pull the hoisted mock fns back out (jest.mock factories are hoisted above declarations).
const repo = jest.requireMock('@/lib/deliverables/orchestrator/runs-repository') as {
  sweepStaleDeliverableRuns: jest.Mock;
  claimNextDeliverableRun: jest.Mock;
  completeDeliverableRun: jest.Mock;
  updateDeliverableRunProgress: jest.Mock;
};
const svc = jest.requireMock('@/lib/deliverables/orchestrator/generate-service') as {
  runDeliverableForTenant: jest.Mock;
};
const premium = jest.requireMock('@/lib/deliverables/generate-artifact') as {
  generateArtifact: jest.Mock;
};
const premiumPersist = jest.requireMock('@/lib/deliverables/persist-move-generated-artifact') as {
  persistMoveGeneratedArtifact: jest.Mock;
};
const programQueries = jest.requireMock('@/lib/programs/queries') as {
  getProgramById: jest.Mock;
};
const invariant = jest.requireMock('@/lib/deliverables/orchestrator/tenant-invariant') as {
  validateDeliverableTenantInvariant: jest.Mock;
};
const { sweepStaleDeliverableRuns, claimNextDeliverableRun, completeDeliverableRun } = repo;
const { runDeliverableForTenant } = svc;
const { generateArtifact } = premium;
const { persistMoveGeneratedArtifact } = premiumPersist;
const { getProgramById } = programQueries;
const { validateDeliverableTenantInvariant } = invariant;

const jobPayload = {
  module: 'source',
  useCaseArchetype: 'AMS_IT_OUTSOURCING',
  deliverableType: 'rfp_package',
  decisionContext: 'approve issuance',
  clientDisplayName: 'SkyHarbor Air',
  initiativeDisplayName: 'AMS resourcing',
  sourceArtifactRef: 'evt-1',
};

function claimedRow(id: string) {
  return {
    id, clientId: 'c1', tenantKey: 'skyharbor-air', userId: 'u1', module: 'source',
    archetype: 'AMS_IT_OUTSOURCING', deliverableType: 'rfp_package', status: 'running',
    artifactId: null, sectionCount: null, retrievedEvidence: null, blockers: [], warnings: [],
    error: null, progressPct: null, progressLabel: null, claimedAt: 'now', workerId: 'w', jobPayload,
    createdAt: 't0', updatedAt: 't0',
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  sweepStaleDeliverableRuns.mockResolvedValue([]);
  validateDeliverableTenantInvariant.mockResolvedValue({ ok: true, sourceKind: 'move', sourceId: 'evt-1' });
  getProgramById.mockResolvedValue({ id: 'move-1', name: 'Move One' });
  generateArtifact.mockResolvedValue({
    status: 'generated',
    html: '<html><body><svg></svg><table></table>Diagnostic</body></html>',
    context: {},
    goldenBar: { pass: true, wordCount: 2200, svgCount: 2, hasDataGap: false },
    generationMode: 'draft',
    draftOnly: true,
    draftCaveats: [],
    contextCaveats: [],
  });
  persistMoveGeneratedArtifact.mockResolvedValue({
    deliverableId: 'deliv-1',
    versionId: 'ver-1',
    artifactId: 'move-artifact-1',
    artifactVersion: 1,
    artifactBlobStored: true,
  });
});

describe('processDeliverableQueue', () => {
  it('sweeps, claims one run, reconstructs input from job_payload, and completes succeeded', async () => {
    claimNextDeliverableRun
      .mockResolvedValueOnce(claimedRow('run-1'))
      .mockResolvedValueOnce(null); // queue empty → stop
    runDeliverableForTenant.mockResolvedValue({ ok: true, artifactId: 'art-1', sectionCount: 9, retrievedEvidence: 4, warnings: [] });

    const result = await processDeliverableQueue({ workerId: 'worker-1', batchSize: 5 });

    expect(sweepStaleDeliverableRuns).toHaveBeenCalledTimes(1);
    expect(result.processed).toEqual(['run-1']);

    // Input reconstructed from the persisted payload + identity columns.
    expect(runDeliverableForTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'source',
        useCaseArchetype: 'AMS_IT_OUTSOURCING',
        deliverableType: 'rfp_package',
        decisionContext: 'approve issuance',
        sourceArtifactRef: 'evt-1',
        clientDisplayName: 'SkyHarbor Air',
        initiativeDisplayName: 'AMS resourcing',
        tenantClientKey: 'skyharbor-air',
        clientId: 'c1',
        userId: 'u1',
      }),
    );
    expect(validateDeliverableTenantInvariant).toHaveBeenCalledWith({
      module: 'source',
      sourceArtifactRef: 'evt-1',
      clientId: 'c1',
      tenantKey: 'skyharbor-air',
    });
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ status: 'succeeded', artifactId: 'art-1' }),
    );
  });

  it('maps a blocked result to status blocked', async () => {
    claimNextDeliverableRun.mockResolvedValueOnce(claimedRow('run-2')).mockResolvedValueOnce(null);
    runDeliverableForTenant.mockResolvedValue({ ok: false, blockers: ['no register'], blockedReason: 'gate blocked' });
    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-2',
      expect.objectContaining({ status: 'blocked', blockers: ['no register'] }),
    );
  });

  it('processes premium Moves artifact jobs through generateArtifact and move_artifacts persistence', async () => {
    const premiumRun = {
      ...claimedRow('run-premium-p2'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'discovery_report',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        useCaseArchetype: 'ai_opportunity_discovery',
        deliverableType: 'discovery_report',
        decisionContext: 'P2 diagnostic',
        clientDisplayName: 'Lakeshore Holdings',
        initiativeDisplayName: 'Back-office Automation',
        sourceArtifactRef: 'move-1',
        phase: 2,
        artifact: 'discovery_report',
        generationMode: 'draft',
        title: 'Current Work Diagnostic',
        useCaseQuery: 'Reduce AP exceptions',
      },
    };
    claimNextDeliverableRun.mockResolvedValueOnce(premiumRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-p2', batchSize: 5 });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(validateDeliverableTenantInvariant).not.toHaveBeenCalled();
    expect(generateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: 'move-1',
        tenantKey: 'lakeshore-holdings',
        phase: 2,
        artifact: 'discovery_report',
        generationMode: 'draft',
      }),
      expect.anything(),
    );
    expect(persistMoveGeneratedArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 2,
        artifact: 'discovery_report',
        title: 'Current Work Diagnostic',
      }),
    );
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-premium-p2',
      expect.objectContaining({
        status: 'succeeded',
        artifactId: 'move-artifact-1',
        warnings: expect.arrayContaining([
          'golden_bar_pass=true',
          'word_count=2200',
          'svg_count=2',
        ]),
      }),
    );
  });

  it('marks a run failed when the generation throws', async () => {
    claimNextDeliverableRun.mockResolvedValueOnce(claimedRow('run-3')).mockResolvedValueOnce(null);
    runDeliverableForTenant.mockRejectedValue(new Error('claude exploded'));
    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-3',
      expect.objectContaining({ status: 'failed', error: expect.stringContaining('claude exploded') }),
    );
  });

  it('fails a claimed run with a missing payload instead of running it', async () => {
    const noPayload = { ...claimedRow('run-4'), jobPayload: null };
    claimNextDeliverableRun.mockResolvedValueOnce(noPayload).mockResolvedValueOnce(null);
    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-4',
      expect.objectContaining({ status: 'failed', error: expect.stringContaining('job_payload missing') }),
    );
  });

  it('fails the run before generation when the persisted row tenant does not own the source artifact', async () => {
    claimNextDeliverableRun.mockResolvedValueOnce(claimedRow('run-tenant-drift')).mockResolvedValueOnce(null);
    validateDeliverableTenantInvariant.mockResolvedValueOnce({
      ok: false,
      code: 'tenant_mismatch',
      sourceKind: 'move',
      sourceId: 'move-fc',
      detail: 'move source tenant does not match the active generation tenant.',
      expectedClientId: 'client-lakeshore',
      expectedTenantKey: 'lakeshore-holdings',
      actualClientId: 'client-first-capital',
      actualTenantKey: 'first-capital',
    });

    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-tenant-drift',
      expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('tenant invariant failed: tenant_mismatch'),
        blockers: [expect.stringContaining('expected tenant lakeshore-holdings')],
      }),
    );
  });

  it('is bounded: processes at most batchSize runs per invocation', async () => {
    claimNextDeliverableRun.mockResolvedValue(claimedRow('run-loop')); // always returns a row
    runDeliverableForTenant.mockResolvedValue({ ok: true, artifactId: 'a', warnings: [] });
    const result = await processDeliverableQueue({ workerId: 'w', batchSize: 3 });
    expect(result.processed).toHaveLength(3);
    expect(claimNextDeliverableRun).toHaveBeenCalledTimes(3);
  });
});
