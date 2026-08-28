// Cross-module decision trace · Wave 5, Slice 5.4 · unit tests.
//
// `buildCrossModuleTrace` is a pure ID-join over a Move, the tenant's
// Source events, and the tenant's outcome-ledger entries. These tests
// verify:
//   • the trace always has one step per surface, in loop order
//   • a wired hand-off renders `linked` with the joined id + href
//   • an unwired hand-off renders `not_yet_linked` with a gap ref and
//     never fabricates a join id or href
//   • the coherence verdict reads only the cross-module hand-offs
//   • the Move step is always the linked anchor

import {
  buildCrossModuleTrace,
  TRACE_MODULES,
  type TraceSourceEvent,
} from "../cross-module-trace-view";
import type { StrategicMove } from "../types.ui";
import type { OutcomeLedgerRow } from "@/lib/tower/outcome-ledger/types";
import { buildControlEvalMatrix } from "../controls/control-eval-matrix";
import { getSolutionArchetype } from "../taxonomy/solution-archetype-taxonomy";

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  return {
    id: "move-1",
    displayCode: "APX-CC-2026",
    name: "Contact Center AI Routing",
    tenant: { id: "t1", name: "Apex Retail", industryCode: "retail" },
    charter: null,
    functionPackKey: null,
    archetype: "process_automation",
    currentPhase: 3,
    phaseLabel: "P3 Design",
    status: { key: "on_track", text: "On track", description: "" },
    statusColor: "green",
    sponsor: null,
    participants: [],
    valueAtStake: { projected: null, verified: null, assumptions: null },
    deliverables: [],
    gateCriteria: [],
    recentActivity: [],
    linkedEvidence: [],
    mapLabel: "",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-02",
    ...overrides,
  };
}

function makeSourceEvent(
  overrides: Partial<TraceSourceEvent> = {},
): TraceSourceEvent {
  return {
    id: "evt-1",
    code: "APX-SRC-01",
    name: "Contact Centre Sourcing",
    currentStageLabel: "Strategy",
    statusLabel: "Active",
    nextAction: "Open event canvas",
    linkedProgramId: null,
    ...overrides,
  };
}

function makeLedgerRow(
  overrides: Partial<OutcomeLedgerRow> = {},
): OutcomeLedgerRow {
  return {
    id: "led-1",
    supersedesEntryId: null,
    isCurrent: true,
    tenantClientKey: "apexretail",
    clientId: "t1",
    subjectKind: "move",
    subjectRef: "move-1",
    subjectLabel: "Contact Center AI Routing — value",
    valueRung: "projected_only",
    valueCategory: "productivity",
    measurementUnit: "usd_seed",
    projectedAmount: 1_000_000,
    realizedAmount: null,
    baselineAmount: null,
    counterfactualConfidence: "low",
    governanceReviewStatus: "not_started",
    measurementOwnerRole: null,
    evidencePointer: null,
    evidenceClaimIds: [],
    note: null,
    recordedBy: null,
    recordedAt: "2026-02-01",
    ...overrides,
  };
}

describe("buildCrossModuleTrace", () => {
  it("emits one step per surface in loop order", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [],
      outcomeEntries: [],
    });
    expect(trace.steps.map((s) => s.module)).toEqual([...TRACE_MODULES]);
  });

  it("always renders the Move step as the linked anchor", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [],
      outcomeEntries: [],
    });
    const moveStep = trace.steps.find((s) => s.module === "move")!;
    expect(moveStep.linkState).toBe("linked");
    expect(moveStep.joinId).toBe("move-1");
    expect(moveStep.href).toBe("/strategic-moves/move-1");
  });

  it("marks all cross-module hand-offs unwired when no links exist", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [],
      outcomeEntries: [],
    });
    expect(trace.coherence).toBe("unwired");
    expect(trace.linkedCount).toBe(1); // only the Move anchor
    expect(trace.unlinkedCount).toBe(3);
    expect(trace.steps.find((s) => s.module === "source")?.detail).toContain(
      "sourcing workflow activation is not configured for this demo Move",
    );
    expect(trace.steps.find((s) => s.module === "tower")?.detail).toContain(
      "live Tower tracking activation is not configured for this demo Move",
    );
    for (const step of trace.steps) {
      if (step.module === "move") continue;
      expect(step.linkState).toBe("not_yet_linked");
      expect(step.joinId).toBeNull();
      expect(step.href).toBeNull();
      expect(step.gapRef).not.toBeNull();
    }
  });

  it("links the Source step on linkedProgramId === move.id", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [makeSourceEvent({ linkedProgramId: "move-1" })],
      outcomeEntries: [],
    });
    const sourceStep = trace.steps.find((s) => s.module === "source")!;
    expect(sourceStep.linkState).toBe("linked");
    expect(sourceStep.joinId).toBe("evt-1");
    expect(sourceStep.href).toBe("/source/events/evt-1");
  });

  it("does not link a Source event for a different Move", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [makeSourceEvent({ linkedProgramId: "other-move" })],
      outcomeEntries: [],
    });
    const sourceStep = trace.steps.find((s) => s.module === "source")!;
    expect(sourceStep.linkState).toBe("not_yet_linked");
    expect(sourceStep.gapRef).toBe("GAP-2 / GAP-3");
  });

  it("links the Tower step on a move-subject ledger entry", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [],
      outcomeEntries: [
        makeLedgerRow({
          note: "Next action: instrument baseline before value claim.",
        }),
      ],
    });
    const towerStep = trace.steps.find((s) => s.module === 'tower')!;
    expect(towerStep.linkState).toBe('linked');
    expect(towerStep.joinId).toBe('led-1');
    expect(towerStep.href).toBe('/tower');
    expect(towerStep.detail).toContain("Next action: instrument baseline");
    expect(towerStep.detail).toContain(
      "Move action: Instrument Tower baseline: Contact Center AI Routing",
    );
    expect(towerStep.detail).toContain("Owner: Tower value owner");
  });

  it("ignores ledger entries for other subjects", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [],
      outcomeEntries: [
        makeLedgerRow({ subjectKind: "source_event", subjectRef: "move-1" }),
        makeLedgerRow({ subjectRef: "other-move" }),
      ],
    });
    const towerStep = trace.steps.find((s) => s.module === "tower")!;
    expect(towerStep.linkState).toBe("not_yet_linked");
  });

  it("links the Intelligence step from bet-anchored evidence", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        linkedEvidence: [
          {
            id: "ev-9",
            anchor: "Pattern: contact-centre AI routing",
            summary: "Pressure-tested bet brief",
            url: "/intelligence/patterns/p-9",
          },
        ],
      }),
      sourceEvents: [],
      outcomeEntries: [],
    });
    const intel = trace.steps.find((s) => s.module === "intelligence")!;
    expect(intel.linkState).toBe("linked");
    expect(intel.joinId).toBe("ev-9");
    expect(intel.href).toBe("/intelligence/patterns/p-9");
  });

  it("reports coherent when every cross-module hand-off is wired", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        linkedEvidence: [
          { id: "ev-9", anchor: "Bet brief", summary: "pattern", url: "/x" },
        ],
      }),
      sourceEvents: [makeSourceEvent({ linkedProgramId: "move-1" })],
      outcomeEntries: [makeLedgerRow()],
    });
    expect(trace.coherence).toBe("coherent");
    expect(trace.linkedCount).toBe(4);
    expect(trace.unlinkedCount).toBe(0);
  });

  it("reports partial when only some hand-offs are wired", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove(),
      sourceEvents: [makeSourceEvent({ linkedProgramId: "move-1" })],
      outcomeEntries: [],
    });
    expect(trace.coherence).toBe("partial");
  });
});

describe("buildCrossModuleTrace — SR 11-7 regulatory deliverable (GAP-3)", () => {
  const regulatedMatrix = buildControlEvalMatrix(
    getSolutionArchetype("human_in_loop_agent"),
    { handlesSensitiveData: true, highStakesDecision: true },
  );

  it("surfaces the SR 11-7 control deliverable on the Move step for a regulated tenant", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        tenant: { id: "t1", name: "First Capital", industryCode: "FINSERV" },
      }),
      sourceEvents: [],
      outcomeEntries: [],
      controlMatrix: regulatedMatrix,
    });
    const moveStep = trace.steps.find((s) => s.module === "move")!;
    expect(moveStep.regulatoryDeliverable).not.toBeNull();
    expect(moveStep.regulatoryDeliverable!.typeKey).toBe(
      "sr_11_7_control_matrix",
    );
    expect(moveStep.regulatoryDeliverable!.lines.map((l) => l.key)).toEqual([
      "model_validation",
      "ongoing_monitoring",
      "governance",
    ]);
    // The deliverable readiness is echoed into the Move step detail.
    expect(moveStep.detail).toContain("SR 11-7");
  });

  it("does not surface the deliverable for a non-regulated tenant even when a matrix is supplied", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        tenant: { id: "t1", name: "Apex Retail", industryCode: "RETAIL" },
      }),
      sourceEvents: [],
      outcomeEntries: [],
      controlMatrix: regulatedMatrix,
    });
    const moveStep = trace.steps.find((s) => s.module === "move")!;
    expect(moveStep.regulatoryDeliverable).toBeNull();
    expect(moveStep.detail).not.toContain("SR 11-7");
  });

  it("does not surface the deliverable for a regulated tenant when no matrix is supplied", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        tenant: { id: "t1", name: "First Capital", industryCode: "FINSERV" },
      }),
      sourceEvents: [],
      outcomeEntries: [],
    });
    const moveStep = trace.steps.find((s) => s.module === "move")!;
    expect(moveStep.regulatoryDeliverable).toBeNull();
  });

  it("leaves every non-Move step with a null regulatory deliverable", () => {
    const trace = buildCrossModuleTrace({
      move: makeMove({
        tenant: { id: "t1", name: "First Capital", industryCode: "FINSERV" },
      }),
      sourceEvents: [],
      outcomeEntries: [],
      controlMatrix: regulatedMatrix,
    });
    for (const step of trace.steps) {
      if (step.module === "move") continue;
      expect(step.regulatoryDeliverable).toBeNull();
    }
  });
});
