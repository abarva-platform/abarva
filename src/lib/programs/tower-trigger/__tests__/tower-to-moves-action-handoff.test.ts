import { runTowerToMovesActionHandoff } from "../tower-to-moves-action-handoff";
import type { StrategicMove } from "@/lib/programs/types.ui";
import type { OutcomeLedgerRow } from "@/lib/tower/outcome-ledger/types";

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  return {
    id: "move-123",
    displayCode: "PHS-M-001",
    name: "Clinical denials baseline recovery",
    tenant: { id: "t1", name: "Meridian Health", industryCode: "HEALTH" },
    charter: null,
    functionPackKey: null,
    archetype: "operational_optimization",
    currentPhase: 3,
    phaseLabel: "P3 Design",
    status: { key: "active", text: "Active", description: "" },
    statusColor: "green",
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "",
    createdAt: "2026-08-01",
    updatedAt: "2026-08-02",
    ...overrides,
  };
}

function makeLedgerRow(
  overrides: Partial<OutcomeLedgerRow> = {},
): OutcomeLedgerRow {
  return {
    id: "ol-123",
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: "meridian-health",
    clientId: "t1",
    subjectKind: "move",
    subjectRef: "move-123",
    subjectLabel: "Clinical denials baseline recovery value proof",
    valueRung: "baseline_pending",
    valueCategory: "cost_avoidance",
    measurementUnit: "usd_seed",
    projectedAmount: 2_400_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: "low",
    governanceReviewStatus: "not_started",
    measurementOwnerRole: "Tower value owner and finance validation partner",
    evidencePointer: "move:move-123:tower_measurement_needed",
    evidenceClaimIds: ["move:move-123:baseline_pending"],
    note: "Next action: instrument baseline before value claim.",
    recordedBy: "ecl_meridian_phs_activation",
    recordedAt: "2026-08-28T12:00:00.000Z",
    ...overrides,
  };
}

describe("runTowerToMovesActionHandoff", () => {
  it("creates an owner-bound Move action from a gated Tower claim", () => {
    const result = runTowerToMovesActionHandoff({
      move: makeMove(),
      outcomeLedgerRow: makeLedgerRow(),
    });

    expect(result.accepted).toBe(true);
    expect(result.seed).not.toBeNull();
    expect(result.seed!.targetMoveId).toBe("move-123");
    expect(result.seed!.ownerRole).toBe(
      "Tower value owner and finance validation partner",
    );
    expect(result.seed!.programWorkItem.title).toBe(
      "Instrument Tower baseline: Clinical denials baseline recovery",
    );
    expect(result.seed!.programWorkItem.moduleKey).toBe("value_proof");
    expect(result.seed!.evidenceNeeded).toContain("baseline_measurement");
    expect(result.seed!.evidenceNeeded).toContain("run_rate_measurement");
  });

  it("is deterministic for the same Move and Tower ledger row", () => {
    const input = {
      move: makeMove(),
      outcomeLedgerRow: makeLedgerRow(),
    };
    const first = runTowerToMovesActionHandoff(input);
    const second = runTowerToMovesActionHandoff(input);

    expect(second).toEqual(first);
  });

  it("refuses rows that do not target the supplied Move", () => {
    const result = runTowerToMovesActionHandoff({
      move: makeMove(),
      outcomeLedgerRow: makeLedgerRow({ subjectRef: "other-move" }),
    });

    expect(result.accepted).toBe(false);
    expect(result.seed).toBeNull();
  });

  it("returns no action when the value claim is measured and approved", () => {
    const result = runTowerToMovesActionHandoff({
      move: makeMove(),
      outcomeLedgerRow: makeLedgerRow({
        baselineAmount: 2_000_000,
        realizedAmount: 2_500_000,
        valueRung: "measured_in_production",
        governanceReviewStatus: "approved",
      }),
    });

    expect(result.accepted).toBe(true);
    expect(result.seed).toBeNull();
    expect(result.reason).toContain("already measured and approved");
  });
});
