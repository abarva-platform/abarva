// Tower -> Moves hand-off adapter.
//
// Pure deterministic contract: turn a Tower outcome-ledger row into the Move
// work item that should be opened or refreshed for the target Move. This names
// the action and the owner; persistence remains the responsibility of the
// governed Moves mutation/data-build path.

import type { OutcomeLedgerRow } from "@/lib/tower/outcome-ledger/types";
import type { StrategicMove } from "@/lib/programs/types.ui";

export type TowerToMovesActionKind =
  | "instrument_baseline"
  | "measure_run_rate"
  | "assign_finance_validation"
  | "resolve_governance_review";

export interface TowerToMovesActionSeedPayload {
  readonly sourceModule: "tower";
  readonly targetModule: "moves";
  readonly actionKind: TowerToMovesActionKind;
  readonly sourceOutcomeLedgerEntryId: string;
  readonly targetMoveId: string;
  readonly targetMoveDisplayCode: string;
  readonly targetMoveName: string;
  readonly ownerRole: string;
  readonly gateReason: string;
  readonly nextGate: string;
  readonly evidenceNeeded: readonly string[];
  readonly programWorkItem: {
    readonly title: string;
    readonly description: string;
    readonly itemType: "task";
    readonly status: "open";
    readonly priority: "critical" | "high" | "medium";
    readonly moduleKey: "value_proof";
    readonly phaseNumber: number;
  };
}

export interface TowerToMovesActionHandoffResult {
  readonly seed: TowerToMovesActionSeedPayload | null;
  readonly accepted: boolean;
  readonly reason: string;
}

function ownerRoleFor(ledger: OutcomeLedgerRow): string {
  return (
    ledger.measurementOwnerRole?.trim() ||
    "Tower value owner and finance validation partner"
  );
}

function evidenceNeededFor(ledger: OutcomeLedgerRow): string[] {
  const evidence = [
    ledger.evidencePointer?.trim(),
    ...ledger.evidenceClaimIds.map((item) => item.trim()),
  ].filter((item): item is string => Boolean(item));
  if (ledger.baselineAmount === null) evidence.unshift("baseline_measurement");
  if (ledger.realizedAmount === null) evidence.unshift("run_rate_measurement");
  if (ledger.governanceReviewStatus !== "approved") {
    evidence.unshift("finance_and_owner_review");
  }
  return [...new Set(evidence)];
}

function actionKindFor(ledger: OutcomeLedgerRow): TowerToMovesActionKind | null {
  if (ledger.governanceReviewStatus === "flagged") {
    return "resolve_governance_review";
  }
  if (ledger.baselineAmount === null) return "instrument_baseline";
  if (ledger.realizedAmount === null) return "measure_run_rate";
  if (ledger.governanceReviewStatus !== "approved") {
    return "assign_finance_validation";
  }
  return null;
}

function priorityFor(
  actionKind: TowerToMovesActionKind,
): TowerToMovesActionSeedPayload["programWorkItem"]["priority"] {
  if (actionKind === "resolve_governance_review") return "critical";
  if (actionKind === "instrument_baseline") return "high";
  return "medium";
}

function labelFor(actionKind: TowerToMovesActionKind): string {
  switch (actionKind) {
    case "resolve_governance_review":
      return "Resolve Tower governance review";
    case "instrument_baseline":
      return "Instrument Tower baseline";
    case "measure_run_rate":
      return "Measure Tower run-rate";
    case "assign_finance_validation":
      return "Assign finance validation";
  }
}

function nextGateFor(actionKind: TowerToMovesActionKind): string {
  switch (actionKind) {
    case "resolve_governance_review":
      return "governance_review_clearance";
    case "instrument_baseline":
      return "baseline_measurement";
    case "measure_run_rate":
      return "run_rate_measurement";
    case "assign_finance_validation":
      return "finance_validation";
  }
}

export function runTowerToMovesActionHandoff(input: {
  readonly move: StrategicMove;
  readonly outcomeLedgerRow: OutcomeLedgerRow;
}): TowerToMovesActionHandoffResult {
  const { move, outcomeLedgerRow: ledger } = input;
  if (ledger.subjectKind !== "move" || ledger.subjectRef !== move.id) {
    return {
      seed: null,
      accepted: false,
      reason: "Outcome-ledger row does not target the supplied Move.",
    };
  }

  const actionKind = actionKindFor(ledger);
  if (!actionKind) {
    return {
      seed: null,
      accepted: true,
      reason: "Tower outcome-ledger row is already measured and approved.",
    };
  }

  const ownerRole = ownerRoleFor(ledger);
  const evidenceNeeded = evidenceNeededFor(ledger);
  const label = labelFor(actionKind);
  const nextGate = nextGateFor(actionKind);
  const gateReason =
    ledger.note?.trim() ||
    `Tower value state is ${ledger.valueRung.replace(/_/g, " ")}.`;

  const seed: TowerToMovesActionSeedPayload = {
    sourceModule: "tower",
    targetModule: "moves",
    actionKind,
    sourceOutcomeLedgerEntryId: ledger.id,
    targetMoveId: move.id,
    targetMoveDisplayCode: move.displayCode,
    targetMoveName: move.name,
    ownerRole,
    gateReason,
    nextGate,
    evidenceNeeded,
    programWorkItem: {
      title: `${label}: ${move.name}`,
      description: `${gateReason} Owner: ${ownerRole}. Evidence needed: ${evidenceNeeded.join(
        ", ",
      )}.`,
      itemType: "task",
      status: "open",
      priority: priorityFor(actionKind),
      moduleKey: "value_proof",
      phaseNumber: Math.max(0, Math.min(5, move.currentPhase)),
    },
  };

  return {
    seed,
    accepted: true,
    reason: "Tower named an owner-bound Move work item.",
  };
}
