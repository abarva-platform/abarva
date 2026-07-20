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
  source_origin: 'uploaded' | 'generated';
  source_format: 'pdf' | 'markdown';
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
  disclosure_classification?: unknown;
  client_final_change_summary?: Record<string, unknown> | string | null;
  evidence_state: 'unparsed' | 'parsed_uncited';
  approval_state: 'draft' | 'approved';
  description?: string | null;
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
  or: jest.Mock;
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
    or: jest.fn((value: string) => {
      filters.push({ kind: 'eq', col: 'or', value });
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
const fakeObjectStorage = {
  download: jest.fn<Promise<Buffer>, [string, string]>(),
};

jest.mock('@/lib/data-plane/postgresCompat', () => ({
  getAzureWriteFluentClient: () => fakeClient,
}));
jest.mock('@/lib/data-plane/objectStorage', () => ({
  getObjectStorageAdapter: () => fakeObjectStorage,
}));

import {
  buildSourceArtifactBlobPath,
  getSourceArtifactRegistryRecord,
  listSourceArtifactsForEvent,
  listSourceArtifactsForSourceEventIdWithContent,
  listSourceArtifactsForStage,
  readSourceArtifactRegistryTextContent,
  registerSourceArtifactUpload,
  softDeleteSourceArtifact,
  updateSourceArtifactProcessingState,
} from '../index';
import {
  makeDisclosureFlag,
  serializeDisclosureFlag,
} from '../../disclosure-flag';

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
  fakeObjectStorage.download.mockReset();
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

    const sourceArtifactInserts = insertCaptures.filter(
      (capture) => capture.table === 'source_artifacts',
    );
    expect(sourceArtifactInserts).toHaveLength(1);
    expect(sourceArtifactInserts[0].payload).toMatchObject({
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

  it('optionally writes File Cabinet columns for generated artifacts', async () => {
    nextSingle = async () => ({
      data: {
        ...baseRow,
        source_origin: 'generated',
        source_format: 'markdown',
        mime_type: 'text/markdown',
      },
      error: null,
    });

    await registerSourceArtifactUpload({
      ...baseInput,
      sourceOrigin: 'generated',
      sourceFormat: 'markdown',
      mimeType: 'text/markdown',
      originalName: 'd05_scope_memo.md',
      artifactKind: 'd05_scope_memo',
      blobUri: 'skyharbor-air/event-1/artifact-1/d05_scope_memo.md',
      fileCabinet: {
        clientId: 'client-skyh',
        sourcingStage: 'scope',
        artifactGroup: 'generated',
        artifactType: 'd05_scope_memo',
        title: 'Scope Memo with Boundaries',
        description: 'In-scope, out-of-scope, target support tier, transition assumptions.',
        fileName: 'd05_scope_memo.md',
        fileFormat: 'md',
        blobContainer: 'source-artifacts',
        blobPath: 'skyharbor-air/event-1/artifact-1/d05_scope_memo.md',
        fileSize: 1024,
        version: 3,
        status: 'draft',
        generatedBy: 'user_123',
        sourceBasis: 'source_event_artifact_states:state-1',
        citationReady: false,
        supersedesArtifactId: 'prior-artifact',
        blobSha256: 'c'.repeat(64),
      },
    });

    expect(insertCaptures[0].payload).toMatchObject({
      blob_uri: 'skyharbor-air/event-1/artifact-1/d05_scope_memo.md',
      client_id: 'client-skyh',
      artifact_group: 'generated',
      artifact_type: 'd05_scope_memo',
      title: 'Scope Memo with Boundaries',
      description: 'In-scope, out-of-scope, target support tier, transition assumptions.',
      file_name: 'd05_scope_memo.md',
      file_format: 'md',
      blob_container: 'source-artifacts',
      blob_path: 'skyharbor-air/event-1/artifact-1/d05_scope_memo.md',
      version: 3,
      status: 'draft',
      lifecycle_state: 'current',
      supersedes_artifact_id: 'prior-artifact',
      blob_sha256: 'c'.repeat(64),
    });
  });

  it('round-trips description back out of the registry read path (previously write-only)', async () => {
    nextMaybeSingle = async () => ({
      data: {
        ...baseRow,
        description:
          'Generated Source deliverable. [compliance-review-flagged]',
      },
      error: null,
    });

    const record = await getSourceArtifactRegistryRecord(baseRow.id);

    expect(record?.description).toBe(
      'Generated Source deliverable. [compliance-review-flagged]',
    );
  });

  it('returns null description for rows that never had one set', async () => {
    nextMaybeSingle = async () => ({ data: baseRow, error: null });

    const record = await getSourceArtifactRegistryRecord(baseRow.id);

    expect(record?.description ?? null).toBeNull();
  });

  it('serializes client-final File Cabinet JSONB metadata for registry inserts', async () => {
    nextSingle = async () => ({
      data: {
        ...baseRow,
        client_final_change_summary:
          '{"summary":"Client final accepted","changeAnalysisCompleted":false}',
      },
      error: null,
    });

    const rec = await registerSourceArtifactUpload({
      ...baseInput,
      artifactId: 'client-final-1',
      artifactKind: 'd09_rfp_pack',
      fileCabinet: {
        clientId: 'client-skyh',
        sourcingStage: 'responses',
        artifactGroup: 'approval',
        artifactType: 'd09_rfp_pack',
        artifactFamily: 'proposal',
        title: 'RFP Pack — Client Final',
        description: 'Client-approved final artifact of record.',
        fileName: 'rfp-final.docx',
        fileFormat: 'docx',
        blobContainer: 'source-artifacts',
        blobPath: 'skyharbor-air/event-1/client-final-1/rfp-final.docx',
        fileSize: 1024,
        version: 4,
        status: 'client_final',
        generatedBy: null,
        sourceBasis: 'client-final:state-1',
        citationReady: true,
        supersedesArtifactId: 'generated-1',
        blobSha256: 'd'.repeat(64),
        isClientFinal: true,
        isCurrentAuthoritative: true,
        sourceGeneratedArtifactId: 'generated-1',
        clientFinalChangeSummary: {
          summary: 'Client final accepted',
          changeAnalysisCompleted: false,
        },
      },
    });

    const sourceArtifactInserts = insertCaptures.filter(
      (capture) => capture.table === 'source_artifacts',
    );
    expect(sourceArtifactInserts).toHaveLength(1);
    expect(sourceArtifactInserts[0].payload.client_final_change_summary).toBe(
      '{"summary":"Client final accepted","changeAnalysisCompleted":false}',
    );
    expect(rec.clientFinalChangeSummary).toMatchObject({
      summary: 'Client final accepted',
      changeAnalysisCompleted: false,
    });
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

  it('persists no disclosure column when no flag is supplied (GAP-9)', async () => {
    nextSingle = async () => ({ data: baseRow, error: null });
    const rec = await registerSourceArtifactUpload(baseInput);
    expect(insertCaptures[0].payload.disclosure_classification).toBeNull();
    expect(rec.disclosureFlag).toBeUndefined();
  });

  it('persists and round-trips a privileged disclosure flag (GAP-9)', async () => {
    const flag = makeDisclosureFlag({
      classification: 'attorney_client',
      privilegeHolder: 'General Counsel',
      basis: 'Consent-order remediation prepared at direction of counsel.',
    });
    const persisted = serializeDisclosureFlag(flag);
    nextSingle = async () => ({
      data: { ...baseRow, disclosure_classification: persisted },
      error: null,
    });

    const rec = await registerSourceArtifactUpload({
      ...baseInput,
      disclosureFlag: flag,
    });

    expect(insertCaptures[0].payload.disclosure_classification).toEqual(persisted);
    expect(rec.disclosureFlag).toEqual(flag);
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

  it('hydrates text-like registry artifacts with bounded body text', async () => {
    const textRow: Row = {
      ...baseRow,
      id: 'text-artifact',
      artifact_kind: 'd01_strategy_memo',
      source_format: 'markdown',
      mime_type: 'text/markdown',
      blob_uri: 'tenant/event/text-artifact/d01_strategy_memo.md',
    };
    fakeObjectStorage.download.mockResolvedValueOnce(
      Buffer.from('  # Sourcing Strategy Memo\\n\\nReal authored content.  '),
    );
    nextList = async () => ({ data: [textRow], error: null });

    const items = await listSourceArtifactsForSourceEventIdWithContent(
      baseInput.sourceEventId,
    );

    expect(items).toHaveLength(1);
    expect(items[0].bodyMarkdown).toContain('Real authored content');
    expect(fakeObjectStorage.download).toHaveBeenCalledWith(
      'source-artifacts',
      textRow.blob_uri,
    );
  });

  it('hydrates inline artifact-state bodies without reading blob storage', async () => {
    const inlineRow: Row = {
      ...baseRow,
      id: 'inline-artifact',
      artifact_kind: 'd05_scope_memo',
      source_format: 'markdown',
      mime_type: 'text/markdown',
      blob_uri: 'inline://source-event-artifact-state/state-1',
    };
    nextMaybeSingle = async () => ({
      data: {
        ...baseRow,
        body: '# Scope Memo\\n\\nHuman-reviewed inline body.',
      } as Row & { body: string },
      error: null,
    });

    const body = await readSourceArtifactRegistryTextContent(
      await Promise.resolve({
        ...inlineRow,
        tenantKey: inlineRow.tenant_key,
        sourceEventId: inlineRow.source_event_id,
        sourceEventRowId: inlineRow.source_event_row_id,
        stageKey: inlineRow.stage_key,
        artifactFamily: inlineRow.artifact_family,
        artifactKind: inlineRow.artifact_kind,
        sourceOrigin: inlineRow.source_origin,
        sourceFormat: inlineRow.source_format,
        originalName: inlineRow.original_name,
        blobUri: inlineRow.blob_uri,
        uploaderUserId: inlineRow.uploader_user_id,
        mimeType: inlineRow.mime_type,
        sizeBytes: Number(inlineRow.size_bytes),
        sha256: inlineRow.sha256,
        parseStatus: inlineRow.parse_status,
        embeddingStatus: inlineRow.embedding_status,
        graphStatus: inlineRow.graph_status,
        classificationStatus: inlineRow.classification_status,
        dataClassification: inlineRow.data_classification,
        evidenceState: inlineRow.evidence_state,
        approvalState: inlineRow.approval_state,
        version: Number(inlineRow.version),
        supersedesArtifactVersionId: inlineRow.supersedes_artifact_version_id,
        createdBy: inlineRow.created_by,
        validatedBy: inlineRow.validated_by,
        createdAt: inlineRow.created_at,
        updatedAt: inlineRow.updated_at,
        deletedAt: inlineRow.deleted_at,
      }),
    );

    expect(body).toContain('Human-reviewed inline body');
    expect(fakeObjectStorage.download).not.toHaveBeenCalled();
    expect(selectCaptures.at(-1)?.table).toBe('source_event_artifact_states');
  });

  it('does not hydrate binary registry artifacts as scored body text', async () => {
    await expect(readSourceArtifactRegistryTextContent({
      ...baseRow,
      tenantKey: baseRow.tenant_key,
      sourceEventId: baseRow.source_event_id,
      sourceEventRowId: baseRow.source_event_row_id,
      stageKey: baseRow.stage_key,
      artifactFamily: baseRow.artifact_family,
      artifactKind: baseRow.artifact_kind,
      sourceOrigin: baseRow.source_origin,
      sourceFormat: baseRow.source_format,
      originalName: baseRow.original_name,
      blobUri: baseRow.blob_uri,
      uploaderUserId: baseRow.uploader_user_id,
      mimeType: 'application/pdf',
      sizeBytes: Number(baseRow.size_bytes),
      sha256: baseRow.sha256,
      parseStatus: baseRow.parse_status,
      embeddingStatus: baseRow.embedding_status,
      graphStatus: baseRow.graph_status,
      classificationStatus: baseRow.classification_status,
      dataClassification: baseRow.data_classification,
      evidenceState: baseRow.evidence_state,
      approvalState: baseRow.approval_state,
      version: Number(baseRow.version),
      supersedesArtifactVersionId: baseRow.supersedes_artifact_version_id,
      createdBy: baseRow.created_by,
      validatedBy: baseRow.validated_by,
      createdAt: baseRow.created_at,
      updatedAt: baseRow.updated_at,
      deletedAt: baseRow.deleted_at,
    })).resolves.toBeNull();
    expect(fakeObjectStorage.download).not.toHaveBeenCalled();
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

  it('updates the disclosure flag and round-trips it back (GAP-9)', async () => {
    const flag = makeDisclosureFlag({
      classification: 'work_product',
      privilegeHolder: 'Litigation Counsel',
      basis: 'Litigation-hold analysis.',
    });
    const persisted = serializeDisclosureFlag(flag);
    nextSingle = async () => ({
      data: { ...baseRow, disclosure_classification: persisted },
      error: null,
    });

    const rec = await updateSourceArtifactProcessingState({
      artifactId: baseRow.id,
      disclosureFlag: flag,
    });

    expect(updateCaptures[0].payload).toEqual({
      disclosure_classification: persisted,
    });
    expect(rec.disclosureFlag).toEqual(flag);
  });

  it('clears the disclosure flag when passed null (GAP-9)', async () => {
    nextSingle = async () => ({
      data: { ...baseRow, disclosure_classification: null },
      error: null,
    });

    const rec = await updateSourceArtifactProcessingState({
      artifactId: baseRow.id,
      disclosureFlag: null,
    });

    expect(updateCaptures[0].payload).toEqual({ disclosure_classification: null });
    expect(rec.disclosureFlag).toBeUndefined();
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
