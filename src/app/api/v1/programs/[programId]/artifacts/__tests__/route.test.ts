// Cabinet merge proof: GET /programs/:id/artifacts merges governed generated_artifacts
// (Approve & Build output) with the move_artifacts vault — de-duped, newest-first, and
// only including generated docs when the family filter allows it.

const tenancy = { clientId: 'client-uuid', clientKey: 'skyharbor-air', userId: 'u1' };
let moveRows: Array<Record<string, unknown>> = [];
let generatedRecs: Array<Record<string, unknown>> = [];
const moveCalls: Array<Record<string, unknown>> = [];
let genCalled = 0;

jest.mock('../../../_auth', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not a tenancy error'); }),
}));
jest.mock('@/lib/programs/deliverables/move-artifacts', () => ({
  listMoveArtifacts: jest.fn(async (_ctx: unknown, _id: string, opts: Record<string, unknown>) => {
    moveCalls.push(opts);
    return moveRows;
  }),
}));
jest.mock('@/lib/artifacts/repository', () => ({
  listGeneratedArtifactsForMoveAllRefs: jest.fn(async () => { genCalled += 1; return generatedRecs; }),
}));

import { GET } from '../route';

function req(search = '') {
  return { nextUrl: { searchParams: new URLSearchParams(search) } } as never;
}
function params(programId: string) {
  return { params: Promise.resolve({ programId }) };
}

beforeEach(() => {
  moveRows = [];
  generatedRecs = [];
  moveCalls.length = 0;
  genCalled = 0;
});

describe('GET /api/v1/programs/[programId]/artifacts — Cabinet merge', () => {
  it('merges generated_artifacts with the move vault, newest first', async () => {
    moveRows = [
      { artifact_id: 'mv-1', artifact_type: 'upload', artifact_family: 'uploaded_evidence', title: 'Old Upload', phase: 1, file_format: 'pdf', file_name: 'x.pdf', version: 1, status: 'aligned', lifecycle_state: 'current', quality_score: null, unsupported_claims_count: 0, generated_by: 'u', created_at: '2026-06-01T00:00:00Z', file_size: 10, metadata: {} },
    ];
    generatedRecs = [
      { id: 'gen-1', artifactType: 'program_charter', sourceArtifactRef: 'move-x', outputFormat: 'docx', blobUrl: 'b', qualityScore: 0.9, renderedAt: '2026-06-17T00:00:00Z', renderedBy: 'u', quarantineReason: null, metadata: { renderableDoc: { title: 'Program Charter' } } },
    ];
    const res = await GET(req(), params('move-x'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { count: number; artifacts: Array<Record<string, unknown>> };
    expect(json.count).toBe(2);
    // newest first → generated (Jun 17) before the move upload (Jun 1)
    expect(json.artifacts[0]!.artifactId).toBe('gen-1');
    expect(json.artifacts[0]!.family).toBe('generated_deliverable');
    expect(json.artifacts[0]!.title).toBe('Program Charter');
    expect(json.artifacts[0]!.downloadUrl).toBe('/api/v1/artifacts/gen-1');
    expect(json.artifacts[1]!.artifactId).toBe('mv-1');
  });

  it('de-dupes a generated artifact already present in the move vault', async () => {
    moveRows = [
      { artifact_id: 'gen-1', artifact_type: 'program_charter', artifact_family: 'generated_deliverable', title: 'Charter (vault)', phase: 1, file_format: 'docx', file_name: null, version: 2, status: 'board_ready', lifecycle_state: 'current', quality_score: 0.9, unsupported_claims_count: 0, generated_by: 'u', created_at: '2026-06-17T00:00:00Z', file_size: null, metadata: {} },
    ];
    generatedRecs = [
      { id: 'gen-1', artifactType: 'program_charter', sourceArtifactRef: 'move-x', outputFormat: 'docx', blobUrl: 'b', qualityScore: 0.9, renderedAt: '2026-06-17T00:00:00Z', renderedBy: 'u', quarantineReason: null, metadata: {} },
    ];
    const res = await GET(req(), params('move-x'));
    const json = (await res.json()) as { count: number; artifacts: Array<Record<string, unknown>> };
    expect(json.count).toBe(1); // not duplicated
    expect(json.artifacts[0]!.title).toBe('Charter (vault)'); // the vault row wins
  });

  it('excludes generated docs when a non-deliverable family is selected', async () => {
    generatedRecs = [
      { id: 'gen-1', artifactType: 'program_charter', sourceArtifactRef: 'move-x', outputFormat: 'docx', blobUrl: 'b', qualityScore: 0.9, renderedAt: '2026-06-17T00:00:00Z', renderedBy: 'u', quarantineReason: null, metadata: {} },
    ];
    const res = await GET(req('family=uploaded_evidence'), params('move-x'));
    const json = (await res.json()) as { count: number };
    expect(genCalled).toBe(0); // never even queried generated_artifacts
    expect(json.count).toBe(0);
  });

  it('still renders the vault when the generated_artifacts read throws', async () => {
    const repo = jest.requireMock('@/lib/artifacts/repository') as { listGeneratedArtifactsForMoveAllRefs: jest.Mock };
    repo.listGeneratedArtifactsForMoveAllRefs.mockRejectedValueOnce(new Error('db down'));
    moveRows = [
      { artifact_id: 'mv-1', artifact_type: 'upload', artifact_family: 'uploaded_evidence', title: 'Upload', phase: 1, file_format: 'pdf', file_name: 'x', version: 1, status: 'aligned', lifecycle_state: 'current', quality_score: null, unsupported_claims_count: 0, generated_by: 'u', created_at: '2026-06-01T00:00:00Z', file_size: 1, metadata: {} },
    ];
    const res = await GET(req(), params('move-x'));
    const json = (await res.json()) as { ok: boolean; count: number };
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
  });
});
