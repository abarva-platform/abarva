/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ApproveActions, normalizeEditableDecision } from "../ApproveActions";

const ORIGINAL_FETCH = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      entry: {
        approverName: "AbarVa Reviewer",
        timestamp: "2026-06-01T20:00:00.000Z",
      },
    }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = ORIGINAL_FETCH;
  jest.restoreAllMocks();
});

function renderApproveActions(decision = "AI drafted gate advance") {
  render(
    <ApproveActions
      programCode="APX-01"
      deliverableCode="D01"
      phase={1}
      decision={decision}
    />,
  );
}

describe("ApproveActions", () => {
  it("normalizes the reviewed decision before commit", () => {
    expect(normalizeEditableDecision("  Advance   with edited rationale  ")).toBe(
      "Advance with edited rationale",
    );
  });

  it("renders an editable decision review control before approval", () => {
    renderApproveActions();

    expect(
      screen.getByLabelText(/review or edit before commit/i),
    ).toHaveValue("AI drafted gate advance");
    expect(
      screen.getByText(/approval ledger records/i),
    ).toBeInTheDocument();
  });

  it("commits the reviewer-edited decision text", async () => {
    renderApproveActions();

    fireEvent.change(screen.getByTestId("approve-actions-editable-decision"), {
      target: { value: "Reviewed and narrowed gate advance" },
    });
    fireEvent.click(screen.getByRole("button", { name: /approve this decision/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(JSON.parse(init.body as string)).toMatchObject({
      programCode: "APX-01",
      deliverableCode: "D01",
      phase: 1,
      decision: "Reviewed and narrowed gate advance",
    });
  });

  it("blocks approval when the reviewed decision text is empty", () => {
    renderApproveActions();

    fireEvent.change(screen.getByTestId("approve-actions-editable-decision"), {
      target: { value: "   " },
    });

    expect(screen.getByRole("button", { name: /approve this decision/i })).toBeDisabled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
