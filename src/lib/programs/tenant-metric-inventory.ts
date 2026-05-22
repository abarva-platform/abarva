// Tenant metric inventory — which Function Pack metrics a Move actually records.
//
// A Domain Function Pack carries the operating metrics a function SHOULD
// measure (function-pack-types.ts, Layer 1). A Move (`engagements` row) carries
// the metrics the tenant ACTUALLY recorded, in `engagements.baseline_metrics` —
// a JSONB array of `{ metric_name, value, unit, source, ... }` objects.
//
// `resolveTenantMetricKeys` reconciles the two: given a Move's baseline metrics
// and a resolved pack, it returns the subset of the pack's operating-metric
// keys the tenant DEMONSTRABLY records. Everything it does NOT return correctly
// becomes a precise seed gap downstream (`bindFunctionPackForArtifact`, §7).
//
// The discipline is the same no-fabrication discipline the packs hold to:
// matching is CONSERVATIVE. A tenant metric name must confidently match a pack
// metric's key or human name — by exact normalised equality — to count. A loose
// or partial resemblance is NOT a match; it is omitted, and the pack metric
// then surfaces as an honest seed gap rather than a guessed presence.
//
// Pure module: deterministic, no I/O.

import type { FunctionPack } from './expert-kernel/domain/function-pack-types';

/**
 * One recorded baseline metric as it appears in `engagements.baseline_metrics`.
 * Only `metric_name` is needed to reconcile against a pack; the rest of the
 * JSONB shape (`value`, `unit`, `source`, `locked_date`, `locked_by`) is
 * deliberately not modelled here — this module answers "is it recorded", not
 * "what is its value".
 */
export interface BaselineMetricEntry {
  /** The tenant's name for the metric, e.g. "Average Handle Time". */
  metric_name?: unknown;
}

/**
 * Common unit / qualifier tokens that trail a metric name and carry no
 * identifying signal — "rate", "%", "(PMPY)", "per 1,000", etc. Stripped so
 * "30-day readmission rate" and "30 day readmission" normalise alike. Kept
 * deliberately small: only tokens that are genuinely noise, never tokens that
 * could distinguish two real metrics.
 */
const TRAILING_NOISE_TOKENS: ReadonlySet<string> = new Set([
  'rate', 'ratio', 'percent', 'percentage', 'pct', 'pmpy', 'pmpm', 'usd',
  'count', 'index', 'score', 'avg', 'average', 'total',
]);

/**
 * Normalise a metric label — a pack metric `key`/`name` or a tenant
 * `metric_name` — to a comparable canonical form.
 *
 * Lower-cases, replaces every run of non-alphanumeric characters with a single
 * underscore (so punctuation, spaces, slashes and dashes all collapse), trims
 * leading/trailing underscores, and drops trailing noise tokens (units and
 * qualifiers that carry no identifying signal). Empty input — and input that
 * is nothing but noise — normalises to the empty string, which never matches.
 */
export function normalizeMetricLabel(label: string): string {
  const snake = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!snake) return '';

  const tokens = snake.split('_').filter(Boolean);
  // Drop trailing noise tokens, but never strip the metric down to nothing —
  // a name that is ONLY noise keeps its tokens so it cannot match by accident.
  while (
    tokens.length > 1 &&
    TRAILING_NOISE_TOKENS.has(tokens[tokens.length - 1])
  ) {
    tokens.pop();
  }
  return tokens.join('_');
}

/**
 * Extract the recorded metric names from a Move's `baseline_metrics` JSONB.
 *
 * Defensive against the untyped JSONB shape: a non-array, missing field, or
 * non-string `metric_name` is skipped rather than throwing. The returned list
 * is the v1 metric-name source; a future broker-backed source can produce the
 * same `string[]` and feed `resolveTenantMetricKeys` unchanged.
 */
export function extractBaselineMetricNames(
  baselineMetrics: readonly BaselineMetricEntry[] | null | undefined,
): string[] {
  if (!Array.isArray(baselineMetrics)) return [];
  const names: string[] = [];
  for (const entry of baselineMetrics) {
    const name = entry?.metric_name;
    if (typeof name === 'string' && name.trim().length > 0) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Resolve which of a Function Pack's operating-metric keys the tenant
 * demonstrably records.
 *
 * Accepts either the raw `engagements.baseline_metrics` JSONB array OR an
 * already-extracted list of metric-name strings. The string-list form is the
 * extension seam: a broker-backed metric source can hand in its own
 * already-resolved names without this signature or any caller changing.
 *
 * Matching is CONSERVATIVE and never guesses. A pack metric counts as recorded
 * only when some tenant metric name normalises to EXACTLY the same canonical
 * form as that pack metric's `key` or its human `name`. Anything short of a
 * confident, exact normalised match is omitted — and the pack metric then
 * correctly surfaces as a precise seed gap downstream.
 *
 * Returns the matched pack keys in pack order, de-duplicated. Pure and
 * deterministic: same inputs → same output.
 *
 * @param source A Move's `baseline_metrics` JSONB array, or an already-
 *               extracted list of tenant metric-name strings.
 * @param pack   The resolved Function Pack whose operating metrics are the
 *               authoritative set of keys to reconcile against.
 */
export function resolveTenantMetricKeys(
  source:
    | readonly BaselineMetricEntry[]
    | readonly string[]
    | null
    | undefined,
  pack: FunctionPack,
): string[] {
  const rawNames: string[] =
    Array.isArray(source) &&
    source.every((entry) => typeof entry === 'string')
      ? (source as readonly string[]).slice()
      : extractBaselineMetricNames(source as readonly BaselineMetricEntry[]);

  // The set of canonical forms the tenant demonstrably recorded.
  const tenantForms = new Set<string>();
  for (const name of rawNames) {
    const form = normalizeMetricLabel(name);
    if (form) tenantForms.add(form);
  }
  if (tenantForms.size === 0) return [];

  const matched: string[] = [];
  const seen = new Set<string>();
  for (const metric of pack.operatingMetrics) {
    if (seen.has(metric.key)) continue;
    const keyForm = normalizeMetricLabel(metric.key);
    const nameForm = normalizeMetricLabel(metric.name);
    // Confident match only: an exact normalised equality on key OR name.
    if (
      (keyForm && tenantForms.has(keyForm)) ||
      (nameForm && tenantForms.has(nameForm))
    ) {
      matched.push(metric.key);
      seen.add(metric.key);
    }
  }
  return matched;
}
