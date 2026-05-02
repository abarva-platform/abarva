// Source · Artifact Registry helper tests.
//
// Mocks Supabase so this stays deterministic. SQL/storage semantics live in
// the migration; these tests cover validation, row mapping, query scoping,
// state updates, soft-delete, and safe blob-path construction.

import type {
  RegisterSourceArtifactInput,
  SourceArtifactRegistryRecord,
} from '../index';
import type { SourceStageKey } from '../../types';

type Row = {
  id: string;
  tenant_key: string;
  source_event_id: string;
  source_event_row_id: string | null;
  stage_key: SourceStageKey;
  artifact_family: 'proposal';
  artifact_kind: string;
  source_origin: 'uploaded';
  source_format: 'pdf';
  original_name: string;
  blob_uri: string;
  uploader_user_id: string;
  mime_type: string;
  size_bytes: number | string;
  sha256: string;
  parse_status: 'pending' | 'parsed';
  embedding_status: 'pending' | 'embedded';
  graph_status: 'pending' | 'projected';
  classification_status: 'pending' | 'classified';
  data_classification: 'Confidential';
  evidence_state: 'unparsed' | 'parsed_uncited';
  approval_state: 'draft' | 'approved';
  version: number | string;
  supersedes_artifact_version_id: string | null;
  created_by: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
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

import {
  buildSourceArtifactBlobPath,
  getSourceArtifactRegistryRecord,
  listSourceArtifactsForEvent,
  listSourceArtifactsForStage,
  registerSourceArtifactUpload,
  softDeleteSourceArtifact,
  updateSourceArtifactProcessingState,
} from '../index';

const baseInput: RegisterSourceArtifactInput = {
  tenantKey: 'apex-retail',
  sourceEventId: 'apex-retail-ams-outsourcing-2026',
  stageKey: 'orals_bafo',
  artifactFamily: 'proposal',
  artifactKind: 'vendor_proposal',
  sourceOrigin: 'uploaded',
  sourceFormat: 'pdf',
  originalName: 'northstar-bafo.pdf',
  blobUri: 'apex-retail/apex-retail-ams-outsourcing-2026/artifact-123/northstar-bafo.pdf',
  uploaderUserId: 'user_123',
  mimeType: 'application/pdf',
  sizeBytes: 4096,
  sha256: 'b'.repeat(64),
};

const baseRow: Row = {
  id: 'artifact-123',
  tenant_key: baseInput.tenantKey,
  source_event_id: baseInput.sourceEventId,
  source_event_row_id: null,
  stage_key: 'orals_bafo',
  artifact_family: 'proposal',
  artifact_kind: baseInput.artifactKind,
  source_origin: 'uploaded',
  source_format: 'pdf',
  original_name: baseInput.originalName,
  blob_uri: baseInput.blobUri,
  uploader_user_id: baseInput.uploaderUserId,
  mime_type: baseInput.mimeType,
  size_bytes: baseInput.sizeBytes,
  sha256: baseInput.sha256,
  parse_status: 'pending',
  embedding_status: 'pending',
  graph_status: 'pending',
  classification_status: 'pending',
  data_classification: 'Confidential',
  evidence_state: 'unparsed',
  approval_state: 'draft',
  version: 1,
  supersedes_artifact_version_id: null,
  created_by: 'user_123',
  validated_by: null,
  created_at: '2026-04-30T12:00:00Z',
  updated_at: '2026-04-30T12:00:00Z',
  deleted_at: null,
};

beforeEach(() => {
  insertCaptures.length = 0;
  updateCaptures.length = 0;
  selectCaptures.length = 0;
  fakeClient.from.mockClear();
  nextSingle = async () => ({ data: null, error: null });
  nextMaybeSingle = async () => ({ data: null, error: null });
  nextList = async () => ({ data: [], error: null });
});

describe('registerSourceArtifactUpload', () => {
  it('rejects unsupported mime types before touching the DB', async () => {
    await expect(
      registerSourceArtifactUpload({ ...baseInput, mimeType: 'application/zip' }),
    ).rejects.toThrow(/mimeType/);
    expect(insertCaptures).toHaveLength(0);
  });

  it('rejects oversized or empty files', async () => {
    await expect(
      registerSourceArtifactUpload({ ...baseInput, sizeBytes: 0 }),
    ).rejects.toThrow(/sizeBytes/);
    await expect(
      registerSourceArtifactUpload({ ...baseInput, sizeBytes: 200_000_000 }),
    ).rejects.toThrow(/sizeBytes/);
  });

  it('accepts canonical 11-stage Source stages', async () => {
    nextSingle = async () => ({ data: { ...baseRow, stage_key: 'bafo' }, error: null });
    const rec = await registerSourceArtifactUpload({
      ...baseInput,
      stageKey: 'bafo',
    });

    expect(rec.stageKey).toBe('bafo');
  });

  it('rejects unsupported Source stages', async () => {
    await expect(
      registerSourceArtifactUpload({
        ...baseInput,
        stageKey: 'not_a_stage' as RegisterSourceArtifactInput['stageKey'],
      }),
    ).rejects.toThrow(/stageKey/);
  });

  it('inserts a registry row with pending knowledge-pipeline defaults', async () => {
    nextSingle = async () => ({ data: baseRow, error: null });

    const rec: SourceArtifactRegistryRecord = await registerSourceArtifactUpload(baseInput);

    expect(insertCaptures).toHaveLength(1);
    expect(insertCaptures[0].table).toBe('source_artifacts');
    expect(insertCaptures[0].payload).toMatchObject({
      tenant_key: 'apex-retail',
      source_event_id: 'apex-retail-ams-outsourcing-2026',
      stage_key: 'orals_bafo',
      artifact_family: 'proposal',
      artifact_kind: 'vendor_proposal',
      source_origin: 'uploaded',
      source_format: 'pdf',
      blob_uri: baseInput.blobUri,
      data_classification: 'Confidential',
      created_by: 'user_123',
    });
    expect(rec.parseStatus).toBe('pending');
    expect(rec.embeddingStatus).toBe('pending');
    expect(rec.graphStatus).toBe('pending');
    expect(rec.evidenceState).toBe('unparsed');
    expect(rec.approvalState).toBe('draft');
  });

  it('coerces bigint/string fields back to numbers', async () => {
    nextSingle = async () => ({
      data: { ...baseRow, size_bytes: '8192', version: '2' },
      error: null,
    });
    const rec = await registerSourceArtifactUpload(baseInput);
    expect(rec.sizeBytes).toBe(8192);
    expect(rec.version).toBe(2);
  });
});

describe('source artifact queries', () => {
  it('lists artifacts by tenant and source event, excluding deleted rows', async () => {
    nextList = async () => ({ data: [baseRow], error: null });

    const items = await listSourceArtifactsForEvent(
      baseInput.tenantKey,
      baseInput.sourceEventId,
    );

    expect(items).toHaveLength(1);
    expect(selectCaptures[0].table).toBe('source_artifacts');
    expect(selectCaptures[0].filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'tenant_key', value: baseInput.tenantKey },
        { kind: 'eq', col: 'source_event_id', value: baseInput.sourceEventId },
        { kind: 'is', col: 'deleted_at', value: null },
      ]),
    );
  });

  it('lists artifacts by stage', async () => {
    nextList = async () => ({ data: [baseRow], error: null });
    await listSourceArtifactsForStage(baseInput.tenantKey, baseInput.sourceEventId, 'orals_bafo');
    expect(selectCaptures[0].filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'stage_key', value: 'orals_bafo' },
      ]),
    );
  });

  it('gets a single artifact or null', async () => {
    nextMaybeSingle = async () => ({ data: null, error: null });
    await expect(getSourceArtifactRegistryRecord('missing')).resolves.toBeNull();
    nextMaybeSingle = async () => ({ data: baseRow, error: null });
    await expect(getSourceArtifactRegistryRecord(baseRow.id)).resolves.toMatchObject({
      id: baseRow.id,
    });
  });
});

describe('updateSourceArtifactProcessingState', () => {
  it('updates only explicit processing states', async () => {
    nextSingle = async () => ({
      data: {
        ...baseRow,
        parse_status: 'parsed',
        embedding_status: 'embedded',
        graph_status: 'projected',
        classification_status: 'classified',
        evidence_state: 'parsed_uncited',
      },
      error: null,
    });

    const rec = await updateSourceArtifactProcessingState({
      artifactId: baseRow.id,
      parseStatus: 'parsed',
      embeddingStatus: 'embedded',
      graphStatus: 'projected',
      classificationStatus: 'classified',
      evidenceState: 'parsed_uncited',
      validatedBy: 'sentinel',
    });

    expect(updateCaptures[0].payload).toEqual({
      parse_status: 'parsed',
      embedding_status: 'embedded',
      graph_status: 'projected',
      classification_status: 'classified',
      evidence_state: 'parsed_uncited',
      validated_by: 'sentinel',
    });
    expect(updateCaptures[0].filters).toEqual(
      expect.arrayContaining([
        { kind: 'eq', col: 'id', value: baseRow.id },
        { kind: 'is', col: 'deleted_at', value: null },
      ]),
    );
    expect(rec.parseStatus).toBe('parsed');
  });

  it('rejects an empty state update', async () => {
    await expect(updateSourceArtifactProcessingState({ artifactId: baseRow.id })).rejects.toThrow(
      /at least one/,
    );
  });
});

describe('softDeleteSourceArtifact', () => {
  it('soft-deletes via UPDATE and records the actor as validator', async () => {
    nextSingle = async () => ({
      data: { ...baseRow, deleted_at: '2026-04-30T13:00:00Z', validated_by: 'user_123' },
      error: null,
    });

    const rec = await softDeleteSourceArtifact(baseRow.id, 'user_123');

    expect(updateCaptures[0].table).toBe('source_artifacts');
    expect(updateCaptures[0].payload).toHaveProperty('deleted_at');
    expect(updateCaptures[0].payload.validated_by).toBe('user_123');
    expect(rec.deletedAt).toBe('2026-04-30T13:00:00Z');
  });
});

describe('buildSourceArtifactBlobPath', () => {
  it('uses {tenant}/{event}/{artifact}/{safeFilename}', () => {
    expect(
      buildSourceArtifactBlobPath({
        tenantKey: 'apex-retail',
        sourceEventId: 'apex-retail-ams-outsourcing-2026',
        artifactId: 'artifact-123',
        filename: 'Northstar BAFO.PDF',
      }),
    ).toBe('apex-retail/apex-retail-ams-outsourcing-2026/artifact-123/Northstar_BAFO.pdf');
  });

  it('strips path separators and caps long filenames', () => {
    const path = buildSourceArtifactBlobPath({
      tenantKey: 'apex-retail',
      sourceEventId: 'apex-retail-ams-outsourcing-2026',
      artifactId: 'artifact-123',
      filename: `../${'a'.repeat(300)}.XLSX`,
    });
    expect(path).not.toContain('..');
    expect(path).not.toContain('\\');
    expect(path.length).toBeLessThanOrEqual(240);
    expect(path.endsWith('.xlsx')).toBe(true);
  });
});
