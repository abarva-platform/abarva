/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
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

    await Promise.resolve();
    await Promise.resolve();

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

    await Promise.resolve();
    await Promise.resolve();

    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.selfApproveIfAuthorized).toBe(false);
  });
});
