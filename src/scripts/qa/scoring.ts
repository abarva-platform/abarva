/**
 * Deterministic scorers for the Meridian Sentinel evidence QA harness.
 *
 * This module is intentionally network-free and `server-only`-free so it can be
 * unit-tested offline (see `__tests__/scoring.test.ts`) and CI can run it
 * without the Azure DB or Anthropic.
 *
 * The harness combines these deterministic checks with a Claude judge (see
 * `meridian-sentinel-qa.ts`). The split is documented in each scorer below.
 */

/** The 12 score dimensions, mirrored from qa-questions.json `meta.scoreDimensions`. */
export const SCORE_DIMENSIONS = [
  "specificity",
  "meridian_context_usage",
  "healthcare_corpus_usage",
  "citation_presence",
  "citation_correctness",
  "missing_evidence_honesty",
  "next_action_quality",
  "executive_clarity",
  "no_raw_id_leakage",
  "no_cross_tenant_leakage",
  "clinical_regulatory_caution",
  "value_model_rigor",
] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

/** Dimensions scored deterministically (no judge needed). */
export const DETERMINISTIC_DIMENSIONS: ScoreDimension[] = [
  "meridian_context_usage",
  "healthcare_corpus_usage",
  "citation_presence",
  "citation_correctness",
  "no_raw_id_leakage",
  "no_cross_tenant_leakage",
];

/** Dimensions deferred to the Claude judge (qualitative). */
export const JUDGE_DIMENSIONS: ScoreDimension[] = [
  "specificity",
  "executive_clarity",
  "next_action_quality",
  "missing_evidence_honesty",
  "clinical_regulatory_caution",
  "value_model_rigor",
];

/** Source-type buckets, mirrored from `AskSource['type']`. */
export const TENANT_SOURCE_TYPES = ["TENANT", "GRAPH"] as const;
export const PATTERN_SOURCE_TYPES = [
  "PATTERN",
  "BENCHMARK",
  "INSIGHT",
  "WORLDVIEW",
  "RESEARCH",
  "REGULATION",
  "TOPIC",
  "VENDOR",
] as const;
export const INFERENCE_SOURCE_TYPES = ["GENERAL", "SURFACE"] as const;

export interface ScoreSource {
  type: string;
  name?: string;
  id?: string | null;
  confidence?: number | null;
}

/**
 * Raw-ID / internal-identifier leak detector.
 *
 * Flags answers that leak:
 *  - Meridian change-record codes like `CHG-MH-00034`
 *  - bare UUID prefixes (`xxxxxxxx-xxxx-`) — e.g. a tenant/node id
 *  - filesystem temp paths (`/tmp/...`)
 *  - `enterprise_context_*` internal table names
 */
export const RAW_ID_LEAK_RE =
  /(CHG-MH-\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{8}-[0-9a-f]{4}-|\/tmp\/[\w./-]+|enterprise_context_[a-z_]+)/i;

/** Cross-tenant leak detector: any non-Meridian tenant name appearing in a Meridian answer. */
export const FOREIGN_TENANT_RE =
  /\b(apex(?:\s|-)?retail|lakeshore|firstcapital|first\s?capital|skyharbor|sky\s?harbor)\b/i;

export function detectRawIdLeak(answer: string): boolean {
  return RAW_ID_LEAK_RE.test(answer);
}

export function detectForeignTenantLeak(answer: string): boolean {
  return FOREIGN_TENANT_RE.test(answer);
}

export function countSourceBuckets(sources: ScoreSource[]): {
  tenant: number;
  pattern: number;
  inference: number;
} {
  let tenant = 0;
  let pattern = 0;
  let inference = 0;
  for (const s of sources) {
    const t = (s.type ?? "").toUpperCase();
    if ((TENANT_SOURCE_TYPES as readonly string[]).includes(t)) tenant += 1;
    else if ((PATTERN_SOURCE_TYPES as readonly string[]).includes(t))
      pattern += 1;
    else if ((INFERENCE_SOURCE_TYPES as readonly string[]).includes(t))
      inference += 1;
  }
  return { tenant, pattern, inference };
}

export interface DeterministicScoreInput {
  answer: string;
  sources: ScoreSource[];
}

/** Score map covering exactly the six deterministic dimensions. */
export type DeterministicScores = {
  meridian_context_usage: number;
  healthcare_corpus_usage: number;
  citation_presence: number;
  citation_correctness: number;
  no_raw_id_leakage: number;
  no_cross_tenant_leakage: number;
};

/**
 * Compute the six deterministic dimension scores (0-5).
 *
 * - citation_presence: 5 when sourceCount>0, else 0.
 * - meridian_context_usage: 5 when >=1 TENANT/GRAPH source, 2 when only inference, else 0.
 * - healthcare_corpus_usage: 5 when >=2 PATTERN-class sources, 3 when exactly 1, else 0.
 * - citation_correctness: penalizes sources missing a usable name/id (proxy for un-renderable cites).
 * - no_raw_id_leakage: 0 when a raw id / uuid / tmp path / internal table name leaks, else 5.
 * - no_cross_tenant_leakage: 0 when a foreign tenant name appears, else 5.
 */
export function scoreDeterministic(
  input: DeterministicScoreInput,
): DeterministicScores {
  const { answer, sources } = input;
  const sourceCount = sources.length;
  const buckets = countSourceBuckets(sources);

  const citation_presence = sourceCount > 0 ? 5 : 0;

  let meridian_context_usage: number;
  if (buckets.tenant >= 1) meridian_context_usage = 5;
  else if (buckets.inference > 0 || buckets.pattern > 0)
    meridian_context_usage = 2;
  else meridian_context_usage = 0;

  let healthcare_corpus_usage: number;
  if (buckets.pattern >= 2) healthcare_corpus_usage = 5;
  else if (buckets.pattern === 1) healthcare_corpus_usage = 3;
  else healthcare_corpus_usage = 0;

  // citation_correctness: of the sources cited, how many are renderable (have a
  // non-empty name and either an id or are a recognized source type). 0 sources => 0.
  let citation_correctness: number;
  if (sourceCount === 0) {
    citation_correctness = 0;
  } else {
    const renderable = sources.filter(
      (s) => typeof s.name === "string" && s.name.trim().length > 0,
    ).length;
    const ratio = renderable / sourceCount;
    citation_correctness = Math.round(ratio * 5);
  }

  const no_raw_id_leakage = detectRawIdLeak(answer) ? 0 : 5;
  const no_cross_tenant_leakage = detectForeignTenantLeak(answer) ? 0 : 5;

  return {
    meridian_context_usage,
    healthcare_corpus_usage,
    citation_presence,
    citation_correctness,
    no_raw_id_leakage,
    no_cross_tenant_leakage,
  };
}

/** Clamp/normalize a judge-provided number into the 0-5 integer band. */
export function normalizeJudgeScore(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** Compute the overall (mean of all 12) given a full dimension map. Rounded to 2dp. */
export function computeOverall(
  scores: Partial<Record<ScoreDimension, number>>,
): number {
  const vals = SCORE_DIMENSIONS.map((d) => scores[d] ?? 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  return Math.round((sum / SCORE_DIMENSIONS.length) * 100) / 100;
}
