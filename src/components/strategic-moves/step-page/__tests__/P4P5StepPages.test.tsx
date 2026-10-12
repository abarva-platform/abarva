/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import {
  previewMatchesApproval,
  readApprovedRomSnapshot,
  type ApprovedRomSnapshot,
} from "@/lib/pricing/moves-workflow/approved-rom-snapshot";
import { stepPageHref } from "@/lib/programs/step-page-views";
import { P4_STEP_PAGES } from "../p4-step-pages";
import { P5_STEP_PAGES } from "../p5-step-pages";
import type { StepPageHostProps } from "../phase-step-pages";
import { P5TowerHandoff, P5TowerPublicationReadback } from "../P5TowerHandoff";
import type { P5HandoffView } from "@/lib/programs/p5-measurement-plan";

jest.mock("../StepEvidence", () => ({
  useStepEvidence: () => ({
    rows: [],
    summary: "0 files reviewed",
    uploadControl: <button>Add session output</button>,
  }),
}));
jest.mock("@/lib/pricing/moves-workflow/approved-rom-snapshot", () => ({
  readApprovedRomSnapshot: jest.fn(),
  previewMatchesApproval: jest.fn().mockReturnValue(true),
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
    move: {
      id: "move-1",
      name: "Synthetic Move",
      tenant: { name: "Demo tenant" },
    } as StepPageHostProps["move"],
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
  global.fetch ??= jest.fn();
  jest.mocked(global.fetch).mockClear();
  jest.mocked(readApprovedRomSnapshot).mockReset();
  jest.mocked(readApprovedRomSnapshot).mockResolvedValue({ status: "missing" });
  jest.mocked(previewMatchesApproval).mockReset();
  jest.mocked(previewMatchesApproval).mockReturnValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Governed P5 publication UI", () => {
  const moveId = "11111111-1111-4111-a111-111111111111";
  const currentView = (published = false): P5HandoffView => ({
    ok: true,
    programId: moveId,
    binding: {
      tenantKey: "meridian-health",
      clientId: "22222222-2222-4222-a222-222222222222",
      moveId,
      contractId: "33333333-3333-4333-a333-333333333333",
      contractVersion: 2,
      contractHash: "a".repeat(64),
      planHash: "b".repeat(64),
      inputBasisHash: "c".repeat(64),
    },
    savedPlan: {
      kind: "p5_measurement_handoff",
      version: 1,
      measures: [
        {
          leverId: "L1",
          ownerUserId: "owner-1",
          ownerRole: "Measurement owner",
          sourceReference: "[A:V1] Source export",
          comparator: "Same cohort",
          method: "Unique claim reconciliation",
          cadence: "monthly",
          firstReviewTrigger: "Mature cohort",
          exclusionRules: "Credit collections once",
          openConditions: "Synthetic plan; access pending",
        },
      ],
    },
    owners: [{ userId: "owner-1", role: "Measurement owner" }],
    levers: [
      {
        leverId: "L1",
        name: "Synthetic avoided purchases",
        inCash: true,
        projectedUsd: 4000,
      },
    ],
    publication: {
      state: published ? "published" : "not_yet_linked",
      rowIds: published ? ["44444444-4444-5444-a444-444444444444"] : [],
    },
    detail: published
      ? "Planned handoff published and read back from Tower's outcome ledger."
      : "Review the current signed contract and saved plan.",
  });
  const response = (body: unknown, ok = true) =>
    ({ ok, json: async () => body }) as Response;

  it("keeps the publication surface absent with its flag off", () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(response({ assumptions: [] }));
    render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    expect(screen.queryByText("Review saved handoff")).not.toBeInTheDocument();
    expect(
      jest
        .mocked(fetch)
        .mock.calls.some(([url]) => String(url).endsWith("/tower-handoff")),
    ).toBe(false);
  });

  it("treats an unreadable register response as unknown rather than zero baselines", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(response({ invalid: true }));
    render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    await screen.findByText(
      "Register rows could not be read. No measurement baseline is claimed.",
    );
    expect(
      screen.queryByText(/0 confirmed register rows/),
    ).not.toBeInTheDocument();
  });

  it("mounts the flagged surface with the actual Move identity", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(response(currentView()));
    const input = host(5);
    input.p5TowerHandoffEnabled = true;
    input.move.id = moveId;
    render(page(P5_STEP_PAGES, "p5-measurement", input));
    expect(await screen.findByText("Review saved handoff")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      `/api/v1/programs/${moveId}/tower-handoff`,
      { credentials: "include" },
    );
  });

  it("accepts only the reviewed binding and links independent published readback", async () => {
    const view = currentView();
    const state = jest.fn();
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(response(view))
      .mockResolvedValueOnce(response(currentView(true)));
    render(
      <P5TowerHandoff
        moveId={moveId}
        value={JSON.stringify(view.savedPlan)}
        setValue={jest.fn()}
        canAccept
        onState={state}
      />,
    );
    const accept = await screen.findByRole("button", {
      name: "Accept planned Tower handoff",
    });
    expect(screen.getByLabelText("Receiving participant role")).toHaveValue(
      "owner-1|Measurement owner",
    );
    expect(screen.getByLabelText("Review cadence")).toHaveValue("monthly");
    fireEvent.click(accept);
    expect(
      await screen.findByRole("link", { name: "Read this Move in Tower" }),
    ).toHaveAttribute("href", `/strategic-moves/${moveId}/tower-handoff`);
    const init = jest.mocked(fetch).mock.calls[1][1]!;
    expect(JSON.parse(String(init.body))).toEqual({
      action: "accept_planned_handoff",
      binding: view.binding,
    });
    expect(init.method).toBe("POST");
    expect(state).toHaveBeenLastCalledWith(true);
  });

  it("withholds the current binding after editing, saves own words, and refuses stale product acceptance", async () => {
    const view = currentView();
    const setValue = jest.fn();
    jest.spyOn(global, "fetch").mockResolvedValue(response(view));
    render(
      <P5TowerHandoff
        moveId={moveId}
        value={JSON.stringify(view.savedPlan)}
        setValue={setValue}
        canAccept
      />,
    );
    await screen.findByRole("button", { name: "Accept planned Tower handoff" });
    fireEvent.change(screen.getByLabelText("Measurement method"), {
      target: { value: "Changed reconciliation" },
    });
    expect(
      screen.queryByRole("button", { name: "Accept planned Tower handoff" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Save measurement plan" }),
    );
    const saved = JSON.parse(setValue.mock.calls[0][1]);
    expect(saved.measures[0].method).toBe("Changed reconciliation");
    fireEvent.click(
      screen.getByRole("button", { name: "Review saved handoff" }),
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Review saved handoff" }),
      ).toBeEnabled(),
    );
    expect(
      screen.queryByRole("button", { name: "Accept planned Tower handoff" }),
    ).not.toBeInTheDocument();
    expect(
      jest
        .mocked(fetch)
        .mock.calls.every(([, init]) => init?.method !== "POST"),
    ).toBe(true);
  });

  it("read-only viewers cannot change definitions or accept", async () => {
    const view = currentView();
    jest.spyOn(global, "fetch").mockResolvedValue(response(view));
    render(
      <P5TowerHandoff
        moveId={moveId}
        value={JSON.stringify(view.savedPlan)}
        setValue={jest.fn()}
        canAccept={false}
      />,
    );
    expect(
      await screen.findByRole("button", {
        name: "Accept planned Tower handoff",
      }),
    ).toBeDisabled();
    expect(screen.getByLabelText("Measurement method")).toBeDisabled();
  });

  it("clears publication readiness when current acceptance refuses", async () => {
    const view = currentView();
    const state = jest.fn();
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(response(view))
      .mockResolvedValueOnce(
        response(
          { detail: "Signed contract changed; review the current version." },
          false,
        ),
      );
    render(
      <P5TowerHandoff
        moveId={moveId}
        value={JSON.stringify(view.savedPlan)}
        setValue={jest.fn()}
        canAccept
        onState={state}
      />,
    );
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Accept planned Tower handoff",
      }),
    );
    await screen.findByText(
      "Signed contract changed; review the current version.",
    );
    expect(state).toHaveBeenLastCalledWith(false);
    expect(
      screen.queryByRole("link", { name: "Read this Move in Tower" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Signed contract .*SHA-256/),
    ).not.toBeInTheDocument();
  });

  it.each(["wrong_move", "malformed_values", "failed_read"])(
    "Tower readback withholds amounts after %s",
    async (failure) => {
      const view = currentView(true);
      const foreignMoveId = "77777777-7777-4777-a777-777777777777";
      const body =
        failure === "wrong_move"
          ? {
              ...view,
              programId: foreignMoveId,
              binding: { ...view.binding!, moveId: foreignMoveId },
            }
          : failure === "malformed_values"
            ? { ...view, levers: [{ ...view.levers[0], projectedUsd: null }] }
            : { detail: "Ledger read unavailable; state unknown." };
      jest
        .spyOn(global, "fetch")
        .mockResolvedValue(response(body, failure !== "failed_read"));
      render(<P5TowerPublicationReadback moveId={moveId} />);
      await screen.findByText(
        failure === "failed_read"
          ? "Ledger read unavailable; state unknown."
          : "The handoff response does not match this Move. No publication is claimed.",
      );
      expect(screen.queryByText(/planned annual cash/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Ledger rows:/)).not.toBeInTheDocument();
    },
  );

  it("clears prior Move readback while a different Move loads and fails", async () => {
    let rejectNext!: (error: Error) => void;
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(response(currentView(true)))
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectNext = reject;
          }),
      );
    const component = render(<P5TowerPublicationReadback moveId={moveId} />);
    expect(await screen.findByText(/planned annual cash/)).toHaveTextContent(
      "$4,000.00",
    );
    component.rerender(<P5TowerPublicationReadback moveId="next-move" />);
    expect(screen.queryByText(/planned annual cash/)).not.toBeInTheDocument();
    rejectNext(new Error("Next Move read failed"));
    await screen.findByText("Next Move read failed");
    expect(screen.queryByText(/planned annual cash/)).not.toBeInTheDocument();
  });

  it("withholds prior Move amounts before the next passive read effect", async () => {
    const observations: string[] = [];
    function ObservedPanel({ id }: { id: string }) {
      const container = useRef<HTMLDivElement>(null);
      useLayoutEffect(() => {
        observations.push(container.current?.textContent ?? "");
      }, [id]);
      return (
        <div ref={container}>
          <P5TowerPublicationReadback moveId={id} />
        </div>
      );
    }
    jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(response(currentView(true)))
      .mockImplementationOnce(() => new Promise(() => {}));
    const component = render(<ObservedPanel id={moveId} />);
    await screen.findByText(/planned annual cash/);
    component.rerender(
      <ObservedPanel id="77777777-7777-4777-a777-777777777777" />,
    );
    expect(observations.at(-1)).not.toContain("$4,000.00");
    expect(observations.at(-1)).not.toContain("Ledger rows:");
  });
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
      status: "approved",
      snapshot: {
        id: "v1",
        approvedAt: "2026-10-10",
        workbookHref: "/api/v1/programs/move-1/rom/preview?format=xlsx",
        workbookStructure: {} as ApprovedRomSnapshot["workbookStructure"],
        result: {
          releases: [
            {
              code: "R1",
              name: "Release 1",
              lowCents: 84_000_000,
              planCents: 123_456_789,
              highCents: 150_000_000,
            },
          ],
        } as ApprovedRomSnapshot["result"],
      },
    });
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    await waitFor(() =>
      expect(screen.getByText(/Approved ROM snapshot v1/)).toBeInTheDocument(),
    );
    expect(screen.getByText(/APPROVED P3 estimate/)).toBeInTheDocument();
    expect(
      screen.getByText(/low \$0.84M · plan \$1.23M · high \$1.50M/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Download ROM workbook/ }),
    ).toBeEnabled();
    expect(
      screen.getByRole("status", { name: "What to do next" }),
    ).not.toHaveTextContent("Blocked");
  });

  it("shows a stale approval with a link back to P3 Step 4", async () => {
    jest.mocked(readApprovedRomSnapshot).mockResolvedValue({ status: "stale" });
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    await waitFor(() =>
      expect(
        screen.getByText(/P3 estimate approval is stale/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getAllByRole("link", { name: /P3 Step 4/ })[0],
    ).toHaveAttribute("href", stepPageHref("move-1", 3, "P3.4"));
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("keeps failed read distinct from no approval and offers retry", async () => {
    jest
      .mocked(readApprovedRomSnapshot)
      .mockResolvedValueOnce({ status: "failed" })
      .mockResolvedValueOnce({ status: "missing" });
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    await waitFor(() =>
      expect(
        screen.getByText(/Approved ROM snapshot could not be read/),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText(/No approved estimate yet/),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() =>
      expect(screen.getByText(/No approved estimate yet/)).toBeInTheDocument(),
    );
    expect(readApprovedRomSnapshot).toHaveBeenCalledTimes(2);
  });

  it("blocks workbook download when current ROM preview differs from the approved figures", async () => {
    const snapshot = {
      id: "v1",
      approvedAt: "2026-10-10",
      workbookHref: "/api/v1/programs/move-1/rom/preview?format=xlsx",
      workbookStructure: {
        useCases: [],
      } as unknown as ApprovedRomSnapshot["workbookStructure"],
      result: { releases: [] } as unknown as ApprovedRomSnapshot["result"],
    };
    jest
      .mocked(readApprovedRomSnapshot)
      .mockResolvedValue({ status: "approved", snapshot });
    jest.mocked(previewMatchesApproval).mockReturnValue(false);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rom: { ok: true } }),
    });
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    fireEvent.click(
      await screen.findByRole("button", { name: "Download ROM workbook" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /cost reference changed since approval/,
      ),
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/move-1/rom/preview",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rechecks the P3 approval before starting any workbook request", async () => {
    jest
      .mocked(readApprovedRomSnapshot)
      .mockResolvedValueOnce({
        status: "approved",
        snapshot: {
          id: "v1",
          approvedAt: "2026-10-10",
          workbookHref: "/api/v1/programs/move-1/rom/preview?format=xlsx",
          workbookStructure: {} as ApprovedRomSnapshot["workbookStructure"],
          result: {
            inputsFingerprint: "f1",
            releases: [],
          } as unknown as ApprovedRomSnapshot["result"],
        },
      })
      .mockResolvedValueOnce({ status: "stale" });
    global.fetch = jest.fn();
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    fireEvent.click(
      await screen.findByRole("button", { name: "Download ROM workbook" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /approval changed or could not be rechecked/,
      ),
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts the approved structure to the XLSX route after a matching preview", async () => {
    const structure = {
      useCases: [{ code: "UC1" }],
    } as unknown as ApprovedRomSnapshot["workbookStructure"];
    jest.mocked(readApprovedRomSnapshot).mockResolvedValue({
      status: "approved",
      snapshot: {
        id: "v1",
        approvedAt: "2026-10-10",
        workbookHref: "/api/v1/programs/move-1/rom/preview?format=xlsx",
        workbookStructure: structure,
        result: { releases: [] } as unknown as ApprovedRomSnapshot["result"],
      },
    });
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rom: { ok: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["xlsx"]),
      });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: jest.fn().mockReturnValue("blob:rom-workbook"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: jest.fn(),
    });
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(page(P4_STEP_PAGES, "p4-estimate", host(4)));
    fireEvent.click(
      await screen.findByRole("button", { name: "Download ROM workbook" }),
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/v1/programs/move-1/rom/preview?format=xlsx",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(structure),
      }),
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
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
    expect(screen.getByText(/plan \$1.23M/)).toBeInTheDocument();
    expect(screen.getByText(/NPV \$0.84M/)).toBeInTheDocument();
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

  it("withholds the previous Move's baselines while a different Move is loading", async () => {
    let finishFirstRead!: (value: unknown) => void;
    let finishSecondRead!: (value: unknown) => void;
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirstRead = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishSecondRead = resolve;
          }),
      );
    const { rerender } = render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    finishFirstRead({
      ok: true,
      json: async () => ({
        assumptions: [
          {
            id: "V-FIRST",
            statement: "First Move baseline",
            status: "confirmed",
          },
        ],
      }),
    });
    await screen.findByText(/\[A:V-FIRST\] First Move baseline/);

    const secondMove = host(5);
    secondMove.move = { ...secondMove.move, id: "move-2" };
    rerender(page(P5_STEP_PAGES, "p5-measurement", secondMove));
    expect(screen.queryByText(/\[A:V-FIRST\]/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Reading confirmed register rows…"),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/v1/programs/move-2/assumptions",
      expect.objectContaining({ credentials: "include" }),
    );
    finishSecondRead({
      ok: true,
      json: async () => ({
        assumptions: [
          {
            id: "V-SECOND",
            statement: "Second Move baseline",
            status: "confirmed",
          },
        ],
      }),
    });
    await screen.findByText(/\[A:V-SECOND\] Second Move baseline/);
    expect(screen.queryByText(/\[A:V-FIRST\]/)).not.toBeInTheDocument();
  });

  it("does not retain the previous Move's baselines when the next Move's read fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assumptions: [
            {
              id: "V-FIRST",
              statement: "First Move baseline",
              status: "confirmed",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: false });
    const { rerender } = render(page(P5_STEP_PAGES, "p5-measurement", host(5)));
    await screen.findByText(/\[A:V-FIRST\] First Move baseline/);
    const secondMove = host(5);
    secondMove.move = { ...secondMove.move, id: "move-2" };
    rerender(page(P5_STEP_PAGES, "p5-measurement", secondMove));
    await screen.findByText(/No measurement baseline is claimed/);
    expect(screen.queryByText(/\[A:V-FIRST\]/)).not.toBeInTheDocument();
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
