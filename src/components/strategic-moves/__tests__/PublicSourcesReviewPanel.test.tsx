/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { PublicSourcesReviewPanel } from "../PublicSourcesReviewPanel";
import {
  PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
  PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS,
  PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
  describePublicSourceReviewRefusal,
  publicSourceCiteNumbers,
  type PublicSourceReviewItem,
} from "@/lib/deliverables/public-research/review-contract";

const MOVE = "11111111-1111-4111-8111-111111111111";
const LIST_URL = `/api/v1/programs/${MOVE}/public-sources`;
const REVIEW_URL = (id: string) =>
  `/api/v1/programs/${MOVE}/public-sources/${id}/review`;

function item(
  over: Partial<PublicSourceReviewItem> = {},
): PublicSourceReviewItem {
  return {
    id: "source-1",
    decision: "pending",
    url: "https://example.org/rule",
    title: "Program payment rule",
    publisher: "Example Agency",
    publishedAt: "2026-01-15",
    retrievedAt: "2026-10-10T08:30:00.000Z",
    excerpt: "Payments are made within 30 days of an eligible claim.",
    claim: "Payment timing for eligible claims.",
    confidence: "medium",
    reviewedAt: null,
    reviewNote: null,
    ...over,
  };
}

function json(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

type Call = { url: string; init?: RequestInit };

/** The list route returns `lists` in turn (the last one repeats); anything else is the review route. */
function mockFetch(
  lists: PublicSourceReviewItem[] | PublicSourceReviewItem[][],
  decide: (call: Call) => unknown = (call) => {
    const body = JSON.parse(String(call.init?.body)) as {
      decision: string;
      note?: string;
    };
    return json(200, {
      ok: true,
      source: {
        ...item(),
        decision: body.decision,
        reviewedAt: "2026-10-11T09:00:00.000Z",
        reviewNote: body.note ?? null,
      },
    });
  },
) {
  const queue = (
    Array.isArray(lists[0]) ? lists : [lists]
  ) as PublicSourceReviewItem[][];
  let read = 0;
  const calls: Call[] = [];
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url === LIST_URL) {
      const sources = queue[Math.min(read, queue.length - 1)]!;
      read += 1;
      return json(200, { ok: true, decision: null, sources });
    }
    return decide({ url, init });
  }) as unknown as typeof fetch;
  return calls;
}

function renderPanel(
  props: Partial<React.ComponentProps<typeof PublicSourcesReviewPanel>> = {},
) {
  return render(
    <PublicSourcesReviewPanel programId={MOVE} enabled canDecide {...props} />,
  );
}

const group = (key: "pending" | "approved" | "rejected") =>
  screen.getByTestId(`public-sources-${key}`);

/** The inline confirm, if open (a <details> group is also a "group"). */
const queryConfirm = () =>
  screen.queryByRole("group", {
    name: /^(Approve|Reject) Program payment rule$/,
  });

async function openConfirm(
  verb: "Approve" | "Reject",
  title = "Program payment rule",
) {
  fireEvent.click(
    await screen.findByRole("button", { name: `${verb} ${title}…` }),
  );
  return screen.getByRole("group", { name: `${verb} ${title}` });
}

const SET = [
  item({ id: "p1", title: "Pending rule" }),
  item({
    id: "a2",
    title: "Second approved",
    decision: "approved",
    reviewedAt: "2026-10-09T10:00:00.000Z",
    reviewNote: "Directional only; no figure used.",
  }),
  item({
    id: "a1",
    title: "First approved",
    decision: "approved",
    reviewedAt: "2026-10-08T10:00:00.000Z",
  }),
  item({
    id: "r1",
    title: "Vendor brief",
    decision: "rejected",
    reviewedAt: "2026-10-08T11:00:00.000Z",
    reviewNote: "Marketing claim; no method.",
  }),
];

afterEach(() => {
  jest.restoreAllMocks();
});

describe("PublicSourcesReviewPanel", () => {
  it("renders nothing and fetches nothing when the flag is off", () => {
    const calls = mockFetch([item()]);
    const { container } = renderPanel({ enabled: false });
    expect(container).toBeEmptyDOMElement();
    expect(calls).toHaveLength(0);
  });

  it("reads every decision and states that public sources are not facts about the client", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    await screen.findByTestId("public-source-row");
    expect(calls[0]!.url).toBe(LIST_URL);
    const section = screen.getByRole("region", { name: "Public sources" });
    expect(section).toHaveTextContent(
      "Found by research. Not facts about the client: only approved sources can be cited, and only as public sources, never as FACT.",
    );
  });

  it("groups sources as To review (open), Approved · citable and Rejected (collapsed)", async () => {
    mockFetch(SET);
    renderPanel();
    await screen.findAllByTestId("public-source-row");
    const pending = group("pending");
    const approved = group("approved");
    const rejected = group("rejected");
    expect(within(pending).getByText("To review · 1")).toBeInTheDocument();
    expect(
      within(approved).getByText("Approved · citable · 2"),
    ).toBeInTheDocument();
    expect(within(rejected).getByText("Rejected · 1")).toBeInTheDocument();
    expect(pending).toHaveAttribute("open");
    expect(approved).not.toHaveAttribute("open");
    expect(rejected).not.toHaveAttribute("open");
    expect(pending).toHaveTextContent("Pending rule");
    expect(approved).toHaveTextContent("First approved");
    expect(approved).toHaveTextContent("Second approved");
    expect(rejected).toHaveTextContent("Vendor brief");
    // Groups follow the design's order.
    const order = screen
      .getAllByTestId(/^public-sources-(pending|approved|rejected)$/)
      .map((el) => el.getAttribute("data-testid"));
    expect(order).toEqual([
      "public-sources-pending",
      "public-sources-approved",
      "public-sources-rejected",
    ]);
  });

  it("shows an approved source's cite id in approval order, and a rejected source none", async () => {
    mockFetch(SET);
    renderPanel();
    await screen.findAllByTestId("public-source-row");
    const row = (title: string) =>
      screen
        .getAllByTestId("public-source-row")
        .find((r) => r.textContent?.includes(title))!;
    expect(row("First approved")).toHaveTextContent(
      "Approved Oct 8, 2026 · cite as [S:1]",
    );
    expect(row("Second approved")).toHaveTextContent(
      "Approved Oct 9, 2026 · cite as [S:2] · Directional only; no figure used.",
    );
    expect(row("Vendor brief")).toHaveTextContent(
      "Rejected Oct 8, 2026 · Marketing claim; no method.",
    );
    expect(row("Vendor brief")).not.toHaveTextContent("cite as");
    // The approved group reads in citation order, whatever order the list sent.
    expect(
      within(group("approved"))
        .getAllByTestId("public-source-row")
        .map((r) => r.querySelector(".item-name")?.textContent),
    ).toEqual([
      "Example Agency · First approved",
      "Example Agency · Second approved",
    ]);
    expect(row("Pending rule")).not.toHaveTextContent("cite as");
    // Decided sources are never offered a decision again.
    expect(
      screen.queryByRole("button", { name: "Approve First approved…" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Reject Vendor brief…" }),
    ).toBeNull();
  });

  it("renders the design's item: publisher · title, dates, confidence in words, quiet quote, Public source tag, link", async () => {
    mockFetch([item()]);
    renderPanel();
    const row = await screen.findByTestId("public-source-row");
    expect(row).toHaveTextContent("Example Agency · Program payment rule");
    expect(row).toHaveTextContent(
      "Published Jan 15, 2026 · retrieved Oct 10, 2026 · Medium confidence",
    );
    const quote = row.querySelector("blockquote")!;
    expect(quote).toHaveClass("excerpt");
    expect(quote).toHaveTextContent(
      "“Payments are made within 30 days of an eligible claim.”",
    );
    const tagLine = within(row).getByText("Public source").parentElement!;
    expect(tagLine).toHaveClass("src");
    expect(within(row).getByText("Public source")).toHaveClass(
      "tag",
      "t-pattern",
    );
    expect(tagLine).toHaveTextContent(
      "Public sourceSupports: Payment timing for eligible claims.",
    );
    const link = within(row).getByRole("link", { name: "Open source →" });
    expect(link).toHaveAttribute("href", "https://example.org/rule");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never marks a public source FACT, approved or not", async () => {
    mockFetch(SET);
    const { container } = renderPanel();
    await screen.findAllByTestId("public-source-row");
    expect(container.querySelector(".t-fact")).toBeNull();
    expect(screen.queryByText("Fact")).toBeNull();
    expect(screen.getAllByText("Public source")).toHaveLength(SET.length);
  });

  it.each([
    ["high", "High confidence"],
    ["low", "Low confidence"],
    ["unverified", "Confidence unverified"],
    [null, "Confidence not stated"],
  ] as const)("states confidence %s as words", async (confidence, words) => {
    mockFetch([item({ confidence })]);
    renderPanel();
    expect(await screen.findByTestId("public-source-row")).toHaveTextContent(
      words,
    );
  });

  it("says when a publisher, a published date or a claim is not stated", async () => {
    mockFetch([item({ publisher: null, publishedAt: null, claim: null })]);
    renderPanel();
    const row = await screen.findByTestId("public-source-row");
    expect(row).toHaveTextContent(
      "Publisher not stated · Program payment rule",
    );
    expect(row).toHaveTextContent("Published date not stated");
    expect(row).toHaveTextContent("Supports: no claim stated");
  });

  it("renders stored fields as text and links out only to https", async () => {
    mockFetch([
      item({
        id: "a",
        title: "<b>Unsafe link</b>",
        publisher: "<i>Pub</i>",
        url: "javascript:alert(1)",
        excerpt: '<img src="x" onerror="alert(1)">',
        claim: "<script>alert(1)</script>",
      }),
      item({ id: "b", title: "Plain http", url: "http://example.org/x" }),
      item({ id: "c", title: "Data url", url: "data:text/html,hi" }),
      item({ id: "d", title: "Not a url", url: "example.org/x" }),
    ]);
    const { container } = renderPanel();
    const rows = await screen.findAllByTestId("public-source-row");
    expect(rows).toHaveLength(4);
    expect(screen.queryByRole("link")).toBeNull();
    for (const row of rows) {
      expect(row).toHaveTextContent(
        "No link offered: the address is not https.",
      );
    }
    expect(rows[0]).toHaveTextContent('<img src="x" onerror="alert(1)">');
    expect(rows[0]).toHaveTextContent("<i>Pub</i> · <b>Unsafe link</b>");
    expect(rows[0]).toHaveTextContent("<script>alert(1)</script>");
    expect(container.querySelector("img, b, i, script")).toBeNull();
  });

  it("drops anything the list returns outside the decision vocabulary", async () => {
    mockFetch([
      item({ id: "p" }),
      item({
        id: "x",
        title: "Strange decision",
        decision: "maybe" as PublicSourceReviewItem["decision"],
      }),
    ]);
    renderPanel();
    const rows = await screen.findAllByTestId("public-source-row");
    expect(rows).toHaveLength(1);
    expect(screen.queryByText(/Strange decision/)).toBeNull();
  });

  it("opens an inline confirm that says a source is decided once, and Cancel closes it without a write", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    const confirm = await openConfirm("Approve");
    expect(confirm).toHaveTextContent(
      "Approve this source? A source is decided once; it can’t be changed later.",
    );
    expect(
      within(confirm).getByRole("textbox", { name: "Note (optional)" }),
    ).toHaveAttribute("maxLength", String(PUBLIC_SOURCE_REVIEW_NOTE_MAX_CHARS));
    expect(
      within(confirm).getByRole("button", { name: "Approve source" }),
    ).toHaveClass("btn-ink");
    // While the confirm is open, the row's own decision buttons are not offered.
    expect(
      screen.queryByRole("button", { name: "Approve Program payment rule…" }),
    ).toBeNull();
    fireEvent.click(within(confirm).getByRole("button", { name: "Cancel" }));
    expect(queryConfirm()).toBeNull();
    expect(
      screen.getByRole("button", { name: "Approve Program payment rule…" }),
    ).toBeEnabled();
    expect(calls).toHaveLength(1);
  });

  it("asks before rejecting, with Reject source as the outline action", async () => {
    mockFetch([item()]);
    renderPanel();
    const confirm = await openConfirm("Reject");
    expect(confirm).toHaveTextContent(
      "Reject this source? A source is decided once; it can’t be changed later.",
    );
    expect(
      within(confirm).getByRole("button", { name: "Reject source" }),
    ).toHaveClass("btn-line");
  });

  it("approves through the review route, moves the source to Approved · citable and shows its cite id", async () => {
    const calls = mockFetch([
      item(),
      item({
        id: "older",
        title: "Older approval",
        decision: "approved",
        reviewedAt: "2026-10-01T00:00:00.000Z",
      }),
    ]);
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Approved: Program payment rule · cite as [S:2]",
    );
    const post = calls[1]!;
    expect(post.url).toBe(REVIEW_URL("source-1"));
    expect(post.init?.method).toBe("POST");
    expect(JSON.parse(String(post.init?.body))).toEqual({
      decision: "approved",
    });
    expect(screen.queryByTestId("public-sources-pending")).toBeNull();
    expect(
      screen.getByText("Nothing to review. New research findings appear here."),
    ).toBeInTheDocument();
    const row = within(group("approved"))
      .getAllByTestId("public-source-row")
      .find((r) => r.textContent?.includes("Program payment rule"))!;
    expect(row).toHaveTextContent(
      "Approved by you, Oct 11, 2026 · cite as [S:2]",
    );
    expect(queryConfirm()).toBeNull();
  });

  it("rejects with the reviewer's trimmed note, and the note shows on the decided source", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    const confirm = await openConfirm("Reject");
    fireEvent.change(
      within(confirm).getByRole("textbox", { name: "Note (optional)" }),
      { target: { value: "  Superseded by the 2026 notice. " } },
    );
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Reject source" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Rejected: Program payment rule",
    );
    expect(screen.getByRole("status")).not.toHaveTextContent("cite as");
    expect(JSON.parse(String(calls[1]!.init?.body))).toEqual({
      decision: "rejected",
      note: "Superseded by the 2026 notice.",
    });
    expect(
      within(group("rejected")).getByTestId("public-source-row"),
    ).toHaveTextContent(
      "Rejected by you, Oct 11, 2026 · Superseded by the 2026 notice.",
    );
  });

  it("sends no note when the note is only whitespace", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.change(
      within(confirm).getByRole("textbox", { name: "Note (optional)" }),
      { target: { value: "   " } },
    );
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await screen.findByRole("status");
    expect(JSON.parse(String(calls[1]!.init?.body))).toEqual({
      decision: "approved",
    });
  });

  it("reads the list again when a recorded decision does not return the stored source", async () => {
    const calls = mockFetch(
      [
        [item()],
        [
          item({
            decision: "approved",
            reviewedAt: "2026-10-11T09:00:00.000Z",
          }),
        ],
      ],
      () => json(200, { ok: true }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("public-sources-approved")).toBeInTheDocument(),
    );
    expect(calls.map((c) => c.url)).toEqual([
      LIST_URL,
      REVIEW_URL("source-1"),
      LIST_URL,
    ]);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Approved: Program payment rule · cite as [S:1]",
    );
  });

  it("does not take a returned source for a different decision as the one recorded", async () => {
    const calls = mockFetch([item()], () =>
      json(200, {
        ok: true,
        source: { ...item(), decision: "rejected" },
      }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await waitFor(() => expect(calls).toHaveLength(3));
    expect(calls[2]!.url).toBe(LIST_URL);
  });

  it("shows the route's sentence verbatim and keeps the confirm open when the decision is unconfirmed", async () => {
    const detail = describePublicSourceReviewRefusal(
      "review_decision_unconfirmed",
    );
    const calls = mockFetch([item()], () =>
      json(500, { ok: false, error: "review_decision_unconfirmed", detail }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toBe(detail);
    expect(alert).toHaveClass("refusal");
    // Stated inside the confirm it answers, once.
    expect(within(confirm).getByRole("alert")).toBe(alert);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(group("pending")).toHaveTextContent("Program payment rule");
    expect(
      screen.getByRole("button", { name: "Approve source" }),
    ).toBeEnabled();
    expect(screen.queryByRole("status")).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it.each(["already_decided", "decided_by_another_reviewer"] as const)(
    "shows the sentence and reads the standing decision when the server reports %s",
    async (code) => {
      const detail = describePublicSourceReviewRefusal(code, {
        currentDecision: "approved",
      });
      const calls = mockFetch(
        [
          [item()],
          [
            item({
              decision: "approved",
              reviewedAt: "2026-10-10T12:00:00.000Z",
            }),
          ],
        ],
        () => json(409, { ok: false, error: code, detail }),
      );
      renderPanel();
      const confirm = await openConfirm("Approve");
      fireEvent.click(
        within(confirm).getByRole("button", { name: "Approve source" }),
      );
      expect((await screen.findByRole("alert")).textContent).toBe(detail);
      await waitFor(() => expect(calls).toHaveLength(3));
      expect(calls[2]!.url).toBe(LIST_URL);
      expect(
        await screen.findByTestId("public-sources-approved"),
      ).toHaveTextContent("Approved Oct 10, 2026 · cite as [S:1]");
      expect(screen.queryByTestId("public-sources-pending")).toBeNull();
      expect(queryConfirm()).toBeNull();
      // The confirm closed, so the sentence stays at the head of the section.
      expect(screen.getByRole("alert").textContent).toBe(detail);
      expect(screen.getByRole("alert").closest(".warn-inline")).toBeNull();
    },
  );

  it("keeps a source the server refused for another reason, and reads nothing again", async () => {
    const detail = describePublicSourceReviewRefusal("forbidden");
    const calls = mockFetch([item()], () =>
      json(403, { ok: false, error: "forbidden", detail }),
    );
    renderPanel();
    const confirm = await openConfirm("Reject");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Reject source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(group("pending")).toHaveTextContent("Program payment rule");
    expect(queryConfirm()).toBeInTheDocument();
    expect(calls).toHaveLength(2);
  });

  it("claims neither direction when a refusal arrives without a sentence", async () => {
    mockFetch([item()], () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    }));
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
    );
  });

  it("claims neither direction when a refusal carries a blank sentence", async () => {
    mockFetch([item()], () =>
      json(500, { ok: false, error: "x", detail: "   " }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
    );
  });

  it("claims neither direction when the request itself fails", async () => {
    mockFetch([item()], () => {
      throw new Error("network");
    });
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
    );
  });

  it("clears a refusal when the reviewer opens a confirm again", async () => {
    const detail = describePublicSourceReviewRefusal("forbidden");
    mockFetch([item()], () =>
      json(403, { ok: false, error: "forbidden", detail }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await screen.findByRole("alert");
    fireEvent.click(within(confirm).getByRole("button", { name: "Cancel" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Reject Program payment rule…" }),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("withholds every decision control while one decision is in flight", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    mockFetch(
      [item({ id: "a" }), item({ id: "b", title: "Second rule" })],
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled(),
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(
      screen.getByRole("textbox", { name: "Note (optional)" }),
    ).toBeDisabled();
    await act(async () => {
      resolve(json(500, { ok: false, error: "x", detail: "Not recorded." }));
    });
    expect(
      screen.getByRole("button", { name: "Approve Second rule…" }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Approve source" }),
    ).toBeEnabled();
  });

  it("offers no decision to a user without review authority, and says who can", async () => {
    mockFetch(SET);
    renderPanel({ canDecide: false });
    await screen.findAllByTestId("public-source-row");
    expect(
      screen.getByRole("region", { name: "Public sources" }),
    ).toHaveTextContent(
      "Only an authorized workspace user can approve or reject a source.",
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(group("approved")).toHaveTextContent("cite as [S:1]");
  });

  it("does not say who can decide to a user who can", async () => {
    mockFetch([item()]);
    renderPanel();
    await screen.findByTestId("public-source-row");
    expect(
      screen.queryByText(
        "Only an authorized workspace user can approve or reject a source.",
      ),
    ).toBeNull();
  });

  it("shows a loading line before the list arrives", () => {
    global.fetch = jest.fn(
      () => new Promise(() => undefined),
    ) as unknown as typeof fetch;
    renderPanel();
    expect(screen.getByText("Loading public sources…")).toBeInTheDocument();
  });

  it("shows the list route's sentence verbatim when the list cannot be read, never an empty queue", async () => {
    // Not the unnamed-failure sentence, so a reader that drops the route's
    // own sentence cannot pass by printing its fallback.
    const detail = describePublicSourceReviewRefusal("invalid_scope");
    expect(detail).not.toBe(PUBLIC_SOURCE_LIST_UNNAMED_FAILURE);
    global.fetch = jest.fn(async () =>
      json(400, { ok: false, error: "invalid_scope", detail }),
    ) as unknown as typeof fetch;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(
      screen.queryByText(
        "Nothing to review. New research findings appear here.",
      ),
    ).toBeNull();
  });

  it("says the list is unknown when the list route refuses without a sentence", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    })) as unknown as typeof fetch;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("says the list is unknown when the list route's sentence is blank", async () => {
    global.fetch = jest.fn(async () =>
      json(503, { ok: false, error: "sources_unreadable", detail: "  " }),
    ) as unknown as typeof fetch;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("says the list is unknown when the read fails without a sentence", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it.each([
    { ok: true },
    { ok: true, sources: {} },
    { ok: true, sources: "x" },
  ])(
    "treats a success without a source array (%j) as unknown, not empty",
    async (body) => {
      global.fetch = jest.fn(async () =>
        json(200, body),
      ) as unknown as typeof fetch;
      renderPanel();
      expect((await screen.findByRole("alert")).textContent).toBe(
        PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
      );
    },
  );

  it("clears a refusal when a retry from the same confirm is recorded", async () => {
    const detail = describePublicSourceReviewRefusal("review_read_failed");
    let attempt = 0;
    mockFetch([item()], () => {
      attempt += 1;
      return attempt === 1
        ? json(503, { ok: false, error: "review_read_failed", detail })
        : json(200, {
            ok: true,
            source: {
              ...item(),
              decision: "approved",
              reviewedAt: "2026-10-11T09:00:00.000Z",
            },
          });
    });
    renderPanel();
    const confirm = await openConfirm("Approve");
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    fireEvent.click(
      within(confirm).getByRole("button", { name: "Approve source" }),
    );
    await screen.findByRole("status");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the last recorded decision when the next one is refused", async () => {
    const detail = describePublicSourceReviewRefusal("forbidden");
    let attempt = 0;
    mockFetch(
      [item({ id: "a" }), item({ id: "b", title: "Second rule" })],
      () => {
        attempt += 1;
        return attempt === 1
          ? json(200, {
              ok: true,
              source: {
                ...item({ id: "a" }),
                decision: "approved",
                reviewedAt: "2026-10-11T09:00:00.000Z",
              },
            })
          : json(403, { ok: false, error: "forbidden", detail });
      },
    );
    renderPanel();
    const first = await openConfirm("Approve");
    fireEvent.click(
      within(first).getByRole("button", { name: "Approve source" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Approved: Program payment rule",
    );
    const second = await openConfirm("Reject", "Second rule");
    fireEvent.click(
      within(second).getByRole("button", { name: "Reject source" }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(detail);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("treats a success with no source list as unknown, not empty", async () => {
    global.fetch = jest.fn(async () =>
      json(200, { ok: true }),
    ) as unknown as typeof fetch;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toBe(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("says so when nothing is awaiting review, and renders no empty decided groups", async () => {
    mockFetch([]);
    renderPanel();
    expect(
      await screen.findByText(
        "Nothing to review. New research findings appear here.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("public-sources-approved")).toBeNull();
    expect(screen.queryByTestId("public-sources-rejected")).toBeNull();
  });
});

describe("publicSourceCiteNumbers", () => {
  const at = (id: string, reviewedAt: string | null, decision = "approved") =>
    ({ id, reviewedAt, decision }) as Pick<
      PublicSourceReviewItem,
      "id" | "decision" | "reviewedAt"
    >;

  it("numbers approved sources in approval order, ties by id, unstamped last", () => {
    const numbers = publicSourceCiteNumbers([
      at("c", "2026-10-09T00:00:00Z"),
      at("z", null),
      at("b", "2026-10-08T00:00:00Z"),
      at("a", "2026-10-08T00:00:00Z"),
      at("p", "2026-10-01T00:00:00Z", "pending"),
      at("r", "2026-10-01T00:00:00Z", "rejected"),
      at("y", null),
    ]);
    expect([...numbers.entries()]).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
      ["y", 4],
      ["z", 5],
    ]);
  });

  it("gives a source the same number whatever order the list arrives in, and a later approval appends", () => {
    const first = [
      at("a", "2026-10-08T00:00:00Z"),
      at("b", "2026-10-09T00:00:00Z"),
    ];
    const later = [at("c", "2026-10-10T00:00:00Z"), ...first.reverse()];
    const before = publicSourceCiteNumbers(first);
    const after = publicSourceCiteNumbers(later);
    expect(after.get("a")).toBe(before.get("a"));
    expect(after.get("b")).toBe(before.get("b"));
    expect(after.get("c")).toBe(3);
  });
});
