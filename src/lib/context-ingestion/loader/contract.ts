// Admin Loader — shared contract (the seam every loader module builds against).
// Pure types + constants; no I/O, no server-only. See docs/build/setup-admin-loader/.

/** Canonical context dimensions the loader maps any upload into. */
export type LoaderDimension =
  | 'leadership_org'
  | 'kpis'
  | 'applications_systems'
  | 'data_analytics_stack'
  | 'integrations'
  | 'vendors_contracts'
  | 'business_units_geographies'
  | 'initiatives_roadmap'
  | 'risks_controls'
  | 'financial_baseline'
  | 'processes_operating_model'
  | 'infrastructure_estate'
  | 'business_capability'
  | 'unknown';

export const LOADER_DIMENSIONS: LoaderDimension[] = [
  'leadership_org', 'kpis', 'applications_systems', 'data_analytics_stack',
  'integrations', 'vendors_contracts', 'business_units_geographies',
  'initiatives_roadmap', 'risks_controls', 'financial_baseline',
  'processes_operating_model', 'infrastructure_estate', 'business_capability',
];

/** Gate 0: a preserved original in Azure Blob, hash-verified. No fact without one. */
export interface PreservedSourceFile {
  tenantKey: string;
  filename: string;
  container: string;
  objectKey: string; // path within container, e.g. landing/<tenant>/inbox/<uuid>-<name>
  blobUrl: string; // durable URI to the preserved original
  fileHash: string; // sha256 hex of the original bytes
  bytes: number;
  contentType?: string;
  uploadedBy?: string;
  ingestedAt: string; // ISO
}

export interface FieldMapping {
  sourceColumn: string; // or section/cell ref for documents
  canonicalField: string; // e.g. "person.title", "spend.run_rate_usd"
  confidence: number; // 0..1
  citation?: string; // page/row/sheet/cell in the preserved original
}

export interface MappingProposal {
  source: PreservedSourceFile;
  dimension: LoaderDimension;
  dimensionConfidence: number; // 0..1
  fieldMappings: FieldMapping[];
  sampleRows?: Array<Record<string, unknown>>;
  reviewRequired: boolean; // true for document-derived (never auto-commit)
}

export type StewardFindingKind = 'conflict' | 'realism' | 'implied_gap' | 'schema' | 'duplicate' | 'orphan';
export type StewardSeverity = 'info' | 'warn' | 'block';

/** An open-ended validation finding (deterministic OR agent-produced). */
export interface StewardFinding {
  kind: StewardFindingKind;
  severity: StewardSeverity;
  message: string; // plain-language, e.g. "Two people titled CFO — pick current"
  rowRef?: string; // row/record the finding is about
  suggestedAction?: string;
  source: 'deterministic' | 'agent';
}

/** A batched, plain-language clarification — mapping/interpretation only, never "supply data". */
export interface ClarificationQuestion {
  fileObjectKey: string;
  question: string;
  options: string[]; // choices; first is the best-guess (pre-selected)
  bestGuessIndex: number;
  field?: string; // the mapping field in question (if any)
}

/** Confidence thresholds that decide auto vs confirm vs ask. */
export const LOADER_CONFIDENCE = {
  AUTO: 0.85, // >= AUTO: auto-classified, shown, no question
  CONFIRM: 0.6, // [CONFIRM, AUTO): best-guess pre-selected, one-tap confirm
  // < CONFIRM: ask a batched clarification
} as const;

export function classifyConfidence(c: number): 'auto' | 'confirm' | 'ask' {
  if (c >= LOADER_CONFIDENCE.AUTO) return 'auto';
  if (c >= LOADER_CONFIDENCE.CONFIRM) return 'confirm';
  return 'ask';
}

/** Result of validating a proposal: findings + the questions to surface (escalate if needed). */
export interface StewardValidation {
  flags: StewardFinding[];
  questions: ClarificationQuestion[];
  escalateToConversation: boolean; // true => open scoped Ask-Steward dock
}
