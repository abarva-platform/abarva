/**
 * @jest-environment jsdom
 */

// AgentDock · component tests for the foundation behavior.
//
// Coverage:
//   - Renders in side-rail mode by default
//   - Mode picker switches modes and persists in localStorage
//   - Composer auto-grows on input
//   - Enter submits, Shift+Enter inserts newline
//   - Send button disabled while upload pending
//   - Drag-drop highlights panel
//   - Removing a chip removes the attachment from the next submit
//
// We mock global.fetch for the upload POST so the test environment
// doesn't try to actually hit the route handler.

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

import { AI_RESPONSIBILITY_FOOTER_COPY } from "@/components/abarva/AIResponsibilityFooter";
import { AGENT_ACTION_APPROVAL_NOTICE_COPY } from "../AgentActionApprovalNotice";
import {
  AgentDock,
  AGENT_DOCK_MIME_ALLOWLIST,
  buildUploadParsedPreview,
  buildUploadParsingProgress,
  estimateUploadParsePages,
  modeStorageKey,
  splitStorageKey,
  type AttachmentRef,
  type ChatMessage,
} from "../AgentDock";

const SURFACE = "test/agent-dock";

const AGENT = {
  initials: "S",
  name: "Sentinel",
  role: "Drafts artifacts, surfaces evidence, flags gaps before they cost you.",
};

function makeFile(name: string, mime: string, body = "hello"): File {
  return new File([body], name, { type: mime });
}

function setupFetchMock(
  result: AttachmentRef | { error: string },
  status = 200,
): jest.Mock {
  const mock = jest.fn().mockImplementation(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => result,
  }));
  (global as { fetch: unknown }).fetch = mock;
  return mock;
}

beforeEach(() => {
  window.localStorage.clear();
  (global as { fetch: unknown }).fetch = undefined;
});

describe("AgentDock · default mode", () => {
  it("renders in side-rail mode when no preference is stored", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId("agent-dock-panel")).toHaveAttribute(
      "data-mode",
      "side-rail",
    );
    expect(screen.getByTestId("agent-dock-side-rail-shell")).toHaveAttribute(
      "data-side",
      "left",
    );
    expect(screen.getByTestId("workspace")).toBeInTheDocument();
  });

  it("honours an explicit defaultMode when no stored preference", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        defaultMode="pin-bottom"
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId("agent-dock-panel")).toHaveAttribute(
      "data-mode",
      "pin-bottom",
    );
    expect(screen.getByTestId("agent-dock-pin-bottom")).toBeInTheDocument();
  });

  it("reads a stored mode preference", () => {
    window.localStorage.setItem(modeStorageKey(SURFACE), "expand");
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    expect(screen.getByTestId("agent-dock-expand-overlay")).toBeInTheDocument();
  });

  it("marks agent turns as AI drafts while leaving user turns unmarked", () => {
    const thread: ChatMessage[] = [
      { id: "u1", role: "user", body: "What should we do next?" },
      {
        id: "a1",
        role: "agent",
        body: "Review the evidence packet before approving.",
      },
    ];

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={thread}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const agentTurn = screen.getByTestId("agent-dock-turn-agent");
    const userTurn = screen.getByTestId("agent-dock-turn-user");

    expect(within(agentTurn).getByText("AI Draft")).toBeInTheDocument();
    expect(
      within(agentTurn).getByText("Review before acting"),
    ).toBeInTheDocument();
    expect(
      within(agentTurn).getByRole("status", {
        name: "AI Draft: Review before acting",
      }),
    ).toHaveAttribute("data-ai-label-status", "draft");
    expect(within(userTurn).queryByText("AI Draft")).not.toBeInTheDocument();
  });

  it("shows a citation gap for substantive uncited agent text without evidence context", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[
          {
            id: "a1",
            role: "agent",
            body: "The tenant is ready for a board-grade decision. The accountable owner should review the program evidence before committing the next phase.",
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(screen.getByLabelText("Citation gap")).toHaveTextContent(
      "no source citations attached",
    );
    expect(
      screen
        .getByText(/The tenant is ready for a board-grade decision/i)
        .compareDocumentPosition(screen.getByLabelText("Citation gap")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not show a citation gap when the surface carries usable evidence context", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        surfaceContext={{
          evidenceContext: {
            kind: "enterprise_context",
            tenantKey: "meridian-health",
            recordCount: 3503,
            factCount: 38640,
            evidenceCount: 3503,
            usableEvidenceCount: 3503,
          },
        }}
        thread={[
          {
            id: "a1",
            role: "agent",
            body: "Meridian Health System has a loaded Enterprise Context layer. Sentinel should answer current-state questions from that internal context before generic healthcare patterns.",
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(screen.queryByLabelText("Citation gap")).not.toBeInTheDocument();
  });

  it("renders the persistent AI responsibility footer", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(screen.getByText(AI_RESPONSIBILITY_FOOTER_COPY)).toBeInTheDocument();
  });

  it("renders the in-chat human approval boundary for agent actions", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(
      screen.getByLabelText("Human approval required for agent actions"),
    ).toHaveTextContent(AGENT_ACTION_APPROVAL_NOTICE_COPY);
  });
});

describe("AgentDock · mode picker", () => {
  it("switches modes and persists each choice", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    fireEvent.click(screen.getByTestId("agent-dock-mode-side-rail-right"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe(
      "side-rail-right",
    );
    expect(screen.getByTestId("agent-dock-side-rail-shell")).toHaveAttribute(
      "data-side",
      "right",
    );

    fireEvent.click(screen.getByTestId("agent-dock-mode-pin-bottom"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe(
      "pin-bottom",
    );
    expect(screen.getByTestId("agent-dock-panel")).toHaveAttribute(
      "data-mode",
      "pin-bottom",
    );

    fireEvent.click(screen.getByTestId("agent-dock-mode-pin-top"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe(
      "pin-top",
    );

    fireEvent.click(screen.getByTestId("agent-dock-mode-expand"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe("expand");
    expect(screen.getByTestId("agent-dock-expand-overlay")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("agent-dock-mode-collapsed"));
    expect(window.localStorage.getItem(modeStorageKey(SURFACE))).toBe(
      "collapsed",
    );
    expect(screen.getByTestId("agent-dock-collapsed-chip")).toBeInTheDocument();
  });

  it("uses a per-surface localStorage key", () => {
    expect(modeStorageKey("source/new")).toBe(
      "abarva.agent-dock.source/new.mode",
    );
    expect(splitStorageKey("source/new")).toBe(
      "abarva.agent-dock.source/new.split",
    );
  });
});

describe("AgentDock · composer", () => {
  it("auto-grows the textarea on input", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const ta = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    // Stub scrollHeight so the auto-grow path can pick a non-trivial size.
    Object.defineProperty(ta, "scrollHeight", {
      value: 80,
      configurable: true,
    });
    fireEvent.change(ta, { target: { value: "one\ntwo\nthree" } });
    expect(ta.style.height).toBe("80px");
  });

  it("submits on Enter and inserts newline on Shift+Enter", async () => {
    const onMessage = jest.fn().mockResolvedValue(undefined);
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={onMessage}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const ta = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "hello" } });

    // Shift+Enter — onMessage should NOT fire
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(onMessage).not.toHaveBeenCalled();

    // Enter — submits
    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    });
    expect(onMessage).toHaveBeenCalledWith("hello", []);
  });

  it("disables Send when there is no draft and no attachment", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const send = screen.getByTestId("agent-dock-send") as HTMLButtonElement;
    expect(send).toBeDisabled();
    const ta = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "hi" } });
    expect(send).not.toBeDisabled();
  });
});

describe("AgentDock · attachments", () => {
  it("builds a bounded parsed preview from completed upload metadata", () => {
    const preview = buildUploadParsedPreview({
      status: "done",
      estimatedPages: 3,
      ref: {
        id: "att-preview",
        file_name: "board-pack.pdf",
        mime: "application/pdf",
        bytes: 196_000,
        storage_path: "tenant/user/att-preview-board-pack.pdf",
        extracted_text_preview: `${"Revenue growth ".repeat(20)}tail`,
        parse_metadata: {
          page_count: 4,
          table_count: 2,
          parser_id: "azure-document-intelligence-layout",
        },
      },
    });

    expect(preview).toEqual({
      snippet: `${"Revenue growth ".repeat(13)}Reven...`,
      pageSignal: "Pages: 4",
      tableSignal: "Tables: 2",
      hasExtractedText: true,
      rawModeEscape: null,
      rawModeRequested: false,
    });
    expect(preview!.snippet.length).toBeLessThanOrEqual(203);
  });

  it("builds an honest empty parsed preview when extraction returns no text", () => {
    const preview = buildUploadParsedPreview({
      status: "done",
      estimatedPages: null,
      ref: {
        id: "att-empty",
        file_name: "image.png",
        mime: "image/png",
        bytes: 1024,
        storage_path: "tenant/user/att-empty-image.png",
        extracted_text_preview: "",
      },
    });

    expect(preview).toEqual({
      snippet: "No readable text extracted.",
      pageSignal: "Pages: not reported",
      tableSignal: "Tables: not reported",
      hasExtractedText: false,
      rawModeEscape: null,
      rawModeRequested: false,
    });
  });

  it("builds honest PDF parsing progress from elapsed time and estimated pages", () => {
    const file = makeFile(
      "board-pack.pdf",
      "application/pdf",
      "x".repeat(130_000),
    );
    const progress = buildUploadParsingProgress(
      {
        file,
        status: "uploading",
        startedAtMs: 1_000,
        estimatedPages: estimateUploadParsePages(file),
      },
      6_200,
    );

    expect(progress).toEqual({
      label: "Parsing PDF · page 2 of ~2 · 5s elapsed",
      elapsedSeconds: 5,
      currentPage: 2,
      estimatedPages: 2,
    });
  });

  it("shows workbook progress without claiming a page count", () => {
    const file = makeFile(
      "template.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const progress = buildUploadParsingProgress(
      {
        file,
        status: "uploading",
        startedAtMs: 2_000,
        estimatedPages: estimateUploadParsePages(file),
      },
      5_000,
    );

    expect(progress).toEqual({
      label: "Parsing workbook · 3s elapsed",
      elapsedSeconds: 3,
      currentPage: null,
      estimatedPages: null,
    });
  });

  it("disables Send while an upload is pending and re-enables on success", async () => {
    let resolveFetch: (value: {
      ok: boolean;
      status: number;
      json: () => Promise<AttachmentRef>;
    }) => void = () => {};
    const fetchMock = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;
    const file = makeFile("a.txt", "text/plain");

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Send should be disabled while uploading.
    const send = screen.getByTestId("agent-dock-send") as HTMLButtonElement;
    expect(send).toBeDisabled();
    expect(screen.getByTestId("agent-dock-chips")).toBeInTheDocument();

    // Resolve the upload — chip flips to done, Send re-enables.
    await act(async () => {
      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({
          id: "att-1",
          file_name: "a.txt",
          mime: "text/plain",
          bytes: 5,
          storage_path: "tenant/u/att-1-a.txt",
          extracted_text_preview: "hello",
        }),
      });
    });

    expect(send).not.toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders a parsed preview after upload succeeds", async () => {
    setupFetchMock({
      id: "att-preview",
      file_name: "board-pack.pdf",
      mime: "application/pdf",
      bytes: 130_000,
      storage_path: "tenant/u/att-preview-board-pack.pdf",
      extracted_text_preview:
        "Revenue growth accelerated in Q4. Margin pressure remains visible in logistics.",
      parse_metadata: {
        page_count: 4,
        table_count: 2,
        parser_id: "azure-document-intelligence-layout",
        raw_mode_escape: {
          eligible: true,
          requires_user_approval: true,
          route: "claude-native-pdf",
          reason: "pdf_native_last_resort",
          estimated_tokens_per_turn: 43_334,
          parser_bug_ticket_id: "parser-bug-ui",
          cost_warning:
            "Raw mode will send the original PDF to the model and may use about 44k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
        },
      },
    });

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, {
        target: {
          files: [
            makeFile("board-pack.pdf", "application/pdf", "x".repeat(130_000)),
          ],
        },
      });
    });

    expect(screen.getByText("Parsed preview")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Revenue growth accelerated in Q4. Margin pressure remains visible in logistics.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Pages: 4 · Tables: 2")).toBeInTheDocument();
    expect(screen.getByText(/Raw mode will send/)).toBeInTheDocument();
    expect(screen.getByText("Use raw mode")).toBeInTheDocument();
  });

  it("requires an explicit raw-mode click and forwards the acknowledgement", async () => {
    setupFetchMock({
      id: "att-raw",
      file_name: "garbled.pdf",
      mime: "application/pdf",
      bytes: 130_000,
      storage_path: "tenant/u/att-raw-garbled.pdf",
      extracted_text_preview: "P8 C0lumn || unreadable table",
      parse_metadata: {
        page_count: 2,
        table_count: 1,
        parser_id: "pdf-parse",
        raw_mode_escape: {
          eligible: true,
          requires_user_approval: true,
          route: "claude-native-pdf",
          reason: "pdf_native_last_resort",
          estimated_tokens_per_turn: 43_334,
          parser_bug_ticket_id: "parser-bug-ui",
          cost_warning:
            "Raw mode will send the original PDF to the model and may use about 44k tokens per chat turn. Use only if the parsed preview looks garbled or incomplete.",
        },
      },
    });
    const onMessage = jest.fn().mockResolvedValue(undefined);

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={onMessage}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, {
        target: {
          files: [
            makeFile("garbled.pdf", "application/pdf", "x".repeat(130_000)),
          ],
        },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Use raw mode"));
    });

    expect(screen.getByText(/Raw mode requested/)).toHaveTextContent(
      "parser-bug-ui",
    );

    const ta = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "Use the original PDF." } });

    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    });

    expect(onMessage).toHaveBeenCalledTimes(1);
    const attachments = onMessage.mock.calls[0][1] as AttachmentRef[];
    expect(attachments[0]).toMatchObject({
      id: "att-raw",
      raw_mode_requested: {
        parser_bug_ticket_id: "parser-bug-ui",
        estimated_tokens_per_turn: 43_334,
      },
    });
    expect(attachments[0].raw_mode_requested?.acknowledged_at).toEqual(
      expect.any(String),
    );
  });

  it("renders a live parsing progress line while upload is pending", async () => {
    const fetchMock = jest.fn().mockImplementation(
      () =>
        new Promise(() => {
          /* intentionally pending */
        }),
    );
    (global as { fetch: unknown }).fetch = fetchMock;

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, {
        target: {
          files: [
            makeFile("board-pack.pdf", "application/pdf", "x".repeat(70_000)),
          ],
        },
      });
    });

    expect(
      screen.getByText(/Parsing PDF · page 1 of ~2 · \d+s elapsed/),
    ).toBeInTheDocument();
  });

  it("removing a chip drops the ref from the next submit", async () => {
    setupFetchMock({
      id: "att-2",
      file_name: "b.txt",
      mime: "text/plain",
      bytes: 5,
      storage_path: "tenant/u/att-2-b.txt",
      extracted_text_preview: "hello",
    });

    const onMessage = jest.fn().mockResolvedValue(undefined);
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={onMessage}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile("b.txt", "text/plain")] },
      });
    });

    // Now the chip is done — find the remove button via testid prefix.
    const chips = screen.getByTestId("agent-dock-chips");
    const removeBtn = within(chips).getAllByRole("button")[0];
    fireEvent.click(removeBtn);
    expect(screen.queryByTestId("agent-dock-chips")).not.toBeInTheDocument();

    // Type something and submit — the attachment list passed to onMessage is empty.
    const ta = screen.getByTestId("agent-dock-input") as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "go" } });
    await act(async () => {
      fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    });
    expect(onMessage).toHaveBeenCalledWith("go", []);
  });

  it("exposes the same MIME allowlist as the API contract", () => {
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain("application/pdf");
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain("image/png");
    expect(AGENT_DOCK_MIME_ALLOWLIST).toContain("image/jpeg");
    expect(AGENT_DOCK_MIME_ALLOWLIST).not.toContain("application/x-msdownload");
  });

  it("skips files with an unsupported mime type", async () => {
    const fetchMock = jest.fn();
    (global as { fetch: unknown }).fetch = fetchMock;
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const fileInput = screen.getByTestId(
      "agent-dock-file-input",
    ) as HTMLInputElement;
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile("x.exe", "application/x-msdownload")] },
      });
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("agent-dock-chips")).not.toBeInTheDocument();
  });
});

describe("AgentDock · drag-drop", () => {
  it("highlights the panel on dragover", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const panel = screen.getByTestId("agent-dock-panel");
    expect(panel).toHaveAttribute("data-dragging", "false");
    fireEvent.dragOver(panel);
    expect(panel).toHaveAttribute("data-dragging", "true");
    fireEvent.dragLeave(panel);
    expect(panel).toHaveAttribute("data-dragging", "false");
  });
});

describe("AgentDock · thread render", () => {
  it("renders thread turns in order with role data attribute", () => {
    const thread: ChatMessage[] = [
      { id: "a", role: "agent", body: "Hello." },
      { id: "b", role: "user", body: "Hi." },
    ];
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={thread}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
    const turns = screen.getAllByTestId(/agent-dock-turn-/);
    expect(turns).toHaveLength(2);
    expect(turns[0]).toHaveAttribute("data-testid", "agent-dock-turn-agent");
    expect(turns[1]).toHaveAttribute("data-testid", "agent-dock-turn-user");
  });

  it("preserves compact agent response text without renderer rewriting", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface="tower"
        thread={[
          {
            id: "a",
            role: "agent",
            body: "**APX-04 is the highest value-risk item this quarter.** Portfolio KPI evidence shows sponsor ambiguity and value-baseline gaps. I recommend a gate review today.",
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(screen.getByTestId("agent-dock-turn-agent")).toHaveTextContent(
      "**APX-04 is the highest value-risk item this quarter.**",
    );
    expect(screen.getByTestId("agent-dock-turn-agent")).toHaveTextContent(
      "AI Draft",
    );
  });

  it("renders evidence-only Ava packets as concise prose", () => {
    render(
      <AgentDock
        agent={{ ...AGENT, name: "aVa" }}
        surface="intelligence"
        thread={[
          {
            id: "a",
            role: "agent",
            body: "Scale nothing freely yet. Kyriba is closest, but control gates need to close first. Want the deeper path: evidence, risks, or next actions?",
            agentAnswer: {
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey: "lakeshore",
              question: "Which initiatives are proven enough to scale?",
              intent: "table",
              status: "answered",
              directAnswer:
                "Scale nothing freely yet. Kyriba is closest, but control gates need to close first.",
              artifacts: [],
              citations: [
                {
                  id: "c1",
                  label: "Lakeshore finance AI evidence register",
                  sourceClass: "tenant-fact",
                  confidence: "high",
                },
              ],
              factsUsed: [],
              metricsUsed: [],
              relationshipsUsed: [],
              quality: {
                confidence: "high",
                evidenceStrength: "partial",
                tenantGrounding: "partial",
                answerCompleteness: "complete",
              },
              safety: {
                tenantFencePassed: true,
                rawIdsSuppressed: true,
                forbiddenLanguagePassed: true,
                unsupportedClaimsBlocked: true,
              },
              nextSteps: [],
              gaps: [],
              caveats: [],
            } as never,
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const turn = screen.getByTestId("agent-dock-turn-agent");
    expect(turn).toHaveTextContent("Scale nothing freely yet.");
    expect(turn).not.toHaveTextContent(
      "Want the deeper path: evidence, risks, or next actions?",
    );
    expect(turn).not.toHaveTextContent("Sources");
    expect(turn).not.toHaveTextContent("high confidence");
    expect(screen.queryByTestId("evidence-basis")).not.toBeInTheDocument();
  });

  it("keeps Intelligence structured artifacts out of the left dock even when expanded", () => {
    render(
      <AgentDock
        agent={{ ...AGENT, name: "aVa" }}
        surface="intelligence"
        defaultMode="expand"
        thread={[
          {
            id: "a",
            role: "agent",
            body: "Fund IROPS recovery automation next, but only behind the readiness gate.",
            agentAnswer: {
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey: "skyharbor",
              question: "Which AI investments should SkyHarbor scale?",
              intent: "table",
              status: "answered",
              directAnswer:
                "Fund IROPS recovery automation next, but only behind the readiness gate.",
              artifacts: [
                {
                  artifact: "table",
                  id: "skyharbor-investment-table",
                  title: "SkyHarbor AI investment posture",
                  columns: [
                    { key: "initiative", label: "Initiative" },
                    { key: "posture", label: "Posture" },
                  ],
                  rows: [
                    {
                      initiative: "IROPS agentic recovery",
                      posture: "Gate scale on operational data readiness",
                    },
                  ],
                },
              ],
              citations: [],
              factsUsed: [],
              metricsUsed: [],
              relationshipsUsed: [],
              quality: {
                confidence: "high",
                evidenceStrength: "partial",
                tenantGrounding: "partial",
                answerCompleteness: "complete",
              },
              safety: {
                tenantFencePassed: true,
                rawIdsSuppressed: true,
                forbiddenLanguagePassed: true,
                unsupportedClaimsBlocked: true,
              },
              nextSteps: [],
              gaps: [],
              caveats: [],
            } as never,
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    const turn = screen.getByTestId("agent-dock-turn-agent");
    expect(turn).toHaveTextContent("Fund IROPS recovery automation");
    expect(turn).not.toHaveTextContent("Tables");
    expect(turn).not.toHaveTextContent("SkyHarbor AI investment posture");
    expect(turn).not.toHaveTextContent("IROPS agentic recovery");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps auto-scroll inside the thread pane when new turns arrive", async () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = jest.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    const renderDock = (thread: ChatMessage[]) => (
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={thread}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />
    );

    try {
      const { rerender } = render(renderDock([]));
      const threadPane = screen.getByTestId("agent-dock-thread");
      Object.defineProperty(threadPane, "scrollHeight", {
        value: 720,
        configurable: true,
      });

      await act(async () => {
        rerender(
          renderDock([{ id: "u1", role: "user", body: "Check admin." }]),
        );
      });

      expect(threadPane.scrollTop).toBe(720);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      if (originalScrollIntoView) {
        HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
      }
    }
  });

  it("renders structured response parts with tables and charts", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface="source/events/canvas"
        thread={[
          {
            id: "a",
            role: "agent",
            body: "fallback prose",
            parts: [
              {
                type: "table",
                title: "Current state to sourcing implication",
                columns: ["Fact", "Implication"],
                rows: [
                  [
                    "Identity match rate is 71%",
                    "Gate CDP shortlist on data quality lift.",
                  ],
                ],
              },
              {
                type: "barChart",
                title: "TCO iceberg",
                unit: "USD",
                bars: [
                  { label: "Quoted", value: 2_400_000 },
                  { label: "Run support", value: 840_000 },
                ],
              },
            ],
          },
        ]}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );

    expect(screen.getByTestId("agent-response-table")).toHaveTextContent(
      "Current state",
    );
    expect(screen.getByTestId("agent-response-bar-chart")).toHaveTextContent(
      "TCO iceberg",
    );
    expect(screen.queryByText("fallback prose")).not.toBeInTheDocument();
  });
});

describe("AgentDock · viewport-bound side-rail", () => {
  // Regression: prior to this fix, side-rail dock height was inherited from
  // its parent flex pane. On surfaces whose document scrolled (e.g.
  // /source/new with 1587px doc height vs 827px viewport), the composer
  // ended up below the fold. The shell now self-imposes
  //   height: calc(100vh - var(--agent-dock-self-top, ...))
  // so the dock stays viewport-bounded irrespective of workspace height.

  it("renders the dock inside a viewport-bound shell with explicit height", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={
          <div data-testid="tall-workspace" style={{ height: 3000 }}>
            tall content
          </div>
        }
      />,
    );

    const shell = screen.getByTestId("agent-dock-side-rail-shell");
    expect(shell).toBeInTheDocument();

    // jsdom doesn't compute layout, so we assert on the inline style
    // contract. The shell MUST set an explicit, viewport-relative height
    // via calc() — never `100%`. That is the load-bearing invariant; if
    // someone removes it, the bug returns.
    const height = shell.style.height;
    const maxHeight = shell.style.maxHeight;
    expect(height).toMatch(/calc\(100vh/);
    // self-top is the primary source; legacy top-offset is the fallback.
    expect(height).toContain("var(--agent-dock-self-top");
    expect(height).toContain("var(--agent-dock-top-offset");
    // dvh fallback for mobile address-bar collapse.
    expect(maxHeight).toMatch(/calc\(100dvh/);
  });

  it("does not depend on parent flex height — dock height is self-imposed", () => {
    // Render the dock inside a deliberately mis-sized parent. Pre-fix,
    // dock height tracked parent. Post-fix, dock has its own height.
    render(
      <div style={{ height: 5000 }}>
        <AgentDock
          agent={AGENT}
          surface={SURFACE}
          thread={[]}
          onMessage={jest.fn()}
          workspace={<div style={{ height: 5000 }}>tall</div>}
        />
      </div>,
    );

    const shell = screen.getByTestId("agent-dock-side-rail-shell");
    // Height comes from the calc() expression, NOT from `100%`.
    expect(shell.style.height.startsWith("calc(")).toBe(true);
    expect(shell.style.height).not.toBe("100%");
  });

  it("keeps the panel and composer using a single chat-panel background", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[{ id: "a", role: "agent", body: "Hi." }]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const panel = screen.getByTestId("agent-dock-panel");
    const thread = screen.getByTestId("agent-dock-thread");
    const form = screen.getByTestId("agent-dock-form");

    // Panel, thread, and composer all read from CANVAS.CHAT_BG. Tokens
    // resolve to `rgb(253, 251, 247)` in jsdom. They must match — the
    // user explicitly flagged background striping.
    const expected = "rgb(253, 251, 247)";
    expect(panel.style.background).toBe(expected);
    expect(thread.style.background).toBe(expected);
    expect(form.style.background).toBe(expected);
  });

  it("drops the legacy sticky-bottom on the composer (handled by flex-column now)", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const form = screen.getByTestId("agent-dock-form");
    // Should NOT carry position:sticky any longer.
    expect(form.style.position).not.toBe("sticky");
  });
});

describe("AgentDock · self-measured top offset", () => {
  // Regression: PR #1773 hardcoded a 64px top offset. On surfaces with
  // additional sticky chrome above the dock (Intelligence's secondary
  // tab nav adds 84px, Source canvas's 11-stage rail, the events
  // portfolio's sourcing-journey strip), 64px under-counts and the
  // composer drops below the fold.
  //
  // Fix: dock self-measures its top y-offset via getBoundingClientRect
  // and writes it to `--agent-dock-self-top` on the shell. The calc()
  // expressions consume that value as the primary subtractor and pin
  // offset, falling back to the legacy 64px var only if measurement
  // hasn't run yet.

  it("writes --agent-dock-self-top after mount based on getBoundingClientRect", () => {
    // Force getBoundingClientRect to report a 200px push-down so we can
    // assert on the measured value. jsdom's default rect is all zeros.
    const originalGBCR = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function (): DOMRect {
      // Only override for the side-rail shell. Other elements keep zeros.
      if (this.getAttribute("data-testid") === "agent-dock-side-rail-shell") {
        return {
          top: 200,
          left: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 200,
          toJSON: () => ({}),
        } as DOMRect;
      }
      return originalGBCR.call(this);
    };

    try {
      render(
        <div data-testid="push-down" style={{ paddingTop: 200 }}>
          <AgentDock
            agent={AGENT}
            surface={SURFACE}
            thread={[]}
            onMessage={jest.fn()}
            workspace={<div data-testid="workspace">w</div>}
          />
        </div>,
      );

      const shell = screen.getByTestId("agent-dock-side-rail-shell");
      // useLayoutEffect runs synchronously during render in @testing-library.
      // The hook should have set the custom property to 200px.
      expect(shell.style.getPropertyValue("--agent-dock-self-top")).toBe(
        "200px",
      );
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGBCR;
    }
  });

  it("uses the measured value as the primary source in the height calc", () => {
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const shell = screen.getByTestId("agent-dock-side-rail-shell");
    // The height calc must consume --agent-dock-self-top with a fallback
    // chain to --agent-dock-top-offset → 64px.
    expect(shell.style.height).toContain("var(--agent-dock-self-top");
    expect(shell.style.height).toContain("var(--agent-dock-top-offset, 64px)");
    // The sticky `top` uses the same measured value.
    expect(shell.style.top).toContain("var(--agent-dock-self-top");
  });

  it("also applies the measured top to pin-top and pin-bottom layouts", () => {
    window.localStorage.setItem(modeStorageKey(SURFACE), "pin-bottom");
    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={[]}
        onMessage={jest.fn()}
        workspace={<div>w</div>}
      />,
    );
    const pinShell = screen.getByTestId("agent-dock-pin-shell");
    expect(pinShell.style.height).toContain("var(--agent-dock-self-top");
    expect(pinShell.style.top).toContain("var(--agent-dock-self-top");
  });
});

describe("AgentDock · citation guard", () => {
  function renderThread(body: string) {
    const thread: ChatMessage[] = [
      {
        id: "agent-1",
        role: "agent",
        body,
      },
    ];

    render(
      <AgentDock
        agent={AGENT}
        surface={SURFACE}
        thread={thread}
        onMessage={jest.fn()}
        workspace={<div data-testid="workspace">workspace</div>}
      />,
    );
  }

  it("shows a citation gap notice for substantive uncited agent turns", () => {
    renderThread(
      "This recommendation changes the next governance decision. It should be reviewed before the program advances.",
    );

    expect(screen.getByLabelText("Citation gap")).toBeInTheDocument();
  });

  it("does not show a citation gap when citation markup is present", () => {
    renderThread(
      "This recommendation changes the next governance decision. It should be reviewed before the program advances. [tenant-specific: approval ledger]",
    );

    expect(screen.queryByLabelText("Citation gap")).not.toBeInTheDocument();
  });
});
