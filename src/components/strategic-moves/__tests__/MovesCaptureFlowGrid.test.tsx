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
import { useState } from "react";
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
  it("summarizes a durable answer without unmounting its editor or saving again", () => {
    const onSubmitPhase = jest.fn();
    const c = freshFlow({
      isSectionComplete: (key) => key === "sponsor_commitment",
      sectionRecap: () => "A saved sponsor answer with its declared basis",
      sectionBasisLabel: () => "Approved evidence",
      sectionSaveLabel: () => "Done",
      onSubmitPhase,
    });
    const question = stepTo(c, "sponsor_commitment");
    expect(c.querySelector(".mcf-step-summary")).toHaveTextContent("1 of 3 ready");
    expect(question).toHaveTextContent("Basis: Approved evidence");
    const field = question.querySelector(".mcf-q-body") as HTMLElement;
    const input = question.querySelector("textarea") as HTMLTextAreaElement;
    expect(field).toHaveAttribute("hidden");
    expect(input).toBeInTheDocument();

    fireEvent.click(within(question).getByRole("button", { name: "Edit" }));
    expect(field).not.toHaveAttribute("hidden");
    expect(input).toHaveFocus();
    expect(onSubmitPhase).not.toHaveBeenCalled();
  });

  it("reopens an unsaved draft when returning to a step", () => {
    cleanup();
    function DraftFlow() {
      const [draft, setDraft] = useState("Saved answer");
      return (
        <MovesCaptureFlow
          phases={PHASES}
          phase={1}
          sections={SECTIONS}
          isSectionComplete={(key) =>
            key === "sponsor_commitment" && draft === "Saved answer"
          }
          renderSectionInput={(section) => (
            <textarea
              aria-label={section.label}
              data-testid={`input-${section.key}`}
              value={section.key === "sponsor_commitment" ? draft : ""}
              onChange={(event) => setDraft(event.target.value)}
            />
          )}
          sectionRecap={() => "Saved answer"}
          onSelectPhase={jest.fn()}
          onSubmitPhase={jest.fn()}
          onAdvanceToNextPhase={jest.fn()}
          workspaceV2
        />
      );
    }
    const { container } = render(<DraftFlow />);
    const question = stepTo(container, "sponsor_commitment");
    fireEvent.click(within(question).getByRole("button", { name: "Edit" }));
    fireEvent.change(within(question).getByRole("textbox", { name: SECTIONS[0].label }), {
      target: { value: "Unsaved revision" },
    });
    fireEvent.click(within(container).getByRole("button", { name: "Continue" }));
    fireEvent.click(within(container).getByRole("button", { name: "Back" }));
    const returned = stepTo(container, "sponsor_commitment");
    expect(returned.querySelector(".mcf-q-body")).not.toHaveAttribute("hidden");
    expect(within(returned).getByRole("textbox", { name: SECTIONS[0].label })).toHaveValue(
      "Unsaved revision",
    );
  });

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
