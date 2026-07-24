/**
 * Nexus Pricing Engine — PR4 cost engine: line-item aggregation and the
 * portfolio/shared-cost roll-up (brief §7.7).
 *
 * Pure functions only — no I/O, no dependency on `effort-engine.ts` (it
 * depends on THIS module, not the other way around).
 */
import { roundHours, sumCents } from "./money";
import type { Cents, EffortEngineOutput, EffortEngineTotals, EffortLineItem } from "./types";

/** Sum a set of already-computed line items into the engine's totals, per the `out_of_scope`-exclusion rule documented on `EffortEngineTotals`. */
export function aggregateTotals(lineItems: readonly EffortLineItem[]): EffortEngineTotals {
  let totalRawHours = 0;
  let totalExpectedHours = 0;
  let totalLaborCostCents: Cents = 0;
  let totalManualCostCents: Cents = 0;
  let gapCount = 0;

  for (const line of lineItems) {
    const included = line.classification !== "out_of_scope";
    if (line.moduleHours) {
      if (included) {
        totalRawHours += line.moduleHours.raw;
        totalExpectedHours += line.moduleHours.expected;
      }
    }
    if (line.roleCode) {
      if (line.laborCostCents === null) {
        gapCount += 1;
      } else if (included) {
        totalLaborCostCents = sumCents(totalLaborCostCents, line.laborCostCents);
      }
    }
    if (line.manualCostCents !== null && included) {
      totalManualCostCents = sumCents(totalManualCostCents, line.manualCostCents);
    }
  }

  return {
    // Rounded once more at the TOTAL level (in addition to each line already
    // being rounded) — consistent rounding discipline at both the line and
    // total level, per brief §12. Summing many already-4-decimal-rounded
    // hours values can still accumulate IEEE-754 noise past the 4th decimal
    // (e.g. 14098.099999999999); this final round keeps the total exactly
    // as clean as any individual line.
    totalRawHours: roundHours(totalRawHours),
    totalExpectedHours: roundHours(totalExpectedHours),
    totalLaborCostCents,
    totalManualCostCents,
    totalCostCents: sumCents(totalLaborCostCents, totalManualCostCents),
    gapCount,
  };
}

// ---------------------------------------------------------------------------
// Portfolio roll-up (brief §7.7) — dedup shared/reused/already-funded costs
// across multiple Moves' engine outputs so a portfolio total never
// double-counts a shared cost pool.
// ---------------------------------------------------------------------------

export interface PortfolioRollupLine {
  sharedCostRef: string | null;
  classification: EffortLineItem["classification"];
  /** How many source Move outputs contained a line with this sharedCostRef (1 for initiative_specific/out_of_scope lines, which are never deduped). */
  occurrenceCount: number;
  costCents: Cents;
}

export interface PortfolioRollup {
  moveCount: number;
  /** Sum with shared/reused/already-funded costs counted exactly once per distinct sharedCostRef, regardless of how many Moves reference it. */
  totalCostCents: Cents;
  /** What the naive sum (no dedup at all) would have been — for the UI to show "you avoided double-counting $X". */
  naiveSumCents: Cents;
  lines: PortfolioRollupLine[];
}

/**
 * Roll up multiple Moves' `EffortEngineOutput`s into one portfolio total.
 * `initiative_specific` and `out_of_scope`-classified lines are NEVER
 * deduped (each Move's own cost stands alone; `out_of_scope` is excluded
 * from both the naive and deduped totals, matching `aggregateTotals`).
 * `shared_program` / `reused` / `already_funded` lines ARE deduped: when the
 * SAME `sharedCostRef` appears in more than one Move's output, only the
 * FIRST occurrence (by source array order) contributes to the deduped
 * total — later occurrences are recorded (so the UI can show "this Move
 * also touches this shared cost") but do not add to the total again.
 */
export function rollUpPortfolio(outputs: readonly EffortEngineOutput[]): PortfolioRollup {
  const seenSharedRefs = new Set<string>();
  const linesByRef = new Map<string, PortfolioRollupLine>();
  let totalCostCents: Cents = 0;
  let naiveSumCents: Cents = 0;

  for (const output of outputs) {
    for (const line of output.lineItems) {
      if (line.classification === "out_of_scope") continue;
      const lineCostCents = sumCents(line.laborCostCents ?? 0, line.manualCostCents ?? 0);
      naiveSumCents = sumCents(naiveSumCents, lineCostCents);

      const isSharedClass =
        line.classification === "shared_program" || line.classification === "reused" || line.classification === "already_funded";

      if (!isSharedClass || !line.sharedCostRef) {
        // initiative_specific (or a shared-class line with no ref supplied,
        // treated conservatively as NOT deduped) always counts once, standalone.
        totalCostCents = sumCents(totalCostCents, lineCostCents);
        const key = `${output.archetypeCode}::${line.activityPackCode}::${line.ruleCode}::${line.roleCode ?? "manual"}::${outputs.indexOf(output)}`;
        linesByRef.set(key, { sharedCostRef: line.sharedCostRef, classification: line.classification, occurrenceCount: 1, costCents: lineCostCents });
        continue;
      }

      const existing = linesByRef.get(line.sharedCostRef);
      if (existing) {
        existing.occurrenceCount += 1;
        // Not added to totalCostCents again — this is the dedup.
        continue;
      }
      linesByRef.set(line.sharedCostRef, {
        sharedCostRef: line.sharedCostRef,
        classification: line.classification,
        occurrenceCount: 1,
        costCents: lineCostCents,
      });
      if (!seenSharedRefs.has(line.sharedCostRef)) {
        seenSharedRefs.add(line.sharedCostRef);
        totalCostCents = sumCents(totalCostCents, lineCostCents);
      }
    }
  }

  return {
    moveCount: outputs.length,
    totalCostCents,
    naiveSumCents,
    lines: Array.from(linesByRef.values()),
  };
}
