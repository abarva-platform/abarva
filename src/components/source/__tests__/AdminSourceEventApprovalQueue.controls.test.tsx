/** @jest-environment jsdom */

/**
 * Behavioral test for the `source-admin-event-approval-queue` control declared
 * in docs/security/ai-surface-control-catalog.json.
 *
 * Two controls sit on this surface. The approval gate requires every stage
 * attestation to be ticked and a reason of real length before an approval can
 * be sent. The risk caveat tells an approver, in the row itself, that this is
 * their accountable decision.
 *
 * The catalog checker proves the strings exist in the file. It cannot prove the
 * button refuses to fire, or that the request carries the attestations the
 * approver actually ticked. This renders the real component and drives it.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AdminSourceEventApprovalQueue } from "../AdminSourceEventApprovalQueue";
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";

const REASON =
  "Sponsor confirmed the strategy memo and the value target before this approval.";

const events = [
  {
    id: "event-1",
    client_key: "tenant-a",
    event_code: "SRC-001",
    event_name: "Application services sourcing",
    event_type: "managed_services",
    sourcing_motion: null,
    classified_category: "ams",
    current_stage_key: "strategy",
    lifecycle_state: "waiting_on_client",
    linked_program_id: null,
    estimated_value_usd: null,
    trigger_description: "A contract is nearing renewal.",
    scope_description: null,
    decision_owner: null,
    created_by_user_id: "user-1",
    created_at: "2026-09-01T00:00:00Z",
  },
] as never;

function openRow(currentUserId?: string | null) {
  render(
    <AdminSourceEventApprovalQueue events={events} currentUserId={currentUserId} />,
  );
  // The row collapses by default; the summary opens it.
  const toggles = screen.getAllByRole("button");
  fireEvent.click(toggles[0]);
}

function approveButton() {
  return screen.getByRole("button", { name: /^Approve/ }) as HTMLButtonElement;
}

function tickAllAttestations() {
  for (const box of screen.getAllByRole("checkbox")) {
    fireEvent.click(box);
  }
}

function writeReason(text: string) {
  fireEvent.change(
    screen.getByPlaceholderText(
      new RegExp(`minimum ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters`),
    ),
    { target: { value: text } },
  );
}

describe("source approval queue · controls", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // A plain object, not a Response: this suite's environment has no global
    // Response, and the component reads only `ok` and `json()`.
    global.fetch = jest.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("refuses to approve before every attestation is ticked", () => {
    openRow();
    writeReason(REASON);

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    // The absent request is the assertion. A disabled control that still posts
    // would satisfy the catalog and defeat the gate.
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("refuses to approve on a reason shorter than the minimum it advertises", () => {
    openRow();
    tickAllAttestations();
    writeReason("x".repeat(SOURCE_APPROVAL_REASON_MIN_LENGTH - 1));

    expect(approveButton().disabled).toBe(true);
    fireEvent.click(approveButton());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sends the attestations the approver actually ticked", async () => {
    openRow();
    tickAllAttestations();
    writeReason(REASON);

    expect(approveButton().disabled).toBe(false);
    fireEvent.click(approveButton());

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body).toMatchObject({
      action: "approve",
      notes: REASON,
      confirmations: {
        strategyMemoReviewed: true,
        valueTargetConfirmed: true,
        archetypeRigorConfirmed: true,
      },
    });
  });

  /**
   * Updated, not deleted. This case was written to assert the risk caveat and
   * pinned the self-approval wording instead, because one unconditional string
   * carried both meanings. The caveat every approver must see is that the
   * decision is recorded against them; whether it is additionally a
   * self-approval is a different statement and is covered below.
   */
  it("tells the approver this is their accountable decision", () => {
    openRow("reviewer-2");

    expect(screen.getByText(/Accountable decision/)).toBeTruthy();
  });

  /**
   * The route derives self-approval from the stored creator and writes
   * "Self-approval notice: the approver is the recorded event creator." onto
   * the append-only record, and its own comment says the approval screen tells
   * a self-approving creator that the decision is flagged.
   *
   * It did not. `currentUserId` was declared in Props and never read, and the
   * notice rendered for everyone — so a peer reviewer was told a self-approval
   * notice and a genuine self-approver was told nothing the record says. A
   * caveat shown to every reader carries no information about any of them.
   */
  describe("the self-approval notice states what the record will say", () => {
    it("names the self-approval when the approver created the event", () => {
      openRow("user-1"); // events[0].created_by_user_id

      expect(screen.getByText(/Self-approval notice/)).toBeTruthy();
      expect(screen.getByText(/recorded creator of this event/)).toBeTruthy();
    });

    it("does not claim a self-approval when someone else created the event", () => {
      openRow("reviewer-2");

      expect(screen.queryByText(/Self-approval notice/)).toBeNull();
    });

    /**
     * Fail-safe rather than fail-quiet. With no viewer identity the screen
     * cannot know which case it is in, so it must not assert the absence of a
     * self-approval — the server still marks the record either way.
     */
    it("states the condition rather than asserting either way when the viewer is unknown", () => {
      openRow();

      expect(screen.getByText(/Self-approval notice/)).toBeTruthy();
      expect(screen.getByText(/if you created this event/i)).toBeTruthy();
    });
  });

  it("surfaces a failed approval instead of implying it succeeded", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({ detail: "gate blocked" }),
    })) as unknown as typeof fetch;

    openRow();
    tickAllAttestations();
    writeReason(REASON);
    fireEvent.click(approveButton());

    // A silent failure here would leave an approver believing a gate advanced.
    await waitFor(() => {
      expect(screen.getByText(/gate blocked|Approval action failed/)).toBeTruthy();
    });
  });

  /**
   * Send back and reject are lifecycle decisions with the same audit weight as
   * approve: one archives the event, the other returns it to the creator. Both
   * fired on a bare click with no rationale, and the route accepted it. The
   * route now refuses; the queue states the requirement rather than letting the
   * refusal arrive as an error after the click.
   */
  describe("send back and reject carry the same rationale weight", () => {
    const decisionButton = (testId: string) =>
      screen.getByTestId(testId) as HTMLButtonElement;

    it.each([
      ["source-event-send-back-event-1", "send_back"],
      ["source-event-reject-event-1", "reject"],
    ])("refuses %s with no rationale", (testId) => {
      openRow();

      expect(decisionButton(testId).disabled).toBe(true);
      fireEvent.click(decisionButton(testId));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.each([
      ["source-event-send-back-event-1", "send_back"],
      ["source-event-reject-event-1", "reject"],
    ])("refuses %s on a rationale shorter than the minimum", (testId) => {
      openRow();
      writeReason("x".repeat(SOURCE_APPROVAL_REASON_MIN_LENGTH - 1));

      expect(decisionButton(testId).disabled).toBe(true);
      fireEvent.click(decisionButton(testId));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.each([
      ["source-event-send-back-event-1", "send_back"],
      ["source-event-reject-event-1", "reject"],
    ])("sends %s with the rationale once it meets the minimum", async (testId, action) => {
      openRow();
      writeReason(REASON);

      expect(decisionButton(testId).disabled).toBe(false);
      fireEvent.click(decisionButton(testId));

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
      const [, init] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(String((init as RequestInit).body));
      expect(body).toMatchObject({ action, notes: REASON });
    });
  });
});
