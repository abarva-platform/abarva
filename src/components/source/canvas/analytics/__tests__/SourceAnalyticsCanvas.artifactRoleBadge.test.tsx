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
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

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
        tenantName="Test Tenant"
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
      {
        id: "ev-sow",
        sourceEventId: scopeEvent.id,
        tenantKey: "demo-client",
        requirementId: "EVID-SRC-SCOPE-CURRENT-SOW",
        stage: "scope",
        currentState: "Parsed",
        sourceArtifactId: "art-sow",
        sourceEventFactIds: [],
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
      {
        id: "art-sow",
        artifactCode: "sow_scope_extract",
        stageKey: "scope",
        title: "Current SOW and change-order register",
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
    expect(
      within(ticketRow).getByLabelText("File uploaded"),
    ).toBeInTheDocument();
    expect(within(ticketRow).getByLabelText("Done")).toBeInTheDocument();

    const sowRow = screen.getByTestId(
      "source-stage-evidence-checklist-row-EVID-SRC-SCOPE-CURRENT-SOW",
    );
    expect(sowRow).toHaveTextContent("Uploaded");
    expect(sowRow).toHaveTextContent("parsed");
    expect(within(sowRow).getByLabelText("File uploaded")).toBeInTheDocument();
    expect(within(sowRow).getByLabelText("Open")).toBeInTheDocument();

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

  it("offers an accountable absence decision only for a record that may genuinely not exist", () => {
    const incumbentState: SourceEventEvidence = {
      id: "incumbent-evidence", sourceEventId: "evt-1", tenantKey: "demo-client",
      requirementId: "EVID-SRC-STR-INCUMBENT", stage: "strategy",
      currentState: "Not Requested", sourceArtifactId: null,
      applicabilityStatus: "applicable", notes: null, lastSyncedAt: null,
      createdAt: "2026-09-28T00:00:00Z", updatedAt: "2026-09-28T00:00:00Z",
    };
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        artifacts={[]}
        evidenceStates={[incumbentState]}
        initialWorkspace="files"
      />,
    );

    const incumbent = screen.getByTestId(
      "source-stage-evidence-checklist-row-EVID-SRC-STR-INCUMBENT",
    );
    fireEvent.click(within(incumbent).getByRole("button", { name: "Declare no incumbent" }));
    expect(within(incumbent).queryByRole("button", { name: "Record applicability" })).not.toBeInTheDocument();
    fireEvent.change(within(incumbent).getByLabelText("Reason no incumbent exists"), {
      target: { value: "This net-new service has no incumbent agreement or renewal history." },
    });
    fireEvent.click(within(incumbent).getByRole("checkbox", { name: /I confirm no incumbent exists/i }));
    expect(within(incumbent).getByRole("button", { name: "Record applicability" })).toBeEnabled();
    expect(screen.queryByRole("button", { name: "Declare no sponsor commitment" })).not.toBeInTheDocument();
  });

  it("does not offer absence decisions before the schema has been read back", () => {
    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Lakeshore"
        artifacts={[]}
        evidenceStates={[{
          id: "incumbent-evidence", sourceEventId: "evt-1", tenantKey: "demo-client",
          requirementId: "EVID-SRC-STR-INCUMBENT", stage: "strategy",
          currentState: "Not Requested", sourceArtifactId: null,
          notes: null, lastSyncedAt: null,
          createdAt: "2026-09-28T00:00:00Z", updatedAt: "2026-09-28T00:00:00Z",
        }]}
        initialWorkspace="files"
      />,
    );
    expect(screen.queryByRole("button", { name: "Declare no incumbent" })).not.toBeInTheDocument();
  });

  it("does not render a narrative-only trigger as uploaded or available", () => {
    const triggerEvidence: SourceEventEvidence = {
      id: "trigger-evidence",
      sourceEventId: "evt-1",
      tenantKey: "demo-client",
      requirementId: "EVID-SRC-STR-TRIGGER",
      stage: "strategy",
      currentState: "Available",
      sourceArtifactId: null,
      notes: "Client-stated trigger text without a linked source record.",
      lastSyncedAt: null,
      createdAt: "2026-09-28T00:00:00Z",
      updatedAt: "2026-09-28T00:00:00Z",
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Test Tenant"
        artifacts={[]}
        evidenceStates={[triggerEvidence]}
        initialWorkspace="files"
      />,
    );

    const trigger = screen.getByTestId(
      "source-stage-evidence-checklist-row-EVID-SRC-STR-TRIGGER",
    );
    expect(trigger).toHaveTextContent("not loaded");
    expect(trigger).not.toHaveTextContent("available");
    expect(
      within(trigger).queryByLabelText("File uploaded"),
    ).not.toBeInTheDocument();
    expect(within(trigger).getByLabelText("Open")).toBeInTheDocument();
    expect(
      within(trigger).getByRole("button", { name: "Upload" }),
    ).toBeInTheDocument();
  });

  it("does not describe an unlinked trigger as Available in the Continue summary", () => {
    const triggerEvidence: SourceEventEvidence = {
      id: "trigger-evidence",
      sourceEventId: "evt-1",
      tenantKey: "demo-client",
      requirementId: "EVID-SRC-STR-TRIGGER",
      stage: "strategy",
      currentState: "Available",
      sourceArtifactId: null,
      sourceEventFactIds: [],
      notes: "Typed intake narrative without a linked source record.",
      lastSyncedAt: null,
      createdAt: "2026-09-28T00:00:00Z",
      updatedAt: "2026-09-28T00:00:00Z",
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="strategy"
        tenantName="Test Tenant"
        artifacts={[]}
        evidenceStates={[triggerEvidence]}
      />,
    );

    const needs = screen.getByTestId("source-shell-active-step-needs");
    expect(needs).toHaveTextContent("Now: Not loaded");
    expect(needs).not.toHaveTextContent("Now: Available");
  });

  it("labels RFP evidence owners and reviews parsed evidence", async () => {
    const rfpEvent: SourcingEventSummary = {
      ...makeEvent(),
      currentStageKey: "rfp",
      currentStageLabel: "RFP",
    } as SourcingEventSummary;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        review: {
          actionLabel:
            "Reviewed parsed evidence: Requirements and service levels",
          reviewer: {
            displayName: "Evidence Reviewer",
            email: "reviewer@example.test",
            role: "maestro",
          },
          targetState: "Available",
          disclaimer:
            "Confirms parsed evidence availability only; it is not content approval.",
        },
      }),
    });
    const previousFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      render(
        <SourceAnalyticsCanvas
          event={rfpEvent}
          viewStage="rfp"
          tenantName="Demo Client"
          artifacts={[
            {
              id: "art-requirements",
              artifactCode: "workshop_output",
              stageKey: "rfp",
              title: "source-requirement-intake.csv",
              status: "draft",
              parseStatus: "parsed",
            },
          ]}
          evidenceStates={[]}
          initialWorkspace="files"
        />,
      );

      const sourcingRulesRow = screen.getByTestId(
        "source-stage-evidence-checklist-row-EVID-SRC-RFP-SOURCING-RULES",
      );
      expect(sourcingRulesRow).toHaveTextContent(
        "Procurement / sourcing owner",
      );
      expect(sourcingRulesRow).toHaveTextContent("DOCX, PDF, XLSX, CSV");

      const securityRow = screen.getByTestId(
        "source-stage-evidence-checklist-row-EVID-SRC-RFP-SECURITY-PRIVACY",
      );
      expect(securityRow).toHaveTextContent("Risk / security owner");

      const requirementsRow = screen.getByTestId(
        "source-stage-evidence-checklist-row-EVID-SRC-RFP-REQUIREMENTS",
      );
      fireEvent.click(
        within(requirementsRow).getByRole("button", {
          name: "Review parsed evidence",
        }),
      );
      const rationale = (await within(requirementsRow).findByLabelText(
        "Review rationale for Requirements and service levels",
      )) as HTMLTextAreaElement;
      expect(rationale.value).toContain("source-requirement-intake.csv");
      expect(requirementsRow).toHaveTextContent(
        "Reviewer: Evidence Reviewer (reviewer@example.test)",
      );
      expect(requirementsRow).toHaveTextContent("not content approval");
      fireEvent.click(
        within(requirementsRow).getByRole("button", {
          name: "Record evidence review",
        }),
      );

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/v1/source/evt-1/evidence/EVID-SRC-RFP-REQUIREMENTS/availability-review",
          expect.objectContaining({ method: "POST" }),
        ),
      );
    } finally {
      global.fetch = previousFetch;
    }
  });

  it("binds an operational inventory review to the previewed artifact and hash", async () => {
    const scopeEvent: SourcingEventSummary = {
      ...makeEvent(),
      currentStageKey: "scope",
      currentStageLabel: "Scope",
    } as SourcingEventSummary;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        review: {
          actionLabel: "Reviewed parsed evidence: Application and service inventory",
          reviewer: { displayName: "Evidence Reviewer", email: "reviewer@example.test", role: "maestro" },
          targetState: "Usable Evidence",
          disclaimer: "Confirms the operational inventory only.",
          sourceArtifactId: "artifact-1",
          sourceSha256: "a".repeat(64),
        },
      }),
    });
    const previousFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;
    try {
      render(<SourceAnalyticsCanvas
        event={scopeEvent}
        viewStage="scope"
        tenantName="Demo Client"
        artifacts={[{
          id: "artifact-1",
          artifactCode: "workshop_output",
          stageKey: "scope",
          title: "service_catalog_scope.csv",
          status: "draft",
          parseStatus: "parsed",
        }]}
        evidenceStates={[]}
        initialWorkspace="files"
      />);
      const row = screen.getByTestId(
        "source-stage-evidence-checklist-row-EVID-SRC-SCOPE-APP-INV",
      );
      fireEvent.click(within(row).getByRole("button", { name: "Review parsed evidence" }));
      await within(row).findByLabelText("Review rationale for Application and service inventory");
      fireEvent.click(within(row).getByRole("button", { name: "Record evidence review" }));
      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/source/evt-1/evidence/EVID-SRC-SCOPE-APP-INV/availability-review",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"sourceArtifactId":"artifact-1"'),
        }),
      ));
      expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1]?.body as string)).toEqual(
        expect.objectContaining({ sourceSha256: "a".repeat(64) }),
      );
    } finally {
      global.fetch = previousFetch;
    }
  });
});
