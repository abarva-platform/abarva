/**
 * Moves value engine — the case cost basis (increment 2).
 *
 * The investment a value case is measured against, resolved in this order:
 *
 *   1. an APPROVED ROM pricing snapshot, when a loader is provided. The ROM
 *      snapshot path is a separate change, so this is an injected interface
 *      only; nothing here imports pricing.
 *   2. otherwise the reviewed P4 estimate model (`estimates_capacity`,
 *      `evaluateEstimateModel`): its total for the delivery model the case is
 *      funded on, low/base/high, in whole cents. "Reviewed" is the estimate's
 *      own bar — a named reviewer who confirmed the inputs and no open errors.
 *   3. otherwise BLOCKED, with a reason and a figure-free sentence. A blocked
 *      basis gives the engine a cost it cannot resolve, so the case shows no
 *      total, NPV or payback — never a guessed investment.
 *
 * The figure the author typed into the value model's own `cost` is not a
 * basis: the case is measured against the priced or reviewed cost.
 *
 * Never the expert-kernel `DEFAULT_PLANNING_RATE_CARD`. A kernel cost figure
 * a caller hands in is carried only as a labelled cross-check,
 * "P2 planning benchmark, superseded", and never becomes the cost.
 *
 * Which delivery model: the estimate prices internal AND vendor delivery for
 * every role pair (both are required for it to be reviewed), so a single cost
 * needs the choice named. No default is taken — choosing the cheaper or the
 * dearer one would decide the funding question for the reader.
 *
 * Currency: the engine works in US dollars and cents. Any other currency
 * blocks; no conversion rate is assumed.
 */
import {
  evaluateEstimateModel,
  type EstimateDeliveryModel,
} from "@/lib/programs/estimate-model";
import type { Cents, ValueCase, ValueCaseCost } from "./types";

export const P2_PLANNING_BENCHMARK_LABEL = "P2 planning benchmark, superseded";

/**
 * The snapshot id a BLOCKED basis hands the engine. No resolver answers it,
 * so the engine reports `case.cost` unresolved and gives no figure.
 */
export const UNRESOLVED_COST_BASIS_SNAPSHOT_ID = "cost-basis:unresolved";

export const COST_BASIS_CURRENCY = "USD";

/** What the (not yet merged) ROM snapshot path must hand over. */
export interface ApprovedRomSnapshot {
  snapshotId: string;
  currency: string;
  lowCents: Cents;
  baseCents: Cents;
  highCents: Cents;
}

/** Returns the Move's approved ROM snapshot, or null when it has none. */
export type ApprovedRomSnapshotLoader =
  () => Promise<ApprovedRomSnapshot | null>;

export type CostBasisBlockReason =
  | "rom_snapshot_unreadable"
  | "cost_currency_unsupported"
  | "estimate_absent"
  | "estimate_unreadable"
  | "estimate_not_reviewed"
  | "estimate_delivery_model_unselected";

export interface PlanningBenchmark {
  label: typeof P2_PLANNING_BENCHMARK_LABEL;
  cents: Cents;
  /** Always false: shown for comparison, never the cost. */
  counted: false;
}

export type CostBasis =
  | {
      status: "resolved";
      basis: "rom_snapshot" | "estimate_model";
      /** `rom:<snapshotId>` or `estimate_model:<internal|vendor>`. */
      source: string;
      deliveryModel: EstimateDeliveryModel | null;
      cents: { low: Cents; base: Cents; high: Cents };
      planningBenchmark: PlanningBenchmark | null;
    }
  | {
      status: "blocked";
      reason: CostBasisBlockReason;
      detail: string;
      planningBenchmark: PlanningBenchmark | null;
    };

const BLOCK_DETAIL: Readonly<Record<CostBasisBlockReason, string>> = {
  rom_snapshot_unreadable:
    "The approved ROM snapshot's totals could not be read as whole, ordered, non-negative cents, so the case has no cost to measure against.",
  cost_currency_unsupported:
    "The cost is priced in a currency other than US dollars; the value engine works in US dollars and assumes no conversion rate.",
  estimate_absent:
    "There is no approved ROM snapshot and no P4 estimate model yet, so the case has no cost to measure against. Build the estimate in Estimates & capacity.",
  estimate_unreadable:
    "The P4 estimate model could not be read, so the case has no cost to measure against. Rebuild it from the estimate editor.",
  estimate_not_reviewed:
    "The P4 estimate model is not reviewed yet: a named reviewer must confirm its inputs and its open errors must be cleared before it can be the case's cost.",
  estimate_delivery_model_unselected:
    "The reviewed estimate prices both internal and vendor delivery; name the one this case is funded on (delivery=internal or delivery=vendor).",
};

export function describeCostBasisBlock(reason: CostBasisBlockReason): string {
  return BLOCK_DETAIL[reason];
}

function blocked(
  reason: CostBasisBlockReason,
  planningBenchmark: PlanningBenchmark | null,
): CostBasis {
  return {
    status: "blocked",
    reason,
    detail: BLOCK_DETAIL[reason],
    planningBenchmark,
  };
}

function benchmark(cents: Cents | null | undefined): PlanningBenchmark | null {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return null;
  }
  return { label: P2_PLANNING_BENCHMARK_LABEL, cents, counted: false };
}

function wholeOrderedCents(low: number, base: number, high: number): boolean {
  return (
    [low, base, high].every((v) => Number.isInteger(v) && v >= 0) &&
    low <= base &&
    base <= high
  );
}

const toCents = (dollars: number): Cents => Math.round(dollars * 100);

export interface CostBasisInput {
  /** The approved ROM snapshot, or null/absent when there is none (or no loader). */
  romSnapshot?: ApprovedRomSnapshot | null;
  /** The raw P4 `estimates_capacity` capture value ("" when never written). */
  estimateCapture: string;
  /** The delivery model the case is funded on. */
  deliveryModel?: EstimateDeliveryModel | null;
  /** A kernel cost figure, shown only as a superseded cross-check. */
  planningBenchmarkCents?: Cents | null;
}

/** Resolve the cost basis from inputs already read. Pure. */
export function resolveCostBasis(input: CostBasisInput): CostBasis {
  const planningBenchmark = benchmark(input.planningBenchmarkCents);
  const rom = input.romSnapshot;
  if (rom) {
    if (rom.currency !== COST_BASIS_CURRENCY) {
      return blocked("cost_currency_unsupported", planningBenchmark);
    }
    if (!wholeOrderedCents(rom.lowCents, rom.baseCents, rom.highCents)) {
      return blocked("rom_snapshot_unreadable", planningBenchmark);
    }
    return {
      status: "resolved",
      basis: "rom_snapshot",
      source: `rom:${rom.snapshotId}`,
      deliveryModel: null,
      cents: { low: rom.lowCents, base: rom.baseCents, high: rom.highCents },
      planningBenchmark,
    };
  }

  if (input.estimateCapture.trim() === "") {
    return blocked("estimate_absent", planningBenchmark);
  }
  const estimate = evaluateEstimateModel(input.estimateCapture);
  if (!estimate.model) return blocked("estimate_unreadable", planningBenchmark);
  if (!estimate.readyForApproval) {
    return blocked("estimate_not_reviewed", planningBenchmark);
  }
  if (estimate.model.currency !== COST_BASIS_CURRENCY) {
    return blocked("cost_currency_unsupported", planningBenchmark);
  }
  const delivery = input.deliveryModel;
  if (delivery !== "internal" && delivery !== "vendor") {
    return blocked("estimate_delivery_model_unselected", planningBenchmark);
  }
  const total = estimate.totals[delivery];
  return {
    status: "resolved",
    basis: "estimate_model",
    source: `estimate_model:${delivery}`,
    deliveryModel: delivery,
    cents: {
      low: toCents(total.lowCost),
      base: toCents(total.baseCost),
      high: toCents(total.highCost),
    },
    planningBenchmark,
  };
}

/** Read the ROM snapshot through the loader (when one is provided), then resolve. */
export async function loadCostBasis(
  input: Omit<CostBasisInput, "romSnapshot"> & {
    loadApprovedRomSnapshot?: ApprovedRomSnapshotLoader;
  },
): Promise<CostBasis> {
  const romSnapshot = input.loadApprovedRomSnapshot
    ? await input.loadApprovedRomSnapshot()
    : null;
  return resolveCostBasis({ ...input, romSnapshot });
}

/** The engine cost for a basis: its cents, or a cost no resolver answers. */
export function costForBasis(basis: CostBasis): ValueCaseCost {
  if (basis.status === "blocked") {
    return { kind: "rom", snapshotId: UNRESOLVED_COST_BASIS_SNAPSHOT_ID };
  }
  return {
    kind: "estimate",
    lowCents: basis.cents.low,
    baseCents: basis.cents.base,
    highCents: basis.cents.high,
  };
}

/** The case measured against its resolved cost basis. */
export function withCostBasis(model: ValueCase, basis: CostBasis): ValueCase {
  return { ...model, cost: costForBasis(basis) };
}
