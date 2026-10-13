/** @jest-environment jsdom */

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

import { fireEvent, render, screen } from "@testing-library/react";
import { AgentDock, type ChatMessage } from "../AgentDock";
import { modelAuthoredAnswerPacket } from "@/lib/intelligence/answer/model-authored-answer";

const AGENT = {
  initials: "aVa",
  mark: "ava" as const,
  name: "aVa",
  role: "Sourcing advisor",
};

const withParts: ChatMessage = {
  id: "m1",
  role: "agent",
  body: "Three contracts are in scope.",
  // The real AgentTablePart shape, not an invented one. A first draft used
  // `kind: "table"`; the discriminant is `type`, and tsc rejected it — the
  // fixture-shaped world caught at compile time rather than by a green test
  // asserting against a world that does not exist.
  parts: [
    {
      type: "table",
      title: "Contracts in scope",
      columns: ["Vendor", "Annual value"],
      rows: [["Vendor A", "$1.2M"]],
    },
  ],
};

function renderDock(thread: ChatMessage[]) {
  return render(
    <AgentDock
      agent={AGENT as never}
      surface="source/preview"
      thread={thread as never}
      onMessage={jest.fn()}
      workspace={<div>workspace</div>}
    />,
  );
}

describe("agent dock · structured parts", () => {
  it("wires the opt-in reading view without duplicating exhibits or changing the packet", () => {
    const raw =
      "Validate the baseline before investment.\n\n" +
      Array(12)
        .fill(
          "The decision requires operational evidence, quality measures and a complete cost baseline.",
        )
        .join("\n\n") +
      "\n\nFull analysis conclusion.";
    const answer = modelAuthoredAnswerPacket(raw, "Plan discovery", "test", []);
    renderDock([
      {
        id: "compact",
        role: "agent",
        body: answer.prose!,
        agentAnswer: answer,
        readingWordBudget: 100,
      },
    ]);
    expect(screen.getByTestId("executive-reading-view")).toBeTruthy();
    expect(screen.queryByTestId("agent-dock-artifacts")).toBeNull();
    expect(
      screen.getByTestId("executive-reading-content").textContent,
    ).not.toContain("Full analysis conclusion");
    fireEvent.click(screen.getByRole("button", { name: "Read full analysis" }));
    expect(
      screen.getByTestId("executive-reading-content").textContent,
    ).toContain("Full analysis conclusion");
    expect(answer.modelAuthored?.rawText).toBe(raw);
  });
  it("renders structured response parts instead of fallback prose", () => {
    renderDock([withParts]);

    expect(screen.queryByText(/Three contracts are in scope/)).toBeNull();
    expect(screen.getByText("Contracts in scope")).toBeTruthy();
    expect(screen.getByText("Annual value")).toBeTruthy();
    expect(screen.getByText("Vendor A")).toBeTruthy();
    expect(screen.getByText("$1.2M")).toBeTruthy();
  });

  it("keeps plain assistant messages unchanged when no parts are supplied", () => {
    const withoutParts: ChatMessage = {
      id: withParts.id,
      role: withParts.role,
      body: withParts.body,
    };
    renderDock([withoutParts as ChatMessage]);

    expect(screen.getByText(/Three contracts are in scope/)).toBeTruthy();
    expect(screen.queryByText("Contracts in scope")).toBeNull();
  });
});
