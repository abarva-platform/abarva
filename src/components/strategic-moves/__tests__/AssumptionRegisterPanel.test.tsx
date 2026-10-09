/**
 * @jest-environment jsdom
 */

/**
 * The Moves assumptions register panel (`moves_assumption_register_v1`).
 *
 * Pinned: nothing renders or fetches with the flag off; each status renders in
 * its own words; a working figure is tagged "est" and is "withheld" when the
 * viewer may not see figures; aVa's proposals sit in their own labelled group;
 * Accept, Reject, Answer, Supersede and Add call the register routes with the
 * row's revision; every refusal shows the route's `detail` word for word; a
 * read-only viewer gets no controls; a stale charter row says so.
 */

import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import {
  AssumptionRegisterPanel,
  type AssumptionRegisterMount,
} from "../assumptions/AssumptionRegisterPanel";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";

const MOVE = "move-1";
const BASE = `/api/v1/programs/${MOVE}/assumptions`;

let seq = 0;
function view(overrides: Partial<AssumptionView>): AssumptionView {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, "0")}`,
    programId: MOVE,
    area: "value",
    seq,
    registerId: `V${seq}`,
    statement: `Statement ${seq}`,
    whyItMatters: null,
    workingFigure: null,
    workingValue: null,
    unit: null,
    source: "Team workshop",
    confidence: 3,
    ownerRole: "Finance Director",
    ownerName: null,
    ownerPersonId: null,
    status: "open",
    origin: "team",
    answer: null,
    answerFigure: null,
    answerValue: null,
    answerSource: null,
    answeredByUserId: null,
    answeredAt: null,
    acceptedByUserId: null,
    acceptedAt: null,
    supersededBy: null,
    raisedPhase: 2,
    raisedStepId: null,
    evidenceIds: [],
    charterSectionKey: null,
    charterValueRevision: null,
    revision: 1,
    createdByUserId: "user-1",
    createdAt: "2026-10-09T00:00:00.000Z",
    updatedAt: "2026-10-09T00:00:00.000Z",
    figuresRedacted: false,
    ...overrides,
  };
}

const mount = (
  overrides: Partial<AssumptionRegisterMount> = {},
): AssumptionRegisterMount => ({
  programId: MOVE,
  staleAssumptionIds: [],
  charterUnavailable: false,
  unbridgedCharterCount: 0,
  ...overrides,
});

const fetchMock = jest.fn();
type Reply = { status?: number; body: unknown };
/** GET answers with `list`; each POST/PATCH answers with the next of `writes`. */
function serve(list: Reply, writes: Reply[] = []) {
  const queue = [...writes];
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    const reply =
      !init?.method || init.method === "GET" ? list : queue.shift()!;
    const status = reply.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => reply.body,
    } as Response;
  });
}
const listOf = (
  assumptions: AssumptionView[],
  extra: { figuresRedacted?: boolean; canEdit?: boolean } = {},
): Reply => ({
  body: {
    ok: true,
    assumptions,
    figuresRedacted: extra.figuresRedacted ?? false,
    canEdit: extra.canEdit ?? true,
  },
});
const writes = () =>
  fetchMock.mock.calls
    .filter(([, init]) => init?.method && init.method !== "GET")
    .map(([url, init]) => ({
      url,
      method: init.method,
      body: JSON.parse(init.body as string),
    }));
const ready = () => screen.findByTestId("arp-table");

beforeEach(() => {
  seq = 0;
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("flag off", () => {
  it("renders nothing and fetches nothing", () => {
    const { container } = render(<AssumptionRegisterPanel register={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("the register table", () => {
  it("reads this Move's register from the list route", async () => {
    serve(listOf([view({})]));
    render(<AssumptionRegisterPanel register={mount()} />);
    await ready();
    expect(fetchMock.mock.calls[0][0]).toBe(BASE);
  });

  it("renders ID, area, statement, figure tagged est, owner role and confidence as a word", async () => {
    serve(
      listOf([
        view({
          registerId: "V3",
          area: "value",
          statement: "Handle time falls 12%",
          workingFigure: "12%",
          ownerRole: "Finance Director",
          confidence: 5,
        }),
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const row = within(await ready()).getByTestId("arp-row-V3");
    const cells = within(row)
      .getAllByRole("cell")
      .map((cell) => cell.textContent);
    expect(cells.slice(0, 7)).toEqual([
      "V3",
      "Value",
      "Handle time falls 12%",
      "12% est",
      "Finance Director",
      "High",
      "Open",
    ]);
  });

  it.each([
    [1, "Low"],
    [3, "Medium"],
    [5, "High"],
  ] as const)("confidence %s reads %s", async (confidence, word) => {
    serve(listOf([view({ registerId: "D1", confidence })]));
    render(<AssumptionRegisterPanel register={mount()} />);
    const row = within(await ready()).getByTestId("arp-row-D1");
    expect(within(row).getAllByRole("cell")[5]).toHaveTextContent(word);
  });

  it("each status reads in its own words; a superseded row names its replacement", async () => {
    const replacement = view({ registerId: "V5" });
    serve(
      listOf([
        view({ registerId: "V1", status: "open" }),
        view({
          registerId: "V2",
          status: "confirmed",
          answerSource: "Q3 volume extract",
          answeredAt: "2026-10-09T01:00:00.000Z",
        }),
        view({
          registerId: "V3",
          status: "corrected",
          answer: "Handle time falls 8%",
          answerFigure: "8%",
          answerSource: "Pilot readout",
          answeredAt: "2026-10-09T01:00:00.000Z",
        }),
        view({
          registerId: "V4",
          status: "superseded",
          supersededBy: replacement.id,
        }),
        replacement,
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const table = await ready();
    const status = (id: string) =>
      within(within(table).getByTestId(`arp-row-${id}`)).getByTestId(
        "arp-status",
      );
    expect(status("V1")).toHaveTextContent(/^Open$/);
    expect(status("V2")).toHaveTextContent(/^Confirmed$/);
    expect(status("V3")).toHaveTextContent(/^Corrected$/);
    expect(status("V4")).toHaveTextContent(/^Superseded by V5$/);

    const answer = (id: string) =>
      within(within(table).getByTestId(`arp-row-${id}`)).getAllByRole(
        "cell",
      )[7];
    expect(answer("V1")).toHaveTextContent(/^—$/);
    expect(answer("V2")).toHaveTextContent(
      "Confirmed as statedSource: Q3 volume extract",
    );
    expect(answer("V3")).toHaveTextContent(
      "Handle time falls 8%8%Source: Pilot readout",
    );
  });

  it("neither a proposal nor a rejected proposal is a register row", async () => {
    serve(
      listOf([
        view({ registerId: "V1", status: "proposed" }),
        view({ registerId: "V2", status: "rejected" }),
        view({ registerId: "V3", status: "open" }),
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const table = await ready();
    expect(within(table).queryByTestId("arp-row-V1")).toBeNull();
    expect(within(table).queryByTestId("arp-row-V2")).toBeNull();
    expect(within(table).getByTestId("arp-row-V3")).toBeInTheDocument();
    expect(screen.queryByText("Rejected")).toBeNull();
  });

  it("an empty register says so", async () => {
    serve(listOf([]));
    render(<AssumptionRegisterPanel register={mount()} />);
    expect(await screen.findByTestId("arp-empty")).toBeInTheDocument();
  });
});

describe("withheld figures", () => {
  it("shows every figure as withheld, never a figure and never the est tag", async () => {
    serve(
      listOf(
        [
          view({
            registerId: "V1",
            workingFigure: null,
            figuresRedacted: true,
          }),
          view({
            registerId: "V2",
            status: "proposed",
            workingFigure: null,
            figuresRedacted: true,
          }),
        ],
        { figuresRedacted: true, canEdit: false },
      ),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const row = within(await ready()).getByTestId("arp-row-V1");
    expect(within(row).getAllByRole("cell")[3]).toHaveTextContent(/^withheld$/);
    expect(
      within(screen.getByTestId("arp-proposal-V2")).getByText("withheld"),
    ).toBeInTheDocument();
    expect(screen.queryByText("est")).toBeNull();
  });

  it("the top-level flag alone withholds a figure the row still carries", async () => {
    serve(
      listOf([view({ registerId: "V1", workingFigure: "12%" })], {
        figuresRedacted: true,
      }),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const row = within(await ready()).getByTestId("arp-row-V1");
    expect(within(row).getAllByRole("cell")[3]).toHaveTextContent(/^withheld$/);
    expect(screen.queryByText("12%")).toBeNull();
  });

  it("the row's own flag alone withholds the figure", async () => {
    serve(
      listOf([
        view({ registerId: "V1", workingFigure: "12%", figuresRedacted: true }),
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const row = within(await ready()).getByTestId("arp-row-V1");
    expect(within(row).getAllByRole("cell")[3]).toHaveTextContent(/^withheld$/);
  });

  it("a withheld viewer never sees an answer figure", async () => {
    serve(
      listOf(
        [
          view({
            registerId: "V1",
            status: "corrected",
            answer: "Falls less",
            answerFigure: "8%",
            answerSource: "Pilot",
            answeredAt: "2026-10-09T01:00:00.000Z",
          }),
        ],
        { figuresRedacted: true },
      ),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    await ready();
    expect(screen.queryByText("8%")).toBeNull();
  });
});

describe("aVa proposals", () => {
  const proposal = () =>
    view({
      registerId: "V7",
      status: "proposed",
      origin: "ava_proposal",
      workingFigure: "£1.2m",
      revision: 4,
    });

  it("sit in their own labelled group, outside the register", async () => {
    serve(listOf([proposal()]));
    render(<AssumptionRegisterPanel register={mount()} />);
    const group = await screen.findByTestId("arp-proposals");
    expect(
      within(group).getByRole("heading", {
        name: "aVa proposals — not yet in the register",
      }),
    ).toBeInTheDocument();
    expect(within(group).getByTestId("arp-proposal-V7")).toHaveTextContent(
      "£1.2m est",
    );
    expect(screen.queryByTestId("arp-table")).toBeNull();
  });

  it.each(["Accept", "Reject"] as const)(
    "%s posts the decision with the row's revision, then re-reads the register",
    async (label) => {
      const row = proposal();
      serve(listOf([row]), [
        { body: { ok: true, assumption: row, historyRecorded: true } },
      ]);
      render(<AssumptionRegisterPanel register={mount()} />);
      fireEvent.click(await screen.findByRole("button", { name: label }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
      expect(writes()).toEqual([
        {
          url: `${BASE}/${row.id}/decision`,
          method: "POST",
          body: { action: label.toLowerCase(), expectedRevision: 4 },
        },
      ]);
    },
  );

  it("a refused accept shows the route's detail word for word", async () => {
    const detail =
      "Someone changed this assumption after you opened it; it is now at revision 5. Nothing was saved. Reload the register, check the current version, and make your change again.";
    serve(listOf([proposal()]), [
      { status: 409, body: { ok: false, error: "stale_revision", detail } },
    ]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Accept" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(detail);
    expect(screen.getByRole("alert").textContent).toBe(detail);
    // Nothing landed, so the register is not re-read: the list on screen is
    // still the one the refusal was about.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });

  it("a refusal with no detail never claims nothing was saved", async () => {
    serve(listOf([proposal()]), [{ status: 500, body: {} }]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("HTTP 500");
    expect(alert).toHaveTextContent("may or may not have been saved");
  });
});

describe("answering", () => {
  const openRow = () => view({ registerId: "V1", revision: 2 });

  async function openAnswer(row: AssumptionView, replies: Reply[] = []) {
    serve(listOf([row]), replies);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Answer" }));
    return screen.getByRole("form", { name: "Answer V1" });
  }

  it("Confirmed needs a source, then posts the answer with the row's revision", async () => {
    const row = openRow();
    const form = await openAnswer(row, [
      { body: { ok: true, assumption: row } },
    ]);
    const save = within(form).getByRole("button", { name: "Save answer" });
    expect(save).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("Source of the answer"), {
      target: { value: "Q3 volume extract" },
    });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${row.id}/decision`,
      method: "POST",
      body: {
        action: "answer",
        outcome: "confirmed",
        answerSource: "Q3 volume extract",
        answer: null,
        answerFigure: null,
        expectedRevision: 2,
      },
    });
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  });

  it("Corrected also needs the corrected answer", async () => {
    const row = openRow();
    const form = await openAnswer(row, [
      { body: { ok: true, assumption: row } },
    ]);
    fireEvent.click(within(form).getByLabelText("Corrected"));
    fireEvent.change(within(form).getByLabelText("Source of the answer"), {
      target: { value: "Pilot readout" },
    });
    const save = within(form).getByRole("button", { name: "Save answer" });
    expect(save).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("Corrected answer"), {
      target: { value: "Falls 8%" },
    });
    fireEvent.change(within(form).getByLabelText("Answer figure (optional)"), {
      target: { value: "8%" },
    });
    fireEvent.click(save);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0].body).toEqual({
      action: "answer",
      outcome: "corrected",
      answerSource: "Pilot readout",
      answer: "Falls 8%",
      answerFigure: "8%",
      expectedRevision: 2,
    });
  });

  it("a confirmed row can only be re-answered as a correction", async () => {
    const row = view({
      registerId: "V1",
      status: "confirmed",
      answerSource: "x",
      answeredAt: "2026-10-09T01:00:00.000Z",
    });
    const form = await openAnswer(row);
    expect(within(form).queryByLabelText("Confirmed")).toBeNull();
    expect(within(form).getByLabelText("Corrected")).toBeChecked();
  });

  it("a refused answer shows the detail and keeps the form open", async () => {
    const detail =
      "An answer must name its source: the document, system or role the answer came from. Nothing was saved. Add the source and answer again.";
    const form = await openAnswer(openRow(), [
      {
        status: 400,
        body: { ok: false, error: "answer_source_required", detail },
      },
    ]);
    fireEvent.change(within(form).getByLabelText("Source of the answer"), {
      target: { value: "x" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Save answer" }));
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(screen.getByRole("form", { name: "Answer V1" })).toBeInTheDocument();
  });

  it("a change that landed without its history entry says so", async () => {
    const row = openRow();
    const detail =
      "The change to V1 was saved (revision 3), but its history entry was not recorded. Do not repeat the change. Tell your workspace administrator so the history can be repaired.";
    const form = await openAnswer(row, [
      { body: { ok: true, assumption: row, historyRecorded: false, detail } },
    ]);
    fireEvent.change(within(form).getByLabelText("Source of the answer"), {
      target: { value: "x" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Save answer" }));
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
  });
});

describe("superseding and adding", () => {
  it("Supersede posts a replacement row, prefilled from the row, with a new source", async () => {
    const row = view({
      registerId: "V1",
      statement: "Handle time falls 12%",
      workingFigure: "12%",
      ownerRole: "Finance Director",
      confidence: 3,
      revision: 6,
    });
    serve(listOf([row]), [{ body: { ok: true, assumption: row } }]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Supersede" }));
    const form = screen.getByRole("form", {
      name: "Supersede V1 with a new row",
    });
    const submit = within(form).getByRole("button", { name: "Supersede" });
    expect(submit).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("Working figure (optional)"), {
      target: { value: "9%" },
    });
    fireEvent.change(within(form).getByLabelText("Source of the figure"), {
      target: { value: "Pilot readout" },
    });
    fireEvent.click(submit);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${row.id}/decision`,
      method: "POST",
      body: {
        action: "supersede",
        expectedRevision: 6,
        replacement: {
          statement: "Handle time falls 12%",
          workingFigure: "9%",
          source: "Pilot readout",
          ownerRole: "Finance Director",
          confidence: 3,
        },
      },
    });
  });

  it("a refused supersede that stored its replacement shows the detail and re-reads the register", async () => {
    const row = view({ registerId: "V1" });
    const detail =
      "Someone changed this assumption after you opened it. Nothing was saved. The replacement assumption V2 WAS saved as an open row.";
    serve(listOf([row]), [
      {
        status: 409,
        body: {
          ok: false,
          error: "stale_revision",
          detail,
          replacement: { registerId: "V2" },
        },
      },
    ]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Supersede" }));
    const form = screen.getByRole("form", {
      name: "Supersede V1 with a new row",
    });
    fireEvent.change(within(form).getByLabelText("Source of the figure"), {
      target: { value: "x" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Supersede" }));
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("Add posts a team row to the list route", async () => {
    serve(listOf([]), [{ status: 201, body: { ok: true } }]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Add an assumption" }),
    );
    const form = screen.getByRole("form", { name: "Add an assumption" });
    const submit = within(form).getByRole("button", {
      name: "Add to the register",
    });
    fireEvent.change(within(form).getByLabelText("Area"), {
      target: { value: "delivery" },
    });
    fireEvent.change(within(form).getByLabelText("Assumption"), {
      target: { value: "Cutover takes one weekend" },
    });
    fireEvent.change(within(form).getByLabelText("Source of the figure"), {
      target: { value: "Vendor plan" },
    });
    expect(submit).toBeDisabled();
    fireEvent.change(within(form).getByLabelText("Owner role"), {
      target: { value: "Programme lead" },
    });
    fireEvent.change(within(form).getByLabelText("Confidence"), {
      target: { value: "5" },
    });
    fireEvent.click(submit);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: BASE,
      method: "POST",
      body: {
        area: "delivery",
        statement: "Cutover takes one weekend",
        workingFigure: null,
        source: "Vendor plan",
        ownerRole: "Programme lead",
        confidence: 5,
      },
    });
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  });
});

describe("read-only viewers and failures", () => {
  it("a viewer who cannot edit gets no controls", async () => {
    serve(
      listOf(
        [
          view({ registerId: "V1" }),
          view({ registerId: "V2", status: "proposed" }),
        ],
        {
          canEdit: false,
        },
      ),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    await ready();
    expect(screen.queryAllByRole("button")).toEqual([]);
  });

  it("a failed register read shows the route's detail, never an empty register", async () => {
    const detail =
      "The assumptions register could not be read just now. Nothing was changed. Reload to try again.";
    serve({
      status: 500,
      body: { ok: false, error: "register_read_failed", detail },
    });
    render(<AssumptionRegisterPanel register={mount()} />);
    expect((await screen.findByTestId("arp-load-failed")).textContent).toBe(
      detail,
    );
    expect(screen.queryByTestId("arp-empty")).toBeNull();
  });
});

describe("the charter bridge's standing", () => {
  it("flags only the stale charter row", async () => {
    const stale = view({ registerId: "DL1", origin: "charter_carry_forward" });
    const fresh = view({ registerId: "DL2", origin: "charter_carry_forward" });
    serve(listOf([stale, fresh]));
    render(
      <AssumptionRegisterPanel
        register={mount({ staleAssumptionIds: [stale.id] })}
      />,
    );
    const table = await ready();
    expect(
      within(within(table).getByTestId("arp-row-DL1")).getByTestId("arp-stale"),
    ).toBeInTheDocument();
    expect(
      within(within(table).getByTestId("arp-row-DL2")).queryByTestId(
        "arp-stale",
      ),
    ).toBeNull();
  });

  it("says when the charter could not be checked, or a charter row could not be added", async () => {
    serve(listOf([]));
    const { rerender } = render(<AssumptionRegisterPanel register={mount()} />);
    await screen.findByTestId("arp-empty");
    expect(screen.queryByTestId("arp-charter-unavailable")).toBeNull();
    expect(screen.queryByTestId("arp-charter-unbridged")).toBeNull();
    rerender(
      <AssumptionRegisterPanel
        register={mount({ charterUnavailable: true, unbridgedCharterCount: 2 })}
      />,
    );
    expect(screen.getByTestId("arp-charter-unavailable")).toBeInTheDocument();
    expect(screen.getByTestId("arp-charter-unbridged")).toHaveTextContent(
      "2 charter assumptions could not be added",
    );
  });
});

describe("a charter row whose owner needs a role", () => {
  const charterRow = (overrides: Partial<AssumptionView> = {}) =>
    view({
      registerId: "DL1",
      origin: "charter_carry_forward",
      ownerRole: "Owner named in the P1 charter",
      ownerName: "Avery Quill",
      revision: 3,
      ...overrides,
    });

  it("prompts for a role and never shows the person's name", async () => {
    serve(
      listOf([
        charterRow(),
        view({ registerId: "DL2", origin: "charter_carry_forward" }),
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    const table = await ready();
    expect(
      within(within(table).getByTestId("arp-row-DL1")).getByTestId(
        "arp-needs-role",
      ),
    ).toBeInTheDocument();
    expect(
      within(within(table).getByTestId("arp-row-DL2")).queryByTestId(
        "arp-needs-role",
      ),
    ).toBeNull();
    expect(screen.queryByText(/Avery Quill/)).toBeNull();
  });

  it("Set role patches the owner role with the row's revision, refusing a name", async () => {
    const row = charterRow();
    serve(listOf([row]), [{ body: { ok: true, assumption: row } }]);
    render(<AssumptionRegisterPanel register={mount()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Set role" }));
    const form = screen.getByRole("form", {
      name: "Set the owner role for DL1",
    });
    const save = within(form).getByRole("button", { name: "Save role" });
    const input = within(form).getByRole("textbox");
    fireEvent.change(input, { target: { value: "Avery Quill" } });
    expect(save).toBeDisabled();
    expect(within(form).getByTestId("arp-role-is-name")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Claims operations lead" } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${row.id}`,
      method: "PATCH",
      body: { expectedRevision: 3, ownerRole: "Claims operations lead" },
    });
    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
  });

  it("an answered row, or a viewer who cannot edit, gets the prompt without the control", async () => {
    serve(
      listOf([
        charterRow({
          status: "confirmed",
          answerSource: "x",
          answeredAt: "2026-10-09T01:00:00.000Z",
        }),
      ]),
    );
    render(<AssumptionRegisterPanel register={mount()} />);
    await ready();
    expect(screen.getByTestId("arp-needs-role")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Set role" })).toBeNull();
  });
});
