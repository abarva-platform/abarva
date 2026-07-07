/**
 * @jest-environment node
 */

// POST /api/v1/source/:eventId/artifacts/upload — canvas-upload wiring smoke.
//
// Narrow checks against the route handler: we mock the tenancy guard, active
// client, the persisted-event lookup, the Azure Blob object-storage adapter,
// and the artifact-registry write so the route runs end-to-end without a live
// Clerk/Azure/Postgres. We are confirming the route's contract:
//   • a posted CSV/XLSX file → object storage `.upload()` is called with a
//     TENANT-SCOPED blob path AND an artifact row is registered, and the
//     artifact metadata is returned.
//   • a missing file → 400.
//   • an oversized file → 413.
//   • a wrong-type file → 415.

import {
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
} from '@/lib/source/artifact-registry';

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

jest.mock('@/app/api/v1/_intel-auth', () => ({
  requireTenancy: () => requireTenancyMock(),
  tenancyErrorResponse: (err: unknown) => tenancyErrorResponseMock(err),
}));

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

jest.mock('@/lib/agent/tools/intelligence/_shared', () => ({
  clientKeyToInventorySubstrateKey: (key: string) =>
    key === 'apexretail' ? 'apex-retail' : key,
}));

const getCurrentUserMock = jest.fn();
jest.mock('@/lib/auth/current-user', () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

// Azure Blob object-storage adapter — the real Blob write path.
type UploadArgs = [string, string, unknown, unknown];
const storageUploadMock = jest.fn<Promise<void>, UploadArgs>(
  async () => undefined,
);
const storageRemoveMock = jest.fn<Promise<void>, [string, string[]]>(
  async () => undefined,
);
jest.mock('@/lib/data-plane/objectStorage', () => ({
  getObjectStorageAdapter: () => ({
    upload: (bucket: string, path: string, body: unknown, opts: unknown) =>
      storageUploadMock(bucket, path, body, opts),
    remove: (bucket: string, paths: string[]) =>
      storageRemoveMock(bucket, paths),
  }),
}));

// Persisted source_events lookup used by resolveSourceEventScope.
const maybeSingleMock = jest.fn();
jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureReadFluentClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => maybeSingleMock() }),
          maybeSingle: () => maybeSingleMock(),
        }),
      }),
    }),
  }),
}));

const insertActivityLogMock = jest.fn(async () => ({ ok: true }));
jest.mock('@/lib/data-plane/write-adapters/sourceWriteAdapter', () => ({
  selectSourceWriteAdapter: () => ({
    insertActivityLog: (...args: unknown[]) => insertActivityLogMock(...args),
    updateArtifactBody: async () => ({ ok: true }),
    updateGateCriterion: async () => ({ ok: true }),
  }),
}));

const registerSourceArtifactUploadMock = jest.fn();
const buildSourceArtifactBlobPathMock = jest.fn(
  (args: {
    tenantKey: string;
    sourceEventId: string;
    artifactId: string;
    filename: string;
  }) =>
    `${args.tenantKey}/source/${args.sourceEventId}/${args.artifactId}/${args.filename}`,
);
jest.mock('@/lib/source/artifact-registry', () => ({
  MAX_SOURCE_ARTIFACT_SIZE_BYTES: 104_857_600,
  isAllowedSourceArtifactMimeType: (mime: string) =>
    [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(mime),
  isWithinSourceArtifactSizeLimit: (size: number) =>
    size > 0 && size <= 104_857_600,
  buildSourceArtifactBlobPath: (args: {
    tenantKey: string;
    sourceEventId: string;
    artifactId: string;
    filename: string;
  }) => buildSourceArtifactBlobPathMock(args),
  registerSourceArtifactUpload: (input: Record<string, unknown>) =>
    registerSourceArtifactUploadMock(input),
}));

jest.mock('@/lib/source/artifact-registry/upload-contract', () => ({
  inferSourceArtifactFamily: () => 'pricing_workbook',
  sourceArtifactFormatFromMime: (mime: string) =>
    mime.includes('spreadsheet') ? 'spreadsheet' : 'text',
}));

jest.mock('@/lib/source/artifact-registry/text-parser', () => ({
  isSynchronouslyParseableSourceFormat: () => false,
  parseSourceTextArtifact: async ({ artifact }: { artifact: unknown }) =>
    artifact,
}));

jest.mock('@/lib/source/canonical-specs/gate-criteria', () => ({
  criteriaByArtifactCode: () => [],
}));

jest.mock('@/lib/source/artifact-registry/upload-text-extraction', () => ({
  extractSourceUploadText: async () => ({ text: '', warnings: [] }),
}));

jest.mock('@/lib/security/sensitive-upload-guard', () => ({
  evaluateSensitiveUpload: () => ({ decision: 'allow' }),
  sensitiveUploadRejectedResponse: () =>
    Response.json({ ok: false, error: 'quarantine' }, { status: 422 }),
}));

const syncUploadToCanvasSubstrateMock = jest.fn(async () => ({ ok: true }));
jest.mock('@/lib/source/canvas-substrate/upload-sync', () => ({
  syncUploadToCanvasSubstrate: (...args: unknown[]) =>
    syncUploadToCanvasSubstrateMock(...args),
}));

// Import AFTER all mocks are registered.
import { POST } from '@/app/api/v1/source/[eventId]/artifacts/upload/route';

const EVENT_ID = '11111111-1111-1111-1111-111111111111';
const EVENT_PARAMS = { params: Promise.resolve({ eventId: EVENT_ID }) };

const CSV_MIME = 'text/csv';
const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function makeMultipartRequest(
  filename: string,
  mime: string,
  bytes: number,
  fields: Record<string, string> = {},
): Request {
  const fd = new FormData();
  fd.append('file', new File([new Uint8Array(bytes)], filename, { type: mime }));
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return new Request(
    `http://localhost/api/v1/source/${EVENT_ID}/artifacts/upload`,
    { method: 'POST', body: fd },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  requireTenancyMock.mockResolvedValue({
    clientId: 'c-1',
    userId: 'u-1',
    role: 'admin',
  });
  getActiveClientRowMock.mockResolvedValue({
    id: 'c-1',
    name: 'Apex Retail',
    key: 'apexretail',
  });
  getCurrentUserMock.mockResolvedValue({
    personId: 'p-1',
    clerkUserId: 'clerk:u-1',
  });
  // Persisted source_events row so scope resolves without a seed lookup.
  maybeSingleMock.mockResolvedValue({
    data: {
      id: EVENT_ID,
      client_key: 'apexretail',
      current_stage_key: 'scope',
    },
    error: null,
  });
  registerSourceArtifactUploadMock.mockImplementation(
    async (input: Record<string, unknown>) => ({
      id: input.artifactId,
      sourceEventId: input.sourceEventId,
      artifactFamily: input.artifactFamily,
      artifactKind: input.artifactKind,
      sourceFormat: input.sourceFormat,
      originalName: input.originalName,
      sizeBytes: input.sizeBytes,
      parseStatus: 'pending',
      version: 1,
    }),
  );
});

describe('POST /api/v1/source/[eventId]/artifacts/upload', () => {
  it('persists a CSV to Azure Blob at a tenant-scoped path + registers an artifact row', async () => {
    const req = makeMultipartRequest(
      'apex-svc-baseline-18mo.csv',
      CSV_MIME,
      512,
      { stageKey: 'scope' },
    );
    const res = await POST(req, EVENT_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      artifact?: { id?: string; originalName?: string };
    };
    expect(body.ok).toBe(true);
    expect(body.artifact?.originalName).toBe('apex-svc-baseline-18mo.csv');

    // Blob write called with the tenant-scoped path.
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    const [bucket, blobPath] = storageUploadMock.mock.calls[0];
    expect(bucket).toBe('source-artifacts');
    expect(String(blobPath)).toContain('apex-retail/source/');
    expect(String(blobPath)).toContain(EVENT_ID);

    // Artifact row registered with the tenant + event scope + uploaded origin.
    expect(registerSourceArtifactUploadMock).toHaveBeenCalledTimes(1);
    const registered = registerSourceArtifactUploadMock.mock
      .calls[0][0] as Record<string, unknown>;
    expect(registered.tenantKey).toBe('apex-retail');
    expect(registered.sourceEventId).toBe(EVENT_ID);
    expect(registered.sourceOrigin).toBe('uploaded');
    expect(registered.originalName).toBe('apex-svc-baseline-18mo.csv');
  });

  it('accepts an XLSX file', async () => {
    const req = makeMultipartRequest('volumetrics.xlsx', XLSX_MIME, 2048);
    const res = await POST(req, EVENT_PARAMS);
    expect(res.status).toBe(200);
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    expect(registerSourceArtifactUploadMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a request with no file (400)', async () => {
    const fd = new FormData();
    fd.append('stageKey', 'scope');
    const req = new Request(
      `http://localhost/api/v1/source/${EVENT_ID}/artifacts/upload`,
      { method: 'POST', body: fd },
    );
    const res = await POST(req, EVENT_PARAMS);
    expect(res.status).toBe(400);
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });

  it('rejects an oversized file (413)', async () => {
    const req = makeMultipartRequest(
      'huge.csv',
      CSV_MIME,
      MAX_SOURCE_ARTIFACT_SIZE_BYTES + 1,
    );
    const res = await POST(req, EVENT_PARAMS);
    expect(res.status).toBe(413);
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });

  it('rejects an unsupported mime type (415)', async () => {
    const req = makeMultipartRequest('evil.exe', 'application/x-msdownload', 64);
    const res = await POST(req, EVENT_PARAMS);
    expect(res.status).toBe(415);
    expect(storageUploadMock).not.toHaveBeenCalled();
    expect(registerSourceArtifactUploadMock).not.toHaveBeenCalled();
  });
});
