// ACT2 · AI Portfolio Inventory Read Model
//
// Operationalizes dimension #1 ("AI Portfolio Inventory") of the AI
// Control Tower contract (ACT1). Projects a deterministic, cross-tenant
// inventory of AI use cases the Tower can compose into Atlas brief
// content, scorecards, and pressure cards.
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
// Future ACT2.x slices will:
//
// - bind these records to per-tenant captured inventory,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI portfolio
// inventory shape across the Tower surface.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical AI use case lifecycle stages.
 *
 * Ordered: idea → discovery → pilot → production → scaled, with
 * `retired` for sunset cases and `blocked` for stalled cases that
 * require an intervention.
 */
export const AI_USE_CASE_STAGES = [
  'idea',
  'discovery',
  'pilot',
  'production',
  'scaled',
  'retired',
  'blocked',
] as const;

export type AiUseCaseStage = (typeof AI_USE_CASE_STAGES)[number];

/**
 * Canonical risk levels. Mirrors the AI risk register taxonomy used
 * elsewhere in the Tower (Risk / Compliance / Governance dimension).
 */
export const AI_USE_CASE_RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type AiUseCaseRiskLevel = (typeof AI_USE_CASE_RISK_LEVELS)[number];

/**
 * Canonical value readiness states.
 *
 * Tracks how rigorously the use case's value is captured. Atlas refuses
 * to claim a dollar number for any state other than
 * `measured_in_production`.
 */
export const AI_USE_CASE_VALUE_READINESS_STATES = [
  'unmeasured',
  'projected',
  'in_pilot_measurement',
  'measured_in_production',
  'declined',
] as const;

export type AiUseCaseValueReadiness =
  (typeof AI_USE_CASE_VALUE_READINESS_STATES)[number];

/**
 * Canonical adoption status. Mirrors Adoption & Usage dimension.
 */
export const AI_USE_CASE_ADOPTION_STATUSES = [
  'not_started',
  'opt_in_only',
  'rolling_out',
  'broadly_adopted',
  'mandated',
] as const;

export type AiUseCaseAdoptionStatus =
  (typeof AI_USE_CASE_ADOPTION_STATUSES)[number];

/**
 * Canonical data readiness. Mirrors Tech & Data Readiness dimension.
 */
export const AI_USE_CASE_DATA_READINESS_STATES = [
  'data_missing',
  'data_partial',
  'data_usable',
  'data_governed',
] as const;

export type AiUseCaseDataReadiness =
  (typeof AI_USE_CASE_DATA_READINESS_STATES)[number];

/**
 * Canonical governance status. Mirrors Risk / Compliance / Governance
 * dimension.
 */
export const AI_USE_CASE_GOVERNANCE_STATUSES = [
  'undefined',
  'in_review',
  'approved',
  'auditable',
  'flagged',
] as const;

export type AiUseCaseGovernanceStatus =
  (typeof AI_USE_CASE_GOVERNANCE_STATUSES)[number];

/**
 * Owner responsibility scope. The Tower distinguishes business-function
 * owners from technology / governance / value-office owners so the
 * Atlas brief can route to the correct steering venue.
 */
export const AI_USE_CASE_OWNER_SCOPES = [
  'business_function',
  'technology',
  'governance',
  'value_office',
] as const;

export type AiUseCaseOwnerScope =
  (typeof AI_USE_CASE_OWNER_SCOPES)[number];

/**
 * Owner of an AI use case. Names a role rather than a person to keep
 * the seed free of fabricated personal identifiers.
 */
export interface AiUseCaseOwner {
  /** Role string, e.g. "VP Engineering", "Chief Data Officer". */
  readonly role: string;
  /** Where the role sits in the operating model. */
  readonly responsibilityScope: AiUseCaseOwnerScope;
}

/**
 * Single canonical AI use case inventory record. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds.
 */
export interface AiUseCaseInventoryItem {
  /** Stable seed id of the form "ai-use-case-seed-{n}". */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;
  /** Business function the use case serves. */
  readonly businessFunction: string;
  /** Owner role + scope. */
  readonly owner: AiUseCaseOwner;
  /** Lifecycle stage. */
  readonly stage: AiUseCaseStage;
  /** Value readiness. */
  readonly valueReadiness: AiUseCaseValueReadiness;
  /** Risk level from the AI risk register. */
  readonly riskLevel: AiUseCaseRiskLevel;
  /** Adoption status. */
  readonly adoptionStatus: AiUseCaseAdoptionStatus;
  /** Underlying technology stack entries; ≥1 always. */
  readonly technologyStack: readonly string[];
  /** Data readiness. */
  readonly dataReadiness: AiUseCaseDataReadiness;
  /** Governance status. */
  readonly governanceStatus: AiUseCaseGovernanceStatus;
  /** Linked program seed slugs (may be empty). */
  readonly linkedPrograms: readonly string[];
  /** Linked Sentinel pattern keys (may be empty). */
  readonly linkedPatterns: readonly string[];
  /**
   * Required when `stage === 'blocked'`. Describes why the use case
   * has stalled. Empty string is not allowed when blocked.
   */
  readonly blockerReason?: string;
  /**
   * Next concrete action for this use case, framed as an imperative
   * sentence. Must be non-empty.
   */
  readonly nextAction: string;
  /** Provenance marker. Always 'deterministic_ai_portfolio_seed'. */
  readonly createdFrom: 'deterministic_ai_portfolio_seed';
}

/**
 * Aggregated portfolio summary. All counts reconcile to
 * `totalUseCases`.
 */
export interface AiPortfolioInventorySummary {
  readonly totalUseCases: number;
  readonly byStage: Readonly<Record<AiUseCaseStage, number>>;
  readonly byRiskLevel: Readonly<Record<AiUseCaseRiskLevel, number>>;
  readonly blockedCount: number;
  readonly measuredInProductionCount: number;
  readonly ungovernedCount: number;
  readonly uniqueBusinessFunctions: readonly string[];
  readonly uniqueTechnologyStacks: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function seedId(n: number): string {
  return `ai-use-case-seed-${n}`;
}

/**
 * The canonical inventory seed. Eighteen+ records spread across all
 * seven stages with the distribution constraints enumerated in the
 * ACT2 slice doc and asserted by the test suite.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 *
 * Distribution (test-enforced):
 *
 * - ≥ 2 idea, ≥ 2 discovery, ≥ 2 pilot, ≥ 2 production, ≥ 2 scaled,
 *   ≥ 2 retired, ≥ 2 blocked.
 * - ≥ 2 production records carry `valueReadiness:
 *   'measured_in_production'`.
 * - ≥ 2 records carry `governanceStatus: 'flagged'`.
 * - Every blocked record carries a non-empty `blockerReason`.
 * - Every record carries ≥ 1 technology stack entry.
 * - ≥ 6 unique business functions.
 * - No string field invents a dollar amount.
 * - No string field carries a branded vendor endorsement.
 */
const AI_PORTFOLIO_INVENTORY_SEED: readonly AiUseCaseInventoryItem[] = [
  // -----------------------------------------------------------------
  // Stage: idea
  // -----------------------------------------------------------------
  {
    id: seedId(1),
    name: 'Procurement contract clause summarizer',
    businessFunction: 'Procurement',
    owner: {
      role: 'Chief Procurement Officer',
      responsibilityScope: 'business_function',
    },
    stage: 'idea',
    valueReadiness: 'unmeasured',
    riskLevel: 'medium',
    adoptionStatus: 'not_started',
    technologyStack: ['document understanding model (vendor not selected)'],
    dataReadiness: 'data_partial',
    governanceStatus: 'undefined',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Charter the use case with sponsor, baseline, and target before further investment.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(2),
    name: 'HR onboarding policy assistant',
    businessFunction: 'HR',
    owner: {
      role: 'VP People Operations',
      responsibilityScope: 'business_function',
    },
    stage: 'idea',
    valueReadiness: 'unmeasured',
    riskLevel: 'low',
    adoptionStatus: 'not_started',
    technologyStack: ['retrieval-augmented assistant pattern'],
    dataReadiness: 'data_partial',
    governanceStatus: 'in_review',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Confirm policy corpus completeness with HR before drafting the discovery brief.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(3),
    name: 'Finance close anomaly explanation drafts',
    businessFunction: 'Finance',
    owner: {
      role: 'Controller',
      responsibilityScope: 'business_function',
    },
    stage: 'idea',
    valueReadiness: 'projected',
    riskLevel: 'medium',
    adoptionStatus: 'not_started',
    technologyStack: ['analytics warehouse query layer (vendor not selected)'],
    dataReadiness: 'data_partial',
    governanceStatus: 'undefined',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Validate close-cycle baseline cycle time before scoping discovery.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: discovery
  // -----------------------------------------------------------------
  {
    id: seedId(4),
    name: 'Customer support ticket triage assistant',
    businessFunction: 'Customer Support',
    owner: {
      role: 'VP Customer Experience',
      responsibilityScope: 'business_function',
    },
    stage: 'discovery',
    valueReadiness: 'projected',
    riskLevel: 'medium',
    adoptionStatus: 'not_started',
    technologyStack: [
      'conversational understanding model (vendor not selected)',
      'ticketing platform connector',
    ],
    dataReadiness: 'data_partial',
    governanceStatus: 'in_review',
    linkedPrograms: ['contact-center-ai'],
    linkedPatterns: ['program_context_sparsity'],
    nextAction:
      'Run the discovery workshop and confirm baseline handle time before pilot scoping.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(5),
    name: 'Engineering pull-request review summarizer',
    businessFunction: 'Engineering',
    owner: {
      role: 'VP Engineering',
      responsibilityScope: 'technology',
    },
    stage: 'discovery',
    valueReadiness: 'projected',
    riskLevel: 'low',
    adoptionStatus: 'not_started',
    technologyStack: [
      'code review assistant pattern',
      'source control connector',
    ],
    dataReadiness: 'data_usable',
    governanceStatus: 'in_review',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Capture DORA baselines for change lead time and review cycle before pilot scoping.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(6),
    name: 'Operations field service knowledge assistant',
    businessFunction: 'Operations',
    owner: {
      role: 'VP Field Operations',
      responsibilityScope: 'business_function',
    },
    stage: 'discovery',
    valueReadiness: 'unmeasured',
    riskLevel: 'medium',
    adoptionStatus: 'not_started',
    technologyStack: [
      'knowledge retrieval pattern',
      'vector database (vendor not selected)',
    ],
    dataReadiness: 'data_missing',
    governanceStatus: 'undefined',
    linkedPrograms: [],
    linkedPatterns: ['program_context_sparsity'],
    nextAction:
      'Confirm knowledge corpus coverage and access controls before pilot scoping.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: pilot
  // -----------------------------------------------------------------
  {
    id: seedId(7),
    name: 'Risk control narrative drafting assistant',
    businessFunction: 'Risk',
    owner: {
      role: 'Chief Risk Officer',
      responsibilityScope: 'governance',
    },
    stage: 'pilot',
    valueReadiness: 'in_pilot_measurement',
    riskLevel: 'high',
    adoptionStatus: 'opt_in_only',
    technologyStack: [
      'document understanding model (vendor not selected)',
      'policy retrieval pattern',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'in_review',
    linkedPrograms: [],
    linkedPatterns: ['gate_governance_gap'],
    nextAction:
      'Complete responsible-AI review and capture pilot pass / fail rates before scaling.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(8),
    name: 'Procurement vendor risk briefing assistant',
    businessFunction: 'Procurement',
    owner: {
      role: 'Director of Vendor Risk',
      responsibilityScope: 'governance',
    },
    stage: 'pilot',
    valueReadiness: 'in_pilot_measurement',
    riskLevel: 'medium',
    adoptionStatus: 'opt_in_only',
    technologyStack: [
      'retrieval-augmented assistant pattern',
      'vendor data warehouse view',
    ],
    dataReadiness: 'data_usable',
    governanceStatus: 'in_review',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Review pilot adoption metrics with the Procurement Council before broad rollout.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(9),
    name: 'Customer support response suggestion pilot',
    businessFunction: 'Customer Support',
    owner: {
      role: 'Director of Support Operations',
      responsibilityScope: 'business_function',
    },
    stage: 'pilot',
    valueReadiness: 'in_pilot_measurement',
    riskLevel: 'medium',
    adoptionStatus: 'opt_in_only',
    technologyStack: [
      'conversational understanding model (vendor not selected)',
      'agent assist surface',
    ],
    dataReadiness: 'data_usable',
    governanceStatus: 'approved',
    linkedPrograms: ['contact-center-ai'],
    linkedPatterns: [],
    nextAction:
      'Compare pilot containment rate against baseline before recommending broader rollout.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: production
  // -----------------------------------------------------------------
  {
    id: seedId(10),
    name: 'Engineering code completion in production',
    businessFunction: 'Engineering',
    owner: {
      role: 'VP Engineering Productivity',
      responsibilityScope: 'technology',
    },
    stage: 'production',
    valueReadiness: 'measured_in_production',
    riskLevel: 'medium',
    adoptionStatus: 'broadly_adopted',
    technologyStack: [
      'code completion assistant pattern',
      'IDE integration layer',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Maintain quarterly DORA baseline review and audit attestation cadence.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(11),
    name: 'Customer support intent classification in production',
    businessFunction: 'Customer Support',
    owner: {
      role: 'Director of Support Engineering',
      responsibilityScope: 'technology',
    },
    stage: 'production',
    valueReadiness: 'measured_in_production',
    riskLevel: 'medium',
    adoptionStatus: 'mandated',
    technologyStack: [
      'intent classification model (vendor not selected)',
      'ticketing platform connector',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: ['contact-center-ai'],
    linkedPatterns: [],
    nextAction:
      'Schedule the next governance attestation and recalibrate to current ticket mix.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(12),
    name: 'Finance invoice extraction in production',
    businessFunction: 'Finance',
    owner: {
      role: 'VP Finance Operations',
      responsibilityScope: 'business_function',
    },
    stage: 'production',
    valueReadiness: 'in_pilot_measurement',
    riskLevel: 'medium',
    adoptionStatus: 'rolling_out',
    technologyStack: [
      'document extraction model (vendor not selected)',
      'enterprise resource planning connector',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'approved',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Promote pilot measurement to production measurement once a full quarter is captured.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: scaled
  // -----------------------------------------------------------------
  {
    id: seedId(13),
    name: 'Customer support self-service assistant scaled to all regions',
    businessFunction: 'Customer Support',
    owner: {
      role: 'SVP Customer Experience',
      responsibilityScope: 'business_function',
    },
    stage: 'scaled',
    valueReadiness: 'measured_in_production',
    riskLevel: 'medium',
    adoptionStatus: 'mandated',
    technologyStack: [
      'retrieval-augmented assistant pattern',
      'conversational understanding model (vendor not selected)',
      'web channel integration',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: ['contact-center-ai'],
    linkedPatterns: [],
    nextAction:
      'Continue quarterly responsible-AI re-attestation and adoption-rate review.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(14),
    name: 'Operations demand forecast scaled across stores',
    businessFunction: 'Operations',
    owner: {
      role: 'VP Supply Chain',
      responsibilityScope: 'business_function',
    },
    stage: 'scaled',
    valueReadiness: 'measured_in_production',
    riskLevel: 'medium',
    adoptionStatus: 'mandated',
    technologyStack: [
      'time-series forecasting model (vendor not selected)',
      'analytics warehouse query layer (vendor not selected)',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: ['demand-forecasting'],
    linkedPatterns: [],
    nextAction:
      'Maintain forecast drift monitoring and quarterly governance attestation.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: retired
  // -----------------------------------------------------------------
  {
    id: seedId(15),
    name: 'Marketing campaign sentiment monitor (retired)',
    businessFunction: 'Marketing',
    owner: {
      role: 'VP Marketing Analytics',
      responsibilityScope: 'business_function',
    },
    stage: 'retired',
    valueReadiness: 'declined',
    riskLevel: 'low',
    adoptionStatus: 'not_started',
    technologyStack: ['sentiment classification model (vendor not selected)'],
    dataReadiness: 'data_partial',
    governanceStatus: 'approved',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Archive the use case record and capture the retirement rationale in the value ledger.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(16),
    name: 'Risk legacy fraud rule co-pilot (retired)',
    businessFunction: 'Risk',
    owner: {
      role: 'Director of Fraud Strategy',
      responsibilityScope: 'governance',
    },
    stage: 'retired',
    valueReadiness: 'declined',
    riskLevel: 'medium',
    adoptionStatus: 'not_started',
    technologyStack: ['rules engine integration', 'feature store connector'],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Archive the use case record and reference the replacement initiative in the audit trail.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Stage: blocked
  // -----------------------------------------------------------------
  {
    id: seedId(17),
    name: 'HR resume screening assistant (blocked)',
    businessFunction: 'HR',
    owner: {
      role: 'Chief Human Resources Officer',
      responsibilityScope: 'governance',
    },
    stage: 'blocked',
    valueReadiness: 'unmeasured',
    riskLevel: 'critical',
    adoptionStatus: 'not_started',
    technologyStack: [
      'resume screening assistant pattern',
      'applicant tracking system connector',
    ],
    dataReadiness: 'data_partial',
    governanceStatus: 'flagged',
    linkedPrograms: [],
    linkedPatterns: ['gate_governance_gap'],
    blockerReason:
      'Responsible-AI review identified bias risk that has not been remediated; gate G2 cannot pass until fairness testing is captured.',
    nextAction:
      'Hold the use case at the responsible-AI gate until fairness evidence is captured and reviewed.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(18),
    name: 'Finance forecast assistant (blocked)',
    businessFunction: 'Finance',
    owner: {
      role: 'Chief Financial Officer',
      responsibilityScope: 'value_office',
    },
    stage: 'blocked',
    valueReadiness: 'unmeasured',
    riskLevel: 'high',
    adoptionStatus: 'not_started',
    technologyStack: [
      'time-series forecasting model (vendor not selected)',
      'analytics warehouse query layer (vendor not selected)',
    ],
    dataReadiness: 'data_missing',
    governanceStatus: 'flagged',
    linkedPrograms: [],
    linkedPatterns: ['program_context_sparsity'],
    blockerReason:
      'Source data access has not been granted by Finance Operations; pilot cannot start until data scope is approved.',
    nextAction:
      'Escalate the data access request to the Finance Steering Committee before further design work.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },

  // -----------------------------------------------------------------
  // Surplus rows (≥ 4 beyond the 14-minimum) to give the summary
  // realistic shape and ensure stage diversity.
  // -----------------------------------------------------------------
  {
    id: seedId(19),
    name: 'Operations safety incident summary assistant',
    businessFunction: 'Operations',
    owner: {
      role: 'VP Operations Safety',
      responsibilityScope: 'business_function',
    },
    stage: 'pilot',
    valueReadiness: 'in_pilot_measurement',
    riskLevel: 'high',
    adoptionStatus: 'opt_in_only',
    technologyStack: [
      'document understanding model (vendor not selected)',
      'incident management system connector',
    ],
    dataReadiness: 'data_usable',
    governanceStatus: 'in_review',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Confirm responsible-AI review outcomes before promoting beyond the pilot cohort.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(20),
    name: 'Engineering test failure clustering assistant',
    businessFunction: 'Engineering',
    owner: {
      role: 'Director of Quality Engineering',
      responsibilityScope: 'technology',
    },
    stage: 'production',
    valueReadiness: 'measured_in_production',
    riskLevel: 'low',
    adoptionStatus: 'broadly_adopted',
    technologyStack: [
      'embedding clustering pattern',
      'continuous integration platform connector',
    ],
    dataReadiness: 'data_governed',
    governanceStatus: 'auditable',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Maintain monthly quality engineering review of clustering precision.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(21),
    name: 'Customer support voice transcript quality scorer',
    businessFunction: 'Customer Support',
    owner: {
      role: 'Director of Quality Assurance',
      responsibilityScope: 'business_function',
    },
    stage: 'discovery',
    valueReadiness: 'projected',
    riskLevel: 'high',
    adoptionStatus: 'not_started',
    technologyStack: [
      'speech recognition model (vendor not selected)',
      'conversational understanding model (vendor not selected)',
    ],
    dataReadiness: 'data_partial',
    governanceStatus: 'in_review',
    linkedPrograms: ['contact-center-ai'],
    linkedPatterns: ['gate_governance_gap'],
    nextAction:
      'Confirm consent posture and recording governance before scoping a pilot.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
  {
    id: seedId(22),
    name: 'Legal contract review assistant (idea)',
    businessFunction: 'Legal',
    owner: {
      role: 'General Counsel',
      responsibilityScope: 'governance',
    },
    stage: 'idea',
    valueReadiness: 'unmeasured',
    riskLevel: 'high',
    adoptionStatus: 'not_started',
    technologyStack: [
      'document understanding model (vendor not selected)',
      'contract repository connector',
    ],
    dataReadiness: 'data_partial',
    governanceStatus: 'undefined',
    linkedPrograms: [],
    linkedPatterns: [],
    nextAction:
      'Engage Legal and Privacy to confirm corpus eligibility before drafting a discovery brief.',
    createdFrom: 'deterministic_ai_portfolio_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI portfolio inventory. Result is a frozen,
 * deterministic list — repeated calls return byte-equal data.
 */
export function buildAiPortfolioInventory(): readonly AiUseCaseInventoryItem[] {
  return AI_PORTFOLIO_INVENTORY_SEED;
}

/**
 * Initialize a per-stage record where every canonical stage is present
 * with count 0. Used as the starting point for `byStage` aggregation
 * so callers can rely on every stage key existing even when count is
 * zero.
 */
function emptyStageCounts(): Record<AiUseCaseStage, number> {
  const out: Record<AiUseCaseStage, number> = {
    idea: 0,
    discovery: 0,
    pilot: 0,
    production: 0,
    scaled: 0,
    retired: 0,
    blocked: 0,
  };
  return out;
}

/**
 * Initialize a per-risk-level record where every canonical level is
 * present with count 0.
 */
function emptyRiskCounts(): Record<AiUseCaseRiskLevel, number> {
  const out: Record<AiUseCaseRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  return out;
}

/**
 * Sort a list of strings ascending without mutating the input.
 */
function sortedAscending(values: readonly string[]): readonly string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

/**
 * Build the deterministic summary for a portfolio. When no items list
 * is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byStage).reduce(...)` equals `totalUseCases`.
 * - `Object.values(byRiskLevel).reduce(...)` equals `totalUseCases`.
 * - `blockedCount` equals `byStage.blocked`.
 * - `measuredInProductionCount` counts items whose
 *   `valueReadiness === 'measured_in_production'`.
 * - `ungovernedCount` counts items whose `governanceStatus` is
 *   `'undefined'` or `'flagged'`.
 * - `uniqueBusinessFunctions` and `uniqueTechnologyStacks` are sorted
 *   ascending and contain no duplicates.
 */
export function summarizeAiPortfolioInventory(
  items: readonly AiUseCaseInventoryItem[] = AI_PORTFOLIO_INVENTORY_SEED,
): AiPortfolioInventorySummary {
  const byStage = emptyStageCounts();
  const byRiskLevel = emptyRiskCounts();
  const businessFunctions = new Set<string>();
  const technologyStacks = new Set<string>();
  let blockedCount = 0;
  let measuredInProductionCount = 0;
  let ungovernedCount = 0;

  for (const item of items) {
    byStage[item.stage] += 1;
    byRiskLevel[item.riskLevel] += 1;
    businessFunctions.add(item.businessFunction);
    for (const tech of item.technologyStack) {
      technologyStacks.add(tech);
    }
    if (item.stage === 'blocked') {
      blockedCount += 1;
    }
    if (item.valueReadiness === 'measured_in_production') {
      measuredInProductionCount += 1;
    }
    if (
      item.governanceStatus === 'undefined' ||
      item.governanceStatus === 'flagged'
    ) {
      ungovernedCount += 1;
    }
  }

  return {
    totalUseCases: items.length,
    byStage,
    byRiskLevel,
    blockedCount,
    measuredInProductionCount,
    ungovernedCount,
    uniqueBusinessFunctions: sortedAscending([...businessFunctions]),
    uniqueTechnologyStacks: sortedAscending([...technologyStacks]),
  };
}

/**
 * Filter inventory items by stage. Returns the items in the same order
 * they appear in the input list.
 */
export function getAiUseCasesByStage(
  items: readonly AiUseCaseInventoryItem[],
  stage: AiUseCaseStage,
): readonly AiUseCaseInventoryItem[] {
  return items.filter((item) => item.stage === stage);
}

/**
 * Convenience wrapper for `getAiUseCasesByStage(items, 'blocked')`.
 */
export function getBlockedAiUseCases(
  items: readonly AiUseCaseInventoryItem[],
): readonly AiUseCaseInventoryItem[] {
  return getAiUseCasesByStage(items, 'blocked');
}

/**
 * Return items whose `valueReadiness` is `'unmeasured'` or
 * `'declined'`. These are the cases where Atlas cannot defend a
 * value claim and the Tower must surface a "value gap" instead of a
 * dollar number.
 */
export function getValueReadinessGaps(
  items: readonly AiUseCaseInventoryItem[],
): readonly AiUseCaseInventoryItem[] {
  return items.filter(
    (item) =>
      item.valueReadiness === 'unmeasured' ||
      item.valueReadiness === 'declined',
  );
}
