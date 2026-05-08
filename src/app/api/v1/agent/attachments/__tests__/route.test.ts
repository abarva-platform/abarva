/**
 * @jest-environment node
 */

// /api/v1/agent/attachments · POST tests
//
// We mock Clerk currentUser, getActiveClientRow, getServerSupabase
// (storage + .from()), and the text-extraction helper so the route
// runs end-to-end without a live Supabase or Clerk session.

const currentUserMock = jest.fn();
jest.mock('@clerk/nextjs/server', () => ({
  currentUser: () => currentUserMock(),
}));

const getActiveClientRowMock = jest.fn();
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: () => getActiveClientRowMock(),
}));

const extractAgentAttachmentTextMock = jest.fn();
jest.mock('@/lib/agent/attachments', () => {
  const actual = jest.requireActual('@/lib/agent/attachments');
  return {
    ...actual,
    extractAgentAttachmentText: (
      args: { filename: string; mimeType: string; buffer: Buffer },
    ) => extractAgentAttachmentTextMock(args),
  };
});

type UploadArgs = [string, unknown, unknown];
const storageUploadMock = jest.fn<
  Promise<{ error: null | { message: string } }>,
  UploadArgs
>(async () => ({ error: null }));
const storageRemoveMock = jest.fn<
  Promise<{ data: null; error: null }>,
  [string[]]
>(async () => ({ data: null, error: null }));
const insertMock = jest.fn<
  Promise<{ error: null | { message: string } }>,
  [Record<string, unknown>]
>(async () => ({ error: null }));

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    storage: {
      from: () => ({
        upload: (path: string, body: unknown, opts: unknown) =>
          storageUploadMock(path, body, opts),
        remove: (paths: string[]) => storageRemoveMock(paths),
      }),
    },
    from: () => ({
      insert: (row: Record<string, unknown>) => insertMock(row),
    }),
  }),
}));

// Import AFTER mocks
import { POST } from '@/app/api/v1/agent/attachments/route';

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
  return new Request('http://localhost/api/v1/agent/attachments', {
    method: 'POST',
    body: fd,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  currentUserMock.mockResolvedValue({
    id: 'user_123',
    primaryEmailAddress: { emailAddress: 'a@b.test' },
    emailAddresses: [],
    publicMetadata: {},
  });
  getActiveClientRowMock.mockResolvedValue({
    id: 'tenant-uuid-1',
    name: 'Apex Retail',
    industry_code: 'retail',
    key: 'apexretail',
  });
  extractAgentAttachmentTextMock.mockResolvedValue('extracted text');
  storageUploadMock.mockResolvedValue({ error: null });
  insertMock.mockResolvedValue({ error: null });
});

describe('POST /api/v1/agent/attachments', () => {
  it('rejects unauthenticated callers with 401', async () => {
    currentUserMock.mockResolvedValue(null);
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100, { surface: 'source/new' });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it('returns 400 when surface is missing', async () => {
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100);
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it('returns 415 for an unsupported mime', async () => {
    const req = makeMultipartRequest('x.exe', 'application/x-msdownload', 100, {
      surface: 'source/new',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('unsupported_mime');
  });

  it('returns 413 when the file exceeds the size cap', async () => {
    const req = makeMultipartRequest('huge.pdf', 'application/pdf', 26 * 1024 * 1024, {
      surface: 'source/new',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(413);
  });

  it('returns 404 when no active tenant is bound', async () => {
    getActiveClientRowMock.mockResolvedValue(null);
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100, {
      surface: 'source/new',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(404);
  });

  it('accepts a PDF and returns the extracted text preview', async () => {
    extractAgentAttachmentTextMock.mockResolvedValue('PDF text body');
    const req = makeMultipartRequest('handbook.pdf', 'application/pdf', 1024, {
      surface: 'source/new',
      agent: 'sentinel',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      id: string;
      file_name: string;
      mime: string;
      bytes: number;
      storage_path: string;
      extracted_text_preview: string;
    };
    expect(body.file_name).toBe('handbook.pdf');
    expect(body.mime).toBe('application/pdf');
    expect(body.bytes).toBe(1024);
    expect(body.storage_path).toMatch(/^tenant-uuid-1\/user_123\//);
    expect(body.extracted_text_preview).toBe('PDF text body');
    expect(storageUploadMock).toHaveBeenCalledTimes(1);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow).toMatchObject({
      tenant_id: 'tenant-uuid-1',
      user_id: 'user_123',
      surface: 'source/new',
      agent: 'sentinel',
      file_name: 'handbook.pdf',
      mime: 'application/pdf',
      bytes: 1024,
      extracted_text: 'PDF text body',
    });
  });

  it.each([
    ['note.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ['table.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['rows.csv', 'text/csv'],
    ['readme.txt', 'text/plain'],
    ['notes.md', 'text/markdown'],
    ['screenshot.png', 'image/png'],
  ])('accepts %s (%s)', async (filename, mime) => {
    const req = makeMultipartRequest(filename, mime, 256, { surface: 'source/new' });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { mime: string };
    expect(body.mime).toBe(mime);
  });

  it('rolls back the blob if the metadata insert fails', async () => {
    insertMock.mockResolvedValue({ error: { message: 'unique violation' } });
    const req = makeMultipartRequest('a.pdf', 'application/pdf', 100, {
      surface: 'source/new',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(500);
    expect(storageRemoveMock).toHaveBeenCalledTimes(1);
  });

  it('falls through with empty extracted_text_preview when extraction yields empty', async () => {
    extractAgentAttachmentTextMock.mockResolvedValue('');
    const req = makeMultipartRequest('photo.png', 'image/png', 200, {
      surface: 'source/new',
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { extracted_text_preview: string };
    expect(body.extracted_text_preview).toBe('');
    const insertedRow = insertMock.mock.calls[0][0];
    expect(insertedRow.extracted_text).toBeNull();
  });
});
