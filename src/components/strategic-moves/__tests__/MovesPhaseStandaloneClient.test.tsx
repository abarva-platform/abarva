/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { createElement as mockCreateElement } from "react";

// The moves_capture_v2 path wraps the capture flow in the shared AgentDock;
// mock it so these tests assert the composition (the workspace renders)
// without AgentDock's runtime. AgentDock + the composition are covered by
// their own tests (MovesCaptureWorkspace.test.tsx, ava-dock-adapter.test.ts).
jest.mock("@/components/agent/AgentDock", () => ({
  AgentDock: ({ workspace }: { workspace?: unknown }) =>
    mockCreateElement(
      "div",
      { "data-testid": "agent-dock" },
      workspace as never,
    ),
}));
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";
import {
  MovesPhaseStandaloneClient,
  gateOnlyConfirmSummaryFor,
  movesPhaseCopyAuditBlocks,
} from "../MovesPhaseStandaloneClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import { buildPhaseNavigationStatus } from "@/lib/programs/phase-navigation-status";
import { P1_CHARTER_EVIDENCE_FAMILIES } from "@/lib/programs/p1-charter-evidence";
import { getPhaseCaptureSections } from "@/lib/programs/phase-capture-contract";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";
import type { StrategicMove } from "@/lib/programs/types.ui";

// jsdom's test environment doesn't provide these globally; the component
// runs in a real browser in production, where all three always exist.
if (typeof global.TextEncoder === "undefined") {
  (global as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder =
    TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  (global as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder =
    TextDecoder as unknown as typeof global.TextDecoder;
}
if (typeof global.ReadableStream === "undefined") {
  (
    global as unknown as { ReadableStream: typeof ReadableStream }
  ).ReadableStream = ReadableStream;
}

function workspaceTab(name: RegExp | string): HTMLElement {
  return within(
    screen.getByRole("tablist", { name: "Move workspace views" }),
  ).getByRole("tab", { name });
}

function queryWorkspaceTab(name: RegExp | string): HTMLElement | null {
  return within(
    screen.getByRole("tablist", { name: "Move workspace views" }),
  ).queryByRole("tab", { name });
}

function contractStepButton(name: RegExp | string): HTMLElement {
  const matches = within(screen.getByTestId("mxw-contract-card")).getAllByRole(
    "button",
    { name },
  );
  const stepButton = matches.find((button) =>
    button.classList.contains("mxw-contract-step"),
  );
  if (!stepButton) {
    throw new Error(`Contract step button not found: ${String(name)}`);
  }
  return stepButton;
}

function workflowStepButton(name: RegExp | string): HTMLElement {
  const groups = Array.from(
    screen
      .getByTestId("mxw-contract-card")
      .querySelectorAll<HTMLElement>(".mxw-contract-group"),
  );
  const workflowGroup = groups.find(
    (group) =>
      group.querySelector(".mxw-contract-group-label")?.textContent ===
      "Workflow",
  );
  if (!workflowGroup) throw new Error("Workflow step group not found");
  return within(workflowGroup).getByRole("button", { name });
}

function selectP3Option(name: RegExp | string): void {
  fireEvent.click(workflowStepButton(/Compare Options/i));
  fireEvent.click(screen.getByRole("button", { name }));
}

const mockRouterPush = jest.fn();
const mockRouterRefresh = jest.fn();

jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

function makeMove(overrides: Partial<StrategicMove> = {}): StrategicMove {
  return {
    id: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    displayCode: "GLOBAL_NETWORK_AIRLINE-CANARY-2026",
    name: "CANARY - SkyHarbor Recovery Command IROPS Architecture",
    archetype: "ai_product_enablement",
    tenant: {
      id: "tenant-skyharbor",
      name: "Airline Demo",
      industryCode: "airline",
    },
    charter: null,
    functionPackKey: null,
    currentPhase: 3,
    phaseLabel: "P3 Design Future State",
    status: {
      key: "on_track",
      text: "On track",
      description: "Phase capture in progress",
    },
    statusColor: "green",
    sponsor: {
      id: "sponsor",
      name: "Victor Hale",
      role: "Chief Technology Officer",
    },
    participants: [],
    valueAtStake: {
      projected: { low: 75_000_000, high: 145_000_000, currency: "USD" },
      verified: null,
      assumptions: null,
    },
    deliverables: [
      {
        id: "d1",
        typeKey: "solution_approach",
        title: "Solution Approach Brief",
        status: "draft",
        updatedAt: null,
        preview: "",
        url: "#",
      },
    ],
    gateCriteria: [
      {
        id: "g1",
        label: "Decision evidence attached",
        completed: false,
        severity: "hard",
        verified: true,
      },
    ],
    recentActivity: [],
    linkedEvidence: [
      {
        id: "e1",
        anchor: "Workshop notes",
        summary: "SME session evidence",
        url: "#",
      },
    ],
    mapLabel: "Recovery command",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
    ...overrides,
  };
}

const phaseTallies: PhaseTallyRow[] = [0, 1, 2, 3, 4, 5].map((phase) => ({
  phase,
  label: `P${phase}`,
  met: phase < 3 ? 2 : 0,
  total: 2,
  state: phase < 3 ? "done" : phase === 3 ? "current" : "upcoming",
}));

const completeP3CaptureValues = {
  solution_approach:
    "Governed agent-assist layer on current systems, selected by the sponsor.",
  operating_model:
    "Operations owns workflow adoption; technology owns integration and controls.",
  process_design:
    "Redesigned exception path keeps human approval for high-risk cases.",
  controls_governance:
    "Risk, privacy, and compliance review controls before any production change.",
  architecture_integration:
    "Integrates through governed APIs and existing identity boundaries.",
  evidence_confidence:
    "Discovery evidence supports design with named caveats carried forward.",
  recommendation:
    "Proceed to build planning with explicit owner review and caveats.",
};

const completeP5CaptureValues = {
  mobilization_plan:
    "Named mobilization owners are assigned for launch, support, change adoption, and executive steering.",
  launch_readiness:
    "Launch entry criteria, environment access, and go/no-go readiness have been reviewed by accountable owners.",
  value_proof_rules:
    "Tower measures realized value against approved baselines with unsupported claims excluded from reporting.",
  first_90_days:
    "The first 90 days sequence pilot launch, operating adoption, support stabilization, and value checkpoint reviews.",
  governance_cadence:
    "Weekly launch governance moves to monthly Tower value review after steady-state handoff.",
  risks_open_items:
    "Open risks and client-owned launch actions are documented with owners, due dates, and escalation paths.",
  recommendation:
    "Proceed with launch handoff because artifacts are signed off and value measurement rules are approved.",
};

const completeP2CaptureValues = {
  current_state_findings:
    "CANARY - SkyHarbor Recovery Command IROPS Architecture current-state interviews found dispatch, crew, and customer recovery handoffs split across tools.",
  baseline_metrics: JSON.stringify([
    {
      metric: "Cycle time",
      value: "18.4 days",
      source: "Intake work queue export",
    },
  ]),
  gaps_root_causes:
    "Evidence review found duplicated status updates and no single accountable exception path.",
  process_handoffs:
    "Operations, technology, and customer teams hand off recovery actions at named control points.",
  data_quality_governance:
    "Baseline exports require named owners and exception logging before phase advancement.",
  evidence_confidence:
    "Current-state evidence is directional with named caveats carried into solutioning.",
  recommendation:
    "Proceed to approach selection with the current-state caveats attached.",
};

const completeP1CaptureValues = {
  sponsor_commitment:
    "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.",
  scope_boundary:
    "In scope: Airport turnaround operations.\n\nOut of scope: Crew scheduling policy changes.",
  success_criteria:
    "Discovery succeeds when the team validates the delay baseline and controllable handoff classes.",
  stakeholder_map:
    "Sponsor, operations control, station leaders, maintenance, technology, and finance are named for Discovery.",
  decision_rights:
    "The sponsor and governance committee approve scope, funding, and phase advancement.",
  evidence_plan:
    "Collect schedules, delay codes, aircraft assignment, crew handoff, maintenance, and recovery evidence.",
  business_change_assessment: JSON.stringify({
    expectedWorkflowChange: "limited",
    expectedRoleAccountabilityChange: "none",
    adoptionOwner: "Business process owner",
    adoptionResponsibility: "business",
    evidenceReference: "approved-current-state-evidence",
    validatedBy: "Executive sponsor",
  }),
};

function approvedP1CaptureEvidence(
  ...familyIds: string[]
): Array<{ evidenceId: string; title: string; familyKey: string }> {
  return P1_CHARTER_EVIDENCE_FAMILIES.filter((family) =>
    familyIds.includes(family.id),
  ).map((family) => ({
    evidenceId: `approved-${family.id}`,
    title: `Approved ${family.label} source`,
    familyKey: family.id,
  }));
}

const completeSolutionRouteValue = JSON.stringify({
  businessChangeAssessmentSnapshot: JSON.parse(
    completeP1CaptureValues.business_change_assessment,
  ),
  solutionOutput: "reports_dashboards",
  workflowChange: "limited",
  roleAccountabilityChange: "none",
  evidenceReference: "approved-p2-evidence",
  decision: "confirm",
  selectedRoute: "technical_product",
  correctionRationale: "",
  validatedBy: "Authorized workspace user",
});

const completeEstimateModelValue = JSON.stringify({
  currency: "USD",
  reviewer: "Finance reviewer",
  reviewConfirmed: true,
  sourceNotes: "Synthetic planning assumptions for the UI test.",
  rows: ["internal", "vendor"].map((deliveryModel) => ({
    pairId: "reporting-foundation",
    workPackage: "Reporting foundation",
    role: "Data engineer",
    deliveryModel,
    lowHours: 10,
    baseHours: 20,
    highHours: 30,
    ratePerHour: deliveryModel === "internal" ? 100 : 150,
    rateSource: "Planning rate card",
    inputBasis: "assumption",
    evidenceReference: "",
    assumption: "One bounded reporting release",
    confidence: "medium",
    aiEligiblePct: 10,
    aiToolAssumption:
      "Assistant accelerates scaffolding; human review remains included.",
    humanReviewHours: 2,
  })),
});

function coveredEvidencePacketsForPhase(
  phase: number,
): MoveEvidenceNeedPacket[] {
  return [
    {
      moveId: makeMove().id,
      phase,
      artifactType: "phase_evidence",
      evidenceSlot: `Approved phase ${phase} evidence`,
      familyId: `phase_${phase}_evidence`,
      priority: "required",
      ownerSource: "Process owner",
      acceptedFormats: ["DOCX", "CSV"],
      exampleTemplate: "Phase evidence package",
      exampleContent: [],
      whyItMatters: "The phase decision must be grounded in reviewed evidence.",
      guidanceBasis: "generic",
      blockedArtifacts: [],
      canDraftBoundary: {
        canDraft: false,
        canDraftLabel: "",
        cannotDraftLabel: "",
      },
      preliminaryGenerationCaveat: null,
      waiverOption: null,
      nextAction: "Review the approved phase evidence.",
      status: "covered",
      evidenceTitles: ["approved-phase-evidence.md"],
    },
  ];
}

function makeCurrentStateReadiness(): ReadinessReport {
  return {
    phase: 2,
    archetypeId: "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    archetypeName: "AI Product Development Lifecycle",
    archetypeVersion: "0.1.0",
    profile: {
      useCaseArchetype: "unknown",
      teamArchetypes: [],
      deliveryMaturity: "unknown",
      orgTopology: "unknown",
      cloudPosture: "unknown",
      existingAiTools: [],
      provenance: {},
    },
    instruments: [
      {
        key: "eng_performance_dora",
        label: "Engineering delivery baseline (DORA)",
        kind: "metric_baseline",
        whyNeeded:
          "Deploy frequency, lead time, change-failure rate, and MTTR are the measurable current-state baseline.",
        sourceDocHint: "CI/CD export as CSV",
        severity: "hard",
        status: "missing",
        backingTable: "tower_dora_metrics",
        committedRows: 0,
        rationale:
          "AI Product Development Lifecycle requires Engineering delivery baseline at diagnose.",
        documentFamily: false,
        pendingReviews: [],
        evidenceDigest: [],
      },
    ],
    coverageScore: 0,
    hardGaps: ["eng_performance_dora"],
    softGaps: [],
  };
}

function makeCoveredCurrentStateReadiness(): ReadinessReport {
  const readiness = makeCurrentStateReadiness();
  return {
    ...readiness,
    instruments: readiness.instruments.map((instrument) => ({
      ...instrument,
      status: "committed",
      committedRows: 1,
    })),
    coverageScore: 100,
    hardGaps: [],
  };
}

function makeReviewRequiredCurrentStateReadiness(): ReadinessReport {
  const base = makeCurrentStateReadiness();
  return {
    ...base,
    archetypeId: "COMMERCIAL_LENDING_AGENT_ASSIST",
    archetypeName: "Commercial Lending Agent Assist",
    instruments: [
      {
        ...base.instruments[0],
        key: "commercial_lending_process_map",
        label: "Commercial lending current-state process map",
        status: "review_required",
        sourceDocHint: "workflow notes",
        documentFamily: true,
        pendingReviews: [
          {
            evidenceId: "evidence-review-1",
            reviewId: "review-1",
            sourceArtifactId: null,
            title: "Current-state workshop notes",
            parseMethod: "office_parser",
            confidence: 0.86,
            submittedAt: "2026-07-22T00:00:00Z",
            sourceTextPreview: "Baseline is 30 tickets per week.",
            extraction: {
              version: 1,
              summary: "Parser summary",
              structured: {
                decisions: [],
                risks: [],
                baselineCandidates: ["30 tickets per week"],
                actionItems: [],
                observations: [],
                assumptions: [],
                openQuestions: [],
                citations: [
                  { quote: "30 tickets per week", locator: "page 2" },
                ],
              },
            },
          },
        ],
      },
    ],
    coverageScore: 50,
    hardGaps: ["commercial_lending_process_map"],
  };
}

describe("MovesPhaseStandaloneClient", () => {
  let uploadedEvidenceArtifacts: Array<{
    artifactId: string;
    family?: string;
    fileName: string;
    title: string;
    phase: number;
    version: number;
    status: string;
    lifecycleState: string;
    qualityScore: number | null;
    createdAt: string;
    downloadUrl: string;
  }>;
  let uploadedEvidenceRoutes: Array<{
    fileName: string;
    phase: number;
    evidenceFamily: string | null;
  }>;
  let generatedDeliverableArtifacts: Array<{
    artifactId: string;
    artifactType: string;
    deliverableTypeKey?: string | null;
    family: string;
    title: string;
    phase: number;
    version: number;
    status: string;
    lifecycleState: string;
    qualityScore: number | null;
    createdAt: string;
    downloadUrl: string;
    fileFormat?: string;
    fileName?: string | null;
  }>;
  let structuredFamilyIngests: Array<{
    family: string;
    fileName: string;
  }>;
  /** Per-test response for the structured loader. */
  let structuredIngestResponse: {
    parsedRows: number;
    committedRows: number;
    errors?: string[];
  };
  let currentStateFamilyIngests: Array<{
    family: string;
    fileName: string;
    phase: number;
  }>;

  beforeEach(() => {
    mockRouterPush.mockReset();
    mockRouterRefresh.mockReset();
    window.scrollTo = jest.fn();
    window.open = jest.fn(() => ({}) as Window);
    uploadedEvidenceArtifacts = [];
    uploadedEvidenceRoutes = [];
    generatedDeliverableArtifacts = [];
    currentStateFamilyIngests = [];
    structuredFamilyIngests = [];
    structuredIngestResponse = { parsedRows: 10, committedRows: 10 };
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (
          url.includes("/current-state/ingest") &&
          !url.includes("/current-state/ingest-doc") &&
          init?.method === "POST"
        ) {
          const form = init.body as FormData;
          const file = form.get("file") as File;
          structuredFamilyIngests.push({
            family: String(form.get("family") ?? ""),
            fileName: file.name,
          });
          return {
            ok: true,
            status: 200,
            json: async () => structuredIngestResponse,
          } as Response;
        }

        if (
          url.includes("/current-state/ingest-doc") &&
          init?.method === "POST"
        ) {
          const form = init.body as FormData;
          const file = form.get("file") as File;
          currentStateFamilyIngests.push({
            family: String(form.get("family") ?? ""),
            fileName: file.name,
            phase: Number(form.get("phase") ?? 0),
          });
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              reviewState: "review_required",
              sourceArtifactId: "source-artifact-1",
              sourceArtifactStored: true,
            }),
          } as Response;
        }

        if (
          url.includes("/current-state/evidence/") &&
          url.includes("/approve") &&
          init?.method === "POST"
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          } as Response;
        }

        if (url.includes("/artifacts/upload") && init?.method === "POST") {
          const form = init.body as FormData;
          const file = form.get("file") as File;
          uploadedEvidenceRoutes.push({
            fileName: file.name,
            phase: Number(form.get("phase") ?? 0),
            evidenceFamily: form.get("evidenceFamily")?.toString() ?? null,
          });
          uploadedEvidenceArtifacts.push({
            artifactId: `artifact-${uploadedEvidenceArtifacts.length + 1}`,
            family: String(form.get("family") ?? "uploaded_evidence"),
            fileName: file.name,
            title: String(form.get("title") ?? file.name),
            phase: Number(form.get("phase") ?? 0),
            version: 1,
            status: "draft",
            lifecycleState: "current",
            qualityScore: null,
            createdAt: new Date(0).toISOString(),
            downloadUrl: "#",
          });
          return {
            ok: true,
            status: 200,
            json: async () =>
              file.name === "parser-failure.csv"
                ? {
                    ok: true,
                    evidence: {
                      id: null,
                      status: "not_captured",
                      warning: "Parser did not produce a review record.",
                    },
                  }
                : {
                    ok: true,
                    evidence: {
                      id: `evidence-${uploadedEvidenceArtifacts.length}`,
                      reviewId: `review-${uploadedEvidenceArtifacts.length}`,
                      reviewStatus: "pending_review",
                      parseMethod: "csv-structured-parser",
                    },
                  },
          } as Response;
        }

        if (url.includes("/artifacts?family=uploaded_evidence")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ artifacts: uploadedEvidenceArtifacts }),
          } as Response;
        }

        if (url.includes("/api/v1/programs/") && url.endsWith("/artifacts")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              count:
                generatedDeliverableArtifacts.length +
                uploadedEvidenceArtifacts.length,
              artifacts: [
                ...generatedDeliverableArtifacts,
                ...uploadedEvidenceArtifacts.map((artifact) => ({
                  ...artifact,
                  artifactType: "uploaded_evidence",
                  family: "uploaded_evidence",
                  title: artifact.title || artifact.fileName,
                  fileFormat: "csv",
                  fileName: artifact.fileName,
                  unsupportedClaims: 0,
                  generatedBy: null,
                  fileSize: null,
                  stored: "azure_blob",
                  openItems: [],
                })),
              ],
            }),
          } as Response;
        }

        if (
          url.includes("/stage-readiness-workbook") &&
          init?.method === "POST"
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              metadata: {
                workbookId: "move-1:p1-p2:stage-readiness",
                moveId: "move-1",
                phase: 1,
                nextPhase: 2,
              },
              responses: [{ questionId: "q-1", response: "Confirmed" }],
              issues: [],
              summary: {
                totalQuestions: 2,
                answeredQuestions: 1,
                requiredAnswered: 1,
                requiredTotal: 2,
                warningCount: 0,
                errorCount: 0,
              },
              proposalSet: {
                artifactId: "proposal-artifact-1",
                artifactVersion: 2,
                status: "review_required",
                proposalCount: 2,
                pendingCount: 2,
                proposals: [
                  {
                    proposalId: "proposal-1",
                    questionId: "q-1",
                    dimensionId: "baseline_metrics",
                    requirement: "required",
                    question: "Provide baseline metrics.",
                    response: "Unknown",
                    answerState: "unknown",
                    disposition: "pending",
                  },
                  {
                    proposalId: "proposal-2",
                    questionId: "q-2",
                    dimensionId: "delay_volume",
                    requirement: "required",
                    question: "Provide addressable delay volume.",
                    response: "Insufficient evidence",
                    answerState: "insufficient_evidence",
                    disposition: "pending",
                  },
                ],
                message:
                  "Workbook responses were stored as pending proposals. They do not feed P2 until accepted.",
              },
            }),
          } as Response;
        }

        if (
          url.includes("/stage-readiness-workbook") &&
          init?.method === "PATCH"
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              proposalReview: {
                artifactId: "review-artifact-1",
                status: "accepted",
                acceptedCount: 2,
                rejectedCount: 0,
                needsValidationCount: 0,
                pendingCount: 0,
                acceptedResponses: 2,
                readiness: {
                  ready: 0,
                  partial: 0,
                  insufficientEvidence: 1,
                  unknown: 1,
                },
                message:
                  "Human review recorded. Only accepted workbook responses can feed the next phase context.",
              },
            }),
          } as Response;
        }

        if (url.includes("/api/chat/agent")) {
          const encoder = new TextEncoder();
          const body = new ReadableStream({
            start(controller) {
              controller.enqueue(
                encoder.encode("The two blocking gate items are "),
              );
              controller.enqueue(
                encoder.encode("the requirements trace and the risk register."),
              );
              controller.close();
            },
          });
          return { ok: true, status: 200, body } as unknown as Response;
        }

        if (
          url.includes("/api/v1/programs/") &&
          url.includes("/phase-input-draft") &&
          init?.method === "POST"
        ) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              writes: false,
              currentRevision: "test-phase-capture-revision",
              proposals: [
                {
                  fieldKey: "sponsor_commitment",
                  currentValue: null,
                  proposedValue:
                    "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.",
                  rationale:
                    "Drafted from the approved origination stakeholder view.",
                  evidenceRefs: ["P0 · Stakeholder / owner view"],
                  sourceClasses: ["approved_phase_input"],
                  confidence: "high",
                  materiality: "governed_material",
                  unresolvedGaps: [
                    "Confirm cadence and named approval authority.",
                  ],
                },
              ],
              refusal: null,
            }),
          } as Response;
        }

        if (
          url.includes("/api/v1/programs/") &&
          url.includes("/phase-capture") &&
          init?.method === "POST"
        ) {
          const payload = JSON.parse(String(init.body ?? "{}")) as {
            sections?: Record<string, string>;
          };
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              values: payload.sections ?? {},
              revision: "test-phase-capture-revision",
            }),
          } as Response;
        }

        if (url.includes("/api/v1/deliverables/generate-phase")) {
          return {
            ok: true,
            status: 202,
            json: async () => ({
              deliverables: [
                {
                  deliverableTypeKey: "target_state_architecture",
                  documentTitle: "Target State Reference Architecture",
                  runId: "run-1",
                  status: "queued",
                },
                {
                  deliverableTypeKey: "solution_design",
                  documentTitle: "Solution Design Specification",
                  runId: "run-2",
                  status: "queued",
                },
              ],
            }),
          } as Response;
        }

        if (url.includes("/api/v1/deliverables/runs/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              status: "succeeded",
              artifactId: "artifact-1",
              blobUrl: "/api/v1/artifacts/artifact-1?download=1",
              progressPct: 100,
              progressLabel: "Built",
            }),
          } as Response;
        }

        if (url.includes("/playbook")) {
          return new Promise<Response>(() => {});
        }

        if (url.includes("/phase-intelligence")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
              phase: 3,
              generatedAt: "2026-07-18T00:00:00Z",
              items: [
                {
                  id: "decision",
                  eyebrow: "Key design decision",
                  title: "Governed agent workspace",
                  body: "Selected because it balances productivity, control, and adoption.",
                  sourceLabel: "Decision thread",
                  tone: "success",
                  href: "/dossier/thread-1",
                  hrefLabel: "See full decision record",
                  facts: ["3 alternatives captured"],
                },
                {
                  id: "strategic_signal",
                  eyebrow: "Strategic signal",
                  title: "Agent-handled productivity improvement",
                  body: "8-22% is a labeled planning range, not a committed target.",
                  sourceLabel: "Member-service Agent Assist Function Pack",
                  tone: "default",
                  facts: ["Measured as: cost per resolved contact"],
                },
                {
                  id: "gate_evidence",
                  eyebrow: "Gate and evidence truth",
                  title: "1 hard gate open; 1 required evidence gap.",
                  body: "Upload the missing source file or record a waiver.",
                  sourceLabel: "Governance + evidence readiness",
                  tone: "danger",
                  facts: ["1/2 hard gates met"],
                },
              ],
            }),
          } as Response;
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        } as Response;
      },
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shows no approval action to a user without workspace approval permission", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates={false}
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByText(
        "Approval is available to an authorized workspace user.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve P1 gate/i }),
    ).toBeNull();
  });

  describe("design decision after a reload", () => {
    function optionCards(container: HTMLElement) {
      return Array.from(
        container.querySelectorAll<HTMLButtonElement>(".mxw-options > button"),
      );
    }

    it("selects nothing when no decision is recorded", () => {
      const { container } = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      fireEvent.click(
        within(screen.getByLabelText("P3 steps")).getByRole("button", {
          name: /Compare Options/i,
        }),
      );
      const cards = optionCards(container);
      expect(cards.length).toBeGreaterThan(1);
      expect(
        cards.filter((card) => card.classList.contains("selected")),
      ).toEqual([]);
    });

    it("restores the recorded option as selected, without a click", () => {
      // Find what the second option is called in this fixture, then render a
      // fresh page that is told that option was approved.
      const first = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      fireEvent.click(
        within(screen.getByLabelText("P3 steps")).getByRole("button", {
          name: /Compare Options/i,
        }),
      );
      const second = optionCards(first.container)[1];
      const id = second.querySelector("span")?.textContent ?? "";
      const label = second.querySelector("strong")?.textContent ?? "";
      expect(label).not.toBe("");
      first.unmount();

      const { container } = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          approvedSolutionOption={{ selectedOptionId: id, chosenOption: label }}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      fireEvent.click(
        within(screen.getByLabelText("P3 steps")).getByRole("button", {
          name: /Compare Options/i,
        }),
      );
      const selected = optionCards(container).filter((card) =>
        card.classList.contains("selected"),
      );
      expect(selected).toHaveLength(1);
      expect(selected[0].querySelector("strong")?.textContent).toBe(label);
    });
  });

  describe("retired legacy shell paths", () => {
    it("renders the Finder contract shell even when the old feature flag mock is false", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root).toHaveClass("mxw", "mxw-finder-on");
      expect(root).toHaveAttribute("data-finder-shell", "on");
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.queryByRole("tablist", { name: "Phase steps" }),
      ).not.toBeInTheDocument();
    });

    it("renders a horizontal phase stepper: reached phases are links, the viewed phase is current, future phases are disabled", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const stepper = screen.getByRole("navigation", { name: "Phase steps" });
      const links = within(stepper).getAllByRole("link");
      const futureButtons = within(stepper).getAllByRole("button");

      // All six phases present; P0–P2 navigable, P3–P5 disabled.
      expect(links.length + futureButtons.length).toBe(6);
      expect(links).toHaveLength(3);
      expect(futureButtons).toHaveLength(3);
      futureButtons.forEach((button) => expect(button).toBeDisabled());

      // Exactly the viewed phase (P2) is marked as the current step.
      const current = within(stepper).getByRole("link", { current: "step" });
      expect(current).toHaveAttribute(
        "href",
        expect.stringContaining("/phase/2"),
      );
    });

    it("states what each stepper figure counts, so it cannot be read as capture progress", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const stepper = screen.getByRole("navigation", { name: "Phase steps" });
      const steps = [
        ...within(stepper).getAllByRole("link"),
        ...within(stepper).getAllByRole("button"),
      ];
      expect(steps).toHaveLength(6);

      steps.forEach((step) => {
        // Read the figure's OWN text node. The step renders the phase name and
        // the figure as adjacent elements with no separator, so the step's
        // textContent reads "Originate2 of 2 gate criteria" and a regex over it
        // would pass on a label that had lost its noun.
        const figure = step.querySelector("small");
        expect(figure?.textContent).toMatch(/^\d+ of \d+ gate criteri(on|a)$/);
        // The tooltip carried the same bare figure, and is the only text a
        // reader gets when the step is too narrow for the label.
        expect(step.getAttribute("title")).toMatch(/gate criteri(on|a)$/);
      });
    });

    it("agrees the stepper noun with the count when a phase has a single criterion", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={phaseTallies.map((row) =>
            row.phase === 0 ? { ...row, met: 1, total: 1 } : { ...row },
          )}
        />,
      );

      const stepper = screen.getByRole("navigation", { name: "Phase steps" });
      const figures = [
        ...within(stepper).getAllByRole("link"),
        ...within(stepper).getAllByRole("button"),
      ].map((step) => step.querySelector("small")?.textContent);

      expect(figures).toContain("1 of 1 gate criterion");
      expect(figures).not.toContain("1 of 1 gate criteria");
    });

    it("renders the new shell without any feature-flag fallback dependency", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root).toHaveClass("mxw", "mxw-finder-on");
      expect(root).toHaveAttribute("data-finder-shell", "on");
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    });

    it("moves_capture_v2 flag OFF (default): renders the contract-steps canvas, not the 3-step flow", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
    });

    it("moves_capture_v2 flag ON: renders the redesigned 3-step capture flow in place of the canvas", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      // the old contract canvas is replaced
      expect(screen.queryByTestId("mxw-contract-card")).not.toBeInTheDocument();
      // and the flow shows the first Charter step
      expect(
        screen.getByRole("heading", { name: "Scope the bet" }),
      ).toBeInTheDocument();
    });

    it("drops the legacy gate stepper on the Steps view when the capture composition is active, and restores it on another tab", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureCompositionEnabled
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // On the Steps view the capture flow renders its OWN phase bar, so the
      // legacy gate stepper must not be a second phase navigator stacked above.
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: "Phase steps" }),
      ).not.toBeInTheDocument();
      // On a tab without the capture bar (Approvals) the stepper is the only
      // phase navigator and must still render.
      fireEvent.click(workspaceTab(/Approvals/));
      expect(screen.queryByTestId("moves-capture-flow")).not.toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Phase steps" }),
      ).toBeInTheDocument();
    });

    it("keeps the gate stepper on the Steps view when the composition flag is OFF (capture flow still mounts)", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // capture_v2 on, composition off: the flow mounts, but the legacy chrome
      // (including this stepper) is intentionally kept, as before this change.
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: "Phase steps" }),
      ).toBeInTheDocument();
    });

    // ─── the structured `facts` question on the redesigned flow ───
    // P2's "Baseline metrics" is a required capture section whose input is
    // structured (`structured: "facts"`). Every other structured section —
    // business change, solution route, estimate model — reaches the flow as an
    // editor with an onChange; facts reached it as a read-only table, so the
    // required question had no writable input at all and P2 capture could never
    // complete. These cases pin that it is writable, and that the value the
    // host would store is the facts contract's own form.
    it("P2 on the redesigned flow renders the structured baseline question as a writable editor", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 2, phaseLabel: "P2 Discover" })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      const editor = screen.getByTestId("diagnosis-facts-editor");
      expect(editor).toBeInTheDocument();
      const metric = within(editor).getByLabelText(
        /metric, row 1$/,
      ) as HTMLInputElement;
      expect(metric).toBeEnabled();
      fireEvent.change(metric, { target: { value: "Intake cycle time" } });
      expect(metric.value).toBe("Intake cycle time");
    });


    // ─── P2's route decision: never offer a decision that cannot validate ───
    // `solution_route_validated` is HARD in two consecutive gates (P2 -> P3 and
    // P3 -> P4) and needs `resolveConfirmedSolutionRoute` to return a route.
    // That resolver rejects `decision: "confirm"` whenever `selectedRoute !==
    // recommendation`, and `selectedRoute` cannot hold `"unresolved"` — so when
    // the recommendation is unresolved, confirming is incapable of validating
    // anything. The form offered "Confirm recommendation" anyway, next to a
    // recommendation displayed as "Not yet determined", and storing that answer
    // wrote `selectedRoute: ""`, which the parser rejects outright. Every
    // select was filled, nothing objected, and the gate then reported the route
    // unvalidated while naming neither the cause nor the way out.
    //
    // `src/lib/programs/__tests__/solution-route-decision.test.ts` pins the
    // rule against the resolver and enumerates the 4 of 45 form answers that
    // reach it. These cases pin what the reviewer sees.
    function renderP2RouteDecision(route: Record<string, unknown>) {
      return render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(2)}
          initialSubstepKey="findings"
          initialPhaseCaptureValues={{
            current_state_findings: "Observed intake backlog.",
            baseline_metrics: JSON.stringify([
              {
                metric: "Intake cycle time",
                value: "9 days median",
                source: "Intake work queue",
              },
            ]),
            gaps_root_causes: "No single owner for intake triage.",
            process_handoffs: "Three handoffs between intake and ops.",
            data_quality_governance: "Ownership unclear on the master record.",
            evidence_confidence: "Medium-high operationally.",
            recommendation: "Proceed to design the governed intake path.",
            solution_route_validation: JSON.stringify(route),
          }}
          move={makeMove({ currentPhase: 2, phaseLabel: "P2 Discover" })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
    }

    /** Reaches `recommendSolutionRoute` -> "unresolved". */
    const UNRESOLVED_ANSWER = {
      solutionOutput: "mixed",
      workflowChange: "limited",
      roleAccountabilityChange: "limited",
    } as const;

    /** Reaches `recommendSolutionRoute` -> "technical_product". */
    const RESOLVED_ANSWER = {
      solutionOutput: "reports_dashboards",
      workflowChange: "limited",
      roleAccountabilityChange: "none",
    } as const;

    it("P2 withholds the confirm decision when no route follows from the answers", () => {
      renderP2RouteDecision(UNRESOLVED_ANSWER);

      // The state that makes confirming incapable, as the form displays it.
      expect(screen.getByText("Not yet determined")).toBeInTheDocument();

      const decision = screen.getByLabelText(
        "Human route decision",
      ) as HTMLSelectElement;
      const offered = Array.from(decision.options).map(
        (option) => option.value,
      );
      expect(offered).not.toContain("confirm");
      expect(offered).toContain("correct");
    });

    it("P2 says why confirming is unavailable and names the decision that is", () => {
      renderP2RouteDecision(UNRESOLVED_ANSWER);

      const reason = screen.getByText(/no recommendation to confirm/i);
      expect(reason).toBeInTheDocument();
      expect(reason).toHaveTextContent(/correct recommendation/i);
    });

    it("P2 keeps the confirm decision, and shows no objection, once a route follows", () => {
      renderP2RouteDecision(RESOLVED_ANSWER);

      expect(screen.getByText("Technical product / data solution")).toBeInTheDocument();
      const decision = screen.getByLabelText(
        "Human route decision",
      ) as HTMLSelectElement;
      const offered = Array.from(decision.options).map(
        (option) => option.value,
      );
      expect(offered).toContain("confirm");
      expect(offered).toContain("correct");
      expect(
        screen.queryByText(/no recommendation to confirm/i),
      ).not.toBeInTheDocument();
    });

    it("P2 does not show a stored confirm as the selected decision once it cannot validate", () => {
      // A record written before this guard, or by an agent: the decision says
      // confirm while the answers resolve to no route. Withholding the option
      // is what makes the control stop presenting that dead answer as the
      // reviewer's standing decision — a stored value matching no option
      // cannot be the selected one. Asserted separately from the option set
      // because this is the consequence a reviewer actually meets on reload.
      renderP2RouteDecision({ ...UNRESOLVED_ANSWER, decision: "confirm" });

      const decision = screen.getByLabelText(
        "Human route decision",
      ) as HTMLSelectElement;
      // `selectedIndex`, not `value`: a controlled select whose value matches
      // no option reports `value` as "" either way, so only the index shows
      // whether the placeholder is actually the selected option (0) or the
      // control renders with nothing selected at all (-1).
      expect(decision.selectedIndex).toBe(0);
      expect(decision.options[0]?.textContent).toBe("Review before confirming");
      expect(
        screen.getByText(/no recommendation to confirm/i),
      ).toBeInTheDocument();
    });


    it("P2 on the redesigned flow does not render the baseline question read-only", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 2, phaseLabel: "P2 Discover" })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // The read-only table's own empty state is what the question used to show.
      expect(
        screen.queryByText("No baseline metrics captured yet."),
      ).not.toBeInTheDocument();
    });

    // ─── P3's solution-option choice on the redesigned flow ───
    // P3 cannot be approved until one assembled option is the chosen one: the
    // build blocker is "Select the solution option that architecture should
    // implement before Approve & Build", and the approval payload carries the
    // chosen option forward into P4. The legacy canvas offers option cards; the
    // redesigned flow offered no selector, so a P3 with every question answered
    // was a dead end — the blocker named a control that was not on the page and
    // the only way past it was a recommendation whose prose happened to name an
    // option. These cases pin the chooser on both steps that need it and pin
    // that choosing actually releases the build.
    //
    // The recommendation text here deliberately names no option, so the choice
    // cannot come from inference.
    const p3Answers = {
      solution_approach: "Weighed three paths with the sponsor.",
      operating_model: "Ops and data co-own the pilot.",
      process_design: "One exception queue with human approval.",
      controls_governance: "Human approval on anything customer-facing.",
      architecture_integration: "Read-only integration over the event feed.",
      evidence_confidence: "Medium-high operationally.",
      recommendation: "Back the governed workflow path for P4 planning.",
    };

    function renderP3Capture() {
      return render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
          initialPhaseCaptureValues={p3Answers}
          move={makeMove({
            currentPhase: 3,
            phaseLabel: "P3 Design Future State",
          })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
    }

    it("P3 on the redesigned flow offers the solution-option choice beside the build control", () => {
      renderP3Capture();
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      // A fully answered P3 resumes on the final step, which is where the
      // blocker is stated — so the chooser has to be reachable from there.
      expect(
        screen.getByText(
          /Select the solution option that architecture should implement/i,
        ),
      ).toBeInTheDocument();
      const chooser = screen.getByTestId("solution-option-chooser");
      expect(within(chooser).getAllByRole("radio").length).toBeGreaterThan(1);
    });

    it("P3 on the redesigned flow releases the build once an option is chosen", () => {
      renderP3Capture();
      expect(
        screen.getByRole("button", {
          name: /Complete phase inputs before build/i,
        }),
      ).toBeDisabled();
      const chooser = screen.getByTestId("solution-option-chooser");
      fireEvent.click(within(chooser).getAllByRole("radio")[0]);
      expect(
        screen.queryByRole("button", {
          name: /Complete phase inputs before build/i,
        }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /Approve & Build P3 Design Future State/i,
        }),
      ).toBeEnabled();
    });

    // A choice can already be standing without anyone clicking here: a recorded
    // gate approval names it, and failing that the recommendation text is read
    // for it. The chooser has to show that one as chosen, or a reload would
    // present an unmade decision and invite a second, different answer.
    it("P3's chooser shows the option a standing recommendation already names", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
          initialPhaseCaptureValues={{
            ...p3Answers,
            recommendation:
              "Choose Option B: governed recommendation workflow for P4 planning.",
          }}
          move={makeMove({
            currentPhase: 3,
            phaseLabel: "P3 Design Future State",
          })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const chooser = screen.getByTestId("solution-option-chooser");
      const radios = within(chooser).getAllByRole(
        "radio",
      ) as HTMLInputElement[];
      const standing = radios.filter((radio) => radio.checked);
      expect(standing.map((radio) => radio.value)).toEqual(["B"]);
      // And it is not blocking the build, since a choice is standing.
      expect(
        screen.getByRole("button", {
          name: /Approve & Build P3 Design Future State/i,
        }),
      ).toBeEnabled();
    });

    it("P3's recommendation question carries the same choice on its own step", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
          initialPhaseCaptureValues={{
            ...p3Answers,
            recommendation:
              "Choose Option B: governed recommendation workflow for P4 planning.",
          }}
          move={makeMove({
            currentPhase: 3,
            phaseLabel: "P3 Design Future State",
          })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // Step 1 "The approach" holds solution_approach + recommendation.
      fireEvent.click(screen.getByRole("button", { name: /The approach/i }));
      expect(
        screen.getByRole("textbox", { name: "Recommended approach" }),
      ).toBeInTheDocument();
      const chooser = screen.getByTestId("solution-option-chooser");
      const radios = within(chooser).getAllByRole(
        "radio",
      ) as HTMLInputElement[];
      expect(radios.length).toBeGreaterThan(1);
      // The same standing choice, not a blank group beside the question.
      expect(
        radios.filter((radio) => radio.checked).map((radio) => radio.value),
      ).toEqual(["B"]);
    });

    // P4 asks a `recommendation` question of its own, and its build control is
    // the same one. Answered in full so the flow resumes on the step that holds
    // that question — otherwise a mount that forgot to check the phase would
    // still look correct here, because the question would be off-screen.
    it("a phase other than P3 gets no solution-option choice", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(4)}
          initialPhaseCaptureValues={{
            roadmap_sequencing:
              "Three waves, starting with the exception queue.",
            estimates_capacity: completeEstimateModelValue,
            value_plan: "Measured against the P2 baseline at day 90.",
            funding_governance: "Funded from the existing programme envelope.",
            risks_dependencies: "Source freshness is the main dependency.",
            handoff_plan: "Hands to the platform team with the runbook.",
            recommendation: "Proceed to mobilisation on the agreed sequence.",
          }}
          move={makeMove({
            currentPhase: 4,
            phaseLabel: "P4 Roadmap & Business Case",
          })}
          phaseNum={4}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.getByRole("textbox", { name: "Recommendation to fund" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("solution-option-chooser"),
      ).not.toBeInTheDocument();
    });

    // ─── moves_capture_p0_v1: P0 Originate on the redesigned 3-step flow ───
    // The flow shipped mounted for phases 1-5 only, so P0 stayed on the legacy
    // finder-columns canvas. These cases pin BOTH halves of the two-flag gate
    // independently (each conjunct removed while the other is satisfied), so
    // dropping either flag from the condition fails a test.
    const p0Move = () =>
      makeMove({ currentPhase: 0, phaseLabel: "P0 Originate" });

    it("P0 with both capture flags OFF (default): keeps the legacy canvas", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("moves-phase-standalone")).toHaveAttribute(
        "data-capture-p0",
        "off",
      );
    });

    it("P0 with moves_capture_v2 ON but moves_capture_p0_v1 OFF: still the legacy canvas", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("moves-phase-standalone")).toHaveAttribute(
        "data-capture-p0",
        "off",
      );
    });

    it("P0 with moves_capture_p0_v1 ON but moves_capture_v2 OFF: still the legacy canvas", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureP0Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("moves-phase-standalone")).toHaveAttribute(
        "data-capture-p0",
        "off",
      );
    });

    it("P0 with BOTH flags ON: renders the 3-step capture flow opening on P0's first step", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureP0Enabled
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(screen.getByTestId("moves-phase-standalone")).toHaveAttribute(
        "data-capture-p0",
        "on",
      );
      // P0's own step grouping, not a phase-1 heading.
      expect(
        screen.getByRole("heading", { name: "Why now" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Scope the bet" }),
      ).not.toBeInTheDocument();
    });

    it("P0 capture flow offers the gate control inline once required evidence is covered", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureP0Enabled
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(0)}
          initialSubstepKey="approve"
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // Rendered inline, NOT through StepHeaderActionPortal (whose target does
      // not exist in the capture flow), so the button is in the document.
      expect(
        screen.getByRole("button", { name: /Approve gate/i }),
      ).toBeInTheDocument();
    });

    it("P0 capture flow refuses the gate control while a required evidence item is open", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureP0Enabled
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(0).map(
            (packet) => ({ ...packet, status: "missing" as const }),
          )}
          initialSubstepKey="approve"
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /Approve gate/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/P0 cannot advance on these answers alone/i),
      ).toBeInTheDocument();
    });

    it("P0 capture flow withholds the gate control from an unauthorized user", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates={false}
          captureP0Enabled
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(0)}
          initialSubstepKey="approve"
          move={p0Move()}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByRole("button", { name: /Approve gate/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          "Approval is available to an authorized workspace user.",
        ),
      ).toBeInTheDocument();
    });

    it("the P0 flag alone does not change phases 1-5", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureP0Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
    });

    // ─── moves_capture_composition_v1 ───────────────────────────────────────
    // Composition only. Each case pins ONE half of the polish with the other
    // inputs satisfied, so removing either half fails a case of its own.

    it("moves_capture_composition_v1 OFF: the tab row stays above the dock and the stage head still states the phase", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const dock = screen.getByTestId("agent-dock");
      const tablist = screen.getByRole("tablist", {
        name: "Move workspace views",
      });
      expect(dock).not.toContainElement(tablist);
      // the legacy head still carries the phase title, question and progress
      expect(
        screen.getByRole("heading", { level: 1, name: "Charter" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Phase progress")).toBeInTheDocument();
    });

    it("moves_capture_composition_v1 ON: one tab row, rendered once in the shell (not inside the dock), so its position is consistent across views", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureCompositionEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const dock = screen.getByTestId("agent-dock");
      // exactly one tab row, rendered in the shell above the dock — NOT moved
      // into the dock workspace (which made its position differ from the
      // Files/Intelligence/Approvals views and clip it).
      const tablists = screen.getAllByRole("tablist", {
        name: "Move workspace views",
      });
      expect(tablists).toHaveLength(1);
      expect(dock).not.toContainElement(tablists[0]);
      // and it still switches surfaces
      expect(
        within(tablists[0]).getByRole("tab", { name: /Files/ }),
      ).toBeInTheDocument();
    });

    it("moves_capture_composition_v1 ON: the stage head stops repeating what the capture flow already states", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureCompositionEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // the duplicated head is gone
      expect(
        screen.queryByRole("heading", { level: 1, name: "Charter" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Phase progress")).not.toBeInTheDocument();
      // but the flow still states the phase and the step, so nothing is lost
      const dock = screen.getByTestId("agent-dock");
      expect(
        within(dock).getByTestId("moves-capture-flow"),
      ).toBeInTheDocument();
      expect(
        within(dock).getByRole("heading", { name: "Scope the bet" }),
      ).toBeInTheDocument();
    });

    it("moves_capture_composition_v1 ON without moves_capture_v2: changes nothing", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureCompositionEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // the legacy canvas, its head and its tab row are all untouched
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: "Charter" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Phase progress")).toBeInTheDocument();
      expect(
        screen.getByRole("tablist", { name: "Move workspace views" }),
      ).toBeInTheDocument();
    });

    // ─── moves_charter_basis_v1: the HOST call site ─────────────────────────
    // The join itself is pure and pinned (charter-basis-host-join.test.ts), and
    // every rendering half has its own suite. What nothing pinned is the wiring
    // in this component that FEEDS the join: which flag it reads, and — the
    // part a pure test cannot reach — which phase number it hands over. The
    // surface is reachable only through the capture flow, so the `v2` conjunct
    // is part of the call site too.
    //
    // Each case removes ONE input with the others satisfied, so dropping any
    // conjunct from the call site fails a case of its own.
    const charterMove = () =>
      makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" });

    // P1 step 1 is "Scope the bet" — sponsor_commitment, scope_boundary,
    // success_criteria — so the opening step is where the controls appear.
    const SCOPE_THE_BET_SECTIONS = [
      "sponsor_commitment",
      "scope_boundary",
      "success_criteria",
    ] as const;

    it("moves_charter_basis_v1 OFF (default) on P1: the capture flow renders with no basis control", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // the flow is up, so this is the flag's absence and not an unmounted surface
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      for (const sectionKey of SCOPE_THE_BET_SECTIONS) {
        expect(
          screen.queryByTestId(`charter-basis-${sectionKey}`),
        ).not.toBeInTheDocument();
      }
      expect(
        screen.queryByText("How do you know this?"),
      ).not.toBeInTheDocument();
    });

    it("moves_charter_basis_v1 ON on P1: every charter question carries the basis control with all three bases", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      for (const sectionKey of SCOPE_THE_BET_SECTIONS) {
        const field = screen.getByTestId(`charter-basis-${sectionKey}`);
        // nothing declared yet, and all three bases offered
        expect(field).toHaveAttribute("data-basis", "none");
        expect(
          within(field).getByRole("radio", { name: "Backed by evidence" }),
        ).toBeInTheDocument();
        expect(
          within(field).getByRole("radio", { name: "I'm asserting this" }),
        ).toBeInTheDocument();
        expect(
          within(field).getByRole("radio", { name: "It's an assumption" }),
        ).toBeInTheDocument();
      }
    });

    it("keeps capture Continue disabled until saved answers have a valid basis", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("does not treat saved P1 answers without a declared basis as complete", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("blocks Continue when a previously captured answer has unsaved edits", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="prepare"
          initialP1CharterBasisBySection={Object.fromEntries(
            SCOPE_THE_BET_SECTIONS.map((sectionKey) => [
              sectionKey,
              { kind: "workspace_assertion" as const },
            ]),
          )}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.change(
        screen.getByLabelText("Sponsor contact and progress updates"),
        { target: { value: "Updated but not yet saved" } },
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("resumes at the first incomplete P1 step when earlier answers are durably complete", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={{
            sponsor_commitment:
              "Synthetic role alias: executive sponsor; progress updates stay in-app.",
            scope_boundary:
              "Synthetic scope: aggregated reporting; no operating-model redesign.",
            success_criteria:
              "Validate report ownership, lineage, quality, and access controls.",
          }}
          initialP1CharterBasisBySection={Object.fromEntries(
            SCOPE_THE_BET_SECTIONS.map((sectionKey) => [
              sectionKey,
              { kind: "workspace_assertion" as const },
            ]),
          )}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(
        screen.getByRole("heading", { name: "People & decisions" }),
      ).toBeInTheDocument();
      const steps = within(screen.getByRole("navigation", { name: "Steps" }));
      expect(
        steps.getByRole("button", { name: /Scope the bet/ }),
      ).toHaveTextContent("✓");
      expect(
        steps.getByRole("button", { name: /People & decisions/ }),
      ).toHaveAttribute("aria-current", "step");
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("does not resume past a P1 step with any uncaptured required answer", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={{
            sponsor_commitment:
              "Synthetic role alias: executive sponsor; progress updates stay in-app.",
            scope_boundary:
              "Synthetic scope: aggregated reporting; no operating-model redesign.",
          }}
          initialP1CharterBasisBySection={Object.fromEntries(
            SCOPE_THE_BET_SECTIONS.map((sectionKey) => [
              sectionKey,
              { kind: "workspace_assertion" as const },
            ]),
          )}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(
        screen.getByRole("heading", { name: "Scope the bet" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("allows the next P1 step after each saved answer has a recorded workspace assertion", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="prepare"
          initialP1CharterBasisBySection={Object.fromEntries(
            SCOPE_THE_BET_SECTIONS.map((sectionKey) => [
              sectionKey,
              { kind: "workspace_assertion" as const },
            ]),
          )}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const continueButton = screen.getByRole("button", { name: "Continue" });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);
      expect(
        screen.getByRole("heading", { name: "People & decisions" }),
      ).toBeInTheDocument();
    });

    it("allows an owned assumption with an owner and P2 validation plan", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="prepare"
          initialP1CharterBasisBySection={{
            sponsor_commitment: {
              kind: "assumption",
              owner: "Operations lead",
              p2ValidationPlan: "Confirm contact and cadence during Discovery.",
            },
            scope_boundary: { kind: "workspace_assertion" },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });

    it("requires matching approved evidence when evidence is the declared basis", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialApprovedP1CaptureEvidenceReferences={approvedP1CaptureEvidence(
            "charter_sponsor",
          )}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="prepare"
          initialP1CharterBasisBySection={{
            sponsor_commitment: {
              kind: "approved_evidence",
              evidenceId: "approved-charter_sponsor",
            },
            scope_boundary: { kind: "workspace_assertion" },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });

    it("keeps the flag-off P1 capture path evidence-backed", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialApprovedP1CaptureEvidenceReferences={approvedP1CaptureEvidence(
            "charter_sponsor",
            "charter_scope",
            "charter_success_metrics",
          )}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="prepare"
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    });

    it("keeps Continue blocked until a newly selected basis is acknowledged by the server", async () => {
      const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
      let resolveBasisSave: ((response: Response) => void) | undefined;
      const basisSave = new Promise<Response>((resolve) => {
        resolveBasisSave = resolve;
      });
      (global.fetch as jest.Mock).mockImplementation(
        (input: RequestInfo | URL, init?: RequestInit) => {
          const url = String(input);
          if (
            url.includes("/phase-capture") &&
            init?.method === "POST" &&
            JSON.parse(String(init.body ?? "{}")).p1BasisBySection
          ) {
            return basisSave;
          }
          return defaultFetch?.(input, init) as Promise<Response>;
        },
      );

      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialP1CharterBasisBySection={{
            scope_boundary: { kind: "workspace_assertion" },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        within(
          screen.getByTestId("charter-basis-sponsor_commitment"),
        ).getByRole("radio", { name: "I'm asserting this" }),
      );
      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

      await act(async () => {
        resolveBasisSave?.({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            revision: "saved-basis-revision",
            p1BasisBySection: {
              sponsor_commitment: { kind: "workspace_assertion" },
              scope_boundary: { kind: "workspace_assertion" },
              success_criteria: { kind: "workspace_assertion" },
            },
          }),
        } as Response);
      });

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled(),
      );
    });

    it("does not let an owned-assumption choice complete until owner and validation plan are present", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialP1CharterBasisBySection={{
            sponsor_commitment: {
              kind: "assumption",
              owner: "",
              p2ValidationPlan: "",
            },
            scope_boundary: { kind: "workspace_assertion" },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("requires an approved source to match the P1 field when evidence is the declared basis", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialP1CharterBasisBySection={{
            sponsor_commitment: {
              kind: "approved_evidence",
              evidenceId: "not-the-sponsor-source",
            },
            scope_boundary: { kind: "workspace_assertion" },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    });

    it("moves_charter_basis_v1 ON without moves_capture_v2: the legacy canvas carries no basis control", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      for (const sectionKey of SCOPE_THE_BET_SECTIONS) {
        expect(
          screen.queryByTestId(`charter-basis-${sectionKey}`),
        ).not.toBeInTheDocument();
      }
    });

    // ── the VIEWED phase, not the Move's progress ──
    // `charterBasisSurfaceActive` takes a phase number, and the two candidates
    // in scope here differ on every screen except the Move's own current phase:
    // `phase.phase` (the phase being viewed) and `move.currentPhase` (how far
    // the Move has got). Substituting the Move's progress for the viewed phase
    // is observable in ONE direction only, and the pair below records which:
    //
    //  · viewing P1 of a Move already at P2 — the backward look at a completed
    //    charter, a real path once the Move advances — LOSES the whole surface
    //    under the substitution. That case is what kills it.
    //  · viewing P2 of a Move still at P1 does NOT gain the surface, because
    //    the section filter blocks it independently: only P1's capture sections
    //    declare a charter evidence family, so there is nothing for the join to
    //    return on any other phase.
    //
    // So the phase conjunct is defence in depth for the per-section surfaces
    // rather than their only guard — worth keeping, and worth not claiming more
    // for than it does. Both cases are still real regression cover for the
    // surface being absent off P1 and present on it.
    it("moves_charter_basis_v1 ON, viewing P2 of a Move sitting at P1: no basis control, because the basis belongs to the P1 gate", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={charterMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      // P2's own opening step, so the flow really is rendering questions here
      expect(
        screen.getByRole("heading", { name: "What we found" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("How do you know this?"),
      ).not.toBeInTheDocument();
      for (const sectionKey of SCOPE_THE_BET_SECTIONS) {
        expect(
          screen.queryByTestId(`charter-basis-${sectionKey}`),
        ).not.toBeInTheDocument();
      }
    });

    it("moves_charter_basis_v1 ON, viewing P1 of a Move already at P2: the basis control still renders", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 2, phaseLabel: "P2 Discover" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.getByRole("heading", { name: "Scope the bet" }),
      ).toBeInTheDocument();
      for (const sectionKey of SCOPE_THE_BET_SECTIONS) {
        expect(
          screen.getByTestId(`charter-basis-${sectionKey}`),
        ).toBeInTheDocument();
      }
    });

    // ── the hydration prop is actually consumed ──
    // `initialP1CharterBasisBySection` was dropped from this component once
    // already, which looks like nothing at render time: the control still
    // appears, it just forgets every basis the Move has recorded. So assert the
    // recorded basis is READ BACK, not merely that a control exists.
    it("moves_charter_basis_v1 ON on P1: a recorded assumption is read back and badged, and a recorded assertion is not", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialP1CharterBasisBySection={{
            scope_boundary: {
              kind: "assumption",
              owner: "Ops lead",
              p2ValidationPlan:
                "Confirm the boundary against the process walk.",
            },
            success_criteria: { kind: "workspace_assertion" },
          }}
          move={charterMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const assumed = screen.getByTestId("charter-basis-scope_boundary");
      expect(assumed).toHaveAttribute("data-basis", "assumption");
      expect(
        within(assumed).getByRole("radio", { name: "It's an assumption" }),
      ).toHaveAttribute("aria-checked", "true");

      const asserted = screen.getByTestId("charter-basis-success_criteria");
      expect(asserted).toHaveAttribute("data-basis", "workspace_assertion");

      // the amber badge marks the assumed question only — one badge, not three
      const badges = screen.getAllByTestId("charter-assumption-badge");
      expect(badges).toHaveLength(1);
      expect(badges[0]).toHaveTextContent("Assumption · validate in Discover");

      // and the untouched question is still undeclared
      expect(
        screen.getByTestId("charter-basis-sponsor_commitment"),
      ).toHaveAttribute("data-basis", "none");
    });

    // ─── moves_capture_notes_v1: the HOST call site ─────────────────────────
    // The proposal matcher is pure and pinned (capture-notes-proposal.test.ts),
    // the panel has its own suite, and the notes→basis decision is pinned in
    // capture-notes-basis-link.test.ts. What nothing pinned is the FOUR inputs
    // this component feeds that call site:
    //
    //   1. the flag (and the `moves_capture_v2` conjunct — the panel lives in
    //      the capture dock, so with v2 off there is nowhere to put it),
    //   2. `targets` — the VIEWED phase's capture sections and their values,
    //      which is what makes the panel refuse to propose a question that is
    //      not on the screen,
    //   3. `onInsert` — the write back into the capture field, and
    //   4. `recordsBasisFor` — the conjunction with `moves_charter_basis_v1`,
    //      which is what makes the panel's "inserting records your assertion"
    //      wording true of the field in front of the person rather than true
    //      in general.
    //
    // Each case removes ONE of those with the others satisfied. Measured, not
    // asserted: dropping the flag conjunct, pointing `targets` at the Move's
    // progress instead of the viewed phase, stubbing `onInsert`, and emptying
    // `recordsBasisFor` each failed 1, 1, 2 and 1 of this suite's cases — all
    // of them new here. The other 146 render this component and none of them
    // noticed the notes call site break.
    //
    // The `moves_capture_v2` half is structural rather than a droppable
    // conditional: `notesFill` is a slot on `MovesCaptureWorkspace`, which only
    // exists once the capture flow is mounted. The third case pins that the
    // legacy canvas therefore grows no notes affordance of its own.
    const notesMove = () =>
      makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" });

    // Two blocks, each matching one P1 step-1 question on ≥2 of that section's
    // own label/description terms. Written as prose a consultant would actually
    // leave a conversation with, not as the field labels.
    const CLIENT_NOTES = [
      "Scope boundary: the member-services queue is in scope; the billing systems stay out.",
      "",
      "Success criteria are rough for now — directional targets Discovery can validate.",
    ].join("\n");

    const pasteAndPropose = (notes: string = CLIENT_NOTES) => {
      fireEvent.click(screen.getByTestId("capture-notes-open"));
      fireEvent.change(screen.getByTestId("capture-notes-input"), {
        target: { value: notes },
      });
      fireEvent.click(screen.getByTestId("capture-notes-propose"));
    };

    it("moves_capture_notes_v1 OFF (default) on P1: the capture dock offers no fill-from-notes", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // the dock and the flow are both up, so this is the flag's absence and
      // not an unmounted surface
      expect(screen.getByTestId("agent-dock")).toBeInTheDocument();
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("capture-notes-open"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Paste client notes")).not.toBeInTheDocument();
    });

    it("moves_capture_notes_v1 ON on P1: the dock offers fill-from-notes, inside the capture dock", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const dock = screen.getByTestId("agent-dock");
      expect(within(dock).getByTestId("capture-notes-open")).toHaveTextContent(
        "Paste client notes",
      );
    });

    it("moves_capture_notes_v1 ON without moves_capture_v2: the legacy canvas offers no fill-from-notes", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.queryByTestId("capture-notes-open"),
      ).not.toBeInTheDocument();
    });

    // ── `targets` is the VIEWED phase's questions ──
    // The same paste, on two screens. A proposal for a P1 question can only
    // appear where P1's sections are the targets, so handing the panel any
    // other section list (a constant, or the Move's current phase on a screen
    // that is not it) loses one of these two assertions.
    it("moves_capture_notes_v1 ON on P1: a pasted note proposes into a P1 charter question", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      pasteAndPropose();

      const proposal = screen.getByTestId(
        "capture-notes-proposal-scope_boundary",
      );
      // the verbatim span, not a paraphrase, and its provenance
      expect(proposal).toHaveTextContent(
        "the member-services queue is in scope",
      );
      expect(proposal).toHaveTextContent("line 1");
      // and the paste is never dressed up as approved evidence
      expect(
        screen.getByTestId("capture-notes-basis-warning"),
      ).toHaveTextContent("your assertion");
    });

    it("moves_capture_notes_v1 ON viewing P2: the same paste proposes nothing, because no P1 question is on screen", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      pasteAndPropose();

      expect(
        screen.queryByTestId("capture-notes-proposal-scope_boundary"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("capture-notes-empty")).toBeInTheDocument();
    });

    // ── `onInsert` writes into the capture field ──
    // Dropping the handler leaves the panel's Insert a no-op that still looks
    // like it worked (the proposal disappears either way, because the panel
    // tracks what it has inserted itself), so assert the FIELD.
    it("moves_capture_notes_v1 ON on P1: inserting a proposal writes the verbatim passage into that question", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const field = screen.getByLabelText("Scope boundary");
      expect(field).toHaveValue("");

      pasteAndPropose();
      fireEvent.click(
        screen.getByTestId("capture-notes-insert-scope_boundary"),
      );

      expect(screen.getByLabelText("Scope boundary")).toHaveValue(
        "Scope boundary: the member-services queue is in scope; the billing systems stay out.",
      );
      // the sibling question is untouched — an insert is per field
      expect(screen.getByLabelText("Success criteria")).toHaveValue("");
    });

    // ── `recordsBasisFor`: the conjunction with moves_charter_basis_v1 ──
    // With the basis control off the person still declares the basis by hand,
    // so the panel must not claim the insert records it. Two renders of the
    // same paste, one flag apart.
    it("moves_capture_notes_v1 ON with moves_charter_basis_v1 OFF: the panel does not claim an insert records the basis", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      pasteAndPropose();

      expect(
        screen.getByTestId("capture-notes-proposal-scope_boundary"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("capture-notes-records-basis-scope_boundary"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("capture-notes-basis-recorded-note"),
      ).not.toBeInTheDocument();
    });

    it("moves_capture_notes_v1 ON with moves_charter_basis_v1 ON: inserting from notes stamps the field's basis as an assertion", async () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          captureNotesEnabled
          charterBasisEnabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={notesMove()}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.getByTestId("charter-basis-scope_boundary"),
      ).toHaveAttribute("data-basis", "none");

      pasteAndPropose();
      // the panel says what the insert will do, for this field
      expect(
        screen.getByTestId("capture-notes-records-basis-scope_boundary"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("capture-notes-basis-recorded-note"),
      ).toBeInTheDocument();

      // the insert also PERSISTS the basis, so flush that write rather than
      // leaving its state update to land after the test
      await act(async () => {
        fireEvent.click(
          screen.getByTestId("capture-notes-insert-scope_boundary"),
        );
      });

      // ...and the field agrees: an assertion, never "backed by evidence"
      const basis = screen.getByTestId("charter-basis-scope_boundary");
      expect(basis).toHaveAttribute("data-basis", "workspace_assertion");
      expect(
        within(basis).getByRole("radio", { name: "I'm asserting this" }),
      ).toHaveAttribute("aria-checked", "true");
      // and a paste never produces the amber assumption badge
      expect(
        screen.queryByTestId("charter-assumption-badge"),
      ).not.toBeInTheDocument();
    });

    // ─── moves_charter_assumptions_discover_v1 / _resolution_v1:
    //     the HOST call site ───────────────────────────────────────────────
    // The fold is pure and pinned (charter-assumptions-carry-forward.test.ts)
    // and the panel has its own suite. Neither flag had a single case in THIS
    // file, which is where the two decisions that join them live:
    //
    //   1. where the band is mounted — it is the `openingBand` slot on the
    //      capture flow, so it exists only once `moves_capture_v2` renders,
    //      and it reads BEFORE the first Discover question rather than under
    //      the answers it is supposed to qualify;
    //   2. that the host passes the fold's rows through verbatim — it re-reads
    //      no flag, re-derives no row, and re-counts nothing. Both flags are
    //      resolved server-side and arrive collapsed into one prop, so the
    //      only way the host can break them is by dropping or reshaping it.
    //
    // Pinning (2) needs rows the host could not have reconstructed from the
    // capture state it also holds: the owner and the validation plan live in
    // the P1 basis record, which is loaded on phase === 1 only. A case that
    // asserted the band merely EXISTS would survive the prop being dropped
    // and re-derived empty — the same blind spot
    // `initialP1CharterBasisBySection` fell into once already.
    const [sponsorFamily, scopeFamily] = P1_CHARTER_EVIDENCE_FAMILIES;

    // Deliberately unguessable from anything else this component is given.
    const carriedRows = [
      {
        sectionKey: sponsorFamily.sectionKey,
        label: sponsorFamily.label,
        answer: "Weekly written update to the steering group.",
        owner: "Priya Raman",
        validationPlan: "Confirm the cadence in the sponsor interview.",
        recordedAt: "2026-10-01T09:00:00.000Z",
      },
      {
        sectionKey: scopeFamily.sectionKey,
        label: scopeFamily.label,
        answer: "Member services only; billing stays out.",
        owner: "Dana Whitfield",
        validationPlan: "Walk the queue with operations and list what it owns.",
        recordedAt: "2026-10-01T09:05:00.000Z",
      },
    ];

    const discoverMove = () =>
      makeMove({ currentPhase: 2, phaseLabel: "P2 Discover" });

    it("moves_charter_assumptions_discover_v1 OFF: P2 capture opens with no carried-assumption band", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={null}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // the flow IS up, so this is the surface being inactive and not an
      // unmounted capture screen
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("charter-assumptions-carry-forward"),
      ).not.toBeInTheDocument();
    });

    it("moves_charter_assumptions_discover_v1 ON: the band opens P2 capture, above the first question", () => {
      const { container } = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={carriedRows}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const band = screen.getByTestId("charter-assumptions-carry-forward");
      const flow = screen.getByTestId("moves-capture-flow");
      expect(flow).toContainElement(band);

      // the band qualifies the questions, so it has to precede them: a slot
      // that rendered after the panel would be a footnote to answers the
      // person has already given
      const panel = container.querySelector(".mcf-panel");
      expect(panel).not.toBeNull();
      expect(
        band.compareDocumentPosition(panel as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("moves_charter_assumptions_discover_v1 ON: each row renders the owner and plan the host could not re-derive", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={carriedRows}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const band = screen.getByTestId("charter-assumptions-carry-forward");
      for (const row of carriedRows) {
        expect(within(band).getByText(row.label)).toBeInTheDocument();
        expect(within(band).getByText(row.answer)).toBeInTheDocument();
        expect(within(band).getByText(row.owner)).toBeInTheDocument();
        expect(within(band).getByText(row.validationPlan)).toBeInTheDocument();
      }
    });

    it("moves_charter_assumptions_discover_v1 ON: the host re-counts nothing — the prop's length is the count", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={[carriedRows[0]]}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // one row in, one row out. `moves_charter_assumption_resolution_v1`
      // filters a resolved assumption out inside the fold, so the host's only
      // correct behaviour is to show exactly what it was handed — anything it
      // added back would re-open an assumption Discover has already closed.
      const band = screen.getByTestId("charter-assumptions-carry-forward");
      expect(band).toHaveAttribute("data-count", "1");
      expect(within(band).getAllByRole("listitem")).toHaveLength(1);
      expect(
        within(band).queryByText(scopeFamily.label),
      ).not.toBeInTheDocument();
    });

    it("moves_charter_assumptions_discover_v1 ON with nothing assumed: an empty charter is not announced as a clean one", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={[]}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("charter-assumptions-carry-forward"),
      ).not.toBeInTheDocument();
      // and no "0 assumptions" consolation prize anywhere on the screen
      expect(
        screen.queryByText(/still an assumption/i),
      ).not.toBeInTheDocument();
    });

    it("moves_charter_assumptions_discover_v1 ON without moves_capture_v2: the legacy canvas grows no carry-forward band", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriedCharterAssumptions={carriedRows}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={discoverMove()}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // structural, not a droppable conditional: `openingBand` is a slot on
      // the capture flow, so with v2 off there is nowhere to put the band.
      // Pin the consequence rather than the branch.
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(
        screen.queryByTestId("charter-assumptions-carry-forward"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(carriedRows[0].owner)).not.toBeInTheDocument();
    });

    // ─── moves_charter_standing_after_discover_v1: the HOST call site ─────
    // The fold is pure and pinned (charter-standing-after-discover.test.ts)
    // and the panel has its own suite. What lives only HERE is the same pair
    // of decisions as the carry-forward above: that the P3+ band is mounted
    // in the capture flow's `openingBand` slot, and that the host passes the
    // fold's rows through VERBATIM — it re-reads no flag, re-derives no row
    // and re-counts nothing.
    //
    // As above, pinning the pass-through needs values the host could not have
    // reconstructed: the assumption owner and Discover's correction live in
    // the P1 basis and resolution records, neither of which is loaded on a P3
    // render. A case asserting the band merely EXISTS would survive the prop
    // being dropped and re-derived empty.
    const standingRows = [
      {
        sectionKey: sponsorFamily.sectionKey,
        label: sponsorFamily.label,
        answer: "Weekly written update to the steering group.",
        owner: "Priya Raman",
        recordedAt: "2026-10-01T09:00:00.000Z",
        standing: "unvalidated" as const,
        plannedValidation: "Confirm the cadence in the sponsor interview.",
      },
      {
        sectionKey: scopeFamily.sectionKey,
        label: scopeFamily.label,
        answer: "Member services only; billing stays out.",
        owner: "Dana Whitfield",
        recordedAt: "2026-10-01T09:05:00.000Z",
        standing: "known_wrong" as const,
        correction: "Discover found billing already inside the same queue.",
        resolvedAt: "2026-10-02T11:00:00.000Z",
      },
    ];

    const designMove = () =>
      makeMove({ currentPhase: 3, phaseLabel: "P3 Design" });

    it("moves_charter_standing_after_discover_v1 OFF: P3 capture opens with no standing band", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          charterStandingAfterDiscover={null}
          evidenceNeedPackets={[]}
          move={designMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("charter-standing-after-discover"),
      ).not.toBeInTheDocument();
    });

    it("moves_charter_standing_after_discover_v1 ON: the band opens P3 capture with the fold's own rows", () => {
      const { container } = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          charterStandingAfterDiscover={standingRows}
          evidenceNeedPackets={[]}
          move={designMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const band = screen.getByTestId("charter-standing-after-discover");
      expect(screen.getByTestId("moves-capture-flow")).toContainElement(band);

      // Verbatim pass-through: neither of these is derivable from the capture
      // state a P3 render holds, so a dropped or re-derived prop fails here.
      expect(screen.getByText("Priya Raman")).toBeInTheDocument();
      expect(
        screen.getByText("Discover found billing already inside the same queue."),
      ).toBeInTheDocument();
      expect(band).toHaveAttribute("data-count", "2");
      expect(band).toHaveAttribute("data-known-wrong", "1");
      expect(band).toHaveAttribute("data-unvalidated", "1");

      // It qualifies the questions, so it must precede them.
      const panel = container.querySelector(".mcf-panel");
      expect(panel).not.toBeNull();
      expect(
        band.compareDocumentPosition(panel as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it("renders nothing for an active phase with every charter answer standing clean", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          charterStandingAfterDiscover={[]}
          evidenceNeedPackets={[]}
          move={designMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("charter-standing-after-discover"),
      ).not.toBeInTheDocument();
    });

    it("mounts the two charter bands in the same slot without either displacing the other", () => {
      // The folds are phase-exclusive (the carry-forward owns P2, this owns
      // P3+), so in production only one is ever non-null. The host does not
      // arbitrate that and must not: if it dropped one when the other was
      // present, a future phase window change would silently lose a band.
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriedCharterAssumptions={carriedRows}
          carriesForwardContent={[]}
          charterStandingAfterDiscover={standingRows}
          evidenceNeedPackets={[]}
          move={designMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.getByTestId("charter-assumptions-carry-forward"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("charter-standing-after-discover"),
      ).toBeInTheDocument();
    });

    it("moves_charter_standing_after_discover_v1 ON without moves_capture_v2: the legacy canvas grows no standing band", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          charterStandingAfterDiscover={standingRows}
          evidenceNeedPackets={[]}
          move={designMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // Structural, as above: `openingBand` is a slot on the capture flow, so
      // with v2 off there is nowhere to put the band. Pin the consequence.
      expect(
        screen.queryByTestId("charter-standing-after-discover"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Priya Raman")).not.toBeInTheDocument();
    });

    it("labels a browsed workflow step as viewed instead of falsely complete", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Upload Evidence/i));

      const previousStep = contractStepButton(/Charter Inputs/i);
      expect(previousStep).toHaveClass("visited");
      expect(previousStep).not.toHaveClass("complete");
      expect(previousStep).not.toHaveTextContent("✓");
    });

    it("renders the Finder shell class and data attribute with the expected tab/phase structure", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const root = screen.getByTestId("moves-phase-standalone");
      expect(root).toHaveClass("mxw", "mxw-finder-on");
      expect(root).toHaveAttribute("data-finder-shell", "on");

      expect(
        screen.getByRole("tablist", { name: "Move workspace views" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("complementary", { name: "Move workspace" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /All Moves/i })).toHaveAttribute(
        "href",
        "/strategic-moves",
      );
    });

    it("P1 renders the contract canvas while preserving real workflow controls", async () => {
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={move}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
          syntheticEvidencePackHref={`/api/v1/programs/${move.id}/stage-readiness-evidence-pack?phase=1`}
        />,
      );

      const workbookLink = screen.getByRole("link", {
        name: "Download P2 readiness workbook",
      });
      expect(workbookLink).toHaveAttribute(
        "href",
        `/api/v1/programs/${move.id}/stage-readiness-workbook?phase=1`,
      );
      expect(workbookLink).toHaveAttribute("download");
      const sampleFilesLink = screen.getByRole("link", {
        name: "Download sample upload files",
      });
      expect(sampleFilesLink).toHaveAttribute(
        "href",
        `/api/v1/programs/${move.id}/stage-readiness-evidence-pack?phase=1`,
      );
      expect(sampleFilesLink).toHaveAttribute("download");

      fireEvent.change(
        screen.getByLabelText("Upload completed readiness workbook"),
        {
          target: {
            files: [
              new File([Buffer.from("xlsx")], "completed-workbook.xlsx", {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              }),
            ],
          },
        },
      );
      await waitFor(() => {
        expect(screen.getByText(/Parsed 1\/2 responses/)).toBeInTheDocument();
      });
      expect(
        screen.getByText(/stored 2\/2 pending proposals/),
      ).toBeInTheDocument();
      expect(screen.getByText("1/2 required")).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/programs/${move.id}/stage-readiness-workbook?phase=1`,
        expect.objectContaining({ method: "POST", credentials: "include" }),
      );
      expect(
        screen.getByText("Workbook responses awaiting review"),
      ).toBeInTheDocument();
      expect(screen.getByText(/2\/2 selected/)).toBeInTheDocument();
      expect(screen.getByText("Provide baseline metrics.")).toBeInTheDocument();
      expect(
        screen.getByText("Provide addressable delay volume."),
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Accept selected" }));
      await waitFor(() => {
        expect(screen.getByText(/Review saved/)).toBeInTheDocument();
      });
      expect(
        screen.queryByText(/Stored workbook responses awaiting review/),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Workbook review recorded · 2 accepted/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Workbook responses reviewed"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Accept selected" }),
      ).not.toBeInTheDocument();
      const reviewCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          String(url).includes("/stage-readiness-workbook") &&
          init?.method === "PATCH",
      );
      expect(reviewCall).toBeTruthy();
      expect(JSON.parse(String(reviewCall?.[1]?.body))).toMatchObject({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [
          { proposalId: "proposal-1", disposition: "accepted" },
          { proposalId: "proposal-2", disposition: "accepted" },
        ],
      });
      expect(
        screen.getByText(/readiness 0 ready \/ 1 insufficient \/ 1 unknown/),
      ).toBeInTheDocument();

      const contractCard = screen.getByTestId("mxw-contract-card");
      expect(contractCard).toBeInTheDocument();
      expect(
        within(contractCard).getAllByText(
          "Sponsor contact and progress updates",
        ).length,
      ).toBeGreaterThan(0);
      expect(
        within(contractCard).getByRole("button", { name: /Upload Evidence/i }),
      ).toBeInTheDocument();
      expect(
        within(contractCard).getByRole("button", { name: /Approve & Build/i }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(contractCard).getByRole("button", { name: /Upload Evidence/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Upload evidence for P1" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Upload decision files" }),
      ).toBeInTheDocument();

      fireEvent.click(
        within(contractCard).getByRole("button", { name: /Approve & Build/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Gate approval" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Full phase close executed")).toBeInTheDocument();
      expect(
        screen.getByText(/Approve & Build runs context extract/i),
      ).toBeInTheDocument();
    });

    it("restores a completed workbook review without reopening pending actions", () => {
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialStageReadinessPreview={{
            ok: true,
            proposalSet: {
              artifactId: "proposal-artifact-1",
              artifactVersion: 2,
              proposalSetId: "proposal-set-1",
              transition: { fromPhase: 1, toPhase: 2 },
              status: "accepted",
              proposalCount: 1,
              pendingCount: 0,
              review: {
                status: "accepted",
                acceptedCount: 1,
                rejectedCount: 0,
                needsValidationCount: 0,
                pendingCount: 0,
                readiness: {
                  ready: 0,
                  insufficientEvidence: 1,
                  unknown: 0,
                },
              },
              proposals: [
                {
                  proposalId: "proposal-1",
                  question: "Provide baseline metrics.",
                  response:
                    "Baseline metrics remain unverified pending finance confirmation.",
                  answerState: "insufficient_evidence",
                  disposition: "accepted",
                },
              ],
            },
          }}
          move={move}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(
        screen.getByText(/Workbook review recorded · 1 accepted/),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Workbook responses reviewed"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("1 responses reviewed · 0 still open"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Accept selected" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", {
          name: /Provide baseline metrics.*accepted/,
        }),
      ).toBeDisabled();
    });

    it("keeps a blocked P2 request on P1 with the server-derived why, remains, and next action above the fold", () => {
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={move}
          phaseNavigationStatus={buildPhaseNavigationStatus({
            currentPhase: 1,
            requestedPhase: 1,
            blockedPhase: 2,
          })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const blocker = screen.getByLabelText("Blocked phase request");
      expect(blocker).toHaveTextContent("Discovery cannot begin yet");
      expect(blocker).toHaveTextContent(
        "Review and accept the completed Discovery Workbook",
      );
      expect(blocker).toHaveTextContent("Required");
      expect(blocker).toHaveTextContent(
        "Completed Discovery Workbook reviewed",
      );
      expect(blocker).toHaveTextContent("Optional");
      expect(blocker).toHaveTextContent(
        "Optional supporting evidence attached",
      );
      expect(
        within(blocker).getByRole("button", {
          name: "Review workbook responses",
        }),
      ).toBeInTheDocument();

      const progressCard = screen.getByLabelText("Phase progress");
      expect(within(progressCard).getByText("Next")).toBeInTheDocument();
      expect(progressCard).toHaveTextContent("Review workbook responses");
      expect(progressCard).toHaveTextContent(
        "Workbook uploaded/previewed is not acceptance",
      );
    });

    it("surfaces stored workbook proposals for blocked P2 review without requiring a re-upload", async () => {
      const scrollIntoView = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialStageReadinessPreview={{
            ok: true,
            summary: {
              totalQuestions: 2,
              answeredQuestions: 2,
              requiredAnswered: 2,
              requiredTotal: 2,
              warningCount: 0,
              errorCount: 0,
            },
            proposalSet: {
              artifactId: "proposal-artifact-1",
              artifactVersion: 2,
              transition: { fromPhase: 1, toPhase: 2 },
              status: "review_required",
              proposalCount: 2,
              pendingCount: 2,
              proposals: [
                {
                  proposalId: "proposal-1",
                  questionId: "q-1",
                  dimensionId: "baseline_metrics",
                  requirement: "required",
                  question: "Provide baseline metrics.",
                  response: "Unknown",
                  answerState: "unknown",
                  disposition: "pending",
                },
                {
                  proposalId: "proposal-2",
                  questionId: "q-2",
                  dimensionId: "delay_volume",
                  requirement: "required",
                  question: "Provide addressable delay volume.",
                  response: "Insufficient evidence",
                  answerState: "insufficient_evidence",
                  disposition: "pending",
                },
              ],
            },
          }}
          move={move}
          phaseNavigationStatus={buildPhaseNavigationStatus({
            currentPhase: 1,
            requestedPhase: 1,
            blockedPhase: 2,
          })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Review workbook responses" }),
      );
      expect(scrollIntoView).toHaveBeenCalled();
      expect(
        screen.getByText(
          /Stored workbook responses awaiting review · 2\/2 pending proposals/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Workbook responses awaiting review"),
      ).toBeInTheDocument();
      expect(screen.getByText(/2\/2 selected/)).toBeInTheDocument();
      expect(screen.getByText("Provide baseline metrics.")).toBeInTheDocument();
      expect(
        screen.getByText("Provide addressable delay volume."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Upload evidence for P1" }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Accept selected" }));
      await waitFor(() => {
        expect(screen.getByText(/Review saved/)).toBeInTheDocument();
      });
      const reviewCall = (global.fetch as jest.Mock).mock.calls.find(
        ([url, init]) =>
          String(url).includes("/stage-readiness-workbook") &&
          init?.method === "PATCH",
      );
      expect(reviewCall).toBeTruthy();
      expect(JSON.parse(String(reviewCall?.[1]?.body))).toMatchObject({
        proposalSetArtifactId: "proposal-artifact-1",
        proposalSetArtifactVersion: 2,
        decisions: [
          { proposalId: "proposal-1", disposition: "accepted" },
          { proposalId: "proposal-2", disposition: "accepted" },
        ],
      });
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  // ─── the capture phase strip's totals, AT THE HOST ──────────────────────
  // The strip's "N of M answered" is assembled in this component from two
  // helpers. Each helper has its own suite, so what is untested is precisely
  // the wiring here: whether the host hands them the inputs they need. The
  // route is the one that can be silently dropped — `capturePhaseSectionTotal`
  // takes it as an OPTIONAL second argument, so omitting it type-checks and
  // quietly reports the default question set's size for a Move whose P3 asks a
  // different one. P3 Design is the only route-dependent phase.
  describe("capture phase strip totals (moves_capture_v2)", () => {
    const solutionRoute = (
      overrides: Partial<ConfirmedSolutionRoute> = {},
    ): ConfirmedSolutionRoute => ({
      route: "process_change",
      recommendation: "process_change",
      solutionOutput: "workflow_automation",
      workflowChange: "material",
      roleAccountabilityChange: "material",
      adoptionOwner: "Named business owner",
      adoptionResponsibility: "business",
      decision: "confirm",
      evidenceReference: "evidence-ref",
      validatedBy: "Validator",
      rationale: "Route confirmed against the evidence reviewed at the gate.",
      ...overrides,
    });

    const TECHNICAL_PRODUCT = solutionRoute({
      route: "technical_product",
      recommendation: "technical_product",
      solutionOutput: "data_product",
      workflowChange: "limited",
      roleAccountabilityChange: "none",
    });

    const LIMITED_PROCESS = solutionRoute({
      workflowChange: "limited",
      roleAccountabilityChange: "none",
    });

    const DEFAULT_P3_TOTAL = getPhaseCaptureSections(3, null).length;

    const renderP3Strip = (
      confirmedSolutionRoute: ConfirmedSolutionRoute | null,
    ) => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialConfirmedSolutionRoute={confirmedSolutionRoute}
          move={makeMove({ currentPhase: 3, phaseLabel: "P3 Design" })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );
      return within(
        screen.getByRole("navigation", { name: "Phases" }),
      ).getByRole("button", { name: /^P3/ });
    };

    // Without this the cases below could both pass against a host that ignores
    // the route entirely, because the two question sets would be the same size.
    it("the three P3 question sets really do differ in size", () => {
      expect(getPhaseCaptureSections(3, TECHNICAL_PRODUCT).length).not.toBe(
        DEFAULT_P3_TOTAL,
      );
      expect(getPhaseCaptureSections(3, LIMITED_PROCESS).length).not.toBe(
        DEFAULT_P3_TOTAL,
      );
      expect(getPhaseCaptureSections(3, TECHNICAL_PRODUCT).length).not.toBe(
        getPhaseCaptureSections(3, LIMITED_PROCESS).length,
      );
    });

    it("no confirmed route: the P3 row states the default question total", () => {
      expect(renderP3Strip(null)).toHaveTextContent(
        `0 of ${DEFAULT_P3_TOTAL} answered`,
      );
    });

    it("a confirmed technical-product route: the P3 row states the narrower total", () => {
      const narrower = getPhaseCaptureSections(3, TECHNICAL_PRODUCT).length;
      const tab = renderP3Strip(TECHNICAL_PRODUCT);
      expect(tab).toHaveTextContent(`0 of ${narrower} answered`);
      // and specifically NOT the default set's size, which is what a host that
      // dropped the route would print here.
      expect(tab).not.toHaveTextContent(`of ${DEFAULT_P3_TOTAL} answered`);
    });

    it("a confirmed limited process change: the P3 row states the wider total", () => {
      // This one needs the WHOLE route object to reach the contract, not just
      // its `route` field: the wider set is selected by `workflowChange` and
      // `roleAccountabilityChange` both being non-material.
      const wider = getPhaseCaptureSections(3, LIMITED_PROCESS).length;
      const tab = renderP3Strip(LIMITED_PROCESS);
      expect(tab).toHaveTextContent(`0 of ${wider} answered`);
      expect(tab).not.toHaveTextContent(`of ${DEFAULT_P3_TOTAL} answered`);
    });

    it("the route is read back from the hydration prop, not refetched", () => {
      // `initialConfirmedSolutionRoute` seeds component state. It has been
      // dropped from this component's props before, and that is invisible to
      // an assertion that the strip merely renders: every row still appears,
      // the route-dependent one just states the wrong total. Asserting the
      // narrower figure with no fetch having resolved is what pins the seed.
      const narrower = getPhaseCaptureSections(3, TECHNICAL_PRODUCT).length;
      expect(renderP3Strip(TECHNICAL_PRODUCT)).toHaveTextContent(
        `0 of ${narrower} answered`,
      );
      expect(narrower).not.toBe(DEFAULT_P3_TOTAL);
    });
  });

  // ─── the capture phase strip's SAVED counts, AT THE HOST ─────────────────
  // `moves_capture_phase_rollup_v1`. The strip can measure exactly one row —
  // the phase on screen — so the other five state a bare question count. The
  // rollup lets those five say how much of the phase holds a SAVED answer,
  // from capture-module rows the route already loaded.
  //
  // The derivation and the row's rendering each have their own suite, so what
  // is untested is the wiring in this component: whether the counts reach the
  // strip, whether each lands on its OWN row, and whether the two nouns stay
  // apart. A saved answer is only a persisted non-empty value, while the
  // viewed row's "answered" additionally requires structured validity,
  // evidence readiness and a satisfied charter basis — so a host that passed
  // the rollup where the measured count belongs, or spread one phase's count
  // across the strip, would report work nobody did under the stronger word.
  describe("capture phase strip saved counts (moves_capture_phase_rollup_v1)", () => {
    const P0_TOTAL = getPhaseCaptureSections(0, null).length;
    const P1_TOTAL = getPhaseCaptureSections(1, null).length;
    const P2_TOTAL = getPhaseCaptureSections(2, null).length;
    const P5_TOTAL = getPhaseCaptureSections(5, null).length;

    const renderStrip = (args: {
      savedAnswerCounts?: Readonly<Record<number, number>>;
      confirmedSolutionRoute?: ConfirmedSolutionRoute | null;
      viewedPhase?: number;
    }) => {
      const viewedPhase = args.viewedPhase ?? 1;
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          capturePhaseSavedAnswerCounts={args.savedAnswerCounts}
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialConfirmedSolutionRoute={args.confirmedSolutionRoute ?? null}
          move={makeMove({ currentPhase: 5, phaseLabel: "P1 Charter" })}
          phaseNum={viewedPhase}
          phaseTallies={[...phaseTallies]}
        />,
      );
      const bar = screen.getByRole("navigation", { name: "Phases" });
      return {
        bar,
        row: (code: string) =>
          within(bar).getByRole("button", { name: new RegExp(`^${code}`) }),
      };
    };

    it("an unmeasured row states the saved count the host was handed, under that word", () => {
      const { row } = renderStrip({ savedAnswerCounts: { 0: 4, 2: 6 } });

      // Each count lands on its own phase's row — not one figure repeated, and
      // not another phase's figure, which is the attribution a host assembling
      // the strip can get wrong without changing anything else on screen.
      expect(row("P0")).toHaveTextContent(`4 of ${P0_TOTAL} saved`);
      expect(row("P2")).toHaveTextContent(`6 of ${P2_TOTAL} saved`);
      // and never under the stronger noun
      expect(row("P0")).not.toHaveTextContent("answered");
      expect(row("P2")).not.toHaveTextContent("answered");
    });

    it("a row the rollup says nothing about keeps its bare question count", () => {
      // The vacuity guard for the case above: the counts are read per phase,
      // so a phase with no entry is unchanged rather than borrowing one.
      const { row } = renderStrip({ savedAnswerCounts: { 0: 4, 2: 6 } });

      expect(row("P5")).toHaveTextContent(`${P5_TOTAL} questions`);
      expect(row("P5")).not.toHaveTextContent("saved");
    });

    it("the viewed row keeps its measured count even when the rollup names it", () => {
      // One figure per row, and on the row the screen CAN measure it must be
      // the measured one. Nothing here has been answered, so the live count is
      // 0 — strictly below the 6 the rollup offers, which is what makes a host
      // that preferred the rollup visible.
      const { row } = renderStrip({ savedAnswerCounts: { 1: 6 } });

      expect(row("P1")).toHaveTextContent(`0 of ${P1_TOTAL} answered`);
      expect(row("P1")).not.toHaveTextContent("saved");
    });

    it("no rollup supplied (flag off): no row claims a saved count", () => {
      const { bar, row } = renderStrip({});

      expect(row("P0")).toHaveTextContent(`${P0_TOTAL} questions`);
      expect(bar).not.toHaveTextContent("saved");
    });

    it("a fully saved unmeasured row still earns no completion tick", () => {
      // The invariant that must survive the rollup: a tick is a claim that the
      // phase is complete, and saved answers are not measured ones. This is the
      // ticked-but-blank row's defect arriving from the other direction.
      const { row } = renderStrip({ savedAnswerCounts: { 0: P0_TOTAL } });

      expect(row("P0")).toHaveTextContent(`${P0_TOTAL} of ${P0_TOTAL} saved`);
      expect(within(row("P0")).queryByLabelText("complete")).toBeNull();
    });

    it("a saved count is stated against the same route-aware total as its row", () => {
      // P3 Design is the only phase whose question set depends on the Move's
      // confirmed route, and the count was derived against that route-aware
      // set server-side. If the host states the row's total without the route,
      // the pair disagrees about which questions the phase even asks — the
      // same dropped argument the totals above guard, now on the weaker noun.
      const narrower = getPhaseCaptureSections(3, {
        route: "technical_product",
        recommendation: "technical_product",
        solutionOutput: "data_product",
        workflowChange: "limited",
        roleAccountabilityChange: "none",
        adoptionOwner: "Named business owner",
        adoptionResponsibility: "business",
        decision: "confirm",
        evidenceReference: "evidence-ref",
        validatedBy: "Validator",
        rationale: "Route confirmed against the evidence reviewed at the gate.",
      }).length;
      const defaultTotal = getPhaseCaptureSections(3, null).length;
      expect(narrower).not.toBe(defaultTotal);

      const { row } = renderStrip({
        savedAnswerCounts: { 3: narrower - 1 },
        confirmedSolutionRoute: {
          route: "technical_product",
          recommendation: "technical_product",
          solutionOutput: "data_product",
          workflowChange: "limited",
          roleAccountabilityChange: "none",
          adoptionOwner: "Named business owner",
          adoptionResponsibility: "business",
          decision: "confirm",
          evidenceReference: "evidence-ref",
          validatedBy: "Validator",
          rationale:
            "Route confirmed against the evidence reviewed at the gate.",
        },
      });

      expect(row("P3")).toHaveTextContent(
        `${narrower - 1} of ${narrower} saved`,
      );
      expect(row("P3")).not.toHaveTextContent(`of ${defaultTotal} saved`);
    });
  });

  describe("Moves workspace navigation", () => {
    it("keeps compact phase and workspace controls reachable on narrow screens", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const compactNav = screen.getByLabelText("Compact move navigation");
      const phaseSelect =
        within(compactNav).getByLabelText("Switch move phase");
      expect(phaseSelect).toBeInTheDocument();
      expect(phaseSelect).toHaveValue("3");
      expect(
        within(compactNav).getByRole("tab", { hidden: true, name: "Stage" }),
      ).toHaveAttribute("aria-selected", "true");

      fireEvent.click(
        within(compactNav).getByRole("tab", { hidden: true, name: "Files" }),
      );
      expect(
        screen.getByRole("heading", { name: "Files & Evidence" }),
      ).toBeInTheDocument();

      fireEvent.change(phaseSelect, { target: { value: "2" } });
      expect(mockRouterPush).toHaveBeenCalledWith(
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/2",
      );
    });

    it("the compact step picker opens an existing workflow step and returns to an input", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const picker = screen.getByLabelText("P3 step") as HTMLSelectElement;
      const firstInput = picker.querySelector<HTMLOptionElement>(
        'option[value^="input:"]',
      );
      expect(firstInput).not.toBeNull();
      fireEvent.change(picker, { target: { value: "workflow:2" } });
      expect(contractStepButton(/Record Decision/i)).toHaveClass("active");
      fireEvent.change(picker, { target: { value: firstInput!.value } });
      expect(contractStepButton(firstInput!.textContent ?? "")).toHaveClass(
        "active",
      );
    });

    it("the compact P0 picker changes the rendered step detail", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 0 })}
          phaseNum={0}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const picker = screen.getByLabelText("P0 step") as HTMLSelectElement;
      const secondWorkflow = picker.querySelector<HTMLOptionElement>(
        'option[value="workflow:1"]',
      );
      expect(secondWorkflow).not.toBeNull();
      fireEvent.change(picker, { target: { value: secondWorkflow!.value } });
      expect(picker).toHaveValue("workflow:1");
      expect(
        within(screen.getByTestId("mxw-finder-steps")).getByRole("heading", {
          name: secondWorkflow!.textContent ?? "",
        }),
      ).toBeInTheDocument();
    });

    it("uses one desktop workspace tab row without a second left rail", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.queryByLabelText("Move workspace")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /workspace rail/i }),
      ).not.toBeInTheDocument();
      expect(workspaceTab("Steps")).toHaveAttribute("aria-selected", "true");
      expect(workspaceTab("Files & Evidence")).toBeInTheDocument();
      expect(workspaceTab("Intelligence")).toBeInTheDocument();
      expect(workspaceTab("Approvals")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /All Moves/i })).toHaveAttribute(
        "href",
        "/strategic-moves",
      );
      expect(
        screen.getByRole("navigation", { name: "P3 steps" }),
      ).toBeInTheDocument();
    });

    it("keeps workspace tabs available when switching from steps to another view", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      expect(workspaceTab("Approvals")).toHaveAttribute(
        "aria-selected",
        "true",
      );
      fireEvent.click(workspaceTab("Steps"));
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      expect(workspaceTab("Steps")).toHaveAttribute("aria-selected", "true");
    });

    it("the top phase stepper links a reachable phase to its route", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const stepper = screen.getByRole("navigation", { name: "Phase steps" });
      const phaseLink = within(stepper).getByTitle(
        "Discover & Diagnose · 2 of 2 gate criteria",
      );
      expect(phaseLink.tagName).toBe("A");
      expect(phaseLink).toHaveAttribute(
        "href",
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/2",
      );
    });
  });

  describe("MOVES-UI-002 approvals overview", () => {
    it("opens the overview even when the old feature flag mock is false", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));

      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Approvals overview")).toBeInTheDocument();
    });

    it("opens the overview list with every row reproducible from the mocked getMovePhaseTallies output alone", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));

      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      const overview = screen.getByLabelText("Approvals overview");

      // P0-P2 are "done" in the mocked tallies. The row states the gate
      // passed, which advancement does evidence; it does not state an
      // approval, which nothing on this surface read. Conformed from
      // "Approved" when the claim was removed.
      expect(screen.getAllByText("Gate passed").length).toBe(3);
      expect(within(overview).queryByText("Approved")).not.toBeInTheDocument();
      // P3 is "current" with met=0/total=2. The status states only the status
      // now; the quantity lives once, in the tally column, sourced only from
      // the mocked row's met/total fields.
      expect(screen.getByText("Not yet submitted")).toBeInTheDocument();
      expect(screen.getAllByText("0 of 2 met").length).toBeGreaterThan(0);
      expect(within(overview).queryByText(/0\/2 met/)).not.toBeInTheDocument();
      // P4/P5 are "upcoming" -> Not reached.
      expect(screen.getAllByText("Not reached").length).toBe(2);
      expect(within(overview).queryByText("Sponsor")).not.toBeInTheDocument();
      // The approver column no longer names a party. Conformed from six rows
      // of a constant string that no approval record backed.
      expect(within(overview).getAllByText("Not recorded")).toHaveLength(6);
      expect(
        within(overview).queryByText("Authorized workspace user"),
      ).not.toBeInTheDocument();
    });

    // The host's own call sites into `approvals-overview-labels`. Each of the
    // three cells below was previously decided inside this component, so a
    // host that re-inlines its own text would pass the pure module's suite and
    // still render the claim. These cases pin the wiring, not the decision.
    it("the host builds the approver cell from a record, so it cannot name one it was not given", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      const overview = screen.getByLabelText("Approvals overview");

      // Six rows, six absences, and every one styled as an absence rather
      // than as a name. The `unassigned` class was dead code before: the old
      // constant could never equal the string the class was gated on.
      const absences = within(overview).getAllByText("Not recorded");
      expect(absences).toHaveLength(6);
      for (const cell of absences) {
        expect(cell.className).toContain("unassigned");
      }
    });

    it("the host carries each row's tally noun and each status's basis in a title", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      const overview = screen.getByLabelText("Approvals overview");

      // The tally cell is bare in its text; the set it counts is named on
      // hover, so the figure is labelled somewhere even when the column head
      // has scrolled away.
      const tally = within(overview).getAllByText("0 of 2 met")[0];
      expect(tally.getAttribute("title")).toBe("0 of 2 gate criteria met");

      // A passed gate says, on hover, that its reading is inferred from
      // advancement and that no approval record was read.
      const passed = within(overview).getAllByText("Gate passed")[0];
      expect(passed.getAttribute("title")).toMatch(/advanced past/i);
      expect(passed.getAttribute("title")).toMatch(/no approval record/i);
    });

    it("no row of the overview states the same quantity twice", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      const overview = screen.getByLabelText("Approvals overview");

      // One quantity per row, in the tally column only. Asserted over the
      // status cells' own text nodes: a container-wide assertion here would
      // be satisfied by the tally sibling in the same row.
      const statuses = Array.from(
        overview.querySelectorAll(".mxw-approvals-status"),
      );
      expect(statuses).toHaveLength(6);
      for (const status of statuses) {
        expect(status.textContent ?? "").not.toMatch(/\d/);
      }
    });

    it("current-phase row: Review & approve returns to the phase workspace at the approve substep", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      const overview = screen.getByLabelText("Approvals overview");
      fireEvent.click(
        within(overview).getByRole("button", { name: /Review & approve/i }),
      );

      expect(contractStepButton(/Approve & Build/i)).toHaveClass(
        "mxw-contract-step",
        "active",
      );
      expect(screen.queryByText("Approvals overview")).not.toBeInTheDocument();
    });

    it("another reachable phase row: Review & approve is a real link to that phase's route", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(workspaceTab("Approvals"));
      const overview = screen.getByLabelText("Approvals overview");

      const links = within(overview).getAllByRole("link", {
        name: /Review & approve/i,
      });
      // P0, P1, P2 are reachable (<= currentPhase 3) and are not the viewed
      // phase (P3), so each renders a real Link to its own phase route.
      expect(links.map((link) => link.getAttribute("href"))).toEqual([
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/0",
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/1",
        "/strategic-moves/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase/2",
      ]);

      // P4/P5 are not yet reachable — no link, no button, just a plain label.
      expect(within(overview).getAllByText("Not yet reachable").length).toBe(2);
    });
  });

  it("does not render the retired P0 originate form inside the phase workspace", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Review the captured Move brief and approve the gate",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue to Frame →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review P0 gate →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open gate link" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Capture each section by talking to aVa/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Promote to P1 Charter/i),
    ).not.toBeInTheDocument();
  });

  it("honors P0 focus=gate by opening gate approval instead of the retired form", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Approve gate →" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/What's the bet \/ hypothesis/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Let aVa draft this/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Promote to P1 Charter/i),
    ).not.toBeInTheDocument();
  });

  it("gates P0 gate approval behind a confirmation dialog and shows the signed-in approver identity", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentUser={{ email: "jane@apex-retail.com", role: "client_admin" }}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Approve gate →" })[0],
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/Approving as: jane@apex-retail.com/i),
    ).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-gate-approval"),
      ),
    ).toBe(false);

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Approve gate" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/phase-gate-approval"),
        ),
      ).toBe(true);
    });
  });

  it("cancelling the P0 gate approval confirmation leaves the gate unapproved", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "Approve gate →" })[0],
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-gate-approval"),
      ),
    ).toBe(false);
    expect(
      screen.getAllByRole("button", { name: "Approve gate →" })[0],
    ).toBeInTheDocument();
  });

  it("shows completed P0 as read-only when the Move has already advanced to P1", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    // A phase the Move has only ADVANCED PAST is read-only on a passed gate,
    // not on a read approval: nothing on this screen fetches an approval
    // record. Assert the new claim, and that the old one is gone — over the
    // joined text of each node, because the tick and the sentence are separate
    // nodes inside one element.
    expect(screen.getAllByText(/gate has passed/i).length).toBeGreaterThan(0);
    expect(
      screen
        .queryAllByText(
          /\bis already approved\b|\bthe approved (output|record)\b/i,
        )
        .map((n) => n.textContent),
    ).toEqual([]);
    expect(
      screen.getAllByRole("button", { name: /Continue to P1 Charter/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Approve gate →" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Gate criteria" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Blocking hard gate")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Carry-forward soft criteria"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Originate a strategic move"),
    ).not.toBeInTheDocument();
  });

  it("renders terminal P5 as complete and routes the primary action to Tower", () => {
    const terminalTallies = phaseTallies.map((row) => ({
      ...row,
      met: row.total,
      state: "done" as const,
    }));

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Mobilize & Handoff",
          terminalComplete: true,
        })}
        phaseNum={5}
        phaseTallies={terminalTallies}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Mobilize & Handoff\s+2 of 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Open Tower →")).toBeInTheDocument();
    expect(
      screen.getByText(
        /P5's gate has passed and the Move handed off to Tower/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen
        .queryAllByText(
          /\bis already approved\b|\bthe approved (output|record)\b/i,
        )
        .map((n) => n.textContent),
    ).toEqual([]);
    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      "Open Tower",
    );
    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      "Tower handoff complete",
    );
    expect(screen.getByLabelText("Phase progress")).not.toHaveTextContent(
      "Run Approve & Build",
    );
    expect(screen.queryByText(/^Open$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Complete this phase/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Attest and advance to Tower handoff/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Complete the steps above/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Session Pack/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Execution & Readiness/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Continue to P5 Mobilize & Handoff/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the saved seven-answer P0 brief separately from gate criteria", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
          name: "Member Service Agent Assist",
          archetype: "Contact Center Agent Assist",
          charter: {
            scaffold: {
              problem_statement:
                "Members experience long calls because agents navigate multiple systems.",
              archetype: "Contact Center Agent Assist",
              sponsor_candidate: "Chief Digital and Information Officer",
              scope_boundary:
                "In: claims status, prior auth, eligibility, benefits, CRM history, knowledge lookup. Out: clinical decisions.",
              evidence_family:
                "Member-service metrics, call transcripts, CRM history, claims/auth/benefits samples, knowledge base, systems inventory.",
              value_hypothesis:
                "Reduce avoidable handle time, repeat contact, transfers, and after-call work.",
              foundation_readiness:
                "Cloud data foundation must prove source ownership, quality, access, and PHI controls.",
            },
          },
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    // Conformed: the header used to assert the BARE figure "7 of 7" and a
    // heading that hard-coded the row count as a word. Both were copies of a
    // fact the row set already states.
    expect(
      screen.getByText("Review the Originate answers saved here"),
    ).toBeInTheDocument();
    expect(screen.getByText("7 of 7 answers captured")).toBeInTheDocument();
    expect(screen.queryByText("7 of 7")).not.toBeInTheDocument();
    expect(screen.getByText("Move name")).toBeInTheDocument();
    expect(
      screen.getAllByText("Member Service Agent Assist").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText("Business problem / opportunity"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Members experience long calls/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Sponsor / title")).toBeInTheDocument();
    expect(
      screen.getByText(/Chief Digital and Information Officer/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Gate criteria" }),
    ).toBeInTheDocument();
  });

  // The captured-brief review's figure. It rendered a bare `{capturedCount} of
  // 7` — no noun in the visible element and no `title` attribute — on a screen
  // that also carries the capture strip's "N questions" / "N of M answered"
  // and the stepper's "N of M gate criteria". The denominator was a literal,
  // a third copy of a count the row set and the heading each stated too.
  it("renders the brief-review tally from the row set, nouned, with no bare figure", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
          name: "Member Service Agent Assist",
          archetype: "",
          charter: {
            scaffold: {
              problem_statement: "Members wait on hold while agents search.",
              sponsor_candidate: "Chief Digital and Information Officer",
              scope_boundary: "In: claims status. Out: clinical decisions.",
            },
          },
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    // Three of the seven rows hold a saved value, so the numerator is not the
    // denominator and the figure cannot be a constant.
    expect(screen.getByText("3 of 7 answers captured")).toBeInTheDocument();
    expect(screen.queryByText("3 of 7")).not.toBeInTheDocument();
    expect(screen.queryByText("7 of 7")).not.toBeInTheDocument();
  });

  it("states the brief-review row count once, in the figure, never in the heading", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 0,
          phaseLabel: "P0 Originate",
          name: "Member Service Agent Assist",
          charter: { scaffold: { problem_statement: "Members wait on hold." } },
        })}
        phaseNum={0}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const heading = screen.getByRole("heading", {
      name: /Review the Originate answers/i,
    });
    // A numeral or a number word in the heading is a second copy of the row
    // count, free to disagree with the figure the moment a row moves.
    expect(heading.textContent ?? "").not.toMatch(/\d/);
    expect(heading.textContent ?? "").not.toMatch(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
    );
  });

  it("frames P1 as a posture hypothesis, not a solution approach recommendation", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="prepare"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Initial transformation posture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Charter inputs" }),
    ).toBeInTheDocument();
    const sponsorField = screen.getByLabelText(
      "Sponsor contact and progress updates",
    ) as HTMLTextAreaElement;
    expect(sponsorField.value).toBe("");
    // The empty box guides with a worked example, not the prompt echoed back as
    // ghost text (which read as pre-filled).
    expect(sponsorField.placeholder).toMatch(/^e\.g\./);
    expect(sponsorField.placeholder).not.toMatch(
      /resolvable workspace identity/i,
    );
    expect(
      (screen.getByLabelText("Scope boundary") as HTMLTextAreaElement).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Success criteria") as HTMLTextAreaElement).value,
    ).toBe("");
    expect(
      screen.getByText(/starting hypothesis for P2 discovery/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Improve the current process")).toBeInTheDocument();
    expect(
      screen.getByText("Explore a balanced transformation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Evaluate major transformation potential"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Decide the approach" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Phased platform + operating-model shift"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/aVa recommends/i)).not.toBeInTheDocument();
  });

  it("shows synthetic P1 reference content without capturing it or crediting the gate", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialReferenceDraftValues={{
          sponsor_commitment:
            "List the accountable sponsor contact and confirm whether phase-progress emails are wanted.",
        }}
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.getByText("AbarVa reference draft")).toBeInTheDocument();
    expect(
      screen.getByText(
        "List the accountable sponsor contact and confirm whether phase-progress emails are wanted.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not client-provided, captured, approved, or evidence/i),
    ).toBeInTheDocument();
    expect(
      (
        screen.getByLabelText(
          "Sponsor contact and progress updates",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("");
    expect(screen.queryByText("Captured · gate open")).not.toBeInTheDocument();
  });

  it("does not mark a typed P1 draft done when the server save fails", async () => {
    const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (
          url.includes("/api/v1/programs/") &&
          url.includes("/phase-capture") &&
          init?.method === "POST"
        ) {
          return {
            ok: false,
            status: 500,
            json: async () => ({
              error: "synthetic_save_failure",
              detail: "Synthetic save failure",
            }),
          } as Response;
        }
        return defaultFetch?.(input, init) as Promise<Response>;
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="prepare"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    const sponsorInput = screen.getAllByLabelText(
      "Sponsor contact and progress updates",
    )[0] as HTMLTextAreaElement;
    fireEvent.change(sponsorInput, {
      target: {
        value:
          "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.",
      },
    });

    expect(screen.queryByText(/^Done$/i)).not.toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getAllByText(/^Unsaved$/i).length).toBeGreaterThan(0);
      },
      { timeout: 2_000 },
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Synthetic save failure/i,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));
    expect(
      screen.getByRole("button", {
        name: /Complete phase inputs before build/i,
      }),
    ).toBeDisabled();
    expect(
      screen.getAllByText(
        /Resolve 1 unsaved phase input before Approve & Build/i,
      ).length,
    ).toBeGreaterThan(0);
  });

  it("keeps a saved P1 field evidence-open until its source is approved", async () => {
    const savedText =
      "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.";
    const { unmount } = render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureRevision="revision-before-edit"
        initialSubstepKey="prepare"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    const sponsorInput = screen.getAllByLabelText(
      "Sponsor contact and progress updates",
    )[0] as HTMLTextAreaElement;
    fireEvent.change(sponsorInput, {
      target: { value: savedText },
    });

    await waitFor(
      () => {
        expect(screen.getAllByText("Evidence open").length).toBeGreaterThan(0);
      },
      { timeout: 2_000 },
    );
    const phaseCaptureCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).includes("/phase-capture"),
    );
    expect(phaseCaptureCall).toBeTruthy();
    const phaseCaptureBody = JSON.parse(
      String(phaseCaptureCall?.[1]?.body ?? "{}"),
    );
    expect(phaseCaptureBody).toEqual(
      expect.objectContaining({
        expectedRevision: "revision-before-edit",
        phase: 1,
        sections: { sponsor_commitment: savedText },
      }),
    );

    unmount();
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureRevision="revision-after-edit"
        initialPhaseCaptureValues={{ sponsor_commitment: savedText }}
        initialSubstepKey="prepare"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );
    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    expect(
      (
        screen.getAllByLabelText(
          "Sponsor contact and progress updates",
        )[0] as HTMLTextAreaElement
      ).value,
    ).toBe(savedText);
    expect(screen.getAllByText("Evidence open").length).toBeGreaterThan(0);
  });

  it("keeps a saved P1 input blocked until its matching evidence is approved", () => {
    const move = makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" });
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={{
          sponsor_commitment:
            "Elena Park, VP Member Services | elena@example.test | weekly updates.",
        }}
        move={move}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    expect(screen.getByText("Evidence for this step")).toBeInTheDocument();
    expect(
      screen.getByText(/step stays locked until that evidence is approved/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & continue" }),
    ).toBeDisabled();
  });

  it("routes an in-step P1 upload to that input and keeps it pending human review", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={{
          sponsor_commitment:
            "Elena Park, VP Member Services | elena@example.test | weekly updates.",
        }}
        move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    fireEvent.change(screen.getByLabelText("Add evidence for this step"), {
      target: {
        files: [
          new File(["synthetic sponsor contact source"], "contact.csv", {
            type: "text/csv",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(uploadedEvidenceRoutes).toContainEqual({
        fileName: "contact.csv",
        phase: 1,
        evidenceFamily: "charter_sponsor",
      });
    });
    expect(
      screen.getByText(/awaiting human review before generation/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & continue" }),
    ).toBeDisabled();
  });

  it("advances a P1 input with its approved family while the transition workbook remains open", () => {
    const move = makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" });
    const [basePacket] = coveredEvidencePacketsForPhase(1);
    const openWorkbookPacket = {
      ...basePacket!,
      evidenceSlot: "P1 to P2 readiness workbook",
      familyId: "p1_to_p2_readiness_workbook",
      status: "missing" as const,
    };
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[openWorkbookPacket]}
        initialPhaseCaptureValues={{
          sponsor_commitment:
            "Elena Park, VP Member Services | elena@example.test | weekly updates.",
        }}
        initialApprovedP1CaptureEvidenceReferences={[
          {
            evidenceId: "p1-sponsor-evidence",
            title: "Progress contact source",
            familyKey: "charter_sponsor",
          },
        ]}
        move={move}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      contractStepButton(/Sponsor contact and progress updates/i),
    );
    expect(
      screen.getByRole("button", { name: "Save & continue" }),
    ).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Save & continue" }));
    expect(
      screen.getByRole("heading", { name: "Scope boundary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & continue" }),
    ).toBeDisabled();
  });

  it("uses P1 step 2 for uploading evidence, with multiple files enabled", async () => {
    const p1EvidencePackets = coveredEvidencePacketsForPhase(2).map(
      (packet) => ({
        ...packet,
        evidenceSlot: "Current-state workflow evidence",
        familyId: "current_state_workflow_map",
      }),
    );
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={p1EvidencePackets}
        initialSubstepKey="decide"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Upload evidence for P1" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Files to upload" }),
    ).toBeInTheDocument();
    expect(contractStepButton(/Approve & Build/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Charter inputs" }),
    ).not.toBeInTheDocument();

    const input = screen.getByLabelText(
      "Upload decision files",
    ) as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");
    fireEvent.change(
      screen.getByLabelText("Required evidence family (optional)"),
      { target: { value: "current_state_workflow_map" } },
    );

    fireEvent.change(input, {
      target: {
        files: [
          new File(["scope"], "scope-boundary.xlsx", {
            type: "application/vnd.ms-excel",
          }),
          new File(["notes"], "sponsor-review.docx", {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(screen.getByText("scope-boundary.xlsx")).toBeInTheDocument();
      expect(screen.getByText("sponsor-review.docx")).toBeInTheDocument();
    });
    // The list is real lifecycle data re-fetched from the artifact vault after
    // upload, not an ephemeral client-side echo of what was just picked.
    expect(screen.getAllByText(/v1 · draft/).length).toBe(2);
    expect(uploadedEvidenceRoutes).toEqual([
      {
        fileName: "scope-boundary.xlsx",
        phase: 1,
        evidenceFamily: "current_state_workflow_map",
      },
      {
        fileName: "sponsor-review.docx",
        phase: 1,
        evidenceFamily: "current_state_workflow_map",
      },
    ]);
    expect(
      screen.getByText(/awaiting human review before generation/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Files & Evidence" }),
    ).toBeInTheDocument();
  });

  it("does not report an upload as usable evidence when parsing did not create a review record", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="decide"
        move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(screen.getByLabelText("Upload decision files"), {
      target: {
        files: [new File(["test"], "parser-failure.csv", { type: "text/csv" })],
      },
    });

    expect(
      await screen.findByText(/not available to generation/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/parser did not produce a review record/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/^Uploaded parser-failure\.csv$/),
    ).not.toBeInTheDocument();
  });

  it("routes P2 current-state uploads through readiness evidence families instead of generic artifact upload", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={{
          ...makeCurrentStateReadiness(),
          archetypeId: "COMMERCIAL_LENDING_AGENT_ASSIST",
          archetypeName: "Commercial Lending Agent Assist",
          hardGaps: [
            "commercial_lending_metrics_baseline",
            "lending_systems_data_landscape",
          ],
          instruments: [
            {
              key: "commercial_lending_metrics_baseline",
              label: "Commercial lending metrics baseline",
              kind: "metric_baseline",
              whyNeeded:
                "Cycle time, rework, queue aging, exception volume, and service-level baseline.",
              sourceDocHint: "Metrics export",
              severity: "hard",
              status: "missing",
              backingTable: "program_evidence_items",
              committedRows: 0,
              rationale:
                "Commercial Lending Agent Assist requires baseline metrics at diagnose.",
              documentFamily: true,
              pendingReviews: [],
              evidenceDigest: [],
            },
            {
              key: "lending_systems_data_landscape",
              label: "Lending systems and data landscape",
              kind: "document",
              whyNeeded:
                "Applications, data stores, integrations, ownership, and source-of-truth constraints.",
              sourceDocHint: "Systems inventory",
              severity: "hard",
              status: "missing",
              backingTable: "program_evidence_items",
              committedRows: 0,
              rationale:
                "Commercial Lending Agent Assist requires systems context at diagnose.",
              documentFamily: true,
              pendingReviews: [],
              evidenceDigest: [],
            },
          ],
        }}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Upload evidence into the P2 readiness map",
      }),
    ).toBeInTheDocument();

    const input = screen.getByLabelText(
      "Upload P2 current-state evidence files",
    ) as HTMLInputElement;
    expect(input).toHaveAttribute("multiple");

    fireEvent.change(input, {
      target: {
        files: [
          new File(["metrics"], "commercial-loan-onboarding-metrics.csv", {
            type: "text/csv",
          }),
          new File(["systems"], "systems-data-inventory.csv", {
            type: "text/csv",
          }),
        ],
      },
    });

    await waitFor(() => {
      expect(currentStateFamilyIngests).toEqual([
        {
          family: "commercial_lending_metrics_baseline",
          fileName: "commercial-loan-onboarding-metrics.csv",
          phase: 2,
        },
        {
          family: "lending_systems_data_landscape",
          fileName: "systems-data-inventory.csv",
          phase: 2,
        },
      ]);
    });
    expect(uploadedEvidenceArtifacts).toHaveLength(0);
  });

  it("routes contact-center evidence by its declared family and leaves unknown files unmapped", async () => {
    const base = makeCurrentStateReadiness();
    const families = [
      [
        "member_service_process_map",
        "Member-service process and escalation map",
      ],
      [
        "member_service_metrics_baseline",
        "Contact-center performance baseline",
      ],
      [
        "member_service_systems_data_landscape",
        "Member-service systems and data landscape",
      ],
      [
        "knowledge_policy_content_inventory",
        "Knowledge, policy, and script inventory",
      ],
    ] as const;

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={{
          ...base,
          archetypeId: "CONTACT_CENTER_AGENT_ASSIST",
          archetypeName: "Contact Center Agent Assist",
          instruments: families.map(([key, label]) => ({
            ...base.instruments[0],
            key,
            label,
            kind:
              key === "member_service_metrics_baseline"
                ? "metric_baseline"
                : "document",
            severity: "hard",
            status: "missing",
            backingTable: null,
            documentFamily: true,
            pendingReviews: [],
            evidenceDigest: [],
          })),
          hardGaps: families.map(([key]) => key),
        }}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Upload P2 current-state evidence files"),
      {
        target: {
          files: [
            new File(["workflow"], "workflow_walkthrough.csv", {
              type: "text/csv",
            }),
            new File(["metrics"], "monthly_kpi_baseline.csv", {
              type: "text/csv",
            }),
            new File(["systems"], "system_inventory.csv", { type: "text/csv" }),
            new File(["knowledge"], "knowledge_inventory.csv", {
              type: "text/csv",
            }),
            new File(["unrelated"], "unmapped_notes.csv", { type: "text/csv" }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(currentStateFamilyIngests).toEqual([
        {
          family: "member_service_process_map",
          fileName: "workflow_walkthrough.csv",
          phase: 2,
        },
        {
          family: "member_service_metrics_baseline",
          fileName: "monthly_kpi_baseline.csv",
          phase: 2,
        },
        {
          family: "member_service_systems_data_landscape",
          fileName: "system_inventory.csv",
          phase: 2,
        },
        {
          family: "knowledge_policy_content_inventory",
          fileName: "knowledge_inventory.csv",
          phase: 2,
        },
      ]);
    });
    expect(document.body.textContent?.replace(/\s+/g, " ") ?? "").toMatch(
      /No open current-state family matched this file/i,
    );
    expect(uploadedEvidenceArtifacts).toHaveLength(0);
  });

  it("uploads workshop notes as review-pending session artifacts instead of mis-mapping them to a P2 family", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(screen.getByLabelText("P2 upload mode"), {
      target: { value: "session_notes" },
    });
    fireEvent.change(
      screen.getByLabelText("Upload P2 current-state evidence files"),
      {
        target: {
          files: [
            new File(["workshop notes"], "operations_workshop_45m.md", {
              type: "text/markdown",
            }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(uploadedEvidenceArtifacts).toHaveLength(1);
      expect(uploadedEvidenceArtifacts[0]?.family).toBe("session_artifact");
      expect(document.body.textContent?.replace(/\s+/g, " ") ?? "").toMatch(
        /1 session file parsed and awaiting human review/i,
      );
    });
    expect(currentStateFamilyIngests).toEqual([]);
    expect(structuredFamilyIngests).toEqual([]);
  });

  // The gap card says "Upload CMDB export as CSV". Before this dispatch the
  // only uploader on the step routed canonical-backed families to the document
  // path, which cannot map them, so a user following that instruction exactly
  // could not succeed. These pin both halves of the routing decision.
  it("sends a canonical-backed family to the structured loader, not the document path", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Upload P2 current-state evidence files"),
      {
        target: {
          files: [
            new File(["repo,team"], "dora_delivery_baseline.csv", {
              type: "text/csv",
            }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(structuredFamilyIngests).toEqual([
        {
          family: "eng_performance_dora",
          fileName: "dora_delivery_baseline.csv",
        },
      ]);
    });
    // NEGATIVE: it must not also travel the document path, which would create a
    // review-required duplicate of a row already committed to the tower table.
    expect(currentStateFamilyIngests).toEqual([]);
    // The success row is set after an awaited fetch, so retry until React has
    // flushed it. Flexible matcher because label and detail are sibling nodes.
    await waitFor(() => {
      expect(document.body.textContent?.replace(/\s+/g, " ") ?? "").toMatch(
        /Committed 10 of 10 parsed rows to readiness/i,
      );
    });
  });

  it("reports parsed-but-not-committed as a failure, never as an upload", async () => {
    // Parsing is not committing. A schema that parses while zero rows land in
    // the canonical table must not read as success.
    structuredIngestResponse = {
      parsedRows: 10,
      committedRows: 0,
      errors: ["row 4: criticality required"],
    };

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Upload P2 current-state evidence files"),
      {
        target: {
          files: [
            new File(["repo,team"], "dora_delivery_baseline.csv", {
              type: "text/csv",
            }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(document.body.textContent?.replace(/\s+/g, " ") ?? "").toMatch(
        /criticality required.*parsed 10 rows, committed 0/i,
      );
    });
  });

  it("routes airline P2 uploads by active readiness family labels", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={{
          ...makeCurrentStateReadiness(),
          archetypeId: "AIRLINE_DISRUPTION_RECOVERY",
          archetypeName: "Airline Disruption Recovery",
          hardGaps: ["incumbent_performance", "sla_baseline", "vendor_spend"],
          instruments: [
            {
              ...makeCurrentStateReadiness().instruments[0],
              key: "incumbent_performance",
              label: "Incumbent performance",
              documentFamily: true,
            },
            {
              ...makeCurrentStateReadiness().instruments[0],
              key: "sla_baseline",
              label: "SLA baseline",
              documentFamily: true,
            },
            {
              ...makeCurrentStateReadiness().instruments[0],
              key: "vendor_spend",
              label: "Vendor spend",
              documentFamily: true,
            },
          ],
        }}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.change(
      screen.getByLabelText("Upload P2 current-state evidence files"),
      {
        target: {
          files: [
            new File(["cases"], "incumbent_performance_cases.csv", {
              type: "text/csv",
            }),
            new File(["sla"], "sla_baseline_targets.csv", {
              type: "text/csv",
            }),
            new File(["spend"], "vendor_spend_extract.csv", {
              type: "text/csv",
            }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(currentStateFamilyIngests).toEqual([
        {
          family: "incumbent_performance",
          fileName: "incumbent_performance_cases.csv",
          phase: 2,
        },
        {
          family: "sla_baseline",
          fileName: "sla_baseline_targets.csv",
          phase: 2,
        },
        {
          family: "vendor_spend",
          fileName: "vendor_spend_extract.csv",
          phase: 2,
        },
      ]);
    });
  });

  it("shows empty P1 charter capture fields as missing until real values are captured", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Charter Inputs/i));
    expect(
      screen.getByRole("heading", { name: "Charter inputs" }),
    ).toBeInTheDocument();
    expect(
      (
        screen.getByLabelText(
          "Sponsor contact and progress updates",
        ) as HTMLTextAreaElement
      ).value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Scope boundary") as HTMLTextAreaElement).value,
    ).toBe("");
    fireEvent.click(contractStepButton(/Approve & Build/i));

    const buildButton = screen.getByRole("button", {
      name: /Complete phase inputs before build/i,
    });
    expect(buildButton).toBeDisabled();
  });

  it("keeps solution approach selection in P3 after discovery evidence", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="options"
        move={makeMove({
          name: "Meridian Member Experience AI Assist",
          archetype: "Contact Center Agent Assist",
          tenant: {
            id: "tenant-meridian",
            name: "Healthcare Demo",
            industryCode: "healthcare_provider",
          },
          charter: {
            scaffold: {
              problem_statement:
                "Agents navigate CRM, claims, benefits, prior authorization, policy, and knowledge sources.",
              scope_boundary:
                "In: claims, eligibility, benefits, CRM history, and knowledge lookup. Out: clinical decisions.",
              evidence_family:
                "Member-service metrics, call transcripts, CRM history, claims samples, systems inventory.",
              value_hypothesis:
                "Improve member experience, reduce avoidable rework, and support a 90-day proof.",
              foundation_readiness:
                "Trusted data access, PHI controls, source freshness, quality, and lineage.",
            },
          },
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Recommended strategy path" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Governed agent-assist layer on current systems")
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText("Phased platform + operating-model shift"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Optimize the current workflow"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Large transformation program"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText(/aVa recommends/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("heading", { name: "Initial transformation posture" }),
    ).not.toBeInTheDocument();
  });

  it("recovers the selected P3 option from persisted recommendation text after reload", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
        initialPhaseCaptureValues={{
          solution_approach:
            "Compare dashboard-only, governed workflow, and command-center options.",
          operating_model:
            "Station operations, baggage service, customer care, vendor management, finance, and product/data co-own the pilot.",
          process_design:
            "Use one exception queue, classify cases, recommend actions, require human approval, and reconcile outcomes.",
          controls_governance:
            "Synthetic values stay planning-grade; customer-impacting decisions require human approval.",
          architecture_integration:
            "Read-only integration over bag scan events, cases, contacts, SLA updates, and spend extracts.",
          evidence_confidence:
            "Operational confidence is medium-high; financial confidence remains medium until accounting reconciliation.",
          recommendation:
            "Choose Option B: governed recommendation workflow for P4 planning.",
        }}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Design Future State",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    // Copy drift: the gate attestation row states completeness per phase
    // (`${phase.code} inputs complete`) instead of counting inputs. The count
    // this used to assert no longer renders anywhere, so it is replaced by
    // the row that does — not by a looser matcher.
    expect(screen.getByText("P3 inputs complete")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    ).toBeEnabled();
  });

  it("surfaces a Next-Phase Readiness Pack with real evidence gaps at gate approval", () => {
    const evidenceNeedPackets: MoveEvidenceNeedPacket[] = [
      {
        moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
        phase: 3,
        artifactType: "execution_roadmap",
        evidenceSlot: "Cost baseline",
        familyId: "cost_baseline",
        priority: "required",
        ownerSource: "Client owner / evidence steward",
        acceptedFormats: ["CSV", "XLSX"],
        exampleTemplate: "Cost and effort baseline packet",
        exampleContent: [],
        whyItMatters:
          "The business case and financial model need traceable cost and value assumptions before funding-grade estimates.",
        guidanceBasis: "generic",
        blockedArtifacts: [
          {
            artifactType: "execution_roadmap",
            title: "Roadmap & Business Case",
            phase: 4,
            reason:
              "Cost baseline is needed for a final-quality Roadmap & Business Case.",
          },
        ],
        canDraftBoundary: {
          canDraft: false,
          canDraftLabel: "",
          cannotDraftLabel: "",
        },
        preliminaryGenerationCaveat: null,
        waiverOption: null,
        nextAction:
          "Upload finance baseline, AP cost model, rate-card assumptions, or value-estimate worksheet.",
        status: "missing",
        evidenceTitles: [],
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={evidenceNeedPackets}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(
      screen.getByText(/Next: P4 Roadmap & Business Case readiness/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cost baseline").length).toBeGreaterThan(0);
    expect(screen.getByText(/Format: CSV, XLSX/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /traceable cost and value assumptions before funding-grade estimates/i,
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Suggested working sessions for P4 Roadmap & Business Case",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Value case workshop")).toBeInTheDocument();
  });

  it("does not show saved phase inputs as complete while required evidence is open", () => {
    const evidenceNeedPackets: MoveEvidenceNeedPacket[] = [
      {
        moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
        phase: 3,
        artifactType: "target_state_architecture",
        evidenceSlot: "Current-state workflow evidence",
        familyId: "current_state_workflow_map",
        priority: "required",
        ownerSource: "Business process owner",
        acceptedFormats: ["DOCX", "CSV"],
        exampleTemplate: "Workflow evidence",
        exampleContent: [],
        whyItMatters: "The target state needs an approved current-state basis.",
        guidanceBasis: "generic",
        blockedArtifacts: [],
        canDraftBoundary: {
          canDraft: false,
          canDraftLabel: "",
          cannotDraftLabel: "",
        },
        preliminaryGenerationCaveat: null,
        waiverOption: null,
        nextAction: "Upload and approve the current-state workflow evidence.",
        status: "missing",
        evidenceTitles: [],
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={evidenceNeedPackets}
        initialPhaseCaptureValues={completeP3CaptureValues}
        initialSubstepKey="approve"
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const inputStep = contractStepButton(/Solution approach & options/i);
    expect(inputStep.querySelector("span")).not.toHaveClass("done");
    expect(inputStep).toHaveTextContent("Needs approved evidence");
    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      /Evidence\s*1 open/,
    );
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "P3 cannot advance yet",
    );
  });

  it("keeps captured P3 inputs out of the ready-green state while hard gates remain open", () => {
    const coveredEvidence: MoveEvidenceNeedPacket = {
      moveId: makeMove().id,
      phase: 3,
      artifactType: "target_state_architecture",
      evidenceSlot: "Current-state workflow evidence",
      familyId: "current_state_workflow_map",
      priority: "required",
      ownerSource: "Process owner",
      acceptedFormats: ["DOCX", "CSV"],
      exampleTemplate: "Workflow evidence",
      exampleContent: [],
      whyItMatters: "The target design needs an evidence-backed current state.",
      guidanceBasis: "generic",
      blockedArtifacts: [],
      canDraftBoundary: {
        canDraft: false,
        canDraftLabel: "",
        cannotDraftLabel: "",
      },
      preliminaryGenerationCaveat: null,
      waiverOption: null,
      nextAction: "Review the approved workflow evidence.",
      status: "covered",
      evidenceTitles: ["approved-workflow.md"],
    };

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[coveredEvidence]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const inputStep = contractStepButton(/Solution approach & options/i);
    expect(inputStep.querySelector("span")).not.toHaveClass("done");
    expect(inputStep).toHaveTextContent("Captured · gate open");
    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      /Gate\s*0\/1 hard met/,
    );
  });

  it("does not report evidence as covered when the active phase has no evidence checklist", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        evidenceReadinessAvailable
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      /Evidence\s*Not checked/,
    );
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "P3 cannot advance yet",
    );
  });

  it("keeps phase progress blocked when evidence readiness could not be checked", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        evidenceReadinessAvailable={false}
        initialPhaseCaptureValues={completeP3CaptureValues}
        initialSubstepKey="approve"
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(screen.getByLabelText("Phase progress")).toHaveTextContent(
      /Evidence\s*Not checked/,
    );
    expect(
      screen.getAllByText(/Evidence readiness could not be verified/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "P3 cannot advance yet",
    );
  });

  it("surfaces real carries-forward content extracted from this phase's generated deliverable", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[
          {
            key: "workstreams",
            heading: "Workstream Breakdown",
            snippet:
              "Data platform migration led by J. Alvarez; clinical workflow cutover led by R. Chen.",
          },
        ]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(
      screen.getByText("Carries forward from this phase's generated work"),
    ).toBeInTheDocument();
    expect(screen.getByText("Workstream Breakdown")).toBeInTheDocument();
    expect(
      screen.getByText(/Data platform migration led by J. Alvarez/i),
    ).toBeInTheDocument();
  });

  it("omits the carries-forward section when no real content signals were extracted", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(
      screen.queryByText("Carries forward from this phase's generated work"),
    ).not.toBeInTheDocument();
  });

  it("renders P3 in the contract shell instead of the older prepare wall", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Design Future State" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P3 steps");
    expect(
      within(menu).getByRole("button", {
        name: /Solution approach & options/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 12")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Solution approach & options/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Compare Options/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Record Decision/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Design Canvas/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(menu).getByRole("button", { name: /Compare Options/i }),
    );
    expect(screen.getByText("Options & recommendation")).toBeInTheDocument();
    expect(
      screen.getByText("P2 source evidence unavailable"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase complete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/To advance to P4/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/View dossier/i)).not.toBeInTheDocument();
  });

  it("renders P4 in the contract shell instead of the older prepare wall", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Roadmap & Business Case",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Roadmap & Business Case" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P4 steps");
    expect(
      within(menu).getByRole("button", { name: /Roadmap & sequencing/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 11")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Roadmap & sequencing/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Estimates & capacity/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Value plan & business case/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Funding ask & governance/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Source \/ Tower handoff/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Value Case/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Plan Workstreams/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(menu).getByRole("button", { name: /Estimates & capacity/i }),
    );
    expect(
      screen.getByRole("button", { name: /Add role \/ work package/i }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Add role \/ work package/i }),
    );
    expect(screen.getByText("Internal delivery")).toBeInTheDocument();
    expect(screen.getByText("Vendor delivery")).toBeInTheDocument();
    expect(screen.getByText("Human estimate reviewer")).toBeInTheDocument();

    fireEvent.click(within(menu).getByRole("button", { name: /Value Case/i }));
    expect(screen.getByText("The value case")).toBeInTheDocument();
    expect(screen.getByText("Projected")).toBeInTheDocument();
    expect(screen.getByText("Evidence posture")).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
  });

  it("hides the Cost & Effort workspace tab when moves_pricing_engine is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Roadmap & Business Case",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(queryWorkspaceTab(/Cost & Effort/i)).not.toBeInTheDocument();
  });

  it("shows the Cost & Effort workspace tab only on P4 when the flag is on, and opens the wizard", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Roadmap & Business Case",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
        pricingEngineEnabled
      />,
    );
    const costEffortButton = workspaceTab(/Cost & Effort/i);
    expect(costEffortButton).toBeInTheDocument();
    fireEvent.click(costEffortButton);
    expect(
      screen.getByRole("heading", { name: "Cost & Effort" }),
    ).toBeInTheDocument();
  });

  it("does not show the Cost & Effort workspace tab on a non-P4 phase, even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Design Future State",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        pricingEngineEnabled
      />,
    );
    expect(queryWorkspaceTab(/Cost & Effort/i)).not.toBeInTheDocument();
  });

  it("hides the Risk Assessment workspace tab when moves_risk_tier_scoring_v1 is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(queryWorkspaceTab(/Risk Assessment/i)).not.toBeInTheDocument();
  });

  it("shows the Risk Assessment workspace tab only on P2 when the flag is on, and opens the panel", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
        riskAssessmentEnabled
      />,
    );
    const riskButton = workspaceTab(/Risk Assessment/i);
    expect(riskButton).toBeInTheDocument();
    fireEvent.click(riskButton);
    expect(
      screen.getByRole("heading", { name: "Risk Assessment" }),
    ).toBeInTheDocument();
  });

  it("also shows the Risk Assessment workspace tab on P3 when the flag is on — starts at P2, finalizes at P3", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Design Future State",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        riskAssessmentEnabled
      />,
    );
    expect(workspaceTab(/Risk Assessment/i)).toBeInTheDocument();
  });

  it("does not show the Risk Assessment workspace tab on P4 (or any phase other than P2/P3), even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Roadmap & Business Case",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
        riskAssessmentEnabled
      />,
    );
    expect(queryWorkspaceTab(/Risk Assessment/i)).not.toBeInTheDocument();
  });

  it("hides the Solutioning workspace tab when moves_solution_pattern_gate_v1 is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Design Future State",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(queryWorkspaceTab(/Solutioning/i)).not.toBeInTheDocument();
  });

  it("shows the Solutioning workspace tab only on P3 when the flag is on, and opens the panel", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Design Future State",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        solutionPatternGateEnabled
      />,
    );
    const solutioningButton = workspaceTab(/Solutioning/i);
    expect(solutioningButton).toBeInTheDocument();
    fireEvent.click(solutioningButton);
    expect(
      screen.getByRole("heading", { name: "Solutioning" }),
    ).toBeInTheDocument();
  });

  it("does not show the Solutioning workspace tab on a non-P3 phase, even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
        solutionPatternGateEnabled
      />,
    );
    expect(queryWorkspaceTab(/Solutioning/i)).not.toBeInTheDocument();
  });

  it("renders P5 in the contract shell instead of the older prepare wall", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Mobilize & Handoff",
        })}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Mobilize & Handoff" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P5 steps");
    expect(
      within(menu).getByRole("button", { name: /Handoff owners & RACI/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 10")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Handoff owners & RACI/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: "Handoff Readiness" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Tower measurement handoff/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Governance & Tower cadence/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Open risks & client-to-complete/i,
      }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Handoff recommendation/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: "Handoff Readiness" }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Approve & Build/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Review gate" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(menu).getByRole("button", { name: "Handoff Readiness" }),
    );
    expect(
      screen.getByRole("heading", { name: "Handoff Readiness" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("How to complete this phase"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "What this phase needs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Sessions and templates for this phase"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Phase Sessions/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Templates & sessions" }),
    ).not.toBeInTheDocument();
  });

  it("mounts governed current-state readiness in the current-state workspace before the static findings lanes", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Review Findings/i));

    expect(screen.getByText("Current-state readiness")).toBeInTheDocument();
    expect(screen.getByText(/0% collected/i)).toBeInTheDocument();
    expect(screen.getByText(/1 hard current-state gap/i)).toBeInTheDocument();
    expect(
      screen.getAllByText("Engineering delivery baseline (DORA)").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Upload CI/CD export as CSV")).toBeInTheDocument();
    expect(screen.getByText("Findings to review")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Files & Evidence" }),
    ).toBeInTheDocument();
    // The duplicate header CTA was removed — only the active workflow card owns
    // the contextual next action.
    expect(
      screen.queryByRole("button", { name: "Continue to Approve & Build" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue to Approve & Build →" }),
    ).not.toBeInTheDocument();
  });

  it("shows review-required current-state docs as visible evidence and removes the row immediately after approval", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentStateReadiness={makeReviewRequiredCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
          linkedEvidence: [],
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Review Findings/i));

    expect(
      screen.getByText("1 awaiting review · 0 approved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("1 parsed document awaiting review"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Review extracted information/));
    expect(screen.getByLabelText(/reviewed summary/i)).toHaveValue(
      "Parser summary",
    );
    fireEvent.change(screen.getByLabelText(/reviewed summary/i), {
      target: { value: "Human-corrected baseline summary" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Approve reviewed version" }),
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/current-state/evidence/evidence-review-1/approve",
        expect.objectContaining({ method: "POST" }),
      );
    });
    const approvalCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/current-state/evidence/evidence-review-1/approve"),
    );
    const approvalBody = JSON.parse(approvalCall[1].body as string);
    expect(approvalBody.reviewedExtraction.summary).toBe(
      "Human-corrected baseline summary",
    );
    expect(approvalBody.reviewedExtraction.structured.citations).toEqual([
      { quote: "30 tickets per week", locator: "page 2" },
    ]);
    await waitFor(() => {
      expect(
        screen.queryByText("1 parsed document awaiting review"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText(/evidence approved/i)).toBeInTheDocument();
  });

  it("does not label an approval step ready when hard gate criteria remain blocked", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        currentStateReadiness={{
          ...makeCurrentStateReadiness(),
          hardGaps: [],
        }}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
          gateCriteria: [
            {
              id: "g1",
              label: "Inputs complete",
              completed: true,
              severity: "hard",
              verified: true,
            },
            {
              id: "g2",
              label: "Discovery synthesis signed off",
              completed: false,
              severity: "hard",
              verified: true,
            },
          ],
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const progressCard = screen.getByLabelText("Phase progress");
    expect(progressCard).toHaveTextContent("Gate");
    expect(progressCard).toHaveTextContent("Blocked · 1/2 hard met");
    expect(screen.getByLabelText("Phase progress")).not.toHaveTextContent(
      "100% ready · Approve & Build",
    );
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "P2 cannot advance yet",
    );
    expect(
      screen.getByText(/Left-side checks mean the step inputs are captured/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /gate advances only after required evidence, outputs, and approvals pass/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "Complete 8 phase inputs before Approve & Build.",
    );
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "Hard: Discovery synthesis signed off",
    );
    expect(screen.getByText("Gate execution checklist")).toBeInTheDocument();
  });

  it("the evidence-item counts at gate approval are clickable links that open Files & Evidence, not inert text", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: "Files & Evidence" }),
    ).not.toBeInTheDocument();

    const evidenceLinks = screen.getAllByRole("button", {
      name: /open Files & Evidence/i,
    });
    expect(evidenceLinks.length).toBeGreaterThan(0);

    fireEvent.click(evidenceLinks[0]);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Files & Evidence" }),
      ).toBeInTheDocument();
    });
  });

  it("shows current generated artifacts on the gate panel when linked evidence is empty", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 5,
          gateCriteria: [
            {
              id: "g1",
              label: "Execution package signed off",
              completed: true,
              severity: "hard",
              verified: true,
            },
          ],
          linkedEvidence: [],
          phaseLabel: "P5 Mobilize & Handoff",
          terminalComplete: true,
        })}
        phaseBuildArtifacts={[
          {
            artifactId: "artifact-1",
            deliverableTypeKey: "handoff_package",
            documentTitle: "Execution Handoff Package",
            phase: 5,
            status: "board_ready",
            version: 1,
            downloadUrl: "/api/v1/programs/move/artifacts/artifact-1/download",
          },
          {
            artifactId: "artifact-2",
            deliverableTypeKey: "value_measurement_contract",
            documentTitle: "Value Measurement Contract",
            phase: 5,
            status: "board_ready",
            version: 1,
            downloadUrl: "/api/v1/programs/move/artifacts/artifact-2/download",
          },
        ]}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const decisionSurface = screen.getByTestId("mxw-decision-surface");
    expect(decisionSurface).toHaveTextContent("2 generated artifacts");
    expect(decisionSurface).not.toHaveTextContent("0 evidence items");
  });

  it("hydrates the gate panel from current artifact vault rows when server preload is empty", async () => {
    generatedDeliverableArtifacts = [
      {
        artifactId: "artifact-1",
        artifactType: "handoff_package",
        family: "generated_deliverable",
        title: "Execution Handoff Package",
        phase: 5,
        version: 1,
        status: "board_ready",
        lifecycleState: "current",
        qualityScore: 100,
        createdAt: "2026-09-11T00:00:00.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-1",
        fileFormat: "docx",
      },
      {
        artifactId: "artifact-2",
        artifactType: "value_measurement_contract",
        family: "generated_deliverable",
        title: "Value Measurement Contract",
        phase: 5,
        version: 1,
        status: "board_ready",
        lifecycleState: "current",
        qualityScore: 100,
        createdAt: "2026-09-11T00:00:00.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-2",
      },
      {
        artifactId: "artifact-3",
        artifactType: "business_case",
        family: "generated_deliverable",
        title: "Prior Phase Business Case",
        phase: 4,
        version: 1,
        status: "board_ready",
        lifecycleState: "current",
        qualityScore: 100,
        createdAt: "2026-09-11T00:00:00.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-3",
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 5,
          gateCriteria: [
            {
              id: "g1",
              label: "Execution package signed off",
              completed: true,
              severity: "hard",
              verified: true,
            },
          ],
          linkedEvidence: [],
          phaseLabel: "P5 Mobilize & Handoff",
          terminalComplete: true,
        })}
        phaseBuildArtifacts={[]}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
        "2 generated artifacts",
      );
    });
    expect(screen.getByTestId("mxw-decision-surface")).not.toHaveTextContent(
      "0 evidence items",
    );
  });

  it("hydrates phase build rows from generated Office companions using their canonical deliverable keys", async () => {
    generatedDeliverableArtifacts = [
      {
        artifactId: "artifact-discovery-report",
        artifactType: "discovery_report_editable_pptx",
        deliverableTypeKey: "discovery_report",
        family: "generated_deliverable",
        title: "Discovery & Diagnosis Report",
        phase: 2,
        version: 1,
        status: "draft",
        lifecycleState: "current",
        qualityScore: 96,
        createdAt: "2026-09-27T20:42:30.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-discovery-report",
        fileFormat: "pptx",
      },
      {
        artifactId: "artifact-root-cause",
        artifactType: "root_cause_worksheet_editable_pptx",
        deliverableTypeKey: "root_cause_worksheet",
        family: "generated_deliverable",
        title: "Root Cause Analysis Worksheet",
        phase: 2,
        version: 1,
        status: "draft",
        lifecycleState: "current",
        qualityScore: 96,
        createdAt: "2026-09-27T20:42:31.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-root-cause",
        fileFormat: "pptx",
      },
      {
        artifactId: "artifact-design-workshop",
        artifactType: "design_workshop_guide_editable_pptx",
        deliverableTypeKey: "design_workshop_guide",
        family: "generated_deliverable",
        title: "Design Workshop Guide",
        phase: 2,
        version: 1,
        status: "draft",
        lifecycleState: "current",
        qualityScore: 96,
        createdAt: "2026-09-27T20:42:32.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-design-workshop",
        fileFormat: "pptx",
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureRevision="p2-complete"
        initialPhaseCaptureValues={completeP2CaptureValues}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Discover & Diagnose",
        })}
        phaseBuildArtifacts={[]}
        phaseNum={2}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    await waitFor(() => {
      expect(screen.getByText("3/3 built")).toBeInTheDocument();
    });
  });

  it("renders File Cabinet generated artifact open and download controls as real links", async () => {
    generatedDeliverableArtifacts = [
      {
        artifactId: "artifact-1",
        artifactType: "handoff_package",
        family: "generated_deliverable",
        title: "Execution Handoff Package",
        phase: 5,
        version: 1,
        status: "board_ready",
        lifecycleState: "current",
        qualityScore: 100,
        createdAt: "2026-09-11T00:00:00.000Z",
        downloadUrl: "/api/v1/artifacts/artifact-1",
      },
    ];

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Mobilize & Handoff",
          terminalComplete: true,
        })}
        phaseBuildArtifacts={[]}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: /Open Files & Evidence/i })[0]!,
    );

    await waitFor(() => {
      expect(screen.getByText("Execution Handoff Package")).toBeInTheDocument();
    });

    const openLink = screen.getByRole("link", { name: "Open" });
    const downloadLink = screen.getByRole("link", { name: "Download" });

    expect(openLink).toHaveAttribute(
      "href",
      "/api/v1/artifacts/artifact-1?format=html&inline=1",
    );
    expect(openLink).toHaveAttribute("target", "_blank");
    expect(downloadLink).toHaveAttribute(
      "href",
      "/api/v1/artifacts/artifact-1?format=docx",
    );
    expect(downloadLink).toHaveAttribute(
      "download",
      "Execution Handoff Package.docx",
    );
  });

  it("does not load the legacy facilitated session playbook on the Prepare tab", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.queryByText(/Phase Sessions · P3 Design/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Generate Session Pack/i }),
    ).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/playbook?phase=3",
      expect.anything(),
    );
  });

  it("does not load Phase Intelligence until the user opens its workspace tab", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-intelligence?phase=3",
      expect.anything(),
    );

    fireEvent.click(workspaceTab("Intelligence"));
    expect(
      screen.getByRole("heading", { name: "Phase Intelligence" }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Governed agent workspace")).toBeInTheDocument();
    });
    expect(screen.getByText(/labeled planning range/)).toBeInTheDocument();
    expect(
      screen.getByText("1 hard gate open; 1 required evidence gap."),
    ).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-intelligence?phase=3",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("wires phase workspace v2 task actions to the existing Files and gate controls", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[
          {
            moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
            phase: 3,
            artifactType: "solution_design",
            evidenceSlot: "Solution architecture constraints",
            familyId: "architecture_constraints",
            priority: "required",
            ownerSource: "Client owner / evidence steward",
            acceptedFormats: ["DOCX"],
            exampleTemplate: "Architecture constraints memo",
            exampleContent: [],
            whyItMatters:
              "The design lane needs real architecture constraints.",
            guidanceBasis: "generic",
            blockedArtifacts: [],
            canDraftBoundary: {
              canDraft: false,
              canDraftLabel: "",
              cannotDraftLabel: "",
            },
            preliminaryGenerationCaveat: null,
            waiverOption: null,
            nextAction: "Upload the architecture constraints memo.",
            status: "missing",
            evidenceTitles: [],
          },
        ]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    selectP3Option(/Operational playbook and metric discipline/i);
    fireEvent.click(workflowStepButton(/Record Decision/i));

    expect(
      screen.getByRole("heading", {
        name: "Confirm the selected approach",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload decision files" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Supporting files can be added in Files & Evidence/i),
    ).toBeInTheDocument();
    fireEvent.click(workflowStepButton(/Approve & Build/i));

    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 required evidence item open/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText(/1 required evidence item open/i));
    expect(
      screen.getByText("Solution architecture constraints"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Upload the architecture constraints memo."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Likely source owner: Client owner \/ evidence steward/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Accepted formats: DOCX")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("Files & Evidence renders a real generated deliverable as an actual downloadable link", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/artifacts") && !url.includes("/artifacts/")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ok: true,
              count: 1,
              artifacts: [
                {
                  artifactId: "d74ed94a-a600-46ee-ad5d-a505556c4cac",
                  artifactType: "target_state_architecture",
                  family: "generated_deliverable",
                  title:
                    "CANARY — SkyHarbor Recovery Command IROPS Target Architecture",
                  phase: 3,
                  fileFormat: "html",
                  fileName: null,
                  version: 1,
                  status: "board_ready",
                  lifecycleState: "current",
                  qualityScore: 100,
                  createdAt: "2026-07-11T23:26:23.000Z",
                  downloadUrl:
                    "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac",
                },
              ],
            }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true }),
        } as Response;
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(workspaceTab("Files & Evidence"));

    await waitFor(() => {
      expect(
        screen.getByText(
          /CANARY — SkyHarbor Recovery Command IROPS Target Architecture/i,
        ),
      ).toBeInTheDocument();
    });

    // Real "Open" action must be a stable browser link. It must never depend
    // on a button-side window.open side effect that can silently no-op.
    expect(screen.getByRole("link", { name: /^Open$/i })).toHaveAttribute(
      "href",
      "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac?format=html&inline=1",
    );
    expect(screen.getByRole("link", { name: /^Open$/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("supports the explorer, upload, aVa launcher, and gate ceremony interactions", async () => {
    const { container } = render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(workspaceTab("Files & Evidence"));
    expect(
      screen.getByRole("heading", { name: "Files & Evidence" }),
    ).toBeInTheDocument();
    // The real File Cabinet vault (FileCabinetPanel) is mounted here, not a
    // static per-phase mock — it fetches the move's real artifacts and shows
    // this loading/empty state until they resolve.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/artifacts",
        expect.anything(),
      );
    });
    expect(
      Array.from(container.querySelectorAll("a")).some((anchor) =>
        anchor.getAttribute("href")?.includes("?tab="),
      ),
    ).toBe(false);

    fireEvent.click(workspaceTab("Steps"));
    selectP3Option(/Operational playbook and metric discipline/i);
    fireEvent.click(workflowStepButton(/Record Decision/i));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    expect(
      screen.queryByRole("button", { name: /Review governed build/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve & advance/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Approve & Build$/i,
      }),
    );
    await waitFor(() => {
      expect(screen.getAllByText(/Gate approved/i).length).toBeGreaterThan(0);
    });
    await waitFor(() => {
      expect(screen.getAllByText(/^Built$/i).length).toBeGreaterThan(0);
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/deliverables/generate-phase",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    const optionApprovalCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).includes("/solution-options/approve"),
    );
    expect(optionApprovalCall).toBeTruthy();
    const optionApprovalBody = JSON.parse(
      String(optionApprovalCall?.[1]?.body ?? "{}"),
    );
    expect(optionApprovalBody).toEqual(
      expect.objectContaining({
        chosenOption: expect.any(String),
        rationale: expect.any(String),
        tradeoffsAccepted: expect.any(Array),
        options: expect.any(Array),
      }),
    );
    expect(optionApprovalBody.options.length).toBeGreaterThanOrEqual(2);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/deliverables/runs/run-1",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/phase-gate-approval",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    const phaseGateCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/phase-gate-approval"),
    );
    const phaseGateBody = JSON.parse(String(phaseGateCall?.[1]?.body ?? "{}"));
    expect(phaseGateBody.rationale).toContain(
      "required phase outputs reached terminal build status",
    );
    expect(phaseGateBody.rationale).not.toContain("outputs started");
    const phaseCaptureCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).includes("/phase-capture"),
    );
    expect(phaseCaptureCall).toBeTruthy();
    const phaseCaptureBody = JSON.parse(
      String(phaseCaptureCall?.[1]?.body ?? "{}"),
    );
    expect(phaseCaptureBody.sections).toEqual(
      expect.objectContaining({
        solution_approach: expect.any(String),
        operating_model: expect.any(String),
        process_design: expect.any(String),
        controls_governance: expect.any(String),
        architecture_integration: expect.any(String),
        evidence_confidence: expect.any(String),
        recommendation: expect.any(String),
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    expect(screen.getByText(/Ask about this phase/i)).toBeInTheDocument();
  });

  it("reserves bottom safe area so the fixed aVa launcher does not cover gate content", () => {
    const { container } = render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    const styleText = Array.from(container.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");

    expect(styleText).toContain(
      ".mxw-shell{width:100%;max-width:none;margin:0;padding:24px clamp(24px,2.6vw,44px) max(128px,calc(96px + env(safe-area-inset-bottom)))}",
    );
    expect(styleText).toContain(
      ".mxw-ava-fab{position:fixed;right:24px;bottom:calc(24px + env(safe-area-inset-bottom))",
    );
    expect(styleText).toContain(
      ".mxw-ava-pop{position:fixed;right:24px;bottom:calc(78px + env(safe-area-inset-bottom))",
    );
    expect(styleText).toContain(
      ".mxw .mxw-ava-fab{width:52px;height:52px;padding:12px;gap:0;font-size:0;line-height:0;color:transparent;justify-content:center}",
    );
    // Desktop (>=1281px): aVa is docked to the left and the surface shifts to
    // clear it; below that width it stays the floating FAB + popover above.
    expect(styleText).toContain("@media (min-width:1281px)");
    expect(styleText).toContain(".mxw .mxw-surface{margin-left:312px}");
    expect(screen.getByRole("button", { name: "Ask aVa" })).toHaveClass(
      "mxw-ava-fab",
    );
  });

  it("surfaces the hard gate blocker after generation succeeds but approval returns 409", async () => {
    const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/phase-gate-approval")) {
          return {
            ok: false,
            status: 409,
            json: async () => ({
              error: "gate_blocked",
              gate: {
                failedChecks: [
                  {
                    severity: "hard",
                    check: "charter_signed_off",
                    reason: "Charter approved by an authorized Move user",
                  },
                ],
              },
            }),
          } as Response;
        }
        if (!defaultFetch) throw new Error(`unmocked fetch: ${url}`);
        return defaultFetch(input, init);
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    selectP3Option(/Operational playbook and metric discipline/i);
    fireEvent.click(workflowStepButton(/Record Decision/i));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Approve & Build$/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Build completed, but the phase gate is blocked/i),
      ).toBeInTheDocument();
    });
    expect(
      screen.getAllByText(/Charter approved by an authorized Move user/i)
        .length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/approve the draft or upload an edited version/i),
    ).toBeInTheDocument();
  });

  it("gates Approve & Build behind a confirmation dialog and does not enqueue a build until confirmed", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentUser={{ email: "jane@apex-retail.com", role: "client_admin" }}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    selectP3Option(/Operational playbook and metric discipline/i);
    fireEvent.click(workflowStepButton(/Record Decision/i));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/Authorizing build as: jane@apex-retail.com/i),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText(/Approving as: jane@apex-retail.com/i),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /It does not approve the generated documents or the phase gate/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        /The authorized Move user reviews each required deliverable in Files & Evidence, then approves the ready phase gate/i,
      ),
    ).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/v1/deliverables/generate-phase"),
      ),
    ).toBe(false);

    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/v1/deliverables/generate-phase"),
      ),
    ).toBe(false);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Approve & Build$/i,
      }),
    );
    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/api/v1/deliverables/generate-phase"),
        ),
      ).toBe(true);
    });
  });

  it("times out P3 option approval instead of leaving Approve & Build spinning", async () => {
    jest.useFakeTimers();
    const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/solution-options/approve")) {
          return new Promise<Response>(() => {});
        }
        if (!defaultFetch) throw new Error(`unmocked fetch: ${url}`);
        return defaultFetch(input, init);
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentUser={{ email: "jane@apex-retail.com", role: "client_admin" }}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(3)}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    selectP3Option(/Operational playbook and metric discipline/i);
    fireEvent.click(workflowStepButton(/Record Decision/i));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Approve & Build$/i,
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Recording the approved solution option before architecture assembly/i,
        ),
      ).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(45_000);
    });

    await waitFor(() => {
      expect(
        screen.getAllByText(/Solution option approval did not finish/i).length,
      ).toBeGreaterThan(0);
    });
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/v1/deliverables/generate-phase"),
      ),
    ).toBe(false);
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Design Future State/i,
      }),
    ).not.toBeDisabled();

    jest.useRealTimers();
  });

  it("says which phase approving a gate opens — the next one, not the one being approved", () => {
    const p2 = { phase: 2, code: "P2", title: "Discover & Diagnose" };
    const p3 = { phase: 3, code: "P3", title: "Design Future State" };
    // Approving the gate of the phase the Move is in.
    expect(gateOnlyConfirmSummaryFor(p2, p2)).toBe(
      "This submits the already-satisfied P2 gate and opens P3 Design Future State. It does not regenerate artifacts.",
    );
    // Re-approving an earlier gate opens nothing.
    expect(gateOnlyConfirmSummaryFor(p2, p3)).toBe(
      "This re-submits the already-satisfied P2 gate against current evidence. The Move stays in P3 Design Future State. It does not regenerate artifacts.",
    );
    expect(
      gateOnlyConfirmSummaryFor(
        { phase: 4, code: "P4" },
        { phase: 4, code: "P4", title: "Roadmap & Business Case" },
      ),
    ).toContain("opens P5 Mobilize & Handoff");
  });

  it("submits an already-satisfied P5 gate without regenerating artifacts", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        currentUser={{ email: "move.runner@example.com", role: "client_admin" }}
        evidenceNeedPackets={coveredEvidencePacketsForPhase(5)}
        initialPhaseCaptureValues={completeP5CaptureValues}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Mobilize & Handoff",
          gateCriteria: [
            {
              id: "handoff_package_signed_off",
              label: "Mobilization and Tower handoff package signed off",
              completed: true,
              severity: "hard",
              verified: true,
            },
            {
              id: "value_measurement_contract_signed_off",
              label: "Value measurement contract signed off",
              completed: true,
              severity: "hard",
              verified: true,
            },
          ],
        })}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Complete P5 and open Tower/i }),
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/already-satisfied P5 gate/i),
    ).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/v1/deliverables/generate-phase"),
      ),
    ).toBe(false);

    fireEvent.click(
      within(dialog).getByRole("button", {
        name: "Complete and hand off",
      }),
    );

    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/phase-gate-approval"),
        ),
      ).toBe(true);
    });
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/api/v1/deliverables/generate-phase"),
      ),
    ).toBe(false);
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-capture"),
      ),
    ).toBe(false);
  });

  it("wires the aVa suggested questions to a real chat send, with programId set correctly to avoid the 'no active Move session' regression", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /What must be true before P4\?/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /The two blocking gate items are the requirements trace/i,
        ),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByLabelText("aVa answer")).toBeInTheDocument();
    });
    expect(screen.getByText("Gate readiness by phase")).toBeInTheDocument();
    expect(screen.getByText("Phase readiness scorecard")).toBeInTheDocument();
    expect(screen.queryByText(/\[\[artifact:/i)).not.toBeInTheDocument();

    const chatCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/api/chat/agent"),
    );
    expect(chatCall).toBeTruthy();
    const chatBody = JSON.parse(String(chatCall?.[1]?.body ?? "{}"));
    expect(chatBody.message).toBe("What must be true before P4?");
    expect(chatBody.programId).toBe("37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4");
    expect(chatBody.surfaceContext.programId).toBe(
      "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    );
    expect(chatBody.surfaceContext.moveId).toBe(
      "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
    );
    expect(chatBody.surfaceContext.phase).toBe(3);
    expect(chatBody.surfaceContext).not.toHaveProperty(
      "moveContextExtractEvidenceCount",
    );
    expect(chatBody.surfaceContext).not.toHaveProperty("moveEvidenceCount");
  });

  it("gets cited aVa drafts without writing, then persists only after Save changes", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    expect(
      screen.getByText("aVa can draft. You review and save."),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Draft proposed inputs" }),
    );

    await waitFor(() => {
      expect(screen.getByText(/1 cited draft ready/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Review a field; inserting does not save/i),
    ).toBeInTheDocument();
    const draftCall = (global.fetch as jest.Mock).mock.calls.find(([url]) =>
      String(url).includes("/phase-input-draft"),
    );
    expect(draftCall).toBeTruthy();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-capture"),
      ),
    ).toBe(false);
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-gate-approval"),
      ),
    ).toBe(false);

    expect(
      screen.getByText("P0 · Stakeholder / owner view"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Insert as draft" }));
    const sponsorInput = screen.getAllByLabelText(
      "Sponsor contact and progress updates",
    )[0] as HTMLTextAreaElement;
    expect(sponsorInput.value).toBe(
      "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.",
    );
    expect(screen.getByText(/aVa draft is local/i)).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-capture"),
      ),
    ).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.some(([url]) =>
          String(url).includes("/phase-capture"),
        ),
      ).toBe(true);
    });
    const phaseCaptureCall = (global.fetch as jest.Mock).mock.calls.find(
      ([url]) => String(url).includes("/phase-capture"),
    );
    const phaseCaptureBody = JSON.parse(
      String(phaseCaptureCall?.[1]?.body ?? "{}"),
    );
    expect(phaseCaptureBody).toEqual(
      expect.objectContaining({
        phase: 1,
        sections: {
          sponsor_commitment:
            "Jordan Lee, COO | jordan@example.com | phase-progress emails enabled.",
        },
      }),
    );
  });

  it("does not offer aVa draft action when phase inputs are already complete", () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP1CaptureValues}
        initialApprovedP1CaptureEvidenceReferences={approvedP1CaptureEvidence(
          ...P1_CHARTER_EVIDENCE_FAMILIES.map((family) => family.id),
        )}
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));

    expect(
      screen.getByText("Inputs complete. Ask aVa to refine or check blockers."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Draft proposed inputs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check blockers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "What is in and out of scope?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Which success metric is weakest?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "What assumption should be challenged first?",
      }),
    ).not.toBeInTheDocument();
  });

  it("turns streamed capture-field artifacts into local drafts without saving", async () => {
    const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
    const encoder = new TextEncoder();
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/chat/agent")) {
          const body = new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(
                encoder.encode(
                  [
                    "I found one cited draft proposal.",
                    '[[artifact:capture-field]]{"phase":1,"key":"scope_boundary","value":"In scope: Airport turnaround operations","citations":["P0 · Affected function / process"],"confidence":"high"}[[/artifact]]',
                  ].join("\n"),
                ),
              );
              controller.close();
            },
          });
          return { ok: true, status: 200, body } as unknown as Response;
        }
        if (!defaultFetch) throw new Error(`unmocked fetch: ${url}`);
        return defaultFetch(input, init);
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 1,
          phaseLabel: "P1 Charter",
        })}
        phaseNum={1}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    const textarea = screen.getByPlaceholderText(/Ask aVa about/i);
    fireEvent.change(textarea, {
      target: { value: "Draft proposed inputs for P1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/1 cited draft ready/i)).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Review a field; inserting does not save/i),
    ).toBeInTheDocument();
    const scopeButtons = screen.getAllByRole("button", {
      name: "Scope boundary",
    });
    expect(scopeButtons.length).toBeGreaterThanOrEqual(2);
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-capture"),
      ),
    ).toBe(false);

    fireEvent.click(scopeButtons[scopeButtons.length - 1]!);
    expect(
      screen.getByText("P0 · Affected function / process"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Insert as draft" }));

    const scopeInput = screen.getAllByLabelText(
      "Scope boundary",
    )[0] as HTMLTextAreaElement;
    expect(scopeInput.value).toBe("In scope: Airport turnaround operations");
    expect(screen.getByText(/aVa draft is local/i)).toBeInTheDocument();
    expect(
      (global.fetch as jest.Mock).mock.calls.some(([url]) =>
        String(url).includes("/phase-capture"),
      ),
    ).toBe(false);
  });

  it("renders the rich aVa answer while the live stream is still open", async () => {
    const defaultFetch = (global.fetch as jest.Mock).getMockImplementation();
    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | null =
      null;
    (global.fetch as jest.Mock).mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/chat/agent")) {
          const body = new ReadableStream<Uint8Array>({
            start(controller) {
              streamController = controller;
              controller.enqueue(
                encoder.encode(
                  "The current phase needs decision evidence before the next phase starts.",
                ),
              );
            },
          });
          return { ok: true, status: 200, body } as unknown as Response;
        }
        if (!defaultFetch) throw new Error(`unmocked fetch: ${url}`);
        return defaultFetch(input, init);
      },
    );

    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /What must be true before P4\?/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/needs decision evidence before the next phase/i),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByLabelText("aVa answer")).toBeInTheDocument();
    });
    expect(screen.getByText("Gate readiness by phase")).toBeInTheDocument();
    expect(screen.getByText("Phase readiness scorecard")).toBeInTheDocument();

    const controllerToClose = streamController as { close: () => void } | null;
    controllerToClose?.close();
  });

  it("supports typing and sending a free-form question via the composer", async () => {
    render(
      <MovesPhaseStandaloneClient
        canApproveGates
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Ask aVa/i }));
    const textarea = screen.getByPlaceholderText(/Ask aVa about/i);
    fireEvent.change(textarea, {
      target: { value: "Where are we over-designing?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        screen.getByText("Where are we over-designing?"),
      ).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          /The two blocking gate items are the requirements trace/i,
        ),
      ).toBeInTheDocument();
    });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  describe("MOVES-UI-001 Steps contract view", () => {
    it("retired legacy path: renders the contract-card shell, not the old horizontal stepper", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("tablist", { name: "Phase steps" }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Evidence checklist" }),
      ).toBeInTheDocument();
    });

    it("renders the contract-card Steps view sourced only from getPhaseCaptureSections/phaseCaptureValues — no fabricated section names", () => {
      const move = makeMove({
        currentPhase: 2,
        phaseLabel: "P2 Discover & Diagnose",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP2CaptureValues}
          move={move}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
      const menu = screen.getByLabelText("P2 steps");
      // Every real P2 capture-section label appears — nothing invented.
      [
        "Current-state findings",
        "Baseline metrics",
        "Gaps / root causes",
        "Process handoffs",
        "Data quality / governance",
        "Evidence confidence",
        "Recommendation",
      ].forEach((label) => {
        expect(within(menu).getByText(label)).toBeInTheDocument();
      });
      // The real substeps (same array driving the legacy stepper) appear
      // under "Workflow" — not a fabricated category.
      expect(within(menu).getByText("Upload & Review")).toBeInTheDocument();
      expect(within(menu).getByText("Approve & Build")).toBeInTheDocument();
      // P2 now follows the same shell contract as P1: the first real input is
      // selected by default instead of landing on an old workflow summary.
      expect(
        screen.getByRole("heading", { name: "Current-state findings" }),
      ).toBeInTheDocument();
    });

    it("does not show a P1-to-P2 workbook review as current P2-to-P3 readiness", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialStageReadinessPreview={{
            ok: true,
            proposalSet: {
              artifactId: "prior-transition-proposal",
              transition: { fromPhase: 1, toPhase: 2 },
              status: "review_required",
              proposalCount: 1,
              pendingCount: 1,
              proposals: [
                {
                  proposalId: "prior-transition-response",
                  question: "P1 baseline question from the prior transition",
                  response: "Prior-phase response",
                  answerState: "supported",
                  disposition: "pending",
                },
              ],
            },
          }}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );
      expect(
        screen.queryByText("P1 baseline question from the prior transition"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Stored workbook responses awaiting review/),
      ).not.toBeInTheDocument();
    });

    it("clicking a phase-input row updates the detail pane to that section's real captured value; clicking a workflow row restores the real substep content", () => {
      const move = makeMove({
        currentPhase: 2,
        phaseLabel: "P2 Discover & Diagnose",
      });
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP2CaptureValues}
          move={move}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Current-state findings/i }),
      );

      // Detail pane really switched: heading + description now visible, and
      // the value shown is the section's real captured value (traces to the
      // real move.name — not invented text).
      expect(
        screen.getByRole("heading", { name: "Current-state findings" }),
      ).toBeInTheDocument();
      expect(
        (screen.getByLabelText("Current-state findings") as HTMLTextAreaElement)
          .value,
      ).toContain(move.name);
      expect(screen.queryByText("Provide")).not.toBeInTheDocument();
      expect(document.querySelector(".mxw-contract-captured")).toBeNull();
      // `getAllByText` throws when nothing matches, so this negative
      // assertion failed for the wrong reason once the move name stopped
      // rendering as its own text node. `queryAllByText` returns [] instead.
      // The weight of the check sits in the `.mxw-contract-captured` null
      // assertion directly above, which is strictly stronger; this one is
      // kept as the name-specific form of it rather than deleted.
      expect(
        screen
          .queryAllByText(move.name)
          .filter((node) => node.classList.contains("mxw-contract-captured")),
      ).toHaveLength(0);
      expect(
        screen.queryByRole("heading", { name: "What this phase needs" }),
      ).not.toBeInTheDocument();

      // Now click a real Workflow (substep) row — the detail pane must show
      // that substep's real, already-existing PhaseBody content again.
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );
      expect(
        screen.getByRole("heading", { name: "Evidence checklist" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Current-state findings" }),
      ).not.toBeInTheDocument();
    });

    it("marks exactly one owning workflow row active while a phase input is selected", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Baseline metrics/i }),
      );

      const workflowButtons = [
        within(menu).getByRole("button", { name: /Prepare/i }),
        within(menu).getByRole("button", { name: /Upload & Review/i }),
        within(menu).getByRole("button", { name: /Review Findings/i }),
        within(menu).getByRole("button", { name: /Approve & Build/i }),
      ];
      expect(
        workflowButtons.filter((button) => button.classList.contains("active")),
      ).toHaveLength(1);
      expect(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      ).toHaveClass("active");
    });

    it("keeps phase progress to the critical inputs, gate, and next-action signals", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const progressCard = screen.getByLabelText("Phase progress");
      expect(within(progressCard).getByText("Inputs")).toBeInTheDocument();
      expect(within(progressCard).getByText("Gate")).toBeInTheDocument();
      expect(within(progressCard).getByText("Next")).toBeInTheDocument();
      expect(
        within(progressCard).queryByText("Workflow"),
      ).not.toBeInTheDocument();
      expect(within(progressCard).queryByText("Stage")).not.toBeInTheDocument();
      expect(
        within(progressCard).queryByText(/workflow · .*hard met ·/i),
      ).not.toBeInTheDocument();
    });

    it("keeps P2 evidence progress open when current-state readiness has hard gaps", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={makeCurrentStateReadiness()}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const progressCard = screen.getByLabelText("Phase progress");
      expect(within(progressCard).getByText("1 open")).toBeInTheDocument();
      expect(
        within(progressCard).queryByText("Covered"),
      ).not.toBeInTheDocument();
    });

    it("reports P2 evidence covered when every current-state instrument is committed", () => {
      const readiness = makeCurrentStateReadiness();
      const coveredReadiness: ReadinessReport = {
        ...readiness,
        instruments: readiness.instruments.map((instrument) => ({
          ...instrument,
          status: "committed",
          committedRows: 1,
        })),
        coverageScore: 100,
        hardGaps: [],
      };

      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={coveredReadiness}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const progressCard = screen.getByLabelText("Phase progress");
      expect(within(progressCard).getByText("Covered")).toBeInTheDocument();
      expect(within(progressCard).queryByText(/open$/)).not.toBeInTheDocument();
    });

    it("does not report P2 evidence as covered when current-state readiness is unavailable", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={null}
          evidenceNeedPackets={[]}
          evidenceReadinessAvailable
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const progressCard = screen.getByLabelText("Phase progress");
      expect(within(progressCard).getByText("Not checked")).toBeInTheDocument();
      expect(
        within(progressCard).queryByText("Covered"),
      ).not.toBeInTheDocument();
    });

    it("citation toggle: absent by default (no captured source), then appears and actually reveals/hides the source caption once a real source is captured", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      fireEvent.click(
        within(menu).getByRole("button", { name: /Baseline metrics/i }),
      );

      // No persisted value means the field stays empty. The citation toggle
      // must not render for fabricated/default text because there is none.
      expect(
        (screen.getByLabelText("Baseline metrics") as HTMLTextAreaElement)
          .value,
      ).toBe("");
      expect(screen.queryByText("Captured note")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Show source for/i }),
      ).not.toBeInTheDocument();

      // Capture a real structured fact with a source (as
      // diagnosis-facts.ts's own contract supports) via the same textarea
      // the legacy PhaseCaptureEditor already uses to write this value.
      fireEvent.change(screen.getByLabelText("Baseline metrics"), {
        target: {
          value: JSON.stringify([
            {
              metric: "Cycle time",
              value: "18.4 days",
              source: "Intake work queue export",
            },
          ]),
        },
      });

      expect(screen.getByText("Cycle time")).toBeInTheDocument();
      const toggle = screen.getByRole("button", {
        name: "Show source for Cycle time",
      });
      expect(
        screen.queryByText("Intake work queue export"),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);
      expect(screen.getByText("Intake work queue export")).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(
        screen.queryByText("Intake work queue export"),
      ).not.toBeInTheDocument();
    });

    it("upload-type workflow step: the real file input reachable from the step detail pane invokes the same existing upload wiring (no new handler built)", async () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const menu = screen.getByLabelText("P2 steps");
      // P2's real "current" substep is literally "Upload & Review" — the
      // only upload-type step reachable for this phase's real data.
      fireEvent.click(
        within(menu).getByRole("button", { name: /Upload & Review/i }),
      );

      const input = screen.getByLabelText(
        "Upload P2 files",
      ) as HTMLInputElement;
      fireEvent.change(input, {
        target: {
          files: [
            new File(["baseline"], "baseline-extract.csv", {
              type: "text/csv",
            }),
          ],
        },
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/artifacts/upload",
          expect.objectContaining({ method: "POST" }),
        );
      });
      await waitFor(() => {
        expect(screen.getByText("baseline-extract.csv")).toBeInTheDocument();
      });
    });

    it("'Coming up' on the Approve & Build step opens by default with real readiness-pack chips, then collapses and reopens the same real data", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          initialSubstepKey="approve"
          carriesForwardContent={[]}
          evidenceNeedPackets={[
            {
              moveId: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
              phase: 2,
              artifactType: "solution_design",
              evidenceSlot: "Systems inventory",
              familyId: "systems_inventory",
              priority: "required",
              ownerSource: "Client owner / evidence steward",
              acceptedFormats: ["XLSX"],
              exampleTemplate: "Systems landscape extract",
              exampleContent: [],
              whyItMatters: "P3 solution options need the real systems map.",
              guidanceBasis: "generic",
              blockedArtifacts: [
                {
                  artifactType: "solution_options",
                  title: "Solution Options Canvas",
                  phase: 3,
                  reason: "Systems inventory is needed to scope integration.",
                },
              ],
              canDraftBoundary: {
                canDraft: false,
                canDraftLabel: "",
                cannotDraftLabel: "",
              },
              preliminaryGenerationCaveat: null,
              waiverOption: null,
              nextAction: "Upload the systems landscape extract.",
              status: "missing",
              evidenceTitles: [],
            },
          ]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Discover & Diagnose",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const comingUp = screen.getByTestId("mxw-contract-comingup");
      const toggle = within(comingUp).getByRole("button", {
        name: "What P3 Design Future State will need",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(
        within(screen.getByTestId("mxw-contract-comingup-chips")).getByText(
          "Systems inventory",
        ),
      ).toBeInTheDocument();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByTestId("mxw-contract-comingup-chips"),
      ).not.toBeInTheDocument();

      fireEvent.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(
        within(screen.getByTestId("mxw-contract-comingup-chips")).getByText(
          "Systems inventory",
        ),
      ).toBeInTheDocument();
    });

    it("'Coming up' is hidden on the earlier capture steps", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      // P1 opens on the first input step; next-phase preparation must not
      // appear until the final Approve & Build step.
      expect(
        screen.queryByTestId("mxw-contract-comingup"),
      ).not.toBeInTheDocument();
    });

    it.each([
      { phase: 3, workbook: "Download P4 readiness workbook" },
      { phase: 4, workbook: "Download P5 readiness workbook" },
    ])(
      "P$phase next-phase readiness files stay hidden until Approve & Build",
      ({ phase, workbook }) => {
        const move = makeMove({ currentPhase: phase });
        render(
          <MovesPhaseStandaloneClient
            canApproveGates
            carriesForwardContent={[]}
            evidenceNeedPackets={coveredEvidencePacketsForPhase(phase)}
            initialSubstepKey="prepare"
            move={move}
            phaseNum={phase}
            phaseTallies={[...phaseTallies]}
            syntheticEvidencePackHref={`/api/v1/programs/${move.id}/stage-readiness-evidence-pack?phase=${phase}`}
          />,
        );

        expect(
          screen.queryByRole("link", { name: workbook }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByLabelText("Upload completed readiness workbook"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole("link", { name: "Download sample upload files" }),
        ).not.toBeInTheDocument();

        fireEvent.click(workflowStepButton("Approve & Build"));

        expect(
          screen.getByRole("link", { name: workbook }),
        ).toBeInTheDocument();
        expect(
          screen.getByLabelText("Upload completed readiness workbook"),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("link", { name: "Download sample upload files" }),
        ).toBeInTheDocument();
      },
    );

    it.each([
      {
        phase: 3,
        substep: "prepare",
        next: "Compare Options",
        hiddenPanel: "Options & recommendation",
      },
      {
        phase: 3,
        substep: "options",
        next: "Record Decision",
        visiblePanel: "Options & recommendation",
        hiddenPanel: "Confirm the selected approach",
      },
      {
        phase: 3,
        substep: "decide",
        next: "Design Canvas",
        visiblePanel: "Confirm the selected approach",
        hiddenPanel: "The Building-Blocks Canvas",
      },
      {
        phase: 3,
        substep: "canvas",
        next: "Approve & Build",
        visiblePanel: "The Building-Blocks Canvas",
      },
      {
        phase: 4,
        substep: "prepare",
        next: "Value Case",
        hiddenPanel: "The value case",
      },
      {
        phase: 4,
        substep: "value",
        next: "Plan Workstreams",
        visiblePanel: "The value case",
        hiddenPanel: "Plan workstreams",
      },
      {
        phase: 4,
        substep: "workstreams",
        next: "Approve & Build",
        visiblePanel: "Plan workstreams",
      },
      {
        phase: 5,
        substep: "prepare",
        next: "Handoff Readiness",
        hiddenPanel: "Handoff readiness",
      },
      {
        phase: 5,
        substep: "workstreams",
        next: "Approve & Build",
        visiblePanel: "Handoff readiness",
      },
    ])(
      "P$phase $substep has one header action that advances to $next, with downstream prep withheld until approval",
      async ({ phase, substep, next, visiblePanel, hiddenPanel }) => {
        render(
          <MovesPhaseStandaloneClient
            canApproveGates
            carriesForwardContent={[]}
            evidenceNeedPackets={coveredEvidencePacketsForPhase(phase)}
            initialSubstepKey={substep as "prepare"}
            move={makeMove({ currentPhase: phase })}
            phaseNum={phase}
            phaseTallies={[...phaseTallies]}
          />,
        );

        const action = await screen.findByTestId("mxw-workflow-next-action");
        const actionSlot = document.getElementById("mxw-step-progress-action");
        expect(actionSlot?.querySelectorAll("button")).toHaveLength(1);
        expect(
          document
            .querySelector(".mxw-contract-legacy-body")
            ?.querySelectorAll(
              ".mxw-primary, .mxw-primary-action, .mxw-step-gate-button",
            ),
        ).toHaveLength(0);
        expect(action).toHaveTextContent(`Continue to ${next}`);
        expect(
          screen.queryByTestId("mxw-contract-comingup"),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByTestId("mxw-finder-comingup"),
        ).not.toBeInTheDocument();
        if (visiblePanel) {
          expect(
            screen.getByRole("heading", { name: visiblePanel }),
          ).toBeInTheDocument();
        }
        if (hiddenPanel) {
          expect(
            screen.queryByRole("heading", { name: hiddenPanel }),
          ).not.toBeInTheDocument();
        }

        if (phase === 3 && substep === "decide") {
          expect(
            screen.queryByRole("button", { name: "Upload decision files" }),
          ).not.toBeInTheDocument();
          expect(
            screen.getByRole("heading", {
              name: "Confirm the selected approach",
            }),
          ).toBeInTheDocument();
        }
        if (phase === 4 && substep === "value") {
          expect(
            document.querySelector(
              ".mxw-contract-legacy-body .mxw-evidence-count-link",
            ),
          ).toBeNull();
        }
        if (phase === 5 && substep === "workstreams") {
          expect(
            screen.getByRole("heading", { name: "Handoff readiness" }),
          ).toBeInTheDocument();
          expect(
            screen.getByText(
              /Project execution happens after handoff, outside Moves/i,
            ),
          ).toBeInTheDocument();
        }

        fireEvent.click(action);
        await waitFor(() => {
          expect(workflowStepButton(new RegExp(next, "i"))).toHaveClass(
            "active",
          );
        });

        if (next === "Approve & Build") {
          expect(
            screen.queryByTestId("mxw-workflow-next-action"),
          ).not.toBeInTheDocument();
          expect(
            screen.getByTestId("mxw-contract-comingup"),
          ).toBeInTheDocument();
        }
      },
    );

    it.each([3, 4, 5])(
      "P$phase final approval keeps one truthful primary action and no duplicate input editor",
      async (phase) => {
        render(
          <MovesPhaseStandaloneClient
            canApproveGates
            carriesForwardContent={[]}
            evidenceNeedPackets={coveredEvidencePacketsForPhase(phase)}
            initialSubstepKey="approve"
            move={makeMove({ currentPhase: phase })}
            phaseNum={phase}
            phaseTallies={[...phaseTallies]}
          />,
        );

        await waitFor(() => {
          const actionSlot = document.getElementById(
            "mxw-step-progress-action",
          );
          expect(actionSlot?.querySelectorAll("button")).toHaveLength(1);
          expect(actionSlot?.querySelector("button")).toHaveTextContent(
            /Complete phase inputs before build/i,
          );
          expect(actionSlot?.querySelector("button")).toBeDisabled();
        });
        expect(document.querySelector(".mxw-capture.compact")).toBeNull();
        expect(screen.getByTestId("mxw-contract-comingup")).toBeInTheDocument();
        const inputStepName =
          phase === 3
            ? "Solution approach & options"
            : phase === 4
              ? "Roadmap & sequencing"
              : "Handoff owners & RACI";
        expect(
          within(screen.getByLabelText(`P${phase} steps`)).getByRole("button", {
            name: inputStepName,
          }),
        ).toBeInTheDocument();
      },
    );

    it("saved structured business-change capture enables Continue and advances", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialApprovedP1CaptureEvidenceReferences={approvedP1CaptureEvidence(
            "charter_business_change",
          )}
          initialSubstepKey="prepare"
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Business change & adoption owner/i));
      expect(
        screen.getByLabelText("Expected workflow change"),
      ).toBeInTheDocument();
      const continueButton = screen.getByRole("button", {
        name: "Continue to Upload Evidence",
      });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);
      expect(contractStepButton(/Upload Evidence/i)).toHaveClass("active");
    });

    it("saved Finder facts enable Continue and advance", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={makeCoveredCurrentStateReadiness()}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(2)}
          initialPhaseCaptureValues={completeP2CaptureValues}
          initialSubstepKey="prepare"
          move={makeMove({ currentPhase: 2 })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Baseline metrics/i));
      expect(screen.getByText("Cycle time")).toBeInTheDocument();
      const continueButton = screen.getByRole("button", {
        name: "Save & continue",
      });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);
      expect(contractStepButton(/Gaps \/ root causes/i)).toHaveClass("active");
    });

    it("an empty structured facts array does not enable Continue", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={makeCoveredCurrentStateReadiness()}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(2)}
          initialPhaseCaptureValues={{
            ...completeP2CaptureValues,
            baseline_metrics: "[]",
          }}
          initialSubstepKey="prepare"
          move={makeMove({ currentPhase: 2 })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Baseline metrics/i));
      expect(
        screen.getByText("No baseline metrics captured yet."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Save & continue" }),
      ).toBeDisabled();
    });

    it("saved evidence-backed solution-route capture enables Continue and advances", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          currentStateReadiness={makeCoveredCurrentStateReadiness()}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(2)}
          initialApprovedEvidenceReferences={[
            {
              evidenceId: "approved-p2-evidence",
              title: "Approved discovery record",
              familyKey: "current_state_evidence",
            },
          ]}
          initialBusinessChangeAssessment={
            completeP1CaptureValues.business_change_assessment
          }
          initialPhaseCaptureValues={{
            ...completeP2CaptureValues,
            solution_route_validation: completeSolutionRouteValue,
          }}
          initialSubstepKey="prepare"
          move={makeMove({ currentPhase: 2 })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Validate solution route/i));
      expect(screen.getByLabelText("Human route decision")).toBeInTheDocument();
      const continueButton = screen.getByRole("button", {
        name: "Continue to Upload & Review",
      });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);
      expect(contractStepButton(/Upload & Review/i)).toHaveClass("active");
    });

    it("reviewed estimate model enables Continue and advances", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(4)}
          initialPhaseCaptureValues={{
            estimates_capacity: completeEstimateModelValue,
          }}
          initialSubstepKey="prepare"
          move={makeMove({ currentPhase: 4 })}
          phaseNum={4}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(contractStepButton(/Estimates & capacity/i));
      expect(
        screen.getByLabelText("Editable estimate model"),
      ).toBeInTheDocument();
      const continueButton = screen.getByRole("button", {
        name: "Save & continue",
      });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);
      expect(contractStepButton(/Value plan & business case/i)).toHaveClass(
        "active",
      );
    });

    it("shows a Continue on each input step: disabled until the required value is captured, then advancing to the next step", () => {
      const { unmount } = render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      // First input (Sponsor contact) is required and empty, so Continue is
      // disabled and tells the user what to do next.
      const blockedContinue = screen.getByRole("button", {
        name: "Save & continue",
      });
      expect(blockedContinue).toBeDisabled();
      expect(screen.getByText("Fill this in to continue.")).toBeInTheDocument();
      unmount();

      // With the sponsor value already captured, Continue is enabled and moves
      // the user to the next step (Scope boundary).
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={{
            sponsor_commitment:
              "Priya Nair, Chief Data & Analytics Officer — priya.nair@company.example",
          }}
          initialApprovedP1CaptureEvidenceReferences={approvedP1CaptureEvidence(
            "charter_sponsor",
          )}
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const continueButton = screen.getByRole("button", {
        name: "Save & continue",
      });
      expect(continueButton).toBeEnabled();
      fireEvent.click(continueButton);

      expect(
        screen.getByRole("heading", { name: "Scope boundary" }),
      ).toBeInTheDocument();
    });

    it("keeps phase lede, question, and aVa context sentences under the Phase 0 copy length guard", () => {
      const longSentences = movesPhaseCopyAuditBlocks().flatMap((block) =>
        block
          .split(/[.!?]/)
          .map((sentence) => sentence.trim())
          .filter(Boolean)
          .filter((sentence) => sentence.split(/\s+/).length > 20),
      );

      expect(longSentences).toEqual([]);
    });
  });

  // ─── moves_capture_handoff_recap_v1: the recap's reachability AT THE HOST ───
  // `captureHandoffAccess` and the recap's copy are pinned as a pure module and
  // on the component (MovesCaptureFlow.test.tsx), where the approve slot is a
  // stub `<button>`. What only the host can answer is whether the flag is wired
  // to the real surface: the host supplies a NON-NULL governed slot on every
  // path that mounts the flow — for an approver it is `PhaseApproveAndBuild`
  // (`button.mxw-phase-progress-button`), for everyone else an authorization
  // note — so the footer's one forward control is always spent and the flag is
  // the only thing that can open the recap. These cases pin that call site.
  describe("hand-off recap reachability at the host (moves_capture_handoff_recap_v1)", () => {
    // P1's substeps are prepare · decide · approve, so `initialSubstepKey`
    // "approve" lands the 3-step flow on its last step (`initialStep` is
    // `min(substepIndex, 2)`) without walking Continue through saved answers.
    const renderLastCaptureStep = (overrides: Record<string, unknown> = {}) =>
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          initialPhaseCaptureValues={completeP1CaptureValues}
          initialSubstepKey="approve"
          move={makeMove({ currentPhase: 1, phaseLabel: "P1 Charter" })}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
          {...overrides}
        />,
      );

    const openReview = () =>
      fireEvent.click(
        screen.getByRole("button", { name: "Review what you captured" }),
      );

    it("flag OFF (default): the host's governed control holds the last step's one forward control, so nothing opens the recap", () => {
      renderLastCaptureStep();

      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
      // The real governed control is what occupies the slot — not a stub.
      expect(
        document.querySelector(".mcf-approve-slot .mxw-phase-progress-button"),
      ).not.toBeNull();
      expect(
        screen.queryByRole("button", { name: "Review what you captured" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("mcf-handoff")).not.toBeInTheDocument();
    });

    it("flag ON: the review control opens a recap built from the host's own captured answers", () => {
      renderLastCaptureStep({ captureHandoffRecapEnabled: true });
      openReview();

      const handoff = screen.getByTestId("mcf-handoff");
      // `sectionRecap` reads the host's phase-capture values, so a real saved
      // answer — not a label or a placeholder — has to be what the recap shows.
      expect(within(handoff).getByText(/Jordan Lee, COO/)).toBeInTheDocument();
      expect(
        within(handoff).getByText(/In scope: Airport turnaround operations/),
      ).toBeInTheDocument();
    });

    it("flag ON: the real governed control travels onto the recap and the recap claims no submission", () => {
      renderLastCaptureStep({ captureHandoffRecapEnabled: true });
      openReview();

      const handoff = screen.getByTestId("mcf-handoff");
      // The decision still runs through the gate pipeline: it is the host's
      // own PhaseApproveAndBuild on the recap, not a second submit path.
      expect(
        handoff.querySelectorAll(".mxw-phase-progress-button"),
      ).toHaveLength(1);
      // Nothing was submitted, so the next phase cannot be begun from here...
      expect(
        within(handoff).queryByRole("button", { name: /^Begin / }),
      ).not.toBeInTheDocument();
      // ...and no heading may say it was. Assert over text NODES: sibling
      // spans join with no separator, so a container-wide negative assertion
      // can be satisfied by a neighbouring string.
      const claims = Array.from(
        handoff.querySelectorAll("span, h1, h2, h3"),
      ).map((node) => node.textContent?.trim() ?? "");
      expect(claims).not.toContain("Charter submitted");
      expect(claims.some((text) => /Charter is complete/.test(text))).toBe(
        false,
      );
      expect(handoff.querySelector(".mcf-tick")).toBeNull();
    });

    it("flag ON for a user who cannot approve: the recap is still reachable, and the authorization note travels in place of the control", () => {
      // The host's slot is non-null in BOTH authorization states. That is why
      // the flag — not the viewer's permission — is what makes the recap
      // reachable, and it is also why the recap must not offer a way around the
      // gate to someone who cannot approve.
      renderLastCaptureStep({
        canApproveGates: false,
        captureHandoffRecapEnabled: true,
      });
      openReview();

      const handoff = screen.getByTestId("mcf-handoff");
      expect(
        within(handoff).getByText(
          "Approval is available to an authorized workspace user.",
        ),
      ).toBeInTheDocument();
      expect(
        handoff.querySelectorAll(".mxw-phase-progress-button"),
      ).toHaveLength(0);
      expect(
        within(handoff).queryByRole("button", { name: /^Begin / }),
      ).not.toBeInTheDocument();
    });

    it("the flag cannot manufacture a surface: with moves_capture_v2 off there is no flow to review", () => {
      // The route conjoins the two flags server-side; this pins that the host
      // arm agrees, so a tenant enrolled in the recap flag alone sees exactly
      // today's product.
      renderLastCaptureStep({
        captureV2Enabled: false,
        captureHandoffRecapEnabled: true,
      });

      expect(
        screen.queryByTestId("moves-capture-flow"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Review what you captured" }),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    });

    it("flag ON with the charter basis recorded: the review carries the host's basis rollup, not only the post-submit recap", () => {
      // `handoffSummary` is the host's one fold of the declared bases — the
      // same computation the gate dialog discloses. Reaching the recap as a
      // review has to carry it, or the person reviews the answers without the
      // one thing that says how they are known.
      renderLastCaptureStep({
        captureHandoffRecapEnabled: true,
        charterBasisEnabled: true,
        initialP1CharterBasisBySection: Object.fromEntries(
          Object.keys(completeP1CaptureValues).map((sectionKey) => [
            sectionKey,
            { kind: "workspace_assertion" as const },
          ]),
        ),
      });
      openReview();

      const handoff = screen.getByTestId("mcf-handoff");
      expect(
        within(handoff).getByTestId("charter-basis-rollup"),
      ).toBeInTheDocument();
      // And the per-question marks the host supplies through
      // `renderSectionRecapMark`: every question row the review lists states
      // its own basis, so no answer reads back without one.
      const marks = Array.from(
        handoff.querySelectorAll('[data-testid="charter-basis-mark"]'),
      );
      const questionRows = handoff.querySelectorAll(".mcf-recap dl dt");
      expect(questionRows.length).toBeGreaterThan(0);
      expect(marks).toHaveLength(questionRows.length);
      // Each mark belongs to a question row, not to the rollup above it...
      expect(marks.filter((mark) => mark.closest("dt"))).toHaveLength(
        questionRows.length,
      );
      // ...and it states the basis that was recorded, not a generic badge.
      expect(
        new Set(marks.map((mark) => mark.getAttribute("data-basis"))),
      ).toEqual(new Set(["workspace_assertion"]));
      expect(new Set(marks.map((mark) => mark.textContent))).toEqual(
        new Set(["Asserted"]),
      );
    });
  });
  // ─── The build hold at P4/P5 states the reason it can act on ─────────────
  // `phaseCaptureStatusForSection` returns "Evidence open" for any section
  // with no `evidenceFamily` of its own once the phase's evidence check has
  // not passed — which is every P4 and P5 section. A fully answered, fully
  // saved P4 therefore counted as 0/7 inputs, and the build control's reason
  // was derived from that count alone: "Complete 7 phase inputs before
  // Approve & Build", for inputs that are complete. The evidence behind the
  // verdict is the discovery set re-stamped onto the active phase, so it is
  // closed in Files & Evidence and not on the screen stating the blocker.
  // `PhaseApproveAndBuild` already knows the right sentence, but the parent
  // blocker shadows it (`hasParentBlocker` is checked before
  // `hasRequiredGaps`), so the fix belongs in what the parent passes down.
  describe("a captured phase held by open evidence says so", () => {
    const p4Answers = {
      roadmap_sequencing: "Three waves, starting with the exception queue.",
      estimates_capacity: completeEstimateModelValue,
      value_plan: "Measured against the P2 baseline at day 90.",
      funding_governance: "Funded from the existing programme envelope.",
      risks_dependencies: "Source freshness is the main dependency.",
      handoff_plan: "Hands to the platform team with the runbook.",
      recommendation: "Proceed to mobilisation on the agreed sequence.",
    };
    const openEvidencePacketsForPhase = (phase: number) =>
      coveredEvidencePacketsForPhase(phase).map((packet) => ({
        ...packet,
        status: "missing" as const,
        evidenceSlot: "Data governance ownership",
        evidenceTitles: [],
      }));

    it("P4 with every input answered and its required evidence open blames the evidence", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={openEvidencePacketsForPhase(4)}
          initialPhaseCaptureValues={p4Answers}
          move={makeMove({
            currentPhase: 4,
            phaseLabel: "P4 Roadmap & Business Case",
          })}
          phaseNum={4}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // Continue is held even though every question is answered and saved, so
      // the band is the only thing that can explain the step.
      expect(
        screen.getByRole("button", { name: "Continue" }),
      ).toBeDisabled();
      const hold = screen.getByTestId("capture-evidence-hold");
      expect(hold).toHaveTextContent("Phase inputs are captured.");
      expect(hold).toHaveTextContent("1 required evidence item");
      expect(hold).toHaveTextContent("Data governance ownership");
      expect(hold).toHaveTextContent("Files & Evidence");
      // The defect: a count of held-but-complete sections read as missing
      // inputs, with no mention of evidence and nothing on screen to do.
      expect(hold).not.toHaveTextContent(
        /Complete \d+ phase inputs? before Approve & Build/,
      );
      expect(
        screen.getByRole("button", { name: /Open Files & Evidence/i }),
      ).toBeInTheDocument();
    });

    it("P4 with its required evidence covered holds nothing and shows no band", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={coveredEvidencePacketsForPhase(4)}
          initialPhaseCaptureValues={p4Answers}
          move={makeMove({
            currentPhase: 4,
            phaseLabel: "P4 Roadmap & Business Case",
          })}
          phaseNum={4}
          phaseTallies={[...phaseTallies]}
        />,
      );
      // Nothing holds this phase, so the flow resumes on its last step with
      // the governed approve slot in place of Continue — and no band.
      expect(screen.getByTestId("moves-capture-flow")).toBeInTheDocument();
      expect(
        screen.queryByTestId("capture-evidence-hold"),
      ).not.toBeInTheDocument();
    });

    // Unanswered capture is work on the same screen, so it stays the stated
    // reason and the evidence band must not take its place.
    it("P4 missing an answer shows no evidence band, even with evidence open", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={openEvidencePacketsForPhase(4)}
          initialPhaseCaptureValues={{ ...p4Answers, roadmap_sequencing: "" }}
          move={makeMove({
            currentPhase: 4,
            phaseLabel: "P4 Roadmap & Business Case",
          })}
          phaseNum={4}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.queryByTestId("capture-evidence-hold"),
      ).not.toBeInTheDocument();
    });

    it("P5 is held the same way, so the fix is not P4-specific", () => {
      render(
        <MovesPhaseStandaloneClient
          canApproveGates
          captureV2Enabled
          carriesForwardContent={[]}
          evidenceNeedPackets={openEvidencePacketsForPhase(5)}
          initialPhaseCaptureValues={{
            mobilization_plan: "Platform team takes the runbook on day one.",
            launch_readiness: "Entry criteria signed by the service owner.",
            value_proof_rules: "Day-90 read against the agreed baseline.",
            first_90_days: "Three milestones, each with a named owner.",
            governance_cadence: "Monthly review with the steering group.",
            risks_open_items: "Source freshness remains the open risk.",
            recommendation: "Go live on the agreed sequence.",
          }}
          move={makeMove({
            currentPhase: 5,
            phaseLabel: "P5 Mobilize",
          })}
          phaseNum={5}
          phaseTallies={[...phaseTallies]}
        />,
      );
      expect(
        screen.getByTestId("capture-evidence-hold"),
      ).toHaveTextContent("Phase inputs are captured.");
    });
  });
});
