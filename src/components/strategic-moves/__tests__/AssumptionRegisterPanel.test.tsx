/**
 * @jest-environment jsdom
 */

/**
 * The Moves assumptions register (`moves_assumption_register_v1`), in Claude
 * Design's final register design (step page template v1.9, review 5).
 *
 * Pinned, per state in the design:
 *   - flag off: nothing renders and nothing is fetched, in either variant;
 *   - compact (phase pages): counts by status, the open questions with
 *     `Answer…` in place, a link to the full view, never a proposal and never
 *     the full register;
 *   - full: row anatomy (ID · statement, why, ESTIMATE figure · source, owner
 *     role · confidence word · origin, status at the right); by area and by
 *     owner; the client hand-off copy (clipboard, and the select-text
 *     fallback); the proposals group with Accept / Reject and "to be set";
 *     stale charter rows (`Re-check`); rows whose owner needs a role;
 *     withheld figures with no actions; each form's validation; every refusal
 *     shown as the route's `detail` word for word.
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
  openQuestionsText,
  type AssumptionRegisterMount,
} from "../assumptions/AssumptionRegisterPanel";
import type { AssumptionView } from "@/lib/programs/assumption-register/register-request";
import { CHARTER_OWNER_ROLE_PLACEHOLDER } from "@/lib/programs/assumption-register/owner-role";

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
    ownerRole: "Finance lead",
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

const full = (m: AssumptionRegisterMount = mount()) =>
  render(<AssumptionRegisterPanel register={m} variant="full" />);
const ready = () => screen.findByTestId("arp-totals");
const row = (id: string) => screen.getByTestId(`arp-row-${id}`);
const click = (name: string | RegExp, scope: HTMLElement = document.body) =>
  fireEvent.click(within(scope).getByRole("button", { name }));
const type = (scope: HTMLElement, label: string | RegExp, value: string) =>
  fireEvent.change(within(scope).getByLabelText(label), { target: { value } });
const radio = (scope: HTMLElement, name: string) =>
  fireEvent.click(within(scope).getByRole("radio", { name }));

beforeEach(() => {
  seq = 0;
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("flag off", () => {
  it.each(["compact", "full"] as const)(
    "the %s variant renders nothing and fetches nothing",
    (variant) => {
      const { container } = render(
        <AssumptionRegisterPanel register={null} variant={variant} />,
      );
      expect(container).toBeEmptyDOMElement();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});

describe("the compact group (phase pages)", () => {
  const compact = (
    rows: AssumptionView[],
    m: AssumptionRegisterMount = mount(),
    onOpenFullView?: () => void,
    extra: { figuresRedacted?: boolean; canEdit?: boolean } = {},
  ) => {
    serve(listOf(rows, extra));
    return render(
      <AssumptionRegisterPanel
        register={m}
        variant="compact"
        onOpenFullView={onOpenFullView}
      />,
    );
  };

  it("counts by status and open in the title, never a proposal, and never the full register", async () => {
    compact([
      view({ registerId: "V1", status: "open" }),
      view({ registerId: "V2", status: "open" }),
      view({ registerId: "V3", status: "confirmed", answerSource: "s" }),
      view({ registerId: "V4", status: "corrected", answerSource: "s" }),
      view({ registerId: "V5", status: "superseded" }),
      view({ registerId: "V6", status: "proposed", statement: "A proposal" }),
      view({ registerId: "V7", status: "rejected" }),
    ]);
    const group = await screen.findByTestId("assumption-register-compact");
    expect(screen.getByTestId("arp-compact-title").textContent).toBe(
      "Assumptions register · 4 in use · 2 to answer",
    );
    expect(screen.getByTestId("arp-compact-counts").textContent).toBe(
      "2 open · 1 confirmed · 1 corrected · 1 superseded",
    );
    expect(group.querySelector("details")).not.toHaveAttribute("open");
    expect(within(group).queryByText(/proposal/i)).toBeNull();
    expect(within(group).queryByText(/proposed/i)).toBeNull();
    expect(screen.queryByTestId("assumption-register-panel")).toBeNull();
    expect(screen.queryByTestId("arp-totals")).toBeNull();
  });

  it("lists only the open questions, with Answer… in place and no Supersede", async () => {
    compact(
      [
        // Given out of register order: the list is Value first, Adoption last.
        view({
          registerId: "A1",
          area: "adoption",
          status: "open",
          origin: "charter_carry_forward",
          ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
        }),
        view({ registerId: "V1", status: "open" }),
        view({ registerId: "V2", status: "confirmed", answerSource: "s" }),
        view({
          id: "00000000-0000-4000-8000-0000000000aa",
          registerId: "V3",
          status: "confirmed",
          answerSource: "s",
        }),
      ],
      mount({ staleAssumptionIds: ["00000000-0000-4000-8000-0000000000aa"] }),
    );
    const list = await screen.findByTestId("arp-compact-open");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.getAttribute("data-testid")),
    ).toEqual(["arp-row-V1", "arp-row-V3", "arp-row-A1"]);
    expect(screen.getByTestId("arp-compact-title")).toHaveTextContent(
      "· 4 in use · 3 to answer",
    );
    within(row("V1")).getByRole("button", { name: "Answer…" });
    within(row("V3")).getByRole("button", { name: "Re-answer…" });
    within(row("A1")).getByRole("button", { name: "Set role…" });
    expect(
      within(list).queryByRole("button", { name: "Supersede…" }),
    ).toBeNull();
  });

  it("answers in place through the decision route", async () => {
    const open = view({ registerId: "V1", revision: 3 });
    serve(listOf([open]), [{ body: { ok: true } }]);
    render(<AssumptionRegisterPanel register={mount()} variant="compact" />);
    click("Answer…", await screen.findByTestId("arp-row-V1"));
    const form = screen.getByRole("form", { name: "Answer V1" });
    radio(form, "Confirmed");
    type(form, "Source", "Finance time study");
    click("Save answer", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${open.id}/decision`,
      method: "POST",
      body: {
        action: "answer",
        outcome: "confirmed",
        answerSource: "Finance time study",
        answer: null,
        answerFigure: null,
        expectedRevision: 3,
      },
    });
  });

  it("links to the full register, and says when nothing is open", async () => {
    const onOpen = jest.fn();
    compact(
      [view({ registerId: "V1", status: "confirmed", answerSource: "s" })],
      mount(),
      onOpen,
    );
    await screen.findByTestId("assumption-register-compact");
    expect(screen.getByTestId("arp-compact-title").textContent).toBe(
      "Assumptions register · 1 in use",
    );
    expect(screen.queryByTestId("arp-compact-open")).toBeNull();
    screen.getByText("Nothing open: every assumption in use is answered.");
    fireEvent.click(screen.getByTestId("arp-open-full"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("has no link when the host gives it nowhere to go", async () => {
    compact([view({ registerId: "V1" })]);
    await screen.findByTestId("assumption-register-compact");
    expect(screen.queryByTestId("arp-open-full")).toBeNull();
  });

  it("renders nothing for a register holding only proposals", async () => {
    const { container } = compact([view({ status: "proposed" })]);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    // Let the read land, then check the group stayed away.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it("still carries the charter notes when the register is empty", async () => {
    compact([], mount({ charterUnavailable: true }));
    await screen.findByTestId("arp-charter-unavailable");
    expect(screen.queryByTestId("arp-compact-counts")).toBeNull();
  });

  it("a failed read is reported, never shown as an empty register", async () => {
    serve({ status: 503, body: { detail: "The register is unavailable." } });
    render(<AssumptionRegisterPanel register={mount()} variant="compact" />);
    expect((await screen.findByTestId("arp-load-failed")).textContent).toBe(
      "The register is unavailable.",
    );
    expect(screen.getByTestId("arp-compact-title").textContent).toBe(
      "Assumptions register",
    );
  });

  it("a withheld viewer sees the open questions with figures withheld and no actions", async () => {
    compact(
      [view({ registerId: "V1", workingFigure: "~2 days" })],
      mount(),
      undefined,
      { figuresRedacted: true, canEdit: true },
    );
    const item = await screen.findByTestId("arp-row-V1");
    expect(item).toHaveTextContent("Figure withheld · no financial visibility");
    expect(within(item).queryAllByRole("button")).toEqual([]);
  });
});

describe("the full register: rows", () => {
  it("reads this Move's register from the list route", async () => {
    serve(listOf([view({})]));
    full();
    await ready();
    expect(fetchMock.mock.calls[0][0]).toBe(BASE);
  });

  it("shows a loading line until the register is read", async () => {
    serve(listOf([]));
    full();
    screen.getByText("Loading the register…");
    await ready();
    expect(screen.queryByText("Loading the register…")).toBeNull();
  });

  it("row anatomy: ID · statement, why, ESTIMATE figure · source, owner role · confidence · origin, status at the right", async () => {
    serve(
      listOf([
        view({
          registerId: "V3",
          statement: "Each certified measure avoids rework",
          whyItMatters: "The largest recurring value lever",
          workingFigure: "~4 h per measure per month",
          source: "Session 2 notes, p.3",
          ownerRole: "Analytics lead",
          confidence: 3,
        }),
      ]),
    );
    full();
    await ready();
    const item = row("V3");
    const [text, actions] = Array.from(item.children) as HTMLElement[];
    expect(Array.from(text.children).map((el) => el.textContent)).toEqual([
      "V3 · Each certified measure avoids rework",
      "The largest recurring value lever",
      "Estimate~4 h per measure per month · Session 2 notes, p.3",
      "Analytics lead · Medium confidence · added by the team",
    ]);
    expect(within(text).getByText("Estimate")).toHaveClass("tag", "t-est");
    expect(within(actions).getByTestId("arp-status").textContent).toBe("Open");
  });

  it.each([
    [1, "Low"],
    [3, "Medium"],
    [5, "High"],
  ] as const)("confidence %s reads %s", async (confidence, word) => {
    serve(listOf([view({ registerId: "D1", confidence })]));
    full();
    await ready();
    expect(within(row("D1")).getByTestId("arp-meta")).toHaveTextContent(
      `${word} confidence`,
    );
  });

  it.each([
    ["team", "added by the team"],
    ["charter_carry_forward", "from the P1 charter"],
    ["ava_proposal", "aVa proposal, accepted"],
    ["evidence_extraction", "from evidence, accepted"],
  ] as const)("origin %s reads %s", async (origin, words) => {
    serve(listOf([view({ registerId: "V1", origin })]));
    full();
    await ready();
    expect(
      within(row("V1")).getByTestId("arp-meta").textContent?.endsWith(words),
    ).toBe(true);
  });

  it("a row with no figure says so and still cites its source", async () => {
    serve(listOf([view({ registerId: "V1", source: "Kickoff notes" })]));
    full();
    await ready();
    expect(row("V1")).toHaveTextContent(
      "No working figure stated · Kickoff notes",
    );
    expect(within(row("V1")).queryByText("Estimate")).toBeNull();
  });

  it("each status reads in its own words; answered rows show the answer and its source", async () => {
    serve(
      listOf([
        view({ registerId: "V1", status: "open" }),
        view({
          registerId: "V2",
          status: "confirmed",
          workingFigure: "~30%",
          answerSource: "Finance time study",
        }),
        view({
          registerId: "V3",
          status: "corrected",
          workingFigure: "1.5 h",
          answer: "Corrected from 1.5 h to 2 h",
          answerFigure: "2 h",
          answerSource: "Design workshop timing",
        }),
      ]),
    );
    full();
    await ready();
    const status = (id: string) =>
      within(row(id)).getByTestId("arp-status").textContent;
    expect([status("V1"), status("V2"), status("V3")]).toEqual([
      "Open",
      "Confirmed",
      "Corrected",
    ]);
    expect(within(row("V1")).queryByTestId("arp-answer")).toBeNull();
    expect(within(row("V2")).getByTestId("arp-answer").textContent).toBe(
      "Confirmed as stated · Finance time study",
    );
    expect(within(row("V3")).getByTestId("arp-answer").textContent).toBe(
      "Corrected from 1.5 h to 2 h · Design workshop timing",
    );
    // A corrected row stands only on its answer figure, cited to its answer.
    expect(row("V3")).toHaveTextContent("Estimate2 h · Design workshop timing");
    expect(row("V3")).not.toHaveTextContent("1.5 h ·");
    expect(row("V2")).toHaveTextContent("Estimate~30% · Team workshop");
  });

  it("superseded and rejected rows sit in their own collapsed group; a superseded row names its replacement", async () => {
    const replacement = view({ registerId: "A3", area: "adoption" });
    serve(
      listOf([
        view({
          registerId: "A2",
          area: "adoption",
          status: "superseded",
          supersededBy: replacement.id,
        }),
        view({ registerId: "V4", status: "rejected" }),
        replacement,
      ]),
    );
    full();
    await ready();
    const gone = screen.getByTestId("arp-gone");
    expect(gone).not.toHaveAttribute("open");
    expect(gone.querySelector("summary")).toHaveTextContent(
      "Superseded and rejected · 2",
    );
    expect(within(gone).getByTestId("arp-row-A2")).toHaveTextContent(
      "Replaced by A3. Documents citing [A:A2] show it as superseded.",
    );
    expect(within(gone).getByTestId("arp-row-V4")).toHaveTextContent(
      "Rejected as a proposal; it never joined the register.",
    );
    expect(
      within(screen.getByTestId("arp-area-adoption")).queryByTestId(
        "arp-row-A2",
      ),
    ).toBeNull();
    expect(screen.getByTestId("arp-totals").textContent).toBe(
      "1 in use · 1 to answer",
    );
  });

  it("an empty register says so", async () => {
    serve(listOf([]));
    full();
    expect(await screen.findByTestId("arp-empty")).toBeInTheDocument();
  });
});

describe("the full register: by area", () => {
  it("groups live rows Value, Data, Delivery, Adoption, each open, with n · k open", async () => {
    serve(
      listOf([
        view({ registerId: "A1", area: "adoption", seq: 1 }),
        view({ registerId: "V2", area: "value", seq: 2, status: "confirmed" }),
        view({ registerId: "V1", area: "value", seq: 1 }),
        view({
          registerId: "DL1",
          area: "delivery",
          seq: 1,
          status: "confirmed",
        }),
      ]),
    );
    full();
    await ready();
    const groups = screen
      .getAllByTestId(/^arp-area-/)
      .map((el) => [
        el.querySelector("summary")?.textContent,
        el.hasAttribute("open"),
      ]);
    expect(groups).toEqual([
      ["Value · 2 · 1 openShowHide", true],
      ["Delivery · 1ShowHide", true],
      ["Adoption · 1 · 1 openShowHide", true],
    ]);
    expect(
      within(screen.getByTestId("arp-area-value"))
        .getAllByRole("listitem")
        .map((li) => li.getAttribute("data-testid")),
    ).toEqual(["arp-row-V1", "arp-row-V2"]);
    expect(screen.queryByTestId("arp-area-data")).toBeNull();
  });
});

describe("the full register: by owner", () => {
  const staleId = "00000000-0000-4000-8000-0000000000bb";
  const rows = () => [
    view({
      registerId: "V1",
      ownerRole: "Finance lead",
      workingFigure: "~30%",
    }),
    view({ registerId: "V2", ownerRole: "Finance lead", status: "confirmed" }),
    view({
      id: staleId,
      registerId: "D2",
      area: "data",
      ownerRole: "Sponsor",
      status: "confirmed",
      answerSource: "s",
    }),
    // Sorts before BI lead in register order: the role-less group is moved last.
    view({
      registerId: "D4",
      area: "data",
      origin: "charter_carry_forward",
      ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
      ownerName: "Jordan Example",
    }),
    view({ registerId: "DL3", area: "delivery", ownerRole: "BI lead" }),
  ];

  it("shows only rows to answer, grouped by owner role, with the role-less group last", async () => {
    serve(listOf(rows()));
    full(mount({ staleAssumptionIds: [staleId] }));
    await ready();
    expect(screen.getByTestId("arp-totals").textContent).toBe(
      "5 in use · 4 to answer",
    );
    radio(document.body, "By owner");
    expect(screen.getByRole("radio", { name: "By owner" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.queryByTestId(/^arp-area-/)).toBeNull();
    const groups = screen.getAllByTestId(/^arp-owner-/);
    expect(
      groups.map((el) => el.querySelector("summary")?.textContent),
    ).toEqual([
      "Finance lead · 1 to answerShowHide",
      "Sponsor · 1 to answerShowHide",
      "BI lead · 1 to answerShowHide",
      "Owner not set as a role · 1 to answerShowHide",
    ]);
    expect(screen.queryByTestId("arp-row-V2")).toBeNull();
    expect(screen.queryByText(/Jordan Example/)).toBeNull();
    radio(document.body, "By area");
    expect(screen.getByTestId("arp-row-V2")).toBeInTheDocument();
  });

  it("copies the open questions for the client to the clipboard", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    serve(listOf(rows()));
    full(mount({ staleAssumptionIds: [staleId] }));
    await ready();
    radio(document.body, "By owner");
    click("Copy the open questions for the client");
    expect((await screen.findByTestId("arp-copied")).textContent).toBe(
      "Copied 4 open questions.",
    );
    expect(writeText).toHaveBeenCalledWith(
      [
        "Open questions for the client · 4 to answer",
        "",
        "Finance lead · 1 to answer",
        "- V1 · Statement 1 (working figure ~30%, Team workshop)",
        "",
        "Sponsor · 1 to answer",
        "- D2 · Statement 3",
        "",
        "BI lead · 1 to answer",
        "- DL3 · Statement 5",
        "",
        "Owner not set as a role · 1 to answer",
        "- D4 · Statement 4",
      ].join("\n"),
    );
  });

  it("one open question reads in the singular", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    serve(listOf([view({ registerId: "V1" })]));
    full();
    await ready();
    radio(document.body, "By owner");
    click("Copy the open questions for the client");
    expect((await screen.findByTestId("arp-copied")).textContent).toBe(
      "Copied 1 open question.",
    );
  });

  it.each([
    ["absent", undefined],
    ["refused", { writeText: () => Promise.reject(new Error("denied")) }],
  ])(
    "falls back to selected text when the clipboard is %s",
    async (_case, clipboard) => {
      Object.defineProperty(navigator, "clipboard", {
        value: clipboard,
        configurable: true,
      });
      serve(listOf([view({ registerId: "V1", workingFigure: "~30%" })]));
      full();
      await ready();
      radio(document.body, "By owner");
      click("Copy the open questions for the client");
      const box = (await screen.findByLabelText(
        "Open questions for the client",
      )) as HTMLTextAreaElement;
      expect(box.value).toBe(
        [
          "Open questions for the client · 1 to answer",
          "",
          "Finance lead · 1 to answer",
          "- V1 · Statement 1 (working figure ~30%, Team workshop)",
        ].join("\n"),
      );
      expect(box).toHaveAttribute("readonly");
      expect(box).toHaveFocus();
      expect([box.selectionStart, box.selectionEnd]).toEqual([
        0,
        box.value.length,
      ]);
      expect(screen.queryByTestId("arp-copied")).toBeNull();
    },
  );

  it("never writes a withheld figure into the hand-off", () => {
    expect(
      openQuestionsText(
        [view({ registerId: "V1", workingFigure: "~30%" })],
        true,
      ),
    ).not.toContain("~30%");
    expect(
      openQuestionsText(
        [
          view({
            registerId: "V1",
            workingFigure: "~30%",
            figuresRedacted: true,
          }),
        ],
        false,
      ),
    ).not.toContain("~30%");
  });

  it("says when nothing is left to answer, and offers no copy", async () => {
    serve(listOf([view({ registerId: "V1", status: "confirmed" })]));
    full();
    await ready();
    radio(document.body, "By owner");
    screen.getByText("Nothing to answer: every assumption in use is answered.");
    expect(
      screen.queryByRole("button", { name: /Copy the open questions/ }),
    ).toBeNull();
  });
});

describe("withheld figures and read-only viewers", () => {
  const rows = () => [
    view({ registerId: "V1", workingFigure: "~2 days" }),
    view({
      registerId: "V2",
      status: "corrected",
      workingFigure: "1.5 h",
      answer: "Corrected to 2 h",
      answerFigure: "2 h",
      answerSource: "Workshop",
    }),
    view({ registerId: "V3", status: "proposed", workingFigure: "~10%" }),
  ];

  it("a viewer without financial visibility sees figures and answers withheld, and no actions", async () => {
    serve(listOf(rows(), { figuresRedacted: true, canEdit: true }));
    full();
    await ready();
    expect(row("V1")).toHaveTextContent(
      "Figure withheld · no financial visibility",
    );
    expect(within(row("V2")).getByTestId("arp-answer").textContent).toBe(
      "Answer withheld · Workshop",
    );
    expect(screen.getByTestId("arp-proposal-V3")).toHaveTextContent(
      "Figure withheld · no financial visibility",
    );
    for (const figure of ["~2 days", "1.5 h", "2 h", "~10%"]) {
      expect(screen.queryByText(new RegExp(figure))).toBeNull();
    }
    expect(screen.queryByText("Estimate")).toBeNull();
    expect(screen.queryAllByRole("button")).toEqual([]);
  });

  it("the row's own flag alone withholds its figure and its actions", async () => {
    serve(
      listOf([
        view({
          registerId: "V1",
          workingFigure: "~2 days",
          figuresRedacted: true,
        }),
        view({ registerId: "V2", workingFigure: "~3 days" }),
        view({
          registerId: "V3",
          status: "proposed",
          workingFigure: "~4 days",
          figuresRedacted: true,
        }),
      ]),
    );
    full();
    await ready();
    expect(row("V1")).toHaveTextContent("Figure withheld");
    expect(within(row("V1")).queryAllByRole("button")).toEqual([]);
    expect(row("V2")).toHaveTextContent("~3 days");
    within(row("V2")).getByRole("button", { name: "Answer…" });
    const proposal = screen.getByTestId("arp-proposal-V3");
    expect(proposal).toHaveTextContent("Figure withheld");
    expect(within(proposal).queryAllByRole("button")).toEqual([]);
  });

  it("a viewer who cannot edit sees figures but gets no controls at all", async () => {
    serve(listOf(rows(), { canEdit: false }));
    full();
    await ready();
    expect(row("V1")).toHaveTextContent("~2 days");
    const controls = () =>
      screen
        .queryAllByRole("button")
        .filter((b) => b.getAttribute("role") !== "radio");
    expect(controls()).toEqual([]);
    radio(document.body, "By owner");
    expect(controls()).toEqual([]);
  });
});

describe("aVa proposals", () => {
  const proposal = (overrides: Partial<AssumptionView> = {}) =>
    view({
      registerId: "A9",
      area: "adoption",
      status: "proposed",
      origin: "ava_proposal",
      statement: "Steward enablement takes about two days per steward",
      whyItMatters: "Sizes the enablement line",
      workingFigure: "~2 days per steward",
      source: "Stewardship notes, p.4",
      ownerRole: "Steward lead",
      revision: 4,
      ...overrides,
    });

  it("sit apart, badged as aVa's draft, with the figure's source", async () => {
    serve(listOf([proposal(), view({ registerId: "V1" })]));
    full();
    await ready();
    const group = screen.getByTestId("arp-proposals");
    expect(within(group).getByRole("heading").textContent).toBe(
      "aVa proposals · not yet in the register · 1",
    );
    const item = within(group).getByTestId("arp-proposal-A9");
    expect(
      Array.from(item.children[0].children).map((el) => el.textContent),
    ).toEqual([
      "Ava draft · review",
      "Steward enablement takes about two days per steward",
      "Sizes the enablement line · Adoption · Steward lead",
      "Estimate~2 days per steward · Stewardship notes, p.4",
    ]);
    expect(within(group).queryByTestId("arp-row-V1")).toBeNull();
    expect(screen.queryByTestId("arp-row-A9")).toBeNull();
  });

  it("a proposal without a sourced figure reads to be set", async () => {
    serve(
      listOf([proposal({ workingFigure: null, source: "Delivery notes" })]),
    );
    full();
    await ready();
    expect(screen.getByTestId("arp-proposal-A9")).toHaveTextContent(
      "Working figure to be set: the source states none · Delivery notes",
    );
  });

  it("evidence proposals carry their own badge, never aVa's", async () => {
    serve(listOf([proposal({ origin: "evidence_extraction" })]));
    full();
    await ready();
    expect(screen.getByTestId("arp-proposal-A9")).toHaveTextContent(
      "From evidence · review",
    );
    expect(screen.queryByText("Ava draft · review")).toBeNull();
  });

  it.each(["Accept", "Reject"])(
    "%s posts the decision with the row's revision",
    async (label) => {
      const p = proposal();
      serve(listOf([p]), [{ body: { ok: true } }]);
      full();
      await ready();
      click(label, screen.getByTestId("arp-proposal-A9"));
      await waitFor(() => expect(writes()).toHaveLength(1));
      expect(writes()).toEqual([
        {
          url: `${BASE}/${p.id}/decision`,
          method: "POST",
          body: { action: label.toLowerCase(), expectedRevision: 4 },
        },
      ]);
      await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    },
  );

  it("a refused accept shows the route's detail word for word and re-reads nothing", async () => {
    const detail =
      "Someone changed this assumption after you opened it; it is now at revision 5. Nothing was saved.";
    serve(listOf([proposal()]), [
      { status: 409, body: { ok: false, error: "stale_revision", detail } },
    ]);
    full();
    await ready();
    click("Accept");
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Accept" })).toBeEnabled();
  });

  it("a refusal with no detail never claims nothing was saved", async () => {
    serve(listOf([proposal()]), [{ status: 500, body: {} }]);
    full();
    await ready();
    click("Reject");
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("HTTP 500");
    expect(alert).toHaveTextContent("may or may not have been saved");
  });

  it("an unreachable register never claims nothing was saved", async () => {
    serve(listOf([proposal()]));
    full();
    await ready();
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    click("Accept");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "could not be reached, so this change could not be confirmed",
    );
  });
});

describe("answering", () => {
  async function openAnswer(
    r: AssumptionView,
    replies: Reply[] = [],
    m = mount(),
  ) {
    serve(listOf([r]), replies);
    full(m);
    await ready();
    click(/^(Re-)?answer…$/i, row(r.registerId));
    return screen.getByRole("form", { name: `Answer ${r.registerId}` });
  }

  it("nothing is preselected; Confirmed needs a source, then posts with the row's revision", async () => {
    const r = view({ registerId: "V1", revision: 2 });
    const form = await openAnswer(r, [{ body: { ok: true } }]);
    const save = within(form).getByRole("button", { name: "Save answer" });
    expect(
      within(form)
        .getAllByRole("radio")
        .map((el) => el.getAttribute("aria-checked")),
    ).toEqual(["false", "false"]);
    type(form, "Source", "Finance time study");
    expect(save).toBeDisabled();
    radio(form, "Confirmed");
    expect(within(form).queryByLabelText("Corrected figure")).toBeNull();
    expect(save).toBeEnabled();
    type(form, "Source", "   ");
    expect(save).toBeDisabled();
    type(form, "Source", "Finance time study");
    type(form, "Note (optional)", "Confirmed at ~30%");
    click("Save answer", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${r.id}/decision`,
      method: "POST",
      body: {
        action: "answer",
        outcome: "confirmed",
        answerSource: "Finance time study",
        answer: "Confirmed at ~30%",
        answerFigure: null,
        expectedRevision: 2,
      },
    });
    await waitFor(() =>
      expect(screen.queryByRole("form", { name: "Answer V1" })).toBeNull(),
    );
  });

  it("Corrected also requires the new figure", async () => {
    const r = view({ registerId: "V1" });
    const form = await openAnswer(r, [{ body: { ok: true } }]);
    const save = within(form).getByRole("button", { name: "Save answer" });
    radio(form, "Corrected");
    type(form, "Source", "BI lead, Oct 16");
    expect(save).toBeDisabled();
    type(form, "Corrected figure", "  ");
    expect(save).toBeDisabled();
    type(form, "Corrected figure", "30 h per view");
    expect(save).toBeEnabled();
    type(form, "Source", " ");
    expect(save).toBeDisabled();
    type(form, "Source", "BI lead, Oct 16");
    click("Save answer", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0].body).toEqual({
      action: "answer",
      outcome: "corrected",
      answerSource: "BI lead, Oct 16",
      answerFigure: "30 h per view",
      answer: "Corrected to 30 h per view",
      expectedRevision: 1,
    });
  });

  it("a correction's note is its answer when given", async () => {
    const form = await openAnswer(view({ registerId: "V1" }), [
      { body: { ok: true } },
    ]);
    radio(form, "Corrected");
    type(form, "Corrected figure", "30 h");
    type(form, "Source", "BI lead");
    type(form, "Note (optional)", "Certification takes longer");
    click("Save answer", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0].body.answer).toBe("Certification takes longer");
  });

  it("a stale confirmed row is re-answered, and only as a correction", async () => {
    const staleId = "00000000-0000-4000-8000-0000000000cc";
    const r = view({
      id: staleId,
      registerId: "D2",
      area: "data",
      status: "confirmed",
      answerSource: "Charter scope answer",
    });
    const form = await openAnswer(
      r,
      [],
      mount({ staleAssumptionIds: [staleId] }),
    );
    expect(
      within(form)
        .getAllByRole("radio")
        .map((el) => [el.textContent, el.getAttribute("aria-checked")]),
    ).toEqual([["Corrected", "true"]]);
    within(form).getByLabelText("Corrected figure");
  });

  it("an answered row that is not stale offers no answer", async () => {
    serve(listOf([view({ registerId: "V1", status: "confirmed" })]));
    full();
    await ready();
    expect(
      within(row("V1")).queryByRole("button", { name: /answer/i }),
    ).toBeNull();
    within(row("V1")).getByRole("button", { name: "Supersede…" });
  });

  it("Cancel closes the form without a write", async () => {
    const form = await openAnswer(view({ registerId: "V1" }));
    click("Cancel", form);
    expect(screen.queryByRole("form", { name: "Answer V1" })).toBeNull();
    expect(writes()).toEqual([]);
  });

  it("a refused answer shows the detail and keeps the form open", async () => {
    const detail = "An answer must name its source. Nothing was saved.";
    const form = await openAnswer(view({ registerId: "V1" }), [
      { status: 400, body: { ok: false, detail } },
    ]);
    radio(form, "Confirmed");
    type(form, "Source", "x");
    click("Save answer", form);
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(screen.getByRole("form", { name: "Answer V1" })).toBeInTheDocument();
  });

  it("a change that landed without its history entry says so", async () => {
    const detail =
      "The change to V1 was saved (revision 3), but its history entry was not recorded. Do not repeat the change.";
    const form = await openAnswer(view({ registerId: "V1" }), [
      { body: { ok: true, historyRecorded: false, detail } },
    ]);
    radio(form, "Confirmed");
    type(form, "Source", "x");
    click("Save answer", form);
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
  });
});

describe("stale charter rows", () => {
  const staleId = "00000000-0000-4000-8000-0000000000dd";

  it("an answered stale row reads Re-check with the reason, and its answer is an outline Re-answer…", async () => {
    serve(
      listOf([
        view({
          id: staleId,
          registerId: "D2",
          status: "confirmed",
          origin: "charter_carry_forward",
          answerSource: "s",
        }),
        view({ registerId: "D3", status: "confirmed", answerSource: "s" }),
      ]),
    );
    full(mount({ staleAssumptionIds: [staleId] }));
    await ready();
    expect(within(row("D2")).getByTestId("arp-stale").textContent).toBe(
      "Re-check. The charter answer this row was raised from changed after it was answered.",
    );
    expect(
      within(row("D2")).getByRole("button", { name: "Re-answer…" }),
    ).toHaveClass("btn-line");
    expect(within(row("D3")).queryByTestId("arp-stale")).toBeNull();
  });

  it("an open stale row says the charter changed since it was raised", async () => {
    serve(listOf([view({ id: staleId, registerId: "D2" })]));
    full(mount({ staleAssumptionIds: [staleId] }));
    await ready();
    expect(within(row("D2")).getByTestId("arp-stale").textContent).toBe(
      "Re-check. The charter answer this row was raised from has changed since it was raised.",
    );
    expect(
      within(row("D2")).getByRole("button", { name: "Answer…" }),
    ).toHaveClass("btn-line");
  });

  it("an open row that is not stale answers through a quiet link", async () => {
    serve(listOf([view({ registerId: "D2" })]));
    full();
    await ready();
    expect(
      within(row("D2")).getByRole("button", { name: "Answer…" }),
    ).toHaveClass("link-btn");
  });

  it("a superseded row is never flagged stale", async () => {
    serve(
      listOf([view({ id: staleId, registerId: "D2", status: "superseded" })]),
    );
    full(mount({ staleAssumptionIds: [staleId] }));
    await ready();
    expect(screen.queryByTestId("arp-stale")).toBeNull();
  });

  it("says when the charter could not be checked, or charter rows could not be added", async () => {
    serve(listOf([]));
    full(mount({ charterUnavailable: true, unbridgedCharterCount: 2 }));
    await ready();
    screen.getByTestId("arp-charter-unavailable");
    expect(screen.getByTestId("arp-charter-unbridged")).toHaveTextContent(
      "2 charter assumptions could not be added",
    );
  });

  it("one unbridged charter assumption reads in the singular", async () => {
    serve(listOf([]));
    full(mount({ unbridgedCharterCount: 1 }));
    await ready();
    expect(screen.getByTestId("arp-charter-unbridged")).toHaveTextContent(
      "1 charter assumption could not be added",
    );
    expect(screen.queryByTestId("arp-charter-unavailable")).toBeNull();
  });
});

describe("a charter row whose owner needs a role", () => {
  const charterRow = (overrides: Partial<AssumptionView> = {}) =>
    view({
      registerId: "A1",
      area: "adoption",
      origin: "charter_carry_forward",
      ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
      ownerName: "Jordan Example",
      revision: 6,
      ...overrides,
    });

  it("reads Owner named in the P1 charter, set a role, and never shows the person", async () => {
    serve(listOf([charterRow()]));
    full();
    await ready();
    expect(within(row("A1")).getByTestId("arp-needs-role").textContent).toBe(
      "Owner named in the P1 charter, set a role",
    );
    expect(screen.queryByText(/Jordan Example/)).toBeNull();
  });

  it("a team row that happens to carry the same words is not flagged", async () => {
    serve(listOf([charterRow({ origin: "team", ownerRole: "Finance lead" })]));
    full();
    await ready();
    expect(within(row("A1")).queryByTestId("arp-needs-role")).toBeNull();
    expect(
      within(row("A1")).queryByRole("button", { name: "Set role…" }),
    ).toBeNull();
  });

  it("Set role explains the register holds roles, refuses a name, and patches the role with the row's revision", async () => {
    const r = charterRow();
    serve(listOf([r]), [{ body: { ok: true } }]);
    full();
    await ready();
    click("Set role…", row("A1"));
    const form = screen.getByRole("form", { name: "Set the owner role" });
    expect(form).toHaveTextContent("The register holds roles");
    const save = within(form).getByRole("button", { name: "Set role" });
    expect(save).toBeDisabled();
    type(form, "Owner role", "Jordan Example");
    expect(within(form).getByTestId("arp-role-is-name")).toBeInTheDocument();
    expect(save).toBeDisabled();
    type(form, "Owner role", "Steward lead");
    expect(within(form).queryByTestId("arp-role-is-name")).toBeNull();
    click("Set role", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${r.id}`,
      method: "PATCH",
      body: { expectedRevision: 6, ownerRole: "Steward lead" },
    });
  });

  it("an answered row keeps the prompt without the control, and still waits for a role", async () => {
    serve(listOf([charterRow({ status: "confirmed", answerSource: "s" })]));
    full();
    await ready();
    expect(screen.getByTestId("arp-totals").textContent).toBe(
      "1 in use · 1 to answer",
    );
    radio(document.body, "By owner");
    expect(
      screen.getByTestId("arp-owner-Owner not set as a role"),
    ).toContainElement(row("A1"));
    within(row("A1")).getByTestId("arp-needs-role");
    expect(
      within(row("A1")).queryByRole("button", { name: "Set role…" }),
    ).toBeNull();
  });
});

describe("superseding", () => {
  const target = () => view({ registerId: "V2", statement: "The replacement" });

  it("requires a choice of what replaces the row", async () => {
    serve(listOf([view({ registerId: "V1" }), target()]));
    full();
    await ready();
    click("Supersede…", row("V1"));
    const form = screen.getByTestId("arp-supersede-form");
    expect(form).toHaveTextContent(
      "Superseding keeps V1 in the history; documents citing [A:V1] show it as superseded.",
    );
    expect(
      within(form).queryByRole("button", { name: "Supersede" }),
    ).toBeNull();
    click("Cancel", form);
    expect(screen.queryByTestId("arp-supersede-form")).toBeNull();
  });

  it("an existing row: requires the row, then posts supersededBy with the revision", async () => {
    const r = view({ registerId: "V1", revision: 7 });
    const t = target();
    serve(listOf([r, t]), [{ body: { ok: true } }]);
    full();
    await ready();
    click("Supersede…", row("V1"));
    const box = screen.getByTestId("arp-supersede-form");
    radio(box, "A row already in the register");
    const form = within(box).getByRole("form", { name: "Supersede V1" });
    const select = within(form).getByLabelText("Replaced by");
    expect(
      Array.from((select as HTMLSelectElement).options).map(
        (o) => o.textContent,
      ),
    ).toEqual(["Choose a row…", "V2 · The replacement"]);
    const save = within(form).getByRole("button", { name: "Supersede" });
    expect(save).toBeDisabled();
    fireEvent.change(select, { target: { value: t.id } });
    expect(save).toBeEnabled();
    click("Supersede", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: `${BASE}/${r.id}/decision`,
      method: "POST",
      body: { action: "supersede", supersededBy: t.id, expectedRevision: 7 },
    });
  });

  it("a new assumption: prefilled from the row, needs a new source, posts the replacement", async () => {
    const r = view({
      registerId: "V1",
      statement: "Pilot users log in weekly",
      whyItMatters: "Early adoption signal",
      workingFigure: "weekly",
      ownerRole: "Product owner",
      confidence: 1,
      revision: 2,
    });
    serve(listOf([r]), [{ body: { ok: true } }]);
    full();
    await ready();
    click("Supersede…", row("V1"));
    // With no other live row, the only choice is a new assumption.
    const form = screen.getByRole("form", { name: "Replace V1" });
    expect(within(form).queryByLabelText("Area")).toBeNull();
    const save = within(form).getByRole("button", { name: "Supersede" });
    expect(save).toHaveClass("btn-line");
    expect(save).toBeDisabled();
    type(form, "Assumption", "Most pilot users use certified measures weekly");
    type(form, /Working figure/, "≥60% of pilot users");
    type(form, "Source", "Session 3 notes, p.5");
    expect(save).toBeEnabled();
    click("Supersede", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0].body).toEqual({
      action: "supersede",
      replacement: {
        statement: "Most pilot users use certified measures weekly",
        whyItMatters: "Early adoption signal",
        workingFigure: "≥60% of pilot users",
        source: "Session 3 notes, p.5",
        ownerRole: "Product owner",
        confidence: 1,
      },
      expectedRevision: 2,
    });
  });

  it("a replacement for a role-less charter row asks for a role", async () => {
    serve(
      listOf([
        view({
          registerId: "A1",
          origin: "charter_carry_forward",
          ownerRole: CHARTER_OWNER_ROLE_PLACEHOLDER,
        }),
      ]),
    );
    full();
    await ready();
    click("Supersede…", row("A1"));
    const form = screen.getByRole("form", { name: "Replace A1" });
    expect(within(form).getByLabelText("Owner role")).toHaveValue("");
  });

  it("a refused supersede that stored its replacement shows the detail and re-reads the register", async () => {
    const detail =
      "Nothing was saved to V1. The replacement assumption V2 WAS saved as an open row.";
    serve(listOf([view({ registerId: "V1", workingFigure: "x" })]), [
      {
        status: 409,
        body: { ok: false, detail, replacement: { registerId: "V2" } },
      },
    ]);
    full();
    await ready();
    click("Supersede…", row("V1"));
    const form = screen.getByRole("form", { name: "Replace V1" });
    type(form, "Source", "x");
    click("Supersede", form);
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });
});

describe("adding", () => {
  it("requires area, owner role, assumption, figure and source; then posts a team row", async () => {
    serve(listOf([]), [{ status: 201, body: { ok: true } }]);
    full();
    await ready();
    click("Add an assumption");
    const form = screen.getByRole("form", { name: "Add an assumption" });
    expect(
      screen.queryByRole("button", { name: "Add an assumption" }),
    ).toBeNull();
    const save = within(form).getByRole("button", {
      name: "Add to the register",
    });
    const fill: Array<[string | RegExp, string]> = [
      ["Area", "delivery"],
      ["Owner role", "Delivery lead"],
      ["Assumption", "A source takes about three days to onboard"],
      [/Working figure/, "~24 h per source"],
      ["Source", "Delivery notes, Oct 16, p.2"],
    ];
    // Each required field alone holds the form.
    for (const [index] of fill.entries()) {
      fill.forEach(([label, value], i) =>
        type(form, label, i === index ? "" : value),
      );
      expect(save).toBeDisabled();
    }
    fill.forEach(([label, value]) => type(form, label, value));
    expect(save).toBeEnabled();
    expect(within(form).getByRole("radio", { name: "Medium" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    radio(form, "High");
    type(form, "Why it matters (optional)", "Unit hours for sources");
    click("Add to the register", form);
    await waitFor(() => expect(writes()).toHaveLength(1));
    expect(writes()[0]).toEqual({
      url: BASE,
      method: "POST",
      body: {
        area: "delivery",
        statement: "A source takes about three days to onboard",
        whyItMatters: "Unit hours for sources",
        workingFigure: "~24 h per source",
        source: "Delivery notes, Oct 16, p.2",
        ownerRole: "Delivery lead",
        confidence: 5,
      },
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("form", { name: "Add an assumption" }),
      ).toBeNull(),
    );
  });

  it("refuses a person's name as the owner role", async () => {
    serve(listOf([]));
    full();
    await ready();
    click("Add an assumption");
    const form = screen.getByRole("form", { name: "Add an assumption" });
    type(form, "Area", "value");
    type(form, "Assumption", "x");
    type(form, /Working figure/, "x");
    type(form, "Source", "x");
    type(form, "Owner role", "Jordan Example");
    within(form).getByTestId("arp-role-is-name");
    expect(
      within(form).getByRole("button", { name: "Add to the register" }),
    ).toBeDisabled();
  });
});

describe("failures", () => {
  it("a failed register read shows the route's detail, never an empty register", async () => {
    serve({ status: 403, body: { detail: "You cannot read this register." } });
    full();
    expect((await screen.findByTestId("arp-load-failed")).textContent).toBe(
      "You cannot read this register.",
    );
    expect(screen.queryByTestId("arp-empty")).toBeNull();
  });

  it("a failed read with no detail names the HTTP status and that nothing changed", async () => {
    serve({ status: 502, body: {} });
    full();
    expect(await screen.findByTestId("arp-load-failed")).toHaveTextContent(
      "could not be read (HTTP 502). Nothing was changed.",
    );
  });

  it("an unreachable register says so", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    full();
    expect(await screen.findByTestId("arp-load-failed")).toHaveTextContent(
      "could not be reached. Nothing was changed.",
    );
  });
});
