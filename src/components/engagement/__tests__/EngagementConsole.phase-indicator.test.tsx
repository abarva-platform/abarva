/**
 * @jest-environment jsdom
 */

// The console's phase indicator is where a user reads which phase the Move is
// standing in. It was built from a local five-entry array left over from a
// retired phase model, laid out in a five-column grid. A Strategic Move has
// SIX phases, so P1-P4 each carried the name of a different phase and P5 had
// no cell at all — a Move at its final phase showed nothing as current.
//
// The roster derivation is pinned by `phase-roster.test.ts`. What is pinned
// HERE is that the corrected roster reaches the screen: a correct roster
// behind an indicator that still renders its own array is a fix nobody sees.
// Each case therefore asserts rendered text and rendered cell count.

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import type { EngagementRow } from "@/lib/db/engagement";
import { EngagementConsole } from "../EngagementConsole";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

// jsdom implements no layout, so the console's scroll-to-latest effect has
// no `scrollIntoView` to call. Stub it; the indicator under test is static.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

function engagementAtPhase(phase: number): EngagementRow {
  return {
    id: "eng-1",
    graph_node_id: "node-1",
    name: "Governed data foundation",
    status: "active",
    current_phase: phase,
    gates_passed: [],
  } as unknown as EngagementRow;
}

function renderConsoleAtPhase(phase: number) {
  return render(
    <EngagementConsole
      engagement={engagementAtPhase(phase)}
      sponsor={null}
      turns={[]}
      activePatterns={[]}
      peerDecisions={[]}
      chainedPatterns={[]}
    />,
  );
}

// The indicator renders "PHASE n" above each phase name. Reading the cells
// back through those codes proves the grid, not just the label strings.
function phaseCellCodes(): string[] {
  return screen
    .getAllByText(/^PHASE \d+$/)
    .map((node) => node.textContent ?? "");
}

describe("the engagement console phase indicator", () => {
  it("renders a cell for all six phases, not five", () => {
    renderConsoleAtPhase(0);
    expect(phaseCellCodes()).toEqual([
      "PHASE 0",
      "PHASE 1",
      "PHASE 2",
      "PHASE 3",
      "PHASE 4",
      "PHASE 5",
    ]);
  });

  it("names each phase as the canonical model does", () => {
    renderConsoleAtPhase(0);
    for (const name of [
      "Originate",
      "Charter",
      "Diagnose",
      "Design",
      "Roadmap",
      "Mobilize",
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it("shows no retired Execute or Verify phase", () => {
    renderConsoleAtPhase(0);
    expect(screen.queryByText("Execute")).not.toBeInTheDocument();
    expect(screen.queryByText("Verify")).not.toBeInTheDocument();
  });

  it("renders a Mobilize cell for a Move standing at P5", () => {
    renderConsoleAtPhase(5);
    expect(phaseCellCodes()).toContain("PHASE 5");
    expect(screen.getAllByText("Mobilize").length).toBeGreaterThan(0);
  });

  // A six-cell indicator inside a five-column grid still renders all six
  // names — the sixth just wraps onto a second row, misaligned under the
  // first. Text assertions cannot see that, so assert the track count too.
  it("lays the six cells out in one row of six columns", () => {
    renderConsoleAtPhase(0);
    const grid = screen.getByText("PHASE 0").closest("div")?.parentElement
      ?.parentElement;
    expect(grid).toBeTruthy();
    expect(grid!.style.gridTemplateColumns).toBe("repeat(6, 1fr)");
  });

  it("names P2 Diagnose, where the retired array named it Design", () => {
    renderConsoleAtPhase(2);
    const codes = phaseCellCodes();
    expect(codes.indexOf("PHASE 2")).toBe(2);
    expect(screen.getAllByText("Diagnose").length).toBeGreaterThan(0);
  });
});
