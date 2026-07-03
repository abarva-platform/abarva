// List route proof: tenant-scoped, grouped, history opt-in.
const tenancy = { clientId: 'c1', clientKey: 'skyharbor-air', userId: 'u1' };
let listArgs: unknown[] = [];

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(async () => tenancy),
  tenancyErrorResponse: jest.fn(() => { throw new Error('not tenancy'); }),
}));
jest.mock('@/lib/source/canvas-substrate/queries', () => ({
  listArtifactStatesForEvent: jest.fn(async () => []),
}));
jest.mock('@/lib/source/artifact-registry', () => ({
  listSourceArtifactsForSourceEventId: jest.fn(async () => []),
}));
jest.mock('@/lib/source/canonical-specs', () => ({
  specByCode: jest.fn((code: string) =>
    code === 'd24_decision_brief'
      ? { name: 'D24 Decision Brief', description: 'Executive decision brief.' }
      : undefined,
  ),
}));
jest.mock('@/lib/source/file-cabinet/repository', () => ({
  listSourceArtifacts: jest.fn(async (eventId: string, clientId: string, filter: unknown) => {
    listArgs = [eventId, clientId, filter];
    return [
      { id: 'a1', artifactGroup: 'generated', artifactType: 'rfp_package', title: 'AMS RFP', version: 1, status: 'preliminary', lifecycleState: 'current' },
      { id: 'a2', artifactGroup: 'approval', artifactType: 'approval_packet', title: 'Approval', version: 1, status: 'approved', lifecycleState: 'current' },
    ];
  }),
}));

import { GET } from '../route';
import { listArtifactStatesForEvent } from '@/lib/source/canvas-substrate/queries';
import { listSourceArtifactsForSourceEventId } from '@/lib/source/artifact-registry';

function req(url: string): import('next/server').NextRequest {
  return { url } as unknown as import('next/server').NextRequest;
}

beforeEach(() => {
  listArgs = [];
  jest.mocked(listArtifactStatesForEvent).mockResolvedValue([]);
  jest.mocked(listSourceArtifactsForSourceEventId).mockResolvedValue([]);
});

describe('GET /api/v1/source/events/[eventId]/artifacts', () => {
  it('400 when eventId blank', async () => {
    const res = await GET(req('https://x/api'), { params: Promise.resolve({ eventId: ' ' }) });
    expect(res.status).toBe(400);
  });
  it('returns grouped artifacts scoped to the caller client', async () => {
    const res = await GET(req('https://x/api'), { params: Promise.resolve({ eventId: 'evt-1' }) });
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, never>;
    expect((json as Record<string, unknown>).count).toBe(2);
    const grouped = (json as Record<string, Record<string, unknown[]>>).grouped;
    expect(grouped.generated).toHaveLength(1);
    expect(grouped.approval).toHaveLength(1);
    expect(listArgs[1]).toBe('c1'); // client-scoped
  });
  it('passes includeHistory + group filter through', async () => {
    await GET(req('https://x/api?includeHistory=1&group=generated'), { params: Promise.resolve({ eventId: 'evt-1' }) });
    expect((listArgs[2] as { includeHistory: boolean; artifactGroup: string }).includeHistory).toBe(true);
    expect((listArgs[2] as { artifactGroup: string }).artifactGroup).toBe('generated');
  });
  it('bridges linked generated artifact-state rows into the generated group', async () => {
    jest.mocked(listArtifactStatesForEvent).mockResolvedValue([
      {
        id: 'state-24',
        sourceEventId: 'evt-1',
        tenantKey: 'skyharbor-air',
        artifactCode: 'd24_decision_brief',
        stage: 'executive_decision',
        family: 'decision_brief',
        tier: 'rich',
        status: 'approved',
        requirementLevel: 'required',
        gateDefining: true,
        linkedArtifactId: 'registry-24',
        notes: null,
        body: '# Decision',
        bodyFormat: 'markdown',
        bodyAuthoredBy: 'u1',
        bodyUpdatedAt: '2026-07-03T00:00:00.000Z',
        bodyGenerationMetadata: null,
        createdAt: '2026-07-03T00:00:00.000Z',
        updatedAt: '2026-07-03T00:00:00.000Z',
      },
    ]);

    const res = await GET(req('https://x/api'), { params: Promise.resolve({ eventId: 'evt-1' }) });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.count).toBe(3);
    const grouped = json.grouped as Record<string, Array<Record<string, unknown>>>;
    expect(grouped.generated.map((item) => item.id)).toEqual(['a1', 'registry-24']);
    expect(grouped.generated[1]).toMatchObject({
      title: 'D24 Decision Brief',
      artifactGroup: 'generated',
      artifactType: 'd24_decision_brief',
      sourceBasis: 'source_event_artifact_states:state-24',
    });
  });
  it('falls back to tenant-scoped artifact registry rows when File Cabinet projection is absent', async () => {
    jest.mocked(listSourceArtifactsForSourceEventId).mockResolvedValue([
      {
        id: 'registry-generated-1',
        tenantKey: 'skyharbor-air',
        sourceEventId: 'evt-1',
        sourceEventRowId: null,
        stageKey: 'evaluation',
        artifactFamily: 'decision_brief',
        artifactKind: 'd24_decision_brief',
        sourceOrigin: 'generated',
        sourceFormat: 'markdown',
        originalName: 'D24 Decision Brief.md',
        blobUri: 'az://source-artifacts/skyharbor/evt-1/d24.md',
        uploaderUserId: 'u1',
        mimeType: 'text/markdown',
        sizeBytes: 2048,
        sha256: 'abc123',
        parseStatus: 'parsed',
        embeddingStatus: 'not_applicable',
        graphStatus: 'not_applicable',
        classificationStatus: 'classified',
        dataClassification: 'Internal',
        evidenceState: 'cited',
        approvalState: 'approved',
        isClientFinal: false,
        isCurrentAuthoritative: false,
        sourceGeneratedArtifactId: null,
        clientFinalUploadedBy: null,
        clientFinalUploadedAt: null,
        clientFinalAcceptedBy: null,
        clientFinalAcceptedAt: null,
        clientFinalNote: null,
        clientFinalReviewMeetingDate: null,
        clientFinalStakeholderGroup: null,
        clientFinalChangeSummary: {},
        citedSourceArtifactIds: [],
        version: 1,
        supersedesArtifactVersionId: null,
        createdBy: 'aVa',
        validatedBy: null,
        createdAt: '2026-07-03T00:00:00.000Z',
        updatedAt: '2026-07-03T00:00:00.000Z',
        deletedAt: null,
      },
      {
        id: 'wrong-tenant-generated',
        tenantKey: 'lakeshore-holdings',
        sourceEventId: 'evt-1',
        sourceEventRowId: null,
        stageKey: 'evaluation',
        artifactFamily: 'decision_brief',
        artifactKind: 'd24_decision_brief',
        sourceOrigin: 'generated',
        sourceFormat: 'markdown',
        originalName: 'Wrong Tenant.md',
        blobUri: 'az://source-artifacts/lakeshore/evt-1/d24.md',
        uploaderUserId: 'u1',
        mimeType: 'text/markdown',
        sizeBytes: 2048,
        sha256: 'def456',
        parseStatus: 'parsed',
        embeddingStatus: 'not_applicable',
        graphStatus: 'not_applicable',
        classificationStatus: 'classified',
        dataClassification: 'Internal',
        evidenceState: 'cited',
        approvalState: 'approved',
        isClientFinal: false,
        isCurrentAuthoritative: false,
        sourceGeneratedArtifactId: null,
        clientFinalUploadedBy: null,
        clientFinalUploadedAt: null,
        clientFinalAcceptedBy: null,
        clientFinalAcceptedAt: null,
        clientFinalNote: null,
        clientFinalReviewMeetingDate: null,
        clientFinalStakeholderGroup: null,
        clientFinalChangeSummary: {},
        citedSourceArtifactIds: [],
        version: 1,
        supersedesArtifactVersionId: null,
        createdBy: 'aVa',
        validatedBy: null,
        createdAt: '2026-07-03T00:00:00.000Z',
        updatedAt: '2026-07-03T00:00:00.000Z',
        deletedAt: null,
      },
    ]);

    const res = await GET(req('https://x/api?group=generated'), { params: Promise.resolve({ eventId: 'evt-1' }) });

    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    const grouped = json.grouped as Record<string, Array<Record<string, unknown>>>;
    expect(grouped.generated.map((item) => item.id)).toEqual(['a1', 'registry-generated-1']);
    expect(grouped.generated[1]).toMatchObject({
      artifactGroup: 'generated',
      artifactType: 'd24_decision_brief',
      fileFormat: 'md',
      sourceBasis: 'source_artifacts:registry-generated-1',
      sourceRegisterId: 'registry-generated-1',
    });
  });
});
