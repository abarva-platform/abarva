/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EventApprovalCard } from "../EventApprovalCard";

const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const baseProps = {
  eventId: "evt-1",
  eventName: "AMS Outsourcing 2026",
  eventCode: "SRC-004",
  lifecycleState: "waiting_on_client",
  createdBy: {
    userId: "user-1",
    displayName: "You",
    role: "Event creator",
  },
  createdAt: "2026-06-04T20:00:00.000Z",
  evidenceUpdatedAt: "2026-06-05T20:00:00.000Z",
  capturedFacts: [
    { id: "trigger", label: "Why now / trigger", value: "Renewal window" },
    { id: "owner", label: "Decision owner", value: "CIO Office" },
    { id: "scope", label: "Scope boundary", value: "AMS scope" },
    { id: "value", label: "Value or savings target", value: "$35M" },
    {
      id: "baseline",
      label: "Minimum data / baseline owner",
      value: "Finance",
    },
  ],
  intakeChatTurns: [
    { id: "t1", speaker: "Source intake", text: "Event opened." },
  ],
  sponsor: {
    displayName: "CIO Office",
    role: "Decision owner",
  },
  coApprover: {
    displayName: "Lynne Stratham",
    role: "Co-decision",
  },
  pilotMode: true,
  currentUserId: "user-1",
  currentUserCanApprove: true,
  currentStageHref: "/source/events/evt-1?stage=strategy",
};

describe("EventApprovalCard", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    global.fetch = jest.fn();
  });

  it("renders one primary approval action and keeps request/reject behind other decisions", () => {
    render(<EventApprovalCard {...baseProps} />);

    expect(screen.getByTestId("source-approval-page")).not.toBeNull();
    expect(
      (screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Send to Lynne Stratham",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(screen.getByText("Other decisions")).not.toBeNull();
    expect(
      screen.getByText("Self-approval notice", { exact: false }),
    ).not.toBeNull();
  });

  it("puts the approval brief first and moves supporting detail behind disclosures", () => {
    render(<EventApprovalCard {...baseProps} />);

    expect(screen.getByTestId("source-approval-brief")).not.toBeNull();
    expect(screen.getByText("What you are approving")).not.toBeNull();
    expect(screen.getByText("Next required step")).not.toBeNull();
    expect(
      screen.getByTestId("source-approval-evidence-disclosure"),
    ).not.toBeNull();
    expect(
      screen.getByText(/Evidence reviewed · 5 facts · updated .* ago/),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "Audit history · 1 intake turn · 0 approvals · 0 acceptances",
      ),
    ).not.toBeNull();
    expect(screen.getByText("Routing and audit details")).not.toBeNull();
  });

  it("uses compact approval-screen typography instead of presentation-scale headers", () => {
    render(<EventApprovalCard {...baseProps} />);

    expect(screen.getByRole("heading", { level: 1 }).getAttribute("style")).toContain(
      "font-size: clamp(22px, 1.45vw, 28px)",
    );
    expect(screen.getByRole("heading", { level: 1 }).getAttribute("style")).toContain(
      "line-height: 1.12",
    );
    expect(screen.getByText("What you are approving").getAttribute("style")).toContain(
      "font-size: 18px",
    );
    expect(screen.getByText("Approve or send back").getAttribute("style")).toContain(
      "font-size: 18px",
    );
    expect(screen.getByText("Who must say yes").getAttribute("style")).toContain(
      "font-size: 18px",
    );
    expect(screen.getByTestId("source-approval-rationale").getAttribute("rows")).toBe(
      "4",
    );
  });

  it("shows real governance history when approvals and artifact acceptances are present", () => {
    render(
      <EventApprovalCard
        {...baseProps}
        approvalLedger={[
          {
            stageKey: "strategy",
            stageLabel: "Strategy",
            index: 1,
            state: "approved",
            approverName: "Ada Lovelace",
            approvedAtIso: "2026-06-06T15:00:00.000Z",
            authorizationNote: "Approved by Ada Lovelace.",
            approverRationale: null,
          },
        ]}
        artifactAcceptances={[
          {
            id: "acceptance-1",
            artifactId: "artifact-1",
            artifactName: "Strategy memo",
            stageKey: "strategy",
            acceptedBy: "Grace Hopper",
            acceptedAt: "2026-06-07T15:00:00.000Z",
            contentDriftStatus: "current",
            gatePreconditionStatus: "ready",
            approvalRationale:
              "Reviewed and accepted as the authoritative memo.",
          },
        ]}
      />,
    );

    expect(
      screen.getByText(
        "Audit history · 1 intake turn · 1 approval · 1 acceptance",
      ),
    ).not.toBeNull();
    expect(
      screen.getByTestId("source-approval-governance-history"),
    ).not.toBeNull();
    expect(
      screen.getByTestId("source-approval-governance-ledger-row-strategy"),
    ).not.toBeNull();
    expect(screen.getByText("01 · Strategy")).not.toBeNull();
    expect(screen.getAllByText(/Ada Lovelace/).length).toBeGreaterThan(0);
    expect(
      screen.getByTestId("source-approval-artifact-acceptance-acceptance-1"),
    ).not.toBeNull();
    expect(screen.getByText("Strategy memo")).not.toBeNull();
    expect(screen.getByText(/Accepted by Grace Hopper/)).not.toBeNull();
    expect(
      screen.getByText("Reviewed and accepted as the authoritative memo."),
    ).not.toBeNull();
  });

  it("shows honest empty states when no governance records exist yet", () => {
    render(<EventApprovalCard {...baseProps} />);

    expect(
      screen.getByText(
        "No prior stage approvals are recorded for this event yet.",
      ),
    ).not.toBeNull();
    expect(
      screen.getByText(
        "No artifact acceptances are recorded for this event yet.",
      ),
    ).not.toBeNull();
  });

  it("enables actions only after rationale and human confirmation", () => {
    render(<EventApprovalCard {...baseProps} />);

    const approve = screen.getByTestId("source-approval-approve");
    expect((approve as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByTestId("source-approval-rationale"), {
      target: {
        value:
          "Reviewed the trigger, owner, scope, value basis, and baseline owner for this event.",
      },
    });
    expect((approve as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByTestId("source-approval-confirmation"));
    expect((approve as HTMLButtonElement).disabled).toBe(false);
    expect(
      (screen.getByTestId("source-approval-co-approver") as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it("shows the three strategy-gate confirmations and gates Approve on all three when strategy-at-P0 is on", () => {
    render(<EventApprovalCard {...baseProps} generateMemoOnApprove />);

    // the single accountable-decision confirm is replaced by the 3-box gate
    expect(screen.queryByTestId("source-approval-confirmation")).toBeNull();
    expect(screen.getByTestId("source-approval-gate-sponsor")).not.toBeNull();
    expect(screen.getByTestId("source-approval-gate-value")).not.toBeNull();
    expect(screen.getByTestId("source-approval-gate-archetype")).not.toBeNull();

    const approve = screen.getByTestId(
      "source-approval-approve",
    ) as HTMLButtonElement;
    fireEvent.change(screen.getByTestId("source-approval-rationale"), {
      target: {
        value:
          "Reviewed the trigger, owner, scope, value basis, and baseline owner for this event.",
      },
    });

    // rationale + only two of three boxes → still blocked
    fireEvent.click(screen.getByTestId("source-approval-gate-sponsor"));
    fireEvent.click(screen.getByTestId("source-approval-gate-value"));
    expect(approve.disabled).toBe(true);

    // all three confirmed → Approve enables
    fireEvent.click(screen.getByTestId("source-approval-gate-archetype"));
    expect(approve.disabled).toBe(false);
  });

  it("sends selfApproveIfAuthorized on approve when the creator is self-approving in pilot mode", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<EventApprovalCard {...baseProps} />);

    fireEvent.change(screen.getByTestId("source-approval-rationale"), {
      target: {
        value:
          "Reviewed the trigger, owner, scope, value basis, and baseline owner for this event.",
      },
    });
    fireEvent.click(screen.getByTestId("source-approval-confirmation"));
    fireEvent.click(screen.getByTestId("source-approval-approve"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.selfApproveIfAuthorized).toBe(true);
  });

  it("does not send selfApproveIfAuthorized when the approver is not the event creator", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    render(<EventApprovalCard {...baseProps} currentUserId="user-2" />);

    fireEvent.change(screen.getByTestId("source-approval-rationale"), {
      target: {
        value:
          "Reviewed the trigger, owner, scope, value basis, and baseline owner for this event.",
      },
    });
    fireEvent.click(screen.getByTestId("source-approval-confirmation"));
    fireEvent.click(screen.getByTestId("source-approval-approve"));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.selfApproveIfAuthorized).toBe(false);
  });
});
