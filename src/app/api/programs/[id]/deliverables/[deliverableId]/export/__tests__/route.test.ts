/**
 * @jest-environment node
 *
 * EXPORT-4 · POST /api/programs/[id]/deliverables/[kind]/export
 *
 * Mocks requireTenancy, getActiveClientRow, getProgramById, the
 * audit writer, and both renderers so the route handler runs end to
 * end without a live Supabase / Clerk session. We're not unit-testing
 * the underlying renderers (they're already covered in EXPORT-2 and
 * EXPORT-3) — we're confirming the route's dispatch logic:
 *
 *   - 401 unauthenticated
 *   - 403 wrong tenant (program not visible)
 *   - 400 path/body kind mismatch
 *   - 400 disallowed format for kind (router throw)
 *   - 200 + binary + audit-success row on a valid xlsx spec
 *   - 200 + binary + audit-success row on a valid docx spec
 *   - 500 + audit-error row when the renderer throws
 */

const requireTenancyMock = jest.fn();
const tenancyErrorResponseMock = jest.fn((err: unknown) => {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? (err as { code: string }).code
      : 'unknown';
  if (code === 'unauthenticated') {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }
  return Response.json({ error: code }, { status: 403 });
});

class TestTenancyError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

jest.mock('@/app/api/v1/programs/_auth', () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => tenancyErrorResponseMock(err),
}));

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

const getProgramByIdMock = jest.fn();
jest.mock('@/lib/programs/queries', () => ({
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

const recordExportAuditMock = jest.fn();
const getSpecMock = jest.fn();
const routeFormatMock = jest.fn();
jest.mock('@/lib/programs/exports', () => ({
  recordExportAudit: (input: Record<string, unknown>) =>
    recordExportAuditMock(input),
  getSpec: (id: string) => getSpecMock(id),
  routeFormat: (kind: string, requestedFormat: string | undefined) =>
    routeFormatMock(kind, requestedFormat),
}));

const renderXlsxMock = jest.fn();
const renderDocxMock = jest.fn();
jest.mock('@/lib/programs/exports/renderers/xlsx', () => ({
  renderDeliverableAsXlsx: (spec: unknown) => renderXlsxMock(spec),
}));
jest.mock('@/lib/programs/exports/renderers/docx', () => ({
  renderDeliverableAsDocx: (spec: unknown) => renderDocxMock(spec),
}));

// `clientKeyToBrokerTenantKey` lives under lib/agent/tools/intelligence
// and pulls in surrounding broker code we don't want at test time.
// Mock it to a known mapping.
jest.mock('@/lib/agent/tools/intelligence/_shared', () => ({
  clientKeyToBrokerTenantKey: (key: string) =>
    key === 'apexretail' ? 'apex-retail' : key,
}));

// Import AFTER all mocks are registered.
import { POST } from '@/app/api/programs/[id]/deliverables/[deliverableId]/export/route';

const PROGRAM_ID = 'APX-CDP-2026';

function makeRequest(body: unknown): Request {
  return new Request(
    `http://localhost/api/programs/${PROGRAM_ID}/deliverables/program-charter/export`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

const charterSpec = {
  kind: 'program-charter',
  tenantKey: 'apex-retail',
  programId: PROGRAM_ID,
  title: 'Apex CDP Activation 2026 — Charter v1',
  payload: {
    valueHypothesis: { thesis: 't' },
    sponsor: { name: 's' },
    recommendedPath: { plan: 'p' },
    architectureReviewAttestation: { reviewer: 'a' },
    killCriterion: { name: 'k' },
    baselineKpis: [],
    signoff: { signer: 'x' },
  },
};

const okrSpec = {
  kind: 'okr-baseline',
  tenantKey: 'apex-retail',
  programId: PROGRAM_ID,
  title: 'Q3 OKR Baseline',
  payload: {
    cohort: 'apex',
    capturedAt: '2026-04-29T00:00:00Z',
    metrics: [],
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: 'c-1',
    userId: 'user_clerk_42',
    role: 'admin',
  });
  getActiveClientRowMock.mockResolvedValue({
    id: 'c-1',
    name: 'Apex Retail',
    industry_code: 'retail',
    key: 'apexretail',
  });
  getProgramByIdMock.mockResolvedValue({
    id: PROGRAM_ID,
    clientId: 'c-1',
    archivedAt: null,
    deletedAt: null,
  });
  recordExportAuditMock.mockResolvedValue(undefined);
  routeFormatMock.mockImplementation(
    (_kind: string, requested: string | undefined) => requested ?? 'docx',
  );
  renderDocxMock.mockResolvedValue({
    format: 'docx',
    buffer: Buffer.from('FAKE-DOCX-BYTES'),
    filename: 'apex-program-charter-20260429.docx',
    contentType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 15,
  });
  renderXlsxMock.mockResolvedValue({
    format: 'xlsx',
    buffer: Buffer.from('FAKE-XLSX-BYTES'),
    filename: 'okr-okr-baseline-20260429.xlsx',
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    sizeBytes: 15,
  });
});

const PARAMS_CHARTER = {
  params: Promise.resolve({ id: PROGRAM_ID, deliverableId: 'program-charter' }),
};
const PARAMS_OKR = {
  params: Promise.resolve({ id: PROGRAM_ID, deliverableId: 'okr-baseline' }),
};

describe('POST /api/programs/[id]/deliverables/[deliverableId]/export', () => {
  it('returns 401 when unauthenticated', async () => {
    requireTenancyMock.mockRejectedValue(new TestTenancyError('unauthenticated'));
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    expect(res.status).toBe(401);
    expect(recordExportAuditMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the program does not belong to the tenant', async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    expect(res.status).toBe(403);
  });

  it('returns 410 when the program is archived', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      clientId: 'c-1',
      archivedAt: '2026-04-29T00:00:00Z',
      deletedAt: null,
    });
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    expect(res.status).toBe(410);
  });

  it('returns 400 when path kind does not match body spec kind', async () => {
    const wrongKindBody = { spec: { ...charterSpec, kind: 'okr-baseline' } };
    const res = await POST(makeRequest(wrongKindBody), PARAMS_CHARTER);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('kind_mismatch');
  });

  it('returns 400 when path kind is unknown', async () => {
    const req = new Request(
      `http://localhost/api/programs/${PROGRAM_ID}/deliverables/not-a-kind/export`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: charterSpec }),
      },
    );
    const res = await POST(req, {
      params: Promise.resolve({ id: PROGRAM_ID, deliverableId: 'not-a-kind' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_kind');
  });

  it('returns 400 when the format router rejects the requested format', async () => {
    routeFormatMock.mockImplementation(() => {
      throw new Error('Format "xlsx" is not allowed for kind "program-charter".');
    });
    const res = await POST(
      makeRequest({ format: 'xlsx', spec: charterSpec }),
      PARAMS_CHARTER,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('format_not_allowed');
  });

  it('returns 400 on invalid JSON body', async () => {
    const req = new Request(
      `http://localhost/api/programs/${PROGRAM_ID}/deliverables/program-charter/export`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json{',
      },
    );
    const res = await POST(req, PARAMS_CHARTER);
    expect(res.status).toBe(400);
  });

  it('returns 400 when neither spec nor specId is supplied', async () => {
    const res = await POST(makeRequest({}), PARAMS_CHARTER);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('invalid_spec');
  });

  it('returns 400 when specId references an unknown / expired spec', async () => {
    getSpecMock.mockReturnValue(null);
    const res = await POST(
      makeRequest({ specId: 'unknown-id' }),
      PARAMS_CHARTER,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('spec_not_found');
  });

  it('returns 200 + DOCX headers + audits success on a valid charter docx render', async () => {
    routeFormatMock.mockReturnValue('docx');
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(res.headers.get('Content-Disposition')).toContain(
      'attachment; filename="apex-program-charter-20260429.docx"',
    );
    expect(res.headers.get('Cache-Control')).toBe('private, max-age=0');
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);

    expect(renderDocxMock).toHaveBeenCalledTimes(1);
    expect(recordExportAuditMock).toHaveBeenCalledTimes(1);
    const auditPayload = recordExportAuditMock.mock.calls[0][0];
    expect(auditPayload).toMatchObject({
      tenantKey: 'apex-retail',
      programId: PROGRAM_ID,
      deliverableKind: 'program-charter',
      format: 'docx',
      filename: 'apex-program-charter-20260429.docx',
      sizeBytes: 15,
      outcome: 'success',
      actorUserId: 'user_clerk_42',
    });
  });

  it('returns 200 + XLSX headers on a valid okr-baseline xlsx render', async () => {
    routeFormatMock.mockReturnValue('xlsx');
    const res = await POST(makeRequest({ spec: okrSpec }), PARAMS_OKR);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.headers.get('Content-Disposition')).toContain(
      'filename="okr-okr-baseline-20260429.xlsx"',
    );
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(renderXlsxMock).toHaveBeenCalledTimes(1);
    expect(recordExportAuditMock).toHaveBeenCalledTimes(1);
    const auditPayload = recordExportAuditMock.mock.calls[0][0];
    expect(auditPayload.format).toBe('xlsx');
    expect(auditPayload.outcome).toBe('success');
  });

  it('resolves a specId from the cache and renders without the inline spec', async () => {
    getSpecMock.mockReturnValue(charterSpec);
    routeFormatMock.mockReturnValue('docx');
    const res = await POST(
      makeRequest({ specId: 'cached-id-1' }),
      PARAMS_CHARTER,
    );
    expect(res.status).toBe(200);
    expect(getSpecMock).toHaveBeenCalledWith('cached-id-1');
    expect(renderDocxMock).toHaveBeenCalledTimes(1);
    // Renderer was called with the cached spec, not the body shape.
    expect(renderDocxMock.mock.calls[0][0]).toBe(charterSpec);
  });

  it('returns 500 + audits outcome=error when the renderer throws', async () => {
    routeFormatMock.mockReturnValue('docx');
    renderDocxMock.mockRejectedValue(new Error('payload malformed: signoff missing'));
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; detail?: string };
    expect(body.error).toBe('render_failed');
    expect(body.detail).toContain('payload malformed');

    expect(recordExportAuditMock).toHaveBeenCalledTimes(1);
    const auditPayload = recordExportAuditMock.mock.calls[0][0];
    expect(auditPayload.outcome).toBe('error');
    expect(auditPayload.errorMessage).toContain('payload malformed');
    expect(auditPayload.sizeBytes).toBe(0);
  });

  it('returns 501 + audits outcome=error when format is pdf (deferred)', async () => {
    routeFormatMock.mockReturnValue('pdf');
    const res = await POST(
      makeRequest({ format: 'pdf', spec: charterSpec }),
      PARAMS_CHARTER,
    );
    expect(res.status).toBe(501);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('render_failed');
    expect(recordExportAuditMock).toHaveBeenCalledTimes(1);
    expect(recordExportAuditMock.mock.calls[0][0].outcome).toBe('error');
  });

  it('does not fail the response when audit-write itself errors', async () => {
    routeFormatMock.mockReturnValue('docx');
    recordExportAuditMock.mockRejectedValue(new Error('audit DB down'));
    const res = await POST(makeRequest({ spec: charterSpec }), PARAMS_CHARTER);
    // Audit failure logged but the user still gets the binary.
    expect(res.status).toBe(200);
  });
});
