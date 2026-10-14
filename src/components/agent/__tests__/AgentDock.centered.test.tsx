/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { AgentDock, type ChatMessage } from "../AgentDock";

const agent = {
  initials: "aVa",
  name: "aVa",
  role: "Intelligence advisor",
  mark: "ava" as const,
};
const actions = [
  "Compare options",
  "Establish the baseline",
  "Inspect the evidence",
].map((label) => ({ id: label, label, body: label }));
const props = {
  agent,
  surface: "test/centered",
  layout: "chat-only" as const,
  chatOnlyFullWidth: true,
  chatOnlyCentered: true,
  variant: "focused" as const,
  onMessage: jest.fn(),
  workspace: null,
  suggestedActions: actions,
  keepSuggestedActionsVisible: true,
};

it("centers the empty greeting and composer, with suggestions following the actual form", () => {
  render(<AgentDock {...props} thread={[]} />);
  expect(screen.getByText("How can I help?")).toBeInTheDocument();
  expect(screen.getByTestId("agent-dock-panel")).toHaveStyle({
    justifyContent: "center",
    background: "#FFFFFF",
  });
  expect(screen.getByTestId("agent-dock-thread")).toHaveStyle({
    flex: "0 0 auto",
  });
  expect(screen.getByTestId("agent-dock-form")).toHaveStyle({
    minHeight: "100px",
  });
  const suggestions = screen.getByRole("region", { name: "Suggested actions" });
  expect(
    screen.getByTestId("agent-dock-form").compareDocumentPosition(suggestions) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    screen.getByTestId("agent-dock-form").querySelectorAll("svg"),
  ).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
});

it("moves suggestions into the transcript and anchors the composer below a centered conversation", () => {
  const thread: ChatMessage[] = [
    { id: "u", role: "user", body: "Compare options" },
    {
      id: "a",
      role: "agent",
      body: "Validate the business assumptions first.",
    },
  ];
  const { rerender } = render(<AgentDock {...props} thread={[]} />);
  const input = screen.getByTestId("agent-dock-input");
  fireEvent.change(input, { target: { value: "Compare options" } });
  expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
  rerender(<AgentDock {...props} thread={thread} />);
  expect(screen.queryByText("How can I help?")).not.toBeInTheDocument();
  expect(screen.getByTestId("agent-dock-thread")).toContainElement(
    screen.getByRole("region", { name: "Suggested actions" }),
  );
  expect(screen.getByTestId("agent-dock-panel").style.justifyContent).toBe("");
  expect(screen.getByTestId("agent-dock-thread").style.padding).toContain(
    "780px",
  );
  expect(screen.getByTestId("agent-dock-disclaimer")).toHaveTextContent(
    "Check important info",
  );
});

it("does not alter the default dock presentation or another chat-only caller", () => {
  render(<AgentDock {...props} chatOnlyCentered={false} thread={[]} />);
  expect(screen.getByText("Ask aVa anything.")).toBeInTheDocument();
  expect(screen.getByTestId("agent-dock-panel")).not.toHaveAttribute(
    "data-presentation",
  );
});
