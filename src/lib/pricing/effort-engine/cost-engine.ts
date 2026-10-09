/**
 * Nexus Pricing Engine — PR4 cost engine: line-item aggregation and the
 * portfolio/shared-cost roll-up (brief §7.7).
 *
 * Pure functions only — no I/O, no dependency on `effort-engine.ts` (it
 * depends on THIS module, not the other way around).
 */
import { roundHours, sumCents } from "./money";
import type { Cents, EffortEngineOutput, EffortEngineTotals, EffortLineItem } from "./types";

/** The identity of one rule's hours inside one engine output: every role line of that rule repeats the same `moduleHours`. */
function ruleHoursKey(line: EffortLineItem): string {
  return `${line.activityPackCode}::${line.ruleCode}`;
}

/**
 * Sum a set of already-computed line items into the engine's totals, per the
 * `out_of_scope`-exclusion rule documented on `EffortEngineTotals`.
 *
 * Hours are counted ONCE per (activity pack, rule). `runEffortEngine` emits
 * one line per (pack, rule, role), and every role line of a rule repeats that
 * rule's pack-level `moduleHours` (its `roleHours` is the allocated share).
 * Summing `moduleHours` per line would multiply a rule's hours by its number
 * of roles. Costs are still summed per line — each role line's labor cost is
 * its own allocated share.
 */
export function aggregateTotals(lineItems: readonly EffortLineItem[]): EffortEngineTotals {
  let totalRawHours = 0;
  let totalExpectedHours = 0;
  let totalLaborCostCents: Cents = 0;
  let totalManualCostCents: Cents = 0;
  let gapCount = 0;
  const countedRuleHours = new Set<string>();

  for (const line of lineItems) {
    const included = line.classification !== "out_of_scope";
    if (line.moduleHours && included) {
      const key = ruleHoursKey(line);
      if (!countedRuleHours.has(key)) {
        countedRuleHours.add(key);
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
  /** How many source Move outputs contained a line with this sharedCostRef (1 for initiative_specific/out_of_scope lines, which are never deduped). Counts Moves, not lines. */
  occurrenceCount: number;
  /** For a shared block: the sum of every line of the block in its FIRST owning Move (the amount counted in `totalCostCents`). */
  costCents: Cents;
}

export interface PortfolioRollup {
  moveCount: number;
  /** Sum with each shared/reused/already-funded block counted exactly once per distinct sharedCostRef — all of its lines, from its first owning Move — regardless of how many Moves reference it. */
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
 *
 * `shared_program` / `reused` / `already_funded` lines are deduped as a
 * BLOCK per `sharedCostRef`: the first Move (by source array order) whose
 * output carries that ref owns the block, and EVERY line of the block in that
 * Move counts (a shared pack emits one line per rule and role). The same ref
 * in any later Move is a duplicate copy of the block: its lines are recorded
 * (`occurrenceCount`, so the UI can show "this Move also touches this shared
 * cost") but none of them adds to the total again. A one-Move portfolio
 * therefore equals that Move's own `totals.totalCostCents`.
 */
export function rollUpPortfolio(outputs: readonly EffortEngineOutput[]): PortfolioRollup {
  const linesByRef = new Map<string, PortfolioRollupLine>();
  const ownerIndexByRef = new Map<string, number>();
  const lastSeenIndexByRef = new Map<string, number>();
  let totalCostCents: Cents = 0;
  let naiveSumCents: Cents = 0;

  outputs.forEach((output, outputIndex) => {
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
        const key = `${output.archetypeCode}::${line.activityPackCode}::${line.ruleCode}::${line.roleCode ?? "manual"}::${outputIndex}`;
        linesByRef.set(key, { sharedCostRef: line.sharedCostRef, classification: line.classification, occurrenceCount: 1, costCents: lineCostCents });
        continue;
      }

      const ref = line.sharedCostRef;
      let entry = linesByRef.get(ref);
      if (!entry) {
        entry = { sharedCostRef: ref, classification: line.classification, occurrenceCount: 0, costCents: 0 };
        linesByRef.set(ref, entry);
        ownerIndexByRef.set(ref, outputIndex);
      }
      if (lastSeenIndexByRef.get(ref) !== outputIndex) {
        lastSeenIndexByRef.set(ref, outputIndex);
        entry.occurrenceCount += 1;
      }
      if (ownerIndexByRef.get(ref) === outputIndex) {
        // A line of the block in its owning Move — counted.
        entry.costCents = sumCents(entry.costCents, lineCostCents);
        totalCostCents = sumCents(totalCostCents, lineCostCents);
      }
      // Otherwise a later Move's copy of an already-counted block — the dedup.
    }
  });

  return {
    moveCount: outputs.length,
    totalCostCents,
    naiveSumCents,
    lines: Array.from(linesByRef.values()),
  };
}
