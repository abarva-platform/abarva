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
const { sweepStaleDeliverableRuns, claimNextDeliverableRun, completeDeliverableRun } = repo;
const { runDeliverableForTenant } = svc;

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

  it('is bounded: processes at most batchSize runs per invocation', async () => {
    claimNextDeliverableRun.mockResolvedValue(claimedRow('run-loop')); // always returns a row
    runDeliverableForTenant.mockResolvedValue({ ok: true, artifactId: 'a', warnings: [] });
    const result = await processDeliverableQueue({ workerId: 'w', batchSize: 3 });
    expect(result.processed).toHaveLength(3);
    expect(claimNextDeliverableRun).toHaveBeenCalledTimes(3);
  });
});
