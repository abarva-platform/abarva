/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { MovesCaptureFlow } from "../MovesCaptureFlow";
import type { MovesCaptureFlowPhase } from "../MovesCaptureFlow";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

/**
 * P3 Design on a CONFIRMED solution route.
 *
 * `getPhaseCaptureSections(3, route)` re-shapes the phase's question set once
 * P2 confirms the route, and the flow resolves its 3-step grouping from the
 * sections it is handed. These cases pin the HOST end of that: the route's own
 * required questions are really mounted on the screen, which is what the
 * grouping module alone cannot prove.
 */

const PHASES: MovesCaptureFlowPhase[] = [
  { phase: 0, code: "P0", name: "Originate", answered: 11, total: 11, reachable: true },
  { phase: 1, code: "P1", name: "Charter", answered: 7, total: 7, reachable: true },
  { phase: 2, code: "P2", name: "Discover", answered: 8, total: 8, reachable: true },
  { phase: 3, code: "P3", name: "Design", answered: 0, total: 6, reachable: true },
  { phase: 4, code: "P4", name: "Roadmap", answered: 0, total: 7, reachable: false },
  { phase: 5, code: "P5", name: "Mobilize", answered: 0, total: 7, reachable: false },
];

const route = (over: Partial<ConfirmedSolutionRoute>): ConfirmedSolutionRoute => ({
  route: "technical_product",
  recommendation: "technical_product",
  solutionOutput: "data_product",
  workflowChange: "none",
  roleAccountabilityChange: "none",
  adoptionOwner: "Named business owner",
  adoptionResponsibility: "business",
  decision: "confirm",
  evidenceReference: "EV-1",
  validatedBy: "reviewer",
  rationale: "Route confirmed from Discover evidence.",
  ...over,
});

const TECHNICAL_PRODUCT = route({});
const LIMITED_PROCESS_CHANGE = route({
  route: "process_change",
  recommendation: "process_change",
  solutionOutput: "workflow_automation",
  workflowChange: "limited",
  roleAccountabilityChange: "limited",
});

function renderP3(confirmed: ConfirmedSolutionRoute, step: 0 | 1 | 2) {
  render(
    <MovesCaptureFlow
      phases={PHASES}
      phase={3}
      sections={getPhaseCaptureSections(3, confirmed)}
      isSectionComplete={() => false}
      renderSectionInput={(section) => (
        <textarea aria-label={section.label} data-testid={`input-${section.key}`} />
      )}
      sectionRecap={() => ""}
      onSelectPhase={jest.fn()}
      onSubmitPhase={jest.fn()}
      onAdvanceToNextPhase={jest.fn()}
      nextPhase={{ code: "P4", name: "Roadmap" }}
      initialStep={step}
    />,
  );
}

/** Every step's rendered question inputs, by walking the step bar. */
function mountedAcrossAllSteps(confirmed: ConfirmedSolutionRoute): string[] {
  const keys: string[] = [];
  for (const step of [0, 1, 2] as const) {
    renderP3(confirmed, step);
    for (const node of screen.queryAllByRole("textbox")) {
      const id = node.getAttribute("data-testid");
      if (id?.startsWith("input-")) keys.push(id.slice("input-".length));
    }
    screen.getByRole("navigation", { name: "Phases" }); // the flow really rendered
    document.body.innerHTML = "";
  }
  return keys;
}

describe("P3 capture on a confirmed technical-product route", () => {
  it("mounts an input for every question the route declares", () => {
    const declared = getPhaseCaptureSections(3, TECHNICAL_PRODUCT).map((s) => s.key);
    expect(declared).toContain("business_change_boundary");

    const mounted = mountedAcrossAllSteps(TECHNICAL_PRODUCT);
    for (const key of declared) expect(mounted).toContain(key);
    // No question is asked twice across the three steps.
    expect(new Set(mounted).size).toBe(mounted.length);
  });

  it("asks the business-change boundary question, not the dropped process pair", () => {
    const mounted = mountedAcrossAllSteps(TECHNICAL_PRODUCT);
    expect(mounted).toContain("business_change_boundary");
    expect(mounted).not.toContain("operating_model");
    expect(mounted).not.toContain("process_design");
  });

  it("renders no empty step — every step panel asks at least one question", () => {
    for (const step of [0, 1, 2] as const) {
      renderP3(TECHNICAL_PRODUCT, step);
      const inputs = screen
        .queryAllByRole("textbox")
        .filter((n) => n.getAttribute("data-testid")?.startsWith("input-"));
      expect(inputs.length).toBeGreaterThan(0);
      document.body.innerHTML = "";
    }
  });
});

describe("P3 capture on a confirmed limited process-change route", () => {
  it("mounts an input for every question the route declares", () => {
    const declared = getPhaseCaptureSections(3, LIMITED_PROCESS_CHANGE).map((s) => s.key);
    expect(declared).toEqual(
      expect.arrayContaining([
        "workflow_delta",
        "process_adoption_boundary",
        "estimate_assumptions",
      ]),
    );

    const mounted = mountedAcrossAllSteps(LIMITED_PROCESS_CHANGE);
    for (const key of declared) expect(mounted).toContain(key);
    expect(new Set(mounted).size).toBe(mounted.length);
  });

  it("names the route's own step in the step bar", () => {
    renderP3(LIMITED_PROCESS_CHANGE, 1);
    const stepbar = screen.getByRole("navigation", { name: "Steps" });
    expect(within(stepbar).getByText(/What changes for people/i)).toBeInTheDocument();
  });
});

describe("P3 capture with no confirmed route", () => {
  it("keeps the default grouping, including the operating-model pair", () => {
    const mounted = mountedAcrossAllSteps(
      route({
        route: "process_change",
        recommendation: "process_change",
        solutionOutput: "workflow_automation",
        workflowChange: "material",
        roleAccountabilityChange: "material",
      }),
    );
    expect(mounted).toContain("operating_model");
    expect(mounted).toContain("process_design");
    expect(mounted).not.toContain("business_change_boundary");
  });
});
