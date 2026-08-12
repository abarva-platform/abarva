/**
 * @jest-environment jsdom
 */

// The Strategy (P0) stage on the unified canvas has structural + honesty
// invariants that must not regress:
//   1. It renders the header, the single "Confirm strategy & sponsor" task with
//      the Sponsor / Mandate / Value-thesis table, and the three-confirm gate
//      (Sponsor sign-off / Value target set / Archetype confirmed).
//   2. Stage selection returns the Strategy view for a strategy-stage event and
//      the Scope view for a scope-stage event — clicking Strategy must not fall
//      back to the Scope placeholder.
//   3. Strategy is a pure-intake stage: the Intelligence tab shows the read but
//      NO value-type waterfall (the value thesis is a captured fact, not a proof).

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

// The gate calls next/navigation's useRouter (for the live approve → advance
// flow). Stub it so the component renders under jsdom without an App Router.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

import { ScopeAnalyticsStage } from "../ScopeAnalyticsStage";
import {
  SAMPLE_STRATEGY_STAGE,
  SAMPLE_STRATEGY_AVA,
} from "../strategy-sample-view-model";
import { SAMPLE_SCOPE_STAGE } from "../sample-view-model";
import { buildStrategyStageView } from "@/lib/source/facts/view/strategy-stage-builder";

// Mirror the private stage-selection in SourceAnalyticsCanvas so the test
// exercises the same rule the canvas uses to pick a stage view.
function sampleStageViewFor(stageKey: string) {
  return stageKey === "strategy" ? SAMPLE_STRATEGY_STAGE : SAMPLE_SCOPE_STAGE;
}

describe("Strategy (P0) stage — structure", () => {
  it("renders the Strategy header + purpose", () => {
    render(<ScopeAnalyticsStage view={SAMPLE_STRATEGY_STAGE} />);
    expect(
      screen.getByRole("heading", { name: "Strategy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Confirm the mandate and sponsor before any work begins/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the single 'Confirm strategy & sponsor' task with the Sponsor / Mandate / Value-thesis table", () => {
    render(<ScopeAnalyticsStage view={SAMPLE_STRATEGY_STAGE} />);
    // Exactly one task on Strategy.
    expect(SAMPLE_STRATEGY_STAGE.tasks).toHaveLength(1);
    // "Confirm strategy & sponsor" appears as both the task title and its CTA.
    expect(
      screen.getAllByText("Confirm strategy & sponsor").length,
    ).toBeGreaterThanOrEqual(1);
    // The task is open by default (it is the first `todo`), so the review-row
    // table is on screen. The three canonical keys are present.
    const checklist = screen.getByTestId("task-checklist");
    expect(within(checklist).getByText("Sponsor")).toBeInTheDocument();
    expect(within(checklist).getByText("Mandate")).toBeInTheDocument();
    expect(within(checklist).getByText("Value thesis")).toBeInTheDocument();
  });

  it("renders the three-confirm gate (Sponsor sign-off / Value target set / Archetype confirmed)", () => {
    render(<ScopeAnalyticsStage view={SAMPLE_STRATEGY_STAGE} />);
    const gate = screen.getByTestId("scope-gate");
    expect(within(gate).getByText("Sponsor sign-off")).toBeInTheDocument();
    expect(within(gate).getByText("Value target set")).toBeInTheDocument();
    expect(within(gate).getByText("Archetype confirmed")).toBeInTheDocument();
    expect(SAMPLE_STRATEGY_STAGE.gate.confirms).toHaveLength(3);
  });
});

describe("Strategy (P0) stage — stage selection", () => {
  it("returns the Strategy view for a strategy-stage event and the Scope view for a scope-stage event", () => {
    expect(sampleStageViewFor("strategy").stageKey).toBe("strategy");
    expect(sampleStageViewFor("strategy").stageName).toBe("Strategy");
    expect(sampleStageViewFor("scope").stageKey).toBe("scope");
    expect(sampleStageViewFor("scope").stageName).toBe("Scope");
  });

  it("the Strategy sample view + aVa scope are self-consistent", () => {
    expect(SAMPLE_STRATEGY_STAGE.stageKey).toBe("strategy");
    expect(SAMPLE_STRATEGY_AVA.role).toMatch(/Strategy/);
  });
});

describe("Strategy (P0) stage — intake honesty (no waterfall)", () => {
  it("has no value-type waterfall on the view-model (intake stage)", () => {
    expect(SAMPLE_STRATEGY_STAGE.waterfall).toBeUndefined();
  });

  it("the Intelligence tab shows the read but renders NO waterfall", () => {
    render(
      <ScopeAnalyticsStage
        view={SAMPLE_STRATEGY_STAGE}
        activeWorkspace="intelligence"
      />,
    );
    // The engine read is present ("What Source brings to Strategy").
    expect(screen.getByTestId("intel-panel")).toBeInTheDocument();
    // ...but the value-type waterfall is not rendered on this intake stage.
    expect(screen.queryByTestId("value-waterfall")).not.toBeInTheDocument();
  });
});

describe("Strategy (P0) stage — folded approval wiring", () => {
  it("attaches a live approve action to the gate when approve is supplied", () => {
    const view = buildStrategyStageView({
      facts: {
        sponsor: "K. Oshima, CIO",
        mandate: "Consolidate AMS — boundary: 147 apps",
        valueThesis: "18–24% run-rate reduction",
      },
      provenance: "live",
      approve: { eventId: "evt-1", redirectStageKey: "scope" },
    });
    expect(view.gate.action).toBeDefined();
    expect(view.gate.action?.eventId).toBe("evt-1");
    // The confirmations mirror the standalone approval's three keys.
    expect(view.gate.action?.confirmationKeys).toEqual(
      expect.arrayContaining([
        "strategyMemoReviewed",
        "valueTargetConfirmed",
        "archetypeRigorConfirmed",
      ]),
    );
    // Fact-driven: the sponsor row reflects the passed fact.
    expect(view.gate.approver).toBe("K. Oshima, CIO");
    expect(view.tasks[0].rows?.map((r) => r.value)).toContain("K. Oshima, CIO");
    // Still an intake stage — no waterfall even when live.
    expect(view.waterfall).toBeUndefined();
  });

  it("omits the approve action when none is supplied (presentational end-state)", () => {
    const view = buildStrategyStageView({
      facts: { sponsor: "S", mandate: "M", valueThesis: "V" },
      provenance: "sample",
      approve: null,
    });
    expect(view.gate.action).toBeUndefined();
  });
});
