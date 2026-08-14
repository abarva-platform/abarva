/**
 * @jest-environment jsdom
 */

// Functional test for SOURCE-SHELL-002: the Files tab must distinguish
// gate-defining ("Authoritative") artifacts from supporting ("Evidence")
// ones with a real badge, derived from the canonical artifact spec
// registry (the same source of truth ArtifactLifecyclePanel's own
// Gate-defining/Supporting split already reads) — not a guessed or
// hardcoded value. This renders the REAL SourceAnalyticsCanvas with two
// REAL, currently-registered artifact codes (one gate-defining, one not)
// and asserts the actual rendered badge text differs correctly between
// them — a behavioral assertion, not a shape/snapshot check.

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
import { specByCode } from "@/lib/source/canonical-specs/artifact-specs";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { SourceShellArtifactLike } from "@/lib/source/source-event-shell-v2";
import type { SourceEventEvidence } from "@/lib/source/canvas-substrate";

function makeEvent(): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "LSH-AMS-2026",
    name: "Lakeshore AMS Renewal",
    accountName: "Lakeshore",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "strategy",
    currentStageLabel: "Strategy",
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

// Real, currently-registered Strategy-stage spec codes — verified against
// canonical-specs/artifact-specs.ts, not invented for this test.
const GATE_DEFINING_CODE = "d01_strategy_memo";
const SUPPORTING_CODE = "d03_archetype_decision";

describe("SourceAnalyticsCanvas — artifact role badge (SOURCE-SHELL-002)", () => {
  beforeAll(() => {
    // Guard the fixture itself: if these specs are ever renamed/removed,
    // fail loudly here instead of the test below silently asserting
    // nothing meaningful.
    expect(specByCode(GATE_DEFINING_CODE)?.gateDefining).toBe(true);
    expect(specByCode(SUPPORTING_CODE)?.gateDefining).toBe(false);
  });

  it("labels a gate-defining artifact Authoritative and a supporting artifact Evidence — real, differing output from real spec data", () => {
    const artifacts: SourceShellArtifactLike[] = [
      {
        id: "art-gate",
        artifactCode: GATE_DEFINING_CODE,
        stageKey: "strategy",
        title: "Sourcing Strategy Memo",
        status: "approved",
      },
      {
        id: "art-support",
        artifactCode: SUPPORTING_CODE,
        stageKey: "strategy",
        title: "Archetype Decision Record",
        status: "draft",
      },
    ];

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        artifacts={artifacts}
      />,
    );

    // Files tab isn't the default workspace — open it via a real click,
    // matching how a user actually reaches this content.
    fireEvent.click(
      screen.getByRole("button", { name: /Files & deliverables/i }),
    );

    const gateCard = screen.getByTestId("source-shell-file-card-art-gate");
    const supportCard = screen.getByTestId(
      "source-shell-file-card-art-support",
    );
    expect(
      within(gateCard).getByText("Sourcing Strategy Memo"),
    ).toBeInTheDocument();
    expect(
      within(supportCard).getByText("Archetype Decision Record"),
    ).toBeInTheDocument();

    // Assert on the real derived badge text within each card, not a mock.
    expect(within(gateCard).getByText("Authoritative")).toBeInTheDocument();
    expect(within(gateCard).queryByText("Evidence")).not.toBeInTheDocument();

    expect(within(supportCard).getByText("Evidence")).toBeInTheDocument();
    expect(
      within(supportCard).queryByText("Authoritative"),
    ).not.toBeInTheDocument();

    // The status pill renders the real (unmocked) status value verbatim.
    expect(
      within(gateCard).getByTestId("source-shell-file-status-art-gate"),
    ).toHaveTextContent("approved");
    expect(
      within(supportCard).getByTestId("source-shell-file-status-art-support"),
    ).toHaveTextContent("draft");
  });

  it("defaults an unknown artifact code to Evidence rather than falsely gating the stage", () => {
    const artifacts: SourceShellArtifactLike[] = [
      {
        id: "art-unknown",
        artifactCode: "not_a_real_spec_code",
        stageKey: "strategy",
        title: "Ad-hoc upload",
        status: "registered",
      },
    ];

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        artifacts={artifacts}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Files & deliverables/i }),
    );

    const unknownCard = screen.getByTestId(
      "source-shell-file-card-art-unknown",
    );
    expect(within(unknownCard).getByText("Evidence")).toBeInTheDocument();
    expect(
      within(unknownCard).queryByText("Authoritative"),
    ).not.toBeInTheDocument();
  });

  it("shows a stage evidence checklist with required uploads, readiness, and done checks in the live Files workspace", () => {
    const scopeEvent: SourcingEventSummary = {
      ...makeEvent(),
      currentStageKey: "scope",
      currentStageLabel: "Scope",
    } as SourcingEventSummary;
    const evidenceStates: SourceEventEvidence[] = [
      {
        id: "ev-ticket",
        sourceEventId: scopeEvent.id,
        tenantKey: "demo-client",
        requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
        stage: "scope",
        currentState: "Available",
        sourceArtifactId: "art-ticket",
        sourceEventFactIds: ["fact-ticket-volume"],
        notes: null,
        lastSyncedAt: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      },
    ];
    const artifacts: SourceShellArtifactLike[] = [
      {
        id: "art-ticket",
        artifactCode: "ticket_volume_extract",
        stageKey: "scope",
        title: "ServiceNow ticket volume export",
        status: "registered",
        parseStatus: "parsed",
        embeddingStatus: "embedded",
        graphStatus: "projected",
      },
    ];

    render(
      <SourceAnalyticsCanvas
        event={scopeEvent}
        viewStage="scope"
        tenantName="Demo Client"
        artifacts={artifacts}
        evidenceStates={evidenceStates}
        initialWorkspace="files"
      />,
    );

    const checklist = screen.getByTestId("source-stage-evidence-checklist");
    expect(checklist).toHaveTextContent("1 of 6 required evidence items ready");
    expect(checklist).toHaveTextContent("Optional rows improve confidence");

    const ticketRow = screen.getByTestId(
      "source-stage-evidence-checklist-row-EVID-SRC-SCOPE-TICKET-HISTORY",
    );
    expect(ticketRow).toHaveTextContent(
      "L2/L3 ticket history and service volumetrics",
    );
    expect(ticketRow).toHaveTextContent("required");
    expect(ticketRow).toHaveTextContent(
      "One to three exports: ticket volumes, SLA misses, backlog.",
    );
    expect(ticketRow).toHaveTextContent("IT operations owner");
    expect(ticketRow).toHaveTextContent("XLSX, CSV");
    expect(ticketRow).toHaveTextContent("available");
    expect(within(ticketRow).getByLabelText("Done")).toBeInTheDocument();

    const inventoryRow = screen.getByTestId(
      "source-stage-evidence-checklist-row-EVID-SRC-SCOPE-APP-INV",
    );
    expect(inventoryRow).toHaveTextContent("Application and service inventory");
    expect(inventoryRow).toHaveTextContent("not loaded");
    expect(inventoryRow).toHaveTextContent(
      "One controlled workbook/export for the full scope boundary.",
    );
    expect(
      within(inventoryRow).getByRole("button", { name: "Upload" }),
    ).toBeInTheDocument();
  });
});
