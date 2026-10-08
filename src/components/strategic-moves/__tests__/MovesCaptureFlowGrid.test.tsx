/**
 * @jest-environment jsdom
 *
 * Pins the v2 two-column capture grid introduced for the P3+ "long flat page"
 * fix: structured editors span both columns automatically, plain sections sit
 * in a single column, a host `sectionSpan` hint overrides per section, and the
 * panel carries a phase/step eyebrow. Legacy (v1) renders none of this.
 */

import "@testing-library/jest-dom";
import { render, fireEvent, cleanup, within } from "@testing-library/react";
import { MovesCaptureFlow } from "../MovesCaptureFlow";
import type { MovesCaptureFlowPhase } from "../MovesCaptureFlow";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

const PHASES: MovesCaptureFlowPhase[] = [
  { phase: 1, code: "P1", name: "Charter", answered: 0, total: 7, reachable: true },
  { phase: 2, code: "P2", name: "Discover", answered: 0, total: 8, reachable: false },
];

const SECTIONS: PhaseCaptureSection[] = [
  { key: "sponsor_commitment", label: "Sponsor contact and progress updates", description: "Name, role, email.", required: true },
  { key: "scope_boundary", label: "Scope boundary", description: "In and out.", required: true },
  { key: "success_criteria", label: "Success criteria", description: "Targets.", required: true },
  { key: "stakeholder_map", label: "Stakeholder map", description: "Who Discovery needs.", required: true },
  { key: "decision_rights", label: "Decision rights", description: "Who approves.", required: true },
  { key: "evidence_plan", label: "Evidence plan", description: "What to gather.", required: true },
  { key: "business_change_assessment", label: "Business change & adoption owner", description: "Expected change.", required: true, structured: "business-change" },
];

function freshFlow(overrides: Partial<React.ComponentProps<typeof MovesCaptureFlow>> = {}) {
  cleanup();
  const { container } = render(
    <MovesCaptureFlow
      phases={PHASES}
      phase={1}
      sections={SECTIONS}
      isSectionComplete={() => false}
      renderSectionInput={(section) => (
        <textarea aria-label={section.label} data-testid={`input-${section.key}`} />
      )}
      sectionRecap={() => ""}
      onSelectPhase={jest.fn()}
      onSubmitPhase={jest.fn()}
      onAdvanceToNextPhase={jest.fn()}
      nextPhase={{ code: "P2", name: "Discover" }}
      workspaceV2
      {...overrides}
    />,
  );
  return container as HTMLElement;
}

// Walk Continue within a container until the input for `key` is on screen.
const stepTo = (container: HTMLElement, key: string): HTMLElement => {
  for (let i = 0; i < 6; i += 1) {
    const hit = container.querySelector(`[data-testid="input-${key}"]`);
    if (hit) {
      const wrapper = hit.closest(".mcf-question");
      if (!wrapper) throw new Error(`no .mcf-question wrapper for ${key}`);
      return wrapper as HTMLElement;
    }
    const next = within(container).queryByRole("button", { name: /^Continue$/ });
    if (!next) break;
    fireEvent.click(next);
  }
  throw new Error(`never reached input for ${key}`);
};

describe("MovesCaptureFlow v2 capture grid", () => {
  it("renders a phase · step eyebrow in v2", () => {
    const c = freshFlow();
    const eyebrow = c.querySelector(".mcf-panel-eyebrow");
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveTextContent(/P1/);
    expect(eyebrow).toHaveTextContent(/STEP 1 OF 3/);
  });

  it("does NOT render the eyebrow in legacy v1", () => {
    const c = freshFlow({ workspaceV2: false });
    expect(c.querySelector(".mcf-panel-eyebrow")).toBeNull();
  });

  it("widens a structured section automatically", () => {
    const c = freshFlow();
    expect(stepTo(c, "business_change_assessment")).toHaveClass("is-wide");
  });

  it("leaves a plain section single-column by default", () => {
    const c = freshFlow();
    expect(stepTo(c, "sponsor_commitment")).not.toHaveClass("is-wide");
  });

  it("honours a host sectionSpan 'wide' hint on a plain section", () => {
    const c = freshFlow({ sectionSpan: (s) => (s.key === "sponsor_commitment" ? "wide" : "default") });
    expect(stepTo(c, "sponsor_commitment")).toHaveClass("is-wide");
  });

  it("honours a host sectionSpan 'default' hint overriding structured auto-wide", () => {
    const c = freshFlow({ sectionSpan: () => "default" });
    expect(stepTo(c, "business_change_assessment")).not.toHaveClass("is-wide");
  });
});
