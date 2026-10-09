/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import type { AgentDockProps } from "@/components/agent/AgentDock";
import { MovesCaptureWorkspace } from "../MovesCaptureWorkspace";
import type { MovesCaptureFlowProps } from "../MovesCaptureFlow";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

// Mock the shared dock so we assert the composition + adapter wiring, not
// AgentDock's internals.
jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: (props: AgentDockProps) => (
    <div
      data-testid="agent-dock"
      data-role={props.agent.role}
      data-name={props.agent.name}
      data-surface={props.surface}
      data-thread-count={props.thread.length}
      data-first-message={props.thread[0] ? `${props.thread[0].role}:${props.thread[0].body}` : ""}
      data-actions={(props.suggestedActions ?? []).length}
    >
      {props.workspace}
    </div>
  ),
}));

const P1_SECTIONS: PhaseCaptureSection[] = [
  { key: "sponsor_commitment", label: "Sponsor contact and progress updates", description: "Name, role, email.", required: true },
  { key: "scope_boundary", label: "Scope boundary", description: "In and out.", required: true },
  { key: "success_criteria", label: "Success criteria", description: "Targets.", required: true },
  { key: "stakeholder_map", label: "Stakeholder map", description: "Who.", required: true },
  { key: "decision_rights", label: "Decision rights", description: "Who approves.", required: true },
  { key: "evidence_plan", label: "Evidence plan", description: "What to gather.", required: true },
  { key: "business_change_assessment", label: "Business change & adoption owner", description: "Change.", required: true, structured: "business-change" },
];

const captureProps: MovesCaptureFlowProps = {
  phases: [
    { phase: 0, code: "P0", name: "Originate", answered: 11, total: 11, reachable: true },
    { phase: 1, code: "P1", name: "Charter", answered: 0, total: 7, reachable: true },
    { phase: 2, code: "P2", name: "Discover", answered: 0, total: 8, reachable: false },
  ],
  phase: 1,
  sections: P1_SECTIONS,
  isSectionComplete: () => false,
  renderSectionInput: (section) => <textarea aria-label={section.label} />,
  sectionRecap: () => "",
  onSelectPhase: jest.fn(),
  onSubmitPhase: jest.fn(),
  onAdvanceToNextPhase: jest.fn(),
  nextPhase: { code: "P2", name: "Discover" },
};

describe("MovesCaptureWorkspace", () => {
  it("hosts a step page in the same aVa dock, with aVa's briefing as its opening turn", () => {
    render(
      <MovesCaptureWorkspace
        moveId="move-1"
        moveName="Governed data foundation"
        phase={3}
        avaRole="Design partner"
        avaThread={[{ id: "t1", role: "user", text: "What is open?" }]}
        avaQuestions={[]}
        onAvaMessage={jest.fn()}
        openingBriefing="I checked every Design gate rule against this Move."
        content={<h1>Check the gate and sign off Design</h1>}
      />,
    );
    const dock = screen.getByTestId("agent-dock");
    expect(
      within(dock).getByRole("heading", { name: "Check the gate and sign off Design" }),
    ).toBeInTheDocument();
    // The step page replaces the capture flow inside the one dock.
    expect(within(dock).queryByTestId("moves-capture-flow")).not.toBeInTheDocument();
    expect(dock).toHaveAttribute("data-thread-count", "2");
    expect(dock).toHaveAttribute(
      "data-first-message",
      "agent:I checked every Design gate rule against this Move.",
    );
  });


  it("renders AgentDock (aVa) wrapping the capture flow, with the phase role", () => {
    render(
      <MovesCaptureWorkspace
        moveId="move-1"
        moveName="Member-services AI assist"
        phase={1}
        avaRole="Charter partner"
        avaThread={[
          { id: "t1", role: "user", text: "hi" },
          { id: "t2", role: "assistant", text: "hello" },
        ]}
        avaQuestions={["What is in and out of scope?", "Which success metric is weakest?"]}
        avaLeadingActions={[{ id: "draft", label: "Draft proposed inputs", body: "", onClick: () => {} }]}
        onAvaMessage={jest.fn()}
        tabs={<nav data-testid="ws-tabs">tabs</nav>}
        captureProps={captureProps}
      />,
    );

    const dock = screen.getByTestId("agent-dock");
    expect(dock).toHaveAttribute("data-role", "Charter partner");
    expect(dock).toHaveAttribute("data-name", "aVa");
    expect(dock).toHaveAttribute("data-thread-count", "2");
    // leading action + 2 questions, capped at 3
    expect(dock).toHaveAttribute("data-actions", "3");

    // the workspace (tabs + capture flow) renders inside the dock
    expect(within(dock).getByTestId("ws-tabs")).toBeInTheDocument();
    expect(within(dock).getByTestId("moves-capture-flow")).toBeInTheDocument();
    expect(
      within(dock).getByRole("heading", { name: "Scope the bet" }),
    ).toBeInTheDocument();
  });
  it("renders the fill-from-notes slot inside the dock when the host supplies it", () => {
    render(
      <MovesCaptureWorkspace
        moveId="m1"
        moveName="A Move"
        phase={1}
        avaRole="Charter partner"
        avaThread={[]}
        avaQuestions={[]}
        onAvaMessage={jest.fn()}
        tabs={<nav data-testid="ws-tabs">tabs</nav>}
        notesFill={<div data-testid="ws-notes-fill">notes</div>}
        captureProps={captureProps}
      />,
    );

    const dock = screen.getByTestId("agent-dock");
    expect(within(dock).getByTestId("ws-notes-fill")).toBeInTheDocument();
  });

  it("omits the fill-from-notes slot by default, so a flag-off dock is unchanged", () => {
    render(
      <MovesCaptureWorkspace
        moveId="m1"
        moveName="A Move"
        phase={1}
        avaRole="Charter partner"
        avaThread={[]}
        avaQuestions={[]}
        onAvaMessage={jest.fn()}
        tabs={<nav data-testid="ws-tabs">tabs</nav>}
        captureProps={captureProps}
      />,
    );

    expect(screen.queryByTestId("ws-notes-fill")).not.toBeInTheDocument();
    const dock = screen.getByTestId("agent-dock");
    expect(within(dock).getByTestId("ws-tabs")).toBeInTheDocument();
    expect(within(dock).getByTestId("moves-capture-flow")).toBeInTheDocument();
  });
});
