/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AdminSourceEventApprovalQueue } from "../AdminSourceEventApprovalQueue";
import type { SourceEventRow } from "@/lib/source/queries";

const EVENT: SourceEventRow = {
  id: "event-1",
  client_key: "meridian-health",
  event_code: "MERI-AMS-SOURCING-EVENT-2026",
  event_name: "Meridian AMS Sourcing Event",
  event_type: "managed_services",
  current_stage_key: "strategy",
  lifecycle_state: "pending_admin_review",
  linked_program_id: null,
  estimated_value_usd: 3500000,
  trigger_description: "AMS sourcing event awaiting Source admin review.",
  scope_description: "Managed services sourcing",
  decision_owner: "Anita Krishnamurthy",
  created_by_user_id: "user-1",
  created_at: "2026-06-01T20:00:00.000Z",
  updated_at: "2026-06-01T20:00:00.000Z",
};

describe("AdminSourceEventApprovalQueue", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires a reason and explicit confirmation before approval actions unlock", () => {
    render(<AdminSourceEventApprovalQueue events={[EVENT]} currentUserId="user-1" />);

    expect(screen.getByText(/self-approval notice/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeDisabled();

    fireEvent.change(screen.getByTestId("source-event-approval-reason-event-1"), {
      target: { value: "Reviewed strategy gate evidence and business owner accountability." },
    });
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();

    fireEvent.click(screen.getByTestId("source-event-approval-confirm-event-1"));

    expect(screen.getByRole("button", { name: /approve/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /reject/i })).toBeEnabled();
  });

  it("posts the human reason and confirmation flag to the approval endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true } as Response);
    Object.defineProperty(global, "fetch", {
      configurable: true,
      value: fetchMock,
    });
    jest.spyOn(window, "confirm").mockReturnValue(true);

    render(<AdminSourceEventApprovalQueue events={[EVENT]} currentUserId="other-user" />);

    fireEvent.change(screen.getByTestId("source-event-approval-reason-event-1"), {
      target: { value: "Reviewed scope, sponsor accountability, and Source governance evidence." },
    });
    fireEvent.click(screen.getByTestId("source-event-approval-confirm-event-1"));
    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/source/events/event-1/approve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          action: "approve",
          notes: "Reviewed scope, sponsor accountability, and Source governance evidence.",
          confirmed: true,
        }),
      }),
    );
  });
});
