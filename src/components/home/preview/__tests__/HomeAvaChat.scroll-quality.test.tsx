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

import type { ChatMessage } from "@/components/agent/AgentDock";
import { AGENT_ACTION_APPROVAL_NOTICE_COPY } from "@/components/agent/AgentActionApprovalNotice";
import { AI_RESPONSIBILITY_FOOTER_COPY } from "@/components/abarva/AIResponsibilityFooter";
import type { AvaChatShellProps } from "@/components/ava-chat/AvaChatShell";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";
import { HomeAvaChat } from "../HomeAvaChat";

let mockStreamingThread: ChatMessage[] | null = null;

jest.mock("@/components/ava-chat/AvaChatShell", () => {
  const { AvaChatShell } = jest.requireActual(
    "@/components/ava-chat/AvaChatShell",
  );
  return {
    AvaChatShell: (props: AvaChatShellProps) => (
      <AvaChatShell {...props} thread={mockStreamingThread ?? props.thread} />
    ),
  };
});

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => <div>{text}</div>,
}));

const recordSource: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "test-projection-a",
};
const tenantKey = CANONICAL_TENANT_KEYS[0];
if (!tenantKey) throw new Error("Canonical tenant fixture unavailable.");

const originalFetch = global.fetch;
const originalWidth = window.innerWidth;

beforeEach(() => {
  mockStreamingThread = null;
  global.fetch = jest.fn();
  window.localStorage.clear();
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1440,
  });
});

afterEach(() => {
  mockStreamingThread = null;
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: originalWidth,
  });
  if (originalFetch) global.fetch = originalFetch;
  else Reflect.deleteProperty(global, "fetch");
});

function home(source = recordSource) {
  return (
    <HomeAvaChat tenantKey={tenantKey} recordSource={source}>
      <div>Enterprise workspace</div>
    </HomeAvaChat>
  );
}

async function openChat() {
  fireEvent.click(
    screen.getByRole("button", { name: "aVa: Open the advisor chat" }),
  );
  const transcript = await screen.findByRole("region", {
    name: "aVa conversation",
  });
  await act(async () => {});
  return transcript;
}

function transcriptGeometry(transcript: HTMLElement) {
  let height = 1000;
  let top = 760;
  // jsdom has no layout. Model clamping only on this transcript, not DOM prototypes.
  Object.defineProperties(transcript, {
    scrollHeight: { configurable: true, get: () => height },
    clientHeight: { configurable: true, get: () => 240 },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = Math.max(0, Math.min(height - 240, value));
      },
    },
  });
  fireEvent.scroll(transcript);
  return {
    grow: (value: number) => {
      height = value;
    },
    scroll: (value: number) => {
      transcript.scrollTop = value;
      fireEvent.scroll(transcript);
    },
  };
}

function answerResponse(directAnswer: string, followUpQuestions?: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ answer: { directAnswer }, followUpQuestions }),
  } as Response;
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function ask(question = "What should we verify?") {
  fireEvent.change(screen.getByTestId("agent-dock-input"), {
    target: { value: question },
  });
  fireEvent.submit(screen.getByRole("form", { name: "Ask aVa" }));
}

it("keeps the collapsed canvas inside its allocated height across chat mode changes", async () => {
  const { container } = render(home());
  const root = container.querySelector("[data-home-ava-chat]");
  expect(root).toHaveStyle({
    display: "flex",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
  });
  expect(screen.getByTestId("ava-chat-shell")).toHaveStyle({
    display: "flex",
    height: "100%",
    minHeight: 0,
    overflow: "hidden",
  });
  await openChat();
  fireEvent.click(screen.getByRole("button", { name: "Close chat" }));
  expect(root).toHaveStyle({ height: "100%", overflow: "hidden" });
  expect(screen.getByText("Enterprise workspace")).toBeInTheDocument();
});

it("follows a completed answer when the reader stays at the bottom", async () => {
  const pending = deferredResponse();
  jest.mocked(global.fetch).mockReturnValue(pending.promise);
  render(home());
  const transcript = await openChat();
  const geometry = transcriptGeometry(transcript);

  ask();
  geometry.grow(1480);
  await act(async () =>
    pending.resolve(answerResponse("The latest answer is ready.")),
  );

  expect(transcript.scrollTop).toBe(1240);
  expect(
    screen.queryByRole("button", { name: "Jump to latest" }),
  ).not.toBeInTheDocument();
});

it("preserves an intentional scroll-up during a request and jumps within the conversation", async () => {
  const pending = deferredResponse();
  jest.mocked(global.fetch).mockReturnValue(pending.promise);
  render(home());
  const transcript = await openChat();
  const geometry = transcriptGeometry(transcript);
  const canvas = screen.getByText("Enterprise workspace");
  canvas.scrollTop = 55;

  ask();
  geometry.scroll(120);
  geometry.grow(1800);
  await act(async () =>
    pending.resolve(answerResponse("A completed answer with evidence gaps.")),
  );

  expect(transcript.scrollTop).toBe(120);
  const jump = screen.getByRole("button", { name: "Jump to latest" });
  expect(jump.closest("form")).toBe(
    screen.getByRole("form", { name: "Ask aVa" }),
  );
  await act(async () => fireEvent.click(jump));
  expect(transcript.scrollTop).toBe(1560);
  expect(transcript).toHaveFocus();
  expect(canvas.scrollTop).toBe(55);
  expect(
    screen.queryByRole("button", { name: "Jump to latest" }),
  ).not.toBeInTheDocument();
});

it("follows incremental shared-shell updates, pauses on scroll-up, and resumes after Jump", async () => {
  mockStreamingThread = [
    { id: "question-a", role: "user", body: "Review the evidence." },
    { id: "answer-a", role: "agent", body: "First sentence." },
  ];
  const { rerender } = render(home());
  const transcript = await openChat();
  const geometry = transcriptGeometry(transcript);
  const updateAnswer = (body: string) => {
    mockStreamingThread = [
      mockStreamingThread![0],
      { id: "answer-a", role: "agent", body },
    ];
    rerender(home());
  };

  geometry.grow(1400);
  await act(async () => updateAnswer("First sentence. More evidence."));
  expect(transcript.scrollTop).toBe(1160);

  await act(async () => geometry.scroll(160));
  geometry.grow(1800);
  await act(async () =>
    updateAnswer("First sentence. More evidence. Another finding."),
  );
  expect(transcript.scrollTop).toBe(160);
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" })),
  );
  expect(transcript.scrollTop).toBe(1560);

  geometry.grow(2100);
  await act(async () =>
    updateAnswer("First sentence. More evidence. Another finding. Completed."),
  );
  expect(transcript.scrollTop).toBe(1860);
});

it("resumes following when the reader scrolls back near the bottom", async () => {
  mockStreamingThread = [
    { id: "answer-a", role: "agent", body: "First sentence." },
  ];
  const { rerender } = render(home());
  const transcript = await openChat();
  const geometry = transcriptGeometry(transcript);
  await act(async () => geometry.scroll(100));
  expect(
    screen.getByRole("button", { name: "Jump to latest" }),
  ).toBeInTheDocument();
  await act(async () => geometry.scroll(720));
  geometry.grow(1400);
  mockStreamingThread = [
    { id: "answer-a", role: "agent", body: "First sentence. More evidence." },
  ];
  await act(async () => rerender(home()));
  expect(transcript.scrollTop).toBe(1160);
  expect(
    screen.queryByRole("button", { name: "Jump to latest" }),
  ).not.toBeInTheDocument();
});

it("reattaches Jump to latest after the dock remounts in expanded mode", async () => {
  render(home());
  const originalTranscript = await openChat();
  await act(async () => transcriptGeometry(originalTranscript).scroll(100));
  expect(
    screen.getByRole("button", { name: "Jump to latest" }),
  ).toBeInTheDocument();

  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Expand chat" })),
  );
  const expandedTranscript = screen.getByRole("region", {
    name: "aVa conversation",
  });
  expect(expandedTranscript).not.toBe(originalTranscript);
  await act(async () => transcriptGeometry(expandedTranscript).scroll(100));
  await act(async () =>
    fireEvent.click(screen.getByRole("button", { name: "Jump to latest" })),
  );
  expect(expandedTranscript.scrollTop).toBe(760);
  expect(originalTranscript.scrollTop).toBe(100);
});

it("shows trimmed, unique follow-ups only for the latest completed packet", async () => {
  const pending = deferredResponse();
  const fetchMock = jest
    .mocked(global.fetch)
    .mockResolvedValueOnce(answerResponse("First answer.", ["Old question?"]))
    .mockReturnValueOnce(pending.promise);
  render(home());
  await openChat();
  ask();
  await screen.findByRole("button", { name: "Old question?" });
  fireEvent.click(screen.getByRole("button", { name: "Old question?" }));
  expect(
    screen.queryByRole("button", { name: "Old question?" }),
  ).not.toBeInTheDocument();

  await act(async () =>
    pending.resolve(
      answerResponse("Fresh answer.", [
        "  Which records need review?  ",
        "Which records need review?",
        "",
        null,
        "What remains unknown?",
        "Who should approve?",
        "Extra question?",
      ]),
    ),
  );
  const suggestions = screen.getByRole("region", { name: "Suggested actions" });
  expect(
    within(suggestions)
      .getAllByRole("button")
      .map((button) => button.textContent),
  ).toEqual([
    "Which records need review?",
    "What remains unknown?",
    "Who should approve?",
  ]);
  expect(
    screen.queryByRole("button", { name: "Old question?" }),
  ).not.toBeInTheDocument();
  fetchMock.mockResolvedValueOnce(answerResponse("Next answer."));
  fireEvent.click(
    screen.getByRole("button", { name: "What remains unknown?" }),
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body)).question).toBe(
    "What remains unknown?",
  );
  await screen.findByText("Next answer.");
  expect(
    screen.queryByRole("region", { name: "Suggested actions" }),
  ).not.toBeInTheDocument();
});

it("does not revive old suggestions after a failed or context-changed answer", async () => {
  jest
    .mocked(global.fetch)
    .mockResolvedValueOnce(answerResponse("First answer.", ["Old question?"]))
    .mockResolvedValueOnce({ ok: false, status: 409 } as Response)
    .mockRejectedValueOnce(new Error("Unavailable"));
  render(home());
  await openChat();
  ask();
  await screen.findByRole("button", { name: "Old question?" });
  fireEvent.click(screen.getByRole("button", { name: "Old question?" }));
  await screen.findByText(/Home's record changed/);
  expect(
    screen.queryByRole("region", { name: "Suggested actions" }),
  ).not.toBeInTheDocument();
  ask("Another question.");
  await screen.findByText(/couldn't reach the advisor engine/);
  expect(
    screen.queryByRole("region", { name: "Suggested actions" }),
  ).not.toBeInTheDocument();
});

it("discards an aborted record's late answer and suggestions", async () => {
  const pending = deferredResponse();
  const fetchMock = jest.mocked(global.fetch).mockReturnValue(pending.promise);
  const { rerender } = render(home());
  await openChat();
  ask();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const signal = fetchMock.mock.calls[0][1]?.signal;
  rerender(
    home({ ...recordSource, canonicalSnapshotHash: "test-projection-b" }),
  );
  expect(signal?.aborted).toBe(true);
  await act(async () =>
    pending.resolve(answerResponse("Stale answer.", ["Stale question?"])),
  );
  expect(screen.queryByText("Stale answer.")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Stale question?" }),
  ).not.toBeInTheDocument();
});

it("keeps the approval guard and brand marks in the narrow-screen chat", async () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 390,
  });
  render(home());
  const transcript = await openChat();
  expect(
    screen.getByRole("dialog", { name: "aVa expanded chat" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("note", {
      name: "Human approval required for agent actions",
    }),
  ).toHaveTextContent(AGENT_ACTION_APPROVAL_NOTICE_COPY);
  expect(screen.getByTestId("ai-responsibility-footer")).toHaveTextContent(
    AI_RESPONSIBILITY_FOOTER_COPY,
  );
  expect(
    screen
      .getAllByTestId("ava-ask-wordmark")
      .every(
        (mark) =>
          mark.getAttribute("src") === "/brand/ava/ava-wordmark-2tone-dark.svg",
      ),
  ).toBe(true);
  const geometry = transcriptGeometry(transcript);
  await act(async () => geometry.scroll(100));
  expect(
    screen.getByRole("button", { name: "Jump to latest" }),
  ).toBeInTheDocument();
});
