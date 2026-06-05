import type {
  EvidenceSourceType,
  EvidenceSurface,
  RecordEvidenceInput,
} from '@/lib/evidence/ledger';

type CsvRow = Record<string, string>;

const ALLOWED_SURFACES: readonly EvidenceSurface[] = [
  'moves',
  'intelligence',
  'source',
  'tower',
  'watchlist',
];

function splitList(value: string): string[] {
  return value.split(/[;,|]/).map((item) => item.trim()).filter(Boolean);
}

function evidenceSourceType(value: string): EvidenceSourceType {
  switch (value.trim().toLowerCase()) {
    case 'public':
      return 'document_extract';
    case 'synthetic_internal':
      return 'tenant_record';
    case 'generated':
      return 'derived';
    case 'corpus':
      return 'corpus_pattern';
    default:
      return 'tenant_record';
  }
}

function confidenceScore(value: string): number {
  switch (value.trim().toLowerCase()) {
    case 'high':
      return 0.9;
    case 'medium':
      return 0.65;
    case 'low':
      return 0.35;
    default:
      return 0.5;
  }
}

function primarySurface(value: string): EvidenceSurface {
  const requested = splitList(value);
  for (const item of requested) {
    if ((ALLOWED_SURFACES as readonly string[]).includes(item)) return item as EvidenceSurface;
  }
  return 'moves';
}

export function buildPHSEvidenceLedgerInputs(args: {
  clientId: string;
  uploadedBy: string;
  uploadId: string;
  fileName: string;
  rows: readonly CsvRow[];
}): RecordEvidenceInput[] {
  return args.rows.map((row, index) => {
    const citationKey = row.citation_key.trim();
    const usableBySurface = splitList(row.usable_by_surface);
    const freshnessAt = row.evidence_date.trim();
    return {
      clientId: args.clientId,
      surface: primarySurface(row.usable_by_surface),
      artifactType: 'citation',
      artifactRef: citationKey,
      claimText: `${row.title.trim()}: ${row.summary.trim()}`,
      sourceType: evidenceSourceType(row.source_type),
      sourceRef: {
        template_id: 'phs-evidence-register',
        citation_key: citationKey,
        source_type_declared: row.source_type.trim(),
        source_url: row.source_url?.trim() || null,
        storage_path: row.storage_path?.trim() || null,
        source_doc: args.fileName,
        source_row: index + 2,
        upload_id: args.uploadId,
        usable_by_surface: usableBySurface,
        sensitivity: row.sensitivity.trim(),
      },
      sourceQuote: row.source_quote?.trim() || null,
      freshnessAt,
      confidence: confidenceScore(row.confidence),
      confidenceBasis: `PHS evidence register confidence=${row.confidence.trim() || 'unspecified'}.`,
      ownerRole: row.owner.trim(),
      createdBy: args.uploadedBy,
    };
  });
}
