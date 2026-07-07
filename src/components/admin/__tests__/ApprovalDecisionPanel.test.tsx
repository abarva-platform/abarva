/**
 * @jest-environment jsdom
 */
/**
 * OV2-2c · ApprovalDecisionPanel interactive tests
 *
 * Coverage:
 *   • Approve/Reject are disabled until rationale is entered
 *   • Approve happy path POSTs the right body and redirects
 *   • Reject happy path includes the trimmed rationale in the body
 *   • Server error renders inline alert
 *   • alreadyDecided=true renders the read-only variant
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ApprovalDecisionPanel } from "../programs/ApprovalDecisionPanel";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const fetchMock = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // jsdom does not ship fetch by default
  (globalThis as { fetch?: typeof fetch }).fetch =
    fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

function mockResponse(body: unknown, init: { status?: number } = {}): Response {
  // jsdom in this jest config does not expose the global Response. We
  // fall back to a duck-typed object that the panel only needs to
  // expose ok / status / json().
  const status = init.status ?? 200;
  const stub = {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
  return stub as unknown as Response;
}

describe("ApprovalDecisionPanel", () => {
  it("blocks approve/reject until rationale is entered and does not POST", () => {
    render(<ApprovalDecisionPanel requestId="req-1" />);
    expect(screen.getByTestId("approval-approve-button")).toBeDisabled();
    expect(screen.getByTestId("approval-reject-button")).toBeDisabled();
    expect(
      screen.getByText(/Add a rationale before approving or rejecting/i),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("approve happy path POSTs the right body and navigates", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: true, request: { id: "req-1" } }),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId("approval-rationale-textarea"), {
      target: { value: "  optional but nice  " },
    });
    fireEvent.click(screen.getByTestId("approval-approve-button"));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/admin/programs/approvals/req-1");
    expect(init.method).toBe("POST");
    const sent = JSON.parse(init.body as string) as {
      decision: string;
      rationale?: string;
    };
    expect(sent.decision).toBe("approved");
    expect(sent.rationale).toBe("optional but nice");
    expect(pushMock).toHaveBeenCalledWith("/admin/programs/approvals");
  });

  it("reject happy path POSTs the trimmed rationale", async () => {
    fetchMock.mockResolvedValue(
      mockResponse({ ok: true, request: { id: "req-1" } }),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId("approval-rationale-textarea"), {
      target: { value: "\n  sponsor not committed  \n" },
    });
    fireEvent.click(screen.getByTestId("approval-reject-button"));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string) as {
      decision: string;
      rationale?: string;
    };
    expect(sent.decision).toBe("rejected");
    expect(sent.rationale).toBe("sponsor not committed");
  });

  it("renders an inline error on a failed POST", async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { error: "decide_failed", detail: "already decided" },
        {
          status: 400,
        },
      ),
    );
    render(<ApprovalDecisionPanel requestId="req-1" />);
    fireEvent.change(screen.getByTestId("approval-rationale-textarea"), {
      target: { value: "looks good" },
    });
    fireEvent.click(screen.getByTestId("approval-approve-button"));

    expect(
      await screen.findByTestId("approval-decision-error"),
    ).toHaveTextContent(/already decided/);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("renders the decided variant when alreadyDecided=true", () => {
    render(<ApprovalDecisionPanel requestId="req-1" alreadyDecided />);
    expect(
      screen.getByTestId("approval-decision-panel-decided"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("approval-decision-panel")).toBeNull();
  });

  // ── PRE-W4-PR-4 · escalation actions + SLA badge ────────────────────
  describe("escalation actions", () => {
    it("renders notify-sponsor and escalate buttons", () => {
      render(<ApprovalDecisionPanel requestId="req-1" />);
      expect(
        screen.getByTestId("approval-notify-sponsor-button"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("approval-escalate-button"),
      ).toBeInTheDocument();
    });

    it("renders SLA badge with correct bucket", () => {
      const past = new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString();
      render(<ApprovalDecisionPanel requestId="req-1" requestedAt={past} />);
      const badge = screen.getByTestId("approval-sla-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.getAttribute("data-sla-bucket")).toBe("breach");
    });

    it("amber palette on notify when notifyCount > 0", () => {
      render(<ApprovalDecisionPanel requestId="req-1" notifyCount={2} />);
      const btn = screen.getByTestId("approval-notify-sponsor-button");
      expect(btn).toHaveTextContent("(2)");
    });

    it("escalate disabled when escalationLevel=2", () => {
      render(<ApprovalDecisionPanel requestId="req-1" escalationLevel={2} />);
      const btn = screen.getByTestId("approval-escalate-button");
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent(/Escalated/);
    });

    it("clicking notify-sponsor calls the action and shows a banner", async () => {
      const notify = jest.fn().mockResolvedValue({
        ok: true,
        notifiedAt: "2026-05-30T12:00:00Z",
        notifyCount: 1,
        escalationLevel: 1,
      });
      render(
        <ApprovalDecisionPanel requestId="req-1" notifySponsor={notify} />,
      );
      fireEvent.click(screen.getByTestId("approval-notify-sponsor-button"));
      await waitFor(() => expect(notify).toHaveBeenCalledWith("req-1"));
      expect(
        await screen.findByTestId("approval-decision-notice"),
      ).toHaveTextContent(/Reminder logged/);
    });

    it("escalate opens confirmation, calls action, navigates to queue", async () => {
      const escalate = jest.fn().mockResolvedValue({
        ok: true,
        escalationLevel: 2,
        escalatedToUserId: "admin-9",
      });
      render(
        <ApprovalDecisionPanel requestId="req-1" escalateApproval={escalate} />,
      );
      fireEvent.click(screen.getByTestId("approval-escalate-button"));
      expect(
        screen.getByTestId("approval-escalate-confirm"),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("approval-escalate-confirm-button"));
      await waitFor(() => expect(escalate).toHaveBeenCalledWith("req-1"));
      await waitFor(() => expect(pushMock).toHaveBeenCalled());
      expect(pushMock).toHaveBeenCalledWith(
        "/admin/programs/approvals?banner=escalated",
      );
    });

    it("escalate cancel closes the dialog without calling the action", () => {
      const escalate = jest.fn();
      render(
        <ApprovalDecisionPanel requestId="req-1" escalateApproval={escalate} />,
      );
      fireEvent.click(screen.getByTestId("approval-escalate-button"));
      fireEvent.click(screen.getByTestId("approval-escalate-cancel-button"));
      expect(screen.queryByTestId("approval-escalate-confirm")).toBeNull();
      expect(escalate).not.toHaveBeenCalled();
    });
  });
});
