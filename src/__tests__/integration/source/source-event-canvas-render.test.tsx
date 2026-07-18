/**
 * SSR smoke test for the universal sourcing canvas.
 *
 * Renders UniversalCanvasShell with synthesized fixtures (event + canvas
 * substrate rows + template bodies) and asserts the structure: ID strip,
 * step rail, splitter, chat lane (no truncation), workspace tabs, default
 * Document panel.
 *
 * Auth-gated route can't be visited in dev without real Clerk keys; this
 * test exercises the full render tree directly.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  SourceEventArtifactState,
  SourceEventEvidence,
  SourceEventGateCriterion,
} from "@/lib/source/canvas-substrate";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { SourcingEventSummary } from "@/lib/source/types";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import type { ActivityEntry } from "@/components/source/canvas/workspace-tabs/LogTab";
import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  type ContractOptimizationMveProfile,
} from "@/lib/source/contract-optimization";

// Shell uses next/navigation + Clerk hooks; mock so SSR doesn't blow up.
let mockUser: unknown = null;

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/source/events/evt-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ eventId: "evt-1" }),
  redirect: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: mockUser }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { UniversalCanvasShell } from "@/components/source/canvas/UniversalCanvasShell";

function makeEvent(
  overrides: Partial<SourcingEventSummary> = {},
): SourcingEventSummary {
  return {
    id: "evt-canvas-1",
    code: "SRC-APX-001",
    name: "AMS Outsourcing 2026",
    accountName: "Apex Retail Group",
    leadAgent: "Sentinel",
    archetype: "Managed Service",
    rigor: "strategic",
    status: "active",
    statusLabel: "Active",
    priority: "medium",
    currentStageKey: "scope",
    currentStageLabel: "Scope",
    openAlerts: 0,
    owner: "Nathan Kohl",
    agingDays: 4,
    blocker: null,
    nextAction: "Lock scope memo",
    isAtRisk: false,
    valueAtStakeUsd: 10_000_000,
    projectedValueUsd: 10_000_000,
    realizedValueUsd: 0,
    nextDecision: "Lock scope memo",
    ...overrides,
  };
}

function makeArtifactState(
  overrides: Partial<SourceEventArtifactState> = {},
): SourceEventArtifactState {
  return {
    id: "a1",
    sourceEventId: "evt-canvas-1",
    tenantKey: "apexretail",
    artifactCode: "d05_scope_memo",
    stage: "scope",
    family: "scope_document",
    tier: "stub",
    status: "not_started",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: "2026-05-07T20:00:00Z",
    updatedAt: "2026-05-07T20:00:00Z",
    ...overrides,
  };
}

function makeCriterion(
  overrides: Partial<SourceEventGateCriterion> = {},
): SourceEventGateCriterion {
  return {
    id: "c1",
    sourceEventId: "evt-canvas-1",
    tenantKey: "apexretail",
    criterionId: "GATE-SCOPE-01",
    fromStage: "scope",
    toStage: "rfp",
    state: "pending",
    reviewerUserId: null,
    reviewedAt: null,
    notes: null,
    evidenceArtifactIds: [],
    waiverApprovalId: null,
    createdAt: "2026-05-07T20:00:00Z",
    updatedAt: "2026-05-07T20:00:00Z",
    ...overrides,
  };
}

function makeEvidence(
  overrides: Partial<SourceEventEvidence> = {},
): SourceEventEvidence {
  return {
    id: "e1",
    sourceEventId: "evt-canvas-1",
    tenantKey: "apexretail",
    requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
    stage: "scope",
    currentState: "Loaded",
    sourceArtifactId: null,
    notes: "ServiceNow sync 14d stale",
    lastSyncedAt: "2026-04-23T00:00:00Z",
    createdAt: "2026-05-07T20:00:00Z",
    updatedAt: "2026-05-07T20:00:00Z",
    ...overrides,
  };
}

function makeRegistryArtifact(
  overrides: Partial<SourceArtifactRegistryRecord> = {},
): SourceArtifactRegistryRecord {
  return {
    id: "registry-doc-1",
    tenantKey: "apex-retail",
    sourceEventId: "evt-canvas-1",
    sourceEventRowId: "evt-canvas-1",
    stageKey: "rfp",
    artifactFamily: "rfp",
    artifactKind: "agent_generated_packet",
    sourceOrigin: "generated",
    sourceFormat: "markdown",
    originalName: "RFP_RFI_Package_generated_packet.md",
    blobUri:
      "apex-retail/evt-canvas-1/registry-doc-1/RFP_RFI_Package_generated_packet.md",
    uploaderUserId: "system",
    mimeType: "text/markdown",
    sizeBytes: 7453,
    sha256: "hash",
    parseStatus: "pending",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "pending",
    dataClassification: "Confidential",
    evidenceState: "unparsed",
    approvalState: "draft",
    version: 1,
    supersedesArtifactVersionId: null,
    createdBy: "system",
    validatedBy: null,
    createdAt: "2026-05-07T20:00:00Z",
    updatedAt: "2026-05-07T20:00:00Z",
    deletedAt: null,
    ...overrides,
  };
}

function makeVendorResponseReadiness(): SourceVendorResponseCompleteness {
  return {
    eventId: "evt-canvas-1",
    eventName: "AMS Outsourcing 2026",
    generatedAt: "2026-06-05T06:15:00.000Z",
    stage: "responses",
    summary: {
      totalVendors: 2,
      complete: 1,
      partiallyComplete: 1,
      incomplete: 0,
      notComparable: 0,
      blocked: 0,
    },
    comparabilityReadiness: "partially_complete",
    blockers: ["Atlas SI: transition plan status is incomplete."],
    recommendedNextAction:
      "Collect missing sections, normalize pricing units, and resolve evidence quality before comparison.",
    records: [
      {
        vendorId: "northstar",
        vendorName: "Northstar",
        responseStatus: "submitted",
        receivedAt: "2026-06-01",
        requiredSections: ["Scope confirmation", "Pricing template"],
        submittedSections: ["Scope confirmation", "Pricing template"],
        missingSections: [],
        assumptions: ["3-year term"],
        exclusions: ["ERP implementation"],
        pricingTemplateStatus: "complete",
        transitionPlanStatus: "complete",
        securityResponseStatus: "complete",
        automationRoadmapStatus: "complete",
        evidenceStatus: "Usable Evidence",
        comparabilityStatus: "comparable",
        blockers: [],
        completenessStatus: "complete",
        rationale: ["Response is complete."],
        recommendedNextAction: "Compare with peers.",
        nexusGuidance: "Compare with peers.",
        sentinelEvidenceNotes: [],
        stewardGateNotes: ["Vendor is not blocked."],
        atlasExecutiveImplication: "Response quality is sufficient.",
      },
      {
        vendorId: "atlas",
        vendorName: "Atlas SI",
        responseStatus: "submitted",
        receivedAt: "2026-06-02",
        requiredSections: ["Scope confirmation", "Pricing template"],
        submittedSections: ["Scope confirmation", "Pricing template"],
        missingSections: ["Transition plan"],
        assumptions: ["Named retained team"],
        exclusions: ["Travel pass-through"],
        pricingTemplateStatus: "complete",
        transitionPlanStatus: "incomplete",
        securityResponseStatus: "complete",
        automationRoadmapStatus: "complete",
        evidenceStatus: "Available",
        comparabilityStatus: "partially_comparable",
        blockers: ["Atlas SI: transition plan status is incomplete."],
        completenessStatus: "partially_complete",
        rationale: ["Transition plan needs clarification."],
        recommendedNextAction:
          "Atlas SI: transition plan status is incomplete.",
        nexusGuidance: "Complete required sections before comparison.",
        sentinelEvidenceNotes: [],
        stewardGateNotes: ["Do not advance until complete."],
        atlasExecutiveImplication: "Comparability confidence is reduced.",
      },
    ],
  };
}

function render(
  options: {
    artifactStates?: SourceEventArtifactState[];
    gateCriterionStates?: SourceEventGateCriterion[];
    evidenceStates?: SourceEventEvidence[];
    registryArtifacts?: SourceArtifactRegistryRecord[];
    templateByCode?: Record<string, string | null>;
    viewStage?: SourceEventArtifactState["stage"];
    vendorResponseReadiness?: SourceVendorResponseCompleteness;
    contractOptimizationProfile?: ContractOptimizationMveProfile | null;
    activityEntries?: ActivityEntry[];
    event?: Partial<SourcingEventSummary>;
    workspaceExplorerEnabled?: boolean;
    simpleFrontEnabled?: boolean;
  } = {},
): string {
  return renderToStaticMarkup(
    createElement(UniversalCanvasShell, {
      event: makeEvent(options.event),
      viewStage: options.viewStage ?? "scope",
      artifactStates: options.artifactStates ?? [makeArtifactState()],
      gateCriterionStates: options.gateCriterionStates ?? [makeCriterion()],
      evidenceStates: options.evidenceStates ?? [makeEvidence()],
      registryArtifacts: options.registryArtifacts ?? [],
      templateByCode: options.templateByCode ?? {
        d05_scope_memo: "# Scope Memo\n\n§1 In scope ...",
      },
      activityEntries: options.activityEntries ?? [],
      tenantName: "Apex Retail Group",
      vendorResponseReadiness: options.vendorResponseReadiness,
      contractOptimizationProfile: options.contractOptimizationProfile,
      workspaceExplorerEnabled: options.workspaceExplorerEnabled,
      simpleFrontEnabled: options.simpleFrontEnabled,
    }),
  );
}

describe("UniversalCanvasShell · SSR render", () => {
  beforeEach(() => {
    mockUser = null;
  });

  it("renders id strip with breadcrumb + title + status", () => {
    const html = render();
    expect(html).toContain("source-canvas-id-strip");
    expect(html).toContain("source-canvas-next-move-card");
    expect(html).toContain("Next move");
    expect(html).toContain("Build the application inventory");
    expect(html).toContain("Source");
    expect(html).toContain("SRC-APX-001");
    expect(html).toContain("AMS Outsourcing 2026");
    expect(html).toContain("Active");
    expect(html).toContain("APEX"); // tenant abbreviation
  });

  it("renders 11-step rail with all canonical stages", () => {
    const html = render();
    expect(html).toContain("source-canvas-step-rail");
    for (const stage of [
      "strategy",
      "scope",
      "rfp",
      "responses",
      "evaluation",
      "pricing",
      "bafo",
      "executive_decision",
      "selection",
      "transition",
      "value",
    ]) {
      expect(html).toContain(`source-canvas-step-${stage}`);
    }
  });

  it("renders late-stage rail links with a full clickable hit area", () => {
    const html = render();
    for (const stage of [
      "executive_decision",
      "selection",
      "transition",
      "value",
    ]) {
      const anchor = html.match(
        new RegExp(`<a[^>]+data-testid="source-canvas-step-${stage}"[^>]*>`),
      )?.[0];
      expect(anchor).toBeTruthy();
      expect(anchor).toContain("width:104px");
      expect(anchor).toContain("min-height:62px");
      expect(anchor).toContain("translateX(-50%)");
    }
  });

  it("collapses Sentinel by default on the Executive Decision stage", () => {
    const html = render({ viewStage: "executive_decision" });
    expect(html).toContain("agent-dock-collapsed-chip");
    expect(html).toContain("aVa");
    expect(html).toContain("Click to expand · 3 stage-specific suggestions");
    expect(html).toContain("source-canvas-next-move-card");
  });

  it("renders the Executive Decision fallback until the decision brief is authored", () => {
    const html = render({
      viewStage: "executive_decision",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d24_decision_brief",
          stage: "executive_decision",
          family: "decision_brief",
          body: null,
        }),
      ],
      gateCriterionStates: [
        makeCriterion({
          criterionId: "GATE-DEC-01",
          fromStage: "executive_decision",
          toStage: "selection",
        }),
      ],
      evidenceStates: [
        makeEvidence({
          requirementId: "EVID-SRC-DEC-FINALIST-PRICING",
          stage: "executive_decision",
        }),
      ],
    });

    expect(html).toContain("source-executive-decision-stage-view");
    expect(html).toContain("source-executive-decision-next-move");
    expect(html).toContain("Draft the decision brief");
    expect(html).toContain("stays hidden until the decision brief has a");
    expect(html).not.toContain("source-executive-summary-header");
  });

  it("renders the authored Executive Decision page-1 with dark 1+3 summary, approval hierarchy, dissent, and d24 exports", () => {
    const html = render({
      viewStage: "executive_decision",
      event: {
        owner: "Carlos Rivera",
        valueAtStakeUsd: 35_000_000,
        currentStageKey: "executive_decision",
      },
      artifactStates: [
        makeArtifactState({
          artifactCode: "d24_decision_brief",
          stage: "executive_decision",
          family: "decision_brief",
          status: "approved",
          body: "# Executive Decision Brief\n\nRecommend the preferred vendor.",
        }),
        makeArtifactState({
          id: "decision-risk",
          artifactCode: "d25_risk_attestation",
          stage: "executive_decision",
          family: "decision_brief",
          status: "needs_review",
        }),
      ],
      gateCriterionStates: [
        makeCriterion({
          criterionId: "GATE-DEC-01",
          fromStage: "executive_decision",
          toStage: "selection",
          state: "pending",
        }),
        makeCriterion({
          id: "decision-gate-2",
          criterionId: "GATE-DEC-02",
          fromStage: "executive_decision",
          toStage: "selection",
          state: "met",
        }),
      ],
      evidenceStates: [
        makeEvidence({
          requirementId: "EVID-SRC-DEC-FINALIST-PRICING",
          stage: "executive_decision",
          currentState: "Usable Evidence",
        }),
        makeEvidence({
          id: "decision-e2",
          requirementId: "EVID-SRC-DEC-RISK-REGISTER",
          stage: "executive_decision",
          currentState: "Parsed",
        }),
      ],
      activityEntries: [
        {
          id: "act-dissent",
          at: "2026-06-05T06:00:00Z",
          actor: "S. Okafor",
          body: "Dissent: transition risk is under-weighted for the preferred vendor.",
        },
      ],
      templateByCode: {
        d24_decision_brief:
          "# Executive Decision Brief\n\nRecommend the preferred vendor.",
        d25_risk_attestation: "# Risk Attestation",
      },
    });

    expect(html).toContain("source-executive-decision-stage-view");
    expect(html).toContain("source-executive-summary-header");
    expect(html).toContain("background:#1f2937");
    expect(html).toContain("Recommend");
    expect(html).toContain("Savings");
    expect(html).toContain("Trade-off");
    expect(html).toContain("Dissent");
    expect(html).toContain("Open dissent panel");
    expect(html).toContain("#dissent");
    expect(html).toContain("Approve recommendation");
    expect(html).toContain("Send to co-approver");
    expect(html).toContain("Other decisions");
    expect(html).toContain("source-executive-decision-missing-data");
    expect(html).toContain("source-executive-decision-dissent");
    expect(html).toContain("source-executive-decision-approval-record");
    expect(html).toContain("source-executive-decision-document-workspace");
    expect(html).toContain(
      "source-canvas-document-body-download-docx-d24_decision_brief",
    );
    expect(html).toContain(
      "source-canvas-document-body-download-pdf-d24_decision_brief",
    );
    expect(html).toContain(
      "source-canvas-document-body-view-html-d24_decision_brief",
    );
  });

  it("uses risk count instead of empty dissent copy when no dissent is logged", () => {
    const html = render({
      viewStage: "executive_decision",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d24_decision_brief",
          stage: "executive_decision",
          family: "decision_brief",
          body: "# Executive Decision Brief\n\nRecommendation authored.",
        }),
      ],
      gateCriterionStates: [
        makeCriterion({
          criterionId: "GATE-DEC-01",
          fromStage: "executive_decision",
          toStage: "selection",
          state: "pending",
        }),
      ],
    });

    expect(html).toContain("source-executive-summary-header");
    expect(html).toContain("Risks");
    expect(html).toContain("open");
    expect(html).toContain("No dissent recorded");
  });

  it("renders the AgentDock side-rail with stage-appropriate agent and 3 suggestions", () => {
    const html = render();
    // AgentDock panel replaces the legacy EventChatLane testid.
    expect(html).toContain("agent-dock-panel");
    // Scope stage (1-9) → Sentinel per canvasDockAgentForStage.
    expect(html).toContain("aVa");
    // Three-choice catalog now renders as AgentDock suggested actions.
    expect(html).toContain("agent-dock-suggestion-c0");
    expect(html).toContain("agent-dock-suggestion-c1");
    expect(html).toContain("agent-dock-suggestion-c2");
  });

  it("renders the Scope stage with explicit CMDB pull, inventory, and dependency list", () => {
    const html = render({ viewStage: "scope" });
    expect(html).toContain("source-scope-stage-view");
    expect(html).toContain("source-scope-inventory-table");
    expect(html).toContain("Pull from CMDB");
    expect(html).toContain("Source never silently populates inventory");
    expect(html).toContain("source-scope-dependency-list");
    expect(html).toContain("Dependency list");
    expect(html).toContain("Retained organization");
    expect(html).toContain("source-scope-document-workspace");
  });

  it("renders the RFP stage with rubric, shortlist, and governed release state", () => {
    const html = render({
      viewStage: "rfp",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d09_rfp_pack",
          stage: "rfp",
          family: "rfp",
        }),
      ],
      templateByCode: {
        d09_rfp_pack: "# RFP Package\n\nDraft sections ...",
      },
    });

    expect(html).toContain("source-rfp-stage-view");
    expect(html).toContain("source-rfp-eval-rubric");
    expect(html).toContain("100% total");
    expect(html).toContain("source-rfp-vendor-shortlist");
    expect(html).toContain("Q&amp;A protocol");
    expect(html).toContain("Release RFP unavailable");
    expect(html).toContain("does not send vendor communications");
    expect(html).toContain("source-rfp-document-workspace");
  });

  it("renders the Responses stage with completeness matrix, Q&A symmetry, and decision point", () => {
    const html = render({
      viewStage: "responses",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d13_vendor_responses",
          stage: "responses",
          family: "proposal",
        }),
      ],
      templateByCode: {
        d13_vendor_responses:
          "# Vendor Response Pack\n\nReceived responses ...",
      },
      vendorResponseReadiness: makeVendorResponseReadiness(),
    });

    expect(html).toContain("source-responses-stage-view");
    expect(html).toContain("Review vendor response completeness");
    expect(html).toContain("source-responses-completeness-matrix");
    expect(html).toContain("Northstar");
    expect(html).toContain("Atlas SI");
    expect(html).toContain("source-responses-qna-symmetry-log");
    expect(html).toContain("Questions go to everyone");
    expect(html).toContain("source-responses-disqualification-card");
    expect(html).toContain("procurement system unless explicitly configured");
    expect(html).toContain("source-responses-document-workspace");
  });

  it("preserves SkyHarbor Air in the signed-in contract optimization chrome", () => {
    mockUser = {
      firstName: "Ava",
      lastName: "Agent",
      fullName: "Ava Agent",
      publicMetadata: { role: "admin" },
      primaryEmailAddress: { emailAddress: "agent-skyharbor@abarva.example.com" },
      emailAddresses: [{ emailAddress: "agent-skyharbor@abarva.example.com" }],
    };
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput({
        sourceEventId: "evt-canvas-1",
        tenantKey: "skyharbor",
      }),
    );
    const html = render({
      viewStage: "responses",
      simpleFrontEnabled: true,
      contractOptimizationProfile: profile,
      event: {
        code: "SKYH-AMS-CONTRACT-OPT-2026",
        name: "SkyHarbor AMS Contract Optimization and Renewal Decision",
        accountName: "Airline Demo",
        currentStageKey: "responses",
      },
    });

    expect(html).toContain("SkyHarbor Air");
    expect(html).toContain("SkyHarbor Air AMS Contract Optimization");
    expect(html).toContain("SKYH-AMS-CONTRACT-OPT-2026");
    expect(html).not.toContain("SkyHarbor Air AMS Outsourcing RFP");
    expect(html).not.toContain("SKYH-AMS-RFP-2026");
    expect(html).not.toContain("Ava Agent");
    expect(html).not.toContain("Airline Demo");
  });

  it("renders the Evaluation stage with scorecard, dissent, and human-named BATNA", () => {
    const html = render({
      viewStage: "evaluation",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d16_scorecard",
          stage: "evaluation",
          family: "scorecard",
        }),
      ],
      templateByCode: {
        d16_scorecard: "# Evaluation Scorecard\n\nWeighted scoring ...",
      },
    });

    expect(html).toContain("source-evaluation-stage-view");
    expect(html).toContain("Complete scoring before pricing");
    expect(html).toContain("source-evaluation-weighted-scorecard");
    expect(html).toContain("Reviewer rationale");
    expect(html).toContain("source-evaluation-dissent-panel");
    expect(html).toContain("Attachment allowed");
    expect(html).toContain("source-evaluation-batna-panel");
    expect(html).toContain("Named by sourcing lead");
    expect(html).toContain("does not pick a winner silently");
    expect(html).toContain("source-evaluation-document-workspace");
  });

  it("renders the Pricing stage with TCO bridge, stacked bars, sensitivity cards, traps, and d19 downloads", () => {
    const html = render({
      viewStage: "pricing",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d19_pricing_workbook",
          stage: "pricing",
          family: "pricing_workbook",
          body: "# Pricing Workbook\n\nUploaded pricing is normalized here.",
        }),
      ],
      templateByCode: {
        d19_pricing_workbook: "# Pricing Workbook\n\nTemplate body ...",
      },
    });

    expect(html).toContain("source-pricing-stage-view");
    expect(html).toContain("Normalize current pricing");
    expect(html).toContain("source-pricing-tco-bridge");
    expect(html).toContain("3-year TCO");
    expect(html).toContain("source-pricing-tco-iceberg");
    expect(html).toContain("Visible vs hidden cost");
    expect(html).toContain("source-pricing-sensitivity-ribbon");
    expect(html).toContain("Volume +20%");
    expect(html).toContain("Scope +10%");
    expect(html).toContain("FX +5%");
    expect(html).toContain("source-pricing-trap-log");
    expect(html).toContain("Commercial traps feed BAFO");
    expect(html).toContain("source-pricing-upload-proof");
    expect(html).toContain("bound to real submitted rows");
    expect(html).toContain("source-pricing-document-workspace");
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-d19_pricing_workbook",
    );
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-comparison-d19_pricing_workbook",
    );
  });

  it("renders the BAFO stage with per-vendor lever envelope, concession ledger, and governed d22 downloads", () => {
    const html = render({
      viewStage: "bafo",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d22_bafo_question_pack",
          stage: "bafo",
          family: "bafo",
          body: "# BAFO Question Pack\n\nHuman-reviewed questions.",
        }),
      ],
      templateByCode: {
        d22_bafo_question_pack: "# BAFO Question Pack\n\nTemplate body ...",
      },
    });

    expect(html).toContain("source-bafo-stage-view");
    expect(html).toContain("Prepare the BAFO question pack");
    expect(html).toContain("procurement owns external distribution");
    expect(html).toContain("source-bafo-lever-envelope");
    expect(html).toContain("Per-vendor negotiation cards");
    expect(html).toContain("Walk-away");
    expect(html).toContain("source-bafo-concession-ledger");
    expect(html).toContain("Every trade is attributable");
    expect(html).toContain("source-bafo-question-pack-governance");
    expect(html).toContain("Anti-pattern flags come from the trap log");
    expect(html).toContain("source-bafo-document-workspace");
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-d22_bafo_question_pack",
    );
    expect(html).toContain(
      "source-canvas-document-body-download-docx-d22_bafo_question_pack",
    );
    expect(html).toContain(
      "source-canvas-document-body-download-pdf-d22_bafo_question_pack",
    );
  });

  it("renders the sticky AgentDock composer", () => {
    const html = render();
    expect(html).toContain("agent-dock-input");
    expect(html).toContain("Ask aVa…");
    // Paperclip upload button is rendered.
    expect(html).toContain("agent-dock-attach");
  });

  it("uses Atlas as the lead agent on transition (stage 10) and value (stage 11)", () => {
    const transitionHtml = render({ viewStage: "transition" });
    expect(transitionHtml).toContain("Ask aVa…");
    expect(transitionHtml).toContain("agent-dock-panel");

    const valueHtml = render({ viewStage: "value" });
    expect(valueHtml).toContain("Ask aVa…");
    expect(valueHtml).toContain("agent-dock-panel");
  });

  it("renders Stage 10 Transition with KT milestones, go-live readiness, risks, and human cutover approval", () => {
    const html = render({ viewStage: "transition" });

    expect(html).toContain("source-transition-stage-view");
    expect(html).toContain("Prove go-live readiness before cutover");
    expect(html).toContain("source-transition-kt-plan");
    expect(html).toContain("8-week onboarding control window is active");
    expect(html).toContain("Reverse Shadow");
    expect(html).toContain("source-transition-readiness-scorecard");
    expect(html).toContain("CIO + CDO + Vendor PM");
    expect(html).toContain("source-transition-risk-register");
    expect(html).toContain("Incumbent departure gap risk");
    expect(html).toContain("APX-CDP-2026");
    expect(html).toContain("Q3 2026 data-migration freeze window");
    expect(html).toContain("source-transition-go-no-go");
    expect(html).toContain("source-transition-governance");
    expect(html).toContain("people approve cutover");
    expect(html).toContain("source-transition-document-workspace");
  });

  it("renders workspace with all four tabs", () => {
    const html = render();
    expect(html).toContain("source-canvas-workspace");
    expect(html).toContain("source-canvas-tab-document");
    expect(html).toContain("source-canvas-tab-gate");
    expect(html).toContain("source-canvas-tab-evidence");
    expect(html).toContain("source-canvas-tab-log");
    expect(html).not.toContain("source-workspace-explorer-chips");
  });

  it("declutters the canvas behind the Workspace Explorer flag", () => {
    const html = render({ workspaceExplorerEnabled: true });
    expect(html).toContain('data-workspace-explorer="source"');
    expect(html).toContain("source-workspace-explorer-chips");
    expect(html).toContain("source-workspace-chip");
    expect(html).toContain("source-generate-chip");
    expect(html).toContain("source-upload-chip");
    expect(html).toContain('data-active-tab="workspace-explorer"');
    expect(html).not.toContain("source-canvas-tab-document");
    expect(html).not.toContain("source-canvas-tab-evidence");
    // The Next-move card stays the calm focal point …
    expect(html).toContain("Next move");
    // … and the full gate machinery (blockers, mark-met, promote) is collapsed
    // behind a toggle, not expanded inline, by default.
    expect(html).toContain("source-canvas-gate-toggle");
    expect(html).toContain("approve the gate");
    expect(html).not.toContain("source-canvas-gate-blockers");
    expect(html).toContain("lives in the Workspace");
  });

  it("renders the simple Start here front when source_simple_front is enabled", () => {
    const html = render({
      simpleFrontEnabled: true,
      evidenceStates: [
        makeEvidence({
          requirementId: "EVID-SRC-SCOPE-APP-INV",
          currentState: "Not Requested",
        }),
        makeEvidence({
          id: "e2",
          requirementId: "EVID-SRC-SCOPE-ORG",
          currentState: "Not Requested",
        }),
        makeEvidence({
          id: "e3",
          requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
          currentState: "Not Requested",
        }),
        makeEvidence({
          id: "e4",
          requirementId: "EVID-SRC-SCOPE-FY-CONTRACT",
          currentState: "Not Requested",
        }),
      ],
    });

    expect(html).toContain("source-simple-front");
    expect(html).toContain("You&#x27;re on Scope");
    expect(html).toContain("Application inventory");
    expect(html).toContain("Org chart");
    expect(html).toContain("L2/L3 ticket history");
    expect(html).toContain("What else would help?");
    // Approve = write + advance in one decision (Moves parity): the primary
    // action names the deliverable it will write, then shows the next step.
    expect(html).toContain("Approve &amp; write Scope Memo with Boundaries");
    expect(html).toContain("Then: Issue the RFP");
    expect(html).not.toContain("source-canvas-tab-document");
  });

  it("renders the simple Start here front for empty substrate without trusting registry metadata", () => {
    const html = render({
      simpleFrontEnabled: true,
      artifactStates: [],
      gateCriterionStates: [],
      evidenceStates: [],
      registryArtifacts: [
        {
          ...makeRegistryArtifact({
            sourceOrigin: "generated",
            artifactKind: "d05_scope_memo",
          }),
          originalName: null,
          createdAt: null,
        } as unknown as SourceArtifactRegistryRecord,
      ],
    });

    expect(html).toContain("source-simple-front");
    expect(html).toContain("You&#x27;re on Scope");
    expect(html).toContain("Application inventory");
    expect(html).toContain("Approve &amp; write Scope Memo with Boundaries");
    expect(html).not.toContain("source-simple-front-fallback");
  });

  it("document tab is active by default and hides starter templates until authored", () => {
    const html = render();
    expect(html).toContain('data-active-tab="document"');
    expect(html).toContain("source-canvas-document-tab");
    expect(html).toContain("Attach a file when it supports the next decision");
    expect(html).toContain("source-canvas-artifact-d05_scope_memo");
    expect(html).toContain("Scope Memo with Boundaries"); // canonical name
    expect(html).toContain("Awaiting draft");
    expect(html).toContain("Required to advance");
    expect(html).toContain("Draft needed");
    expect(html).toContain("No client-authored body yet");
    expect(html).toContain("starter content is kept out of the main workspace");
    expect(html).not.toContain("No DB-backed documents yet");
    expect(html).not.toContain("source_artifacts");
    expect(html).not.toContain("Awaiting authoring");
    expect(html).not.toContain("Download xlsx template");
    expect(html).not.toContain("§1 In scope");
  });

  it("renders the Strategy refit with humanized outputs and no empty export controls", () => {
    const html = render({
      viewStage: "strategy",
      artifactStates: [
        makeArtifactState({
          id: "strategy-a1",
          artifactCode: "d01_strategy_memo",
          stage: "strategy",
          family: "sourcing_strategy",
          requirementLevel: "required",
          gateDefining: true,
          body: null,
        }),
        makeArtifactState({
          id: "strategy-a2",
          artifactCode: "d02_value_target",
          stage: "strategy",
          family: "sourcing_strategy",
          requirementLevel: "required",
          gateDefining: true,
          body: null,
        }),
        makeArtifactState({
          id: "strategy-a3",
          artifactCode: "d03_archetype_decision",
          stage: "strategy",
          family: "sourcing_strategy",
          requirementLevel: "optional",
          gateDefining: true,
          body: null,
        }),
      ],
      gateCriterionStates: [
        makeCriterion({
          id: "strategy-c1",
          criterionId: "GATE-STRATEGY-01",
          fromStage: "strategy",
          toStage: "scope",
        }),
        makeCriterion({
          id: "strategy-c2",
          criterionId: "GATE-STRATEGY-02",
          fromStage: "strategy",
          toStage: "scope",
        }),
        makeCriterion({
          id: "strategy-c3",
          criterionId: "GATE-STRATEGY-03",
          fromStage: "strategy",
          toStage: "scope",
        }),
      ],
      evidenceStates: [],
      templateByCode: {
        d01_strategy_memo: "# Sourcing Strategy Memo\n\nTemplate body.",
        d02_value_target: "# Value Target Brief\n\nTemplate body.",
        d03_archetype_decision: "# Archetype Decision Record\n\nTemplate body.",
      },
    });

    expect(html).toContain("source-strategy-stage-view");
    expect(html).toContain("What this stage produces");
    expect(html).toContain("Sourcing Strategy Memo");
    expect(html).toContain("Value Target Brief");
    expect(html).toContain("Archetype Decision Record");
    expect(html).toContain("Why we are sourcing now");
    expect(html).toContain("The savings and outcome envelope");
    expect(html).toContain("Draft your Sourcing Strategy Memo");
    expect(html).toContain("Sponsor sign-off");
    expect(html).toContain("Value target set");
    expect(html).toContain("Archetype confirmed");
    expect(html).toContain("source-strategy-export-empty");
    expect(html).toContain("Nothing to export yet");
    expect(html).not.toContain(
      "source-canvas-document-body-download-docx-d01_strategy_memo",
    );
    expect(html).not.toContain(
      "source-canvas-document-body-download-pdf-d01_strategy_memo",
    );
    expect(html).not.toContain("Template badge");
    expect(html).not.toContain("No DB-backed documents yet");
    expect(html).not.toContain("Awaiting authoring");
  });

  it("renders persisted event documents with browse links", () => {
    const html = render({
      registryArtifacts: [makeRegistryArtifact()],
    });
    expect(html).toContain("1 document available");
    expect(html).not.toContain("DB-backed");
    expect(html).not.toContain("source_artifacts");
    expect(html).toContain("RFP_RFI_Package_generated_packet.md");
    expect(html).toContain("RFP · parse pending · approval draft");
    expect(html).toContain("source-canvas-registry-doc-registry-doc-1");
    expect(html).toContain(
      "/source/events/evt-canvas-1/artifacts/registry-doc-1",
    );
  });

  it("renders splitter handle as a separator with role + aria", () => {
    const html = render();
    expect(html).toContain("source-canvas-splitter");
    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
  });

  it("context bundle reflects artifact + criterion + evidence counts", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: "d04_app_inv",
          tier: "rich",
          status: "approved",
        }),
        makeArtifactState({ artifactCode: "d05_scope_memo" }),
      ],
      gateCriterionStates: [
        makeCriterion({ criterionId: "GATE-SCOPE-01", state: "met" }),
        makeCriterion({ criterionId: "GATE-SCOPE-02", state: "pending" }),
      ],
      evidenceStates: [
        makeEvidence({
          requirementId: "EVID-SRC-SCOPE-APP-INV",
          currentState: "Usable Evidence",
        }),
        makeEvidence({
          requirementId: "EVID-SRC-SCOPE-TICKET-HISTORY",
          currentState: "Loaded",
        }),
      ],
    });
    // The counts live in the workspace tab badges.
    expect(html).toContain("source-canvas-context-strip");
    expect(html).toContain("source-canvas-tab-document");
    expect(html).toContain(">2</span>");
    expect(html).toContain("Gates 1 / 2");
    expect(html).toContain("source-canvas-tab-evidence");
    expect(html).toContain(">1 / 2</span>");
    expect(html).toContain("Requirement-satisfied 2 / 8");
  });

  // ── B4: suggested chat prompts populate the composer ──────────────────────
  it("renders the AgentDock empty-thread hint and suggested questions label", () => {
    const html = render();
    // Scope stage (1-9) renders the Source-branded Sentinel lane.
    expect(html).toContain("Ask aVa anything.");
    // The dock surfaces the agent role under the name as the empty-state
    // subtitle (matches the AGENT_DOCK_ROLE_COPY entry for Sentinel).
    expect(html).toContain(
      "Drafts artifacts, surfaces evidence, flags gaps before they cost you.",
    );
    // Suggestions block label reflects the populate-not-submit semantics.
    expect(html).toContain("Suggested questions");
    expect(html).not.toContain("Three choices for");
  });

  // ── Slice 2 · xlsx download anchor ────────────────────────────────────────
  it("renders workbook template downloads before authored body for structured intake", () => {
    const html = render({
      viewStage: "pricing",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d19_pricing_workbook",
          stage: "pricing",
        }),
      ],
    });
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-d19_pricing_workbook",
    );
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-comparison-d19_pricing_workbook",
    );
    expect(html).toContain("Download workbook");
    expect(html).toContain(
      "Workbook templates stay available for governed intake.",
    );
  });

  it("renders workbook download anchor on authored d19 pricing workbook", () => {
    const html = render({
      viewStage: "pricing",
      artifactStates: [
        makeArtifactState({
          artifactCode: "d19_pricing_workbook",
          stage: "pricing",
          body: "# Pricing workbook\n\nReady to export.",
        }),
      ],
    });
    expect(html).toContain(
      "source-canvas-document-body-download-xlsx-d19_pricing_workbook",
    );
    expect(html).toContain("Download workbook");
    expect(html).not.toContain("Download xlsx template");
    // Anchor links to the GET endpoint with the event UUID + code.
    expect(html).toMatch(
      /href="[^"]*\/api\/v1\/source\/[^/]+\/artifacts\/d19_pricing_workbook\/render\?format=xlsx"/,
    );
  });

  it("does NOT render Download xlsx anchor on artifacts without an xlsx renderer", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: "d05_scope_memo", stage: "scope" }),
      ],
    });
    expect(html).not.toContain("source-canvas-document-body-download-xlsx-");
  });

  // ── Slice 1 · Generate with Sentinel ──────────────────────────────────────
  it("renders Generate with Sentinel button on a generatable artifact (d01)", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: "d01_strategy_memo", body: null }),
      ],
    });
    // d01 / d05 / d09 are wired in the prompt registry; UniversalCanvasShell
    // exposes them via generatableCodes.
    expect(html).toContain(
      "source-canvas-document-body-generate-d01_strategy_memo",
    );
    expect(html).toContain("Generate with aVa");
  });

  it("button label flips to Regenerate once a body is authored (or generated)", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: "d01_strategy_memo",
          body: "# Authored content",
        }),
      ],
    });
    expect(html).toContain("Regenerate with aVa");
  });

  it("does NOT render Generate button on artifacts not in the prompt registry", () => {
    const html = render({
      artifactStates: [
        // d05 is not the artifact we set up here; the active will be d05_scope_memo
        // override -> fixture default code is overridden via the makeArtifactState
        // shape. Use a code that's NOT in the registry.
        makeArtifactState({ artifactCode: "d99_not_registered", body: null }),
      ],
    });
    // Unknown artifacts should stay manual until the prompt registry covers them.
    expect(html).not.toContain(
      "source-canvas-document-body-generate-d99_not_registered",
    );
  });

  // ── Inline body editor (per-event content) ────────────────────────────────
  it("renders the Edit / Author body button on the active artifact", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: "d05_scope_memo", body: null }),
      ],
    });
    // Button surfaces because UniversalCanvasShell wires onSaveBody.
    expect(html).toContain("source-canvas-document-body-edit-d05_scope_memo");
    // Badge tells the user the displayed content is awaiting authoring,
    // not yet authored.
    expect(html).toContain("Draft needed");
    expect(html).not.toContain("Awaiting authoring");
  });

  it("shows authored content + Edit button when artifact body is non-null", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: "d05_scope_memo",
          body: "# Scope Memo\n\nReal authored content for this event.",
          bodyAuthoredBy: "user_clerk_123",
        }),
      ],
    });
    expect(html).toContain("Real authored content for this event");
    expect(html).toContain("Authored content");
    expect(html).toContain("source-canvas-document-body-edit-d05_scope_memo");
  });

  // ── B1: artifact mark-complete ─────────────────────────────────────────────
  it("renders Mark complete button + status pill for non-terminal artifacts", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: "d05_scope_memo",
          status: "drafting",
        }),
      ],
    });
    // Pill in the row + the body header.
    expect(html).toContain("source-canvas-artifact-status-drafting");
    expect(html).toContain("Drafting");
    // Mark complete button is present and testable.
    expect(html).toContain(
      "source-canvas-artifact-mark-complete-d05_scope_memo",
    );
    expect(html).toContain("Mark complete");
    // No reopen button when not approved.
    expect(html).not.toContain("source-canvas-artifact-reopen-d05_scope_memo");
  });

  it("renders Reopen instead of Mark complete when artifact is approved", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({
          artifactCode: "d05_scope_memo",
          status: "approved",
          tier: "outline",
        }),
      ],
    });
    expect(html).toContain("source-canvas-artifact-status-approved");
    expect(html).toContain("Approved");
    expect(html).not.toContain("Template");
    expect(html).not.toContain("In progress");
    expect(html).toContain("source-canvas-artifact-reopen-d05_scope_memo");
    expect(html).not.toContain(
      "source-canvas-artifact-mark-complete-d05_scope_memo",
    );
  });

  it("hides both buttons for locked / superseded artifacts", () => {
    const html = render({
      artifactStates: [
        makeArtifactState({ artifactCode: "d05_scope_memo", status: "locked" }),
      ],
    });
    expect(html).toContain("source-canvas-artifact-status-locked");
    expect(html).not.toContain(
      "source-canvas-artifact-mark-complete-d05_scope_memo",
    );
    expect(html).not.toContain("source-canvas-artifact-reopen-d05_scope_memo");
  });

  it("renders empty state for unknown viewStage gracefully", () => {
    const html = renderToStaticMarkup(
      createElement(UniversalCanvasShell, {
        event: makeEvent(),
        viewStage: "rfp", // current is scope, viewing rfp with no rows
        artifactStates: [],
        gateCriterionStates: [],
        evidenceStates: [],
        templateByCode: {},
        activityEntries: [],
        tenantName: "Apex Retail Group",
      }),
    );
    expect(html).toContain("source-canvas-document-tab");
    expect(html).toContain("Start with the next RFP document.");
    expect(html).toContain("draft the required document with aVa");
    expect(html).toContain("ask your AbarVa lead");
    expect(html).not.toContain("npm run db:backfill:source-canvas");
  });
});
