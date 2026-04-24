// Stakeholder success + tension capture · File 01 FM-04 P0
//
// Two companion records that Phase 1 → Phase 2 gate requires alongside
// the sponsor commitment (FM-03):
//
//   StakeholderSuccess (D02 Stakeholder Map) · each Tier 1 stakeholder
//     declares a measurable definition of success — not "we want this to
//     go well", but a named metric, a target, and a horizon.
//
//   ProgramTension (D04 Intake Synthesis) · each Tier 1 stakeholder's
//     top tension is captured explicitly with a resolution path. Tensions
//     that lack a named owner or resolution path block gate advance.
//
// Why both live in one module: they're tightly coupled to the same
// Tier 1 stakeholder list from FM-04 spec, the renderers share the
// stakeholder resolver, and gate checks validate them together.
//
// Client-safe (types + validators only). Server-only ledger reader lives
// in stakeholderSuccessLedger.ts.

export interface StakeholderSuccessInput {
  programCode: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderRole: string;
  /** One-sentence definition — must be measurable. */
  successDefinition: string;
  /** Named metric the sponsor can measure (e.g. "documentation minutes per encounter"). */
  metric: string;
  /** Target value + unit as free text (e.g. "< 45 min by month 12"). */
  target: string;
  /** Months from program start when target should hit. */
  horizonMonths: number;
}

export interface StakeholderSuccessRecord extends StakeholderSuccessInput {
  id: string;
  capturedById: string;
  capturedByName: string | null;
  capturedAt: string;
}

export interface ProgramTensionInput {
  programCode: string;
  stakeholderId: string;
  stakeholderName: string;
  /** One-sentence tension statement. */
  tension: string;
  /** Where the tension sits: scope, resource, political, technical, timing. */
  category: 'scope' | 'resource' | 'political' | 'technical' | 'timing';
  /** Named resolution path — the concrete step or decision that relieves the tension. */
  resolutionPath: string;
  /** Person or role who owns resolving this tension. Required; unnamed blocks the gate. */
  owner: string;
}

export interface ProgramTensionRecord extends ProgramTensionInput {
  id: string;
  capturedById: string;
  capturedByName: string | null;
  capturedAt: string;
}

export interface StakeholderSuccessLedger {
  schemaVersion: '1.0';
  successEntries: StakeholderSuccessRecord[];
  tensionEntries: ProgramTensionRecord[];
}

export type StakeholderSuccessValidationError =
  | { field: 'programCode'; reason: 'required' }
  | { field: 'stakeholderId'; reason: 'required' }
  | { field: 'stakeholderName'; reason: 'required' }
  | { field: 'stakeholderRole'; reason: 'required' }
  | { field: 'successDefinition'; reason: 'required' | 'too_short' | 'not_measurable' }
  | { field: 'metric'; reason: 'required' }
  | { field: 'target'; reason: 'required' }
  | { field: 'horizonMonths'; reason: 'required' | 'must_be_positive' };

export type ProgramTensionValidationError =
  | { field: 'programCode'; reason: 'required' }
  | { field: 'stakeholderId'; reason: 'required' }
  | { field: 'stakeholderName'; reason: 'required' }
  | { field: 'tension'; reason: 'required' | 'too_short' }
  | { field: 'category'; reason: 'required' | 'invalid' }
  | { field: 'resolutionPath'; reason: 'required' | 'too_short' }
  | { field: 'owner'; reason: 'required' };

const TENSION_CATEGORIES = ['scope', 'resource', 'political', 'technical', 'timing'] as const;

// A definition-of-success that doesn't name a number, percent, or dollar
// figure is aspirational, not measurable. Stricter heuristic: require a
// concrete numeric signal. "Feel better about documentation" fails;
// "reduce documentation minutes from 22 to below 10" passes. Not
// perfect — sponsor still owns quality — but catches obvious non-answers.
function looksMeasurable(text: string): boolean {
  return /\d|\bpct\b|%|\$/.test(text);
}

export function validateStakeholderSuccess(
  input: Partial<StakeholderSuccessInput>,
): StakeholderSuccessValidationError[] {
  const errors: StakeholderSuccessValidationError[] = [];
  if (!input.programCode?.trim()) errors.push({ field: 'programCode', reason: 'required' });
  if (!input.stakeholderId?.trim()) errors.push({ field: 'stakeholderId', reason: 'required' });
  if (!input.stakeholderName?.trim()) errors.push({ field: 'stakeholderName', reason: 'required' });
  if (!input.stakeholderRole?.trim()) errors.push({ field: 'stakeholderRole', reason: 'required' });

  const def = input.successDefinition?.trim() ?? '';
  if (!def) {
    errors.push({ field: 'successDefinition', reason: 'required' });
  } else if (def.length < 30) {
    errors.push({ field: 'successDefinition', reason: 'too_short' });
  } else if (!looksMeasurable(def)) {
    errors.push({ field: 'successDefinition', reason: 'not_measurable' });
  }

  if (!input.metric?.trim()) errors.push({ field: 'metric', reason: 'required' });
  if (!input.target?.trim()) errors.push({ field: 'target', reason: 'required' });

  if (typeof input.horizonMonths !== 'number' || !Number.isFinite(input.horizonMonths)) {
    errors.push({ field: 'horizonMonths', reason: 'required' });
  } else if (input.horizonMonths <= 0) {
    errors.push({ field: 'horizonMonths', reason: 'must_be_positive' });
  }

  return errors;
}

export function validateProgramTension(
  input: Partial<ProgramTensionInput>,
): ProgramTensionValidationError[] {
  const errors: ProgramTensionValidationError[] = [];
  if (!input.programCode?.trim()) errors.push({ field: 'programCode', reason: 'required' });
  if (!input.stakeholderId?.trim()) errors.push({ field: 'stakeholderId', reason: 'required' });
  if (!input.stakeholderName?.trim()) errors.push({ field: 'stakeholderName', reason: 'required' });

  const tension = input.tension?.trim() ?? '';
  if (!tension) {
    errors.push({ field: 'tension', reason: 'required' });
  } else if (tension.length < 30) {
    errors.push({ field: 'tension', reason: 'too_short' });
  }

  if (!input.category) {
    errors.push({ field: 'category', reason: 'required' });
  } else if (!TENSION_CATEGORIES.includes(input.category as typeof TENSION_CATEGORIES[number])) {
    errors.push({ field: 'category', reason: 'invalid' });
  }

  const resolution = input.resolutionPath?.trim() ?? '';
  if (!resolution) {
    errors.push({ field: 'resolutionPath', reason: 'required' });
  } else if (resolution.length < 30) {
    errors.push({ field: 'resolutionPath', reason: 'too_short' });
  }

  if (!input.owner?.trim()) errors.push({ field: 'owner', reason: 'required' });

  return errors;
}

export const VALIDATION_REASON_COPY = {
  required: 'Required.',
  too_short: 'Needs a full sentence — a placeholder won\u2019t hold at phase-gate.',
  not_measurable: 'Must be measurable. Name a metric or a number the sponsor can be held to.',
  must_be_positive: 'Must be greater than zero.',
  invalid: 'Not a valid category.',
} as const;
