import type {
  SourceArtifactFamily,
  SourceArtifactFormat,
  SourceArtifactRegistryRecord,
  SourceEmbeddingStatus,
  SourceGraphStatus,
  SourceParseStatus,
} from './types';

export type SourceArtifactParseReadiness =
  | 'parsed'
  | 'parser_ready'
  | 'parsing'
  | 'needs_review'
  | 'failed'
  | 'unsupported_without_ocr_or_transcription'
  | 'unknown_format';

export type SourceArtifactSearchReadiness =
  | 'search_ready'
  | 'parsed_not_indexed'
  | 'not_ready'
  | 'index_failed'
  | 'not_applicable';

export type SourceArtifactGraphReadiness =
  | 'graph_projected'
  | 'not_projected'
  | 'projection_failed'
  | 'not_applicable';

export interface SourceArtifactParseBacklogItem {
  readonly artifactId: string;
  readonly sourceEventId: string;
  readonly sourceEventRowId: string | null;
  readonly stageKey: string;
  readonly originalName: string;
  readonly artifactFamily: SourceArtifactFamily;
  readonly artifactKind: string;
  readonly sourceFormat: SourceArtifactFormat;
  readonly mimeType: string;
  readonly parseStatus: SourceParseStatus;
  readonly embeddingStatus: SourceEmbeddingStatus;
  readonly graphStatus: SourceGraphStatus;
  readonly parseReadiness: SourceArtifactParseReadiness;
  readonly searchReadiness: SourceArtifactSearchReadiness;
  readonly graphReadiness: SourceArtifactGraphReadiness;
  readonly updatedAt: string;
  readonly ageHours: number | null;
  readonly note: string;
}

export interface SourceArtifactParseBacklogReport {
  readonly generatedAt: string;
  readonly scope: {
    readonly clientKey: string;
    readonly inputEventId?: string;
    readonly resolvedEventId?: string;
    readonly resolvedEventCode?: string;
  };
  readonly status: 'empty' | 'ok' | 'attention';
  readonly counts: {
    readonly totalArtifacts: number;
    readonly parsedArtifacts: number;
    readonly parserReadyArtifacts: number;
    readonly parsingArtifacts: number;
    readonly needsReviewArtifacts: number;
    readonly failedArtifacts: number;
    readonly unsupportedWithoutOcrOrTranscriptionArtifacts: number;
    readonly unknownFormatArtifacts: number;
    readonly searchReadyArtifacts: number;
    readonly parsedNotIndexedArtifacts: number;
    readonly graphProjectedArtifacts: number;
    readonly staleParsingArtifacts: number;
  };
  readonly countsByParseStatus: Record<SourceParseStatus, number>;
  readonly countsByEmbeddingStatus: Record<SourceEmbeddingStatus, number>;
  readonly countsByGraphStatus: Record<SourceGraphStatus, number>;
  readonly countsBySourceFormat: Record<string, number>;
  readonly countsByArtifactFamily: Record<string, number>;
  readonly attentionItems: SourceArtifactParseBacklogItem[];
  readonly examples: SourceArtifactParseBacklogItem[];
  readonly notes: string[];
}

export interface BuildSourceArtifactParseBacklogReportInput {
  readonly clientKey: string;
  readonly inputEventId?: string;
  readonly resolvedEventId?: string;
  readonly resolvedEventCode?: string;
  readonly generatedAt?: string;
  readonly artifacts: readonly SourceArtifactRegistryRecord[];
  readonly staleParsingAfterHours?: number;
  readonly maxExamples?: number;
}

const PARSER_READY_FORMATS = new Set<SourceArtifactFormat>([
  'pdf',
  'docx',
  'xlsx',
  'pptx',
  'html',
  'markdown',
  'csv',
  'txt',
]);

const OCR_OR_TRANSCRIPTION_REQUIRED_FORMATS = new Set<SourceArtifactFormat>([
  'image',
  'audio',
  'video',
]);

const DEFAULT_STALE_PARSING_AFTER_HOURS = 24;
const DEFAULT_MAX_EXAMPLES = 20;

function emptyCounts<T extends string>(
  keys: readonly T[],
): Record<T, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function hoursBetween(generatedAt: string, updatedAt: string): number | null {
  const generated = Date.parse(generatedAt);
  const updated = Date.parse(updatedAt);
  if (!Number.isFinite(generated) || !Number.isFinite(updated)) return null;
  return Math.max(0, Math.round(((generated - updated) / 36_000) / 10));
}

export function parseReadinessForArtifact(
  artifact: Pick<SourceArtifactRegistryRecord, 'parseStatus' | 'sourceFormat'>,
): SourceArtifactParseReadiness {
  if (artifact.parseStatus === 'parsed') return 'parsed';
  if (artifact.parseStatus === 'parsing') return 'parsing';
  if (artifact.parseStatus === 'failed') return 'failed';
  if (artifact.parseStatus === 'needs_review') return 'needs_review';
  if (PARSER_READY_FORMATS.has(artifact.sourceFormat)) return 'parser_ready';
  if (OCR_OR_TRANSCRIPTION_REQUIRED_FORMATS.has(artifact.sourceFormat)) {
    return 'unsupported_without_ocr_or_transcription';
  }
  return 'unknown_format';
}

export function searchReadinessForArtifact(
  artifact: Pick<
    SourceArtifactRegistryRecord,
    'embeddingStatus' | 'parseStatus'
  >,
): SourceArtifactSearchReadiness {
  if (artifact.embeddingStatus === 'embedded') return 'search_ready';
  if (artifact.embeddingStatus === 'failed') return 'index_failed';
  if (artifact.embeddingStatus === 'not_applicable') return 'not_applicable';
  if (artifact.parseStatus === 'parsed') return 'parsed_not_indexed';
  return 'not_ready';
}

export function graphReadinessForArtifact(
  artifact: Pick<SourceArtifactRegistryRecord, 'graphStatus'>,
): SourceArtifactGraphReadiness {
  if (artifact.graphStatus === 'projected') return 'graph_projected';
  if (artifact.graphStatus === 'failed') return 'projection_failed';
  if (artifact.graphStatus === 'not_applicable') return 'not_applicable';
  return 'not_projected';
}

function noteForItem(item: {
  readonly parseReadiness: SourceArtifactParseReadiness;
  readonly searchReadiness: SourceArtifactSearchReadiness;
  readonly graphReadiness: SourceArtifactGraphReadiness;
}): string {
  if (item.parseReadiness === 'parsed' && item.searchReadiness === 'search_ready') {
    return 'Parsed and search-ready; enterprise-context promotion still requires separate governed proof.';
  }
  if (item.parseReadiness === 'parsed') {
    return 'Parsed into Source evidence, but not search-ready unless embedding/indexing is separately proven.';
  }
  if (item.parseReadiness === 'parser_ready') {
    return 'Stored in the registry and eligible for a parser/backfill run; no parsing was executed by this verifier.';
  }
  if (item.parseReadiness === 'unsupported_without_ocr_or_transcription') {
    return 'Stored in the registry, but image/audio/video needs governed OCR or transcription before text evidence can exist.';
  }
  if (item.parseReadiness === 'failed') {
    return 'Prior parsing failed; operator review or safe repair is required before this can become evidence.';
  }
  if (item.parseReadiness === 'needs_review') {
    return 'Prior parsing needs human review before this can be treated as usable evidence.';
  }
  if (item.parseReadiness === 'parsing') {
    return 'Marked parsing in progress; verify worker health if this remains stale.';
  }
  return 'Stored in the registry, but the file format is unknown to the current parser contract.';
}

function isAttentionItem(
  item: SourceArtifactParseBacklogItem,
  staleParsingAfterHours: number,
): boolean {
  if (
    item.parseReadiness === 'failed' ||
    item.parseReadiness === 'needs_review' ||
    item.parseReadiness === 'unsupported_without_ocr_or_transcription' ||
    item.parseReadiness === 'unknown_format' ||
    item.searchReadiness === 'index_failed' ||
    item.graphReadiness === 'projection_failed'
  ) {
    return true;
  }
  return (
    item.parseReadiness === 'parsing' &&
    item.ageHours !== null &&
    item.ageHours >= staleParsingAfterHours
  );
}

export function buildSourceArtifactParseBacklogReport(
  input: BuildSourceArtifactParseBacklogReportInput,
): SourceArtifactParseBacklogReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const staleParsingAfterHours =
    input.staleParsingAfterHours ?? DEFAULT_STALE_PARSING_AFTER_HOURS;
  const maxExamples = input.maxExamples ?? DEFAULT_MAX_EXAMPLES;

  const countsByParseStatus = emptyCounts<SourceParseStatus>([
    'pending',
    'parsing',
    'parsed',
    'failed',
    'needs_review',
  ]);
  const countsByEmbeddingStatus = emptyCounts<SourceEmbeddingStatus>([
    'pending',
    'embedded',
    'failed',
    'not_applicable',
  ]);
  const countsByGraphStatus = emptyCounts<SourceGraphStatus>([
    'pending',
    'projected',
    'failed',
    'not_applicable',
  ]);
  const countsBySourceFormat: Record<string, number> = {};
  const countsByArtifactFamily: Record<string, number> = {};

  const items = input.artifacts.map((artifact) => {
    const parseReadiness = parseReadinessForArtifact(artifact);
    const searchReadiness = searchReadinessForArtifact(artifact);
    const graphReadiness = graphReadinessForArtifact(artifact);
    const ageHours = hoursBetween(generatedAt, artifact.updatedAt);
    const item: SourceArtifactParseBacklogItem = {
      artifactId: artifact.id,
      sourceEventId: artifact.sourceEventId,
      sourceEventRowId: artifact.sourceEventRowId,
      stageKey: artifact.stageKey,
      originalName: artifact.originalName,
      artifactFamily: artifact.artifactFamily,
      artifactKind: artifact.artifactKind,
      sourceFormat: artifact.sourceFormat,
      mimeType: artifact.mimeType,
      parseStatus: artifact.parseStatus,
      embeddingStatus: artifact.embeddingStatus,
      graphStatus: artifact.graphStatus,
      parseReadiness,
      searchReadiness,
      graphReadiness,
      updatedAt: artifact.updatedAt,
      ageHours,
      note: '',
    };
    return { ...item, note: noteForItem(item) };
  });

  for (const item of items) {
    countsByParseStatus[item.parseStatus] += 1;
    countsByEmbeddingStatus[item.embeddingStatus] += 1;
    countsByGraphStatus[item.graphStatus] += 1;
    increment(countsBySourceFormat, item.sourceFormat);
    increment(countsByArtifactFamily, item.artifactFamily);
  }

  const attentionItems = items
    .filter((item) => isAttentionItem(item, staleParsingAfterHours))
    .slice(0, maxExamples);
  const examples = items.slice(0, maxExamples);

  const counts = {
    totalArtifacts: items.length,
    parsedArtifacts: items.filter((item) => item.parseReadiness === 'parsed')
      .length,
    parserReadyArtifacts: items.filter(
      (item) => item.parseReadiness === 'parser_ready',
    ).length,
    parsingArtifacts: items.filter((item) => item.parseReadiness === 'parsing')
      .length,
    needsReviewArtifacts: items.filter(
      (item) => item.parseReadiness === 'needs_review',
    ).length,
    failedArtifacts: items.filter((item) => item.parseReadiness === 'failed')
      .length,
    unsupportedWithoutOcrOrTranscriptionArtifacts: items.filter(
      (item) =>
        item.parseReadiness === 'unsupported_without_ocr_or_transcription',
    ).length,
    unknownFormatArtifacts: items.filter(
      (item) => item.parseReadiness === 'unknown_format',
    ).length,
    searchReadyArtifacts: items.filter(
      (item) => item.searchReadiness === 'search_ready',
    ).length,
    parsedNotIndexedArtifacts: items.filter(
      (item) => item.searchReadiness === 'parsed_not_indexed',
    ).length,
    graphProjectedArtifacts: items.filter(
      (item) => item.graphReadiness === 'graph_projected',
    ).length,
    staleParsingArtifacts: items.filter(
      (item) =>
        item.parseReadiness === 'parsing' &&
        item.ageHours !== null &&
        item.ageHours >= staleParsingAfterHours,
    ).length,
  };

  const status =
    items.length === 0
      ? 'empty'
      : attentionItems.length > 0
        ? 'attention'
        : 'ok';

  return {
    generatedAt,
    scope: {
      clientKey: input.clientKey,
      ...(input.inputEventId ? { inputEventId: input.inputEventId } : {}),
      ...(input.resolvedEventId ? { resolvedEventId: input.resolvedEventId } : {}),
      ...(input.resolvedEventCode
        ? { resolvedEventCode: input.resolvedEventCode }
        : {}),
    },
    status,
    counts,
    countsByParseStatus,
    countsByEmbeddingStatus,
    countsByGraphStatus,
    countsBySourceFormat,
    countsByArtifactFamily,
    attentionItems,
    examples,
    notes: [
      'Read-only verifier: no artifact bytes were parsed, no rows were written, and no indexing or promotion was attempted.',
      'Stored, parsed, search-ready, graph-projected, enterprise-context-promoted, and agent-ready are intentionally separate states.',
      'Image, audio, and video artifacts remain unsupported for evidence extraction until governed OCR/transcription exists.',
    ],
  };
}
