// Programs · Attachments · extract-text tests (OV2-4c).
//
// We mock @/lib/supabase-server (signed-URL creation) and the global
// fetch (signed-URL byte download) so the test stays hermetic. mammoth
// is mocked at the module level for the DOCX path — we don't need its
// full XML pipeline to assert that we route docx mime types through it
// and surface the extracted text.

import type { AttachmentRecord } from '../index';

// ── Mock @supabase/supabase-js client used by getServerSupabase ─────────────

type SignedUrlResult = { data: { signedUrl: string } | null; error: unknown };
let nextSignedUrl: SignedUrlResult = {
  data: { signedUrl: 'https://signed.example/url' },
  error: null,
};

const fakeStorage = {
  from: jest.fn(() => ({
    createSignedUrl: jest.fn(async () => nextSignedUrl),
  })),
};

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => ({
    storage: fakeStorage,
  }),
}));

// ── Mock mammoth so the DOCX path is deterministic ──────────────────────────

let mammothExtractRawTextResult: { value: string; messages: unknown[] } = {
  value: 'mammoth-extracted text from docx',
  messages: [],
};

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(async () => mammothExtractRawTextResult),
}));

// ── Mock global fetch that retrieves bytes from the signed URL ──────────────

let nextFetchPayload: { ok: boolean; status: number; bytes: Buffer } = {
  ok: true,
  status: 200,
  bytes: Buffer.from(''),
};

beforeEach(() => {
  nextSignedUrl = {
    data: { signedUrl: 'https://signed.example/url' },
    error: null,
  };
  nextFetchPayload = { ok: true, status: 200, bytes: Buffer.from('') };
  mammothExtractRawTextResult = {
    value: 'mammoth-extracted text from docx',
    messages: [],
  };
  (globalThis as unknown as { fetch: jest.Mock }).fetch = jest.fn(async () => ({
    ok: nextFetchPayload.ok,
    status: nextFetchPayload.status,
    arrayBuffer: async () =>
      nextFetchPayload.bytes.buffer.slice(
        nextFetchPayload.bytes.byteOffset,
        nextFetchPayload.bytes.byteOffset + nextFetchPayload.bytes.byteLength,
      ),
  }));
});

// Now import after mocks are registered.

import { extractAttachmentText, SNIPPET_MAX_CHARS } from '../extract-text';

const baseAttachment: AttachmentRecord = {
  id: 'att-1',
  tenantKey: 'apex-retail',
  programId: 'prog-1',
  phase: 1,
  stepId: null,
  deliverableId: null,
  originalName: 'meeting-notes.txt',
  storagePath: 'apex-retail/prog-1/att-1/meeting-notes.txt',
  uploaderUserId: 'user_1',
  mimeType: 'text/plain',
  sizeBytes: 100,
  sha256: 'a'.repeat(64),
  scanStatus: 'clean',
  scanFindings: null,
  redactionState: 'none',
  createdAt: '2026-04-29T12:00:00Z',
  deletedAt: null,
};

describe('extractAttachmentText', () => {
  it('returns plain-text content for text/plain', async () => {
    nextFetchPayload = {
      ok: true,
      status: 200,
      bytes: Buffer.from('Hello world\nLine two', 'utf-8'),
    };

    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'text/plain',
    });

    expect(preview).not.toBeNull();
    expect(preview?.parsingMethod).toBe('plain');
    expect(preview?.parsedTextSnippet).toBe('Hello world\nLine two');
    expect(preview?.truncated).toBe(false);
    expect(preview?.warnings).toEqual([]);
    expect(preview?.attachmentId).toBe('att-1');
    expect(preview?.originalName).toBe('meeting-notes.txt');
    expect(preview?.mimeType).toBe('text/plain');
  });

  it('returns markdown source as-is (no rendering) for text/markdown', async () => {
    const md = '# Heading\n\n- bullet one\n- bullet two\n\n> quote';
    nextFetchPayload = {
      ok: true,
      status: 200,
      bytes: Buffer.from(md, 'utf-8'),
    };

    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'text/markdown',
      originalName: 'notes.md',
    });

    expect(preview).not.toBeNull();
    expect(preview?.parsingMethod).toBe('markdown');
    expect(preview?.parsedTextSnippet).toBe(md);
    expect(preview?.truncated).toBe(false);
  });

  it('extracts DOCX text via mammoth.extractRawText', async () => {
    mammothExtractRawTextResult = {
      value: 'P1 stakeholder workshop\n\nAction items:\n1. CIO confirms budget',
      messages: [{ message: 'mammoth: ignored unknown style' }],
    };
    nextFetchPayload = {
      ok: true,
      status: 200,
      bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]), // ZIP magic — docx is a zip
    };

    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      originalName: 'meeting-notes.docx',
    });

    expect(preview).not.toBeNull();
    expect(preview?.parsingMethod).toBe('docx-mammoth');
    expect(preview?.parsedTextSnippet).toContain('P1 stakeholder workshop');
    expect(preview?.parsedTextSnippet).toContain('CIO confirms budget');
    expect(preview?.warnings).toContain('mammoth: ignored unknown style');
  });

  it('truncates content longer than SNIPPET_MAX_CHARS to a whitespace boundary', async () => {
    // Build a string with words separated by spaces, well over SNIPPET_MAX_CHARS.
    const word = 'lorem ';
    const big = word.repeat(Math.ceil((SNIPPET_MAX_CHARS * 1.5) / word.length));
    nextFetchPayload = {
      ok: true,
      status: 200,
      bytes: Buffer.from(big, 'utf-8'),
    };

    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'text/plain',
    });

    expect(preview).not.toBeNull();
    expect(preview?.truncated).toBe(true);
    expect(preview!.parsedTextSnippet.length).toBeLessThanOrEqual(SNIPPET_MAX_CHARS);
    // We trimmed at a whitespace boundary, so the snippet should not end
    // mid-word for this all-words input.
    expect(/\S$/.test(preview!.parsedTextSnippet)).toBe(true);
  });

  it('returns null for PDF (deferred binary format)', async () => {
    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'application/pdf',
      originalName: 'evidence.pdf',
    });
    expect(preview).toBeNull();
  });

  it('returns null for XLSX (deferred binary format)', async () => {
    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      originalName: 'baseline.xlsx',
    });
    expect(preview).toBeNull();
  });

  it('returns null for image/png', async () => {
    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'image/png',
      originalName: 'screenshot.png',
    });
    expect(preview).toBeNull();
  });

  it('returns null for image/jpeg', async () => {
    const preview = await extractAttachmentText({
      ...baseAttachment,
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg',
    });
    expect(preview).toBeNull();
  });

  it('throws when the signed URL fetch fails (caller must catch)', async () => {
    nextSignedUrl = { data: null, error: { message: 'bucket missing' } };
    await expect(
      extractAttachmentText({
        ...baseAttachment,
        mimeType: 'text/plain',
      }),
    ).rejects.toThrow(/signed_url_failed/);
  });

  it('throws when the storage GET returns a non-200 (caller must catch)', async () => {
    nextFetchPayload = { ok: false, status: 404, bytes: Buffer.from('') };
    await expect(
      extractAttachmentText({
        ...baseAttachment,
        mimeType: 'text/plain',
      }),
    ).rejects.toThrow(/storage_fetch_failed/);
  });
});
