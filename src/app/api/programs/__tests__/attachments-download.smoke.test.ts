/**
 * @jest-environment node
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

const getAttachmentMock = jest.fn();
jest.mock('@/lib/programs/attachments', () => ({
  getAttachment: (...args: unknown[]) => getAttachmentMock(...args),
}));

const storageDownloadMock = jest.fn<Promise<Buffer>, [string, string]>();
jest.mock('@/lib/data-plane/objectStorage', () => ({
  getObjectStorageAdapter: () => ({
    download: (bucket: string, path: string) => storageDownloadMock(bucket, path),
  }),
}));

import { GET } from '@/app/api/programs/[id]/attachments/[attachmentId]/route';

const PROGRAM_ID = 'move-1';
const ATTACHMENT_ID = 'att-1';
const PARAMS = {
  params: Promise.resolve({ id: PROGRAM_ID, attachmentId: ATTACHMENT_ID }),
};

function attachment(overrides: Record<string, unknown> = {}) {
  return {
    id: ATTACHMENT_ID,
    tenantKey: 'apex-retail',
    programId: PROGRAM_ID,
    phase: 2,
    stepId: null,
    deliverableId: null,
    originalName: 'P2 Final Current-State View.docx',
    storagePath: 'apex-retail/move-1/att-1/P2 Final Current-State View.docx',
    uploaderUserId: 'u-1',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 12,
    sha256: 'abc',
    scanStatus: 'skipped',
    scanFindings: null,
    redactionState: 'none',
    createdAt: '2026-07-04T12:00:00Z',
    deletedAt: null,
    ...overrides,
  };
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
    industry_code: 'retail',
    key: 'apexretail',
  });
  getProgramByIdMock.mockResolvedValue({
    id: PROGRAM_ID,
    clientId: 'c-1',
    currentPhase: 2,
    archivedAt: null,
    deletedAt: null,
  });
  getAttachmentMock.mockResolvedValue(attachment());
  storageDownloadMock.mockResolvedValue(Buffer.from('download bytes', 'utf8'));
});

describe('GET /api/programs/[id]/attachments/[attachmentId]', () => {
  it('streams attachment bytes through the app instead of redirecting to Blob', async () => {
    const res = await GET(new Request('http://localhost/download'), PARAMS);

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
    expect(res.headers.get('x-abarva-download-proxy')).toBe('object-storage');
    expect(res.headers.get('content-type')).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(res.headers.get('content-disposition')).toBe(
      'attachment; filename="P2 Final Current-State View.docx"',
    );
    expect(Buffer.from(await res.arrayBuffer()).toString('utf8')).toBe('download bytes');
    expect(storageDownloadMock).toHaveBeenCalledWith(
      'program-attachments',
      'apex-retail/move-1/att-1/P2 Final Current-State View.docx',
    );
  });

  it('returns 401 when unauthenticated', async () => {
    requireTenancyMock.mockRejectedValue(new TestTenancyError('unauthenticated'));

    const res = await GET(new Request('http://localhost/download'), PARAMS);

    expect(res.status).toBe(401);
    expect(storageDownloadMock).not.toHaveBeenCalled();
  });

  it('returns 403 before storage when tenant or program ownership does not match', async () => {
    getAttachmentMock.mockResolvedValue(attachment({ tenantKey: 'other-tenant' }));

    const res = await GET(new Request('http://localhost/download'), PARAMS);

    expect(res.status).toBe(403);
    expect(storageDownloadMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the attachment row is missing or deleted', async () => {
    getAttachmentMock.mockResolvedValue(null);

    const res = await GET(new Request('http://localhost/download'), PARAMS);

    expect(res.status).toBe(404);
    expect(storageDownloadMock).not.toHaveBeenCalled();
  });

  it('returns download_failed when object storage cannot read the bytes', async () => {
    storageDownloadMock.mockRejectedValue(new Error('AuthorizationFailure'));

    const res = await GET(new Request('http://localhost/download'), PARAMS);
    const body = (await res.json()) as { error: string; detail: string };

    expect(res.status).toBe(500);
    expect(body.error).toBe('download_failed');
    expect(body.detail).toContain('AuthorizationFailure');
  });
});
