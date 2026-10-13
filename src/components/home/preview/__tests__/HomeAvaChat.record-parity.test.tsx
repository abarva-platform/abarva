/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { ChatMessage } from "@/components/agent/AgentDock";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";
import { HomeAvaChat } from "../HomeAvaChat";

jest.mock("@/components/ava-chat/AvaChatShell", () => ({
  AvaChatShell: ({
    thread,
    onMessage,
    suggestedActions = [],
    keepSuggestedActionsVisible,
    transcriptScroll,
  }: {
    thread: ChatMessage[];
    onMessage: (text: string) => Promise<void>;
    suggestedActions?: Array<{ label: string; body: string }>;
    keepSuggestedActionsVisible?: boolean;
    transcriptScroll?: string;
  }) => (
    <div>
      <button onClick={() => void onMessage("What is on screen?")}>Ask</button>
      <button onClick={() => void onMessage("What should the CFO prioritize?")}>
        Ask follow-up
      </button>
      <span data-testid="home-scroll-policy">
        {transcriptScroll} | {String(keepSuggestedActionsVisible)}
      </span>
      {suggestedActions.map((action) => (
        <button key={action.label} onClick={() => void onMessage(action.body)}>
          {action.label}
        </button>
      ))}
      {thread.map((message) => (
        <p key={message.id}>
          {message.body}
          {message.role === "agent" ? (
            <span data-testid="home-answer-metadata">
              {message.agentAnswer?.directAnswer ?? ""} |{" "}
              {message.citations?.[0]?.name ?? ""} |{" "}
              {message.citations?.[0]?.detail ?? ""}
            </span>
          ) : null}
        </p>
      ))}
    </div>
  ),
}));

const recordSource: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "ecl:assessment:serving.home_*:3",
  contextVersion: {
    assessmentId: "assessment",
    projectionContentHash: "projection-a",
    sourceSetHash: null,
    sourceLineageHash: "lineage-a",
    sourceCoverage: { totalRecordRows: 2, linkedRecordRows: 1, families: [] },
    sourceDateCoverage: {
      earliest: "2026-09-30",
      latest: "2026-09-30",
      datedFiles: 2,
      totalFiles: 2,
    },
    deterministicPacketHash: "packet-a",
    narrativePacketHash: "narrative-old",
    narrativeGeneratedAt: "2026-08-21T00:00:00.000Z",
    dataAsOf: null,
    coherence: "stored_narrative",
  },
};

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

it("keeps three clickable follow-ups and sends only prior question intent and citation refs", async () => {
  const fetchMock = jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      answer: {
        directAnswer: "Recorded analytics maturity is below target.",
        citations: [{ id: "TD-K1", label: "Maturity evidence" }],
      },
      followUpQuestions: [
        "What matters first?",
        "What should we verify?",
        "How does this affect value?",
      ],
    }),
  } as Response);
  render(
    <HomeAvaChat tenantKey="meridian-health" recordSource={recordSource}>
      <div>Home</div>
    </HomeAvaChat>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(
    await screen.findByRole("button", { name: "What matters first?" }),
  ).toBeInTheDocument();
  expect(screen.getByTestId("home-scroll-policy")).toHaveTextContent(
    "answer-start | true",
  );
  fireEvent.click(screen.getByRole("button", { name: "What matters first?" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  const body = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
  expect(body.conversation).toEqual([
    { question: "What is on screen?", citedClaimTags: ["TD-K1"] },
  ]);
  expect(body).not.toHaveProperty("history");
  expect(JSON.stringify(body.conversation)).not.toContain(
    "Recorded analytics maturity",
  );
});

it("clears conversation and suggestions when the selected record changes", async () => {
  const fetchMock = jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      answer: { directAnswer: "Old record answer." },
      followUpQuestions: ["Old follow-up?"],
    }),
  } as Response);
  const { rerender } = render(
    <HomeAvaChat tenantKey="meridian-health" recordSource={recordSource}>
      <div>Home</div>
    </HomeAvaChat>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await screen.findByRole("button", { name: "Old follow-up?" });
  rerender(
    <HomeAvaChat
      tenantKey="meridian-health"
      recordSource={{ ...recordSource, canonicalSnapshotHash: "new-record" }}
    >
      <div>Home</div>
    </HomeAvaChat>,
  );
  expect(
    screen.queryByRole("button", { name: "Old follow-up?" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Old record answer.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(
    JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).conversation,
  ).toEqual([]);
});

afterEach(() => {
  if (originalFetch) global.fetch = originalFetch;
  else Reflect.deleteProperty(global, "fetch");
});

it("sends the page's provider and complete record marker with the question", async () => {
  const fetchMock = jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      answer: { directAnswer: "The reviewed record is on screen." },
    }),
  } as Response);

  render(
    <HomeAvaChat
      tenantKey="meridian-health"
      requestedProvider="legacy"
      recordSource={recordSource}
    >
      <div>Home</div>
    </HomeAvaChat>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const request = fetchMock.mock.calls[0][1];
  expect(JSON.parse(String(request?.body))).toEqual(
    expect.objectContaining({
      tenantKey: "meridian-health",
      requestedProvider: "legacy",
      expectedRecordSource: recordSource,
    }),
  );
});

it("tells the reader to refresh when Home's context changed", async () => {
  jest.mocked(global.fetch).mockResolvedValue({
    ok: false,
    status: 409,
  } as Response);

  render(
    <HomeAvaChat tenantKey="meridian-health" recordSource={recordSource}>
      <div>Home</div>
    </HomeAvaChat>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  expect(
    await screen.findByText(
      "Home's record changed since this page opened. Refresh Home before asking aVa again.",
    ),
  ).toBeInTheDocument();
});

it("keeps the direct answer and source citations on the Home chat turn", async () => {
  jest.mocked(global.fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      answer: {
        directAnswer: "The budget forecast exceeds the approved plan.",
        prose: "Two priorities account for most of the difference.",
        citations: [
          {
            id: "home-current-record",
            label: "Current Home record",
            recordId: "current-projection",
          },
          {
            id: "citation-1",
            label: "Approved program budget row",
            recordId: "internal-row-1",
            excerpt: "Forecast and budget from the same program record.",
          },
        ],
      },
    }),
  } as Response);

  render(
    <HomeAvaChat tenantKey="meridian-health" recordSource={recordSource}>
      <div>Home</div>
    </HomeAvaChat>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  expect(await screen.findByTestId("home-answer-metadata")).toHaveTextContent(
    "The budget forecast exceeds the approved plan. | Current Home record | Current Home record; registered source files dated through 2026-09-30. Data currency is not attested.",
  );
});
