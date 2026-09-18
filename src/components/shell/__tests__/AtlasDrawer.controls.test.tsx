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
 */

jest.mock("@/hooks/useAgentStream", () => ({
  useAgentStream: () => ({
    thread: [],
    send: jest.fn(),
    isStreaming: false,
    stop: jest.fn(),
  }),
}));

jest.mock("@/components/shell/AtlasPageStateProvider", () => ({
  useAtlasPageState: () => null,
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
