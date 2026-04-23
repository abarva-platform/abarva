export const FINDINGS_CATEGORY_DEFINITIONS = {
  A: {
    label: 'Creation friction',
    description: `Walls between "I want to create" and "I'm in Phase 1 looking at a charter."`,
  },
  B: {
    label: 'Progression friction',
    description: 'Walls when moving between phases or within a phase module.',
  },
  C: {
    label: 'Content friction',
    description: 'Emptiness or sparseness that makes phases feel hollow.',
  },
  D: {
    label: 'Nexus friction',
    description: 'Moments Nexus feels stub-like, repetitive, or unhelpful.',
  },
  E: {
    label: 'State friction',
    description: 'Data loss, session issues, and persistence gaps.',
  },
} as const;

export const FINDINGS_CATEGORIES = Object.keys(FINDINGS_CATEGORY_DEFINITIONS) as Array<keyof typeof FINDINGS_CATEGORY_DEFINITIONS>;
export type FindingsCategory = (typeof FINDINGS_CATEGORIES)[number];

export const MISMATCH_SEVERITIES = ['none', 'low', 'medium', 'high', 'critical'] as const;
export type MismatchSeverity = (typeof MISMATCH_SEVERITIES)[number];

export const CRITERIA_RESULT_STATUSES = ['pass', 'watch', 'fail'] as const;
export type CriteriaResultStatus = (typeof CRITERIA_RESULT_STATUSES)[number];

export const OVERALL_RECOMMENDATIONS = ['ship', 'ship_with_watchlist', 'hold'] as const;
export type OverallRecommendation = (typeof OVERALL_RECOMMENDATIONS)[number];

export interface TurnEvent {
  cycle_id: string;
  persona: string;
  timestamp: string;
  url: string;
  action: string;
  expected: string;
  actual: string;
  mismatch_severity: MismatchSeverity;
  category: FindingsCategory;
  notes: string;
}

export interface CriteriaResult {
  criterion_key: string;
  label: string;
  status: CriteriaResultStatus;
  category: FindingsCategory;
  notes: string;
}

export interface SessionAssessment {
  cycle_id: string;
  persona: string;
  session_start: string;
  session_end: string;
  narrative: string;
  criteria_results: CriteriaResult[];
  overall_recommendation: OverallRecommendation;
  top_blockers: string[];
}

export interface FindingsCycleBundle {
  cycle_id: string;
  turn_events: TurnEvent[];
  session_assessment: SessionAssessment;
}

export interface FindingsDeltaEntry {
  fingerprint: string;
  category: FindingsCategory;
  persona: string;
  url: string;
  action: string;
  expected: string;
  previous_severity: MismatchSeverity | null;
  current_severity: MismatchSeverity | null;
  previous_actual: string | null;
  current_actual: string | null;
  notes: string[];
}

export interface FindingsDeltaReport {
  previous_cycle_id: string;
  current_cycle_id: string;
  generated_at: string;
  summary: {
    resolved: number;
    persistent: number;
    regression: number;
    new: number;
  };
  assessment_delta: {
    previous_recommendation: OverallRecommendation;
    current_recommendation: OverallRecommendation;
  };
  resolved: FindingsDeltaEntry[];
  persistent: FindingsDeltaEntry[];
  regression: FindingsDeltaEntry[];
  new: FindingsDeltaEntry[];
}

const CYCLE_ID_PATTERN = /^cycle-\d{4}-\d{2}-\d{2}-\d+$/;

export function validateTurnEvent(input: unknown): TurnEvent {
  const record = expectRecord(input, 'turn event');
  return {
    cycle_id: validateCycleId(record.cycle_id),
    persona: validateNonEmptyString(record.persona, 'turn event.persona'),
    timestamp: validateTimestamp(record.timestamp, 'turn event.timestamp'),
    url: validateNonEmptyString(record.url, 'turn event.url'),
    action: validateNonEmptyString(record.action, 'turn event.action'),
    expected: validateNonEmptyString(record.expected, 'turn event.expected'),
    actual: validateNonEmptyString(record.actual, 'turn event.actual'),
    mismatch_severity: validateEnum(record.mismatch_severity, MISMATCH_SEVERITIES, 'turn event.mismatch_severity'),
    category: validateEnum(record.category, FINDINGS_CATEGORIES, 'turn event.category'),
    notes: validateString(record.notes, 'turn event.notes'),
  };
}

export function validateTurnEvents(input: unknown): TurnEvent[] {
  if (!Array.isArray(input)) {
    throw new Error('turn events must be an array');
  }
  return input.map((entry) => validateTurnEvent(entry));
}

export function validateSessionAssessment(input: unknown): SessionAssessment {
  const record = expectRecord(input, 'session assessment');
  const criteriaResults = validateCriteriaResults(record.criteria_results);

  return {
    cycle_id: validateCycleId(record.cycle_id),
    persona: validateNonEmptyString(record.persona, 'session assessment.persona'),
    session_start: validateTimestamp(record.session_start, 'session assessment.session_start'),
    session_end: validateTimestamp(record.session_end, 'session assessment.session_end'),
    narrative: validateNonEmptyString(record.narrative, 'session assessment.narrative'),
    criteria_results: criteriaResults,
    overall_recommendation: validateEnum(
      record.overall_recommendation,
      OVERALL_RECOMMENDATIONS,
      'session assessment.overall_recommendation',
    ),
    top_blockers: validateStringArray(record.top_blockers, 'session assessment.top_blockers'),
  };
}

export function validateCycleBundle(input: unknown): FindingsCycleBundle {
  const record = expectRecord(input, 'findings cycle bundle');
  const turnEvents = validateTurnEvents(record.turn_events);
  const sessionAssessment = validateSessionAssessment(record.session_assessment);
  const cycleId = validateCycleId(record.cycle_id);

  for (const event of turnEvents) {
    if (event.cycle_id !== cycleId) {
      throw new Error(`turn event cycle mismatch: expected ${cycleId}, received ${event.cycle_id}`);
    }
  }
  if (sessionAssessment.cycle_id !== cycleId) {
    throw new Error(`session assessment cycle mismatch: expected ${cycleId}, received ${sessionAssessment.cycle_id}`);
  }

  return {
    cycle_id: cycleId,
    turn_events: turnEvents,
    session_assessment: sessionAssessment,
  };
}

export function validateCycleId(value: unknown): string {
  const cycleId = validateNonEmptyString(value, 'cycle_id');
  if (!CYCLE_ID_PATTERN.test(cycleId)) {
    throw new Error(`cycle_id must match ${CYCLE_ID_PATTERN.source}`);
  }
  return cycleId;
}

export function severityRank(severity: MismatchSeverity): number {
  return MISMATCH_SEVERITIES.indexOf(severity);
}

export function fingerprintForEvent(event: Pick<TurnEvent, 'persona' | 'url' | 'action' | 'expected' | 'category'>): string {
  return [
    normalizeForFingerprint(event.persona),
    normalizeForFingerprint(event.url),
    normalizeForFingerprint(event.action),
    normalizeForFingerprint(event.expected),
    normalizeForFingerprint(event.category),
  ].join('::');
}

function validateCriteriaResults(input: unknown): CriteriaResult[] {
  if (!Array.isArray(input)) {
    throw new Error('session assessment.criteria_results must be an array');
  }
  return input.map((entry, index) => {
    const record = expectRecord(entry, `criteria result ${index}`);
    return {
      criterion_key: validateNonEmptyString(record.criterion_key, `criteria result ${index}.criterion_key`),
      label: validateNonEmptyString(record.label, `criteria result ${index}.label`),
      status: validateEnum(record.status, CRITERIA_RESULT_STATUSES, `criteria result ${index}.status`),
      category: validateEnum(record.category, FINDINGS_CATEGORIES, `criteria result ${index}.category`),
      notes: validateString(record.notes, `criteria result ${index}.notes`),
    };
  });
}

function validateTimestamp(value: unknown, label: string): string {
  const timestamp = validateNonEmptyString(value, label);
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a valid ISO timestamp`);
  }
  return new Date(parsed).toISOString();
}

function validateStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((entry, index) => validateNonEmptyString(entry, `${label}[${index}]`));
}

function validateEnum<const T extends readonly string[]>(value: unknown, allowed: T, label: string): T[number] {
  const normalized = validateNonEmptyString(value, label);
  if (!(allowed as readonly string[]).includes(normalized)) {
    throw new Error(`${label} must be one of: ${(allowed as readonly string[]).join(', ')}`);
  }
  return normalized as T[number];
}

function validateString(value: unknown, label: string): string {
  if (value == null) return '';
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value.trim();
}

function validateNonEmptyString(value: unknown, label: string): string {
  const normalized = validateString(value, label);
  if (!normalized) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return normalized;
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function normalizeForFingerprint(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
