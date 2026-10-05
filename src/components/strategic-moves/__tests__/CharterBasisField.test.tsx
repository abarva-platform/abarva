/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import {
  CharterBasisField,
  isCharterAssumption,
  type CharterBasisValue,
} from "../CharterBasisField";
import { MovesCaptureFlow } from "../MovesCaptureFlow";
import type { MovesCaptureFlowPhase } from "../MovesCaptureFlow";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

const APPROVED = [{ evidenceId: "ev-1", label: "Sponsor confirmation note" }];

/** Host harness: the control is uncontrolled-by-design, the host owns value. */
function Harness({
  initial = null,
  approvedSources = APPROVED,
  onChangeSpy,
}: {
  initial?: CharterBasisValue | null;
  approvedSources?: readonly { evidenceId: string; label: string }[];
  onChangeSpy?: (next: CharterBasisValue | null) => void;
}) {
  const [value, setValue] = useState<CharterBasisValue | null>(initial);
  return (
    <CharterBasisField
      sectionKey="success_criteria"
      value={value}
      approvedSources={approvedSources}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
    />
  );
}

describe("CharterBasisField", () => {
  it("offers exactly the three bases and starts with none chosen", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", {
      name: /how do you know this/i,
    });
    const options = screen.getAllByRole("radio");
    expect(group).toBeInTheDocument();
    expect(options.map((o) => o.textContent)).toEqual([
      "Backed by evidence",
      "I'm asserting this",
      "It's an assumption",
    ]);
    expect(options.every((o) => o.getAttribute("aria-checked") === "false")).toBe(
      true,
    );
  });

  it("records an assertion as a complete basis with no upload", () => {
    const spy = jest.fn();
    render(<Harness onChangeSpy={spy} />);
    fireEvent.click(screen.getByRole("radio", { name: /asserting/i }));
    expect(spy).toHaveBeenCalledWith({ kind: "workspace_assertion" });
    expect(screen.getByText(/no upload needed/i)).toBeInTheDocument();
  });

  it("asks for an owner and a Discover validation plan for an assumption", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("radio", { name: /assumption/i }));
    expect(screen.getByLabelText("Owner")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/how discover validates it/i),
    ).toBeInTheDocument();
  });

  it("never describes an assumption as evidence, and badges it as one", () => {
    render(<Harness initial={{ kind: "assumption", owner: "Ops lead", p2ValidationPlan: "Baseline it" }} />);
    const note = screen.getByText(/stays an assumption/i);
    expect(note).toBeInTheDocument();
    expect(note.textContent).not.toMatch(/evidence covered/i);
    expect(
      screen.getByTestId("charter-basis-success_criteria"),
    ).toHaveAttribute("data-basis", "assumption");
    expect(isCharterAssumption({ kind: "assumption", owner: "a", p2ValidationPlan: "b" })).toBe(true);
    expect(isCharterAssumption({ kind: "workspace_assertion" })).toBe(false);
    expect(isCharterAssumption(null)).toBe(false);
  });

  it("disables the evidence basis — and only that one — when nothing is approved", () => {
    render(<Harness approvedSources={[]} />);
    expect(screen.getByRole("radio", { name: /backed by evidence/i })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /asserting/i })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /assumption/i })).toBeEnabled();
    expect(
      screen.getByText(/assertion or an owned assumption is enough/i),
    ).toBeInTheDocument();
  });

  it("binds an evidence basis to a chosen approved source", () => {
    const spy = jest.fn();
    render(
      <Harness
        approvedSources={[
          ...APPROVED,
          { evidenceId: "ev-2", label: "Steering deck" },
        ]}
        onChangeSpy={spy}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /backed by evidence/i }));
    expect(spy).toHaveBeenCalledWith({
      kind: "approved_evidence",
      evidenceId: "ev-1",
    });
    fireEvent.change(screen.getByLabelText(/approved source/i), {
      target: { value: "ev-2" },
    });
    expect(spy).toHaveBeenLastCalledWith({
      kind: "approved_evidence",
      evidenceId: "ev-2",
    });
  });
});

// ─── the flow slots that carry it ───
const PHASES: MovesCaptureFlowPhase[] = [
  { phase: 1, code: "P1", name: "Charter", answered: 0, total: 2, reachable: true },
];
const SECTIONS: PhaseCaptureSection[] = [
  { key: "sponsor_commitment", label: "Sponsor contact and progress updates", description: "Name, role, email.", required: true },
  { key: "scope_boundary", label: "Scope boundary", description: "In and out.", required: true },
];

function renderFlow(
  overrides: Partial<React.ComponentProps<typeof MovesCaptureFlow>> = {},
) {
  render(
    <MovesCaptureFlow
      phases={PHASES}
      phase={1}
      sections={SECTIONS}
      isSectionComplete={() => false}
      renderSectionInput={(s) => <textarea aria-label={s.label} />}
      sectionRecap={() => ""}
      onSelectPhase={jest.fn()}
      onSubmitPhase={jest.fn()}
      onAdvanceToNextPhase={jest.fn()}
      {...overrides}
    />,
  );
}

describe("MovesCaptureFlow basis slots", () => {
  it("renders nothing extra when the slots are absent (flag off)", () => {
    renderFlow();
    expect(screen.queryByRole("radiogroup", { name: /how do you know this/i })).toBeNull();
    expect(screen.queryByTestId("charter-assumption-badge")).toBeNull();
    // The question itself still renders exactly as before.
    expect(
      screen.getByLabelText("Sponsor contact and progress updates"),
    ).toBeInTheDocument();
  });

  it("renders a basis control under each question when the slot is supplied", () => {
    renderFlow({
      renderSectionBasis: (section) => (
        <div data-testid={`basis-slot-${section.key}`}>basis</div>
      ),
    });
    expect(screen.getByTestId("basis-slot-sponsor_commitment")).toBeInTheDocument();
    expect(screen.getByTestId("basis-slot-scope_boundary")).toBeInTheDocument();
  });

  it("renders the assumption badge beside the question label", () => {
    renderFlow({
      renderSectionBadge: (section) =>
        section.key === "scope_boundary" ? (
          <span data-testid="badge-scope_boundary">Assumption</span>
        ) : null,
    });
    expect(screen.getByTestId("badge-scope_boundary")).toBeInTheDocument();
    expect(screen.queryByTestId("badge-sponsor_commitment")).toBeNull();
  });
});
