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
  PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
  describePublicSourceReviewRefusal,
  type PublicSourceReviewItem,
} from "@/lib/deliverables/public-research/review-contract";

const MOVE = "11111111-1111-4111-8111-111111111111";
const LIST_URL = `/api/v1/programs/${MOVE}/public-sources?decision=pending`;

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

function mockFetch(
  sources: PublicSourceReviewItem[],
  decide: (call: Call) => unknown = () =>
    json(200, { ok: true, source: { ...sources[0], decision: "approved" } }),
) {
  const calls: Call[] = [];
  global.fetch = jest.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url === LIST_URL) return json(200, { ok: true, sources });
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

  it("lists pending sources as outside sources, not facts about the client", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    const row = await screen.findByTestId("public-source-row");
    const section = screen.getByRole("region", {
      name: "Outside public sources",
    });
    expect(section).toHaveTextContent("Not facts about the client.");
    expect(calls[0]!.url).toBe(LIST_URL);

    const link = within(row).getByRole("link", {
      name: "Program payment rule",
    });
    expect(link).toHaveAttribute("href", "https://example.org/rule");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(row).toHaveTextContent("Example Agency");
    expect(row).toHaveTextContent("Published 2026-01-15");
    expect(row).toHaveTextContent("Retrieved 2026-10-10");
    expect(row).toHaveTextContent("Confidence: medium");
    expect(row).toHaveTextContent(
      "Payments are made within 30 days of an eligible claim.",
    );
    expect(row).toHaveTextContent(
      "Supports: Payment timing for eligible claims.",
    );
  });

  it("says when a publisher or published date is not stated", async () => {
    mockFetch([item({ publisher: null, publishedAt: null, claim: null })]);
    renderPanel();
    const row = await screen.findByTestId("public-source-row");
    expect(row).toHaveTextContent("Publisher not stated");
    expect(row).toHaveTextContent("Published date not stated");
    expect(row).not.toHaveTextContent("Supports:");
  });

  it("renders stored fields as text and links out only to https", async () => {
    mockFetch([
      item({
        id: "a",
        title: "Unsafe link",
        url: "javascript:alert(1)",
        excerpt: '<img src="x" onerror="alert(1)">',
      }),
      item({ id: "b", title: "Plain http", url: "http://example.org/x" }),
    ]);
    const { container } = renderPanel();
    const rows = await screen.findAllByTestId("public-source-row");
    expect(rows).toHaveLength(2);
    expect(screen.queryByRole("link")).toBeNull();
    expect(rows[0]).toHaveTextContent('<img src="x" onerror="alert(1)">');
    expect(container.querySelector("img")).toBeNull();
  });

  it("drops anything the list returns that is not pending", async () => {
    mockFetch([
      item({ id: "p" }),
      item({ id: "a", title: "Already approved", decision: "approved" }),
    ]);
    renderPanel();
    const rows = await screen.findAllByTestId("public-source-row");
    expect(rows).toHaveLength(1);
    expect(screen.queryByText("Already approved")).toBeNull();
  });

  it("approves through the review route and removes the source from the queue", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    await screen.findByTestId("public-source-row");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(
      await screen.findByText("Approved: Program payment rule"),
    ).toBeInTheDocument();
    const post = calls[1]!;
    expect(post.url).toBe(
      `/api/v1/programs/${MOVE}/public-sources/source-1/review`,
    );
    expect(post.init?.method).toBe("POST");
    expect(JSON.parse(String(post.init?.body))).toEqual({
      decision: "approved",
    });
    expect(screen.queryByTestId("public-source-row")).toBeNull();
    expect(
      screen.getByText("No outside sources are awaiting review."),
    ).toBeInTheDocument();
  });

  it("rejects with the reviewer's note", async () => {
    const calls = mockFetch([item()]);
    renderPanel();
    await screen.findByTestId("public-source-row");
    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Note on Program payment rule (optional)",
      }),
      { target: { value: "  Superseded by the 2026 notice. " } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(
      await screen.findByText("Rejected: Program payment rule"),
    ).toBeInTheDocument();
    expect(JSON.parse(String(calls[1]!.init?.body))).toEqual({
      decision: "rejected",
      note: "Superseded by the 2026 notice.",
    });
  });

  it("shows the route's sentence and keeps the source offered when the decision is unconfirmed", async () => {
    const detail = describePublicSourceReviewRefusal(
      "review_decision_unconfirmed",
    );
    mockFetch([item()], () =>
      json(500, { ok: false, error: "review_decision_unconfirmed", detail }),
    );
    renderPanel();
    await screen.findByTestId("public-source-row");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(detail);
    expect(screen.getByTestId("public-source-row")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it.each(["already_decided", "decided_by_another_reviewer"] as const)(
    "shows the sentence and stops offering a source the server reports as %s",
    async (code) => {
      const detail = describePublicSourceReviewRefusal(code, {
        currentDecision: "approved",
      });
      mockFetch([item()], () => json(409, { ok: false, error: code, detail }));
      renderPanel();
      await screen.findByTestId("public-source-row");
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(detail);
      expect(screen.queryByTestId("public-source-row")).toBeNull();
    },
  );

  it("keeps a source the server refused for another reason", async () => {
    const detail = describePublicSourceReviewRefusal("forbidden");
    mockFetch([item()], () =>
      json(403, { ok: false, error: "forbidden", detail }),
    );
    renderPanel();
    await screen.findByTestId("public-source-row");
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(detail);
    expect(screen.getByTestId("public-source-row")).toBeInTheDocument();
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
    await screen.findByTestId("public-source-row");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
    );
  });

  it("claims neither direction when the request itself fails", async () => {
    mockFetch([item()], () => {
      throw new Error("network");
    });
    renderPanel();
    await screen.findByTestId("public-source-row");
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      PUBLIC_SOURCE_REVIEW_UNNAMED_FAILURE,
    );
  });

  it("withholds both decisions on every source while one is in flight", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    mockFetch(
      [item({ id: "a" }), item({ id: "b", title: "Second rule" })],
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    renderPanel();
    await screen.findAllByTestId("public-source-row");
    fireEvent.click(screen.getAllByRole("button", { name: "Approve" })[0]!);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled(),
    );
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    await act(async () => {
      resolve(json(200, { ok: true }));
    });
    expect(screen.getByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("offers no decision to a user without review authority", async () => {
    mockFetch([item()]);
    renderPanel({ canDecide: false });
    const row = await screen.findByTestId("public-source-row");
    expect(row).toHaveTextContent(
      "Awaiting review by an authorized workspace user.",
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("shows the list route's sentence when the list cannot be read, never an empty queue", async () => {
    const detail = describePublicSourceReviewRefusal("sources_unreadable");
    global.fetch = jest.fn(async () =>
      json(503, { ok: false, error: "sources_unreadable", detail }),
    ) as unknown as typeof fetch;
    renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent(detail);
    expect(
      screen.queryByText("No outside sources are awaiting review."),
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
    expect(await screen.findByRole("alert")).toHaveTextContent(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("says the list is unknown when the read fails without a sentence", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("treats a success with no source list as unknown, not empty", async () => {
    global.fetch = jest.fn(async () =>
      json(200, { ok: true }),
    ) as unknown as typeof fetch;
    renderPanel();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      PUBLIC_SOURCE_LIST_UNNAMED_FAILURE,
    );
  });

  it("says so when nothing is awaiting review", async () => {
    mockFetch([]);
    renderPanel();
    expect(
      await screen.findByText("No outside sources are awaiting review."),
    ).toBeInTheDocument();
  });
});
