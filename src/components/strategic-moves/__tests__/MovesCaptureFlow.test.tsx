/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MovesCaptureFlow } from "../MovesCaptureFlow";
import type { MovesCaptureFlowPhase } from "../MovesCaptureFlow";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

const PHASES: MovesCaptureFlowPhase[] = [
  { phase: 0, code: "P0", name: "Originate", answered: 11, total: 11, reachable: true },
  { phase: 1, code: "P1", name: "Charter", answered: 0, total: 7, reachable: true },
  { phase: 2, code: "P2", name: "Discover", answered: 0, total: 8, reachable: false },
  { phase: 3, code: "P3", name: "Design", answered: 0, total: 7, reachable: false },
  { phase: 4, code: "P4", name: "Roadmap", answered: 0, total: 7, reachable: false },
  { phase: 5, code: "P5", name: "Mobilize", answered: 0, total: 7, reachable: false },
];

// P1 Charter sections, in the order the grouping expects.
const P1_SECTIONS: PhaseCaptureSection[] = [
  { key: "sponsor_commitment", label: "Sponsor contact and progress updates", description: "Name, role, email.", required: true },
  { key: "scope_boundary", label: "Scope boundary", description: "In and out.", required: true },
  { key: "success_criteria", label: "Success criteria", description: "Targets.", required: true },
  { key: "stakeholder_map", label: "Stakeholder map", description: "Who Discovery needs.", required: true },
  { key: "decision_rights", label: "Decision rights", description: "Who approves.", required: true },
  { key: "evidence_plan", label: "Evidence plan", description: "What to gather.", required: true },
  { key: "business_change_assessment", label: "Business change & adoption owner", description: "Expected change.", required: true, structured: "business-change" },
];

function renderFlow(overrides: Partial<React.ComponentProps<typeof MovesCaptureFlow>> = {}) {
  const onSubmitPhase = jest.fn();
  const onAdvanceToNextPhase = jest.fn();
  const onSelectPhase = jest.fn();
  render(
    <MovesCaptureFlow
      phases={PHASES}
      phase={1}
      sections={P1_SECTIONS}
      isSectionComplete={() => false}
      renderSectionInput={(section) => (
        <textarea aria-label={section.label} data-testid={`input-${section.key}`} />
      )}
      sectionRecap={(section) => (section.key === "sponsor_commitment" ? "Priya Nair" : "")}
      onSelectPhase={onSelectPhase}
      onSubmitPhase={onSubmitPhase}
      onAdvanceToNextPhase={onAdvanceToNextPhase}
      nextPhase={{ code: "P2", name: "Discover" }}
      {...overrides}
    />,
  );
  return { onSubmitPhase, onAdvanceToNextPhase, onSelectPhase };
}

describe("MovesCaptureFlow", () => {
  it("shows the six phases, with the current one marked and future ones disabled", () => {
    renderFlow();
    const phasebar = screen.getByRole("navigation", { name: "Phases" });
    const tabs = within(phasebar).getAllByRole("button");
    expect(tabs).toHaveLength(6);
    const current = within(phasebar).getByRole("button", { current: "page" });
    expect(current).toHaveTextContent("Charter");
    // P2–P5 are not reachable yet.
    expect(tabs.filter((t) => (t as HTMLButtonElement).disabled)).toHaveLength(4);
  });

  it("opens on step 1 showing that step's questions and a Continue", () => {
    renderFlow();
    expect(screen.getByRole("heading", { name: "Scope the bet" })).toBeInTheDocument();
    expect(screen.getByTestId("input-sponsor_commitment")).toBeInTheDocument();
    expect(screen.getByTestId("input-success_criteria")).toBeInTheDocument();
    // step-2 content is not on screen yet
    expect(screen.queryByTestId("input-stakeholder_map")).not.toBeInTheDocument();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Continue$/ })).toBeInTheDocument();
  });

  it("Continue walks the three steps; the last step submits and shows the hand-off", () => {
    const { onSubmitPhase } = renderFlow();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "People & decisions" })).toBeInTheDocument();
    expect(screen.getByTestId("input-decision_rights")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByRole("heading", { name: "Plan the proof" })).toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Submit Charter" });
    expect(submit).toBeInTheDocument();

    fireEvent.click(submit);
    expect(onSubmitPhase).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("mcf-handoff")).toBeInTheDocument();
    expect(screen.getByText(/Charter is complete/)).toBeInTheDocument();
  });

  it("the hand-off recaps answers and advances to the next phase", () => {
    const { onAdvanceToNextPhase } = renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Charter" }));

    const handoff = screen.getByTestId("mcf-handoff");
    // the answered field shows its recap; an unanswered one reads "Not answered"
    expect(within(handoff).getByText("Priya Nair")).toBeInTheDocument();
    expect(within(handoff).getAllByText("Not answered").length).toBeGreaterThan(0);
    expect(within(handoff).getByText("What Discover will need")).toBeInTheDocument();

    fireEvent.click(within(handoff).getByRole("button", { name: "Begin Discover →" }));
    expect(onAdvanceToNextPhase).toHaveBeenCalledTimes(1);
  });

  it("gates Continue when requireAnswers is on and the step is incomplete", () => {
    renderFlow({ requireAnswers: true });
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("lets you jump back to a completed step from the step bar, but not forward", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "Continue" })); // now on step 2
    const stepbar = screen.getByRole("navigation", { name: "Steps" });
    // step 1 (done) is clickable; step 3 (upcoming) is disabled
    const step1 = within(stepbar).getByRole("button", { name: /Scope the bet/ });
    const step3 = within(stepbar).getByRole("button", { name: /Plan the proof/ });
    expect(step3).toBeDisabled();
    fireEvent.click(step1);
    expect(screen.getByRole("heading", { name: "Scope the bet" })).toBeInTheDocument();
  });

  it("renders the governed approveSlot on the final step instead of the built-in Submit", () => {
    renderFlow({
      approveSlot: <button type="button">Approve &amp; Build</button>,
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    // step 3: the host's governed approve control replaces the built-in Submit
    expect(
      screen.getByRole("button", { name: "Approve & Build" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Submit Charter" }),
    ).not.toBeInTheDocument();
  });

  it("states a question count, and no completion tick, for a phase it cannot measure", () => {
    // `answered: null` is what `capturePhaseAnsweredCount` returns for every
    // row but the one on screen. Such a row must not read "N of M answered"
    // and must not be ticked: this screen never saw that phase's answers.
    // The live defect was a Move originated before the capture flow existed —
    // all eleven P0 questions blank — whose P0 row was ticked and read
    // "11 of 11 answered" from every screen except P0's own.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: null } : p,
    );
    renderFlow({ phase: 1, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 questions");
    expect(originate).not.toHaveTextContent("answered");
    expect(within(originate).queryByLabelText("complete")).toBeNull();
  });

  it("still ticks and counts the phase on screen", () => {
    // The vacuity guard for the case above: a measured, complete row keeps
    // both the count and the tick, so "no tick" is a property of being
    // unmeasured and not of the assertion itself.
    const phases = PHASES.map((p) =>
      p.phase === 0 ? { ...p, answered: 11 } : p,
    );
    renderFlow({ phase: 0, phases });

    const bar = screen.getByRole("navigation", { name: "Phases" });
    const originate = within(bar).getByRole("button", { name: /Originate/ });

    expect(originate).toHaveTextContent("11 of 11 answered");
    expect(within(originate).getByLabelText("complete")).toBeInTheDocument();
  });
});
