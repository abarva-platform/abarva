/**
 * @jest-environment node
 */

// /api/programs/[id]/attachments/upload · OV2-4b smoke tests
//
// Narrow checks against the route handler — we mock requireTenancy,
// getActiveClientRow, getProgramById, getServerSupabase, and
// recordAttachmentUpload so the route can run end-to-end without a
// live Supabase or Clerk session. We're not unit-testing the helpers
// here (they're already covered) — we're confirming the route's
// dispatch logic: 401 without auth, 415 for unsupported mime, 413 for
// oversize, 200 with the record body on success.

import {
  ATTACHMENT_MIME_ALLOWLIST,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@/lib/programs/attachments/mime';

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

const loadUserProgramAccessPolicyMock = jest.fn();
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: (...args: unknown[]) =>
    loadUserProgramAccessPolicyMock(...args),
}));

const recordAttachmentUploadMock = jest.fn();
const buildStoragePathMock = jest.fn(
  ({
    tenantKey,
    programId,
    attachmentId,
    filename,
  }: {
    tenantKey: string;
    programId: string;
    attachmentId: string;
    filename: string;
  }) => `${tenantKey}/${programId}/${attachmentId}/${filename}`,
);
jest.mock('@/lib/programs/attachments', () => ({
  recordAttachmentUpload: (input: Record<string, unknown>) =>
    recordAttachmentUploadMock(input),
  buildStoragePath: (args: {
    tenantKey: string;
    programId: string;
    attachmentId: string;
    filename: string;
  }) => buildStoragePathMock(args),
}));

const recordProgramEvidenceMock = jest.fn();
const extractProgramEvidenceFromUploadBufferMock = jest.fn(
  (args: { filename: string; mimeType: string }) => ({
    evidenceType: args.mimeType === 'application/pdf'
      ? 'uploaded_artifact'
      : args.filename.includes('workshop')
        ? 'workshop_output'
        : 'meeting_notes',
    title: args.filename,
    summary: 'Parsed evidence summary',
    extractedText: 'Parsed text',
    extractedStructured: {
      decisions: [],
      action_items: [],
      risks: [],
      baseline_candidates: [],
      attendees: [],
      parse_method: args.mimeType === 'application/pdf'
        ? 'pdf-parse'
        : args.mimeType.includes('wordprocessingml')
          ? 'docx-mammoth'
          : args.mimeType.includes('spreadsheetml')
            ? 'exceljs-xlsx'
            : 'text-line-parser',
      warnings: [],
    },
    confidence: 0.78,
  }),
);
jest.mock('@/lib/programs/evidence-ingestion', () => ({
  extractProgramEvidenceFromUploadBuffer: (...args: unknown[]) =>
    extractProgramEvidenceFromUploadBufferMock(
      ...(args as [Parameters<typeof extractProgramEvidenceFromUploadBufferMock>[0]]),
    ),
  recordProgramEvidence: (...args: unknown[]) => recordProgramEvidenceMock(...args),
}));

type UploadArgs = [string, unknown, unknown];
const storageUploadMock = jest.fn<Promise<{ error: null }>, UploadArgs>(async () => ({
  error: null,
}));
const storageRemoveMock = jest.fn<
  Promise<{ data: null; error: null }>,
  [string[]]
>(async () => ({ data: null, error: null }));
jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    storage: {
      from: () => ({
        upload: (path: string, body: unknown, opts: unknown) =>
          storageUploadMock(path, body, opts),
        remove: (paths: string[]) => storageRemoveMock(paths),
      }),
    },
  }),
}));

// Import AFTER all mocks are registered.
import { POST } from '@/app/api/programs/[id]/attachments/upload/route';

const PROGRAM_ID = 'eng-1';
const PROGRAM_PARAMS = { params: Promise.resolve({ id: PROGRAM_ID }) };

function makeMultipartRequest(
  filename: string,
  mime: string,
  bytes: number,
  fields: Record<string, string> = {},
): Request {
  const fd = new FormData();
  fd.append(
    'file',
    new File([new Uint8Array(bytes)], filename, { type: mime }),
  );
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return new Request('http://localhost/api/programs/eng-1/attachments/upload', {
    method: 'POST',
    body: fd,
  });
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
    currentPhase: 1,
    archivedAt: null,
    deletedAt: null,
  });
  loadUserProgramAccessPolicyMock.mockResolvedValue({
    canUploadArtifacts: true,
  });
  recordAttachmentUploadMock.mockImplementation(
    async (input: Record<string, unknown>) => ({
      id: 'att-1',
      tenantKey: input.tenantKey,
      programId: input.programId,
      phase: input.phase ?? null,
      stepId: input.stepId ?? null,
      deliverableId: input.deliverableId ?? null,
      originalName: input.originalName,
      storagePath: input.storagePath,
      uploaderUserId: input.uploaderUserId,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      sha256: input.sha256,
      scanStatus: input.scanStatus ?? 'pending',
      scanFindings: input.scanFindings ?? null,
      redactionState: 'none',
      createdAt: '2026-04-29T12:00:00Z',
      deletedAt: null,
    }),
  );
  recordProgramEvidenceMock.mockResolvedValue('evidence-1');
});

describe('POST /api/programs/[id]/attachments/upload', () => {
  it('returns 401 when unauthenticated', async () => {
    requireTenancyMock.mockRejectedValue(new TestTenancyError('unauthenticated'));
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(401);
  });

  it('returns 403 when the program does not belong to the tenant', async () => {
    getProgramByIdMock.mockResolvedValue(null);
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(403);
  });

  it('returns 415 for an unsupported mime type', async () => {
    const req = makeMultipartRequest('script.exe', 'application/x-msdownload', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unsupported_mime');
  });

  it('returns 413 when the file is over the size cap', async () => {
    const req = makeMultipartRequest(
      'huge.pdf',
      'application/pdf',
      MAX_ATTACHMENT_SIZE_BYTES + 1,
    );
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('oversize');
  });

  it('returns 410 for an archived program', async () => {
    getProgramByIdMock.mockResolvedValue({
      id: PROGRAM_ID,
      clientId: 'c-1',
      archivedAt: '2026-04-29T00:00:00Z',
      deletedAt: null,
    });
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(410);
  });

  it('returns 403 when the user lacks upload rights', async () => {
    loadUserProgramAccessPolicyMock.mockResolvedValue({
      canUploadArtifacts: false,
    });
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'upload_not_permitted' });
    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it('returns 200 with the attachment record on success', async () => {
    const req = makeMultipartRequest('baseline.pdf', 'application/pdf', 1024);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachment: { id: string; originalName: string; mimeType: string };
      evidence: {
        id: string;
        status: string;
        parseMethod: string;
        warnings: string[];
      };
    };
    expect(body.attachment.id).toBe('att-1');
    expect(body.attachment.originalName).toBe('baseline.pdf');
    expect(body.attachment.mimeType).toBe('application/pdf');
    expect(body.evidence).toEqual({
      id: 'evidence-1',
      status: 'captured',
      parseMethod: 'pdf-parse',
      warnings: [],
    });
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    expect(recordAttachmentUploadMock).toHaveBeenCalledTimes(1);
    expect(recordProgramEvidenceMock).toHaveBeenCalledTimes(1);
    expect(recordAttachmentUploadMock.mock.calls[0][0]).toMatchObject({
      phase: 1,
      scanStatus: 'skipped',
      scanFindings: expect.objectContaining({
        reason: 'synchronous_evidence_extraction_only',
      }),
    });
    expect(recordProgramEvidenceMock.mock.calls[0][1]).toMatchObject({
      phase: 1,
    });
  });

  it('lets an explicit phase override the program current phase', async () => {
    const req = makeMultipartRequest('design-notes.txt', 'text/plain', 128, {
      phase: '2',
    });
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(200);
    expect(recordAttachmentUploadMock.mock.calls[0][0]).toMatchObject({
      phase: 2,
    });
    expect(recordProgramEvidenceMock.mock.calls[0][1]).toMatchObject({
      phase: 2,
    });
  });

  it('reports text parsing metadata when the uploaded evidence was text-parsed', async () => {
    const req = makeMultipartRequest('workshop-notes.txt', 'text/plain', 1024);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachment: { scanStatus: string; scanFindings: Record<string, unknown> | null };
      evidence: { id: string; status: string; parseMethod: string; warnings: string[] };
    };
    expect(body.attachment.scanStatus).toBe('skipped');
    expect(body.attachment.scanFindings).toMatchObject({
      reason: 'synchronous_evidence_extraction_only',
    });
    expect(body.evidence).toEqual({
      id: 'evidence-1',
      status: 'captured',
      parseMethod: 'text-line-parser',
      warnings: [],
    });
    expect(recordAttachmentUploadMock.mock.calls[0][0]).toMatchObject({
      scanStatus: 'skipped',
      scanFindings: expect.objectContaining({
        reason: 'synchronous_evidence_extraction_only',
      }),
    });
  });

  it('captures DOCX uploads as structured program evidence', async () => {
    const req = makeMultipartRequest(
      'sponsor-workshop-notes.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      1024,
    );
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachment: { scanStatus: string };
      evidence: { id: string; status: string; parseMethod: string };
    };
    expect(body.attachment.scanStatus).toBe('skipped');
    expect(body.evidence).toMatchObject({
      id: 'evidence-1',
      status: 'captured',
      parseMethod: 'docx-mammoth',
    });
    expect(extractProgramEvidenceFromUploadBufferMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'sponsor-workshop-notes.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        buffer: expect.any(Buffer),
      }),
    );
    expect(recordProgramEvidenceMock.mock.calls[0][1]).toMatchObject({
      evidenceType: 'workshop_output',
      attachmentId: 'att-1',
    });
  });

  it('captures XLSX uploads as structured program evidence', async () => {
    const req = makeMultipartRequest(
      'baseline-workshop-output.xlsx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      1024,
    );
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      attachment: { scanStatus: string };
      evidence: { id: string; status: string; parseMethod: string };
    };
    expect(body.attachment.scanStatus).toBe('skipped');
    expect(body.evidence).toMatchObject({
      id: 'evidence-1',
      status: 'captured',
      parseMethod: 'exceljs-xlsx',
    });
    expect(recordProgramEvidenceMock.mock.calls[0][1]).toMatchObject({
      evidenceType: 'workshop_output',
      attachmentId: 'att-1',
    });
  });

  it('cleans up the bucket object when metadata insert fails', async () => {
    recordAttachmentUploadMock.mockRejectedValue(new Error('insert failed'));
    const req = makeMultipartRequest('x.pdf', 'application/pdf', 100);
    const res = await POST(req, PROGRAM_PARAMS);
    expect(res.status).toBe(500);
    expect(storageRemoveMock).toHaveBeenCalledTimes(1);
  });

  it('confirms the mime allowlist agrees with the client constant', () => {
    // Sanity — this is the contract the upload-client pre-flight uses.
    expect(ATTACHMENT_MIME_ALLOWLIST).toContain('application/pdf');
    expect(ATTACHMENT_MIME_ALLOWLIST).toContain('image/png');
    expect(ATTACHMENT_MIME_ALLOWLIST).not.toContain('application/x-msdownload');
  });
});
