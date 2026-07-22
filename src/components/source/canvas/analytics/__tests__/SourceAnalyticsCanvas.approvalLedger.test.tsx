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
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
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

  it("scopes the Approvals workspace to this event only, never renders the featured item twice, and its CTA switches to Steps instead of a same-page nav", () => {
    // Regression test: the raw inbox is cross-tenant by design (the
    // portfolio-level /source/approvals page is where that belongs), but a
    // per-event canvas previously rendered every other event's pending
    // items too, AND rendered its own featured item a second time in the
    // list below it, AND its CTA linked to the exact page already open
    // (looked like a dead click).
    const featured: ApprovalsInboxItem = {
      kind: "stage_gate",
      eventId: "evt-1",
      eventCode: "MERI-EHR-2026",
      eventName: "Healthcare Demo EHR event",
      ask: "Approve advancing out of RFP.",
      readiness: "2 of 3 gate items met.",
      status: "ready_with_gaps",
      stageKey: "rfp",
      stageLabel: "RFP",
      estimatedValueUsd: 1_000_000,
      href: "/source/events/evt-1?stage=rfp",
      actionLabel: "Review & decide",
    };
    const otherEventItem: ApprovalsInboxItem = {
      ...featured,
      eventId: "evt-other",
      eventCode: "APEX-OTHER-2026",
      ask: "Approve advancing a different event.",
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="rfp"
        tenantName="Healthcare Demo"
        approvalItems={[otherEventItem, featured]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Approvals/i }));

    // Only one instance of the featured item's ask text — not rendered
    // twice, and the other event's item never appears here at all.
    expect(screen.getAllByText("Approve advancing out of RFP.")).toHaveLength(1);
    expect(
      screen.queryByText("Approve advancing a different event."),
    ).not.toBeInTheDocument();

    // The featured card's CTA is a real button that switches workspace tabs,
    // not a <Link> to the page already open.
    expect(
      screen.queryByTestId("source-approval-card-go-to-steps"),
    ).not.toBeNull();
    expect(
      screen.queryByTestId("source-shell-v2-steps"),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId("source-approval-card-go-to-steps"),
    );
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
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
