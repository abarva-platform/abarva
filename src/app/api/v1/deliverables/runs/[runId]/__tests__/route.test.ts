// Poll route proof: returns the run status scoped to the caller's client; 404 when the
// run isn't owned by this tenant; maps terminal states to artifact/blockers.

const tenancy = { clientId: 'client-uuid', clientKey: 'skyharbor-air', userId: 'u1' };
let runRow: Record<string, unknown> | null = null;
const getCalls: Array<[string, string]> = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not a tenancy error'); }),
}));
jest.mock('@/lib/deliverables/orchestrator/runs-repository', () => ({
  getDeliverableRun: jest.fn(async (id: string, clientId: string) => { getCalls.push([id, clientId]); return runRow; }),
}));

import { GET } from '../route';

function params(runId: string) {
  return { params: Promise.resolve({ runId }) };
}

beforeEach(() => { getCalls.length = 0; runRow = null; });

describe('GET /api/v1/deliverables/runs/[runId]', () => {
  it('404 when the run is not found for this tenant', async () => {
    const res = await GET({} as never, params('run-x'));
    expect(res.status).toBe(404);
    expect(getCalls[0]).toEqual(['run-x', 'client-uuid']); // scoped to caller client
  });

  it('returns succeeded status with a blob url', async () => {
    runRow = { id: 'run-1', status: 'succeeded', artifactId: 'art-9', sectionCount: 12, retrievedEvidence: 7, contextCoverage: { approvedAvailable: 10, retrieved: 10, packed: 0, droppedForBudget: 10, unreadable: 0, cited: 0, coverageRatio: 0, coverageState: 'empty_prompt', requiresAttention: true, usedTokens: 0, evidenceTokenBudget: 1000 }, blockers: [], warnings: ['minor'], error: null, updatedAt: 't' };
    const res = await GET({} as never, params('run-1'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe('succeeded');
    expect(json.blobUrl).toBe('/api/v1/artifacts/art-9');
    expect(json.sectionCount).toBe(12);
    expect(json.contextCoverage).toMatchObject({
      coverageState: 'empty_prompt',
      requiresAttention: true,
    });
  });

  it('returns a Move File Cabinet download url for premium Moves artifact runs', async () => {
    runRow = {
      id: 'run-premium',
      status: 'succeeded',
      artifactId: 'move-art-9',
      sectionCount: 2200,
      retrievedEvidence: 3,
      blockers: [],
      warnings: [],
      error: null,
      updatedAt: 't',
      jobPayload: {
        kind: 'moves_premium_artifact',
        sourceArtifactRef: 'move-123',
      },
    };
    const res = await GET({} as never, params('run-premium'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.artifactScope).toBe('move_file_cabinet');
    expect(json.blobUrl).toBe('/api/v1/programs/move-123/artifacts/move-art-9/download');
  });

  it('returns queued status at 0% with a waiting label (before the worker claims it)', async () => {
    runRow = { id: 'run-q', status: 'queued', artifactId: null, blockers: [], warnings: [], error: null, progressPct: null, progressLabel: null, updatedAt: 't' };
    const res = await GET({} as never, params('run-q'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe('queued');
    expect(json.progressPct).toBe(0);
    expect(json.progressLabel).toMatch(/queued/i);
    expect(json.blobUrl).toBeNull();
  });

  it('returns blocked status with blockers and no blob url', async () => {
    runRow = { id: 'run-2', status: 'blocked', artifactId: null, retrievedEvidence: 0, blockers: ['no source register'], warnings: [], error: 'quality gate blocked export', updatedAt: 't' };
    const res = await GET({} as never, params('run-2'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.status).toBe('blocked');
    expect(json.blobUrl).toBeNull();
    expect(json.blockers).toContain('no source register');
    expect(json.packageReadiness).toMatchObject({
      label: 'Cannot assemble executive package',
      evidenceCoveragePct: 0,
      confidenceTier: 'bronze',
      confidenceLabel: 'Internal working draft',
      canShareExternally: false,
      recommendedNextStep:
        'Upload and approve the phase workshop outputs, source files, and decision evidence, then re-run Approve & Build.',
    });
    expect((json.packageReadiness as { missing: string[] }).missing).toContain(
      'Source-backed evidence attached to this Move',
    );
  });
});
