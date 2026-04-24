// Data readiness assessment · File 01 FM-02 P0
//
// Phase 1 precondition: before a program commits past the Phase 1 → 2
// gate, the tenant declares data readiness across five dimensions. Each
// dimension carries a status, a named owner, and a note. Gaps or blocks
// surface explicitly — "everything is green" is a voice-contract violation.
//
// Client-safe (types + validator). Server ledger lives in
// dataReadinessLedger.ts.

export type ReadinessStatus = 'ready' | 'gaps' | 'blocked';

export type ReadinessDimension =
  | 'availability'
  | 'quality'
  | 'governance'
  | 'skills'
  | 'integration';

export interface ReadinessDimensionInput {
  dimension: ReadinessDimension;
  status: ReadinessStatus;
  /** Named owner — person or role responsible for this dimension. */
  owner: string;
  /** One-sentence qualifier. For `gaps` and `blocked`, names the specific gap/block. */
  note: string;
}

export interface DataReadinessInput {
  programCode: string;
  dimensions: ReadinessDimensionInput[];
  /** Overall posture summary — what the tenant is willing to commit to. */
  posture: string;
}

export interface DataReadinessRecord extends DataReadinessInput {
  id: string;
  assessedById: string;
  assessedByName: string | null;
  assessedAt: string;
}

export interface DataReadinessLedger {
  schemaVersion: '1.0';
  entries: DataReadinessRecord[];
}

export type DataReadinessValidationError =
  | { field: 'programCode'; reason: 'required' }
  | { field: 'dimensions'; reason: 'required_all_five' | 'duplicate_dimension' }
  | { field: 'dimension_owner'; reason: 'required'; dimension: ReadinessDimension }
  | { field: 'dimension_note'; reason: 'required' | 'too_short' | 'gap_needs_specifics'; dimension: ReadinessDimension }
  | { field: 'posture'; reason: 'required' | 'too_short' };

const ALL_DIMENSIONS: ReadinessDimension[] = ['availability', 'quality', 'governance', 'skills', 'integration'];

export const DIMENSION_LABELS: Record<ReadinessDimension, { label: string; prompt: string }> = {
  availability: {
    label: 'Data availability',
    prompt: 'Are the data sources the pattern needs actually accessible from program-owned systems?',
  },
  quality: {
    label: 'Data quality',
    prompt: 'Is the data fresh, complete, and schema-conformant enough for pattern consumption?',
  },
  governance: {
    label: 'Data governance',
    prompt: 'Are data contracts, owners, compliance reviews, and access controls in place?',
  },
  skills: {
    label: 'Data skills',
    prompt: 'Does the tenant have the people (engineers, analysts, stewards) to operate the data layer?',
  },
  integration: {
    label: 'Integration maturity',
    prompt: 'Are ETL / streams / APIs production-grade enough to support the pattern\u2019s throughput?',
  },
};

export const STATUS_LABELS: Record<ReadinessStatus, { label: string; accent: string }> = {
  ready: { label: 'Ready', accent: '#14B8A6' },
  gaps: { label: 'Gaps', accent: '#D97706' },
  blocked: { label: 'Blocked', accent: '#E04444' },
};

export function validateDataReadiness(input: Partial<DataReadinessInput>): DataReadinessValidationError[] {
  const errors: DataReadinessValidationError[] = [];
  if (!input.programCode?.trim()) errors.push({ field: 'programCode', reason: 'required' });

  const dims = input.dimensions ?? [];
  if (dims.length !== 5) {
    errors.push({ field: 'dimensions', reason: 'required_all_five' });
  }
  const seen = new Set<string>();
  for (const d of dims) {
    if (seen.has(d.dimension)) {
      errors.push({ field: 'dimensions', reason: 'duplicate_dimension' });
    }
    seen.add(d.dimension);
    if (!d.owner?.trim()) {
      errors.push({ field: 'dimension_owner', reason: 'required', dimension: d.dimension });
    }
    const note = d.note?.trim() ?? '';
    if (!note) {
      errors.push({ field: 'dimension_note', reason: 'required', dimension: d.dimension });
    } else if (note.length < 15) {
      errors.push({ field: 'dimension_note', reason: 'too_short', dimension: d.dimension });
    } else if ((d.status === 'gaps' || d.status === 'blocked') && !/\b(gap|block|miss|absent|incomplete|stale|unowned|unclear|pending|delay|risk)\b/i.test(note)) {
      // Gaps and blocks must name the specific issue — vague "ok-ish"
      // notes fail this check.
      errors.push({ field: 'dimension_note', reason: 'gap_needs_specifics', dimension: d.dimension });
    }
  }
  // Ensure all five dimensions represented
  for (const required of ALL_DIMENSIONS) {
    if (!seen.has(required)) {
      errors.push({ field: 'dimensions', reason: 'required_all_five' });
      break;
    }
  }

  const posture = input.posture?.trim() ?? '';
  if (!posture) {
    errors.push({ field: 'posture', reason: 'required' });
  } else if (posture.length < 30) {
    errors.push({ field: 'posture', reason: 'too_short' });
  }

  return errors;
}

export const VALIDATION_REASON_COPY = {
  required: 'Required.',
  required_all_five: 'All five dimensions must be assessed — availability, quality, governance, skills, integration.',
  duplicate_dimension: 'Each dimension must appear exactly once.',
  too_short: 'Needs a full sentence — one sponsor can be held to.',
  gap_needs_specifics: 'Gaps and blocks must name the specific issue (gap, block, missing, unowned, etc.).',
} as const;
