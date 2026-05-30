/**
 * Initiative-Archetype Corpus (IAC) — schema definitions.
 *
 * The IAC is AbarVa's curated, sourced, queryable industry-context layer. It
 * is what Atlas reaches for when a CIO asks "what is the industry doing with
 * Copilot / Workday agents / Cursor / etc." Tenant-specific facts come from
 * Tower; cross-industry context comes from this corpus.
 *
 * Honesty contract (mirrors PR #2562's audit close):
 * - Every numeric figure is a labelled `planning-range` with explicit cohort,
 *   sample size, source, and date. No bare numbers.
 * - Every claim cites a real, verifiable source. If a source you would cite
 *   does not exist or does not say what you would attribute to it, OMIT the
 *   claim entirely. Quality over quantity.
 * - `lastReviewed` is required on every entry and surfaced via the retrieval
 *   API so consumers can show recency to the user.
 * - The literal phrases "industry standard", "everyone is doing", and
 *   "best practice" are banned in archetype copy unless they appear verbatim
 *   in a cited source — invariants flag those for review.
 */

export type ArchetypeCategory =
  | 'ai-coding'
  | 'ai-product-dev'
  | 'ai-erp'
  | 'ai-itsm'
  | 'ai-crm'
  | 'ai-productivity'
  | 'ai-hr'
  | 'ai-customer-service';

/**
 * Every numeric figure in the corpus is expressed as a PlanningRange. The
 * `label` literal tag is what the honesty-invariants tests assert against.
 */
export interface PlanningRange {
  label: 'planning-range';
  /** Lower bound of the range (inclusive). */
  low: number;
  /** Upper bound of the range (inclusive). */
  high: number;
  /** Unit string, e.g. '%', 'pp', 'minutes/day', 'PRs/dev/week'. */
  unit: string;
  /** Cohort the range applies to — e.g. 'enterprise developers using Copilot'. */
  cohort: string;
  /**
   * Sample size behind the figure. Use 0 when the source publishes a range
   * without a disclosed N (still legitimate; invariants only require a number).
   */
  sampleSize: number;
  /** Source name — must match an evidenceAnchor or external citation. */
  source: string;
  /** Source date in 'YYYY-MM' or 'YYYY-MM-DD' form. */
  date: string;
}

export interface AdoptionMetric {
  /** Metric key, e.g. 'acceptance_rate', 'seat_utilization', 'time_to_value'. */
  metric: string;
  range: PlanningRange;
  /** Optional top-quartile range when the source separately reports it. */
  topQuartileRange?: PlanningRange;
}

export interface DeploymentPattern {
  /** Pattern key, e.g. 'pair-programming', 'code-review-assist'. */
  pattern: string;
  /** Operator-grade description, one to three sentences. */
  description: string;
  /** Prevalence range of the pattern within the named cohort. */
  prevalenceInCohort: PlanningRange;
  /** Source name. */
  source: string;
  /** Source date in 'YYYY-MM' or 'YYYY-MM-DD' form. */
  date: string;
}

export interface TrendDirection {
  direction:
    | 'mainstream-scaling'
    | 'emerging'
    | 'plateauing'
    | 'consolidating'
    | 'early';
  /** One-sentence six-month-out signal. */
  six_month_signal: string;
  /** Named driver — a specific event, product, or shift, not a vague trend. */
  named_driver: string;
  source: string;
  date: string;
}

export interface Pitfall {
  /** Short pitfall name. */
  name: string;
  /** Operator-grade description. */
  description: string;
  source?: string;
  date?: string;
}

export interface PeerBenchmark {
  /** Cohort label, e.g. 'retail $10B-$50B'. */
  cohortLabel: string;
  /** Metric key, e.g. 'acceptance_rate'. */
  metric: string;
  range: PlanningRange;
}

export interface EmergingPattern {
  name: string;
  description: string;
  adoptionStatus: 'early-pilots' | 'limited-availability' | 'GA-recent';
  source?: string;
  date?: string;
}

export interface EvidenceAnchor {
  /** The specific claim this anchor supports. */
  claim: string;
  source: string;
  date: string;
  url?: string;
}

export interface InitiativeArchetype {
  /** Stable archetype key, snake_case, e.g. 'github_copilot'. */
  archetypeKey: string;
  /** Display label, e.g. 'GitHub Copilot'. */
  label: string;
  category: ArchetypeCategory;
  /** Operator-grade definition, one to three sentences. */
  definition: string;
  adoptionMetrics: AdoptionMetric[];
  deploymentPatterns: DeploymentPattern[];
  trendDirection: TrendDirection;
  commonPitfalls: Pitfall[];
  peerBenchmarks: PeerBenchmark[];
  whatNext: EmergingPattern[];
  evidenceAnchors: EvidenceAnchor[];
  /** ISO date 'YYYY-MM-DD' of the last human review. */
  lastReviewed: string;
}
