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

function openRow() {
  render(<AdminSourceEventApprovalQueue events={events} />);
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

  it("tells the approver this is their accountable decision", () => {
    openRow();

    expect(screen.getByText(/Self-approval notice/)).toBeTruthy();
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
});
