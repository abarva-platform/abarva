/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { AGENT_ACTION_APPROVAL_NOTICE_COPY } from "../AgentActionApprovalNotice";
import { AgentResponse } from "../AgentResponse";
import type { RenderedResponse } from "@/lib/agent/renderedResponse";

function response(overrides: Partial<RenderedResponse> = {}): RenderedResponse {
  return {
    response_text:
      "The program is likely ready for the next stage. The evidence still needs review by the accountable owner before any approval is recorded.",
    citations: [],
    confidence_signal: "medium",
    sparsity_flag: false,
    follow_up_actions: [],
    handoff_affordance: null,
    ...overrides,
  };
}

describe("AgentResponse citation defense", () => {
  it("shows a citation gap banner for substantive uncited AI output", () => {
    render(<AgentResponse response={response()} />);

    expect(screen.getByLabelText("Citation gap")).toHaveTextContent(
      "no source citations attached",
    );
    expect(
      screen
        .getByText(/The program is likely ready for the next stage/i)
        .compareDocumentPosition(screen.getByLabelText("Citation gap")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not show a citation gap for operational non-claim output", () => {
    render(
      <AgentResponse
        response={response({
          response_text: "I opened the workspace.",
          confidence_signal: "none",
        })}
      />,
    );

    expect(screen.queryByLabelText("Citation gap")).not.toBeInTheDocument();
  });
});

describe("AgentResponse action approval boundary", () => {
  it("shows human approval language before follow-up action chips", () => {
    render(
      <AgentResponse
        response={response({
          follow_up_actions: [
            {
              id: "approve-next-step",
              kind: "next_turn",
              label: "Approve next step",
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByLabelText("Human approval required for agent actions"),
    ).toHaveTextContent(AGENT_ACTION_APPROVAL_NOTICE_COPY);
  });
});
