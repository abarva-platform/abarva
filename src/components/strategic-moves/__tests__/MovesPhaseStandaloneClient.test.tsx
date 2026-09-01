/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
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
  movesPhaseCopyAuditBlocks,
} from "../MovesPhaseStandaloneClient";
import type { MoveEvidenceNeedPacket } from "@/lib/programs/evidence-readiness/move-evidence-need-packet";
import type { ReadinessReport } from "@/lib/programs/current-state-readiness";
import type { PhaseTallyRow } from "@/lib/programs/phase-explorer-tallies";
import { buildPhaseNavigationStatus } from "@/lib/programs/phase-navigation-status";
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
    "Sponsor confirms weekly charter review cadence and decision authority.",
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
};

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
            title: "Current-state workshop notes",
            parseMethod: "office_parser",
            confidence: 0.86,
            submittedAt: "2026-07-22T00:00:00Z",
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
    currentStateFamilyIngests = [];
    global.fetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

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
            json: async () => ({ ok: true, reviewState: "review_required" }),
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
          uploadedEvidenceArtifacts.push({
            artifactId: `artifact-${uploadedEvidenceArtifacts.length + 1}`,
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
            json: async () => ({ ok: true }),
          } as Response;
        }

        if (url.includes("/artifacts?family=uploaded_evidence")) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ artifacts: uploadedEvidenceArtifacts }),
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
                status: "review_required",
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
                    "Sponsor confirms weekly charter review cadence.",
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

  describe("retired legacy shell paths", () => {
    it("renders the Finder contract shell even when the old feature flag mock is false", () => {
      render(
        <MovesPhaseStandaloneClient
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

    it("renders the new shell without any feature-flag fallback dependency", () => {
      render(
        <MovesPhaseStandaloneClient
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

    it("renders the Finder shell class and data attribute with the expected tab/phase structure", () => {
      render(
        <MovesPhaseStandaloneClient
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
        screen.getByRole("complementary", { name: "Move phases" }),
      ).toBeInTheDocument();
    });

    it("P1 renders the contract canvas while preserving real workflow controls", async () => {
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={move}
          phaseNum={1}
          phaseTallies={[...phaseTallies]}
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
        within(contractCard).getAllByText("Sponsor commitment").length,
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

    it("keeps a blocked P2 request on P1 with the server-derived why, remains, and next action above the fold", () => {
      const move = makeMove({
        currentPhase: 1,
        phaseLabel: "P1 Charter",
      });
      render(
        <MovesPhaseStandaloneClient
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
  });

  describe("MOVES-UI-003 rail collapse/expand toggle", () => {
    it("keeps compact phase and workspace controls reachable when the desktop rail is hidden", () => {
      render(
        <MovesPhaseStandaloneClient
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

    it("keeps the collapse toggle available even when the old feature flag mock is false", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const rail = screen.getByRole("complementary", { name: "Move phases" });
      expect(rail).not.toHaveClass("mxw-side-collapsed");
      expect(
        screen.getByRole("button", { name: /collapse phase rail/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();
      expect(screen.getByText("Stage workspace")).toBeInTheDocument();
    });

    it("renders a collapse toggle; clicking it collapses the rail to an icon-only strip (real DOM/class change), and clicking again expands it back", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const rail = screen.getByRole("complementary", { name: "Move phases" });
      expect(rail).not.toHaveClass("mxw-side-collapsed");
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();

      const toggle = screen.getByRole("button", {
        name: "Collapse phase rail",
      });
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveTextContent("«");

      fireEvent.click(toggle);

      // Real DOM/class change, not just an internal state flip: the rail
      // picks up the collapsed modifier class and its group/phase labels
      // stop rendering entirely.
      expect(rail).toHaveClass("mxw-side-collapsed");
      expect(
        screen.queryByText("Understand Current State"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Stage workspace")).not.toBeInTheDocument();
      const expandToggle = screen.getByRole("button", {
        name: "Expand phase rail",
      });
      expect(expandToggle).toHaveAttribute("aria-expanded", "false");
      expect(expandToggle).toHaveTextContent("»");

      fireEvent.click(expandToggle);

      expect(rail).not.toHaveClass("mxw-side-collapsed");
      expect(screen.getByText("Understand Current State")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Collapse phase rail" }),
      ).toBeInTheDocument();
    });

    it("collapsed: a reachable phase's icon is still a real link to its phase route (navigation survives collapse)", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: "Collapse phase rail" }),
      );

      // Phase 2 ("Understand Current State") is <= currentPhase (3), so it
      // renders as a Link both expanded and collapsed — reuses the same
      // click/navigation handler, just hides the text label.
      const rail = screen.getByRole("complementary", { name: "Move phases" });
      const phaseLink = within(rail).getByTitle(
        "Understand Current State · 2 of 2",
      );
      expect(phaseLink.tagName).toBe("A");
      expect(phaseLink).toHaveAttribute(
        "href",
        `/strategic-moves/${"37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4"}/phase/2`,
      );
      expect(
        within(phaseLink).queryByText("Understand Current State"),
      ).toBeNull();
    });
  });

  describe("MOVES-UI-002 approvals overview", () => {
    it("opens the overview even when the old feature flag mock is false", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove()}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );

      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Approvals overview")).toBeInTheDocument();
    });

    it("opens the overview list with every row reproducible from the mocked getMovePhaseTallies output alone", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );

      expect(
        screen.getByRole("heading", { name: "Approvals overview" }),
      ).toBeInTheDocument();
      const overview = screen.getByLabelText("Approvals overview");

      // P0-P2 are "done" in the mocked tallies (met === total) -> Approved.
      expect(screen.getAllByText("Approved").length).toBe(3);
      // P3 is "current" with met=0/total=2 -> not yet submitted, exact tally
      // text sourced only from the mocked row's met/total fields.
      expect(
        screen.getByText("0/2 met — not yet submitted"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("0 of 2 met").length).toBeGreaterThan(0);
      // P4/P5 are "upcoming" -> Not reached.
      expect(screen.getAllByText("Not reached").length).toBe(2);
      expect(within(overview).queryByText("Sponsor")).not.toBeInTheDocument();
      expect(within(overview).getAllByText("Not yet assigned").length).toBe(4);
      expect(
        within(overview).getByText(
          "Business approver · Technology approver · Risk/security approver",
        ),
      ).toBeInTheDocument();
      expect(
        within(overview).getByText("Business approver · Finance approver"),
      ).toBeInTheDocument();
    });

    it("current-phase row: Review & approve returns to the phase workspace at the approve substep", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );
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
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({ currentPhase: 3 })}
          phaseNum={3}
          phaseTallies={[...phaseTallies]}
        />,
      );

      fireEvent.click(
        screen.getByRole("button", { name: /^.?\s*Approvals$/i }),
      );
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

    expect(screen.getAllByText(/already approved/i).length).toBeGreaterThan(0);
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Prepare to Execute",
          terminalComplete: true,
        })}
        phaseNum={5}
        phaseTallies={terminalTallies}
      />,
    );

    expect(
      screen.getByRole("link", { name: /Prepare to Execute\s+2 of 2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Open Tower →")).toBeInTheDocument();
    expect(
      screen.getByText(/P5 is already approved and handed off to Tower/i),
    ).toBeInTheDocument();
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
        name: /Continue to P5 Prepare to Execute/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the saved seven-answer P0 brief separately from gate criteria", () => {
    render(
      <MovesPhaseStandaloneClient
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

    expect(
      screen.getByText("Review your seven Originate answers"),
    ).toBeInTheDocument();
    expect(screen.getByText("7 of 7")).toBeInTheDocument();
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

  it("frames P1 as a posture hypothesis, not a solution approach recommendation", () => {
    render(
      <MovesPhaseStandaloneClient
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
    expect(
      (screen.getByLabelText("Sponsor commitment") as HTMLTextAreaElement)
        .value,
    ).toBe("");
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

    fireEvent.click(contractStepButton(/Sponsor commitment/i));
    const sponsorInput = screen.getAllByLabelText(
      "Sponsor commitment",
    )[0] as HTMLTextAreaElement;
    fireEvent.change(sponsorInput, {
      target: { value: "Sponsor confirms weekly charter review cadence." },
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

  it("marks a P1 field done only after save acknowledgment and reload reproduces it", async () => {
    const savedText = "Sponsor confirms weekly charter review cadence.";
    const { unmount } = render(
      <MovesPhaseStandaloneClient
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

    fireEvent.click(contractStepButton(/Sponsor commitment/i));
    const sponsorInput = screen.getAllByLabelText(
      "Sponsor commitment",
    )[0] as HTMLTextAreaElement;
    fireEvent.change(sponsorInput, {
      target: { value: savedText },
    });

    await waitFor(
      () => {
        expect(screen.getAllByText(/^Done$/i).length).toBeGreaterThan(0);
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
    fireEvent.click(contractStepButton(/Sponsor commitment/i));
    expect(
      (screen.getAllByLabelText("Sponsor commitment")[0] as HTMLTextAreaElement)
        .value,
    ).toBe(savedText);
    expect(screen.getAllByText(/^Done$/i).length).toBeGreaterThan(0);
  });

  it("uses P1 step 2 for uploading evidence, with multiple files enabled", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
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
    expect(
      screen.getByRole("button", { name: "Open Files & Evidence" }),
    ).toBeInTheDocument();
  });

  it("routes P2 current-state uploads through readiness evidence families instead of generic artifact upload", async () => {
    render(
      <MovesPhaseStandaloneClient
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
          phaseLabel: "P2 Understand Current State",
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

  it("rejects canonical-backed P2 uploads informatively from Upload & Review", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        initialSubstepKey="current"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
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
            new File(["repo,deploy_frequency"], "dora_delivery_baseline.csv", {
              type: "text/csv",
            }),
          ],
        },
      },
    );

    await waitFor(() => {
      expect(
        screen.getByText(/not Upload & Review/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/governed data load/i)).toBeInTheDocument();
    expect(
      screen.getByText(/structured current-state CSV path/i),
    ).toBeInTheDocument();
    expect(currentStateFamilyIngests).toEqual([]);
    expect(uploadedEvidenceArtifacts).toHaveLength(0);
  });

  it("routes airline P2 uploads by active readiness family labels", async () => {
    render(
      <MovesPhaseStandaloneClient
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
          phaseLabel: "P2 Understand Current State",
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
      (screen.getByLabelText("Sponsor commitment") as HTMLTextAreaElement)
        .value,
    ).toBe("");
    expect(
      (screen.getByLabelText("Scope boundary") as HTMLTextAreaElement).value,
    ).toBe("");
    fireEvent.click(contractStepButton(/Approve & Build/i));

    const buildButton = screen.getByRole("button", {
      name: /Complete phase inputs before build/i,
    });
    expect(buildButton).toBeDisabled();
    expect(
      screen.getAllByText(/Complete 6 phase inputs before Approve & Build/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it("keeps solution approach selection in P3 after discovery evidence", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="decide"
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
      screen.getByRole("heading", { name: "Decide the approach" }),
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
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
          phaseLabel: "P3 Choose the Approach",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(screen.getByText("7 inputs available")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
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
        carriesForwardContent={[]}
        evidenceNeedPackets={evidenceNeedPackets}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(
      screen.getByText(/Next: P4 Build the Plan readiness/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Cost baseline").length).toBeGreaterThan(0);
    expect(screen.getByText(/Format: CSV, XLSX/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /traceable cost and value assumptions before funding-grade estimates/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Suggested working sessions for P4 Build the Plan"),
    ).toBeInTheDocument();
    expect(screen.getByText("Value case workshop")).toBeInTheDocument();
  });

  it("surfaces real carries-forward content extracted from this phase's generated deliverable", () => {
    render(
      <MovesPhaseStandaloneClient
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Choose the Approach" }),
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
    expect(screen.getByText("P2 design inputs pack")).toBeInTheDocument();
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 4,
          phaseLabel: "P4 Build the Plan",
        })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Build the Plan" }),
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

  it("hides the Cost & Effort rail entry point when moves_pricing_engine is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({ currentPhase: 4, phaseLabel: "P4 Build the Plan" })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Cost & Effort/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Cost & Effort rail entry point only on P4 when the flag is on, and opens the wizard", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({ currentPhase: 4, phaseLabel: "P4 Build the Plan" })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
        pricingEngineEnabled
      />,
    );
    const costEffortButton = screen.getByRole("button", {
      name: /Cost & Effort/i,
    });
    expect(costEffortButton).toBeInTheDocument();
    fireEvent.click(costEffortButton);
    expect(
      screen.getByRole("heading", { name: "Cost & Effort" }),
    ).toBeInTheDocument();
  });

  it("does not show the Cost & Effort rail entry point on a non-P4 phase, even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Choose the Approach",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        pricingEngineEnabled
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Cost & Effort/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the Risk Assessment rail entry point when moves_risk_tier_scoring_v1 is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
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
    expect(
      screen.queryByRole("button", { name: /Risk Assessment/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Risk Assessment rail entry point only on P2 when the flag is on, and opens the panel", () => {
    render(
      <MovesPhaseStandaloneClient
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
    const riskButton = screen.getByRole("button", { name: /Risk Assessment/i });
    expect(riskButton).toBeInTheDocument();
    fireEvent.click(riskButton);
    expect(
      screen.getByRole("heading", { name: "Risk Assessment" }),
    ).toBeInTheDocument();
  });

  it("also shows the Risk Assessment rail entry point on P3 when the flag is on — starts at P2, finalizes at P3", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Choose the Approach",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        riskAssessmentEnabled
      />,
    );
    expect(
      screen.getByRole("button", { name: /Risk Assessment/i }),
    ).toBeInTheDocument();
  });

  it("does not show the Risk Assessment rail entry point on P4 (or any phase other than P2/P3), even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({ currentPhase: 4, phaseLabel: "P4 Build the Plan" })}
        phaseNum={4}
        phaseTallies={[...phaseTallies]}
        riskAssessmentEnabled
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Risk Assessment/i }),
    ).not.toBeInTheDocument();
  });

  it("hides the Solutioning rail entry point when moves_solution_pattern_gate_v1 is off (the default)", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Choose the Approach",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Solutioning/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the Solutioning rail entry point only on P3 when the flag is on, and opens the panel", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 3,
          phaseLabel: "P3 Choose the Approach",
        })}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
        solutionPatternGateEnabled
      />,
    );
    const solutioningButton = screen.getByRole("button", {
      name: /Solutioning/i,
    });
    expect(solutioningButton).toBeInTheDocument();
    fireEvent.click(solutioningButton);
    expect(
      screen.getByRole("heading", { name: "Solutioning" }),
    ).toBeInTheDocument();
  });

  it("does not show the Solutioning rail entry point on a non-P3 phase, even with the flag on", () => {
    render(
      <MovesPhaseStandaloneClient
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
    expect(
      screen.queryByRole("button", { name: /Solutioning/i }),
    ).not.toBeInTheDocument();
  });

  it("renders P5 in the contract shell instead of the older prepare wall", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Prepare to Execute",
        })}
        phaseNum={5}
        phaseTallies={[...phaseTallies]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Prepare to Execute" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Files & Evidence")).toBeInTheDocument();
    expect(screen.getByTestId("mxw-contract-card")).toBeInTheDocument();
    expect(screen.queryByTestId("mxw-finder-steps")).not.toBeInTheDocument();
    const menu = screen.getByLabelText("P5 steps");
    expect(
      within(menu).getByRole("button", { name: /Mobilization plan & RACI/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 10")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Mobilization plan & RACI/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Launch readiness/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", {
        name: /Value-proof rules & metrics/i,
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
      within(menu).getByRole("button", { name: /Recommendation to launch/i }),
    ).toBeInTheDocument();
    expect(
      within(menu).getByRole("button", { name: /Execution Readiness/i }),
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
      within(menu).getByRole("button", { name: /Execution Readiness/i }),
    );
    expect(
      screen.getByRole("heading", { name: "Execution Readiness" }),
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
        carriesForwardContent={[]}
        currentStateReadiness={makeCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
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
        carriesForwardContent={[]}
        currentStateReadiness={makeReviewRequiredCurrentStateReadiness()}
        evidenceNeedPackets={[]}
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
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

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/programs/37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4/current-state/evidence/evidence-review-1/approve",
        expect.objectContaining({ method: "POST" }),
      );
    });
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
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
    expect(screen.getByText(/Left-side checks mean the step inputs are captured/i)).toBeInTheDocument();
    expect(screen.getByText(/gate advances only after required evidence, outputs, and approvals pass/i)).toBeInTheDocument();
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "Resolve 1 hard gate blocker before advancing",
    );
    expect(screen.getByTestId("mxw-decision-surface")).toHaveTextContent(
      "Hard: Discovery synthesis signed off",
    );
    expect(screen.getByText("Gate execution checklist")).toBeInTheDocument();
  });

  it("the evidence-item counts at gate approval are clickable links that open Files & Evidence, not inert text", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 2,
          phaseLabel: "P2 Understand Current State",
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

  it("does not load the legacy facilitated session playbook on the Prepare tab", () => {
    render(
      <MovesPhaseStandaloneClient
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

    fireEvent.click(
      screen.getByRole("button", { name: /Phase Intelligence/i }),
    );
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

    fireEvent.click(contractStepButton(/Record Decision/i));

    expect(
      screen.getByRole("heading", { name: "Decide the approach" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Upload evidence for approach decision",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /\(recommended\)/i }));

    fireEvent.click(contractStepButton(/Approve & Build/i));

    expect(
      screen.getByRole("heading", { name: "Gate approval" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 required next-phase prep item/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /These items are carried forward as next-phase preparation/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    ).toBeEnabled();
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /CANARY — SkyHarbor Recovery Command IROPS Target Architecture/i,
        ),
      ).toBeInTheDocument();
    });

    // Real click on the real "Open" action must open the stable artifact route
    // in a separate tab. It must never navigate the Moves workspace away.
    fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "/api/v1/artifacts/d74ed94a-a600-46ee-ad5d-a505556c4cac?inline=1",
        "moves-artifact-d74ed94a-a600-46ee-ad5d-a505556c4cac",
        "noopener,noreferrer",
      );
    });
  });

  it("supports the explorer, upload, aVa launcher, and gate ceremony interactions", async () => {
    const { container } = render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Files & Evidence/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /Stage workspace/i }));
    fireEvent.click(contractStepButton(/Record Decision/i));
    fireEvent.click(screen.getByRole("button", { name: /\(recommended\)/i }));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    expect(
      screen.queryByRole("button", { name: /Review governed build/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve & advance/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
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
                    reason: "Charter signed off by sponsor",
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
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Record Decision/i));
    fireEvent.click(screen.getByRole("button", { name: /\(recommended\)/i }));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
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
      screen.getAllByText(/Charter signed off by sponsor/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/approve or upload the client-approved deliverable/i),
    ).toBeInTheDocument();
  });

  it("gates Approve & Build behind a confirmation dialog and does not enqueue a build until confirmed", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        currentUser={{ email: "jane@apex-retail.com", role: "client_admin" }}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Record Decision/i));
    fireEvent.click(screen.getByRole("button", { name: /\(recommended\)/i }));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/Approving as: jane@apex-retail.com/i),
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
        name: /Approve & Build P3 Choose the Approach/i,
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
        carriesForwardContent={[]}
        currentUser={{ email: "jane@apex-retail.com", role: "client_admin" }}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP3CaptureValues}
        move={makeMove()}
        phaseNum={3}
        phaseTallies={[...phaseTallies]}
      />,
    );

    fireEvent.click(contractStepButton(/Record Decision/i));
    fireEvent.click(screen.getByRole("button", { name: /\(recommended\)/i }));
    fireEvent.click(contractStepButton(/Approve & Build/i));
    fireEvent.click(
      screen.getByRole("button", {
        name: /Approve & Build P3 Choose the Approach/i,
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
        name: /Approve & Build P3 Choose the Approach/i,
      }),
    ).not.toBeDisabled();

    jest.useRealTimers();
  });

  it("submits an already-satisfied P5 gate without regenerating artifacts", async () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        currentUser={{ email: "move.runner@example.com", role: "client_admin" }}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP5CaptureValues}
        initialSubstepKey="approve"
        move={makeMove({
          currentPhase: 5,
          phaseLabel: "P5 Prepare to Execute",
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
  });

  it("gets cited aVa drafts without writing, then persists only after Save changes", async () => {
    render(
      <MovesPhaseStandaloneClient
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
      "Sponsor commitment",
    )[0] as HTMLTextAreaElement;
    expect(sponsorInput.value).toBe(
      "Sponsor confirms weekly charter review cadence.",
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
          sponsor_commitment: "Sponsor confirms weekly charter review cadence.",
        },
      }),
    );
  });

  it("does not offer aVa draft action when phase inputs are already complete", () => {
    render(
      <MovesPhaseStandaloneClient
        carriesForwardContent={[]}
        evidenceNeedPackets={[]}
        initialPhaseCaptureValues={completeP1CaptureValues}
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
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
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
        phaseLabel: "P2 Understand Current State",
      });
      render(
        <MovesPhaseStandaloneClient
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

    it("clicking a phase-input row updates the detail pane to that section's real captured value; clicking a workflow row restores the real substep content", () => {
      const move = makeMove({
        currentPhase: 2,
        phaseLabel: "P2 Understand Current State",
      });
      render(
        <MovesPhaseStandaloneClient
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
      expect(
        screen
          .getAllByText(move.name)
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
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
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
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
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

    it("citation toggle: absent by default (no captured source), then appears and actually reveals/hides the source caption once a real source is captured", () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
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

    it("upload-type workflow step: the real file input reachable from the two-column detail pane invokes the same existing upload wiring (no new handler built)", async () => {
      render(
        <MovesPhaseStandaloneClient
          carriesForwardContent={[]}
          evidenceNeedPackets={[]}
          move={makeMove({
            currentPhase: 2,
            phaseLabel: "P2 Understand Current State",
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

    it("'Coming up' card: opens by default when real readiness-pack chips exist, then collapses and reopens the same real data", () => {
      render(
        <MovesPhaseStandaloneClient
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
            phaseLabel: "P2 Understand Current State",
          })}
          phaseNum={2}
          phaseTallies={[...phaseTallies]}
        />,
      );

      const comingUp = screen.getByTestId("mxw-contract-comingup");
      const toggle = within(comingUp).getByRole("button", {
        name: "What P3 Choose the Approach will need",
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
});
