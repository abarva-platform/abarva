/**
 * @jest-environment jsdom
 *
 * P3 Step 4 on the `rom_estimate` record: every row's states (counts, unit
 * hours, pod, factors, releases), the no-default rendering of an open unit
 * hour, the provisional line and the results table from the ROM preview
 * route (the page computes nothing), the workbook download call, the
 * approval flow, the compact register group, a failed register read, a
 * refused estimate, the withheld viewer, the blocked state and the notes
 * fill. Synthetic fixtures only.
 */

import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { RomEstimateStep, type RomEstimateStepProps } from "../RomEstimateStep";
import type { StepAvaAction } from "../RootCausesStep";
import {
  approveMapping,
  approveRomEstimate,
  acceptReleases,
  buildRomStructure,
  confirmCounts,
  emptyRomEstimate,
  parseRomEstimate,
  serializeRomEstimate,
  type RomEstimate,
  type RomRegisterRow,
} from "@/lib/programs/rom-estimate";
import type { RomResult } from "@/lib/pricing/moves-workflow/rom-service";

const AT = "2026-10-16";
const view = (
  registerId: string,
  status: RomRegisterRow["status"],
  extra: Partial<RomRegisterRow> = {},
) => ({
  registerId,
  status,
  statement: `Statement ${registerId}`,
  whyItMatters: `Why ${registerId} matters`,
  workingFigure: null,
  workingValue: null,
  source: "Delivery notes, Oct 16",
  confidence: 3,
  ownerRole: "Delivery lead",
  answer: null,
  answerFigure: null,
  answerValue: null,
  answerSource: null,
  figuresRedacted: false,
  ...extra,
});
const REGISTER = [
  view("DL1", "confirmed", {
    workingFigure: "24 h per source",
    workingValue: 24,
    answer: "Confirmed at 24 h",
    answerSource: "Benchmark, Oct 12",
  }),
  view("DL2", "confirmed", { workingFigure: "6 h per table", workingValue: 6 }),
  view("DL3", "open", {
    workingFigure: "~20 h per view",
    workingValue: 20,
    ownerRole: "BI lead",
    confidence: 1,
  }),
  view("DL4", "confirmed", { workingFigure: "×1.10", workingValue: 1.1 }),
  view("DL5", "corrected", {
    workingFigure: "1.5 h per row",
    workingValue: 1.5,
    answerValue: 2,
  }),
];
const REGISTER_ANSWERED = REGISTER.map((r) =>
  r.registerId === "DL3"
    ? { ...r, status: "confirmed" as const, answerValue: 20 }
    : r,
);

function fixture(): RomEstimate {
  return {
    ...emptyRomEstimate(),
    useCases: [
      {
        code: "UC-1",
        name: "Certified measure layer",
        counts: {
          data_source_count: 4,
          source_table_count: 18,
          dashboard_view_count: 4,
          design_row_count: 40,
        },
        source: { kind: "team" },
        confirmedBy: "me",
        confirmedAt: AT,
      },
      {
        code: "UC-2",
        name: "Lineage and controlled serving",
        counts: {
          data_source_count: 6,
          source_table_count: 30,
          dashboard_view_count: 2,
        },
        source: {
          kind: "session_notes",
          citation: "delivery notes, Oct 16, p.2",
          excerpt: "UC-2 is about 6 sources",
        },
      },
      {
        code: "UC-3",
        name: "Purpose-bound access",
        counts: {
          data_source_count: 3,
          source_table_count: 10,
          dashboard_view_count: 1,
        },
        source: {
          kind: "session_notes",
          citation: "delivery notes, Oct 16, p.2",
          excerpt: "UC-3 is 3 sources",
        },
      },
    ],
    foundation: {
      code: "FOUNDATION",
      name: "Shared foundation",
      counts: { source_table_count: 12, design_row_count: 25 },
      source: { kind: "team" },
      confirmedBy: "me",
      confirmedAt: AT,
    },
    unitHours: {
      data_source_count: { kind: "register", registerId: "DL1" },
      source_table_count: { kind: "register", registerId: "DL2" },
      standard_data_entity_count: {
        kind: "benchmark",
        benchmarkId: "BM-ENT-01",
        value: 16,
        confidence: "high",
        approvedBy: "lead",
        approvedAt: AT,
      },
      dashboard_view_count: { kind: "register", registerId: "DL3" },
      design_row_count: { kind: "register", registerId: "DL5" },
    },
    pod: {
      members: [
        {
          roleCode: "ROL-LEAD",
          roleLabel: "Engagement lead",
          levelCode: "LVL-P",
          levelLabel: "Principal",
          fte: 0.25,
        },
        {
          roleCode: "ROL-DE",
          roleLabel: "Data engineer",
          levelCode: "LVL-S",
          levelLabel: "Senior",
          fte: 2,
          levelClamp: {
            from: "Lead",
            reason: "the rate foundation has no nearshore Lead rate",
          },
        },
        {
          roleCode: "ROL-AE",
          roleLabel: "Analytics engineer",
          levelCode: "LVL-M",
          levelLabel: "Mid",
          fte: 1,
          proposedMapping: { from: "BI developer" },
        },
      ],
      locationCode: "LOC-NEAR",
      locationLabel: "Nearshore",
      providerClassCode: "PRV-DP",
      providerClassLabel: "Delivery partner",
      rateBasis: "loaded_cost",
    },
    friction: { value: 1.1, source: "[A:DL4] confirmed" },
    productiveShare: { value: 0.65, source: "approved benchmark BM-PROD-02" },
    hoursPerFteWeek: { value: 40, source: "40-hour week per allocated FTE" },
    releases: {
      items: [
        {
          code: "R1",
          name: "Pilot · certified measures",
          useCaseCodes: ["UC-1"],
          designStatus: "not_designed",
          carriesFoundation: true,
        },
        {
          code: "R2",
          name: "Scale · lineage and access",
          useCaseCodes: ["UC-2", "UC-3"],
          designStatus: "not_designed",
        },
      ],
      source: {
        kind: "session_notes",
        citation: "delivery notes, Oct 16, p.4",
        excerpt: "Pilot first, then scale.",
      },
    },
  };
}
const ok = (e: { ok: boolean; value?: RomEstimate; reason?: string }) => {
  if (!e.ok || !e.value) throw new Error(e.reason);
  return e.value;
};
function settledRecord(): RomEstimate {
  let r = fixture();
  r = ok(confirmCounts(r, "UC-2", "me", AT));
  r = ok(confirmCounts(r, "UC-3", "me", AT));
  r = ok(approveMapping(r, "ROL-AE", "me", AT));
  return ok(acceptReleases(r, "me", AT));
}

/** A result shaped like the ROM service's for a posted structure. Its figures are fixtures. */
function fakeRom(structure: unknown): RomResult {
  const lines = [24500, 9500, 8500].map((cents) => ({
    rate: { hourlyRateCents: cents },
  }));
  const block = (
    code: string,
    name: string,
    hours: number,
    weeks: number,
    plan: number,
  ) => ({
    kind: "release",
    code,
    name,
    designStatus: "not_designed",
    hours,
    weeks,
    pod: { memberLines: lines },
    range: {
      basis: "named",
      policyCode: "ROM-NOT-DESIGNED",
      score: null,
      lowMultiplier: 0.75,
      highMultiplier: 1.5,
      lowCents: plan * 0.75,
      planCents: plan,
      highCents: plan * 1.5,
    },
  });
  return {
    ok: true,
    structure,
    pod: { members: [] },
    releases: [
      {
        code: "R1",
        name: "Pilot · certified measures",
        own: block("R1", "Pilot · certified measures", 410.4, 5, 8_000_000),
      },
      {
        code: "R2",
        name: "Scale · lineage and access",
        own: block("R2", "Scale · lineage and access", 520, 6, 9_600_000),
      },
    ],
    foundation: {
      priced: block("FOUNDATION", "Shared foundation", 300, 4, 6_400_000),
      sharedByReleaseCodes: ["R1"],
    },
    total: {
      hours: 1230.4,
      weeks: 15,
      lowCents: 18_000_000,
      planCents: 24_000_000,
      highCents: 36_000_000,
    },
  } as unknown as RomResult;
}

type Route = (
  url: string,
  init?: RequestInit,
) => { status: number; body?: unknown; blob?: Blob } | undefined;
let fetchMock: jest.Mock;
function mockFetch(
  opts: {
    register?: unknown[];
    registerStatus?: number;
    redacted?: boolean;
    preview?: Route;
  } = {},
) {
  fetchMock = jest.fn(async (url: string, init?: RequestInit) => {
    const reply = (status: number, body: unknown, blob?: Blob) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      blob: async () => blob ?? new Blob(["xlsx"]),
    });
    if (url.endsWith("/assumptions")) {
      return opts.registerStatus
        ? reply(opts.registerStatus, {
            error: "register_read_failed",
            detail: "The register could not be read just now.",
          })
        : reply(200, {
            ok: true,
            assumptions: opts.register ?? REGISTER,
            figuresRedacted: opts.redacted === true,
            canEdit: true,
          });
    }
    if (url.includes("/rom/preview")) {
      const custom = opts.preview?.(url, init);
      if (custom) return reply(custom.status, custom.body, custom.blob);
      return reply(200, {
        ok: true,
        writes: false,
        rom: fakeRom(JSON.parse(String(init?.body))),
      });
    }
    return reply(200, { items: [] });
  });
  (global as { fetch?: unknown }).fetch = fetchMock;
}

type Dock = {
  briefing: string;
  actions: StepAvaAction[];
  notesPanel: ReactNode;
};
const frameSpy = jest.fn<void, [Dock]>();
const dockNow = (): Dock =>
  frameSpy.mock.calls[frameSpy.mock.calls.length - 1][0];
let saved: string[] = [];

function Harness({
  initial = serializeRomEstimate(fixture()),
  ...rest
}: Partial<RomEstimateStepProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <RomEstimateStep
      moveId="move-1"
      canReviewEvidence
      moveName="Governed data foundation"
      clientDisplayName="Demo tenant"
      phases={[{ code: "P3", name: "Design", status: "", current: true }]}
      steps={[
        { title: "Root cause → design", depth: "full", done: true },
        { title: "Architecture options", depth: "full", done: true },
        { title: "Operating & adoption", depth: "full" },
        { title: "Delivery & estimate", depth: "full" },
        { title: "Gate readiness", depth: "full" },
      ]}
      stepIndex={3}
      value={value}
      onChange={(next) => {
        saved.push(next);
        setValue(next);
      }}
      step2Done
      step2Href="/step2"
      registerAnswerHref={(id) => `/register#assumption-${id}`}
      decidedBy="me"
      today={AT}
      frame={(page, d) => {
        frameSpy(d);
        return (
          <div>
            {page}
            <div>{d.notesPanel}</div>
          </div>
        );
      }}
      {...rest}
    />
  );
}

beforeEach(() => {
  saved = [];
  frameSpy.mockClear();
  mockFetch();
});
afterEach(() => {
  cleanup();
  (global as { fetch?: unknown }).fetch = undefined;
});

const last = () => parseRomEstimate(saved[saved.length - 1])!;
const next = (c: HTMLElement) =>
  c.querySelector('section[aria-label="What to do next"]') as HTMLElement;
const row = (c: HTMLElement, id: string) =>
  c.querySelector(`#row-${id}`) as HTMLElement;
const unit = (c: HTMLElement, driver: string) =>
  c.querySelector(`#unit-${driver}`) as HTMLElement;
const isDisabled = (el: Element | null) =>
  (el as HTMLButtonElement | null)?.disabled;
const previewCalls = () =>
  fetchMock.mock.calls.filter(([u]) => String(u).includes("/rom/preview"));
const estimateReady = (c: HTMLElement) =>
  waitFor(() => expect(row(c, "EST").querySelector("table")).not.toBeNull());

describe("RomEstimateStep", () => {
  it("opens with the next action in row order, the input count and the open count", async () => {
    const { container } = render(<Harness />);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Estimate the work bottom-up",
    );
    // Until the register read settles, the unit hours are not called unreadable.
    expect(next(container).textContent).toContain(
      "check the unit hours once the register loads",
    );
    await waitFor(() =>
      expect(next(container).textContent).toContain(
        "Confirm counts for 2 use cases; answer A:DL3 to set dashboard view hours; 2 more below.",
      ),
    );
    expect(next(container).textContent).toContain("0 of 4 inputs confirmed");
    expect(container.querySelector("footer")?.textContent).toContain(
      "Step 4 of 5 · 6 still open",
    );
    await estimateReady(container);
  });

  it("shows confirmed counts read-only and session-note counts as editable drafts with their citation", async () => {
    const { container } = render(<Harness />);
    const grid = within(row(container, "CNT"));
    const rows = row(container, "CNT").querySelectorAll("table tbody tr");
    expect(rows[0].textContent).toContain("UC-1 · Certified measure layer");
    expect(rows[0].textContent).toContain("Confirmed by you");
    expect(rows[0].querySelector("input")).toBeNull();
    expect(rows[1].textContent).toContain("Session notes · review");
    expect(rows[1].textContent).toContain("From delivery notes, Oct 16, p.2");
    expect(rows[3].textContent).toContain("Counted once, in R1");
    fireEvent.change(grid.getAllByLabelText("Data sources for UC-2")[0], {
      target: { value: "7" },
    });
    expect(last().useCases[1].counts.data_source_count).toBe(7);
    fireEvent.click(
      grid.getAllByRole("button", { name: "Confirm counts for UC-2" })[0],
    );
    expect(last().useCases[1]).toMatchObject({
      confirmedBy: "me",
      confirmedAt: AT,
    });
    expect(next(container).textContent).toContain(
      "Confirm counts for 1 use case;",
    );
    await estimateReady(container);
  });

  it("reads an open unit hour as Not set, names its register row, and uses no default", async () => {
    const { container } = render(<Harness />);
    await estimateReady(container);
    const views = unit(container, "dashboard_view_count");
    expect(views.textContent).toContain(
      "Not set. Needs A:DL3, still open with the BI lead. Its working figure (~20 h per view) is used only to show the provisional estimate. No default is used.",
    );
    expect(
      within(views)
        .getByRole("link", { name: "Answer A:DL3…" })
        .getAttribute("href"),
    ).toBe("/register#assumption-DL3");
    expect(views.textContent).not.toContain("Estimate");
    expect(unit(container, "data_source_count").textContent).toBe(
      "Data sourcesEstimate24 h per data source · [A:DL1] confirmed · Delivery lead · Medium confidence",
    );
    expect(unit(container, "standard_data_entity_count").textContent).toContain(
      "16 h per standard data entity · Approved benchmark BM-ENT-01 · High confidence",
    );
    expect(unit(container, "design_row_count").textContent).toContain(
      "2 h per design row · [A:DL5] corrected",
    );
    expect(unit(container, "validation_row_count").textContent).toContain(
      "Not needed yet: nothing counts validation rows.",
    );
  });

  it("reads a counted driver with no reference as Not set, and references a register row", async () => {
    const r = fixture();
    r.useCases[1].counts.validation_row_count = 80;
    const { container } = render(<Harness initial={serializeRomEstimate(r)} />);
    await waitFor(() =>
      expect(
        within(unit(container, "validation_row_count")).getByRole("button", {
          name: "Reference a register row…",
        }),
      ).toBeTruthy(),
    );
    const line = unit(container, "validation_row_count");
    expect(line.textContent).toContain(
      "Not set. No register row or approved benchmark is referenced. No default is used.",
    );
    expect(row(container, "EST").textContent).toContain(
      "Nothing is computed while validation row hours have no figure. No default is used.",
    );
    fireEvent.click(
      within(line).getByRole("button", { name: "Reference a register row…" }),
    );
    const save = within(line).getByRole("button", { name: "Save" });
    expect(isDisabled(save)).toBe(true);
    fireEvent.change(
      within(line).getByLabelText("Register row for validation row hours"),
      { target: { value: "DL2" } },
    );
    fireEvent.click(save);
    expect(last().unitHours.validation_row_count).toEqual({
      kind: "register",
      registerId: "DL2",
    });
  });

  it("shows the pod with flags only on affected members, rates from the service, and approves a mapping", async () => {
    const { container } = render(<Harness />);
    await estimateReady(container);
    const pod = row(container, "POD");
    const members = pod.querySelectorAll("table tbody tr");
    expect(members[0].textContent).toBe(
      "Engagement leadPrincipalNearshoreDelivery partner$245/h25%",
    );
    expect(members[0].querySelector(`.flag`)).toBeNull();
    expect(members[1].textContent).toContain(
      "Level clamped: Lead → Senior: the rate foundation has no nearshore Lead rate",
    );
    expect(members[2].textContent).toContain(
      "Proposed role mapping, unapproved: BI developer → Analytics engineer",
    );
    expect(pod.textContent).toContain(
      "Members named by the team · rates from the cost foundation · loaded cost",
    );
    fireEvent.click(
      within(pod).getAllByRole("button", {
        name: "Approve mapping BI developer → Analytics engineer",
      })[0],
    );
    expect(last().pod?.members?.[2].proposedMapping).toEqual({
      from: "BI developer",
      approvedBy: "me",
      approvedAt: AT,
    });
    expect(row(container, "POD").textContent).toContain(
      "Mapped from BI developer, approved by you",
    );
  });

  it("asks for a pod when none is set, from the rate foundation only", async () => {
    const { container } = render(
      <Harness initial={serializeRomEstimate({ ...fixture(), pod: null })} />,
    );
    const pod = row(container, "POD");
    expect(pod.textContent).toContain("No delivery pod is set.");
    fireEvent.click(within(pod).getByRole("button", { name: "Set the pod…" }));
    const save = within(pod).getByRole("button", { name: "Save" });
    expect(isDisabled(save)).toBe(true);
    fireEvent.change(within(pod).getByLabelText("Pod template code"), {
      target: { value: "POD-7" },
    });
    fireEvent.change(within(pod).getByLabelText("Delivery location code"), {
      target: { value: "LOC-NEAR" },
    });
    fireEvent.change(within(pod).getByLabelText("Rate basis"), {
      target: { value: "bill_rate" },
    });
    fireEvent.click(save);
    expect(last().pod).toEqual({
      templateCode: "POD-7",
      locationCode: "LOC-NEAR",
      providerClassCode: null,
      rateBasis: "bill_rate",
    });
    expect(row(container, "EST").textContent).toContain("Provisional");
    await waitFor(() => expect(previewCalls().length).toBeGreaterThan(0));
  });

  it("settles sourced factors, and asks for them when one is missing", async () => {
    const { container } = render(<Harness />);
    expect(row(container, "FAC").closest("details")).not.toBeNull();
    expect(row(container, "FAC").textContent).toContain(
      "Friction ×1.10 · [A:DL4] confirmed",
    );
    expect(row(container, "FAC").textContent).toContain(
      "Productive share 65% · approved benchmark BM-PROD-02",
    );
    cleanup();
    const { container: c2 } = render(
      <Harness
        initial={serializeRomEstimate({ ...fixture(), friction: null })}
      />,
    );
    const fac = row(c2, "FAC");
    expect(fac.closest("details")).toBeNull();
    fireEvent.click(
      within(fac).getByRole("button", { name: "Source the factors…" }),
    );
    const inputs = fac.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "1.2" } });
    fireEvent.change(inputs[1], { target: { value: "[A:DL4] confirmed" } });
    fireEvent.click(within(fac).getByRole("button", { name: "Save" }));
    expect(last().friction).toEqual({
      value: 1.2,
      source: "[A:DL4] confirmed",
    });
    await waitFor(() => expect(previewCalls().length).toBeGreaterThan(0));
  });

  it("shows the release grouping as a session-notes draft, and accepts it", async () => {
    const { container } = render(<Harness />);
    const rel = row(container, "REL");
    expect(rel.textContent).toContain("Session notes · review");
    expect(rel.textContent).toContain("From delivery notes, Oct 16, p.4");
    expect(rel.textContent).toContain(
      "R1 · Pilot · certified measuresUC-1 · includes the shared foundation, counted once",
    );
    await estimateReady(container);
    expect(rel.textContent).toContain(
      "Not designed · range ×0.75–×1.50 · ROM-NOT-DESIGNED",
    );
    fireEvent.click(within(rel).getByRole("button", { name: "Accept" }));
    expect(last().releases).toMatchObject({ acceptedBy: "me", acceptedAt: AT });
    expect(row(container, "REL").textContent).toContain(
      "Accepted by you, Oct 16",
    );
  });

  it("prices only through the preview route and says what keeps it provisional", async () => {
    const { container } = render(<Harness />);
    await estimateReady(container);
    const [url, init] = previewCalls()[0];
    expect(url).toBe("/api/v1/programs/move-1/rom/preview");
    expect(init.method).toBe("POST");
    const posted = JSON.parse(String(init.body));
    expect(posted).toEqual(
      (buildRomStructure(fixture(), REGISTER) as { structure: unknown })
        .structure,
    );
    expect(posted.unitHours.dashboard_view_count).toEqual({
      value: 20,
      source: "[A:DL3] open · working figure, provisional",
      confidence: "low",
    });
    const est = row(container, "EST");
    expect(est.textContent).toContain(
      "Provisional until counts, unit hours, the pod mapping and the release grouping are confirmed. These figures move as they are.",
    );
    expect(est.textContent).toContain(
      "Priced with the working figure of A:DL3, still open.",
    );
    const rows = [...est.querySelectorAll("table tbody tr")].map(
      (tr) => tr.textContent,
    );
    expect(rows).toEqual([
      "R1 · Pilot · certified measures410 h5 wks$60k$80k$120k",
      "R2 · Scale · lineage and access520 h6 wks$72k$96k$144k",
      "Shared foundation · counted once, in R1300 h4 wks$48k$64k$96k",
      "Combined · foundation counted once1,230 h15 wks$180k$240k$360k",
    ]);
    expect(est.querySelector("tr.total")?.textContent).toContain("Combined");
    const approve = within(est).getByRole("button", {
      name: "Approve the estimate",
    });
    expect(isDisabled(approve)).toBe(true);
    expect(approve.className).toContain("btn-ink");
    expect(container.textContent).toContain("The estimate");
  });

  it("downloads the workbook through the same route with format=xlsx", async () => {
    const created = jest.fn(() => "blob:rom");
    const revoked = jest.fn();
    Object.assign(URL, { createObjectURL: created, revokeObjectURL: revoked });
    const { container } = render(<Harness />);
    await estimateReady(container);
    await act(async () => {
      fireEvent.click(
        within(row(container, "EST")).getByRole("button", {
          name: "Download the workbook",
        }),
      );
    });
    const call = fetchMock.mock.calls.find(([u]) =>
      String(u).endsWith("?format=xlsx"),
    );
    expect(call?.[0]).toBe("/api/v1/programs/move-1/rom/preview?format=xlsx");
    expect(call?.[1].method).toBe("POST");
    expect(JSON.parse(String(call?.[1].body))).toEqual(
      (buildRomStructure(fixture(), REGISTER) as { structure: unknown })
        .structure,
    );
    expect(created).toHaveBeenCalledTimes(1);
    expect(revoked).toHaveBeenCalledWith("blob:rom");
  });

  it("names a workbook refusal in the service's own words", async () => {
    mockFetch({
      preview: (u) =>
        u.endsWith("?format=xlsx")
          ? {
              status: 503,
              body: {
                error: "reference_unavailable",
                detail: "The cost foundation reference data could not be read.",
              },
            }
          : undefined,
    });
    const { container } = render(<Harness />);
    await estimateReady(container);
    await act(async () => {
      fireEvent.click(
        within(row(container, "EST")).getByRole("button", {
          name: "Download the workbook",
        }),
      );
    });
    expect(row(container, "EST").textContent).toContain(
      "The cost foundation reference data could not be read.",
    );
  });

  it("approves only once every input is confirmed, and stores the computed snapshot", async () => {
    mockFetch({ register: REGISTER_ANSWERED });
    const { container } = render(
      <Harness initial={serializeRomEstimate(settledRecord())} />,
    );
    await waitFor(() =>
      expect(next(container).textContent).toContain("4 of 4 inputs confirmed"),
    );
    await waitFor(() =>
      expect(
        isDisabled(
          within(row(container, "EST")).getByRole("button", {
            name: "Approve the estimate",
          }),
        ),
      ).toBe(false),
    );
    expect(next(container).textContent).toContain("Approve the estimate.");
    expect(row(container, "EST").textContent).not.toContain("Provisional");
    fireEvent.click(
      within(row(container, "EST")).getByRole("button", {
        name: "Approve the estimate",
      }),
    );
    const approval = last().approval!;
    expect(approval).toMatchObject({
      version: 1,
      approvedBy: "me",
      approvedAt: AT,
    });
    expect(approval.combined).toEqual({
      hours: 1230.4,
      weeks: 15,
      lowCents: 18_000_000,
      planCents: 24_000_000,
      highCents: 36_000_000,
    });
    expect(approval.unitHours.dashboard_view_count).toEqual({
      value: 20,
      source: "[A:DL3] confirmed · BI lead",
    });
    expect(row(container, "EST").textContent).toContain(
      "Approved by you, Oct 16 · snapshot v1 for P4",
    );
    expect(container.textContent).toContain("Approved estimate");
    expect(next(container).textContent).toContain("✓Ready");
    expect(
      isDisabled(container.querySelector("footer button.btn-primary")),
    ).toBe(false);
    // Reopening clears the approval; the next one is v2.
    fireEvent.click(
      within(row(container, "EST")).getByRole("button", { name: "Reopen" }),
    );
    expect(last().approval).toBeNull();
    expect(last().snapshotsIssued).toBe(1);
  });

  it("shows the approved snapshot itself, even when the live estimate cannot be read", async () => {
    mockFetch({ register: REGISTER_ANSWERED });
    const record = settledRecord();
    const posted = (
      buildRomStructure(record, REGISTER_ANSWERED) as { structure: unknown }
    ).structure;
    const approved = ok(
      approveRomEstimate(record, REGISTER_ANSWERED, fakeRom(posted), "me", AT),
    );
    mockFetch({
      register: REGISTER_ANSWERED,
      preview: (u) =>
        u.endsWith("/preview")
          ? {
              status: 500,
              body: {
                error: "internal_error",
                detail: "The ROM preview failed unexpectedly.",
              },
            }
          : undefined,
    });
    const { container } = render(
      <Harness initial={serializeRomEstimate(approved)} />,
    );
    await waitFor(() => expect(previewCalls().length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(next(container).textContent).toContain("✓Ready"),
    );
    const est = row(container, "EST");
    expect(est.querySelector("tr.total")?.textContent).toBe(
      "Combined · foundation counted once1,230 h15 wks$180k$240k$360k",
    );
    expect(est.textContent).not.toContain(
      "The ROM preview failed unexpectedly.",
    );
    expect(est.textContent).not.toContain("Provisional");
    expect(
      within(est).queryByRole("button", { name: "Approve the estimate" }),
    ).toBeNull();
  });

  it("offers Remove only on a grouping the team wrote", () => {
    const { container } = render(<Harness />);
    expect(
      within(row(container, "REL")).queryByRole("button", { name: /^Remove/ }),
    ).toBeNull();
    cleanup();
    const team = fixture();
    team.releases!.source = { kind: "team" };
    const { container: c2 } = render(
      <Harness initial={serializeRomEstimate(team)} />,
    );
    fireEvent.click(
      within(row(c2, "REL")).getByRole("button", { name: "Remove R2" }),
    );
    expect(last().releases?.items.map((r) => r.code)).toEqual(["R1"]);
    expect(row(c2, "REL").textContent).toContain(
      "UC-2, UC-3 are in no release.",
    );
  });

  it("names a refused estimate and holds approval", async () => {
    mockFetch({
      register: REGISTER_ANSWERED,
      preview: (u) =>
        u.endsWith("/preview")
          ? {
              status: 422,
              body: {
                error: "pod_pricing_refused",
                detail: "No rate resolves for ROL-AE at LOC-NEAR.",
              },
            }
          : undefined,
    });
    const { container } = render(
      <Harness initial={serializeRomEstimate(settledRecord())} />,
    );
    await waitFor(() =>
      expect(row(container, "EST").textContent).toContain(
        "The estimate service refused these inputs. No rate resolves for ROL-AE at LOC-NEAR.",
      ),
    );
    expect(
      isDisabled(
        within(row(container, "EST")).getByRole("button", {
          name: "Approve the estimate",
        }),
      ),
    ).toBe(true);
    expect(next(container).textContent).toContain(
      "Resolve what the estimate refuses.",
    );
  });

  it("says when the register cannot be read, computes nothing from it, and retries", async () => {
    mockFetch({ registerStatus: 500 });
    const { container } = render(<Harness />);
    await waitFor(() =>
      expect(row(container, "UNIT").textContent).toContain(
        "The assumptions register could not be read. The register could not be read just now.",
      ),
    );
    expect(unit(container, "dashboard_view_count").textContent).toContain(
      "A:DL3 could not be resolved: the assumptions register could not be read.",
    );
    expect(row(container, "EST").textContent).toContain(
      "The assumptions register could not be read, so the unit hours behind the estimate are unknown.",
    );
    expect(next(container).textContent).toContain(
      "read the assumptions register again",
    );
    expect(previewCalls()).toHaveLength(0);
    expect(
      row(container, "POD").querySelector("tbody tr")?.textContent,
    ).toContain("Not shown");
    mockFetch();
    await act(async () => {
      fireEvent.click(
        within(row(container, "UNIT")).getByRole("button", {
          name: "Try again",
        }),
      );
    });
    await waitFor(() =>
      expect(unit(container, "dashboard_view_count").textContent).toContain(
        "Needs A:DL3",
      ),
    );
  });

  it("lists the register rows it relies on, collapsed and read-only", async () => {
    const { container } = render(<Harness />);
    await estimateReady(container);
    const heading = [...container.querySelectorAll("h2")].find((h) =>
      h.textContent?.startsWith("Assumptions this estimate relies on"),
    );
    expect(heading?.textContent).toBe(
      "Assumptions this estimate relies on · 5 · 1 open",
    );
    const group = heading!.parentElement as HTMLElement;
    const details = group.querySelector("details")!;
    expect(details.open).toBe(false);
    expect(details.querySelector("summary")?.textContent).toContain(
      "DL1, DL2, DL3, DL5, DL4",
    );
    const dl3 = group.querySelector("#reg-DL3")!;
    expect(dl3.textContent).toContain("DL3 · Statement DL3");
    expect(dl3.textContent).toContain(
      "Estimate~20 h per view · Delivery notes, Oct 16",
    );
    expect(dl3.textContent).toContain("BI lead · Low confidence");
    expect(dl3.textContent).toContain("Open");
    expect(group.querySelector("#reg-DL1")?.textContent).toContain(
      "Confirmed at 24 h · Benchmark, Oct 12",
    );
    expect(within(group).queryAllByRole("button")).toHaveLength(0);
  });

  it("withholds rates and costs, and offers no actions, to a viewer without financial visibility", async () => {
    mockFetch({
      redacted: true,
      register: REGISTER.map((r) => ({
        ...r,
        workingFigure: null,
        workingValue: null,
        figuresRedacted: true,
      })),
    });
    const { container } = render(<Harness />);
    await waitFor(() =>
      expect(row(container, "POD").textContent).toContain("Withheld"),
    );
    expect(
      within(row(container, "EST")).queryByRole("button", {
        name: "Approve the estimate",
      }),
    ).toBeNull();
    expect(
      within(row(container, "EST")).queryByRole("button", {
        name: "Download the workbook",
      }),
    ).toBeNull();
    expect(
      within(row(container, "CNT")).queryAllByRole("button", {
        name: /Confirm/,
      }),
    ).toHaveLength(0);
    expect(row(container, "CNT").querySelector("input")).toBeNull();
    expect(
      within(unit(container, "dashboard_view_count")).queryByRole("link"),
    ).toBeNull();
    const dl3 = container.querySelector("#reg-DL3")!;
    expect(dl3.textContent).toContain(
      "Figure withheld · no financial visibility",
    );
    expect(dl3.textContent).toContain("Open");
    expect(unit(container, "dashboard_view_count").textContent).toBe(
      "Dashboard viewsFigure withheld · no financial visibility · [A:DL3]",
    );
    expect(next(container).textContent).toContain(
      "ask someone with financial visibility to confirm the unit hours",
    );
  });

  it("shows a withheld viewer the approved snapshot's hours, with its costs withheld", async () => {
    const record = settledRecord();
    const posted = (
      buildRomStructure(record, REGISTER_ANSWERED) as { structure: unknown }
    ).structure;
    const approved = ok(
      approveRomEstimate(record, REGISTER_ANSWERED, fakeRom(posted), "me", AT),
    );
    mockFetch({
      redacted: true,
      register: REGISTER.map((r) => ({
        ...r,
        workingFigure: null,
        workingValue: null,
        answerValue: null,
        figuresRedacted: true,
      })),
    });
    const { container } = render(
      <Harness initial={serializeRomEstimate(approved)} />,
    );
    // Until the register says who may see figures, no cost is shown.
    expect(row(container, "EST").querySelector("tr.total")?.textContent).toBe(
      "Combined · foundation counted once1,230 h15 wks………",
    );
    await waitFor(() =>
      expect(row(container, "EST").querySelector("tr.total")?.textContent).toBe(
        "Combined · foundation counted once1,230 h15 wksWithheldWithheldWithheld",
      ),
    );
    expect(row(container, "EST").textContent).toContain(
      "Approved by you, Oct 16 · snapshot v1 for P4",
    );
    expect(within(row(container, "EST")).queryAllByRole("button")).toHaveLength(
      0,
    );
  });

  it("is blocked, with a link to Step 2, until Step 2 is done; the inputs are kept", () => {
    const { container } = render(<Harness step2Done={false} />);
    expect(next(container).textContent).toContain(
      "Waiting on Step 2: the direction isn’t chosen and confirmed yet, so there is nothing to estimate; Open Step 2 →",
    );
    expect(
      within(next(container))
        .getByRole("link", { name: "Open Step 2 →" })
        .getAttribute("href"),
    ).toBe("/step2");
    expect(container.textContent).toContain("Your inputs are kept.");
    expect(row(container, "CNT")).toBeNull();
    expect(container.textContent).not.toMatch(/session output/i);
    expect(
      isDisabled(container.querySelector("footer button.btn-primary")),
    ).toBe(true);
  });

  it("fills counts from notes as session-note drafts, and never unit hours or rates", async () => {
    const r = fixture();
    r.useCases[2].counts = {};
    r.useCases[2].source = { kind: "team" };
    const { container } = render(<Harness initial={serializeRomEstimate(r)} />);
    expect(dockNow().briefing).toContain(
      "Counts for UC-2 come from your session notes, word for word.",
    );
    expect(dockNow().briefing).toContain("I don’t write figures.");
    act(() => dockNow().actions[0].onClick());
    fireEvent.change(
      container.querySelector("#rom-notes") as HTMLTextAreaElement,
      {
        target: {
          value:
            "UC-3 access is 3 sources, 10 tables and 1 view.\nUC-1 is 9 sources.\nDashboard views take 20 h each at $95 per hour.",
        },
      },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    const filled = last();
    expect(filled.useCases[2]).toMatchObject({
      counts: {
        data_source_count: 3,
        source_table_count: 10,
        dashboard_view_count: 1,
      },
      source: {
        kind: "session_notes",
        citation: "your notes, line 1",
        excerpt: "UC-3 access is 3 sources, 10 tables and 1 view.",
      },
    });
    expect(filled.useCases[2].confirmedAt).toBeUndefined();
    expect(filled.useCases[0]).toEqual(r.useCases[0]);
    expect(filled.unitHours).toEqual(r.unitHours);
    expect(filled.pod).toEqual(r.pod);
    expect(container.textContent).toContain(
      "I filled counts for UC-3 from your notes, word for word. It is a draft; confirm each row. I left UC-1 alone because you had confirmed it. I don’t fill unit hours or rates.",
    );
    const uc3 = row(container, "CNT").querySelectorAll("table tbody tr")[2];
    expect(uc3.textContent).toContain("Session notes · review");
    expect(uc3.textContent).toContain("From your notes, line 1");
    await estimateReady(container);
  });

  it("says when notes state no counts for an open use case", () => {
    const { container } = render(<Harness />);
    act(() => dockNow().actions[0].onClick());
    fireEvent.change(
      container.querySelector("#rom-notes") as HTMLTextAreaElement,
      { target: { value: "Pilot first, then scale." } },
    );
    fireEvent.click(
      within(container).getByRole("button", { name: "Fill with aVa" }),
    );
    expect(container.textContent).toContain(
      "Your notes state no counts for an open use case on this step.",
    );
    expect(saved).toHaveLength(0);
  });

  it("starts empty with a way to add a use case, and refuses an invalid count in words", async () => {
    const { container } = render(<Harness initial="" />);
    expect(next(container).textContent).toContain(
      "Add the use cases and their counts",
    );
    const cnt = row(container, "CNT");
    fireEvent.click(
      within(cnt).getByRole("button", { name: "Add a use case…" }),
    );
    fireEvent.change(within(cnt).getByLabelText("New use case"), {
      target: { value: "Certified measure layer" },
    });
    fireEvent.click(within(cnt).getByRole("button", { name: "Save" }));
    expect(last().useCases).toEqual([
      {
        code: "UC-1",
        name: "Certified measure layer",
        counts: {},
        source: { kind: "team" },
      },
    ]);
    fireEvent.change(
      within(row(container, "CNT")).getAllByLabelText(
        "Data sources for UC-1",
      )[0],
      { target: { value: "x" } },
    );
    expect(row(container, "REFUSED").textContent).toContain(
      "A count is a whole number of 0 or more.",
    );
    expect(next(container).textContent).toMatch(
      /^.*Dismiss the refused change/,
    );
    fireEvent.click(
      within(row(container, "CNT")).getByRole("button", {
        name: "Add the shared foundation",
      }),
    );
    expect(last().foundation?.name).toBe("Shared foundation");
    expect(row(container, "EST").textContent).toContain(
      "Group the use cases into releases to see the estimate.",
    );
  });

  it("adds a release from the team and confirms the grouping", () => {
    const r = { ...fixture(), releases: null };
    const { container } = render(<Harness initial={serializeRomEstimate(r)} />);
    const rel = row(container, "REL");
    expect(rel.textContent).toContain("No releases yet.");
    fireEvent.click(
      within(rel).getByRole("button", { name: "Add a release…" }),
    );
    fireEvent.change(within(rel).getByLabelText("Release name"), {
      target: { value: "Everything" },
    });
    for (const code of ["UC-1", "UC-2", "UC-3"])
      fireEvent.click(
        within(rel).getByRole("checkbox", { name: new RegExp(code) }),
      );
    fireEvent.click(
      within(rel).getByRole("checkbox", {
        name: /Carries the shared foundation/,
      }),
    );
    fireEvent.click(within(rel).getByRole("button", { name: "Save release" }));
    expect(last().releases?.items).toEqual([
      {
        code: "R1",
        name: "Everything",
        useCaseCodes: ["UC-1", "UC-2", "UC-3"],
        designStatus: "not_designed",
        carriesFoundation: true,
      },
    ]);
    expect(row(container, "REL").textContent).not.toContain(
      "Session notes · review",
    );
    fireEvent.click(
      within(row(container, "REL")).getByRole("button", {
        name: "Confirm the grouping",
      }),
    );
    expect(last().releases?.acceptedBy).toBe("me");
  });
});
