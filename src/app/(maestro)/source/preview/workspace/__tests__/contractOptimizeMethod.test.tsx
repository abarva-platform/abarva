/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import {
  ContractOptimizeMethod,
  ContractRefusalChips,
} from "../ContractOptimizeMethod";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * The refusal chips are the claim worth guarding. `baseline_conflict`,
 * `evidence_required` and `workflow_required` are stages an opportunity is
 * actually in, so a chip may only read as live when this contract holds one.
 * A chip that always looks lit would be decoration.
 */

const vmWithStages = (stages: readonly string[]) =>
  ({
    opportunityView: {
      opportunities: stages.map((stageRaw, index) => ({
        id: `opp-${index}`,
        stageRaw,
      })),
    },
    optWorkflow: {
      steps: [
        { key: "select", index: 1, label: "Select contract", state: "complete" },
        {
          key: "lock_baseline",
          index: 2,
          label: "Lock baseline",
          state: "complete",
        },
        { key: "evidence", index: 3, label: "Read evidence", state: "complete" },
        {
          key: "diagnose",
          index: 4,
          label: "Diagnose opportunity",
          state: "blocked",
        },
        { key: "plan", index: 5, label: "Build strategy", state: "future" },
        {
          key: "approve",
          index: 6,
          label: "Approve and execute",
          state: "future",
        },
        { key: "prove_value", index: 7, label: "Prove value", state: "future" },
      ],
    },
  }) as unknown as SourceWorkspaceVM;

describe("ContractRefusalChips", () => {
  it("lights only the refusal states this contract actually holds", () => {
    const { container } = render(
      <ContractRefusalChips
        vm={vmWithStages(["evidence_required", "evidence_required", "quantified"])}
      />,
    );

    const live = [...container.querySelectorAll(".sw-c3-refusal-live")];
    expect(live).toHaveLength(1);
    expect(live[0]?.textContent).toContain("Evidence required");
    expect(live[0]?.textContent).toContain("2 levers");

    // The other two gates are shown, at rest, not lit.
    expect(container.querySelectorAll(".sw-c3-refusal")).toHaveLength(3);
    expect(screen.getByText(/Baseline conflict/)).toBeTruthy();
    expect(screen.getByText(/Workflow required/)).toBeTruthy();
  });

  it("says plainly when nothing is being refused", () => {
    render(<ContractRefusalChips vm={vmWithStages(["quantified", "validated"])} />);

    expect(
      screen.getByText(/No lever on this contract is being refused/),
    ).toBeTruthy();
  });

  it("counts each live gate separately", () => {
    const { container } = render(
      <ContractRefusalChips
        vm={vmWithStages([
          "baseline_conflict",
          "workflow_required",
          "workflow_required",
          "workflow_required",
        ])}
      />,
    );

    expect(container.querySelectorAll(".sw-c3-refusal-live")).toHaveLength(2);
    expect(screen.getByText(/3 levers/)).toBeTruthy();
    expect(screen.getByText(/1 lever$/)).toBeTruthy();
  });

  it("renders nothing without opportunities", () => {
    const { container } = render(<ContractRefusalChips vm={vmWithStages([])} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ContractOptimizeMethod", () => {
  it("groups the seven steps into four phases with their questions", () => {
    render(<ContractOptimizeMethod vm={vmWithStages(["quantified"])} />);

    for (const phase of ["Establish", "Diagnose", "Act", "Prove"]) {
      expect(screen.getByText(phase)).toBeTruthy();
    }
    expect(screen.getByText("What does today actually cost?")).toBeTruthy();
    expect(screen.getByText("Did the money actually arrive?")).toBeTruthy();
  });

  it("shows this contract's state against each step", () => {
    const { container } = render(
      <ContractOptimizeMethod vm={vmWithStages(["quantified"])} />,
    );

    // Three satisfied, one blocked, three not started — from the state machine.
    const badges = [...container.querySelectorAll(".sw-c3-badge")].map(
      (node) => node.textContent,
    );
    expect(badges.filter((text) => text === "Satisfied")).toHaveLength(3);
    expect(badges.filter((text) => text === "Blocked")).toHaveLength(1);
    expect(badges.filter((text) => text === "Not started")).toHaveLength(3);
  });

  it("still explains the method when no workflow position exists", () => {
    const vm = { opportunityView: null, optWorkflow: null } as unknown as
      SourceWorkspaceVM;
    const { container } = render(<ContractOptimizeMethod vm={vm} />);

    expect(screen.getByText("Establish")).toBeTruthy();
    // No state claimed where none is derived.
    expect(container.querySelectorAll(".sw-c3-badge")).toHaveLength(0);
  });
});
