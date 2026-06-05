import { NextRequest } from 'next/server';

import { POST } from '../route';

const mockRequireTenancy = jest.fn();
const mockGetReadinessInput = jest.fn();
const mockGenerate = jest.fn();

jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: (...args: unknown[]) => mockRequireTenancy(...args),
  tenancyErrorResponse: () =>
    new Response(JSON.stringify({ error: 'unauthenticated' }), { status: 401 }),
}));

jest.mock('@/lib/context-ingestion/phs-stage-readiness-read-model', () => ({
  getPHSStageReadinessInputForClient: (...args: unknown[]) => mockGetReadinessInput(...args),
}));

jest.mock('@/lib/context-ingestion/phs-command-center-generation', () => ({
  generatePHSCommandCenterArtifact: (...args: unknown[]) => mockGenerate(...args),
}));

function request(body: unknown) {
  return new NextRequest(
    'http://localhost/api/v1/moves/phs-command-center/generate',
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    },
  );
}

function body() {
  return {
    artifactId: 'artifact-strategy',
    artifactKind: 'ai-strategy-memo',
    phase: '2',
    manifest: {
      manifestId: 'phs-phase0-001',
      tenantKey: 'meridian-health',
      clientName: 'Meridian Health',
      generatedAt: '2026-06-05T12:00:00.000Z',
      evidenceItems: [],
      uploadedArtifacts: [],
      workloadRecords: [],
      rateCardRows: [],
      gateCriteria: [],
      approvalRecords: [],
    },
    evidenceRefs: [
      {
        evidenceId: 'PHS-STARS-2026',
        title: 'Stars baseline',
        sourceType: 'public',
        summary: 'CMS Stars baseline for the PHS strategy demo.',
      },
    ],
    corpusPatternRefs: [
      {
        patternId: 'dom54-stars-measure-uplift',
        title: 'Stars measure uplift operating model',
        domain: 'stars_quality',
        summary: 'Stars uplift requires measure ownership and traceability.',
      },
    ],
  };
}

describe('/api/v1/moves/phs-command-center/generate', () => {
  beforeEach(() => {
    mockRequireTenancy.mockResolvedValue({
      clientId: 'client-meridian',
      clientKey: 'meridian-health',
      userId: 'user-1',
    });
    mockGetReadinessInput.mockResolvedValue({
      contextChunks: [],
      evidenceRows: [],
      manifest: body().manifest,
    });
    mockGenerate.mockResolvedValue({
      status: 'generated',
      text: 'Generated strategy [PHS-STARS-2026] [dom54-stars-measure-uplift]',
      auditId: 'audit-1',
      model: 'gpt-5.1',
      tokensIn: 100,
      tokensOut: 30,
      stopReason: 'completed',
      evidenceIds: ['PHS-STARS-2026'],
      corpusPatternIds: ['dom54-stars-measure-uplift'],
      readiness: { readyForStageAdvance: true },
      openAiCalled: true,
    });
  });

  afterEach(() => {
    mockRequireTenancy.mockReset();
    mockGetReadinessInput.mockReset();
    mockGenerate.mockReset();
  });

  it('uses the authenticated client id for readiness lookup and generation', async () => {
    const response = await POST(request(body()));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      ok: true,
      status: 'generated',
      auditId: 'audit-1',
      openAiCalled: true,
    });
    expect(mockGetReadinessInput).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'client-meridian',
    }));
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'client-meridian',
      userId: 'user-1',
      artifactKind: 'ai-strategy-memo',
      evidenceRefs: expect.arrayContaining([
        expect.objectContaining({ evidenceId: 'PHS-STARS-2026' }),
      ]),
    }));
  });

  it('does not accept a caller-supplied clientId as the generation tenant', async () => {
    await POST(request({ ...body(), clientId: 'client-other' }));

    expect(mockGetReadinessInput).toHaveBeenCalledWith(expect.objectContaining({
      clientId: 'client-meridian',
    }));
    expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: 'client-meridian',
    }));
  });

  it('returns 409 when the generation guard blocks the artifact', async () => {
    mockGenerate.mockResolvedValueOnce({
      status: 'blocked',
      blockers: ['No evidence references were supplied for artifact generation.'],
      readiness: { readyForStageAdvance: false },
      openAiCalled: false,
    });

    const response = await POST(request(body()));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json).toEqual({
      ok: false,
      status: 'blocked',
      blockers: ['No evidence references were supplied for artifact generation.'],
      readiness: { readyForStageAdvance: false },
      openAiCalled: false,
    });
  });

  it('requires authentication before reading context or generating', async () => {
    mockRequireTenancy.mockRejectedValueOnce(new Error('unauthenticated'));

    const response = await POST(request(body()));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'unauthenticated' });
    expect(mockGetReadinessInput).not.toHaveBeenCalled();
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
