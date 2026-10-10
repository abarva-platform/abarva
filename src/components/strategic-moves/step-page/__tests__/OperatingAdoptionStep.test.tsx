/**
 * @jest-environment jsdom
 *
 * P3 Step 3 under governance (template v1.10, review 6). Depth is read from
 * the confirmed P2 route and never changed here; technical is Skipped by the
 * business-change boundary attestation; limited and full name owners for
 * Step 1's design elements, write the change in the team's words to two
 * capture answers, and name who receives the baseline. Accepting the owners
 * also writes plain owner lines into a capture answer, after the team's words.
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
import {
  OperatingAdoptionStep,
  type OperatingAdoptionStepProps,
} from "../OperatingAdoptionStep";
import type { StepAvaAction } from "../RootCausesStep";
import {
  draftAnswer,
  emptyOperatingAdoption,
  parseOperatingAdoption,
  raiseRouteFlag,
  serializeOperatingAdoption,
  type OperatingAdoption,
} from "@/lib/programs/operating-adoption";
import { serializeDesignTraceability } from "@/lib/programs/design-traceability";
import { serializeRootCauseRegister } from "@/lib/programs/root-cause-register";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

const P2 = serializeRootCauseRegister({
  kind: "root_cause_register",
  version: 1,
  orderConfirmedAt: "2026-10-02",
  causes: [
    {
      id: "RC-1",
      cause: "No one owns definitions",
      short: "ownership",
      status: "accepted",
      evidence: ["e"],
    },
    {
      id: "RC-3",
      cause: "No lineage",
      short: "lineage",
      status: "accepted",
      evidence: ["e"],
    },
    {
      id: "RC-4",
      cause: "Identity not resolved across systems",
      short: "identity",
      status: "known_gap",
      owner: "MDM lead",
    },
  ],
});
const TRACE = serializeDesignTraceability({
  kind: "design_traceability",
  version: 1,
  links: [
    {
      causeId: "RC-1",
      cause: "No one owns definitions",
      rank: 1,
      status: "accepted",
      element: "Stewardship council",
    },
    {
      causeId: "RC-3",
      cause: "No lineage",
      rank: 2,
      status: "accepted",
      element: "Lineage capture",
    },
    {
      causeId: "RC-4",
      cause: "Identity not resolved across systems",
      rank: 3,
      status: "handed_off",
      program: "Master-data program",
      owner: "Dana Ruiz",
    },
  ],
});

const base: ConfirmedSolutionRoute = {
  route: "process_change",
  recommendation: "process_change",
  solutionOutput: "data_product",
  workflowChange: "limited",
  roleAccountabilityChange: "limited",
  adoptionOwner: "Amara Osei",
  adoptionResponsibility: "business",
  decision: "confirm",
  evidenceReference: "ev-1",
  validatedBy: "Priya Nair",
  rationale: "fixture",
};
const ROUTES = {
  technical: {
    ...base,
    route: "technical_product",
    recommendation: "technical_product",
    workflowChange: "none",
    roleAccountabilityChange: "none",
  },
  limited: base,
  full: {
    ...base,
    route: "operating_model_change",
    recommendation: "operating_model_change",
    workflowChange: "material",
    roleAccountabilityChange: "material",
  },
} satisfies Record<string, ConfirmedSolutionRoute>;

const PEOPLE = [
  { name: "Priya Nair", role: "sponsor" },
  { name: "Rosa Delgado", role: "participant" },
  { name: "Tom Becker", role: "participant" },
  { name: "Kenji Watanabe", role: "participant" },
];

const REGISTER = [
  {
    registerId: "A1",
    area: "adoption",
    seq: 1,
    statement: "Stewards can give part of their week to certification",
    status: "open",
    ownerRole: "Steward lead",
    source: "P1 charter, adoption answer",
    confidence: 1,
    origin: "charter_carry_forward",
    raisedStepId: null,
    workingFigure: "~10% of a steward’s week",
    answerFigure: null,
    unit: null,
    figuresRedacted: false,
  },
  {
    registerId: "A4",
    area: "adoption",
    seq: 4,
    statement: "Steward enablement takes about two days per steward",
    status: "confirmed",
    ownerRole: "Steward lead",
    source: "Session notes, p.4",
    confidence: 3,
    origin: "team",
    raisedStepId: null,
    workingFigure: "~2 days of enablement per steward",
    answerFigure: null,
    unit: null,
    figuresRedacted: false,
  },
  {
    registerId: "A5",
    area: "adoption",
    seq: 5,
    statement: "Enablement budget",
    status: "open",
    ownerRole: "Finance lead",
    source: "Charter",
    confidence: 1,
    origin: "team",
    raisedStepId: null,
    workingFigure: "$40k",
    answerFigure: null,
    unit: null,
    figuresRedacted: false,
  },
  {
    registerId: "A6",
    area: "adoption",
    seq: 6,
    statement: "A proposal",
    status: "proposed",
    ownerRole: "Steward lead",
    source: "aVa",
    confidence: 1,
    origin: "ava_proposal",
    raisedStepId: null,
    workingFigure: "~5%",
    answerFigure: null,
    unit: null,
    figuresRedacted: false,
  },
];

type Dock = {
  briefing: string;
  actions: StepAvaAction[];
  notesPanel: ReactNode;
};
const frameSpy = jest.fn<void, [Dock]>();
const dockNow = (): Dock =>
  frameSpy.mock.calls[frameSpy.mock.calls.length - 1][0];
let saved: string[] = [];
let writes: Array<[string, string]> = [];
let fetchCalls: string[] = [];

function mockFetch(register: "ok" | "fail" = "ok") {
  (global as { fetch?: unknown }).fetch = jest.fn(async (url: string) => {
    fetchCalls.push(url);
    if (url.includes("/assumptions")) {
      return register === "ok"
        ? {
            ok: true,
            status: 200,
            json: async () => ({ ok: true, assumptions: REGISTER }),
          }
        : {
            ok: false,
            status: 500,
            json: async () => ({ code: "register_read_failed" }),
          };
    }
    return { ok: true, status: 200, json: async () => ({ items: [] }) };
  });
}

function Harness({
  initial = "",
  initialAnswers = {},
  ...rest
}: Partial<OperatingAdoptionStepProps> & {
  initial?: string;
  initialAnswers?: Record<string, string>;
}) {
  const [value, setValue] = useState(initial);
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);
  return (
    <OperatingAdoptionStep
      moveId="move-1"
      canReviewEvidence
      moveName="Governed data foundation"
      clientDisplayName="Demo tenant"
      phases={[{ code: "P3", name: "Design", status: "", current: true }]}
      steps={[
        { title: "Root cause → design", depth: "full", done: true },
        { title: "Architecture options", depth: "full", done: true },
        { title: "Operating & adoption", depth: "light" },
      ]}
      stepIndex={2}
      value={value}
      onChange={(next) => {
        saved.push(next);
        setValue(next);
      }}
      answers={answers}
      onAnswerChange={(key, next) => {
        writes.push([key, next]);
        setAnswers((prev) => ({ ...prev, [key]: next }));
      }}
      route={ROUTES.limited}
      p2RouteHref="/p2-route"
      people={PEOPLE}
      p2RootCauses={P2}
      designTraceability={TRACE}
      step2Done
      step2Href="/step2"
      registerProgramId={null}
      decidedBy="me"
      today="2026-10-14"
      frame={(page, d) => {
        frameSpy(d);
        return (
          <div>
            <div data-testid="notes-panel">{d.notesPanel}</div>
            {page}
          </div>
        );
      }}
      {...rest}
    />
  );
}

beforeEach(() => {
  saved = [];
  writes = [];
  fetchCalls = [];
  frameSpy.mockClear();
});
afterEach(() => {
  cleanup();
  (global as { fetch?: unknown }).fetch = undefined;
});

const last = () => parseOperatingAdoption(saved[saved.length - 1])!;
const status = (c: HTMLElement) =>
  c.querySelector('[role="status"]') as HTMLElement;
const row = (c: HTMLElement, id: string) =>
  c.querySelector(`#row-${id}`) as HTMLElement;
const table = (c: HTMLElement) =>
  row(c, "OWN").querySelector("table") as HTMLElement;
const tr = (c: HTMLElement, name: string) =>
  within(table(c)).getByText(name).closest("tr") as HTMLElement;
const pick = (c: HTMLElement, element: string, person: string) =>
  fireEvent.change(within(table(c)).getByLabelText(`Owner for ${element}`), {
    target: { value: person },
  });
const groupTitles = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("h2")).map((h) => h.textContent);
const record = (r: OperatingAdoption) => serializeOperatingAdoption(r);

describe("OperatingAdoptionStep · limited (Light)", () => {
  it("reads depth from the route with its source, and offers no depth control", () => {
    const { container } = render(<Harness />);
    const context = container.querySelector("details") as HTMLElement;
    expect(context.textContent).toContain(
      "Light depth · from the P2 route, confirmed by Priya Nair",
    );
    expect(context.textContent).toContain(
      "It changes only by re-checking the route in P2.",
    );
    const recheck = within(context).getByRole("link", {
      name: "Re-check the P2 route →",
    });
    expect(recheck.getAttribute("href")).toBe("/p2-route");
    expect(container.textContent).not.toMatch(
      /Change depth|Switch to|Reopen at|depth…/,
    );
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0);
  });

  it("starts at 0 of 4 settled with the clauses in row order", () => {
    const { container } = render(<Harness />);
    expect(status(container).textContent).toContain(
      "Name 2 owners and accept the decision rights, write the workflow change, and 2 more below.",
    );
    expect(status(container).textContent).toContain("0 of 4 settled");
    expect(row(container, "workflow_delta").textContent).toContain(
      "Written to the Move’s workflow change answer",
    );
    expect(row(container, "process_adoption_boundary").textContent).toContain(
      "Where adoption stops",
    );
    // No internal key on screen.
    expect(container.textContent).not.toMatch(
      /workflow_delta|process_adoption_boundary|operating_adoption/,
    );
  });

  it("lists Step 1's elements and the hand-off read-only, owners from the Move's people", () => {
    const { container } = render(<Harness />);
    expect(tr(container, "Stewardship council").textContent).toContain("RC-1");
    const handed = tr(container, "Identity not resolved across systems");
    expect(handed.textContent).toContain("RC-4 · handed off in Step 1");
    expect(handed.textContent).toContain("Dana Ruiz · Master-data program");
    expect(handed.textContent).toContain("Not this Move’s to staff");
    expect(within(handed).queryByRole("combobox")).toBeNull();
    const options = Array.from(
      (
        within(table(container)).getByLabelText(
          "Owner for Stewardship council",
        ) as HTMLSelectElement
      ).options,
    ).map((o) => o.textContent);
    expect(options).toEqual([
      "Choose an owner…",
      "Priya Nair · sponsor",
      "Rosa Delgado · participant",
      "Tom Becker · participant",
      "Kenji Watanabe · participant",
    ]);
  });

  it("Accept waits for every owner; accepting writes owner lines into the adoption boundary, after the team's words", () => {
    const { container } = render(
      <Harness
        initialAnswers={{
          process_adoption_boundary: "Front-line staff see no change.",
        }}
      />,
    );
    const accept = within(row(container, "OWN")).getByRole("button", {
      name: "Accept owners and rights",
    }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    expect(row(container, "OWN").textContent).toContain("2 owners to name");
    pick(container, "Stewardship council", "Rosa Delgado");
    expect(row(container, "OWN").textContent).toContain("1 owner to name");
    pick(container, "Lineage capture", "Kenji Watanabe");
    fireEvent.click(
      within(tr(container, "Stewardship council")).getByRole("button", {
        name: "Certifies output: Stewardship council",
      }),
    );
    expect(accept.disabled).toBe(false);
    fireEvent.click(accept);
    expect(writes).toEqual([
      [
        "process_adoption_boundary",
        "Front-line staff see no change.\n\nStewardship council: owner Rosa Delgado; certifies its output\nLineage capture: owner Kenji Watanabe",
      ],
    ]);
    expect(last().ownersAcceptedAt).toBe("2026-10-14");
    // Settled: names in place, no per-cell badge, provenance in the note.
    const own = row(container, "OWN");
    expect(own.closest("details")).not.toBeNull();
    expect(own.textContent).toContain(
      "Owners and decision rights accepted by you, Oct 14",
    );
    expect(within(own).queryAllByRole("combobox")).toHaveLength(0);
    expect(own.textContent).not.toContain("Session notes · review");
    // The team's own words in that answer still read as its own row, unconfirmed.
    expect(row(container, "process_adoption_boundary").textContent).toContain(
      "Front-line staff see no change.",
    );
    expect(
      row(container, "process_adoption_boundary").textContent,
    ).not.toContain("owner Rosa");
    expect(row(container, "process_adoption_boundary").textContent).toContain(
      "Your capture answer · review",
    );
  });

  it("reopening the owners takes back only the page's lines", () => {
    const { container } = render(
      <Harness initialAnswers={{ process_adoption_boundary: "Team words." }} />,
    );
    pick(container, "Stewardship council", "Rosa Delgado");
    pick(container, "Lineage capture", "Kenji Watanabe");
    fireEvent.click(
      within(row(container, "OWN")).getByRole("button", {
        name: "Accept owners and rights",
      }),
    );
    fireEvent.click(
      within(row(container, "OWN")).getByRole("button", { name: "Reopen" }),
    );
    expect(writes[writes.length - 1]).toEqual([
      "process_adoption_boundary",
      "Team words.",
    ]);
    expect(last().ownerLines).toBeUndefined();
  });

  it("owners from notes carry a badge until the consultant chooses", () => {
    let r = emptyOperatingAdoption();
    r = {
      ...r,
      rows: [
        {
          rowId: "RC-1",
          source: "step1",
          name: "Stewardship council",
          owner: {
            name: "Rosa Delgado",
            writtenBy: "notes",
            citation: "From your notes, line 1",
          },
          rights: {
            certifies: {
              value: true,
              writtenBy: "notes",
              citation: "From your notes, line 2",
            },
          },
        },
      ],
    };
    const { container } = render(<Harness initial={record(r)} />);
    const cell = tr(container, "Stewardship council");
    expect(within(cell).getByText("Session notes · review")).toBeTruthy();
    expect(row(container, "OWN").textContent).toContain(
      "Decision rights marked from your notes, line 2, are the team’s words.",
    );
    pick(container, "Stewardship council", "Tom Becker");
    expect(
      within(tr(container, "Stewardship council")).queryByText(
        "Session notes · review",
      ),
    ).toBeNull();
    expect(last().rows[0].owner).toEqual({
      name: "Tom Becker",
      writtenBy: "you",
    });
  });

  it("the team can add, name and remove its own rows; an unnamed row holds Accept", () => {
    const { container } = render(<Harness />);
    pick(container, "Stewardship council", "Rosa Delgado");
    pick(container, "Lineage capture", "Kenji Watanabe");
    fireEvent.click(
      within(row(container, "OWN")).getByRole("button", { name: "Add a row" }),
    );
    const accept = within(row(container, "OWN")).getByRole("button", {
      name: "Accept owners and rights",
    }) as HTMLButtonElement;
    expect(accept.disabled).toBe(true);
    pick(container, "the new row", "Tom Becker");
    expect(row(container, "OWN").textContent).toContain(
      "Name the rows you added",
    );
    fireEvent.change(within(table(container)).getByLabelText("Row name"), {
      target: { value: "Access review board" },
    });
    expect(accept.disabled).toBe(false);
    expect(last().rows.find((x) => x.rowId === "T-1")).toMatchObject({
      source: "team",
      name: "Access review board",
      owner: { name: "Tom Becker" },
    });
    fireEvent.click(
      within(table(container)).getByRole("button", { name: "Remove" }),
    );
    expect(last().rows.find((x) => x.rowId === "T-1")).toBeUndefined();
  });

  it("a draft from notes is badged and cited; Accept writes the team's words as plain text", () => {
    const r = draftAnswer(emptyOperatingAdoption(), "workflow_delta", {
      text: "Stewards certify each measure before release.",
      writtenBy: "notes",
      citation: "From your notes, line 3",
    });
    const { container } = render(<Harness initial={record(r)} />);
    const wf = row(container, "workflow_delta");
    expect(wf.textContent).toContain("Session notes · review");
    expect(wf.textContent).toContain("From your notes, line 3");
    expect(groupTitles(container)).toContain("Drafts to review · 1");
    expect(status(container).textContent).toContain(
      "confirm the workflow change",
    );
    fireEvent.click(within(wf).getByRole("button", { name: "Accept" }));
    expect(writes).toEqual([
      ["workflow_delta", "Stewards certify each measure before release."],
    ]);
    expect(row(container, "workflow_delta").textContent).toContain(
      "Accepted by you, Oct 14 · saved as the Move’s workflow change answer",
    );
    expect(status(container).textContent).toContain("1 of 4 settled");
  });

  it("an aVa draft in the capture answer is badged as aVa's words", () => {
    const { container } = render(
      <Harness
        initialAnswers={{ process_adoption_boundary: "Reworded by aVa." }}
        avaDraftKeys={["process_adoption_boundary"]}
      />,
    );
    expect(row(container, "process_adoption_boundary").textContent).toContain(
      "Ava draft · review",
    );
    expect(dockNow().briefing).toContain(
      "I drafted the adoption boundary. Those are my words",
    );
  });

  it("an empty row is a textarea with Save: the typed words only", () => {
    const { container } = render(<Harness />);
    const wf = row(container, "workflow_delta");
    expect(wf.textContent).toContain("Saved as plain text: your words only");
    const save = within(wf).getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(
      within(wf).getByLabelText("What changes in people’s work"),
      { target: { value: "  Analysts use certified measures.  " } },
    );
    fireEvent.click(save);
    expect(writes).toEqual([
      ["workflow_delta", "Analysts use certified measures."],
    ]);
    expect(row(container, "workflow_delta").textContent).toContain(
      "Saved by you, Oct 14",
    );
    fireEvent.click(
      within(row(container, "workflow_delta")).getByRole("button", {
        name: "Reopen",
      }),
    );
    expect(
      (
        within(row(container, "workflow_delta")).getByLabelText(
          "What changes in people’s work",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("Analysts use certified measures.");
  });

  it("Edit on the capture's words saves them, keeping the page's owner lines after them", () => {
    const lines = "Stewardship council: owner Rosa Delgado";
    const r: OperatingAdoption = {
      ...emptyOperatingAdoption(),
      rows: [
        {
          rowId: "RC-1",
          source: "step1",
          name: "Stewardship council",
          owner: { name: "Rosa Delgado", writtenBy: "you" },
          rights: {},
        },
        {
          rowId: "RC-3",
          source: "step1",
          name: "Lineage capture",
          owner: { name: "Tom Becker", writtenBy: "you" },
          rights: {},
        },
      ],
      ownersAcceptedBy: "me",
      ownersAcceptedAt: "2026-10-13",
      ownerLines: { key: "process_adoption_boundary", text: lines },
    };
    const { container } = render(
      <Harness
        initial={record(r)}
        initialAnswers={{
          process_adoption_boundary: `Typed in capture.\n\n${lines}`,
        }}
      />,
    );
    const ab = row(container, "process_adoption_boundary");
    expect(within(ab).getByText("Typed in capture.")).toBeTruthy();
    fireEvent.click(within(ab).getByRole("button", { name: "Edit" }));
    const box = within(
      row(container, "process_adoption_boundary"),
    ).getByLabelText("Where adoption stops") as HTMLTextAreaElement;
    expect(box.value).toBe("Typed in capture.");
    fireEvent.change(box, {
      target: { value: "Typed in capture, then edited." },
    });
    fireEvent.click(
      within(row(container, "process_adoption_boundary")).getByRole("button", {
        name: "Save",
      }),
    );
    expect(writes).toEqual([
      [
        "process_adoption_boundary",
        `Typed in capture, then edited.\n\n${lines}`,
      ],
    ]);
  });

  it("names who receives the baseline, with no gate implied", () => {
    const { container } = render(<Harness />);
    const meas = row(container, "MEAS");
    expect(meas.textContent).toContain("Name who receives the baseline");
    expect(meas.textContent).toContain(
      "Tower tracks the baseline from go-live; P5 hands it to this owner",
    );
    expect(meas.textContent).not.toMatch(/gate|required/i);
    const save = within(meas).getByRole("button", {
      name: "Save",
    }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(within(meas).getByLabelText("Owner"), {
      target: { value: "Priya Nair" },
    });
    fireEvent.click(save);
    expect(last().baseline).toEqual({
      name: "Priya Nair",
      savedBy: "me",
      savedAt: "2026-10-14",
    });
    expect(row(container, "MEAS").textContent).toContain(
      "Baseline owner: Priya Nair",
    );
    expect(row(container, "MEAS").textContent).toContain(
      "Named by you, Oct 14",
    );
  });

  it("the route flag is an uncounted Advisory, last in the sentence, with the route or Dismiss", () => {
    const r = raiseRouteFlag(emptyOperatingAdoption(), {
      profile: "limited",
      quote: "Stewards get approval rights over access.",
      line: 4,
    });
    const { container } = render(<Harness initial={record(r)} />);
    const flag = row(container, "FLAG");
    expect(groupTitles(container)).toContain("Advisory · 1");
    expect(flag.textContent).toContain("ROUTE · ADVISORY");
    expect(flag.textContent).toContain(
      "“Stewards get approval rights over access.”",
    );
    expect(flag.textContent).toContain("From your notes, line 4");
    expect(flag.textContent).toContain(
      "P2 route: limited, confirmed by Priya Nair",
    );
    expect(
      within(flag)
        .getByRole("link", { name: "Re-check the P2 route →" })
        .getAttribute("href"),
    ).toBe("/p2-route");
    expect(status(container).textContent).toContain("and 3 more below");
    expect(status(container).textContent).toContain("0 of 4 settled");
    fireEvent.click(within(flag).getByRole("button", { name: "Dismiss" }));
    expect(last().routeFlag).toMatchObject({
      dismissedBy: "me",
      dismissedAt: "2026-10-14",
    });
    expect(row(container, "FLAG")).toBeNull();
    expect(status(container).textContent).toContain("and 2 more below");
  });

  it("the size lines are a FACT and register-cited ESTIMATEs, never money", async () => {
    mockFetch();
    const { container } = render(<Harness registerProgramId="move-1" />);
    await waitFor(() =>
      expect(row(container, "workflow_delta").textContent).toContain(
        "[A:A1] open · Steward lead",
      ),
    );
    const wf = row(container, "workflow_delta");
    expect(wf.textContent).toContain(
      "FactEach design element gets one named owner · Step 1 · accepted design elements",
    );
    expect(wf.textContent).toContain(
      "Estimate~10% of a steward’s week · [A:A1] open · Steward lead",
    );
    expect(wf.textContent).toContain(
      "Estimate~2 days of enablement per steward · [A:A4] confirmed · Steward lead",
    );
    expect(wf.textContent).toContain(
      "Its cost is sized in Step 4’s estimate, not here.",
    );
    // The second text row carries no size lines.
    expect(
      row(container, "process_adoption_boundary").textContent,
    ).not.toContain("[A:");
    // No money anywhere on the page; a proposal is never cited.
    expect(container.textContent).not.toMatch(/\$|€|£|A5|A6/);
    expect(fetchCalls).toContain("/api/v1/programs/move-1/assumptions");
    const compact = Array.from(container.querySelectorAll("section")).find(
      (s) => s.textContent?.startsWith("Assumptions this step relies on"),
    ) as HTMLElement;
    expect(compact.querySelector("h2")?.textContent).toBe(
      "Assumptions this step relies on · 2 · 1 open",
    );
    expect(compact.textContent).toContain("A1, A4");
    expect(compact.textContent).toContain(
      "A1 · Stewards can give part of their week to certification",
    );
    expect(compact.textContent).toContain(
      "Steward lead · Low confidence · from the P1 charter",
    );
    expect(compact.textContent).toContain("Confirmed");
  });

  it("an unreadable register says so instead of showing an estimate", async () => {
    mockFetch("fail");
    const { container } = render(<Harness registerProgramId="move-1" />);
    await waitFor(() =>
      expect(row(container, "workflow_delta").textContent).toContain(
        "The assumptions register could not be read, so no estimate is shown here",
      ),
    );
    expect(container.textContent).not.toContain("[A:");
  });

  it("with the register off nothing is read and no estimate is shown", async () => {
    mockFetch();
    const { container } = render(<Harness />);
    await act(async () => undefined);
    expect(fetchCalls.some((u) => u.includes("/assumptions"))).toBe(false);
    expect(row(container, "workflow_delta").textContent).not.toContain(
      "Estimate",
    );
  });

  it("fills from notes into empty cells only, verbatim and badged; a chosen owner stays", () => {
    const { container } = render(<Harness />);
    pick(container, "Lineage capture", "Kenji Watanabe");
    act(() =>
      dockNow()
        .actions.find((a) => a.id === "fill-notes")!
        .onClick(),
    );
    const panel = within(
      container.querySelector('[data-testid="notes-panel"]') as HTMLElement,
    );
    fireEvent.change(panel.getByLabelText("Fill this step from your notes"), {
      target: {
        value: [
          "Owners: ownership, Rosa Delgado; lineage, Tom Becker.",
          "Workflow change: Stewards certify each measure before release.",
          "The council gets decision rights over every measure.",
        ].join("\n"),
      },
    });
    fireEvent.click(panel.getByRole("button", { name: "Fill with aVa" }));
    expect(panel.getByRole("status").textContent).toBe(
      "From your notes I filled RC-1 (Rosa Delgado), the workflow change, word for word. They are the team’s words, marked for review; nothing is accepted. I left RC-3 alone because you had chosen an owner there. They also suggest a heavier change than the route; that is for the P2 route to decide.",
    );
    expect(
      within(tr(container, "Stewardship council")).getByText(
        "Session notes · review",
      ),
    ).toBeTruthy();
    expect(
      (
        within(table(container)).getByLabelText(
          "Owner for Lineage capture",
        ) as HTMLSelectElement
      ).value,
    ).toBe("Kenji Watanabe");
    expect(row(container, "workflow_delta").textContent).toContain(
      "Stewards certify each measure before release.",
    );
    expect(row(container, "workflow_delta").textContent).toContain(
      "Session notes · review",
    );
    expect(row(container, "FLAG")).not.toBeNull();
    // Nothing was written to a capture answer by the fill.
    expect(writes).toEqual([]);
  });

  it("ready when all four settle; the step offers Continue", () => {
    const r: OperatingAdoption = {
      ...emptyOperatingAdoption(),
      rows: [
        {
          rowId: "RC-1",
          source: "step1",
          name: "Stewardship council",
          owner: { name: "Rosa Delgado", writtenBy: "you" },
          rights: {},
        },
        {
          rowId: "RC-3",
          source: "step1",
          name: "Lineage capture",
          owner: { name: "Tom Becker", writtenBy: "you" },
          rights: {},
        },
      ],
      ownersAcceptedBy: "me",
      ownersAcceptedAt: "2026-10-14",
      answers: [
        {
          key: "workflow_delta",
          accepted: {
            text: "A.",
            writtenBy: "you",
            action: "saved",
            by: "me",
            at: "2026-10-14",
          },
        },
        {
          key: "process_adoption_boundary",
          accepted: {
            text: "B.",
            writtenBy: "you",
            action: "saved",
            by: "me",
            at: "2026-10-14",
          },
        },
      ],
      baseline: { name: "Priya Nair", savedBy: "me", savedAt: "2026-10-14" },
    };
    const { container } = render(
      <Harness
        initial={record(r)}
        initialAnswers={{
          workflow_delta: "A.",
          process_adoption_boundary: "B.",
        }}
      />,
    );
    expect(status(container).textContent).toContain(
      "Owners are named, the change is written in the team’s words, and the baseline owner is named. Continue to Delivery & estimate.",
    );
    expect(status(container).textContent).toContain("4 of 4 settled");
    expect(
      (
        within(container).getByRole("button", {
          name: "Continue",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    const settled = Array.from(container.querySelectorAll("details")).find(
      (d) => d.textContent?.includes("owners, workflow change"),
    ) as HTMLElement;
    expect(settled.querySelector("summary")?.textContent).toContain(
      "owners, workflow change, adoption boundary, baseline owner",
    );
    expect(container.textContent).toContain("Carries to Step 4");
  });

  it("blocked until Step 2 is settled: no work, no fill", () => {
    const { container } = render(<Harness step2Done={false} />);
    expect(status(container).textContent).toContain(
      "Waiting on Step 2: no direction is settled yet, so there is nothing to staff.",
    );
    expect(
      within(status(container))
        .getByRole("link", { name: "Open Step 2 →" })
        .getAttribute("href"),
    ).toBe("/step2");
    expect(row(container, "OWN")).toBeNull();
    expect(container.textContent).toContain(
      "Owners and the change description will appear here once Step 2 has a direction.",
    );
    expect(dockNow().actions).toEqual([]);
    expect(
      (
        within(container).getByRole("button", {
          name: "Continue",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});

describe("OperatingAdoptionStep · full", () => {
  it("captures the operating model and process design; owner lines go to the operating model", () => {
    const { container } = render(
      <Harness
        route={ROUTES.full}
        initialAnswers={{ operating_model: "A council owns definitions." }}
      />,
    );
    expect(container.querySelector("details")?.textContent).toContain(
      "Full depth · from the P2 route, confirmed by Priya Nair",
    );
    expect(row(container, "operating_model").textContent).toContain(
      "Who does what once it’s live",
    );
    expect(row(container, "operating_model").textContent).toContain(
      "Size of the change",
    );
    expect(row(container, "process_design").textContent).toContain(
      "The changed process, start to finish",
    );
    expect(row(container, "workflow_delta")).toBeNull();
    expect(status(container).textContent).toContain(
      "Name 2 owners and accept the decision rights, confirm the operating model, and 2 more below.",
    );
    pick(container, "Stewardship council", "Rosa Delgado");
    pick(container, "Lineage capture", "Kenji Watanabe");
    fireEvent.click(
      within(row(container, "OWN")).getByRole("button", {
        name: "Accept owners and rights",
      }),
    );
    expect(writes).toEqual([
      [
        "operating_model",
        "A council owns definitions.\n\nStewardship council: owner Rosa Delgado\nLineage capture: owner Kenji Watanabe",
      ],
    ]);
  });

  it("with no confirmed route it runs in full and says why", () => {
    const { container } = render(<Harness route={null} />);
    expect(container.querySelector("details")?.textContent).toContain(
      "Full depth · no P2 route is confirmed yet",
    );
    expect(dockNow().briefing).toContain(
      "This step runs in full because no P2 route is confirmed yet.",
    );
  });
});

describe("OperatingAdoptionStep · technical (Skipped)", () => {
  it("shows only the attestation with the route's adoption owner; Continue is enabled", () => {
    mockFetch();
    const { container } = render(
      <Harness
        route={ROUTES.technical}
        registerProgramId="move-1"
        initialAnswers={{
          business_change_boundary:
            "This Move changes data, not how front-line staff work.",
        }}
      />,
    );
    expect(status(container).textContent).toContain(
      "Nothing to do here. The P2 route makes this a technical change, so the business-change boundary attestation stands in for this step.",
    );
    expect(status(container).textContent).not.toContain("settled");
    const line = container.querySelector(
      '[class*="context-line"]',
    ) as HTMLElement;
    expect(line.textContent).toContain(
      "Skipped·Technical route from P2, confirmed by Priya Nair",
    );
    expect(
      within(line)
        .getByRole("link", { name: "Re-check the P2 route →" })
        .getAttribute("href"),
    ).toBe("/p2-route");
    expect(container.querySelector("details")).toBeNull();
    const attest = container.querySelector("dl") as HTMLElement;
    expect(attest.textContent).toContain(
      "“This Move changes data, not how front-line staff work.”",
    );
    expect(attest.textContent).toContain("Adoption ownerAmara Osei");
    expect(attest.textContent).toContain(
      "With the P2 route (technical), confirmed by Priya Nair",
    );
    expect(groupTitles(container)).toEqual(["Business-change boundary"]);
    for (const id of ["OWN", "MEAS", "workflow_delta", "operating_model"])
      expect(row(container, id)).toBeNull();
    expect(container.textContent).not.toMatch(
      /Size of the change|baseline|Estimate/,
    );
    expect(
      (
        within(container).getByRole("button", {
          name: "Continue",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(dockNow().actions.map((a) => a.label)).toEqual([
      "Check my notes against the P2 route",
    ]);
    expect(dockNow().briefing).toContain("names Amara Osei as adoption owner");
    expect(fetchCalls.some((u) => u.includes("/assumptions"))).toBe(false);
  });

  it("says when the attestation is not written yet", () => {
    const { container } = render(<Harness route={ROUTES.technical} />);
    expect(container.querySelector("dl")?.textContent).toContain(
      "Not written yet.",
    );
  });

  it("notes that describe a change to people's work raise the Advisory; it can be dismissed", () => {
    const { container } = render(<Harness route={ROUTES.technical} />);
    act(() => dockNow().actions[0].onClick());
    const panel = within(
      container.querySelector('[data-testid="notes-panel"]') as HTMLElement,
    );
    fireEvent.change(
      panel.getByLabelText("Check your notes against the P2 route"),
      {
        target: {
          value:
            "Dashboards refresh nightly.\nStewards review the exception queue every morning.",
        },
      },
    );
    fireEvent.click(panel.getByRole("button", { name: "Check with aVa" }));
    expect(panel.getByRole("status").textContent).toBe(
      "Your notes suggest a heavier change than the technical route. I added an advisory; only the P2 route can change depth.",
    );
    expect(groupTitles(container)).toEqual([
      "Business-change boundary",
      "Advisory · 1",
    ]);
    const flag = row(container, "FLAG");
    expect(flag.textContent).toContain(
      "That changes how people work, but the P2 route says technical",
    );
    expect(flag.textContent).toContain("From your notes, line 2");
    expect(
      (
        within(container).getByRole("button", {
          name: "Continue",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(dockNow().briefing).toContain(
      "Your notes describe a change to how people work",
    );
    fireEvent.click(within(flag).getByRole("button", { name: "Dismiss" }));
    expect(row(container, "FLAG")).toBeNull();
    expect(writes).toEqual([]);
  });

  it("is skipped even while Step 2 is open: there is nothing to wait for", () => {
    const { container } = render(
      <Harness route={ROUTES.technical} step2Done={false} />,
    );
    expect(status(container).textContent).toContain("Nothing to do here.");
    expect(status(container).textContent).not.toContain("Waiting on Step 2");
  });
});
