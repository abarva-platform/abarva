// ACT5 · AI Risk & Governance Read Model
//
// Operationalizes the AI Risk & Governance dimension of the AI Control
// Tower contract (ACT1). Projects a deterministic, cross-tenant
// inventory of AI risk findings the Tower can compose into Atlas brief
// content, Sentinel pattern surfaces, Steward governance gates, and
// audit attestations.
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
// Future ACT5.x slices will:
//
// - bind these findings to per-tenant captured risk registers,
// - replace the seed with a connector-backed projection,
// - persist mitigations and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for AI risk
// governance shape across the Tower surface.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical AI risk governance dimensions.
 *
 * Mirrors the ten governance review surfaces enumerated in the AI
 * Control Tower contract. Each finding belongs to exactly one
 * dimension; cross-cutting findings are recorded once per dimension
 * they apply to so per-dimension counts reconcile cleanly.
 */
export const AI_RISK_GOVERNANCE_DIMENSIONS = [
  'responsible_ai_review',
  'privacy_data_protection',
  'security_red_team',
  'legal_contractual',
  'model_risk_management',
  'human_in_the_loop',
  'auditability_and_traceability',
  'regulatory_compliance',
  'third_party_vendor_risk',
  'change_management_risk',
] as const;

export type AiRiskGovernanceDimension =
  (typeof AI_RISK_GOVERNANCE_DIMENSIONS)[number];

/**
 * Canonical severity levels. Mirrors the AI risk register taxonomy
 * used in ACT2.
 */
export const AI_RISK_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type AiRiskSeverity = (typeof AI_RISK_SEVERITIES)[number];

/**
 * Canonical finding lifecycle statuses.
 *
 * Ordered: unaddressed → in_review → mitigated → accepted, with
 * `escalated` as the parallel branch for findings that exceeded the
 * dimension owner's authority and need executive review.
 */
export const AI_RISK_STATUSES = [
  'unaddressed',
  'in_review',
  'mitigated',
  'accepted',
  'escalated',
] as const;

export type AiRiskStatus = (typeof AI_RISK_STATUSES)[number];

/**
 * Outcome of the governance gate evaluation that should attest to a
 * finding before its associated AI use case advances.
 *
 * Ordered: not_run → fail → partial → pass.
 */
export const GOVERNANCE_GATE_OUTCOMES = [
  'pass',
  'partial',
  'fail',
  'not_run',
] as const;

export type GovernanceGateOutcome = (typeof GOVERNANCE_GATE_OUTCOMES)[number];

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/**
 * Single canonical AI risk governance finding. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds (programs from ACT2-adjacent program
 * canon, AI use cases from ACT2, evidence ledger entries from EVID2).
 */
export interface AiRiskGovernanceFinding {
  /** Stable seed id of the form "risk-seed-{n}". */
  readonly id: string;
  /** Governance dimension this finding belongs to. */
  readonly dimension: AiRiskGovernanceDimension;
  /** Imperative description of the risk. Non-empty. */
  readonly description: string;
  /** Severity per the canonical taxonomy. */
  readonly severity: AiRiskSeverity;
  /** Lifecycle status. */
  readonly status: AiRiskStatus;
  /** Role of the owner who must close the finding. Non-empty. */
  readonly ownerRole: string;
  /** Optional program slug the finding targets. */
  readonly programKey?: string;
  /** Optional AI use case seed id the finding targets. */
  readonly aiUseCaseKey?: string;
  /**
   * Whether human review is required before the AI use case can act
   * on the surface this finding governs.
   */
  readonly hitlRequired: boolean;
  /**
   * Evidence ledger seed ids that support the finding. Empty array
   * is allowed for findings that have not yet captured evidence.
   */
  readonly auditableEvidenceIds: readonly string[];
  /** Concrete mitigation actions taken or proposed. Always ≥ 1. */
  readonly mitigations: readonly string[];
  /**
   * Outcome of the governance gate evaluation associated with this
   * finding.
   */
  readonly governanceGate: GovernanceGateOutcome;
  /** Provenance marker. Always 'deterministic_ai_risk_governance_seed'. */
  readonly createdFrom: 'deterministic_ai_risk_governance_seed';
}

/**
 * Aggregated risk governance summary. All counts reconcile to
 * `totalFindings`.
 */
export interface AiRiskGovernanceSummary {
  readonly totalFindings: number;
  readonly byDimension: Readonly<Record<AiRiskGovernanceDimension, number>>;
  readonly bySeverity: Readonly<Record<AiRiskSeverity, number>>;
  readonly byStatus: Readonly<Record<AiRiskStatus, number>>;
  readonly hitlRequiredCount: number;
  readonly unaddressedCount: number;
  readonly criticalCount: number;
  /**
   * Fraction in `[0, 1]` equal to (count of findings with
   * `governanceGate === 'pass'`) / totalFindings. Returns `0` when
   * there are no findings to avoid division by zero.
   */
  readonly governanceGatePassRate: number;
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a numbered seed id. Single source of truth so callers cannot
 * accidentally diverge id formats.
 */
function seedId(n: number): string {
  return `risk-seed-${n}`;
}

/**
 * Build an evidence ledger seed id. Mirrors the EVID2 canonical
 * format (`evidence-seed-{n}`) without importing the EVID2 module —
 * the linkage is intentionally a string handshake so this module
 * remains free of cross-domain imports.
 */
function evidenceSeedId(n: number): string {
  return `evidence-seed-${n}`;
}

/**
 * The canonical risk governance seed. Twenty-two records spanning all
 * ten dimensions, all five statuses, all four severities, and all
 * four governance gate outcomes.
 *
 * Distribution (test-enforced):
 *
 * - ≥ 1 finding for every canonical dimension.
 * - ≥ 1 finding for every canonical status.
 * - ≥ 1 finding for every canonical severity.
 * - ≥ 3 findings carry `severity: 'critical'`.
 * - ≥ 5 findings carry `hitlRequired: true`.
 * - ≥ 4 findings carry `governanceGate: 'fail'`.
 * - ≥ 2 findings carry a `programKey`.
 * - ≥ 2 findings carry an `aiUseCaseKey`.
 * - Every finding carries ≥ 1 mitigation entry.
 *
 * Field-by-field determinism: every value is a string literal or a
 * literal numeric / boolean. There is no reliance on the host
 * environment's clock, randomness, or environment variables.
 */
const AI_RISK_GOVERNANCE_SEED: readonly AiRiskGovernanceFinding[] = [
  // -----------------------------------------------------------------
  // Dimension: responsible_ai_review
  // -----------------------------------------------------------------
  {
    id: seedId(1),
    dimension: 'responsible_ai_review',
    description:
      'Resume screening assistant has not completed responsible-AI fairness review; bias risk across protected classes is unconfirmed.',
    severity: 'critical',
    status: 'escalated',
    ownerRole: 'Chief Human Resources Officer',
    aiUseCaseKey: 'ai-use-case-seed-17',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(1), evidenceSeedId(2)],
    mitigations: [
      'Hold the use case at gate G2 until fairness testing evidence is captured.',
      'Schedule responsible-AI review with cross-functional panel.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(2),
    dimension: 'responsible_ai_review',
    description:
      'Customer support response suggestion pilot lacks documented responsible-AI review for tone and refusal handling.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'Director of Support Operations',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-9',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(3)],
    mitigations: [
      'Capture refusal taxonomy and tone guardrails in the responsible-AI review packet.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: privacy_data_protection
  // -----------------------------------------------------------------
  {
    id: seedId(3),
    dimension: 'privacy_data_protection',
    description:
      'Voice transcript quality scorer captures speaker audio without recorded consent posture for all jurisdictions.',
    severity: 'high',
    status: 'unaddressed',
    ownerRole: 'Chief Privacy Officer',
    programKey: 'contact-center-ai',
    hitlRequired: true,
    auditableEvidenceIds: [],
    mitigations: [
      'Map jurisdictional consent requirements before pilot start.',
      'Disable voice scoring in jurisdictions where consent posture is unconfirmed.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(4),
    dimension: 'privacy_data_protection',
    description:
      'Customer support assistant retrieval index does not honor data minimization for ticket attachments.',
    severity: 'medium',
    status: 'mitigated',
    ownerRole: 'Director of Data Protection',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(4)],
    mitigations: [
      'Apply attachment redaction policy at ingest before index build.',
      'Add quarterly attachment retention review to the data protection runbook.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: security_red_team
  // -----------------------------------------------------------------
  {
    id: seedId(5),
    dimension: 'security_red_team',
    description:
      'Retrieval-augmented assistants have no captured prompt-injection red-team coverage for the policy corpus surface.',
    severity: 'critical',
    status: 'in_review',
    ownerRole: 'Chief Information Security Officer',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(5)],
    mitigations: [
      'Schedule red-team exercise covering prompt-injection, jailbreak, and exfiltration paths.',
      'Capture red-team report in the audit ledger before scaling.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(6),
    dimension: 'security_red_team',
    description:
      'Engineering code completion assistant lacks captured secrets-leak red-team exercise for repository scope.',
    severity: 'medium',
    status: 'mitigated',
    ownerRole: 'VP Engineering Productivity',
    aiUseCaseKey: 'ai-use-case-seed-10',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(6)],
    mitigations: [
      'Run secrets-leak red-team scenario with sample repositories.',
      'Capture results and remediation plan in the security review ledger.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: legal_contractual
  // -----------------------------------------------------------------
  {
    id: seedId(7),
    dimension: 'legal_contractual',
    description:
      'Contract review assistant has no Legal-and-Privacy sign-off on corpus eligibility for confidential agreements.',
    severity: 'high',
    status: 'unaddressed',
    ownerRole: 'General Counsel',
    hitlRequired: true,
    auditableEvidenceIds: [],
    mitigations: [
      'Engage Legal and Privacy to confirm corpus eligibility before discovery.',
      'Capture eligibility ruling in the audit ledger.',
    ],
    governanceGate: 'not_run',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(8),
    dimension: 'legal_contractual',
    description:
      'Vendor model service agreement does not document indemnity for downstream model outputs that surface inside Tower briefs.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'Director of Vendor Risk',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(7)],
    mitigations: [
      'Negotiate indemnity addendum with vendor counsel.',
      'Capture revised agreement in the contractual ledger.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: model_risk_management
  // -----------------------------------------------------------------
  {
    id: seedId(9),
    dimension: 'model_risk_management',
    description:
      'Demand forecasting model lacks documented drift monitoring threshold and escalation runbook.',
    severity: 'high',
    status: 'in_review',
    ownerRole: 'Chief Model Risk Officer',
    programKey: 'demand-forecasting',
    aiUseCaseKey: 'ai-use-case-seed-14',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(8)],
    mitigations: [
      'Define drift thresholds and link to alerting runbook.',
      'Capture monthly drift attestation in the audit ledger.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(10),
    dimension: 'model_risk_management',
    description:
      'Finance forecast assistant has no model risk validation captured before pilot scoping.',
    severity: 'critical',
    status: 'escalated',
    ownerRole: 'Chief Financial Officer',
    aiUseCaseKey: 'ai-use-case-seed-18',
    hitlRequired: true,
    auditableEvidenceIds: [],
    mitigations: [
      'Escalate model risk validation to the Finance Steering Committee.',
      'Hold the use case at gate G1 until validation evidence is captured.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: human_in_the_loop
  // -----------------------------------------------------------------
  {
    id: seedId(11),
    dimension: 'human_in_the_loop',
    description:
      'Risk control narrative drafting assistant publishes drafts without documented reviewer attestation step.',
    severity: 'high',
    status: 'mitigated',
    ownerRole: 'Chief Risk Officer',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(9)],
    mitigations: [
      'Insert reviewer attestation gate before draft publication.',
      'Capture reviewer sign-off in the control narrative ledger.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(12),
    dimension: 'human_in_the_loop',
    description:
      'Operations safety incident summary assistant does not require reviewer sign-off before incident-record update.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'VP Operations Safety',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(10)],
    mitigations: [
      'Add reviewer sign-off requirement before incident-record write.',
      'Capture reviewer log in the operations audit ledger.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: auditability_and_traceability
  // -----------------------------------------------------------------
  {
    id: seedId(13),
    dimension: 'auditability_and_traceability',
    description:
      'Customer support intent classifier lacks per-request prompt and citation capture in the audit ledger.',
    severity: 'medium',
    status: 'mitigated',
    ownerRole: 'Director of Support Engineering',
    aiUseCaseKey: 'ai-use-case-seed-11',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(11)],
    mitigations: [
      'Persist prompt, retrieved sources, and classification result per request.',
      'Add weekly audit ledger replay to the support engineering runbook.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(14),
    dimension: 'auditability_and_traceability',
    description:
      'Engineering pull-request review summarizer does not link generated summaries back to source diffs in the audit ledger.',
    severity: 'low',
    status: 'unaddressed',
    ownerRole: 'VP Engineering',
    hitlRequired: false,
    auditableEvidenceIds: [],
    mitigations: [
      'Persist diff hash and summary together in the audit ledger.',
    ],
    governanceGate: 'not_run',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: regulatory_compliance
  // -----------------------------------------------------------------
  {
    id: seedId(15),
    dimension: 'regulatory_compliance',
    description:
      'HR resume screening assistant operates in jurisdictions with employment-decision audit obligations that have not been documented.',
    severity: 'critical',
    status: 'escalated',
    ownerRole: 'Chief Compliance Officer',
    aiUseCaseKey: 'ai-use-case-seed-17',
    hitlRequired: true,
    auditableEvidenceIds: [evidenceSeedId(12)],
    mitigations: [
      'Map per-jurisdiction obligations to the use-case operating envelope.',
      'Hold deployment in jurisdictions where audit obligations are unmet.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(16),
    dimension: 'regulatory_compliance',
    description:
      'Demand forecast assistant has not captured statistical-bias review mandated by sector regulator guidance.',
    severity: 'medium',
    status: 'in_review',
    ownerRole: 'VP Compliance',
    programKey: 'demand-forecasting',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(13)],
    mitigations: [
      'Schedule statistical-bias review under the regulator-aligned protocol.',
      'Capture findings in the compliance ledger before scaling.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: third_party_vendor_risk
  // -----------------------------------------------------------------
  {
    id: seedId(17),
    dimension: 'third_party_vendor_risk',
    description:
      'Vendor risk briefing assistant relies on a vendor-managed retrieval layer without captured SOC 2 review.',
    severity: 'high',
    status: 'in_review',
    ownerRole: 'Director of Vendor Risk',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(14)],
    mitigations: [
      'Request current SOC 2 report from the vendor and review with security.',
      'Capture review outcome in the vendor risk ledger.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(18),
    dimension: 'third_party_vendor_risk',
    description:
      'Document understanding service is reachable from the production network without captured exit and replacement plan.',
    severity: 'medium',
    status: 'accepted',
    ownerRole: 'Chief Information Security Officer',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(15)],
    mitigations: [
      'Capture vendor exit plan and replacement candidate review in the vendor ledger.',
      'Schedule annual exit-plan refresh on the vendor risk calendar.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Dimension: change_management_risk
  // -----------------------------------------------------------------
  {
    id: seedId(19),
    dimension: 'change_management_risk',
    description:
      'Customer support self-service assistant promotes prompt updates to production without captured change-advisory review.',
    severity: 'medium',
    status: 'mitigated',
    ownerRole: 'SVP Customer Experience',
    aiUseCaseKey: 'ai-use-case-seed-13',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(16)],
    mitigations: [
      'Require change-advisory review for prompt updates before production deploy.',
      'Capture advisory decision in the change ledger.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(20),
    dimension: 'change_management_risk',
    description:
      'Engineering test failure clustering assistant has no documented rollback procedure for clustering model changes.',
    severity: 'low',
    status: 'accepted',
    ownerRole: 'Director of Quality Engineering',
    hitlRequired: false,
    auditableEvidenceIds: [],
    mitigations: [
      'Document rollback procedure for clustering model upgrades in the engineering runbook.',
    ],
    governanceGate: 'partial',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },

  // -----------------------------------------------------------------
  // Surplus rows to ensure ≥ 5 HITL-required and ≥ 4 governance-gate
  // failures while keeping severity and status distributions balanced.
  // -----------------------------------------------------------------
  {
    id: seedId(21),
    dimension: 'human_in_the_loop',
    description:
      'Procurement contract clause summarizer drafts negotiation guidance without reviewer attestation before counsel hand-off.',
    severity: 'high',
    status: 'unaddressed',
    ownerRole: 'Chief Procurement Officer',
    hitlRequired: true,
    auditableEvidenceIds: [],
    mitigations: [
      'Require reviewer attestation before counsel hand-off.',
      'Capture reviewer log in the procurement audit ledger.',
    ],
    governanceGate: 'fail',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
  {
    id: seedId(22),
    dimension: 'auditability_and_traceability',
    description:
      'Operations field service knowledge assistant does not persist retrieval citations alongside surfaced answers.',
    severity: 'low',
    status: 'mitigated',
    ownerRole: 'VP Field Operations',
    hitlRequired: false,
    auditableEvidenceIds: [evidenceSeedId(17)],
    mitigations: [
      'Persist citations alongside surfaced answers in the operations audit ledger.',
    ],
    governanceGate: 'pass',
    createdFrom: 'deterministic_ai_risk_governance_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical AI risk governance findings list. Result is a
 * frozen, deterministic list — repeated calls return byte-equal data.
 */
export function buildAiRiskGovernanceFindings(): readonly AiRiskGovernanceFinding[] {
  return AI_RISK_GOVERNANCE_SEED;
}

/**
 * Initialize a per-dimension record where every canonical dimension
 * is present with count 0. Used as the starting point for
 * `byDimension` aggregation so callers can rely on every dimension
 * key existing even when count is zero.
 */
function emptyDimensionCounts(): Record<AiRiskGovernanceDimension, number> {
  const out: Record<AiRiskGovernanceDimension, number> = {
    responsible_ai_review: 0,
    privacy_data_protection: 0,
    security_red_team: 0,
    legal_contractual: 0,
    model_risk_management: 0,
    human_in_the_loop: 0,
    auditability_and_traceability: 0,
    regulatory_compliance: 0,
    third_party_vendor_risk: 0,
    change_management_risk: 0,
  };
  return out;
}

/**
 * Initialize a per-severity record where every canonical severity is
 * present with count 0.
 */
function emptySeverityCounts(): Record<AiRiskSeverity, number> {
  const out: Record<AiRiskSeverity, number> = {
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
function emptyStatusCounts(): Record<AiRiskStatus, number> {
  const out: Record<AiRiskStatus, number> = {
    unaddressed: 0,
    in_review: 0,
    mitigated: 0,
    accepted: 0,
    escalated: 0,
  };
  return out;
}

/**
 * Build the deterministic summary for a list of findings. When no
 * findings list is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byDimension).reduce(...)` equals `totalFindings`.
 * - `Object.values(bySeverity).reduce(...)` equals `totalFindings`.
 * - `Object.values(byStatus).reduce(...)` equals `totalFindings`.
 * - `hitlRequiredCount` counts findings with `hitlRequired === true`.
 * - `unaddressedCount` equals `byStatus.unaddressed`.
 * - `criticalCount` equals `bySeverity.critical`.
 * - `governanceGatePassRate` is the fraction of findings whose
 *   `governanceGate === 'pass'`. Returns `0` for an empty input.
 */
export function summarizeAiRiskGovernance(
  findings: readonly AiRiskGovernanceFinding[] = AI_RISK_GOVERNANCE_SEED,
): AiRiskGovernanceSummary {
  const byDimension = emptyDimensionCounts();
  const bySeverity = emptySeverityCounts();
  const byStatus = emptyStatusCounts();
  let hitlRequiredCount = 0;
  let governanceGatePassCount = 0;

  for (const finding of findings) {
    byDimension[finding.dimension] += 1;
    bySeverity[finding.severity] += 1;
    byStatus[finding.status] += 1;
    if (finding.hitlRequired) {
      hitlRequiredCount += 1;
    }
    if (finding.governanceGate === 'pass') {
      governanceGatePassCount += 1;
    }
  }

  const totalFindings = findings.length;
  const governanceGatePassRate =
    totalFindings === 0 ? 0 : governanceGatePassCount / totalFindings;

  return {
    totalFindings,
    byDimension,
    bySeverity,
    byStatus,
    hitlRequiredCount,
    unaddressedCount: byStatus.unaddressed,
    criticalCount: bySeverity.critical,
    governanceGatePassRate,
  };
}

/**
 * Filter findings by `severity === 'critical'`. Returns findings in
 * the same order they appear in the input list.
 */
export function getCriticalRiskFindings(
  findings: readonly AiRiskGovernanceFinding[] = AI_RISK_GOVERNANCE_SEED,
): readonly AiRiskGovernanceFinding[] {
  return findings.filter((finding) => finding.severity === 'critical');
}

/**
 * Filter findings by `status === 'unaddressed'`. Returns findings in
 * the same order they appear in the input list.
 */
export function getUnaddressedFindings(
  findings: readonly AiRiskGovernanceFinding[] = AI_RISK_GOVERNANCE_SEED,
): readonly AiRiskGovernanceFinding[] {
  return findings.filter((finding) => finding.status === 'unaddressed');
}

/**
 * Filter findings by `hitlRequired === true`. Returns findings in
 * the same order they appear in the input list.
 */
export function getHitlRequiredFindings(
  findings: readonly AiRiskGovernanceFinding[] = AI_RISK_GOVERNANCE_SEED,
): readonly AiRiskGovernanceFinding[] {
  return findings.filter((finding) => finding.hitlRequired);
}
