// ITEM U-406 (the claimable half of U-543 half (2)).
//
// Every non-final Source stage gate answers one question: what does approval
// advance to? The FINAL stage in `SOURCE_STAGE_ORDER` has no answer, and until
// this suite existed nothing in code said what it says instead. Five consumers
// each re-derived "is this the last stage?" on their own -- `ScopeGate` from
// `gate.nextStageName === null`, `StageAdvanceButton` and
// `SourceStageCanvasPanel` from an index into the order, `mode-grounding` from
// the same nullable label, and `module-expert` from `nextSourceStage` with a
// FALLBACK to that label. The fallback fires only when the stage is terminal,
// which is exactly when the exemplar's invented target (`'Closed'` -- not a
// stage key, not in `SOURCE_STAGE_ORDER`, not producible by `nextSourceStage`)
// is the value it reads.
//
// So this suite asserts a stated contract, and asserts it at the two
// destinations U-533 established consume a stage view independently: the model
// (grounding block, module-expert packet) and the canvas.
//
// Red-first, against the copy on `origin/main` fc5cb87d28.

import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
  nextSourceStage,
} from "@/lib/source/constants";
import {
  SOURCE_TERMINAL_GATE_CONTRACT,
  TERMINAL_SOURCE_STAGE_KEY,
  isTerminalSourceStage,
  withTerminalGateContract,
} from "@/lib/source/stage-terminal-contract";
import { buildModeGrounding } from "@/lib/source/ava/mode-grounding";
import { buildSourceAvaChatPacket } from "@/lib/source/ava/module-expert";
import { buildLiveStageView } from "@/lib/source/facts/view/stage-analytics-builder";
import {
  adaptStageViewToSourceJourney,
  getSourceJourneyForEvent,
} from "@/lib/source/sourcing-motion-journeys";
import {
  SAMPLE_BAFO_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
} from "@/components/source/canvas/analytics/sample-view-model";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";

const EVENT = {
  code: "SRC-AMS-2026-001",
  name: "Lakeshore AMS Consolidation",
  currentStageKey: TERMINAL_SOURCE_STAGE_KEY,
  blocker: null,
  nextAction: null,
};

/**
 * The terminal stage's view as a consumer could receive it TODAY: the exemplar
 * gate, unadapted, carrying `'Closed'`. This is not a hypothetical -- it is
 * `SAMPLE_VALUE_STAGE` verbatim, which `sampleStageViewFor` returns unchanged
 * whenever no journey is supplied, because `adaptStageViewToSourceJourney`
 * returns its input early in that case.
 */
function terminalViewCarryingAnOnwardTarget(): StageAnalyticsView {
  return {
    ...SAMPLE_VALUE_STAGE,
    gate: { ...SAMPLE_VALUE_STAGE.gate, nextStageName: "Closed" },
  };
}

describe("the terminal Source stage gate contract is stated in code", () => {
  it("names the terminal stage from the canonical order rather than a second hand-typed key", () => {
    expect(TERMINAL_SOURCE_STAGE_KEY).toBe(
      SOURCE_STAGE_ORDER[SOURCE_STAGE_ORDER.length - 1],
    );
    // The definition of terminal, restated through the progression function the
    // approval decision and the rail already share.
    expect(nextSourceStage(TERMINAL_SOURCE_STAGE_KEY)).toBeNull();
  });

  it("declares a completion/review decision with a terminal outcome and no onward target", () => {
    expect(SOURCE_TERMINAL_GATE_CONTRACT.stageKey).toBe(
      TERMINAL_SOURCE_STAGE_KEY,
    );
    expect(SOURCE_TERMINAL_GATE_CONTRACT.decisionKind).toBe(
      "completion_review",
    );
    expect(SOURCE_TERMINAL_GATE_CONTRACT.outcome).toBe("event_closed");
    expect(SOURCE_TERMINAL_GATE_CONTRACT.nextStageName).toBeNull();
    // The contract's own prose must not carry advance language, because the
    // whole point of stating it is that "approve and advance to ..." has no
    // referent here.
    const prose = [
      SOURCE_TERMINAL_GATE_CONTRACT.decisionLabel,
      SOURCE_TERMINAL_GATE_CONTRACT.outcomeSentence,
      SOURCE_TERMINAL_GATE_CONTRACT.gateSummarySentence,
    ].join(" ");
    expect(prose).not.toMatch(/advance/i);
    expect(prose).not.toMatch(/next stage/i);
  });

  it("recognises the terminal stage through its legacy alias, not only its canonical key", () => {
    expect(isTerminalSourceStage(TERMINAL_SOURCE_STAGE_KEY)).toBe(true);
    // `value_realization` is the persisted legacy alias for the same stage.
    expect(isTerminalSourceStage("value_realization")).toBe(true);
    expect(isTerminalSourceStage("scope")).toBe(false);
    expect(isTerminalSourceStage(null)).toBe(false);
    expect(isTerminalSourceStage("not_a_stage")).toBe(false);
  });

  it("strips an onward target from a terminal gate and leaves every other stage alone", () => {
    // The approver is read off the exemplar rather than typed here: the point of
    // U-543 half (1) was that the fixture's person-named approver must not
    // spread, and a literal copy of it in a test is one more place it lives.
    const exemplarApprover = SAMPLE_VALUE_STAGE.gate.approver;
    const poisoned = {
      approver: exemplarApprover,
      nextStageName: "Closed",
    };
    const terminal = withTerminalGateContract(
      poisoned,
      TERMINAL_SOURCE_STAGE_KEY,
    );
    expect(terminal.nextStageName).toBeNull();
    expect(terminal.approver).toBe(
      SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    );
    // The mutation that matters: the role must have REPLACED something, or this
    // case would pass against an exemplar that already carried the role.
    expect(exemplarApprover).not.toBe(
      SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    );

    const midStage = withTerminalGateContract({ ...poisoned }, "scope");
    expect(midStage.nextStageName).toBe("Closed");
    expect(midStage.approver).toBe(exemplarApprover);
  });
});

describe("no exemplar gate asserts an onward target that is not a stage", () => {
  /**
   * The general invariant, not a single-stage assertion: an exemplar may name
   * the next stage, but only by a label the canonical order actually produces.
   * `'Closed'` passed for months because nothing checked the label against the
   * order it claims to come from.
   */
  const KNOWN_STAGE_LABELS = new Set(Object.values(SOURCE_STAGE_LABELS));
  const EXEMPLARS: readonly (readonly [string, StageAnalyticsView])[] = [
    ["scope", SAMPLE_SCOPE_STAGE],
    ["rfp", SAMPLE_RFP_STAGE],
    ["responses", SAMPLE_RESPONSES_STAGE],
    ["evaluation", SAMPLE_EVALUATION_STAGE],
    ["pricing", SAMPLE_PRICING_STAGE],
    ["bafo", SAMPLE_BAFO_STAGE],
    ["executive_decision", SAMPLE_EXECUTIVE_DECISION_STAGE],
    ["selection", SAMPLE_SELECTION_STAGE],
    ["transition", SAMPLE_TRANSITION_STAGE],
    ["value", SAMPLE_VALUE_STAGE],
  ];

  it.each(EXEMPLARS)(
    "%s names a real stage label or none at all",
    (_stageKey, exemplar) => {
      const label = exemplar.gate.nextStageName;
      if (label === null) return;
      expect(KNOWN_STAGE_LABELS.has(label)).toBe(true);
    },
  );

  it("leaves the terminal exemplar with no onward target", () => {
    expect(SAMPLE_VALUE_STAGE.gate.nextStageName).toBeNull();
  });
});

describe("the model's two grounding destinations honour the contract", () => {
  it("module-expert reports no next stage for a terminal stage even when the view carries one", () => {
    const packet = buildSourceAvaChatPacket(
      {
        tenant: "Demo Tenant",
        event: EVENT,
        viewStageKey: TERMINAL_SOURCE_STAGE_KEY,
        stageView: terminalViewCarryingAnOnwardTarget(),
        factInputs: {},
        artifacts: [],
        approvedStageKeys: [],
      },
      "What does this gate approve?",
    );

    expect(packet.stageGate).not.toBeNull();
    expect(packet.stageGate?.nextStageLabel).toBeNull();
    expect(packet.stageGate?.gateDecisionKind).toBe("completion_review");
  });

  it("the stage-gate grounding block states the terminal outcome and names no onward stage", () => {
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: EVENT,
      viewStageKey: TERMINAL_SOURCE_STAGE_KEY,
      stageView: terminalViewCarryingAnOnwardTarget(),
    });

    expect(result.block).toContain(
      SOURCE_TERMINAL_GATE_CONTRACT.groundingSentence,
    );
    expect(result.block).not.toContain("Next stage on approval");
    expect(result.block).not.toContain("Closed");
    expect(result.quotableFacts.gateDecisionKind).toBe("completion_review");
  });

  it("still names the next stage on a non-terminal gate", () => {
    const result = buildModeGrounding({
      mode: "stage_gate",
      event: { ...EVENT, currentStageKey: "rfp" },
      viewStageKey: "rfp",
      stageView: SAMPLE_RFP_STAGE,
    });
    expect(result.block).toContain("Next stage on approval:");
    expect(result.quotableFacts.gateDecisionKind).toBe("advance");
  });
});

describe("the journey funnel every stage view passes through enforces the contract", () => {
  it("strips an onward target from a terminal view even with no journey to adapt to", () => {
    // The exact hole: with no journey this function used to return its input
    // untouched, so exemplar copy reached the canvas and the grounding block.
    const adapted = adaptStageViewToSourceJourney(
      terminalViewCarryingAnOnwardTarget(),
      null,
    );
    expect(adapted.gate.nextStageName).toBeNull();
    expect(adapted.gate.approver).toBe(
      SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    );
  });

  it("leaves a non-terminal view's onward target alone when there is no journey", () => {
    const adapted = adaptStageViewToSourceJourney(SAMPLE_RFP_STAGE, null);
    expect(adapted.gate.nextStageName).toBe(
      SAMPLE_RFP_STAGE.gate.nextStageName,
    );
    expect(adapted.gate.approver).toBe(SAMPLE_RFP_STAGE.gate.approver);
  });

  it("strips it on the journey path too, where the label is recomputed", () => {
    const journey = getSourceJourneyForEvent({ eventName: "Competitive RFP" });
    const adapted = adaptStageViewToSourceJourney(
      terminalViewCarryingAnOnwardTarget(),
      journey,
    );
    expect(adapted.gate.nextStageName).toBeNull();
    expect(adapted.gate.approver).toBe(
      SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    );
  });
});

describe("the live builder cannot emit an onward target for the terminal stage", () => {
  it("builds the terminal gate with no next stage and the contract's approver role", () => {
    const view = buildLiveStageView({
      // The same fact bag the U-533 provenance suite uses to get a live view at
      // all: one quantified AMS lever, so the builder does not return null.
      inputs: {
        annual_change_order_spend: 1_000_000,
        recurring_avoidable_pct: 20,
        term_years: 3,
      },
      citations: {
        annual_change_order_spend: {
          doc: "Incumbent AMS contract",
          locator: "Exhibit C",
        },
        recurring_avoidable_pct: {
          doc: "ServiceNow export",
          locator: "recurring share",
        },
        term_years: { doc: "Vendor proposal", locator: "term" },
      },
      archetypeId: "AMS_MANAGED_SERVICES",
      baselineLabel: "Value at stake (event estimate)",
      baselineAmount: 14_000_000,
      stageKey: TERMINAL_SOURCE_STAGE_KEY,
    });

    // A null view means the facts were too thin to compute a lever; the contract
    // claim below is only meaningful when a view was actually produced.
    expect(view).not.toBeNull();
    expect(view?.gate.nextStageName).toBeNull();
    expect(view?.gate.approver).toBe(
      SOURCE_TERMINAL_GATE_CONTRACT.approverRole,
    );
  });
});
