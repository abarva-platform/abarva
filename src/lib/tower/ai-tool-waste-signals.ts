// ACT12 · AI Tool Waste / License Utilization Signals Read Model
//
// Operationalizes the AI tool-waste / license-utilization view of the
// AI Control Tower contract (ACT1). Projects a deterministic,
// cross-tenant inventory of AI license-waste and shadow-IT signals
// that the Tower can compose into Atlas brief content, Sentinel
// pattern surfaces, Steward governance gates, and audit attestations.
//
// This is a deterministic seed-only read model. There are no:
//
// - live integrations,
// - external API calls,
// - migrations,
// - LLM / model invocations,
// - timestamp-dependent values,
// - random values,
// - tenant database lookups,
// - imports from Source / Sentinel / Atlas / Nexus / Agent runtime,
//   auth, or supabase.
//
// Future ACT12.x slices will:
//
// - bind these signals to per-tenant captured license inventories,
// - replace the seed with a connector-backed projection (IDP /
//   procurement / SaaS management),
// - persist mitigations and remediation trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI tool
// waste signal shape across the Tower surface.
//
// Naming policy: this module emits NO real product names. Every label
// is a deterministic placeholder of the form "ai-tool-placeholder-{n}"
// or a generic role / capability description. See ACT1 §K for the
// no-fabrication rules this module honors.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical AI tool waste signal kinds.
 *
 * - `unused_license`: a seat or subscription has zero recorded use
 *   over the observation window.
 * - `duplicate_license`: the same role is provisioned through more
 *   than one overlapping AI capability.
 * - `shadow_it`: an AI capability is in active use without a captured
 *   procurement, security review, or governance approval.
 * - `underused_seat`: a seat is provisioned with active use far below
 *   the licensed capacity.
 * - `expired_subscription`: the subscription term has lapsed but
 *   seats remain provisioned.
 * - `overprovisioned`: more seats are licensed than the population
 *   that is even eligible to use the capability.
 */
export const AI_TOOL_WASTE_SIGNAL_KINDS = [
  'unused_license',
  'duplicate_license',
  'shadow_it',
  'underused_seat',
  'expired_subscription',
  'overprovisioned',
] as const;

export type AiToolWasteSignalKind =
  (typeof AI_TOOL_WASTE_SIGNAL_KINDS)[number];

/**
 * Canonical waste severity levels. Mirrors the AI risk register
 * taxonomy used in ACT5 so the Tower can compose a single severity
 * lens across dimensions.
 */
export const AI_TOOL_WASTE_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type AiToolWasteSeverity = (typeof AI_TOOL_WASTE_SEVERITIES)[number];

/**
 * Canonical signal lifecycle statuses.
 *
 * Ordered: detected -> in_review -> remediated -> accepted, with
 * `escalated` as the parallel branch for signals that exceeded the
 * owner's authority and need executive review.
 */
export const AI_TOOL_WASTE_STATUSES = [
  'detected',
  'in_review',
  'remediated',
  'accepted',
  'escalated',
] as const;

export type AiToolWasteStatus = (typeof AI_TOOL_WASTE_STATUSES)[number];

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Single canonical AI tool waste signal. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds (programs from ACT2-adjacent program
 * canon, AI use cases from ACT2, evidence ledger entries from EVID2).
 */
export interface AiToolWasteSignal {
  /** Stable seed id of the form "tool-waste-seed-{n}". */
  readonly id: string;
  /** Waste signal kind. */
  readonly kind: AiToolWasteSignalKind;
  /**
   * Placeholder label for the AI tool. Always of the form
   * "ai-tool-placeholder-{n}". No real product name appears anywhere
   * in this module.
   */
  readonly toolLabel: string;
  /** Imperative description of the waste pattern. Non-empty. */
  readonly description: string;
  /** Severity per the canonical taxonomy. */
  readonly severity: AiToolWasteSeverity;
  /** Lifecycle status. */
  readonly status: AiToolWasteStatus;
  /** Role of the owner who must close the signal. Non-empty. */
  readonly ownerRole: string;
  /** Number of seats in scope (>= 0). */
  readonly seatsAffected: number;
  /**
   * Fraction of seats actively used over the observation window. In
   * `[0, 1]`. Lower is more wasteful.
   */
  readonly utilizationFraction: number;
  /** Optional program slug the signal targets. */
  readonly programKey?: string;
  /** Optional AI use case seed id the signal targets. */
  readonly aiUseCaseKey?: string;
  /**
   * Evidence ledger seed ids that support the signal. Empty array is
   * allowed for signals that have not yet captured evidence.
   */
  readonly auditableEvidenceIds: readonly string[];
  /** Concrete remediation actions taken or proposed. Always >= 1. */
  readonly remediations: readonly string[];
  /** Provenance marker. Always 'deterministic_ai_tool_waste_signals_seed'. */
  readonly createdFrom: 'deterministic_ai_tool_waste_signals_seed';
}

/**
 * Aggregated waste signal summary. All counts reconcile to
 * `totalSignals`.
 */
export interface AiToolWasteSignalSummary {
  readonly totalSignals: number;
  readonly byKind: Readonly<Record<AiToolWasteSignalKind, number>>;
  readonly bySeverity: Readonly<Record<AiToolWasteSeverity, number>>;
  readonly byStatus: Readonly<Record<AiToolWasteStatus, number>>;
  readonly criticalCount: number;
  readonly detectedCount: number;
  readonly shadowItCount: number;
  readonly totalSeatsAffected: number;
  /**
   * Mean of `utilizationFraction` across all signals. Returns `0`
   * when there are no signals to avoid division by zero. Confined to
   * `[0, 1]`.
   */
  readonly meanUtilizationFraction: number;
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function seedId(n: number): string {
  return `tool-waste-seed-${n}`;
}

/**
 * Build a placeholder tool label. The Tower must show waste posture
 * without endorsing or accusing any vendor brand; this label form is
 * the canonical handshake.
 */
function toolPlaceholder(n: number): string {
  return `ai-tool-placeholder-${n}`;
}

/**
 * Build an evidence ledger seed id. Mirrors the EVID2 canonical
 * format (`evidence-seed-{n}`) without importing the EVID2 module;
 * the linkage is intentionally a string handshake so this module
 * remains free of cross-domain imports.
 */
function evidenceSeedId(n: number): string {
  return `evidence-seed-${n}`;
}

/**
 * The canonical AI tool waste signals seed. Twenty-two records
 * spanning all six signal kinds, all five statuses, all four
 * severities, and a balanced distribution of utilization fractions.
 *
 * Distribution (test-enforced):
 *
 * - >= 1 signal for every canonical kind.
 * - >= 1 signal for every canonical status.
 * - >= 1 signal for every canonical severity.
 * - >= 3 signals carry `severity: 'critical'`.
 * - >= 3 signals carry `kind: 'shadow_it'`.
 * - >= 2 signals carry a `programKey`.
 * - >= 2 signals carry an `aiUseCaseKey`.
 * - Every signal carries >= 1 remediation entry.
 * - Every `utilizationFraction` is in `[0, 1]`.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 */
const AI_TOOL_WASTE_SIGNALS_SEED: readonly AiToolWasteSignal[] = [
  // -----------------------------------------------------------------
  // Kind: unused_license
  // -----------------------------------------------------------------
  {
    id: seedId(1),
    kind: 'unused_license',
    toolLabel: toolPlaceholder(1),
    description:
      'Engineering productivity assistant carries 120 provisioned seats with zero recorded sessions over the last observation window.',
    severity: 'high',
    status: 'detected',
    ownerRole: 'VP Engineering Productivity',
    seatsAffected: 120,
    utilizationFraction: 0,
    auditableEvidenceIds: [evidenceSeedId(1)],
    remediations: [
      'Reclaim provisioned seats with no recorded sessions before the next renewal window.',
      'Capture reclamation decision in the procurement ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(2),
    kind: 'unused_license',
    toolLabel: toolPlaceholder(2),
    description:
      'Marketing copy assistant carries 45 seats provisioned to a discontinued campaign squad with zero recorded sessions.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'Director of Marketing Operations',
    seatsAffected: 45,
    utilizationFraction: 0,
    aiUseCaseKey: 'ai-use-case-seed-7',
    auditableEvidenceIds: [evidenceSeedId(2)],
    remediations: [
      'Confirm squad disbandment with marketing operations and reclaim seats.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Kind: duplicate_license
  // -----------------------------------------------------------------
  {
    id: seedId(3),
    kind: 'duplicate_license',
    toolLabel: toolPlaceholder(3),
    description:
      'Customer support response suggestion is provisioned through two overlapping capabilities for the same support population.',
    severity: 'high',
    status: 'in_review',
    ownerRole: 'SVP Customer Experience',
    seatsAffected: 220,
    utilizationFraction: 0.55,
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-9',
    auditableEvidenceIds: [evidenceSeedId(3), evidenceSeedId(4)],
    remediations: [
      'Consolidate to a single capability for the support population.',
      'Capture the consolidation decision in the procurement ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(4),
    kind: 'duplicate_license',
    toolLabel: toolPlaceholder(4),
    description:
      'Knowledge search assistants are provisioned through two overlapping subscriptions across operations and support orgs.',
    severity: 'medium',
    status: 'remediated',
    ownerRole: 'Chief Information Officer',
    seatsAffected: 310,
    utilizationFraction: 0.62,
    auditableEvidenceIds: [evidenceSeedId(5)],
    remediations: [
      'Standardize on the operations-owned subscription and retire the support-owned subscription on renewal.',
      'Capture migration plan in the IT ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Kind: shadow_it
  // -----------------------------------------------------------------
  {
    id: seedId(5),
    kind: 'shadow_it',
    toolLabel: toolPlaceholder(5),
    description:
      'Sales prospecting assistant is in active use by the field sales org without captured procurement or security review.',
    severity: 'critical',
    status: 'escalated',
    ownerRole: 'Chief Revenue Officer',
    seatsAffected: 85,
    utilizationFraction: 0.74,
    auditableEvidenceIds: [],
    remediations: [
      'Halt new account creation pending security review.',
      'Initiate procurement and security intake to bring the capability under governance.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(6),
    kind: 'shadow_it',
    toolLabel: toolPlaceholder(6),
    description:
      'Engineering experimentation assistant is in active use against the production source repository without captured security review.',
    severity: 'critical',
    status: 'in_review',
    ownerRole: 'Chief Information Security Officer',
    seatsAffected: 32,
    utilizationFraction: 0.68,
    aiUseCaseKey: 'ai-use-case-seed-10',
    auditableEvidenceIds: [evidenceSeedId(6)],
    remediations: [
      'Block repository connector pending security review.',
      'Capture review outcome in the security ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(7),
    kind: 'shadow_it',
    toolLabel: toolPlaceholder(7),
    description:
      'Finance forecasting assistant is in use without captured Legal, Privacy, or model risk management review.',
    severity: 'high',
    status: 'detected',
    ownerRole: 'Chief Financial Officer',
    seatsAffected: 18,
    utilizationFraction: 0.42,
    auditableEvidenceIds: [],
    remediations: [
      'Pause Finance forecasting assistant pending Legal, Privacy, and MRM review.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Kind: underused_seat
  // -----------------------------------------------------------------
  {
    id: seedId(8),
    kind: 'underused_seat',
    toolLabel: toolPlaceholder(8),
    description:
      'Document understanding assistant carries 200 seats but only 22 percent of seats record sessions in the observation window.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'Director of Operations Productivity',
    seatsAffected: 200,
    utilizationFraction: 0.22,
    auditableEvidenceIds: [evidenceSeedId(7)],
    remediations: [
      'Right-size seat count to active population at next renewal.',
      'Capture right-sizing decision in the procurement ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(9),
    kind: 'underused_seat',
    toolLabel: toolPlaceholder(9),
    description:
      'Data analyst notebook assistant carries 150 seats with 18 percent active usage; remaining seats sit idle.',
    severity: 'medium',
    status: 'detected',
    ownerRole: 'VP Data Platform',
    seatsAffected: 150,
    utilizationFraction: 0.18,
    auditableEvidenceIds: [evidenceSeedId(8)],
    remediations: [
      'Reclaim idle seats and reissue only on attested role need.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(10),
    kind: 'underused_seat',
    toolLabel: toolPlaceholder(10),
    description:
      'Risk control narrative assistant carries 60 seats with 30 percent active usage among the risk and compliance population.',
    severity: 'low',
    status: 'remediated',
    ownerRole: 'Chief Risk Officer',
    seatsAffected: 60,
    utilizationFraction: 0.3,
    auditableEvidenceIds: [evidenceSeedId(9)],
    remediations: [
      'Hold seat count flat through next renewal pending adoption coaching outcomes.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Kind: expired_subscription
  // -----------------------------------------------------------------
  {
    id: seedId(11),
    kind: 'expired_subscription',
    toolLabel: toolPlaceholder(11),
    description:
      'Procurement contract review assistant subscription term has lapsed; seats remain provisioned without active contract.',
    severity: 'critical',
    status: 'escalated',
    ownerRole: 'Chief Procurement Officer',
    seatsAffected: 40,
    utilizationFraction: 0.45,
    auditableEvidenceIds: [evidenceSeedId(10)],
    remediations: [
      'Halt new logins until renewal is signed or capability is decommissioned.',
      'Capture decision (renew or decommission) in the procurement ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(12),
    kind: 'expired_subscription',
    toolLabel: toolPlaceholder(12),
    description:
      'HR talent search assistant subscription expired three observation windows ago; seats remain provisioned.',
    severity: 'high',
    status: 'in_review',
    ownerRole: 'Chief Human Resources Officer',
    seatsAffected: 25,
    utilizationFraction: 0.36,
    auditableEvidenceIds: [],
    remediations: [
      'Decommission seats and reissue under a renewed contract if HR confirms continued need.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(13),
    kind: 'expired_subscription',
    toolLabel: toolPlaceholder(13),
    description:
      'Operations field knowledge assistant pilot subscription lapsed without renewal; pilot seats remain reachable.',
    severity: 'medium',
    status: 'remediated',
    ownerRole: 'VP Field Operations',
    seatsAffected: 15,
    utilizationFraction: 0.4,
    auditableEvidenceIds: [evidenceSeedId(11)],
    remediations: [
      'Confirm pilot decommission with field operations and capture outcome in the operations ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Kind: overprovisioned
  // -----------------------------------------------------------------
  {
    id: seedId(14),
    kind: 'overprovisioned',
    toolLabel: toolPlaceholder(14),
    description:
      'Customer support self-service assistant is licensed at 400 seats while only 220 support agents are eligible to use it.',
    severity: 'high',
    status: 'detected',
    ownerRole: 'SVP Customer Experience',
    seatsAffected: 400,
    utilizationFraction: 0.4,
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-13',
    auditableEvidenceIds: [evidenceSeedId(12)],
    remediations: [
      'Right-size seat count to eligible support population at the next renewal.',
      'Capture right-sizing decision in the customer experience ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(15),
    kind: 'overprovisioned',
    toolLabel: toolPlaceholder(15),
    description:
      'Demand forecasting assistant is licensed at 80 seats while only 28 planners are eligible to use it.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'VP Supply Chain Planning',
    seatsAffected: 80,
    utilizationFraction: 0.35,
    programKey: 'demand-forecasting',
    aiUseCaseKey: 'ai-use-case-seed-14',
    auditableEvidenceIds: [evidenceSeedId(13)],
    remediations: [
      'Reduce seat count to the eligible planner population at next renewal.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(16),
    kind: 'overprovisioned',
    toolLabel: toolPlaceholder(16),
    description:
      'Engineering pull-request review assistant is licensed at 600 seats while only 340 engineers are eligible.',
    severity: 'low',
    status: 'accepted',
    ownerRole: 'VP Engineering',
    seatsAffected: 600,
    utilizationFraction: 0.52,
    auditableEvidenceIds: [evidenceSeedId(14)],
    remediations: [
      'Hold seat count through current term; right-size at renewal once eligibility list is final.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },

  // -----------------------------------------------------------------
  // Surplus rows to ensure >= 3 critical, >= 3 shadow_it,
  // >= 1 accepted status, balanced severity / status coverage.
  // -----------------------------------------------------------------
  {
    id: seedId(17),
    kind: 'unused_license',
    toolLabel: toolPlaceholder(17),
    description:
      'Compliance briefing assistant carries 50 provisioned seats with zero recorded sessions across two observation windows.',
    severity: 'critical',
    status: 'detected',
    ownerRole: 'Chief Compliance Officer',
    seatsAffected: 50,
    utilizationFraction: 0,
    auditableEvidenceIds: [evidenceSeedId(15)],
    remediations: [
      'Reclaim 50 unused seats before next renewal.',
      'Capture decision in the compliance ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(18),
    kind: 'shadow_it',
    toolLabel: toolPlaceholder(18),
    description:
      'Marketing brand voice assistant is in use without captured Legal review of corpus eligibility.',
    severity: 'high',
    status: 'detected',
    ownerRole: 'General Counsel',
    seatsAffected: 22,
    utilizationFraction: 0.5,
    auditableEvidenceIds: [],
    remediations: [
      'Pause use and engage Legal to confirm corpus eligibility before resuming.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(19),
    kind: 'duplicate_license',
    toolLabel: toolPlaceholder(19),
    description:
      'Translation assistants are provisioned through two overlapping vendors for the same multi-locale support team.',
    severity: 'low',
    status: 'accepted',
    ownerRole: 'Director of Localization',
    seatsAffected: 70,
    utilizationFraction: 0.6,
    auditableEvidenceIds: [evidenceSeedId(16)],
    remediations: [
      'Hold both subscriptions through current term; consolidate at next renewal once translation quality scoring is captured.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(20),
    kind: 'underused_seat',
    toolLabel: toolPlaceholder(20),
    description:
      'Field service knowledge assistant carries 90 seats with 27 percent active usage among field technicians.',
    severity: 'low',
    status: 'remediated',
    ownerRole: 'VP Field Operations',
    seatsAffected: 90,
    utilizationFraction: 0.27,
    auditableEvidenceIds: [evidenceSeedId(17)],
    remediations: [
      'Pair seat reissue with adoption coaching for the field technician population.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(21),
    kind: 'expired_subscription',
    toolLabel: toolPlaceholder(21),
    description:
      'Risk control narrative assistant subscription lapsed; seats remain provisioned for the risk team.',
    severity: 'high',
    status: 'escalated',
    ownerRole: 'Chief Risk Officer',
    seatsAffected: 12,
    utilizationFraction: 0.33,
    auditableEvidenceIds: [],
    remediations: [
      'Escalate renewal decision to the Risk Steering Committee; halt new logins until decision is captured.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
  {
    id: seedId(22),
    kind: 'overprovisioned',
    toolLabel: toolPlaceholder(22),
    description:
      'Vendor risk briefing assistant is licensed at 100 seats while only 14 vendor risk analysts are eligible.',
    severity: 'critical',
    status: 'in_review',
    ownerRole: 'Director of Vendor Risk',
    seatsAffected: 100,
    utilizationFraction: 0.14,
    auditableEvidenceIds: [evidenceSeedId(18)],
    remediations: [
      'Reduce seat count to the eligible analyst population at next renewal.',
      'Capture right-sizing decision in the vendor risk ledger.',
    ],
    createdFrom: 'deterministic_ai_tool_waste_signals_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI tool waste signal list. Result is a frozen,
 * deterministic list; repeated calls return byte-equal data.
 */
export function buildAiToolWasteSignalsSeed(): readonly AiToolWasteSignal[] {
  return AI_TOOL_WASTE_SIGNALS_SEED;
}

/**
 * Initialize a per-kind record where every canonical kind is present
 * with count 0. Used as the starting point for `byKind` aggregation
 * so callers can rely on every kind key existing even when count is
 * zero.
 */
function emptyKindCounts(): Record<AiToolWasteSignalKind, number> {
  const out: Record<AiToolWasteSignalKind, number> = {
    unused_license: 0,
    duplicate_license: 0,
    shadow_it: 0,
    underused_seat: 0,
    expired_subscription: 0,
    overprovisioned: 0,
  };
  return out;
}

/**
 * Initialize a per-severity record where every canonical severity is
 * present with count 0.
 */
function emptySeverityCounts(): Record<AiToolWasteSeverity, number> {
  const out: Record<AiToolWasteSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  return out;
}

/**
 * Initialize a per-status record where every canonical status is
 * present with count 0.
 */
function emptyStatusCounts(): Record<AiToolWasteStatus, number> {
  const out: Record<AiToolWasteStatus, number> = {
    detected: 0,
    in_review: 0,
    remediated: 0,
    accepted: 0,
    escalated: 0,
  };
  return out;
}

/**
 * Build the deterministic summary for a list of signals. When no
 * signals list is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byKind).reduce(...)` equals `totalSignals`.
 * - `Object.values(bySeverity).reduce(...)` equals `totalSignals`.
 * - `Object.values(byStatus).reduce(...)` equals `totalSignals`.
 * - `criticalCount` equals `bySeverity.critical`.
 * - `detectedCount` equals `byStatus.detected`.
 * - `shadowItCount` equals `byKind.shadow_it`.
 * - `totalSeatsAffected` is the sum of `seatsAffected` across signals.
 * - `meanUtilizationFraction` is the arithmetic mean of
 *   `utilizationFraction` and is `0` for an empty input list.
 */
export function summarizeAiToolWasteSignals(
  signals: readonly AiToolWasteSignal[] = AI_TOOL_WASTE_SIGNALS_SEED,
): AiToolWasteSignalSummary {
  const byKind = emptyKindCounts();
  const bySeverity = emptySeverityCounts();
  const byStatus = emptyStatusCounts();
  let totalSeatsAffected = 0;
  let utilizationSum = 0;

  for (const signal of signals) {
    byKind[signal.kind] += 1;
    bySeverity[signal.severity] += 1;
    byStatus[signal.status] += 1;
    totalSeatsAffected += signal.seatsAffected;
    utilizationSum += signal.utilizationFraction;
  }

  const totalSignals = signals.length;
  const meanUtilizationFraction =
    totalSignals === 0 ? 0 : utilizationSum / totalSignals;

  return {
    totalSignals,
    byKind,
    bySeverity,
    byStatus,
    criticalCount: bySeverity.critical,
    detectedCount: byStatus.detected,
    shadowItCount: byKind.shadow_it,
    totalSeatsAffected,
    meanUtilizationFraction,
  };
}

/**
 * Filter signals by `severity === 'critical'`. Returns signals in the
 * same order they appear in the input list.
 */
export function getCriticalWasteSignals(
  signals: readonly AiToolWasteSignal[] = AI_TOOL_WASTE_SIGNALS_SEED,
): readonly AiToolWasteSignal[] {
  return signals.filter((signal) => signal.severity === 'critical');
}
