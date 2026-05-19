// Expert Kernel — assumption-ledger.
//
// Assumptions are first-class records, not footnotes. Every value or cost
// estimate in the business case rests on assumptions; the ledger makes them
// explicit, owned, and ranked by how much they move the case ("sensitivity
// impact"). The compiler reads the ledger to surface "the 3 assumptions that
// move 80% of the case".
//
// Pure module: deterministic, no I/O.

import type { Confidence } from './types';

/** How much an assumption being wrong moves the business case. */
export type SensitivityImpact = 'high' | 'medium' | 'low';

export interface AssumptionInput {
  /** Stable key, e.g. 'cost_per_contact'. */
  key: string;
  /** The assumption stated plainly. */
  statement: string;
  /** Named human owner accountable for validating it. */
  owner: string;
  confidence: Confidence;
  /** Where the assumption is grounded — data point, benchmark, or 'seed gap'. */
  source: string;
  /** How much the case moves if this assumption is wrong. */
  sensitivityImpact: SensitivityImpact;
  /** True when the assumption stands in for absent tenant data. */
  isSeedGapProxy?: boolean;
}

export interface Assumption extends AssumptionInput {
  isSeedGapProxy: boolean;
}

export interface AssumptionLedger {
  assumptions: Assumption[];
  /** Assumptions ranked high → low sensitivity impact. */
  byImpact: Assumption[];
  /** The (up to) three highest-impact assumptions — the "80% movers". */
  topMovers: Assumption[];
  /** Assumptions that exist only because tenant data is a seed gap. */
  seedGapProxies: Assumption[];
}

const IMPACT_RANK: Record<SensitivityImpact, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const CONFIDENCE_RANK: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Build an assumption ledger. Throws if two assumptions share a key, or if an
 * assumption is empty.
 */
export function buildAssumptionLedger(
  inputs: AssumptionInput[],
): AssumptionLedger {
  const seen = new Set<string>();
  const assumptions: Assumption[] = inputs.map((a) => {
    if (seen.has(a.key)) {
      throw new Error(`Duplicate assumption key: ${a.key}`);
    }
    seen.add(a.key);
    if (!a.statement.trim()) {
      throw new Error(`Assumption '${a.key}' has an empty statement.`);
    }
    if (!a.owner.trim()) {
      throw new Error(`Assumption '${a.key}' has no owner.`);
    }
    return { ...a, isSeedGapProxy: a.isSeedGapProxy ?? false };
  });

  // Rank by impact desc, then by lower confidence (a low-confidence
  // high-impact assumption is the most dangerous), then by key for stability.
  const byImpact = [...assumptions].sort((x, y) => {
    const impact = IMPACT_RANK[y.sensitivityImpact] - IMPACT_RANK[x.sensitivityImpact];
    if (impact !== 0) return impact;
    const conf = CONFIDENCE_RANK[x.confidence] - CONFIDENCE_RANK[y.confidence];
    if (conf !== 0) return conf;
    return x.key.localeCompare(y.key);
  });

  return {
    assumptions,
    byImpact,
    topMovers: byImpact.slice(0, 3),
    seedGapProxies: assumptions.filter((a) => a.isSeedGapProxy),
  };
}
