/**
 * @jest-environment jsdom
 */

// Functional test: the Responses stage's "Confirm vendor response coverage"
// step body must show real per-vendor lever-coverage data inline — reusing
// the same computed insight the Intelligence tab already shows, never a
// fabricated file/requirements table. Renders the REAL SourceAnalyticsCanvas
// with the REAL SAMPLE_RESPONSES_STAGE fixture (the exact shape production
// uses, including the real factTemplateCode) and a real live
// response_coverage insight, and asserts on the actual rendered vendor rows.

import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";

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
import { SAMPLE_RESPONSES_STAGE } from "../sample-view-model";
import { buildSourceVendorResponseCompleteness } from "@/lib/source/vendor-response-completeness";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { ResponseCoverageInsightView } from "../view-model";

function makeEvent(): SourcingEventSummary {
  return {
    id: "evt-1",
    code: "MERI-AMS-2026",
    name: "Healthcare Demo AMS",
    accountName: "Healthcare Demo",
    leadAgent: "Sentinel",
    archetype: "AMS",
    rigor: "standard",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "responses",
    currentStageLabel: "Responses",
    openAlerts: 0,
    owner: "K. Oshima",
    agingDays: 4,
    blocker: null,
    nextAction: "Confirm response coverage",
    isAtRisk: false,
    valueAtStakeUsd: 1_000_000,
    projectedValueUsd: 200_000,
    realizedValueUsd: 0,
    nextDecision: "Approve responses gate",
  } as SourcingEventSummary;
}

// Confirm the fixture actually carries the real factTemplateCode this
// component keys off — if it's ever renamed, this fails loudly here
// instead of the real test below silently asserting nothing meaningful.
describe("SourceAnalyticsCanvas — vendor response coverage (Responses step body)", () => {
  it("SAMPLE_RESPONSES_STAGE's task really uses factTemplateCode RESPONSE_COVERAGE_V1", () => {
    expect(SAMPLE_RESPONSES_STAGE.tasks[0]?.factTemplateCode).toBe(
      "RESPONSE_COVERAGE_V1",
    );
  });

  it("renders the requested Responses scaffold when no live stage view is available", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...makeEvent(),
          currentStageKey: "scope",
          currentStageLabel: "Scope",
        }}
        viewStage="responses"
        tenantName="Healthcare Demo"
      />,
    );

    expect(
      screen.getAllByText("Confirm vendor response coverage").length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Provide the volumetrics"),
    ).not.toBeInTheDocument();
  });

  it("renders the live Responses cockpit on the analytics event route", () => {
    const event = {
      ...makeEvent(),
      id: "skyh-response-event",
      code: "SKYH-APPLICATION-MANAGED-SERVICES-2026",
      name: "SkyHarbor Global Application Managed Services Sourcing Event",
      accountName: "SkyHarbor Global",
    };
    const vendorResponseReadiness = buildSourceVendorResponseCompleteness({
      event: {
        id: event.id,
        name: event.name,
        currentStageKey: "responses",
      },
    });
    const vendorResponseProfiles = buildVendorResponseMveProfiles(event);
    const vendorChallengeIntelligence = buildVendorChallengeIntelligence(
      vendorResponseProfiles,
    );
    const vendorBafoInstructionPack = buildVendorBafoInstructionPack(
      vendorChallengeIntelligence,
    );
    const vendorEvaluationDecisionView = buildVendorEvaluationDecisionView(
      vendorResponseProfiles,
      vendorChallengeIntelligence,
      vendorBafoInstructionPack,
    );

    render(
      <SourceAnalyticsCanvas
        event={event}
        viewStage="responses"
        tenantName="SkyHarbor Global"
        stageView={SAMPLE_RESPONSES_STAGE}
        vendorResponseReadiness={vendorResponseReadiness}
        vendorResponseProfiles={vendorResponseProfiles}
        vendorChallengeIntelligence={vendorChallengeIntelligence}
        vendorBafoInstructionPack={vendorBafoInstructionPack}
        vendorEvaluationDecisionView={vendorEvaluationDecisionView}
      />,
    );

    expect(screen.getByText("Responses package cockpit")).toBeInTheDocument();
    expect(screen.getByText("Proposal intelligence brief")).toBeInTheDocument();
    expect(
      screen.getByText("Can we move from Responses to Evaluation?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Negotiation leverage cockpit"),
    ).toBeInTheDocument();
  });

  it("renders real per-vendor coverage rows when the insight is genuinely live", () => {
    const liveInsight: ResponseCoverageInsightView = {
      kind: "response_coverage",
      provenance: "live",
      headline: "Test headline",
      rows: [],
      isModel: false,
      flipFact: "Vendor responses ingested per lever/clause.",
      vendors: [
        {
          vendorId: "Halcyon MS",
          addressed: 5,
          partial: 0,
          dodged: 0,
          notYetAnswered: 0,
          totalLevers: 5,
          addressedHighUsd: 500_000,
          exposedHighUsd: 0,
          byLever: [],
        },
        {
          vendorId: "Vantage Digital",
          addressed: 1,
          partial: 1,
          dodged: 1,
          notYetAnswered: 2,
          totalLevers: 5,
          addressedHighUsd: 100_000,
          exposedHighUsd: 300_000,
          byLever: [],
        },
        {
          vendorId: "Cormorant IT",
          addressed: 0,
          partial: 0,
          dodged: 0,
          notYetAnswered: 5,
          totalLevers: 5,
          addressedHighUsd: 0,
          exposedHighUsd: 500_000,
          byLever: [],
        },
      ],
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="responses"
        tenantName="Healthcare Demo"
        stageView={SAMPLE_RESPONSES_STAGE}
        stepInsight={liveInsight}
      />,
    );

    const halcyon = screen.getByTestId(
      "source-shell-vendor-coverage-Halcyon MS",
    );
    expect(
      within(halcyon).getByText("5 of 5 levers addressed"),
    ).toBeInTheDocument();
    expect(within(halcyon).getByText("Complete")).toBeInTheDocument();

    const vantage = screen.getByTestId(
      "source-shell-vendor-coverage-Vantage Digital",
    );
    expect(
      within(vantage).getByText("2 of 5 levers addressed"),
    ).toBeInTheDocument();
    expect(within(vantage).getByText("Partial")).toBeInTheDocument();

    const cormorant = screen.getByTestId(
      "source-shell-vendor-coverage-Cormorant IT",
    );
    expect(
      within(cormorant).getByText("0 of 5 levers addressed"),
    ).toBeInTheDocument();
    expect(within(cormorant).getByText("Awaiting")).toBeInTheDocument();
  });

  it("shows nothing extra when the insight is still the honest MODEL (no real vendor data yet)", () => {
    const modelInsight: ResponseCoverageInsightView = {
      kind: "response_coverage",
      provenance: "sample",
      headline: "Model headline",
      rows: [],
      isModel: true,
      flipFact: "Vendor responses ingested per lever/clause.",
    };

    render(
      <SourceAnalyticsCanvas
        event={makeEvent()}
        viewStage="responses"
        tenantName="Healthcare Demo"
        stageView={SAMPLE_RESPONSES_STAGE}
        stepInsight={modelInsight}
      />,
    );

    expect(screen.queryByText("Vendor coverage")).not.toBeInTheDocument();
  });
});
