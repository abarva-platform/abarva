/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  readApprovedRomSnapshot,
  type ApprovedRomSnapshot,
} from "@/lib/pricing/moves-workflow/approved-rom-snapshot";
import { stepPageHref } from "@/lib/programs/step-page-views";
import { P4_STEP_PAGES } from "../p4-step-pages";
import { P5_STEP_PAGES } from "../p5-step-pages";
import type { StepPageHostProps } from "../phase-step-pages";

jest.mock("../StepEvidence", () => ({
  useStepEvidence: () => ({
    rows: [],
    summary: "0 files reviewed",
    uploadControl: <button>Add session output</button>,
  }),
}));
jest.mock("@/lib/pricing/moves-workflow/approved-rom-snapshot", () => ({
  readApprovedRomSnapshot: jest.fn(),
}));

function host(
  phase: 4 | 5,
  values: Record<string, string> = {},
  criteria: StepPageHostProps["gateProps"]["criteria"] = [],
): StepPageHostProps {
  const titles =
    phase === 4
      ? [
          "Workstreams & milestones",
          "Estimate & capacity",
          "Value plan & funding",
          "Tower metrics & handoff plan",
          "Risks, readiness & gate",
        ]
      : [
          "Handoff owners & readiness",
          "Tower measurement",
          "First 90 days & open items",
          "Handoff package & acceptance",
        ];
  return {
    move: { id: "move-1", name: "Synthetic Move" } as StepPageHostProps["move"],
    phase,
    values,
    setValue: jest.fn(),
    priorPhaseCapture: null,
    canApproveGates: true,
    currentUser: { email: "reviewer@example.test", role: "reviewer" },
    chrome: {
      stepIndex: 0,
      phaseHref: (p) => `/phase/${p}`,
      tabs: <nav>Steps · Files · Record</nav>,
      phases: [
        { code: `P${phase}`, name: "Phase", status: "Step 1", current: true },
      ],
      steps: titles.map((title) => ({ title, depth: "full" })),
    },
    stepDone: {},
    dock: (page: ReactNode) => page,
    gateProps: { criteria } as StepPageHostProps["gateProps"],
  };
}

function page(
  map: typeof P4_STEP_PAGES,
  view: keyof typeof P4_STEP_PAGES,
  props: StepPageHostProps,
) {
  const Page = map[view];
  if (!Page) throw new Error(`${view} was not mounted`);
  const stepIndex = Object.keys(map).indexOf(view);
  return <>{Page({ ...props, chrome: { ...props.chrome, stepIndex } })}</>;
}

beforeEach(() => {
  jest.mocked(readApprovedRomSnapshot).mockResolvedValue(null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("P4 and P5 step pages", () => {
  it("mounts only the seven non-gate views in their phase slots", () => {
    expect(Object.keys(P4_STEP_PAGES)).toEqual([
      "p4-milestones",
      "p4-estimate",
      "p4-value",
      "p4-tower",
    ]);
    expect(Object.keys(P5_STEP_PAGES)).toEqual([
      "p5-owners",
      "p5-measurement",
      "p5-first-90",
    ]);
    expect(P4_STEP_PAGES["p4-gate"]).toBeUndefined();
    expect(P5_STEP_PAGES["p5-handoff"]).toBeUndefined();
  });

  it("keeps a text answer open until the person saves it, then shows the ready state", () => {
    const props = host(4);
    const { rerender } = render(page(P4_STEP_PAGES, "p4-tower", props));
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).toHaveTextContent("Record the Tower handoff plan");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/measurement owner role/i), {
      target: { value: "Tower lead reviews the evidence monthly." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(props.setValue).toHaveBeenCalledWith(
      "handoff_plan",
      "Tower lead reviews the evidence monthly.",
    );
    rerender(
      page(P4_STEP_PAGES, "p4-tower", {
        ...props,
        values: { handoff_plan: "Tower lead reviews the evidence monthly." },
      }),
    );
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).toHaveTextContent("Ready");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("uses the host's actual depth without asserting a session state", () => {
    const props = host(4);
    props.chrome.steps[3].depth = "light";
    render(page(P4_STEP_PAGES, "p4-tower", props));
    expect(screen.getByText("Light depth")).toBeInTheDocument();
    expect(screen.queryByText(/No session linked/)).not.toBeInTheDocument();
    expect(screen.queryByText(/from the P2 route/)).not.toBeInTheDocument();
  });

  it("keeps P4.1 open when its milestone read returns zero rows", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ milestones: [] }) });
    render(
      page(
        P4_STEP_PAGES,
        "p4-milestones",
        host(4, { roadmap_sequencing: "Sequence approved by the team." }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/0 milestones recorded/)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Ready");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("settles the milestone row only after the route returns a milestone", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        milestones: [{ id: "m1", name: "Design signoff" }],
      }),
    });
    render(
      page(
        P4_STEP_PAGES,
        "p4-milestones",
        host(4, { roadmap_sequencing: "Sequence approved by the team." }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/1 milestone recorded/)).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).toHaveTextContent("Ready");
  });

  it("names the absent approved ROM basis and keeps estimate review human", async () => {
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    await waitFor(() =>
      expect(screen.getByText(/No approved estimate yet/)).toBeInTheDocument(),
    );
    expect(
      screen.getAllByRole("link", { name: /P3 Step 4/ })[0],
    ).toHaveAttribute("href", stepPageHref("move-1", 3, "P3.4"));
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).toHaveTextContent("Blocked");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows an approved ROM basis and removes the outside block when supplied", async () => {
    jest.mocked(readApprovedRomSnapshot).mockResolvedValue({
      id: "rom-1",
      approvedAt: "2026-10-10",
      workbookHref: "/workbooks/rom-1",
      result: {
        releases: [
          {
            code: "R1",
            name: "Release 1",
            standalone: {
              lowCents: 84_000_000,
              planCents: 123_456_789,
              highCents: 150_000_000,
            },
          },
        ],
      } as unknown as ApprovedRomSnapshot["result"],
    });
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    await waitFor(() =>
      expect(
        screen.getByText(/Approved ROM snapshot rom-1/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/low \$840K · plan \$1.2M · high \$1.5M/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Open ROM workbook/ }),
    ).toHaveAttribute("href", "/workbooks/rom-1");
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Blocked");
  });

  it("shows unavailable value-case readback without presenting client figures", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    render(page(P4_STEP_PAGES, "p4-value", host(4)));
    await waitFor(() =>
      expect(screen.getByText(/Value case unavailable/)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/Legacy text is not an engine result/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("shows engine-supplied value statuses and source terms without calculating money", async () => {
    const valuePlan = JSON.stringify({
      kind: "value_model",
      version: 1,
      case: {
        levers: [
          {
            id: "L1",
            name: "Hours saved",
            conversion: "non_cash",
            driver: {
              name: "hours",
              unit: "hours",
              direction: "increase",
              baseline: { kind: "literal", value: 0, source: "synthetic" },
              target: { kind: "literal", value: 10, source: "synthetic" },
            },
            terms: [{ role: "driver_delta" }],
            attribution: { kind: "register", registerId: "V3" },
            probability: { kind: "register", registerId: "V4" },
            timing: { startMonth: 1, rampMonths: 0, paymentLagMonths: 0 },
          },
        ],
        horizonYears: 2,
        discountRate: { kind: "literal", value: 0.08, source: "synthetic" },
        cost: { kind: "estimate", baseCents: 10_000_000 },
      },
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          status: "evaluated",
          levers: [
            {
              leverId: "L1",
              name: "Hours saved",
              status: "zero_no_release_path",
              terms: { base: [{ source: "register:V3", label: "Hours" }] },
            },
          ],
          economics: {
            npvCents: { low: 84_000_000, base: 123_456_789, high: 150_000_000 },
            npvTerms: { base: [{ source: "register:V3", label: "Hours" }] },
            paybackMonth: { base: null },
          },
          breakeven: [{ leverId: "L1", status: "solved", breakevenDelta: 5 }],
          sensitivity: [
            {
              key: "L1.driver",
              label: "Hours",
              side: "high",
              npvCents: 84_000_000,
            },
          ],
        },
      }),
    });
    render(page(P4_STEP_PAGES, "p4-value", host(4, { value_plan: valuePlan })));
    await waitFor(() =>
      expect(screen.getByText(/\$0: no release path/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/plan \$1.2M/)).toBeInTheDocument();
    expect(screen.getByText(/NPV \$840K/)).toBeInTheDocument();
    expect(screen.getByText(/driver delta 5 hours/)).toBeInTheDocument();
    expect(screen.getAllByText(/register:V3/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Estimate").length).toBeGreaterThan(0);
  });

  it("shows evaluator status beside P5 text rather than implying the hard check passed", () => {
    const props = host(
      5,
      {
        mobilization_plan: "Operations lead receives the package.",
        launch_readiness: "Entry criteria documented.",
      },
      [
        {
          id: "launch_readiness_attested",
          label: "Launch readiness attested",
          severity: "hard",
          completed: false,
          verified: true,
        },
      ],
    );
    render(page(P5_STEP_PAGES, "p5-owners", props));
    expect(screen.getByText("Launch readiness attested")).toBeInTheDocument();
    expect(screen.getByLabelText("not met")).toBeInTheDocument();
    expect(screen.getByText(/Tower handoff/)).toBeInTheDocument();
  });

  it("keeps Tower baselines read-only and withholds them on failed register readback", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    await waitFor(() =>
      expect(
        screen.getByText(/No measurement baseline is claimed/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/does not start measurement or execution/),
    ).toBeInTheDocument();
  });

  it("uses confirmed register rows as read-only Tower baseline proposals", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        assumptions: [
          {
            id: "V3",
            statement: "Hours saved",
            workingFigure: "10 hours",
            source: "session notes, p.2",
            status: "confirmed",
            figuresRedacted: false,
          },
          {
            id: "V4",
            statement: "Open working figure",
            workingFigure: "20 hours",
            source: "working note",
            status: "open",
            figuresRedacted: false,
          },
        ],
      }),
    });
    render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    await waitFor(() =>
      expect(screen.getByText(/\[A:V3\] Hours saved/)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/\[A:V4\]/)).not.toBeInTheDocument();
    expect(screen.getByText(/10 hours/)).toBeInTheDocument();
  });

  it("keeps a note-derived answer in review until the person accepts it", () => {
    const props = host(5);
    props.dock = (content, options) => (
      <>
        {content}
        {options.notesPanel}
      </>
    );
    render(page(P5_STEP_PAGES, "p5-owners", props));
    fireEvent.click(screen.getByRole("button", { name: "Paste client notes" }));
    fireEvent.change(screen.getByLabelText("Client notes"), {
      target: {
        value:
          "- Mobilization plan names the operations owner role for handoff.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Propose fills" }));
    fireEvent.click(
      screen.getByTestId("capture-notes-insert-mobilization_plan"),
    );
    expect(screen.getByText("Session notes · review")).toBeInTheDocument();
    expect(
      screen.getByText(/From pasted session notes, line 1/),
    ).toBeInTheDocument();
    expect(props.setValue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Accept" }));
    expect(props.setValue).toHaveBeenCalledWith(
      "mobilization_plan",
      "Mobilization plan names the operations owner role for handoff.",
    );
  });
});
