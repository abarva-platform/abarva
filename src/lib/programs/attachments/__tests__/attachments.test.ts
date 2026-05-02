// Programs · Attachments · server helpers tests.
//
// We mock @/lib/supabase-server so we don't depend on a live DB. The
// validation paths (mime allowlist + size cap), the row → record
// transform, and the buildStoragePath pure function are all
// exercised here. The actual SQL semantics (RLS, soft-delete via
// UPDATE WHERE deleted_at IS NULL, etc.) are validated against the
// migration in the live preview branch — see PR description's
// "manual apply" checklist.

import type { AttachmentRecord, CreateAttachmentInput } from '../index';

type Row = {
  id: string;
  tenant_key: string;
  program_id: string;
  phase: number | null;
  step_id: string | null;
  deliverable_id: string | null;
  original_name: string;
  storage_path: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  scan_status: 'pending' | 'clean' | 'infected' | 'errored' | 'skipped';
  scan_findings: Record<string, unknown> | null;
  redaction_state: 'none' | 'partial' | 'redacted';
  created_at: string;
  deleted_at: string | null;
};

interface FakeBuilder {
  insert: jest.Mock;
  update: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  is: jest.Mock;
  order: jest.Mock;
  single: jest.Mock<Promise<{ data: Row | null; error: unknown }>, []>;
  maybeSingle: jest.Mock<Promise<{ data: Row | null; error: unknown }>, []>;
  // Allows the caller to await the builder directly (Supabase's
  // .order(...) result is itself a thenable resolving to {data,error}).
  then: jest.Mock;
}

interface InsertCapture {
  table: string;
  payload: Record<string, unknown>;
}
interface UpdateCapture {
  table: string;
  payload: Record<string, unknown>;
  filters: Array<{ kind: 'eq' | 'is'; col: string; value: unknown }>;
}
interface SelectCapture {
  table: string;
  filters: Array<{ kind: 'eq' | 'is'; col: string; value: unknown }>;
}

const insertCaptures: InsertCapture[] = [];
const updateCaptures: UpdateCapture[] = [];
const selectCaptures: SelectCapture[] = [];

let nextSingle: () => Promise<{ data: Row | null; error: unknown }> = async () => ({
  data: null,
  error: null,
});
let nextMaybeSingle: () => Promise<{ data: Row | null; error: unknown }> = async () => ({
  data: null,
  error: null,
});
let nextList: () => Promise<{ data: Row[]; error: unknown }> = async () => ({
  data: [],
  error: null,
});

function makeBuilder(table: string): FakeBuilder {
  const filters: Array<{ kind: 'eq' | 'is'; col: string; value: unknown }> = [];
  let mode: 'insert' | 'update' | 'select' | null = null;
  const builder: FakeBuilder = {
    insert: jest.fn((payload: Record<string, unknown>) => {
      mode = 'insert';
      insertCaptures.push({ table, payload });
      return builder;
    }),
    update: jest.fn((payload: Record<string, unknown>) => {
      mode = 'update';
      // updateCaptures filled at end via select() → single()
      updateCaptures.push({ table, payload, filters });
      return builder;
    }),
    select: jest.fn(() => {
      if (mode === null) {
        mode = 'select';
        selectCaptures.push({ table, filters });
      }
      return builder;
    }),
    eq: jest.fn((col: string, value: unknown) => {
      filters.push({ kind: 'eq', col, value });
      return builder;
    }),
    is: jest.fn((col: string, value: unknown) => {
      filters.push({ kind: 'is', col, value });
      return builder;
    }),
    order: jest.fn(() => builder),
    single: jest.fn(() => nextSingle()),
    maybeSingle: jest.fn(() => nextMaybeSingle()),
    then: jest.fn((resolve: (v: { data: Row[]; error: unknown }) => unknown) =>
      nextList().then(resolve),
    ),
  };
  return builder;
}

const fakeClient = {
  from: jest.fn((table: string) => makeBuilder(table)),
};

jest.mock('@/lib/supabase-server', () => ({
  getServerSupabase: () => fakeClient,
}));

// Now import after mock is registered.

import {
  buildStoragePath,
  getAttachment,
  listAttachmentsForPhase,
  listAttachmentsForProgram,
  recordAttachmentUpload,
  softDeleteAttachment,
} from '../index';

const baseInput: CreateAttachmentInput = {
  tenantKey: 'apex-retail',
  programId: '11111111-1111-1111-1111-111111111111',
  phase: 1,
  stepId: 'p1-baseline-capture',
  originalName: 'baseline.pdf',
  uploaderUserId: 'user_123',
  mimeType: 'application/pdf',
  sizeBytes: 1024,
  sha256: 'a'.repeat(64),
  storagePath:
    'apex-retail/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222/baseline.pdf',
};

const baseRow: Row = {
  id: '22222222-2222-2222-2222-222222222222',
  tenant_key: baseInput.tenantKey,
  program_id: baseInput.programId,
  phase: baseInput.phase ?? null,
  step_id: baseInput.stepId ?? null,
  deliverable_id: null,
  original_name: baseInput.originalName,
  storage_path: baseInput.storagePath,
  uploader_user_id: baseInput.uploaderUserId,
  mime_type: baseInput.mimeType,
  size_bytes: baseInput.sizeBytes,
  sha256: baseInput.sha256,
  scan_status: 'pending',
  scan_findings: null,
  redaction_state: 'none',
  created_at: '2026-04-29T12:00:00Z',
  deleted_at: null,
};

beforeEach(() => {
  insertCaptures.length = 0;
  updateCaptures.length = 0;
  selectCaptures.length = 0;
  nextSingle = async () => ({ data: null, error: null });
  nextMaybeSingle = async () => ({ data: null, error: null });
  nextList = async () => ({ data: [], error: null });
});

describe('recordAttachmentUpload', () => {
  it('rejects a disallowed mime type before touching the DB', async () => {
    await expect(
      recordAttachmentUpload({ ...baseInput, mimeType: 'application/x-msdownload' }),
    ).rejects.toThrow(/not in the allowlist/);
    expect(insertCaptures).toHaveLength(0);
  });

  it('rejects a zero-byte file', async () => {
    await expect(
      recordAttachmentUpload({ ...baseInput, sizeBytes: 0 }),
    ).rejects.toThrow(/sizeBytes/);
    expect(insertCaptures).toHaveLength(0);
  });

  it('rejects an oversized file (>100 MB)', async () => {
    await expect(
      recordAttachmentUpload({ ...baseInput, sizeBytes: 200_000_000 }),
    ).rejects.toThrow(/sizeBytes/);
    expect(insertCaptures).toHaveLength(0);
  });

  it('rejects a phase outside [0,6]', async () => {
    await expect(recordAttachmentUpload({ ...baseInput, phase: 7 })).rejects.toThrow(
      /phase/,
    );
    await expect(recordAttachmentUpload({ ...baseInput, phase: -1 })).rejects.toThrow(
      /phase/,
    );
  });

  it('rejects missing required string fields', async () => {
    await expect(
      recordAttachmentUpload({ ...baseInput, tenantKey: '' }),
    ).rejects.toThrow(/tenantKey/);
    await expect(
      recordAttachmentUpload({ ...baseInput, originalName: '' }),
    ).rejects.toThrow(/originalName/);
    await expect(
      recordAttachmentUpload({ ...baseInput, uploaderUserId: '' }),
    ).rejects.toThrow(/uploaderUserId/);
    await expect(
      recordAttachmentUpload({ ...baseInput, sha256: '' }),
    ).rejects.toThrow(/sha256/);
  });

  it('inserts and returns the record with defaults populated on success', async () => {
    nextSingle = async () => ({ data: baseRow, error: null });

    const rec: AttachmentRecord = await recordAttachmentUpload(baseInput);

    expect(insertCaptures).toHaveLength(1);
    expect(insertCaptures[0].table).toBe('program_attachments');
    expect(insertCaptures[0].payload).toMatchObject({
      tenant_key: baseInput.tenantKey,
      program_id: baseInput.programId,
      phase: 1,
      step_id: 'p1-baseline-capture',
      original_name: 'baseline.pdf',
      uploader_user_id: 'user_123',
      mime_type: 'application/pdf',
      size_bytes: 1024,
      sha256: 'a'.repeat(64),
    });

    expect(rec.id).toBe(baseRow.id);
    expect(rec.scanStatus).toBe('pending');
    expect(rec.redactionState).toBe('none');
    expect(rec.deletedAt).toBeNull();
    expect(rec.scanFindings).toBeNull();
  });

  it('coerces a bigint-as-string size_bytes back to number', async () => {
    nextSingle = async () => ({
      data: { ...baseRow, size_bytes: '4096' as unknown as number },
      error: null,
    });
    const rec = await recordAttachmentUpload(baseInput);
    expect(rec.sizeBytes).toBe(4096);
    expect(typeof rec.sizeBytes).toBe('number');
  });

  it('passes optional phase=undefined as NULL in the payload', async () => {
    nextSingle = async () => ({ data: baseRow, error: null });
    const { phase: _omitPhase, ...rest } = baseInput;
    void _omitPhase;
    await recordAttachmentUpload(rest);
    expect(insertCaptures[0].payload.phase).toBeNull();
  });

  it('can persist an explicit skipped scan status with findings for synchronously parsed text evidence', async () => {
    nextSingle = async () => ({
      data: {
        ...baseRow,
        mime_type: 'text/plain',
        scan_status: 'skipped',
        scan_findings: { reason: 'synchronous_text_parse_only' },
      },
      error: null,
    });

    const rec: AttachmentRecord = await recordAttachmentUpload({
      ...baseInput,
      originalName: 'workshop-notes.txt',
      mimeType: 'text/plain',
      scanStatus: 'skipped',
      scanFindings: { reason: 'synchronous_text_parse_only' },
    });

    expect(insertCaptures[0].payload).toMatchObject({
      scan_status: 'skipped',
      scan_findings: { reason: 'synchronous_text_parse_only' },
    });
    expect(rec.scanStatus).toBe('skipped');
    expect(rec.scanFindings).toEqual({ reason: 'synchronous_text_parse_only' });
  });
});

describe('listAttachmentsForProgram', () => {
  it('queries program_attachments scoped to program_id and excludes deleted rows', async () => {
    nextList = async () => ({ data: [baseRow], error: null });

    const items = await listAttachmentsForProgram(baseInput.programId);
    expect(items).toHaveLength(1);
    expect(items[0].programId).toBe(baseInput.programId);

    expect(selectCaptures).toHaveLength(1);
    const sel = selectCaptures[0];
    expect(sel.table).toBe('program_attachments');
    expect(sel.filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'program_id', value: baseInput.programId },
        { kind: 'is', col: 'deleted_at', value: null },
      ]),
    );
  });

  it('throws on missing programId', async () => {
    await expect(listAttachmentsForProgram('')).rejects.toThrow(/programId/);
  });
});

describe('listAttachmentsForPhase', () => {
  it('filters by program_id AND phase AND excludes deleted', async () => {
    nextList = async () => ({ data: [baseRow], error: null });
    const items = await listAttachmentsForPhase(baseInput.programId, 1);
    expect(items).toHaveLength(1);
    expect(selectCaptures[0].filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'program_id', value: baseInput.programId },
        { kind: 'eq', col: 'phase', value: 1 },
        { kind: 'is', col: 'deleted_at', value: null },
      ]),
    );
  });

  it('rejects out-of-range phase', async () => {
    await expect(
      listAttachmentsForPhase(baseInput.programId, 7),
    ).rejects.toThrow(/phase/);
    await expect(
      listAttachmentsForPhase(baseInput.programId, -1),
    ).rejects.toThrow(/phase/);
  });
});

describe('getAttachment', () => {
  it('returns null when no row found', async () => {
    nextMaybeSingle = async () => ({ data: null, error: null });
    const rec = await getAttachment('nonexistent');
    expect(rec).toBeNull();
  });

  it('returns the record when found', async () => {
    nextMaybeSingle = async () => ({ data: baseRow, error: null });
    const rec = await getAttachment(baseRow.id);
    expect(rec?.id).toBe(baseRow.id);
  });

  it('throws on missing id', async () => {
    await expect(getAttachment('')).rejects.toThrow(/attachmentId/);
  });
});

describe('softDeleteAttachment', () => {
  it('issues an UPDATE setting deleted_at, not a DELETE', async () => {
    const deletedRow: Row = {
      ...baseRow,
      deleted_at: '2026-04-29T13:00:00Z',
    };
    nextSingle = async () => ({ data: deletedRow, error: null });

    const rec = await softDeleteAttachment(baseRow.id, 'user_123');

    expect(updateCaptures).toHaveLength(1);
    expect(updateCaptures[0].table).toBe('program_attachments');
    expect(updateCaptures[0].payload).toHaveProperty('deleted_at');
    expect(typeof updateCaptures[0].payload.deleted_at).toBe('string');
    expect(updateCaptures[0].filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'id', value: baseRow.id },
        { kind: 'is', col: 'deleted_at', value: null },
      ]),
    );

    expect(rec.deletedAt).toBe(deletedRow.deleted_at);
  });

  it('throws on missing id or actingUserId', async () => {
    await expect(softDeleteAttachment('', 'u')).rejects.toThrow(/attachmentId/);
    await expect(softDeleteAttachment('a', '')).rejects.toThrow(/actingUserId/);
  });
});

describe('buildStoragePath', () => {
  const tenantKey = 'apex-retail';
  const programId = '11111111-1111-1111-1111-111111111111';
  const attachmentId = '22222222-2222-2222-2222-222222222222';

  it('produces the canonical {tenant}/{program}/{attachment}/{name} pattern', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: 'baseline.pdf',
    });
    expect(path).toBe(`${tenantKey}/${programId}/${attachmentId}/baseline.pdf`);
  });

  it('replaces forward slashes in filename with underscores', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: 'evil/../../../etc/passwd',
    });
    expect(path.startsWith(`${tenantKey}/${programId}/${attachmentId}/`)).toBe(true);
    const tail = path.slice(`${tenantKey}/${programId}/${attachmentId}/`.length);
    expect(tail).not.toContain('/');
    expect(tail).not.toContain('\\');
  });

  it('replaces backslashes too', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: String.raw`C:\Users\evil\file.pdf`,
    });
    expect(path).not.toContain('\\');
  });

  it('lowercases the file extension only (preserves base case)', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: 'MyBaseline.PDF',
    });
    expect(path.endsWith('/MyBaseline.pdf')).toBe(true);
  });

  it('collapses whitespace runs into a single underscore', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: 'hello   world.pdf',
    });
    expect(path.endsWith('/hello_world.pdf')).toBe(true);
  });

  it('strips leading dots (no hidden files)', () => {
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: '.htaccess.pdf',
    });
    expect(path).toMatch(/\/htaccess\.pdf$/);
  });

  it('caps the total path at 200 chars while preserving the extension', () => {
    const long = 'a'.repeat(500) + '.pdf';
    const path = buildStoragePath({
      tenantKey,
      programId,
      attachmentId,
      filename: long,
    });
    expect(path.length).toBeLessThanOrEqual(200);
    expect(path.endsWith('.pdf')).toBe(true);
  });

  it('rejects empty / whitespace-only filenames', () => {
    expect(() =>
      buildStoragePath({ tenantKey, programId, attachmentId, filename: '' }),
    ).toThrow(/filename/);
    expect(() =>
      buildStoragePath({ tenantKey, programId, attachmentId, filename: '    ' }),
    ).toThrow(/filename/);
  });

  it('rejects filenames that sanitize to empty', () => {
    expect(() =>
      buildStoragePath({ tenantKey, programId, attachmentId, filename: '////' }),
    ).toThrow(/empty sanitized name/);
    expect(() =>
      buildStoragePath({ tenantKey, programId, attachmentId, filename: '...' }),
    ).toThrow(/empty sanitized name/);
  });

  it('rejects missing required identifiers', () => {
    expect(() =>
      buildStoragePath({ tenantKey: '', programId, attachmentId, filename: 'x.pdf' }),
    ).toThrow(/tenantKey/);
    expect(() =>
      buildStoragePath({ tenantKey, programId: '', attachmentId, filename: 'x.pdf' }),
    ).toThrow(/programId/);
    expect(() =>
      buildStoragePath({ tenantKey, programId, attachmentId: '', filename: 'x.pdf' }),
    ).toThrow(/attachmentId/);
  });
});
