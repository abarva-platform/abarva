// ACT8 · Tech & Data Readiness Read Model
//
// Operationalizes the Tech & Data Readiness dimension of the AI
// Control Tower contract (ACT1). Projects a deterministic, cross-
// tenant set of readiness signals that the Tower can compose into the
// executive Atlas brief, scorecards, and pressure cards.
//
// The dimension answers a question Atlas otherwise cannot defend:
// *"Is the underlying technical and data foundation ready to support
// the AI portfolio, or are gaps blocking adoption / value?"* Six
// canonical sub-dimensions are tracked:
//
// - data_quality (lineage, completeness, freshness, accuracy)
// - integration_apis (API maturity, contract testing, versioning)
// - cloud_readiness (landing zone, IaC, region coverage)
// - model_gateway_readiness (gateway, key vault, routing, cost
//   guardrails)
// - security_posture (identity, encryption, secrets, supply chain)
// - observability (logs, traces, metrics, SLOs)
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
// Every signal carries `liveTelemetry: false`. Every signal's
// `assessmentSource` is a seed-tagged source. No record claims that
// any data was captured from a live pipeline. Future ACT8.x slices
// will:
//
// - bind these records to per-tenant captured readiness assessments,
// - replace the seed with a connector-backed projection,
// - persist edits and audit trails through Steward,
// - feed the seed into Atlas brief composition (ACT9).
//
// Until then, this module is the only canonical source for Tech &
// Data Readiness shape across the Tower surface.

// ---------------------------------------------------------------------
// Canonical enums
// ---------------------------------------------------------------------

/**
 * Canonical Tech & Data readiness dimensions. Mirrors the readiness
 * sub-dimensions called out by the AI Control Tower contract for the
 * executive view.
 */
export const TECH_READINESS_DIMENSIONS = [
  'data_quality',
  'integration_apis',
  'cloud_readiness',
  'model_gateway_readiness',
  'security_posture',
  'observability',
] as const;

export type TechReadinessDimension =
  (typeof TECH_READINESS_DIMENSIONS)[number];

/**
 * Canonical readiness level. `unknown` represents a signal whose level
 * cannot be defended from the seed without inventing data.
 */
export const TECH_READINESS_LEVELS = [
  'low',
  'medium',
  'high',
  'unknown',
] as const;

export type TechReadinessLevel = (typeof TECH_READINESS_LEVELS)[number];

/**
 * Canonical readiness assessment source. Every value is a seed-tagged
 * source. The Tower refuses to claim that any of these came from a
 * live pipeline.
 */
export const TECH_READINESS_ASSESSMENT_SOURCES = [
  'seed_only',
  'manual_capture',
  'platform_review_seed',
  'security_review_seed',
  'data_council_seed',
] as const;

export type TechReadinessAssessmentSource =
  (typeof TECH_READINESS_ASSESSMENT_SOURCES)[number];

// ---------------------------------------------------------------------
// Public record shape
// ---------------------------------------------------------------------

/**
 * Single canonical Tech & Data readiness signal. Every field is
 * deterministic. All linked ids are seed ids that resolve only against
 * other deterministic seeds.
 *
 * `domainLabel` is a role-based label rather than a real domain name
 * so the seed cannot be mistaken for live tenant data.
 * `liveTelemetry` is always `false`.
 */
export interface TechReadinessSignal {
  /** Stable seed id of the form "tech-readiness-seed-{domain}-{dimension}". */
  readonly id: string;
  /** Role-based domain label. Never a real team / domain name. */
  readonly domainLabel: string;
  /** The readiness sub-dimension this signal addresses. */
  readonly dimension: TechReadinessDimension;
  /** Banded readiness level. */
  readonly level: TechReadinessLevel;
  /** Optional linked program seed slug. */
  readonly programKey?: string;
  /** Optional linked AI use case seed key. */
  readonly aiUseCaseKey?: string;
  /** Seed-tagged assessment source. */
  readonly assessmentSource: TechReadinessAssessmentSource;
  /** Short, human-readable headline summarizing the signal. */
  readonly headline: string;
  /** Free-form notes; ≥ 1 entry; never empty strings. */
  readonly notes: readonly string[];
  /** Optional ordered list of remediation actions. */
  readonly remediations: readonly string[];
  /** Always false. The Tower never claims live telemetry from this seed. */
  readonly liveTelemetry: false;
  /** Provenance marker. Always 'deterministic_tech_data_readiness_seed'. */
  readonly createdFrom: 'deterministic_tech_data_readiness_seed';
}

/**
 * Aggregated Tech & Data readiness summary. Counts reconcile to
 * `totalSignals` for the per-dimension and per-level breakdowns.
 */
export interface TechReadinessSummary {
  readonly totalSignals: number;
  readonly byDimension: Readonly<Record<TechReadinessDimension, number>>;
  readonly byLevel: Readonly<Record<TechReadinessLevel, number>>;
  readonly lowCount: number;
  readonly mediumCount: number;
  readonly highCount: number;
  readonly unknownCount: number;
  readonly uniqueDomains: readonly string[];
  readonly uniquePrograms: readonly string[];
}

/**
 * A single readiness gap. Returned by `getReadinessGaps` for entries
 * whose level is `low` or `unknown`. Atlas composes these into "where
 * is the foundation not ready" prose without inventing a number.
 */
export interface TechReadinessGap {
  readonly id: string;
  readonly domainLabel: string;
  readonly dimension: TechReadinessDimension;
  readonly level: TechReadinessLevel;
  readonly headline: string;
  readonly remediations: readonly string[];
}

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------

/**
 * Build a stable seed id from a domain slug and dimension key. Single
 * source of truth so callers cannot accidentally diverge id formats.
 */
function seedId(domainSlug: string, dimension: TechReadinessDimension): string {
  return `tech-readiness-seed-${domainSlug}-${dimension}`;
}

/**
 * The canonical Tech & Data readiness seed.
 *
 * Distribution constraints (test-enforced):
 *
 * - ≥ 20 signals.
 * - All 6 dimensions covered (≥ 1 each).
 * - All 4 levels represented (≥ 1 each).
 * - ≥ 3 low-level signals.
 * - ≥ 1 unknown-level signal.
 * - ≥ 5 unique domain labels.
 * - Every signal has `liveTelemetry: false`.
 * - Every signal has a seed-tagged `assessmentSource`.
 * - No string field claims live telemetry.
 */
const TECH_DATA_READINESS_SEED: readonly TechReadinessSignal[] = [
  // -----------------------------------------------------------------
  // Customer Data Domain
  // -----------------------------------------------------------------
  {
    id: seedId('customer-data', 'data_quality'),
    domainLabel: 'Customer Data Domain',
    dimension: 'data_quality',
    level: 'medium',
    programKey: 'cdp',
    aiUseCaseKey: 'ai-use-case-seed-21',
    assessmentSource: 'data_council_seed',
    headline: 'Lineage documented; freshness gaps on derived tables.',
    notes: [
      'Primary tables have lineage and ownership recorded.',
      'Derived marts run on a nightly cadence with no SLA on freshness.',
    ],
    remediations: [
      'Define freshness SLAs for the top five derived marts.',
      'Add automated freshness alerts wired to the data council channel.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('customer-data', 'integration_apis'),
    domainLabel: 'Customer Data Domain',
    dimension: 'integration_apis',
    level: 'low',
    programKey: 'cdp',
    assessmentSource: 'platform_review_seed',
    headline: 'Point-to-point ETL; no contract tests on producer feeds.',
    notes: [
      'Seven producer systems write directly into the warehouse with no schema contract.',
      'Breaking changes have historically caused silent downstream failures.',
    ],
    remediations: [
      'Stand up producer-side contract tests for the top three feeds.',
      'Introduce a versioned event schema registry.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Contact Center Platform
  // -----------------------------------------------------------------
  {
    id: seedId('contact-center', 'integration_apis'),
    domainLabel: 'Contact Center Platform',
    dimension: 'integration_apis',
    level: 'medium',
    programKey: 'contact-center-ai',
    aiUseCaseKey: 'ai-use-case-seed-11',
    assessmentSource: 'platform_review_seed',
    headline: 'CCaaS APIs versioned; partner integrations partially documented.',
    notes: [
      'Inbound and outbound voice APIs are versioned and contract-tested.',
      'Two partner integrations rely on undocumented webhook payloads.',
    ],
    remediations: [
      'Document the two partner webhook payloads and add contract tests.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('contact-center', 'observability'),
    domainLabel: 'Contact Center Platform',
    dimension: 'observability',
    level: 'high',
    programKey: 'contact-center-ai',
    assessmentSource: 'platform_review_seed',
    headline: 'Logs, traces, and SLOs in place for the call path.',
    notes: [
      'Per-call traces are emitted end-to-end with structured logs at each hop.',
      'SLOs for answer time and abandon rate are defined and reviewed monthly.',
    ],
    remediations: [],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('contact-center', 'model_gateway_readiness'),
    domainLabel: 'Contact Center Platform',
    dimension: 'model_gateway_readiness',
    level: 'low',
    programKey: 'contact-center-ai',
    assessmentSource: 'platform_review_seed',
    headline: 'No central model gateway; cost guardrails ad hoc.',
    notes: [
      'Each surface holds its own provider keys with no central routing.',
      'Cost guardrails are tracked manually by the platform lead.',
    ],
    remediations: [
      'Stand up a central model gateway with per-surface routing.',
      'Move provider keys into a managed key vault behind the gateway.',
      'Add per-route token budget guardrails.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Store Operations Platform
  // -----------------------------------------------------------------
  {
    id: seedId('store-ops', 'cloud_readiness'),
    domainLabel: 'Store Operations Platform',
    dimension: 'cloud_readiness',
    level: 'medium',
    programKey: 'store-assoc-productivity',
    assessmentSource: 'platform_review_seed',
    headline: 'Landing zone in place; IaC coverage partial.',
    notes: [
      'A single landing zone is provisioned with network controls in place.',
      'Roughly half of the workloads are managed by IaC; the rest are click-ops.',
    ],
    remediations: [
      'Bring remaining click-ops workloads under IaC by domain owner.',
      'Add drift detection to the landing zone audit pipeline.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('store-ops', 'security_posture'),
    domainLabel: 'Store Operations Platform',
    dimension: 'security_posture',
    level: 'medium',
    programKey: 'store-assoc-productivity',
    assessmentSource: 'security_review_seed',
    headline: 'Identity centralised; supply chain scanning partial.',
    notes: [
      'Workforce identity is centralised behind the corporate IdP.',
      'Container images are scanned, but third-party dependencies are not yet SBOM-tracked.',
    ],
    remediations: [
      'Generate SBOMs for production container images.',
      'Wire SBOM ingestion into the security review queue.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Demand Forecasting Domain
  // -----------------------------------------------------------------
  {
    id: seedId('demand-forecasting', 'data_quality'),
    domainLabel: 'Demand Forecasting Domain',
    dimension: 'data_quality',
    level: 'high',
    programKey: 'demand-forecasting',
    aiUseCaseKey: 'ai-use-case-seed-31',
    assessmentSource: 'data_council_seed',
    headline: 'Lineage, completeness, and freshness measured weekly.',
    notes: [
      'Top-line forecasting inputs have measured lineage and weekly freshness reports.',
      'Completeness is reviewed by the data council each cycle.',
    ],
    remediations: [],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('demand-forecasting', 'observability'),
    domainLabel: 'Demand Forecasting Domain',
    dimension: 'observability',
    level: 'medium',
    programKey: 'demand-forecasting',
    assessmentSource: 'platform_review_seed',
    headline: 'Job-level metrics present; per-feature drift tracking missing.',
    notes: [
      'Pipeline health is tracked at the job level with run-time and failure metrics.',
      'Feature-level drift tracking has not been wired into the observability stack.',
    ],
    remediations: [
      'Add feature-level drift metrics for the top ten model inputs.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('demand-forecasting', 'model_gateway_readiness'),
    domainLabel: 'Demand Forecasting Domain',
    dimension: 'model_gateway_readiness',
    level: 'medium',
    programKey: 'demand-forecasting',
    assessmentSource: 'platform_review_seed',
    headline: 'Internal model registry exists; gateway routing limited.',
    notes: [
      'A model registry holds versioned forecasting models with reviewer signoff.',
      'Gateway routing covers only one model family today.',
    ],
    remediations: [
      'Extend gateway routing to cover all production-promoted model families.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Identity & Access Domain
  // -----------------------------------------------------------------
  {
    id: seedId('identity-access', 'security_posture'),
    domainLabel: 'Identity & Access Domain',
    dimension: 'security_posture',
    level: 'high',
    assessmentSource: 'security_review_seed',
    headline: 'Workforce SSO, MFA, and just-in-time access in place.',
    notes: [
      'All workforce access is gated through SSO with MFA enforced.',
      'Privileged access uses a just-in-time elevation flow with audit trails.',
    ],
    remediations: [],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('identity-access', 'integration_apis'),
    domainLabel: 'Identity & Access Domain',
    dimension: 'integration_apis',
    level: 'medium',
    assessmentSource: 'platform_review_seed',
    headline: 'IdP APIs documented; provisioning hooks partial.',
    notes: [
      'Identity provider APIs are documented and versioned.',
      'Downstream provisioning hooks vary by application owner.',
    ],
    remediations: [
      'Standardise SCIM provisioning across the top fifteen applications.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Platform Cloud Foundations
  // -----------------------------------------------------------------
  {
    id: seedId('platform-cloud', 'cloud_readiness'),
    domainLabel: 'Platform Cloud Foundations',
    dimension: 'cloud_readiness',
    level: 'high',
    assessmentSource: 'platform_review_seed',
    headline: 'Multi-region landing zones with full IaC coverage.',
    notes: [
      'Two regions are provisioned with full IaC coverage and drift detection.',
      'Disaster-recovery runbooks are exercised quarterly.',
    ],
    remediations: [],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('platform-cloud', 'observability'),
    domainLabel: 'Platform Cloud Foundations',
    dimension: 'observability',
    level: 'high',
    assessmentSource: 'platform_review_seed',
    headline: 'Central logs, traces, metrics, and SLO catalog.',
    notes: [
      'A central observability stack collects logs, traces, and metrics across the estate.',
      'A documented SLO catalog drives error budget reviews.',
    ],
    remediations: [],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('platform-cloud', 'model_gateway_readiness'),
    domainLabel: 'Platform Cloud Foundations',
    dimension: 'model_gateway_readiness',
    level: 'medium',
    assessmentSource: 'platform_review_seed',
    headline: 'Model gateway scaffolded; rollout to surfaces incomplete.',
    notes: [
      'A central model gateway is scaffolded with provider routing and per-tenant quotas.',
      'Surfaces are migrating onto the gateway in a staged rollout.',
    ],
    remediations: [
      'Complete the surface migration onto the central gateway.',
      'Publish per-route cost guardrails as part of the gateway contract.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Risk & Compliance Data Domain
  // -----------------------------------------------------------------
  {
    id: seedId('risk-compliance', 'data_quality'),
    domainLabel: 'Risk & Compliance Data Domain',
    dimension: 'data_quality',
    level: 'low',
    assessmentSource: 'data_council_seed',
    headline: 'Manual capture; lineage incomplete on regulated tables.',
    notes: [
      'Several regulated tables are populated through manual capture with no lineage record.',
      'Completeness is checked at quarter end rather than continuously.',
    ],
    remediations: [
      'Replace the top three manual-capture flows with system-of-record extracts.',
      'Add lineage entries for every regulated table.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('risk-compliance', 'security_posture'),
    domainLabel: 'Risk & Compliance Data Domain',
    dimension: 'security_posture',
    level: 'medium',
    assessmentSource: 'security_review_seed',
    headline: 'Encryption-at-rest in place; secret rotation partial.',
    notes: [
      'Regulated stores are encrypted at rest with platform-managed keys.',
      'Secret rotation is enforced for production but not for staging.',
    ],
    remediations: [
      'Extend secret rotation to staging environments.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Marketing Analytics Domain
  // -----------------------------------------------------------------
  {
    id: seedId('marketing-analytics', 'data_quality'),
    domainLabel: 'Marketing Analytics Domain',
    dimension: 'data_quality',
    level: 'unknown',
    assessmentSource: 'manual_capture',
    headline: 'Recently re-platformed; data quality not yet re-assessed.',
    notes: [
      'The marketing analytics stack was re-platformed last quarter.',
      'A current data-quality assessment has not yet been completed for the new pipelines.',
    ],
    remediations: [
      'Schedule a data council assessment of the re-platformed pipelines.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('marketing-analytics', 'cloud_readiness'),
    domainLabel: 'Marketing Analytics Domain',
    dimension: 'cloud_readiness',
    level: 'medium',
    assessmentSource: 'platform_review_seed',
    headline: 'Workloads on the new landing zone; FinOps not yet attached.',
    notes: [
      'Workloads run inside the standard landing zone with the platform network controls.',
      'FinOps tagging and chargeback have not yet been attached to the new environment.',
    ],
    remediations: [
      'Apply the standard FinOps tag set to the marketing analytics environment.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },

  // -----------------------------------------------------------------
  // Edge / Mobile Surfaces (extra coverage)
  // -----------------------------------------------------------------
  {
    id: seedId('edge-mobile', 'observability'),
    domainLabel: 'Edge & Mobile Surfaces',
    dimension: 'observability',
    level: 'low',
    assessmentSource: 'platform_review_seed',
    headline: 'Edge surfaces emit limited structured telemetry.',
    notes: [
      'Edge and mobile surfaces emit crash reports but not structured traces.',
      'No SLOs exist for the edge experience today.',
    ],
    remediations: [
      'Adopt the standard structured-trace SDK on edge and mobile surfaces.',
      'Define SLOs for cold-start and first-interaction on the mobile surface.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
  {
    id: seedId('edge-mobile', 'integration_apis'),
    domainLabel: 'Edge & Mobile Surfaces',
    dimension: 'integration_apis',
    level: 'medium',
    assessmentSource: 'platform_review_seed',
    headline: 'BFF APIs documented; deprecation policy informal.',
    notes: [
      'Backend-for-frontend APIs are documented with versioned contracts.',
      'No formal deprecation policy is documented for client-facing endpoints.',
    ],
    remediations: [
      'Publish a documented deprecation policy for client-facing endpoints.',
    ],
    liveTelemetry: false,
    createdFrom: 'deterministic_tech_data_readiness_seed',
  },
];

// ---------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------

/**
 * Build the canonical Tech & Data readiness seed. Result is a frozen,
 * deterministic list — repeated calls return byte-equal data.
 */
export function buildTechDataReadinessSeed(): readonly TechReadinessSignal[] {
  return TECH_DATA_READINESS_SEED;
}

/**
 * Initialize a per-dimension record where every canonical dimension is
 * present with count 0.
 */
function emptyDimensionCounts(): Record<TechReadinessDimension, number> {
  const out: Record<TechReadinessDimension, number> = {
    data_quality: 0,
    integration_apis: 0,
    cloud_readiness: 0,
    model_gateway_readiness: 0,
    security_posture: 0,
    observability: 0,
  };
  return out;
}

/**
 * Initialize a per-level record where every canonical level is present
 * with count 0.
 */
function emptyLevelCounts(): Record<TechReadinessLevel, number> {
  const out: Record<TechReadinessLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    unknown: 0,
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
 * Build the deterministic summary for a readiness list. When no list
 * is provided, summarizes the canonical seed.
 *
 * Reconciliation guarantees:
 *
 * - `Object.values(byDimension).reduce(...)` equals `totalSignals`.
 * - `Object.values(byLevel).reduce(...)` equals `totalSignals`.
 * - `lowCount + mediumCount + highCount + unknownCount` equals
 *   `totalSignals`.
 * - `uniqueDomains` and `uniquePrograms` are sorted ascending and
 *   contain no duplicates.
 */
export function summarizeTechDataReadiness(
  signals: readonly TechReadinessSignal[] = TECH_DATA_READINESS_SEED,
): TechReadinessSummary {
  const byDimension = emptyDimensionCounts();
  const byLevel = emptyLevelCounts();
  const domains = new Set<string>();
  const programs = new Set<string>();

  for (const signal of signals) {
    byDimension[signal.dimension] += 1;
    byLevel[signal.level] += 1;
    domains.add(signal.domainLabel);
    if (signal.programKey !== undefined && signal.programKey.length > 0) {
      programs.add(signal.programKey);
    }
  }

  return {
    totalSignals: signals.length,
    byDimension,
    byLevel,
    lowCount: byLevel.low,
    mediumCount: byLevel.medium,
    highCount: byLevel.high,
    unknownCount: byLevel.unknown,
    uniqueDomains: sortedAscending([...domains]),
    uniquePrograms: sortedAscending([...programs]),
  };
}

/**
 * Return the readiness gaps in the input list. A gap is any signal
 * whose level is `low` or `unknown`. These are the entries Atlas
 * surfaces as foundation gaps so the Tower can render attention
 * rather than a fabricated readiness number.
 */
export function getReadinessGaps(
  signals: readonly TechReadinessSignal[] = TECH_DATA_READINESS_SEED,
): readonly TechReadinessGap[] {
  const gaps: TechReadinessGap[] = [];
  for (const signal of signals) {
    if (signal.level === 'low' || signal.level === 'unknown') {
      gaps.push({
        id: signal.id,
        domainLabel: signal.domainLabel,
        dimension: signal.dimension,
        level: signal.level,
        headline: signal.headline,
        remediations: signal.remediations,
      });
    }
  }
  return gaps;
}
