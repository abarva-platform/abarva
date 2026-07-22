/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { AvaBottomBar } from "../AvaBottomBar";
import type { ChatMessage } from "@/components/agent/AgentDock";

jest.mock("@/lib/agent/markdownRenderer", () => ({
  AgentMarkdown: ({ text }: { text: string }) => (
    <div data-testid="agent-markdown">{text}</div>
  ),
}));

describe("AvaBottomBar", () => {
  it("renders structured Source aVa answer parts inside the conversation", () => {
    const thread: ChatMessage[] = [
      {
        id: "u1",
        role: "user",
        body: "Show vendor response coverage as a chart.",
      },
      {
        id: "a1",
        role: "agent",
        body: "Vendor response coverage is incomplete.",
        parts: [
          {
            type: "table",
            title: "Coverage by vendor",
            columns: ["Vendor", "Answered", "Dodged"],
            rows: [["Vendor A", "4", "2"]],
          },
          {
            type: "barChart",
            title: "Answered levers",
            bars: [{ label: "Vendor A", value: 4, displayValue: "4/6" }],
          },
        ],
      },
    ];

    render(
      <AvaBottomBar
        agentName="aVa"
        thread={thread}
        onMessage={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /view conversation/i }));

    expect(screen.getByTestId("agent-markdown")).toHaveTextContent(
      "Vendor response coverage is incomplete.",
    );
    expect(screen.getByTestId("agent-response-table")).toHaveTextContent(
      "Coverage by vendor",
    );
    expect(screen.getByTestId("agent-response-bar-chart")).toHaveTextContent(
      "Answered levers",
    );
  });
});
