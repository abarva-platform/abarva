// Precedence merge for the unified facts layer.
//
// Both the real tower_* operational projection and the synthetic/curated V3
// template projection write into cio_tower.facts. When BOTH describe the SAME
// canonical metric for the SAME tool/program and period, exactly one should
// drive the mart — the higher-priority source (real extract > curated template
// > planning assumption). But when they describe DIFFERENT metrics (e.g.
// Copilot license spend from budget vs. Copilot usage from telemetry), they
// are complementary and BOTH must survive. Merging by display name would
// wrongly collapse the latter; merging by canonical identity does not.
//
// Pure function, no I/O — the winner rule is unit-testable without a DB.

import {
  type CioTowerFactRow,
  type CanonicalIdentity,
  canonicalMergeKey,
  readCanonicalIdentity,
} from "./facts-schema";

export interface FactMergeSuppression {
  mergeKey: string;
  metricKey: string;
  keptFactKey: string;
  keptPriority: number;
  droppedFactKey: string;
  droppedPriority: number;
  reason: string;
}

export interface FactMergeResult {
  /** The winning fact per canonical merge key, plus every fact that carried
   * no canonical identity (passed through untouched — nothing to merge on). */
  facts: CioTowerFactRow[];
  /** Every fact a higher-priority row displaced, for the audit trail. A
   * suppressed row is never silently gone — it is reported here and can be
   * surfaced as labeled fallback. */
  suppressed: FactMergeSuppression[];
}

/**
 * Collapse facts that describe the same canonical metric/tool/program/period,
 * keeping the highest source_priority. Ties (equal priority, same key) keep the
 * first seen and report the rest as suppressed duplicates so a double-load is
 * visible rather than silently doubling a value. Facts without a canonical
 * identity are never merged — they pass through.
 */
export function mergeFactsByCanonicalIdentity(
  facts: readonly CioTowerFactRow[],
): FactMergeResult {
  const winners = new Map<
    string,
    { fact: CioTowerFactRow; identity: CanonicalIdentity }
  >();
  const passthrough: CioTowerFactRow[] = [];
  const suppressed: FactMergeSuppression[] = [];

  for (const fact of facts) {
    const identity = readCanonicalIdentity(fact);
    if (!identity) {
      // No merge spine — cannot dedup safely, so keep it as-is.
      passthrough.push(fact);
      continue;
    }
    const key = canonicalMergeKey(identity);
    const current = winners.get(key);
    if (!current) {
      winners.set(key, { fact, identity });
      continue;
    }
    if (identity.source_priority > current.identity.source_priority) {
      // New row outranks the incumbent — incumbent becomes fallback.
      suppressed.push({
        mergeKey: key,
        metricKey: identity.metric_key,
        keptFactKey: fact.fact_key,
        keptPriority: identity.source_priority,
        droppedFactKey: current.fact.fact_key,
        droppedPriority: current.identity.source_priority,
        reason: "higher_source_priority_wins",
      });
      winners.set(key, { fact, identity });
    } else {
      // Incumbent outranks or ties — new row is the fallback/duplicate.
      suppressed.push({
        mergeKey: key,
        metricKey: identity.metric_key,
        keptFactKey: current.fact.fact_key,
        keptPriority: current.identity.source_priority,
        droppedFactKey: fact.fact_key,
        droppedPriority: identity.source_priority,
        reason:
          identity.source_priority === current.identity.source_priority
            ? "duplicate_same_priority_first_kept"
            : "lower_source_priority_suppressed",
      });
    }
  }

  return {
    facts: [...passthrough, ...[...winners.values()].map((w) => w.fact)],
    suppressed,
  };
}
