/**
 * @jest-environment jsdom
 */

// MovePhaseExplorer — Finder-shell behavior after the legacy rail retirement.
// Covers:
//   (a) the Finder-style grouped rail is unconditional
//   (b) the collapse/expand toggle is real component state
//   (c) the amber draft-dot and blocked-reason subtitle render only when
//       the corresponding optional props are supplied

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { MovePhaseExplorer } from "../MovePhaseExplorer";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";

const tallies: PhaseTallyRow[] = [
  { phase: 0, label: "P0 Originate", met: 3, total: 3, state: "done" },
  { phase: 1, label: "P1 Charter", met: 2, total: 4, state: "current" },
  { phase: 2, label: "P2 Discovery", met: 0, total: 5, state: "upcoming" },
];

describe("MovePhaseExplorer · Finder shell", () => {
  it("renders the Finder-style grouped rail unconditionally", () => {
    render(
      <MovePhaseExplorer moveId="move-1" currentPhase={1} tallies={tallies} />,
    );

    expect(
      screen.getByTestId("move-phase-explorer-finder-shell"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Journey")).not.toBeInTheDocument();
    expect(screen.getByText("Phases")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByText("Phase Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Approvals")).toBeInTheDocument();

    // New compact tally format ("met/total" not "met of total").
    expect(screen.getByText("2/4")).toBeInTheDocument();
  });

  it("toggles collapse/expand as real component state", () => {
    render(
      <MovePhaseExplorer moveId="move-1" currentPhase={1} tallies={tallies} />,
    );

    expect(screen.getByText("Phases")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /collapse phase rail/i });

    fireEvent.click(toggle);

    // Collapsed: group labels and row text are no longer rendered.
    expect(screen.queryByText("Phases")).not.toBeInTheDocument();
    expect(screen.queryByText("P1 Charter")).not.toBeInTheDocument();
    const expandToggle = screen.getByRole("button", {
      name: /expand phase rail/i,
    });

    fireEvent.click(expandToggle);

    // Expanded again.
    expect(screen.getByText("Phases")).toBeInTheDocument();
    expect(screen.getByText("P1 Charter")).toBeInTheDocument();
  });

  it("renders the amber draft-dot only for phases marked as draft-pending", () => {
    const { rerender } = render(
      <MovePhaseExplorer moveId="move-1" currentPhase={1} tallies={tallies} />,
    );
    expect(
      screen.queryByLabelText("AI draft not yet final"),
    ).not.toBeInTheDocument();

    rerender(
      <MovePhaseExplorer
        moveId="move-1"
        currentPhase={1}
        tallies={tallies}
        draftPendingPhases={[1]}
      />,
    );
    expect(screen.getByLabelText("AI draft not yet final")).toBeInTheDocument();
  });

  it("renders the amber blocked-reason subtitle only for phases marked as blocked", () => {
    const { rerender } = render(
      <MovePhaseExplorer moveId="move-1" currentPhase={1} tallies={tallies} />,
    );
    expect(
      screen.queryByText("Missing sponsor sign-off"),
    ).not.toBeInTheDocument();

    rerender(
      <MovePhaseExplorer
        moveId="move-1"
        currentPhase={1}
        tallies={tallies}
        blockedPhases={[{ phase: 1, reason: "Missing sponsor sign-off" }]}
      />,
    );
    expect(screen.getByText("Missing sponsor sign-off")).toBeInTheDocument();
  });
});
