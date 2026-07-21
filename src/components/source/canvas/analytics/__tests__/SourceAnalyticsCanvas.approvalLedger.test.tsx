/**
 * @jest-environment jsdom
 */

// Functional test for SOURCE-SHELL-003: the Approvals workspace must show
// the real, honest per-stage ledger — real "approved" status derived from
// stage position, real approver name when a matching stage_key row exists,
// and an honest "not recorded" note (not a fabricated name) when it
// doesn't. Renders the REAL SourceAnalyticsCanvas, fires a real click to
// open the Approvals tab, and asserts against the actual rendered table —
// built through the real (also-tested) buildApprovalLedger, not a
// hand-typed fixture that could drift from the real shape.

import "@testing-library/jest-dom";
import { fireEvent, render, screen, within } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas } from "../SourceAnalyticsCanvas";
import { buildApprovalLedger } from "@/lib/source/approval-ledger-model";
import type { SourcingEventSummary } from "@/lib/source/types";

function makeEvent(): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "MERI-EHR-2026",
    name: "Healthcare Demo EHR event",
    accountName: "Healthcare Demo",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "rfp",
    currentStageLabel: "RFP",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm mandate",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve strategy gate",
  } as SourcingEventSummary;
}

describe("SourceAnalyticsCanvas — approval ledger (SOURCE-SHELL-003)", () => {
  it("renders the real 11-row ledger with real approved/current/locked status and a real approver name where recorded", () => {
    const ledger = buildApprovalLedger({
      currentStageKey: "rfp",
      approvalRows: [
        {
          stage_key: "strategy",
          approved_by_user_id: "user_abc",
          action: "admin_review",
          created_at: "2026-07-15T10:00:00.000Z",
        },
      ],
      approverNames: new Map([["user_abc", "D. Rao"]]),
    });

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="rfp"
        tenantName="Healthcare Demo"
        approvalLedger={ledger}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Approvals/i }));

    const table = screen.getByTestId("source-shell-approval-ledger");
    expect(table).toBeInTheDocument();

    // Strategy: real recorded approver, not fabricated.
    const strategyRow = screen.getByTestId(
      "source-shell-approval-ledger-row-strategy",
    );
    expect(within(strategyRow).getByText("Approved")).toBeInTheDocument();
    expect(
      within(strategyRow).getByText(/Approved by D\. Rao\./),
    ).toBeInTheDocument();

    // Scope: approved by position, but no matching stage_key row — must
    // say so honestly, never invent a name.
    const scopeRow = screen.getByTestId(
      "source-shell-approval-ledger-row-scope",
    );
    expect(within(scopeRow).getByText("Approved")).toBeInTheDocument();
    expect(within(scopeRow).getByText(/not recorded/i)).toBeInTheDocument();

    // RFP: the current stage — plain authorization statement, not a named
    // individual invented for a stage nobody has been specifically assigned.
    const rfpRow = screen.getByTestId("source-shell-approval-ledger-row-rfp");
    expect(within(rfpRow).getByText("In progress")).toBeInTheDocument();
    expect(
      within(rfpRow).getByText("Any client admin can approve this gate."),
    ).toBeInTheDocument();

    // Value (last stage): locked.
    const valueRow = screen.getByTestId(
      "source-shell-approval-ledger-row-value",
    );
    expect(within(valueRow).getByText("Locked")).toBeInTheDocument();
  });

  it("renders nothing extra when no ledger is supplied (empty array, e.g. read failure)", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="rfp"
        tenantName="Healthcare Demo"
        approvalLedger={[]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Approvals/i }));
    expect(
      screen.queryByTestId("source-shell-approval-ledger"),
    ).not.toBeInTheDocument();
  });
});
