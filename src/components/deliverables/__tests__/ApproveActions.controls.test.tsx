/** @jest-environment jsdom */

/**
 * Behavioral test for the `program-deliverable-approval-actions` control
 * declared in docs/security/ai-surface-control-catalog.json.
 *
 * Two controls sit on this surface:
 *
 *   edit-before-commit — the decision text is editable, and what gets sent is
 *   what the human left in the box, not the text the model drafted.
 *
 *   human-approval-gate — a viewer without approval rights is told so and gets
 *   no approve control at all.
 *
 * The catalog checker proves these strings exist in the file. It cannot prove
 * the edited text is what gets posted, or that a viewer without rights cannot
 * reach the action. This renders the real component and drives it.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ApproveActions } from "../ApproveActions";

const DRAFTED = "Approve the phase 2 deliverable as drafted.";
const EDITED = "Approve with the caveat that the privacy attestation is still open.";

function renderActions(props: Record<string, unknown> = {}) {
  return render(
    <ApproveActions
      programCode="PRG-1"
      deliverableCode="D-01"
      phase={2}
      decision={DRAFTED}
      {...props}
    />,
  );
}

describe("deliverable approve actions · controls", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("gives a viewer without approval rights no way to approve", () => {
    renderActions({ canApprove: false, gateReason: "Read-only access" });

    expect(
      screen.getByText("Approval not available to this viewer"),
    ).toBeTruthy();
    // The absence of the control is the assertion. A disabled button a viewer
    // can still fire would satisfy the catalog and defeat the gate.
    expect(screen.queryByRole("button", { name: /approve/i })).toBeNull();
  });

  it("sends the human's edited decision, not the drafted one", async () => {
    renderActions();

    const box = screen.getByDisplayValue(DRAFTED);
    fireEvent.change(box, { target: { value: EDITED } });
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.decision).toBe(EDITED);
    // The drafted text must not survive the edit — that is the whole point of
    // editing before committing.
    expect(body.decision).not.toBe(DRAFTED);
  });

  it("refuses to submit an emptied decision", async () => {
    renderActions();

    fireEvent.change(screen.getByDisplayValue(DRAFTED), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("tells the approver what approving does before they do it", () => {
    renderActions();

    expect(screen.getByText(/Logs you as approver/)).toBeTruthy();
  });
});
