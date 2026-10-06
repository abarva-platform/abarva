// Worker proof: process-deliverable-queue sweeps stale runs, claims the next queued row,
// reconstructs the GenerateDeliverableServiceInput from the row's job_payload + identity
// columns, runs the governed orchestrator, and completes the run with the route's mapping.
// Bounded per invocation. All collaborators mocked — no data plane, no Claude.

jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  sweepStaleDeliverableRuns: jest.fn(async () => [] as string[]),
  claimNextDeliverableRun: jest.fn(),
  completeDeliverableRun: jest.fn(async () => undefined),
  updateDeliverableRunProgress: jest.fn(async () => undefined),
  blockRunsWithFailedDependencies: jest.fn(async () => [] as string[]),
  getDeliverableRun: jest.fn(),
}));
jest.mock('@/lib/artifacts/repository', () => ({
  getGeneratedArtifactById: jest.fn(),
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
jest.mock('@/lib/programs/approved-solution-approach', () => ({
  loadApprovedSolutionApproach: jest.fn(),
}));
jest.mock('@/lib/programs/move-context-extract-freshness', () => ({
  loadCurrentMoveContextExtractFreshness: jest.fn(),
}));
jest.mock('@/lib/programs/approved-move-evidence-snapshot', () => ({
  ...jest.requireActual('@/lib/programs/approved-move-evidence-snapshot'),
  loadApprovedMoveEvidenceSnapshot: jest.fn(),
}));
jest.mock('@/lib/deliverables/orchestrator/tenant-invariant', () => ({
  validateDeliverableTenantInvariant: jest.fn(async () => ({
    ok: true,
    sourceKind: 'move',
    sourceId: 'evt-1',
  })),
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
const approvedApproach = jest.requireMock('@/lib/programs/approved-solution-approach') as {
  loadApprovedSolutionApproach: jest.Mock;
};
const contextExtract = jest.requireMock('@/lib/programs/move-context-extract-freshness') as {
  loadCurrentMoveContextExtractFreshness: jest.Mock;
};
const approvedEvidence = jest.requireMock('@/lib/programs/approved-move-evidence-snapshot') as {
  loadApprovedMoveEvidenceSnapshot: jest.Mock;
};
const { sweepStaleDeliverableRuns, claimNextDeliverableRun, completeDeliverableRun } = repo;
const { runDeliverableForTenant } = svc;
const { generateArtifact } = premium;
const { persistMoveGeneratedArtifact } = premiumPersist;
const { getProgramById } = programQueries;
const { validateDeliverableTenantInvariant } = invariant;

const governedContext = {
  moveId: 'move-1',
  tenantKey: 'lakeshore-holdings',
  baselineMetrics: {
    'Manual touch hours per month': '2,345',
  },
  metricsThatMatter: [
    { label: 'Monthly exceptions', value: '1,872' },
  ],
  evidenceTaxonomy: [
    { category: 'Payment hold / control review', riskLevel: 'High' },
  ],
  evidenceMap: [
    {
      claim: 'Control risk is concentrated in payment-release handoffs.',
      source: 'P2 diagnostic',
    },
  ],
  evidencePackets: [
    {
      evidenceId: 'evid-1',
      title: 'P2 workshop evidence pack',
      evidenceType: 'workshop',
      phase: 2,
      summary: 'Workshop confirmed queue review and policy handoffs.',
      observations: [],
      assumptions: [],
      openQuestions: [],
      citations: [],
      approvedAt: '2026-09-27T00:00:00.000Z',
    },
  ],
  decisions: [],
  humanApprovalNotes: [],
};

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
    id,
    clientId: 'c1',
    tenantKey: 'skyharbor-air',
    userId: 'u1',
    module: 'source',
    archetype: 'AMS_IT_OUTSOURCING',
    deliverableType: 'rfp_package',
    status: 'running',
    artifactId: null,
    sectionCount: null,
    retrievedEvidence: null,
    blockers: [],
    warnings: [],
    error: null,
    progressPct: null,
    progressLabel: null,
    claimedAt: 'now',
    workerId: 'w',
    jobPayload,
    createdAt: '2026-09-29T17:00:00.000Z',
    updatedAt: '2026-09-29T17:00:00.000Z',
    batchId: null,
    sequenceNo: null,
    dependsOnRunId: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  sweepStaleDeliverableRuns.mockResolvedValue([]);
  validateDeliverableTenantInvariant.mockResolvedValue({
    ok: true,
    sourceKind: 'move',
    sourceId: 'evt-1',
  });
  getProgramById.mockResolvedValue({ id: 'move-1', name: 'Move One' });
  approvedApproach.loadApprovedSolutionApproach.mockResolvedValue({
    decisionHash: 'decision-hash-1',
  });
  contextExtract.loadCurrentMoveContextExtractFreshness.mockResolvedValue({
    evidenceFingerprint: 'context-hash-1',
  });
  approvedEvidence.loadApprovedMoveEvidenceSnapshot.mockResolvedValue({
    revision: 'revision-current',
    approvedEvidenceCount: 0,
    rows: [],
    revisionByPhase: {
      1: 'revision-current',
      2: 'revision-current',
      3: 'revision-current',
      4: 'revision-current',
      5: 'revision-current',
    },
    latestEvidenceActivityAt: null,
    latestEvidenceActivityAtByPhase: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
    },
  });
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
  it('blocks a queued phase build when same-phase review activity lands after enqueue', async () => {
    const queuedRun = {
      ...claimedRow('run-stale-phase-evidence'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'discovery_report',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        deliverableType: 'discovery_report',
        sourceArtifactRef: 'move-1',
        phase: 2,
        artifact: 'discovery_report',
        evidenceSnapshotHash: 'revision-current',
        phaseEvidenceSnapshotHash: 'p2-revision-current',
      },
    };
    claimNextDeliverableRun
      .mockResolvedValueOnce(queuedRun)
      .mockResolvedValueOnce(null);
    approvedEvidence.loadApprovedMoveEvidenceSnapshot.mockResolvedValue({
      revision: 'revision-current',
      approvedEvidenceCount: 1,
      rows: [],
      revisionByPhase: { 2: 'p2-revision-current' },
      latestEvidenceActivityAt: '2026-09-29T18:00:00.000Z',
      latestEvidenceActivityAtByPhase: {
        2: '2026-09-29T18:00:00.000Z',
      },
    });

    await processDeliverableQueue({ workerId: 'worker-stale-p2', batchSize: 5 });

    expect(generateArtifact).not.toHaveBeenCalled();
    expect(persistMoveGeneratedArtifact).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-stale-phase-evidence',
      expect.objectContaining({
        status: 'blocked',
        error: 'stale_approved_evidence_snapshot',
      }),
    );
  });

  // C-576. The premium guard reads `!evidenceBasisIsCurrent || !evidenceSnapshot`,
  // and until this case every one of the suite's fixtures handed the loader a
  // truthy snapshot — including the stale case above, which falsifies only the
  // first operand. So the refusal of a run whose approved evidence is ABSENT
  // rather than merely stale was reachable and asserted by nothing: the branch
  // ran in production and no case named it.
  //
  // It is NOT the second operand that this pins, and that distinction is the
  // whole point. `isApprovedMoveEvidenceBasisCurrent` returns false on a null
  // snapshot (approved-move-evidence-snapshot.ts:256), so a null snapshot always
  // falsifies the FIRST operand too and `|| !evidenceSnapshot` can never be the
  // deciding one. Deleting it leaves this case and all 14 others green; what it
  // actually breaks is the narrowing that lines 223 and 225 of the worker need,
  // which `tsc` catches as TS18047 + TS2345 and a required check already runs.
  // A case claiming to pin that operand would be vacuous, so none is written.
  //
  // The mutation that kills THIS case is the null guard in the predicate:
  // delete `!snapshot ||` from line 256 and the premium path completes `failed`
  // instead of `blocked`, because the predicate then reads `revisionByPhase`
  // off null and throws into the worker's catch.
  it('blocks a queued phase build when the approved evidence snapshot is absent entirely', async () => {
    const queuedRun = {
      ...claimedRow('run-absent-phase-evidence'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'discovery_report',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        deliverableType: 'discovery_report',
        sourceArtifactRef: 'move-1',
        phase: 2,
        artifact: 'discovery_report',
        evidenceSnapshotHash: 'revision-current',
        phaseEvidenceSnapshotHash: 'p2-revision-current',
      },
    };
    claimNextDeliverableRun
      .mockResolvedValueOnce(queuedRun)
      .mockResolvedValueOnce(null);
    approvedEvidence.loadApprovedMoveEvidenceSnapshot.mockResolvedValue(null);

    await processDeliverableQueue({ workerId: 'worker-absent-p2', batchSize: 5 });

    expect(generateArtifact).not.toHaveBeenCalled();
    expect(persistMoveGeneratedArtifact).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-absent-phase-evidence',
      expect.objectContaining({
        status: 'blocked',
        error: 'stale_approved_evidence_snapshot',
      }),
    );
  });

  it('sweeps, claims one run, reconstructs input from job_payload, and completes succeeded', async () => {
    claimNextDeliverableRun.mockResolvedValueOnce(claimedRow('run-1')).mockResolvedValueOnce(null); // queue empty → stop
    runDeliverableForTenant.mockResolvedValue({
      ok: true,
      artifactId: 'art-1',
      sectionCount: 9,
      retrievedEvidence: 4,
      warnings: [],
    });

    const result = await processDeliverableQueue({
      workerId: 'worker-1',
      batchSize: 5,
    });

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
    expect(completeDeliverableRun).toHaveBeenCalledWith('run-1', expect.objectContaining({ status: 'succeeded', artifactId: 'art-1' }));
  });

  it('preserves a queued Moves registry key when it differs from the orchestrator deliverable type', async () => {
    const movesRun = {
      ...claimedRow('run-root-cause'),
      module: 'moves',
      deliverableType: 'discovery_report',
      jobPayload: {
        module: 'moves',
        useCaseArchetype: 'commercial_lending_agent_assist',
        deliverableTypeKey: 'root_cause_worksheet',
        deliverableType: 'discovery_report',
        decisionContext: 'Root-cause diagnostic',
        clientDisplayName: 'First Capital',
        initiativeDisplayName: 'Commercial Lending Agent Assist',
        sourceArtifactRef: 'move-1',
        evidenceSnapshotHash: 'revision-current',
      },
    };
    claimNextDeliverableRun.mockResolvedValueOnce(movesRun).mockResolvedValueOnce(null);
    runDeliverableForTenant.mockResolvedValue({
      ok: true,
      artifactId: 'art-root-cause',
      sectionCount: 7,
      retrievedEvidence: 5,
      warnings: [],
    });

    await processDeliverableQueue({
      workerId: 'worker-root-cause',
      batchSize: 5,
    });

    expect(runDeliverableForTenant).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'moves',
        deliverableType: 'discovery_report',
        deliverableTypeKey: 'root_cause_worksheet',
        phase: 2,
        sourceArtifactRef: 'move-1',
        tenantClientKey: 'skyharbor-air',
      }),
    );
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-root-cause',
      expect.objectContaining({
        status: 'succeeded',
        artifactId: 'art-root-cause',
      }),
    );
  });

  it('blocks legacy Moves jobs when the canonical deliverable phase is unresolved', async () => {
    const unresolvedRun = {
      ...claimedRow('run-unresolved-moves-phase'),
      module: 'moves',
      jobPayload: {
        ...jobPayload,
        module: 'moves',
        sourceArtifactRef: 'move-1',
        evidenceSnapshotHash: 'revision-current',
      },
    };
    claimNextDeliverableRun.mockResolvedValueOnce(unresolvedRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({
      workerId: 'worker-unresolved-phase',
      batchSize: 2,
    });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-unresolved-moves-phase',
      expect.objectContaining({
        status: 'blocked',
        error: 'moves_deliverable_phase_unresolved',
      }),
    );
  });

  it('blocks a queued P3 artifact before Claude when the approved decision changed', async () => {
    const staleRun = {
      ...claimedRow('run-stale-decision'),
      module: 'moves',
      jobPayload: {
        ...jobPayload,
        module: 'moves',
        sourceArtifactRef: 'move-1',
        evidenceSnapshotHash: 'revision-current',
        decisionLineage: {
          decisionHash: 'queued-hash',
          decisionVersion: '1',
          approvedOptionId: 'option-b',
          approvedOptionVersion: '1',
          contextSnapshotHash: 'context-hash-1',
          architectureModelVersion: 'moves-architecture-model-v2',
        },
      },
    };
    approvedApproach.loadApprovedSolutionApproach.mockResolvedValueOnce({
      decisionHash: 'newer-hash',
    });
    claimNextDeliverableRun.mockResolvedValueOnce(staleRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-stale', batchSize: 2 });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-stale-decision',
      expect.objectContaining({
        status: 'blocked',
        error: 'stale_decision_basis',
      }),
    );
  });

  it('maps a blocked result to status blocked', async () => {
    claimNextDeliverableRun.mockResolvedValueOnce(claimedRow('run-2')).mockResolvedValueOnce(null);
    runDeliverableForTenant.mockResolvedValue({
      ok: false,
      blockers: ['no register'],
      blockedReason: 'gate blocked',
    });
    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });
    expect(completeDeliverableRun).toHaveBeenCalledWith('run-2', expect.objectContaining({ status: 'blocked', blockers: ['no register'] }));
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
        evidenceSnapshotHash: 'revision-current',
      },
    };
    claimNextDeliverableRun.mockResolvedValueOnce(premiumRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-p2', batchSize: 5 });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(validateDeliverableTenantInvariant).not.toHaveBeenCalled();
    expect(getProgramById).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-lake',
        clientKey: 'lakeshore-holdings',
        userId: 'u1',
        tenantRole: 'tenant_admin',
        role: 'client_admin',
      }),
      'move-1',
    );
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
        phaseEvidenceSnapshotHash: 'revision-current',
      }),
    );
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-premium-p2',
      expect.objectContaining({
        status: 'succeeded',
        artifactId: 'move-artifact-1',
        warnings: expect.arrayContaining(['golden_bar_pass=true', 'word_count=2200', 'svg_count=2']),
      }),
    );
  });

  it('processes premium P3 Future-State Blueprint draft jobs through the same private operator path', async () => {
    const premiumRun = {
      ...claimedRow('run-premium-p3'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'target_state_architecture',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        useCaseArchetype: 'ai_opportunity_discovery',
        deliverableType: 'target_state_architecture',
        decisionContext: 'P3 future-state blueprint',
        clientDisplayName: 'Lakeshore Holdings',
        initiativeDisplayName: 'Back-office Automation',
        sourceArtifactRef: 'move-1',
        phase: 3,
        artifact: 'target_state_architecture',
        generationMode: 'draft',
        title: 'P3 Future-State Blueprint Draft',
        useCaseQuery: 'Reduce AP exceptions',
        evidenceSnapshotHash: 'revision-current',
      },
    };
    claimNextDeliverableRun.mockResolvedValueOnce(premiumRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-p3', batchSize: 5 });

    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(generateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        moveId: 'move-1',
        tenantKey: 'lakeshore-holdings',
        phase: 3,
        artifact: 'target_state_architecture',
        generationMode: 'draft',
      }),
      expect.anything(),
    );
    expect(persistMoveGeneratedArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 3,
        artifact: 'target_state_architecture',
        title: 'P3 Future-State Blueprint Draft',
        phaseEvidenceSnapshotHash: 'revision-current',
      }),
    );
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-premium-p3',
      expect.objectContaining({
        status: 'succeeded',
        artifactId: 'move-artifact-1',
      }),
    );
  });

  it('records governed context evidence for a succeeded premium run instead of the SVG count', async () => {
    const premiumRun = {
      ...claimedRow('run-premium-count'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'target_state_architecture',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        useCaseArchetype: 'ai_opportunity_discovery',
        deliverableType: 'target_state_architecture',
        decisionContext: 'P3 future-state blueprint',
        clientDisplayName: 'Lakeshore Holdings',
        initiativeDisplayName: 'Back-office Automation',
        sourceArtifactRef: 'move-1',
        phase: 3,
        phaseEvidenceSnapshotHash: 'revision-current',
        artifact: 'target_state_architecture',
        generationMode: 'draft',
        title: 'P3 Future-State Blueprint Draft',
        useCaseQuery: 'Reduce AP exceptions',
      },
    };
    generateArtifact.mockResolvedValueOnce({
      status: 'generated',
      html: '<html><body><svg></svg></body></html>',
      context: governedContext,
      goldenBar: { pass: true, wordCount: 2600, svgCount: 11, hasDataGap: false },
      generationMode: 'draft',
      draftOnly: true,
      draftCaveats: [],
      contextCaveats: [],
    });
    claimNextDeliverableRun.mockResolvedValueOnce(premiumRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-p3-count', batchSize: 5 });

    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-premium-count',
      expect.objectContaining({
        status: 'succeeded',
        retrievedEvidence: 5,
        warnings: expect.arrayContaining([
          'svg_count=11',
          'governed_context_evidence=5',
        ]),
      }),
    );
  });

  it('records governed context evidence when a premium run is quality-blocked', async () => {
    const premiumRun = {
      ...claimedRow('run-premium-blocked-count'),
      clientId: 'client-lake',
      tenantKey: 'lakeshore-holdings',
      module: 'moves',
      deliverableType: 'solution_design',
      jobPayload: {
        kind: 'moves_premium_artifact',
        module: 'moves',
        useCaseArchetype: 'ai_opportunity_discovery',
        deliverableType: 'solution_design',
        decisionContext: 'P3 solution design',
        clientDisplayName: 'Lakeshore Holdings',
        initiativeDisplayName: 'Back-office Automation',
        sourceArtifactRef: 'move-1',
        phase: 3,
        phaseEvidenceSnapshotHash: 'revision-current',
        artifact: 'solution_design',
        generationMode: 'draft',
        title: 'P3 Solution Design Draft',
        useCaseQuery: 'Reduce AP exceptions',
      },
    };
    generateArtifact.mockResolvedValueOnce({
      status: 'blocked_quality',
      html: '<html><body><svg></svg></body></html>',
      context: governedContext,
      goldenBar: {
        pass: false,
        wordCount: 2600,
        svgCount: 11,
        hasDataGap: false,
        reasons: ['missing required exhibits: decision traceability table'],
      },
    });
    claimNextDeliverableRun.mockResolvedValueOnce(premiumRun).mockResolvedValueOnce(null);

    await processDeliverableQueue({ workerId: 'worker-p3-blocked', batchSize: 5 });

    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-premium-blocked-count',
      expect.objectContaining({
        status: 'blocked',
        retrievedEvidence: 5,
        blockers: ['missing required exhibits: decision traceability table'],
        warnings: expect.arrayContaining([
          'svg_count=11',
          'governed_context_evidence=5',
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
      expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('claude exploded'),
      }),
    );
  });

  it('fails a claimed run with a missing payload instead of running it', async () => {
    const noPayload = { ...claimedRow('run-4'), jobPayload: null };
    claimNextDeliverableRun.mockResolvedValueOnce(noPayload).mockResolvedValueOnce(null);
    await processDeliverableQueue({ workerId: 'w', batchSize: 5 });
    expect(runDeliverableForTenant).not.toHaveBeenCalled();
    expect(completeDeliverableRun).toHaveBeenCalledWith(
      'run-4',
      expect.objectContaining({
        status: 'failed',
        error: expect.stringContaining('job_payload missing'),
      }),
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
    runDeliverableForTenant.mockResolvedValue({
      ok: true,
      artifactId: 'a',
      warnings: [],
    });
    const result = await processDeliverableQueue({
      workerId: 'w',
      batchSize: 3,
    });
    expect(result.processed).toHaveLength(3);
    expect(claimNextDeliverableRun).toHaveBeenCalledTimes(3);
  });
});
