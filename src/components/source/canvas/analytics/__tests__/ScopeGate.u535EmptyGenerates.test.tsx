/**
 * @jest-environment jsdom
 */

/**
 * Item U-535 — the gate's "Prepared for approval" box when the derived
 * `generates` list is legitimately EMPTY.
 *
 * WHAT THIS SUITE COVERS, AND WHAT IT DELIBERATELY DOES NOT CLAIM.
 * `ScopeGate` is mounted by `ScopeAnalyticsStage`, which is imported by the
 * analytics barrel and by tests and BY NO ROUTE. That was verified rather than
 * inherited: two cases first written against `SourceAnalyticsCanvas` failed
 * because the canvas never renders this component, which is the same asymmetry
 * `docs/architecture/u533-stage-scaffold-provenance.json` records when it lists
 * `gate.generates` as reaching `model_prompt` and not `rendered_canvas`.
 *
 * So the item's acceptance (7) — "an empty generates section is a visible
 * regression" — is NOT true of today's product: no signed-in reader can reach
 * this section at all. These cases therefore mount the component DIRECTLY and
 * prove a property of the component, not of any page. Nothing here is evidence
 * that a user sees anything, and no signed-in claim is made.
 *
 * It is still worth fixing and worth pinning. Backlog item 28 is open on Source
 * components unreachable from any route, with "mount or delete" as its
 * acceptance; if this one is mounted, the empty box ships on the first stage
 * whose archetype declares no deliverable, and that is now the majority of them.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

// The gate calls next/navigation's useRouter for the live approve → advance
// flow. Stub it so the component renders under jsdom without an App Router.
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

import { ScopeGate } from "../ScopeGate";
import { SAMPLE_EVALUATION_STAGE } from "../sample-view-model";
import { buildLiveStageView } from "@/lib/source/facts/view/stage-analytics-builder";
import { getSourceArchetype } from "@/lib/source/archetypes/registry";
import type { StageAnalyticsView } from "../view-model";

const ARCHETYPE_ID = "AMS_MANAGED_SERVICES";

/** Facts for the archetype's first lever rule, read off the rule, never typed. */
const LIVE_INPUTS: Record<string, number> = (() => {
  const rules = getSourceArchetype(ARCHETYPE_ID)!.valueLeverRules ?? [];
  const bag: Record<string, number> = {};
  for (const spec of rules[0]?.computation.inputs ?? []) {
    bag[spec.key] =
      spec.unit === "pct" ? 20 : spec.unit === "count" ? 3 : 1_000_000;
  }
  return bag;
})();

function buildFor(stageKey: string): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs: LIVE_INPUTS,
    citations: {},
    archetypeId: ARCHETYPE_ID,
    stageKey,
  });
  if (!view) throw new Error(`no live view for stage ${stageKey}`);
  return view;
}

/**
 * The two subjects, SEARCHED rather than named, over the stages whose intake
 * beats the builder reports derived. If an archetype ever declares a deliverable
 * at every derived stage, the empty branch has no subject and the population case
 * below says so instead of this suite passing about a branch nothing reaches.
 */
const DERIVED_STAGE_KEYS = [
  "scope",
  "rfp",
  "responses",
  "evaluation",
  "pricing",
  "bafo",
  "executive_decision",
  "selection",
  "transition",
  "value",
].filter((stageKey) => buildFor(stageKey).beatProvenance?.gate === "fact_derived");

const EMPTY_GENERATES_STAGE = DERIVED_STAGE_KEYS.find(
  (stageKey) => buildFor(stageKey).gate.generates.length === 0,
);
const FULL_GENERATES_STAGE = DERIVED_STAGE_KEYS.find(
  (stageKey) => buildFor(stageKey).gate.generates.length > 0,
);

function renderGate(stageKey: string) {
  const view = buildFor(stageKey);
  render(<ScopeGate gate={view.gate} stageName={view.stageName} />);
  return view;
}

describe("U-535 · ScopeGate's prepared-for-approval box, mounted directly", () => {
  it("has a derived stage on EACH branch, so neither case is vacuous", () => {
    expect(DERIVED_STAGE_KEYS.length).toBeGreaterThan(1);
    expect(EMPTY_GENERATES_STAGE).toBeDefined();
    expect(FULL_GENERATES_STAGE).toBeDefined();
  });

  it("states the absence rather than drawing an empty box", () => {
    renderGate(EMPTY_GENERATES_STAGE!);

    expect(
      screen.getByText(/No deliverable is declared for this stage/i),
    ).toBeInTheDocument();

    // The footer promising that "these are prepared automatically" must not
    // render with nothing above it to refer to.
    expect(screen.queryByText(/Nothing is generated yet/)).not.toBeInTheDocument();

    // And the exemplar's own deliverable — what a backfill would have shown — is
    // absent. Read off the exemplar rather than typed, so re-labelling it cannot
    // leave this green against a string nothing emits.
    for (const deliverable of SAMPLE_EVALUATION_STAGE.gate.generates) {
      expect(screen.queryByText(deliverable.label)).not.toBeInTheDocument();
    }
  });

  it("still lists the deliverables on a derived stage that declares them", () => {
    // The other branch, so the empty state cannot have been implemented by
    // suppressing the list everywhere.
    const view = renderGate(FULL_GENERATES_STAGE!);
    expect(view.gate.generates.length).toBeGreaterThan(0);
    for (const deliverable of view.gate.generates) {
      expect(screen.getByText(deliverable.label)).toBeInTheDocument();
    }
    expect(screen.getByText(/Nothing is generated yet/)).toBeInTheDocument();
    expect(
      screen.queryByText(/No deliverable is declared for this stage/i),
    ).not.toBeInTheDocument();
  });

  it("keeps the section heading on both branches", () => {
    // The absence is stated INSIDE the section, not by deleting it: a reader who
    // has learned where this box sits should still find it, reading that nothing
    // is declared rather than finding the box gone.
    for (const stageKey of [EMPTY_GENERATES_STAGE!, FULL_GENERATES_STAGE!]) {
      const { unmount } = render(
        <ScopeGate
          gate={buildFor(stageKey).gate}
          stageName={buildFor(stageKey).stageName}
        />,
      );
      expect(screen.getByText("Prepared for approval")).toBeInTheDocument();
      unmount();
    }
  });
});
