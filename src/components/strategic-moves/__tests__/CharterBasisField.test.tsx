/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import {
  CharterBasisField,
  CharterBasisMark,
  CharterBasisRollup,
  isCharterAssumption,
  summarizeCharterBasis,
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

// ─── the charter-level rollup on the hand-off screen ───
const EV: CharterBasisValue = { kind: "approved_evidence", evidenceId: "ev-1" };
const ASSERTED: CharterBasisValue = { kind: "workspace_assertion" };
const ASSUMED: CharterBasisValue = {
  kind: "assumption",
  owner: "Member Experience lead",
  p2ValidationPlan: "Baseline the resolution numbers",
};

const answerAll = () => true;

describe("summarizeCharterBasis", () => {
  it("counts each basis kind and collects the open assumptions", () => {
    const summary = summarizeCharterBasis(
      SECTIONS,
      { sponsor_commitment: EV, scope_boundary: ASSUMED },
      answerAll,
    );
    expect(summary).toMatchObject({
      total: 2,
      answered: 2,
      evidence: 1,
      asserted: 0,
      assumptions: 1,
      unrecorded: 0,
    });
    expect(summary.openAssumptions).toEqual([
      {
        sectionKey: "scope_boundary",
        label: "Scope boundary",
        owner: "Member Experience lead",
        p2ValidationPlan: "Baseline the resolution numbers",
      },
    ]);
  });

  it("counts an answered field with no basis as unrecorded, not as covered", () => {
    const summary = summarizeCharterBasis(
      SECTIONS,
      { sponsor_commitment: ASSERTED },
      answerAll,
    );
    expect(summary.unrecorded).toBe(1);
    expect(summary.evidence).toBe(0);
    expect(summary.asserted).toBe(1);
  });

  it("does not call an unanswered field unrecorded — there is nothing to record yet", () => {
    // No basis AND no answer. `unrecorded` must stay 0: it means "you answered
    // this but did not say how you know it", which is a prompt to the user. An
    // unanswered field is already counted by `answered`, and double-reporting
    // it would make a blank charter read as seven open problems.
    const summary = summarizeCharterBasis(SECTIONS, {}, () => false);
    expect(summary.unrecorded).toBe(0);
    expect(summary.answered).toBe(0);
    expect(summary.total).toBe(2);
  });

  it("tallies answered independently of basis, so a basis cannot answer a field", () => {
    // Every field carries a basis, none is answered. `answered` must stay 0 —
    // a declared basis is not an answer. Pinned separately from `unrecorded`,
    // which only counts ANSWERED fields lacking a basis.
    const summary = summarizeCharterBasis(
      SECTIONS,
      { sponsor_commitment: ASSUMED, scope_boundary: EV },
      () => false,
    );
    expect(summary.answered).toBe(0);
    expect(summary.assumptions).toBe(1);
    expect(summary.evidence).toBe(1);
    expect(summary.unrecorded).toBe(0);
  });

  it("is empty for an empty section list", () => {
    expect(summarizeCharterBasis([], {}, answerAll)).toMatchObject({
      total: 0,
      answered: 0,
      openAssumptions: [],
    });
  });
});

describe("CharterBasisRollup", () => {
  const summaryOf = (
    basis: Record<string, CharterBasisValue>,
    isAnswered: (key: string) => boolean = answerAll,
  ) => summarizeCharterBasis(SECTIONS, basis, isAnswered);

  it("names the open assumptions with owner and validation step", () => {
    render(
      <CharterBasisRollup summary={summaryOf({ scope_boundary: ASSUMED })} />,
    );
    const rollup = screen.getByTestId("charter-basis-rollup");
    expect(rollup).toHaveAttribute("data-assumptions", "1");
    expect(screen.getByText(/1 assumption carries into Discover/i)).toBeInTheDocument();
    expect(screen.getByText("Scope boundary")).toBeInTheDocument();
    expect(
      screen.getByText(/Member Experience lead — Baseline the resolution numbers/),
    ).toBeInTheDocument();
    // An assumption is never described as covered.
    expect(screen.getByText(/It is not evidence/i)).toBeInTheDocument();
  });

  it("drops the amber clause and the footnote when nothing is assumed", () => {
    render(
      <CharterBasisRollup
        summary={summaryOf({
          scope_boundary: ASSERTED,
          sponsor_commitment: EV,
        })}
      />,
    );
    expect(screen.getByTestId("charter-basis-rollup")).toHaveAttribute(
      "data-assumptions",
      "0",
    );
    // Matches the plural wording too: a `0 assumptions carry into Discover`
    // clause is exactly the regression this guards, and /carries/ misses it.
    expect(screen.queryByText(/into Discover/i)).toBeNull();
    expect(screen.queryByText(/It is not evidence/i)).toBeNull();
    expect(screen.getByText("1 backed by evidence")).toBeInTheDocument();
    expect(screen.getByText("1 asserted")).toBeInTheDocument();
  });

  it("reports an answered field with no basis rather than hiding it", () => {
    render(<CharterBasisRollup summary={summaryOf({})} />);
    expect(screen.getByText("2 without a basis yet")).toBeInTheDocument();
    expect(screen.getByText(/2 of 2 answered/)).toBeInTheDocument();
  });

  it("renders nothing when no section is basis-eligible", () => {
    render(<CharterBasisRollup summary={summarizeCharterBasis([], {}, answerAll)} />);
    expect(screen.queryByTestId("charter-basis-rollup")).toBeNull();
  });
});

describe("CharterBasisMark", () => {
  it("marks an assumption with the same amber badge as the live question", () => {
    render(<CharterBasisMark value={ASSUMED} />);
    expect(screen.getByTestId("charter-assumption-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("charter-basis-mark")).toBeNull();
  });

  it("distinguishes evidence from an assertion", () => {
    const { unmount } = render(<CharterBasisMark value={EV} />);
    expect(screen.getByTestId("charter-basis-mark")).toHaveTextContent("Evidence");
    unmount();
    render(<CharterBasisMark value={ASSERTED} />);
    expect(screen.getByTestId("charter-basis-mark")).toHaveTextContent("Asserted");
  });

  it("renders nothing without a declared basis", () => {
    render(<CharterBasisMark value={null} />);
    expect(screen.queryByTestId("charter-basis-mark")).toBeNull();
    expect(screen.queryByTestId("charter-assumption-badge")).toBeNull();
  });
});

describe("MovesCaptureFlow hand-off basis slots", () => {
  /** Step 3 → Submit lands on the hand-off screen. */
  const submitToHandoff = () => {
    fireEvent.click(screen.getByRole("button", { name: /^Submit/ }));
    expect(screen.getByTestId("mcf-handoff")).toBeInTheDocument();
  };

  it("renders the rollup band above the recap when supplied", () => {
    renderFlow({
      initialStep: 2,
      handoffSummary: <div data-testid="rollup-slot">rollup</div>,
    });
    submitToHandoff();
    expect(screen.getByTestId("rollup-slot")).toBeInTheDocument();
  });

  it("marks every recap row's basis, not only the amber one", () => {
    renderFlow({
      initialStep: 2,
      sectionRecap: (section) => `answer for ${section.key}`,
      renderSectionRecapMark: (section) => (
        <span data-testid={`mark-${section.key}`}>
          {section.key === "scope_boundary" ? "Assumption" : "Asserted"}
        </span>
      ),
    });
    submitToHandoff();
    expect(screen.getByTestId("mark-scope_boundary")).toHaveTextContent("Assumption");
    expect(screen.getByTestId("mark-sponsor_commitment")).toHaveTextContent("Asserted");
  });

  it("leaves the hand-off unchanged when both slots are absent (flag off)", () => {
    renderFlow({ initialStep: 2, sectionRecap: (s) => `answer for ${s.key}` });
    submitToHandoff();
    expect(screen.queryByTestId("charter-basis-rollup")).toBeNull();
    expect(screen.queryByTestId("charter-basis-mark")).toBeNull();
    // The recap itself still reads back every question.
    expect(screen.getByText("Scope boundary")).toBeInTheDocument();
    expect(screen.getByText("answer for scope_boundary")).toBeInTheDocument();
  });
});
