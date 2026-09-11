/** @jest-environment jsdom */

import { render, screen, within } from "@testing-library/react";

import type { ContractEducationView } from "@/lib/source/contract-intelligence/education";
import {
  ContractEducationBriefing,
  ContractValueLedgers,
  ContractWorkflowRail,
} from "../Contract360Briefing";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * These guard the three claims the briefing design makes, each of which the
 * live surface got wrong before: a governed refusal must not read as a figure,
 * a readiness word must not contradict the steps beneath it, and a facet the
 * archetype does not require must not render in the same treatment as a gap.
 */

const workflowVm = (overrides: {
  blocker: string | null;
  currentIndex: number;
}) =>
  ({
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
          state: "complete",
        },
        {
          key: "plan",
          index: 5,
          label: "Build strategy",
          state: overrides.blocker ? "blocked" : "current",
        },
        {
          key: "approve",
          index: 6,
          label: "Approve and execute",
          state: "future",
        },
        { key: "prove_value", index: 7, label: "Prove value", state: "future" },
      ],
      currentKey: "plan",
      currentIndex: overrides.currentIndex,
      currentLabel: "Build strategy",
      primaryAction: "Approve or send back the outreach strategy",
      primaryActionDetail:
        "The target position traces to a calculation run and needs a CFO delegate.",
      blocker: overrides.blocker,
      readyForApproval: false,
    },
    opportunityView: { opportunities: [{}, {}, {}, {}, {}, {}] },
  }) as unknown as SourceWorkspaceVM;

const ledgerVm = (potential: {
  recoverable: string;
  avoidable: string;
  negotiable: string;
  financeConfirmed: string;
}) =>
  ({
    opportunityView: {
      potential: {
        recoverable: potential.recoverable,
        avoidable: potential.avoidable,
        negotiable: potential.negotiable,
      },
      financeConfirmed: potential.financeConfirmed,
    },
  }) as unknown as SourceWorkspaceVM;

const education = (
  overrides: Partial<ContractEducationView> = {},
): ContractEducationView =>
  ({
    archetypeKey: "cloud_consumption_commit",
    archetypeLabel: "Cloud consumption commitment",
    headline: "Manage the commitment against real workload demand.",
    body: "The commercial question is whether the workloads can consume what was bought.",
    state: "partial",
    stateLabel: "Education basis is partial",
    focus: "Right-size the commitment.",
    basis: ["12 spend/usage rows", "Benchmarking clause absent"],
    requiredEvidenceCount: 2,
    missingEvidence: [],
    thresholds: [
      {
        signal: "Utilization stays under 40%",
        decision: "Serve notice and re-base.",
        tone: "act",
      },
    ],
    facetRequirements: {} as ContractEducationView["facetRequirements"],
    steps: [
      {
        key: "track",
        title: "Track",
        question: "Are workloads using what the contract commits?",
        guidance: "Track committed amount and actual spend each month.",
        evidence: "12 spend/usage rows",
        state: "loaded",
      },
      {
        key: "load",
        title: "Load",
        question: "What makes the consumption number defensible?",
        guidance: "Load the executed order and the billing export.",
        evidence: "4 scope rows",
        state: "loaded",
      },
      {
        key: "observe",
        title: "Observe",
        question: "What should change before the next commercial gate?",
        guidance: "Watch utilization trend and the notice window.",
        evidence: "6 opportunity rows",
        state: "not_required",
      },
    ],
    ...overrides,
  }) as ContractEducationView;

describe("ContractWorkflowRail", () => {
  it("renders the governed seven-step position rather than a fixed index", () => {
    render(
      <ContractWorkflowRail
        vm={workflowVm({ blocker: "Approval AR-2261 outstanding", currentIndex: 5 })}
      />,
    );

    for (const label of [
      "Select contract",
      "Lock baseline",
      "Read evidence",
      "Diagnose opportunity",
      "Build strategy",
      "Approve and execute",
      "Prove value",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.getByText(/Step 5 of 7/)).toBeTruthy();
    expect(screen.getByText(/Blocked at step 5 · Build strategy/)).toBeTruthy();
    expect(screen.getByText("Approval AR-2261 outstanding")).toBeTruthy();
  });

  it("does not announce a blocker when nothing is blocking the current step", () => {
    render(<ContractWorkflowRail vm={workflowVm({ blocker: null, currentIndex: 5 })} />);

    expect(screen.queryByText(/Blocked at step/)).toBeNull();
    expect(screen.getByText(/Next up · step 5 · Build strategy/)).toBeTruthy();
    expect(screen.getByText("Nothing is blocking this step.")).toBeTruthy();
  });
});

describe("ContractValueLedgers", () => {
  it("keeps the four value concepts apart and never sums them", () => {
    render(
      <ContractValueLedgers
        vm={ledgerVm({
          recoverable: "Not established",
          avoidable: "$1.5M",
          negotiable: "Not sized",
          financeConfirmed: "Not established",
        })}
      />,
    );

    for (const name of [
      "Recoverable opportunity",
      "Avoidable opportunity",
      "Negotiated improvement",
      "Realized value",
    ]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
    expect(
      screen.getByText("Nothing here sums into a single savings number"),
    ).toBeTruthy();
  });

  it("renders a refusal quietly so it cannot be read as an amount", () => {
    const { container } = render(
      <ContractValueLedgers
        vm={ledgerVm({
          recoverable: "Not established",
          avoidable: "$1.5M",
          negotiable: "Not sized",
          financeConfirmed: "$0",
        })}
      />,
    );

    const amounts = Array.from(
      container.querySelectorAll(".sw-c3-ledger-amount"),
    );
    const quiet = (text: string) =>
      amounts.find((node) => node.textContent === text)?.className ?? "";

    expect(quiet("Not established")).toContain("sw-c3-ledger-amount-quiet");
    expect(quiet("Not sized")).toContain("sw-c3-ledger-amount-quiet");
    // A real figure — including zero — is an amount, not a refusal.
    expect(quiet("$1.5M")).not.toContain("sw-c3-ledger-amount-quiet");
    expect(quiet("$0")).not.toContain("sw-c3-ledger-amount-quiet");
  });
});

describe("ContractEducationBriefing", () => {
  it("does not count a not-required step against readiness", () => {
    render(<ContractEducationBriefing education={education()} />);

    // Two of three steps apply, and both are loaded — so the summary must not
    // read as though something is outstanding.
    expect(
      screen.getByText(/Nothing required by this contract type is outstanding/),
    ).toBeTruthy();
    expect(
      screen.getByText(/1 step does not apply to this contract type/),
    ).toBeTruthy();
    expect(screen.getByText(/Not applicable is a state/)).toBeTruthy();
  });

  it("renders a not-required step as a state, never as a missing one", () => {
    const { container } = render(
      <ContractEducationBriefing education={education()} />,
    );

    const observe = Array.from(container.querySelectorAll(".sw-c3-card")).find(
      (node) => node.textContent?.includes("Observe"),
    );
    expect(observe).toBeTruthy();
    expect(within(observe as HTMLElement).getByText("Not applicable")).toBeTruthy();
    expect(within(observe as HTMLElement).queryByText("Not loaded")).toBeNull();
  });

  it("names what is outstanding when an applicable step is not loaded", () => {
    const view = education({
      missingEvidence: ["document rows"],
      steps: [
        {
          key: "track",
          title: "Track",
          question: "Are workloads using what the contract commits?",
          guidance: "Track committed amount and actual spend each month.",
          evidence: "12 spend/usage rows",
          state: "loaded",
        },
        {
          key: "load",
          title: "Load",
          question: "What makes the consumption number defensible?",
          guidance: "Load the executed order and the billing export.",
          evidence: "0 document rows",
          state: "next",
        },
        {
          key: "observe",
          title: "Observe",
          question: "What should change before the next commercial gate?",
          guidance: "Watch utilization trend and the notice window.",
          evidence: "6 opportunity rows",
          state: "not_required",
        },
      ],
    });

    render(<ContractEducationBriefing education={view} />);

    expect(screen.getByText(/Outstanding: document rows/)).toBeTruthy();
  });
});
