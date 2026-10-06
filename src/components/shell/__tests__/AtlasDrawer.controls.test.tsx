/** @jest-environment jsdom */

/**
 * Behavioral test for the `atlas-drawer-chat-shell` control declared in
 * docs/security/ai-surface-control-catalog.json.
 *
 * Four controls sit on this drawer: the AI draft label on an answer, the
 * responsibility footer, the notice that agent actions need human approval,
 * and the citation-gap notice on substantive uncited prose. All four render in
 * the drawer's dark tone, which is a separate code path from the light-tone
 * surfaces already covered.
 *
 * The checker proves the component names appear in the file. It cannot prove
 * they render — a tone prop typo or a collapsed branch would keep the names and
 * lose the notices. This renders the real drawer.
 *
 * Two of the four controls render per answer, not per drawer, so a fixture
 * with no answer in it cannot reach them: the drawer's `isVisible` is
 * `isStreaming || !!response` and its turn list is empty. Those two are driven
 * here through the drawer's two real answer paths — the in-flight response
 * from `useAgentStream`, and a settled turn from `AtlasPageState` — with the
 * controls themselves left unmocked.
 */

const mockStream: {
  response: string;
  isStreaming: boolean;
  error: string | null;
} = { response: "", isStreaming: false, error: null };

const mockPageState: { current: unknown } = { current: null };

jest.mock("@/hooks/useAgentStream", () => ({
  useAgentStream: () => ({
    ask: jest.fn(),
    response: mockStream.response,
    isStreaming: mockStream.isStreaming,
    error: mockStream.error,
    clear: jest.fn(),
  }),
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => mockPageState.current,
}));

import { render, screen } from "@testing-library/react";
import { AtlasDrawer } from "../AtlasDrawer";
import { AI_RESPONSIBILITY_FOOTER_COPY } from "@/components/abarva/AIResponsibilityFooter";
import { AGENT_ACTION_APPROVAL_NOTICE_COPY } from "@/components/agent/AgentActionApprovalNotice";

const AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Sourcing advisor",
};

/**
 * Two sentences and no citation marker — `shouldShowPlainTextCitationGap`
 * treats that as a substantive claim with no source basis, which is the
 * condition the notice exists for.
 */
const UNCITED_ANSWER =
  "Consolidating the three overlapping observability agreements removes a " +
  "duplicate ingest tier. The earlier of the two renewals is the one to move.";

/** The same claim with the citation marker the answer engines attach. */
const CITED_ANSWER = `${UNCITED_ANSWER} Source basis: Vendor & Contract Register.`;

/** Below the substantive-claim threshold: one short sentence. */
const TRIVIAL_ANSWER = "Noted.";

beforeEach(() => {
  mockStream.response = "";
  mockStream.isStreaming = false;
  mockStream.error = null;
  mockPageState.current = null;
});

function renderDrawer() {
  return render(
    <AtlasDrawer
      isOpen
      onClose={jest.fn()}
      agent={AGENT as never}
      quote="Ask about this contract."
      surface="source/preview"
    />,
  );
}

/** Drive the in-flight answer path: the drawer's own `useAgentStream`. */
function renderWithStreamedAnswer(
  response: string,
  isStreaming = false,
): ReturnType<typeof render> {
  mockStream.response = response;
  mockStream.isStreaming = isStreaming;
  return renderDrawer();
}

/** Drive the settled-turn path: a conversation held in AtlasPageState. */
function renderWithSettledTurns(
  turns: { role: "user" | "agent"; text: string }[],
): ReturnType<typeof render> {
  mockPageState.current = {
    conversation: turns.map((turn, index) => ({
      id: `turn-${index}`,
      role: turn.role,
      text: turn.text,
      agentName: "aVa",
      timestamp: 1_700_000_000_000 + index,
    })),
    currentResponse: "",
    currentResponseParts: [],
    isStreaming: false,
    error: null,
  };
  return renderDrawer();
}

function aiDraftLabels(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-ai-label-status="draft"]'),
  );
}

function citationGapNotices(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[data-citation-gap-notice="true"]'),
  );
}

describe("atlas drawer · disclosure controls", () => {
  it("carries the responsibility footer in the drawer's own tone", () => {
    renderDrawer();

    expect(screen.getByText(AI_RESPONSIBILITY_FOOTER_COPY)).toBeTruthy();
  });

  it("states that agent actions need human approval", () => {
    renderDrawer();

    const notice = screen.getByLabelText(
      "Human approval required for agent actions",
    );
    expect(notice.textContent ?? "").toContain(
      AGENT_ACTION_APPROVAL_NOTICE_COPY,
    );
  });

  it("keeps both notices in the drawer rather than only on the page behind it", () => {
    const { container } = renderDrawer();

    // The drawer is a separate surface from the page that opened it. A reader
    // working inside it must see the same disclosures without closing it.
    expect(container.textContent ?? "").toContain(
      AI_RESPONSIBILITY_FOOTER_COPY,
    );
    expect(container.textContent ?? "").toContain(
      AGENT_ACTION_APPROVAL_NOTICE_COPY,
    );
  });
});

describe("atlas drawer · AI draft label on an answer", () => {
  it("labels a settled streamed answer as a draft to review", () => {
    const { container } = renderWithStreamedAnswer(UNCITED_ANSWER);

    const labels = aiDraftLabels(container);
    expect(labels).toHaveLength(1);
    expect(labels[0].getAttribute("aria-label") ?? "").toContain(
      "Review before acting",
    );
  });

  it("labels an answer while it is still generating", () => {
    const { container } = renderWithStreamedAnswer("Consolidating the", true);

    const labels = aiDraftLabels(container);
    expect(labels).toHaveLength(1);
    expect(labels[0].getAttribute("aria-label") ?? "").toContain("Generating");
  });

  it("labels a settled agent turn and leaves the reader's own words unlabelled", () => {
    const { container } = renderWithSettledTurns([
      { role: "user", text: UNCITED_ANSWER },
      { role: "agent", text: UNCITED_ANSWER },
    ]);

    // Both turns carry the same substantive text. Only the agent's is AI
    // output, so exactly one label may appear — labelling the reader's own
    // question would make the marker meaningless.
    expect(aiDraftLabels(container)).toHaveLength(1);
  });

  it("shows no answer label when the drawer has no answer in it", () => {
    const { container } = renderDrawer();

    expect(aiDraftLabels(container)).toHaveLength(0);
  });
});

describe("atlas drawer · citation gap on an answer", () => {
  it("warns when a streamed substantive answer carries no source basis", () => {
    const { container } = renderWithStreamedAnswer(UNCITED_ANSWER);

    const notices = citationGapNotices(container);
    expect(notices).toHaveLength(1);
    expect(notices[0].textContent ?? "").toContain(
      "no source citations attached",
    );
  });

  it("stays silent when the same answer carries its source basis", () => {
    const { container } = renderWithStreamedAnswer(CITED_ANSWER);

    // The claim is identical; only the citation marker differs. A notice here
    // would train the reader to ignore it.
    expect(citationGapNotices(container)).toHaveLength(0);
  });

  it("stays silent on an answer that makes no substantive claim", () => {
    const { container } = renderWithStreamedAnswer(TRIVIAL_ANSWER);

    expect(citationGapNotices(container)).toHaveLength(0);
  });

  it("warns on an uncited settled agent turn, not on the reader's own turn", () => {
    const { container } = renderWithSettledTurns([
      { role: "user", text: UNCITED_ANSWER },
      { role: "agent", text: UNCITED_ANSWER },
    ]);

    expect(citationGapNotices(container)).toHaveLength(1);
  });

  it("stays silent on a cited settled agent turn", () => {
    const { container } = renderWithSettledTurns([
      { role: "agent", text: CITED_ANSWER },
    ]);

    expect(citationGapNotices(container)).toHaveLength(0);
  });
});
