import 'server-only';

import fs from 'node:fs/promises';
import path from 'node:path';

import {
  loadCsvUploadToTenantContext,
  prepareCsvUploadForTenantContext,
  type CsvUploadLoadResult,
} from '@/lib/context-ingestion/csv-upload-connector';
import {
  isSupportedIngestionDocument,
  parseIngestionDocument,
  type ParsedIngestionDocument,
} from '@/lib/ingestion/document-upload-parser';
import { evaluateSensitiveUpload, type UploadProtectionResult } from '@/lib/security/sensitive-upload-guard';

export type LakeshoreLoadMode = 'dry-run' | 'commit';

export interface LakeshoreManifestDataFile {
  readonly templateId: string;
  readonly dimension: string;
  readonly label: string;
  readonly rows: number;
  readonly path: string;
  readonly acceptedFormats?: readonly string[];
  readonly ownerRole?: string;
}

export interface LakeshoreManifestDocument {
  readonly fileName: string;
  readonly kind: string;
  readonly mappedTemplate: string;
  readonly path: string;
}

export interface LakeshoreLoadedManifest {
  readonly tenantKey: string;
  readonly brokerKey: string;
  readonly displayName: string;
  readonly syntheticNotice: string;
  readonly totals: {
    readonly structuredRecords: number;
    readonly csvFiles: number;
    readonly generatedDocuments: number;
    readonly workbook?: string;
  };
  readonly dataFiles: readonly LakeshoreManifestDataFile[];
  readonly documents: readonly LakeshoreManifestDocument[];
}

export interface LakeshoreRehearsalCsvResult {
  readonly templateId: string;
  readonly dimension: string;
  readonly label: string;
  readonly sourcePath: string;
  readonly rowsExpected: number;
  readonly rowsParsed: number;
  readonly chunksQueued: number;
  readonly persistenceStatus: CsvUploadLoadResult['persistence']['status'] | 'dry_run';
  readonly ingestionRunRecorded: boolean;
  readonly detail: string;
}

export interface LakeshoreRehearsalDocumentResult {
  readonly fileName: string;
  readonly kind: string;
  readonly mappedTemplate: string;
  readonly sourcePath: string;
  readonly parseMethod: string;
  readonly textChars: number;
  readonly warnings: readonly string[];
  readonly metadata: ParsedIngestionDocument['metadata'];
}

export interface LakeshoreRehearsalResult {
  readonly generatedAt: string;
  readonly mode: LakeshoreLoadMode;
  readonly tenantKey: string;
  readonly brokerKey: string;
  readonly clientId: string;
  readonly displayName: string;
  readonly syntheticNotice: string;
  readonly totals: {
    readonly csvFiles: number;
    readonly csvRowsExpected: number;
    readonly csvRowsParsed: number;
    readonly csvChunksQueued: number;
    readonly documents: number;
    readonly documentTextChars: number;
  };
  readonly csv: readonly LakeshoreRehearsalCsvResult[];
  readonly documents: readonly LakeshoreRehearsalDocumentResult[];
  readonly quarantineProbe: UploadProtectionResult;
  readonly operatorNextSteps: readonly string[];
}

export interface RehearseLakeshoreLoadInput {
  readonly rootDir: string;
  readonly mode?: LakeshoreLoadMode;
  readonly clientId: string;
  readonly tenantKey?: string;
  readonly brokerKey?: string;
  readonly uploadedBy?: string;
  readonly includeDocuments?: boolean;
  readonly generatedAt?: string;
}

export async function loadLakeshoreManifest(rootDir: string): Promise<LakeshoreLoadedManifest> {
  const raw = await fs.readFile(path.join(rootDir, 'manifest.json'), 'utf8');
  const parsed = JSON.parse(raw) as Partial<LakeshoreLoadedManifest>;
  if (!parsed.tenantKey || !parsed.brokerKey || !parsed.displayName) {
    throw new Error('lakeshore_manifest_invalid: missing tenant identity');
  }
  if (!Array.isArray(parsed.dataFiles) || parsed.dataFiles.length === 0) {
    throw new Error('lakeshore_manifest_invalid: missing dataFiles');
  }
  if (!Array.isArray(parsed.documents)) {
    throw new Error('lakeshore_manifest_invalid: missing documents');
  }
  return parsed as LakeshoreLoadedManifest;
}

function mimeTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case '.csv':
      return 'text/csv';
    case '.pdf':
      return 'application/pdf';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.pptx':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case '.json':
      return 'application/json';
    case '.md':
      return 'text/markdown';
    default:
      return 'application/octet-stream';
  }
}

async function rehearseCsv(args: {
  readonly rootDir: string;
  readonly dataFile: LakeshoreManifestDataFile;
  readonly mode: LakeshoreLoadMode;
  readonly clientId: string;
  readonly tenantKey: string;
  readonly uploadedBy: string;
  readonly generatedAt: string;
}): Promise<LakeshoreRehearsalCsvResult> {
  const csvText = await fs.readFile(path.join(args.rootDir, args.dataFile.path), 'utf8');
  const input = {
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    uploadedBy: args.uploadedBy,
    fileName: path.basename(args.dataFile.path),
    csvText,
    uploadedAt: args.generatedAt,
    mapping: {
      templateId: args.dataFile.templateId,
      dataClassification: 'confidential_business',
    },
  };

  const result =
    args.mode === 'commit'
      ? await loadCsvUploadToTenantContext(input)
      : (() => {
          const prepared = prepareCsvUploadForTenantContext(input);
          return {
            ...prepared,
            chunksQueued: prepared.chunks.length,
            persistence: {
              status: 'dry_run' as const,
              chunkRowsInserted: 0,
              ingestionRunRecorded: false,
              detail:
                'Dry run only: CSV parsed and mapped through the real connector; no tenant data-plane rows were written.',
            },
          };
        })();

  return {
    templateId: args.dataFile.templateId,
    dimension: args.dataFile.dimension,
    label: args.dataFile.label,
    sourcePath: args.dataFile.path,
    rowsExpected: args.dataFile.rows,
    rowsParsed: result.rowsParsed,
    chunksQueued: result.chunksQueued,
    persistenceStatus: result.persistence.status,
    ingestionRunRecorded: result.persistence.ingestionRunRecorded,
    detail: result.persistence.detail,
  };
}

async function rehearseDocument(args: {
  readonly rootDir: string;
  readonly document: LakeshoreManifestDocument;
  readonly brokerKey: string;
}): Promise<LakeshoreRehearsalDocumentResult> {
  const absolutePath = path.join(args.rootDir, args.document.path);
  const bytes = await fs.readFile(absolutePath);
  const mimeType = mimeTypeFor(args.document.fileName);
  if (!isSupportedIngestionDocument({ filename: args.document.fileName, mimeType })) {
    throw new Error(`lakeshore_document_unsupported: ${args.document.fileName}`);
  }
  const parsed = await parseIngestionDocument({
    filename: args.document.fileName,
    mimeType,
    bytes,
    cacheScope: `lakeshore:${args.brokerKey}`,
  });
  if (!parsed) {
    throw new Error(`lakeshore_document_parse_empty: ${args.document.fileName}`);
  }
  return {
    fileName: args.document.fileName,
    kind: args.document.kind,
    mappedTemplate: args.document.mappedTemplate,
    sourcePath: args.document.path,
    parseMethod: parsed.parseMethod,
    textChars: parsed.text.length,
    warnings: parsed.warnings,
    metadata: parsed.metadata,
  };
}

export function buildLakeshoreQuarantineProbe(): UploadProtectionResult {
  const badRow = [
    'template_id,person_name,patient_name,member_ssn,notes',
    'org-roles,Jordan Lee,Patient Zero,123-45-6789,Synthetic quarantine probe only',
  ].join('\n');
  return evaluateSensitiveUpload({
    filename: 'lakeshore-quarantine-probe.csv',
    mimeType: 'text/csv',
    bytes: new TextEncoder().encode(badRow),
    declaredClassification: 'confidential_business',
  });
}

export async function rehearseLakeshoreLoad(input: RehearseLakeshoreLoadInput): Promise<LakeshoreRehearsalResult> {
  const manifest = await loadLakeshoreManifest(input.rootDir);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const mode = input.mode ?? 'dry-run';
  const tenantKey = input.tenantKey ?? manifest.tenantKey;
  const brokerKey = input.brokerKey ?? manifest.brokerKey;
  const uploadedBy = input.uploadedBy ?? 'lakeshore-loader-rehearsal';

  const csv = [];
  for (const dataFile of manifest.dataFiles) {
    csv.push(
      await rehearseCsv({
        rootDir: input.rootDir,
        dataFile,
        mode,
        clientId: input.clientId,
        tenantKey,
        uploadedBy,
        generatedAt,
      }),
    );
  }

  const documents =
    input.includeDocuments === false
      ? []
      : await Promise.all(
          manifest.documents.map((document) =>
            rehearseDocument({
              rootDir: input.rootDir,
              document,
              brokerKey,
            }),
          ),
        );

  const quarantineProbe = buildLakeshoreQuarantineProbe();
  return {
    generatedAt,
    mode,
    tenantKey,
    brokerKey,
    clientId: input.clientId,
    displayName: manifest.displayName,
    syntheticNotice: manifest.syntheticNotice,
    totals: {
      csvFiles: csv.length,
      csvRowsExpected: csv.reduce((sum, item) => sum + item.rowsExpected, 0),
      csvRowsParsed: csv.reduce((sum, item) => sum + item.rowsParsed, 0),
      csvChunksQueued: csv.reduce((sum, item) => sum + item.chunksQueued, 0),
      documents: documents.length,
      documentTextChars: documents.reduce((sum, item) => sum + item.textChars, 0),
    },
    csv,
    documents,
    quarantineProbe,
    operatorNextSteps: [
      mode === 'commit'
        ? 'Run `npm run embed:pending-chunks -- --tenant lakeshore` after commit so parsed chunks become retrievable.'
        : 'Rerun with `--commit` only after Lakeshore tenant DB routing, Clerk org, and operator authority are verified.',
      'Review /admin/data-trust for Lakeshore after commit; record counts and last-loaded dates must match this ledger.',
      'Upload the offline review bundle to the client only once, then use governed updates through Data Loads.',
    ],
  };
}
