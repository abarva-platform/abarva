/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { P2_STEP_PAGES } from "@/components/strategic-moves/step-page/p2-step-pages";
import type { StepPageHostProps } from "@/components/strategic-moves/step-page/phase-step-pages";
import type { MoveEvidenceNeedPacket } from "../evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "../current-state-readiness";
import type { AssumptionView } from "../assumption-register/register-request";
import { P2_HARD_CHECK_IDS } from "../p2-step-readiness";
import { useStepEvidence } from "@/components/strategic-moves/step-page/StepEvidence";

jest.mock("@/components/strategic-moves/step-page/StepEvidence", () => ({
  useStepEvidence: jest.fn(() => ({
    rows: [],
    summary: "Evidence review read",
    uploadControl: <button>Upload evidence</button>,
    pending: [],
    loaded: true,
    readable: true,
  })),
}));

const criteria = (open?: string) =>
  P2_HARD_CHECK_IDS.map((id) => ({
    id,
    label: id.replaceAll("_", " "),
    severity: "hard" as const,
    verified: true,
    completed: id !== open,
  }));

function host(open?: string): StepPageHostProps {
  return {
    move: { id: "move-1", name: "Synthetic Move" } as StepPageHostProps["move"],
    phase: 2,
    values: {},
    setValue: jest.fn(),
    priorPhaseCapture: null,
    canApproveGates: true,
    currentUser: { email: "reviewer@example.test", role: "reviewer" },
    chrome: {
      stepIndex: 0,
      phaseHref: () => "/strategic-moves/move-1/phase/2",
      tabs: <nav>Steps · Files · Record</nav>,
      phases: [
        { code: "P2", name: "Discover", status: "Step 1", current: true },
      ],
      steps: [
        "Evidence plan",
        "Baseline",
        "Root causes",
        "Validate hypotheses",
        "Gate readiness",
      ].map((title) => ({ title, depth: "full" })),
    },
    stepDone: {},
    dock: (page: ReactNode, options) => (
      <>
        {page}
        {options.notesPanel}
      </>
    ),
    gateProps: {
      criteria: criteria(open),
      moveName: "Synthetic Move",
    } as unknown as StepPageHostProps["gateProps"],
    p2Evidence: {
      packets: [
        {
          phase: 2,
          priority: "required",
          status: "covered",
          familyId: "baseline",
          evidenceSlot: "Baseline",
          evidenceTitles: ["Approved source"],
          nextAction: "Review the baseline source.",
        },
      ] as MoveEvidenceNeedPacket[],
      readiness: { hardGaps: [] } as unknown as ReadinessReport,
      readable: true,
      approvedReferences: [
        { evidenceId: "evidence-uuid", title: "Approved source" },
      ],
      registerIds: ["B1"],
      registerRows: [
        {
          id: "row-1",
          registerId: "B1",
          status: "confirmed",
          statement: "Planning baseline",
          workingFigure: "30%",
          figuresRedacted: false,
          source: "Workshop assumption",
        },
      ] as AssumptionView[],
      confirmedRoute: null,
      routeEditor: <div>Existing structured route editor</div>,
    },
  };
}

function page(view: keyof typeof P2_STEP_PAGES, props: StepPageHostProps) {
  const Page = P2_STEP_PAGES[view];
  if (!Page) throw new Error("P2 page is missing");
  const stepIndex = [
    "p2-evidence-plan",
    "p2-baseline",
    "root-causes",
    "p2-validate",
  ].indexOf(view);
  return <>{Page({ ...props, chrome: { ...props.chrome, stepIndex } })}</>;
}

describe("P2 step pages", () => {
  it("keeps approved packet coverage separate from report readiness", () => {
    render(page("p2-evidence-plan", host("p2_readiness_cleared")));
    expect(
      screen.getByText(/1 of 1 required needs approved/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Ready");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("links required missing needs to the real Files & Evidence route", () => {
    const props = host();
    props.p2Evidence = {
      ...props.p2Evidence!,
      packets: [{ ...props.p2Evidence!.packets[0], status: "missing" }],
    };
    render(page("p2-evidence-plan", props));
    fireEvent.click(screen.getByText("Review need and gap owner"));
    expect(
      screen.getByRole("link", { name: /Open Files & Evidence/ }),
    ).toHaveAttribute("href", "/strategic-moves/move-1/evidence");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("binds in-step uploads to the selected governed evidence family", () => {
    const props = host();
    props.p2Evidence = {
      ...props.p2Evidence!,
      packets: [
        { ...props.p2Evidence!.packets[0], familyId: "first" },
        { ...props.p2Evidence!.packets[0], familyId: "second" },
      ],
    };
    render(page("p2-evidence-plan", props));
    expect(jest.mocked(useStepEvidence)).toHaveBeenLastCalledWith(
      expect.objectContaining({ uploadEvidenceFamily: "first" }),
    );
    fireEvent.change(screen.getByLabelText("Evidence need for upload"), {
      target: { value: "second" },
    });
    expect(jest.mocked(useStepEvidence)).toHaveBeenLastCalledWith(
      expect.objectContaining({ uploadEvidenceFamily: "second" }),
    );
  });

  it("saves a gap owner role without treating a person or acknowledgement as approval", () => {
    const props = host("p2_readiness_cleared");
    props.p2Evidence = {
      ...props.p2Evidence!,
      packets: [{ ...props.p2Evidence!.packets[0], status: "missing" }],
    };
    render(page("p2-evidence-plan", props));
    fireEvent.click(screen.getByText("Review need and gap owner"));
    fireEvent.change(screen.getByPlaceholderText("Data steward role"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save owner role" }));
    expect(screen.getByRole("alert")).toHaveTextContent("not a person");
    expect(props.setValue).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("Data steward role"), {
      target: { value: "Data stewardship team" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save owner role" }));
    expect(props.setValue).toHaveBeenCalledWith(
      "p2_evidence_plan_step",
      expect.stringContaining("Data stewardship team"),
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows the ordered evidence citations and confirmed register rows without calling them attestation", () => {
    const props = host();
    props.values = {
      current_state_findings: "12 of 40 [E:1].",
      baseline_metrics:
        '[{"metric":"Coverage","value":"30%","source":"[A:B1]"}]',
    };
    props.chrome.stepIndex = 1;
    render(page("p2-baseline", props));
    expect(screen.getByText("[E:1]")).toBeInTheDocument();
    expect(screen.getByText(/Approved source/)).toBeInTheDocument();
    expect(screen.getByText(/\[A:B1\] Planning baseline/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open Assumptions register/ }),
    ).toHaveAttribute(
      "href",
      "/strategic-moves/move-1/phase/2?workspace=intelligence",
    );
  });

  it("keeps a persisted but invalid findings section open despite stale met gate readback", () => {
    const props = host();
    props.values = {
      current_state_findings: "12 of 40 [E:1].",
      baseline_metrics:
        '[{"metric":"Coverage","value":"30%","source":"[A:B1]"}]',
    };
    props.sectionReady = {
      current_state_findings: false,
      baseline_metrics: true,
    };
    props.chrome.stepIndex = 1;
    render(page("p2-baseline", props));
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Ready");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("holds an uncited numeric finding at save and accepts a resolvable evidence citation", () => {
    const props = host("discovery_baseline_attested");
    props.chrome.stepIndex = 1;
    render(page("p2-baseline", props));
    const field = screen.getByPlaceholderText(
      "State the team's observed finding and cite figures [E:n] or [A:ID].",
    );
    fireEvent.change(field, { target: { value: "12 of 40 records." } });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    fireEvent.change(field, {
      target: { value: "12 of 40 records [E:1]." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(props.setValue).toHaveBeenCalledWith(
      "current_state_findings",
      "12 of 40 records [E:1].",
    );
    expect(props.setValue).toHaveBeenCalledWith(
      "p2_baseline_step",
      expect.stringContaining("12 of 40 records [E:1]."),
    );
  });

  it("stores only the team's metric words in the step record", () => {
    const props = host();
    props.chrome.stepIndex = 1;
    render(page("p2-baseline", props));
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "P2 baseline metrics — metric, row 1",
      }),
      { target: { value: "Coverage" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "P2 baseline metrics — value, row 1",
      }),
      { target: { value: "30%" } },
    );
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "P2 baseline metrics — source, row 1",
      }),
      { target: { value: "[A:B1]" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save baselines" }));
    expect(props.setValue).toHaveBeenCalledWith(
      "p2_baseline_step",
      expect.stringContaining("Coverage · 30% · [A:B1]"),
    );
    const recordCall = jest
      .mocked(props.setValue)
      .mock.calls.find(([key]) => key === "p2_baseline_step");
    expect(recordCall?.[1]).not.toContain('\\"metric\\"');
  });

  it("reuses the host's structured route editor and keeps the evaluator verdict visible", () => {
    const props = host("solution_route_validated");
    props.chrome.stepIndex = 3;
    render(page("p2-validate", props));
    expect(
      screen.getByText("Existing structured route editor"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No governed route is confirmed yet/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("holds a met route check open when the confirmed route readback is missing", () => {
    const props = host();
    props.chrome.stepIndex = 3;
    render(page("p2-validate", props));
    expect(
      screen.getByText(/The gate evaluator reports this check met/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Ready");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });
});
