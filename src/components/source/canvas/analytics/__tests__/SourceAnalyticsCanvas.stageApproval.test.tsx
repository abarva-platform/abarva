/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const routerPush = jest.fn();
const routerRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPush,
    replace: jest.fn(),
    refresh: routerRefresh,
  }),
  usePathname: () => "/source/events/evt-scope",
  useSearchParams: () => new URLSearchParams("stage=scope&workspace=approvals"),
  useParams: () => ({ eventId: "evt-scope" }),
}));

jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isLoaded: true, user: null }),
  useClerk: () => ({ signOut: jest.fn() }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null,
  UserButton: () => null,
}));

import { SourceAnalyticsCanvas, liveFallbackStageViewFor } from "../SourceAnalyticsCanvas";
import {
  SAMPLE_BAFO_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_SCOPE_STAGE,
  SAMPLE_TRANSITION_STAGE,
} from "../sample-view-model";
import { SAMPLE_STRATEGY_STAGE } from "../strategy-sample-view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import type { SourceEventArtifactState, SourceEventEvidence, SourceEventGateCriterion } from "@/lib/source/canvas-substrate";
import { criteriaForStage, evidenceForStage as canonicalEvidenceForStage, specByCode } from "@/lib/source/canonical-specs";
import { evidenceForStage } from "@/lib/source/canonical-specs/evidence-requirements";
import type { SourcingEventSummary } from "@/lib/source/types";

const EVENT: SourcingEventSummary = {
  id: "evt-scope",
  code: "SRC-AMS-STAGE-GATE-2026",
  name: "AMS Competitive RFP",
  accountName: "Demo Client",
  leadAgent: "Sentinel",
  archetype: "AMS",
  rigor: "strategic",
  status: "active",
  statusLabel: "Active",
  priority: "high",
  currentStageKey: "scope",
  currentStageLabel: "Scope",
  openAlerts: 0,
  owner: "Procurement",
  decisionOwner: "Business sponsor",
  agingDays: 1,
  blocker: null,
  nextAction: "Approve Scope gate",
  isAtRisk: false,
  valueAtStakeUsd: 9_000_000,
  projectedValueUsd: 0,
  realizedValueUsd: 0,
  nextDecision: "Advance to RFP",
};

const APPROVAL: ApprovalsInboxItem = {
  kind: "stage_gate",
  eventId: EVENT.id,
  eventCode: EVENT.code,
  eventName: EVENT.name,
  ask: "Approve advancing out of Scope.",
  readiness:
    "0 of 5 gate items met - you can approve with gaps (rationale required) or wait.",
  status: "ready_with_gaps",
  stageKey: "scope",
  stageLabel: "Scope",
  estimatedValueUsd: EVENT.valueAtStakeUsd,
  href: `/source/events/${EVENT.id}?stage=scope`,
  actionLabel: "Review & decide",
  versionKey: `${EVENT.id}:scope`,
  versionLabel: "Scope",
  requiredReviewerRole: "Source stage approver",
};

const COMPLETE_SCOPE_STAGE = {
  ...SAMPLE_SCOPE_STAGE,
  tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
    ...task,
    state: "done" as const,
    evidenceComplete: true,
  })),
};

const SCOPE_READY_ARTIFACTS = [
  {
    id: "scope-app-inventory",
    artifactCode: "d04_app_inv",
    stageKey: "scope",
    status: "client_final",
    title: "Application Inventory & Tiering",
  },
  {
    id: "scope-memo",
    artifactCode: "d05_scope_memo",
    stageKey: "scope",
    status: "client_final",
    isClientFinal: true,
    title: "Scope Memo with Boundaries",
    body: `Decision requested: approve the Scope boundary for the managed-services sourcing event.
    Executive summary: the application estate, service tower, exclusion log, ticket baseline,
    retained responsibility model, and sponsor commitment are complete enough for a sourcing
    owner to advance to the next gate. Scope in: Tier 1 and Tier 2 business applications,
    L2/L3 support services, knowledge transfer, service desk escalation, incident triage,
    and operational reporting. Scope out: end-user device support, SOC operations, business
    process ownership, and applications already in decommission. Evidence basis: application
    inventory, scope memo, exclusion log, ticket history, retained responsibility matrix, and
    sponsor sign-off. Required exhibits: in scope towers, support tiers, exclusions,
    run change boundary, open scope questions. The in scope towers are application
    management, incident management, release support, and reporting. Support tiers are
    Tier 1 business-critical and Tier 2 important applications. Exclusions are end-user
    device support, SOC operations, and decommissioning apps. The run/change boundary puts
    steady-state support in scope and project delivery out of scope. Open scope questions:
    final vendor-facing volume bands and SLA history must be confirmed in the next gate.
    sponsor sign-off. Remaining risk: pricing should continue to validate volumes and SLA
    history before vendor release. Recommended action: open the Scope approval gate and
    advance to RFP preparation.`,
    bodyGenerationMetadata: {
      qualityGate: {
        passed: true,
        overallScore: 9,
        finalSummary: "Passed: evidence-bound scope memo.",
        unsupportedClaims: [],
        missingEvidence: [],
      },
    },
  },
  {
    id: "scope-exclusions",
    artifactCode: "d06_excl_log",
    stageKey: "scope",
    status: "client_final",
    title: "Exclusion Log",
  },
  {
    id: "scope-ticket-history",
    artifactCode: "d07_ticket_synth",
    stageKey: "scope",
    status: "client_final",
    title: "Ticket History Synthesis",
  },
];

const SCOPE_READY_EVIDENCE: SourceEventEvidence[] = evidenceForStage("scope")
  .filter((requirement) => requirement.level === "required")
  .map((requirement, index) => ({
    id: `scope-evidence-${index}`,
    sourceEventId: EVENT.id,
    tenantKey: "demo-client",
    requirementId: requirement.requirementId,
    stage: "scope",
    currentState: "Usable Evidence",
    sourceArtifactId: null,
    sourceEventFactIds: [`fact-${index}`],
    notes: null,
    lastSyncedAt: null,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  }));

describe("SourceAnalyticsCanvas stage workflow", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerRefresh.mockClear();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, stageAdvancedTo: "rfp" }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reviews the current Strategy criteria before offering stage approval", async () => {
    const strategyEvent = {
      ...EVENT,
      currentStageKey: "strategy" as const,
      currentStageLabel: "Strategy",
      approvalPolicyCode: "self_v1" as const,
    };
    const states: SourceEventGateCriterion[] = criteriaForStage("strategy").map((criterion) => ({
      id: `${EVENT.id}:${criterion.criterionId}`,
      sourceEventId: EVENT.id,
      tenantKey: "demo-client",
      criterionId: criterion.criterionId,
      fromStage: criterion.fromStage,
      toStage: criterion.toStage,
      state: "pending",
      reviewerUserId: null,
      reviewedAt: null,
      notes: null,
      evidenceArtifactIds: [],
      waiverApprovalId: null,
      createdAt: "2026-09-29T00:00:00Z",
      updatedAt: "2026-09-29T00:00:00Z",
    }));
    const approval = {
      ...APPROVAL,
      stageKey: "strategy" as const,
      stageLabel: "Strategy",
      versionKey: `${EVENT.id}:strategy`,
      versionLabel: "Strategy",
    };
    render(<SourceAnalyticsCanvas
      event={strategyEvent}
      viewStage="strategy"
      tenantName="Demo Client"
      stageView={{
        ...SAMPLE_STRATEGY_STAGE,
        tasks: SAMPLE_STRATEGY_STAGE.tasks.map((task) => ({ ...task, state: "done" as const, evidenceComplete: true })),
        gate: { ...SAMPLE_STRATEGY_STAGE.gate, action: {
          eventId: EVENT.id,
          rationale: "Synthetic Event Owner review of Strategy evidence and artifacts.",
          confirmationKeys: ["strategyMemoReviewed", "valueTargetReviewed", "archetypeReviewed"],
          redirectStageKey: "scope",
        } },
      }}
      approvalItems={[approval]}
      gateCriterionStates={states}
      stageArtifactStates={[
        { id: "d01", sourceEventId: EVENT.id, tenantKey: "demo-client", artifactCode: "d01_strategy_memo", stage: "strategy", family: "sourcing_strategy", tier: "stub", status: "approved", requirementLevel: "required", gateDefining: true, linkedArtifactId: "file-d01", notes: null, body: null, bodyFormat: "markdown", bodyAuthoredBy: null, bodyUpdatedAt: null, bodyGenerationMetadata: null, createdAt: "", updatedAt: "" },
        { id: "d02", sourceEventId: EVENT.id, tenantKey: "demo-client", artifactCode: "d02_value_target", stage: "strategy", family: "sourcing_strategy", tier: "stub", status: "approved", requirementLevel: "required", gateDefining: true, linkedArtifactId: "file-d02", notes: null, body: null, bodyFormat: "markdown", bodyAuthoredBy: null, bodyUpdatedAt: null, bodyGenerationMetadata: null, createdAt: "", updatedAt: "" },
      ]}
      initialWorkspace="approvals"
      canRetireEvent
    />);

    expect(screen.getByTestId("source-stage-criterion-review")).toHaveTextContent("0 of 3 recorded");
    expect(screen.getByTestId("source-stage-criterion-review")).toHaveTextContent("Archetype + rigor level chosen");
    expect(screen.getByTestId("source-stage-criterion-review")).toHaveTextContent("Client Final required for d03_archetype_decision");
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.queryByText("This viewer does not currently have the server-side approval action armed.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Review Sourcing strategy memo approved by Event Owner" }));
    fireEvent.change(screen.getByLabelText("Criterion rationale"), { target: { value: "synthetic_e2e_smoke: Event Owner reviewed the accepted Strategy memo." } });
    fireEvent.click(screen.getByRole("button", { name: "Mark criterion met" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      `/api/v1/source/${EVENT.id}/gate-criteria/GATE-STRATEGY-01/state`,
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    ));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({ state: "met", reason: expect.stringContaining("synthetic_e2e_smoke") });
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("offers Strategy approval only after every canonical criterion and its evidence are ready", () => {
    const states: SourceEventGateCriterion[] = criteriaForStage("strategy").map((criterion) => ({
      id: `${EVENT.id}:${criterion.criterionId}`, sourceEventId: EVENT.id, tenantKey: "demo-client",
      criterionId: criterion.criterionId, fromStage: criterion.fromStage, toStage: criterion.toStage,
      state: "met", reviewerUserId: "owner", reviewedAt: "2026-09-29T00:00:00Z",
      notes: "synthetic_e2e_smoke: reviewed the governed Strategy evidence.", evidenceArtifactIds: [],
      waiverApprovalId: null, createdAt: "", updatedAt: "",
    }));
    const stageArtifactStates: SourceEventArtifactState[] = ["d01_strategy_memo", "d02_value_target", "d03_archetype_decision"].map((code) => {
      const spec = specByCode(code)!;
      return {
        id: code, sourceEventId: EVENT.id, tenantKey: "demo-client", artifactCode: code,
        stage: "strategy", family: spec.family, tier: spec.defaultTier, status: "approved",
        requirementLevel: spec.requirementLevel, gateDefining: spec.gateDefining,
        linkedArtifactId: `file-${code}`, notes: null, body: null, bodyFormat: "markdown",
        bodyAuthoredBy: null, bodyUpdatedAt: null, bodyGenerationMetadata: null, createdAt: "", updatedAt: "",
      };
    });
    const evidenceStates: SourceEventEvidence[] = canonicalEvidenceForStage("strategy")
      .filter((requirement) => requirement.level === "required")
      .map((requirement) => ({
        id: requirement.requirementId, sourceEventId: EVENT.id, tenantKey: "demo-client",
        requirementId: requirement.requirementId, stage: "strategy", currentState: "Usable Evidence",
        sourceArtifactId: `source-${requirement.requirementId}`, sourceEventFactIds: [],
        notes: null, lastSyncedAt: null, createdAt: "", updatedAt: "",
      }));
    const strategyEvent = { ...EVENT, currentStageKey: "strategy" as const,
      currentStageLabel: "Strategy", approvalPolicyCode: "self_v1" as const };
    const stageView = { ...SAMPLE_STRATEGY_STAGE,
      tasks: SAMPLE_STRATEGY_STAGE.tasks.map((task) => ({ ...task, state: "done" as const, evidenceComplete: true })),
      gate: { ...SAMPLE_STRATEGY_STAGE.gate, action: {
        eventId: EVENT.id, rationale: "Reviewed the current Strategy evidence and all criteria.",
        confirmationKeys: ["strategyMemoReviewed", "valueTargetReviewed", "archetypeReviewed"],
        redirectStageKey: "scope",
      } },
    };
    const approval = { ...APPROVAL, stageKey: "strategy" as const,
      stageLabel: "Strategy", versionKey: `${EVENT.id}:strategy`, versionLabel: "Strategy" };
    const props = {
      event: strategyEvent, viewStage: "strategy" as const, tenantName: "Demo Client", stageView,
      evidenceStates, gateCriterionStates: states, stageArtifactStates,
      artifacts: stageArtifactStates.map((artifact) => ({
        id: artifact.linkedArtifactId!, artifactCode: artifact.artifactCode,
        stageKey: "strategy" as const, status: "client_final", isClientFinal: true,
        bodyGenerationMetadata: { qualityGate: {
          passed: true, overallScore: 9, finalSummary: "Passed synthetic quality review.",
          unsupportedClaims: [], missingEvidence: [],
        } },
      })),
      approvalItems: [approval], initialWorkspace: "approvals" as const, canRetireEvent: true,
    };
    const { rerender } = render(<SourceAnalyticsCanvas {...props} />);
    expect(screen.getByTestId("source-stage-gate-approve")).toBeEnabled();
    rerender(<SourceAnalyticsCanvas {...props} gateCriterionStates={states.map((state) =>
      state.criterionId === "GATE-STRATEGY-03" ? { ...state, state: "pending" } : state)} />);
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-stage-gate-blocked")).toHaveTextContent("Review the required gate criteria before approving this stage.");
    expect(screen.getByTestId("source-shell-approval-readiness")).toHaveTextContent("Gate criteria still open");
  });

  it("keeps the SLA baseline on its own evidence-owning step when missing", () => {
    const withoutSla = SCOPE_READY_EVIDENCE.filter(
      (evidence) => evidence.requirementId !== "EVID-SRC-SCOPE-SLA-BASELINE",
    );
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        evidenceStates={withoutSla}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByRole("heading", { name: "Confirm retained vs. vendor" })).toBeInTheDocument();
    expect(screen.getByTestId("source-shell-active-step-needs")).toHaveTextContent(
      "SLA and service-credit baseline",
    );
    expect(screen.getByRole("button", { name: "Open Files to upload" })).toBeInTheDocument();
    expect(screen.queryByTestId("task-dropzone")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Continue/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Open Scope gate/ })).toBeNull();
  });

  it("does not restore the legacy sponsor task when a SELF event uses the canvas fallback", () => {
    render(
      <SourceAnalyticsCanvas
        event={{ ...EVENT, approvalPolicyCode: "self_v1" }}
        viewStage="scope"
        tenantName="Demo Client"
        initialWorkspace="steps"
      />,
    );
    expect(screen.queryByText("Sponsor commitment")).toBeNull();
  });

  it("mounts delegated acknowledgement on the active Scope sponsor step", async () => {
    const sponsorPendingStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) =>
        task.id === "scope.sponsor"
          ? task
          : { ...task, state: "done" as const, evidenceComplete: true },
      ),
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        verified: false, available: true, sponsorAssigned: true,
        sponsorName: "Sam Sponsor", recipientReady: true, canDelegate: true,
        scopeArtifact: { id: "scope-file", sha256: "a".repeat(64) }, currentStage: "scope",
      }),
    });
    render(<SourceAnalyticsCanvas
      event={EVENT}
      viewStage="scope"
      tenantName="Demo Client"
      stageView={sponsorPendingStage}
      evidenceStates={SCOPE_READY_EVIDENCE}
      initialWorkspace="steps"
    />);
    expect(await screen.findByRole("button", { name: "Acknowledge and notify sponsor" })).toBeInTheDocument();
    expect(screen.getByText("Sponsor: Sam Sponsor")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open Scope gate/ })).toBeNull();
  });

  it("offers sponsor review from the mounted Scope step without approving the gate", async () => {
    const sponsorPendingStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) =>
        task.id === "scope.sponsor"
          ? task
          : { ...task, state: "done" as const, evidenceComplete: true },
      ),
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ channel: "logged_fallback" }),
    });

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={sponsorPendingStage}
        evidenceStates={SCOPE_READY_EVIDENCE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByRole("button", { name: /Open Scope gate/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Request sponsor review" }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/source/events/${EVENT.id}/request-approval`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ approvalKind: "sponsor_commitment" }),
        }),
      );
    });
    expect(await screen.findByText("Notification logged; no email sent.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open Scope gate/ })).toBeNull();
  });

  it("does not offer sponsor review from another Scope step", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByRole("button", { name: "Request sponsor review" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Acknowledge and notify sponsor" })).toBeNull();
  });

  it("separates a remaining Scope workflow input from approval readiness", () => {
    const sponsorPendingStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) =>
        task.id === "scope.sponsor"
          ? task
          : { ...task, state: "done" as const, evidenceComplete: true },
      ),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={sponsorPendingStage}
        evidenceStates={SCOPE_READY_EVIDENCE}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByText(/1 required workflow step remains for Scope/)).toHaveTextContent(
      "Review evidence, artifact status, and gate criteria separately in Approvals.",
    );
    expect(screen.queryByText(/1 step left before Scope can move to approval/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Open Scope gate/ })).toBeNull();
  });

  it("renders a real approve action in the featured Approvals card instead of looping back to steps", async () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...COMPLETE_SCOPE_STAGE,
          gate: {
            ...COMPLETE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale:
                "Scope gate confirmed on the unified canvas - evidence complete, inputs reviewed, Scope final. Advancing to RFP.",
              confirmationKeys: [
                "scopeEvidenceComplete",
                "scopeInputsReviewed",
                "scopeStageFinal",
              ],
              redirectStageKey: "rfp",
            },
          },
        }}
        evidenceStates={SCOPE_READY_EVIDENCE}
        artifacts={SCOPE_READY_ARTIFACTS}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByTestId("source-approval-card-go-to-steps")).toBeNull();
    expect(
      screen.getByTestId("source-stage-gate-approval-control"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("source-stage-gate-approve")).toHaveTextContent(
      "Approve now",
    );
    expect(screen.getByTestId("source-stage-gate-approve"))
      .toHaveStyle({ background: "#2a5a3a", color: "#fff" });
    expect(screen.getByTestId("source-shell-progress-dock"))
      .toHaveStyle({ position: "fixed" });
    expect(screen.queryByText(/Approve with gaps/)).toBeNull();
    expect(
      screen.getByText(/Version binding, reviewer role, readiness/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("source-stage-gate-approve"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/v1/source/events/${EVENT.id}/approve`,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body).toMatchObject({
      action: "approve",
      selfApproveIfAuthorized: true,
      confirmations: {
        scopeEvidenceComplete: true,
        scopeInputsReviewed: true,
        scopeStageFinal: true,
      },
    });
    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=rfp`,
    );
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("does not render a blocked stage-gate approval button", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...SAMPLE_SCOPE_STAGE,
          gate: {
            ...SAMPLE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale: "Reviewed the current Scope decision basis.",
              confirmationKeys: ["scopeEvidenceComplete"],
            },
          },
        }}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByRole("button", { name: /Resolve blockers/ })).toBeNull();
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-stage-gate-blocked"))
      .toHaveTextContent("Required workflow inputs are still open");
    expect(screen.getByTestId("source-shell-progress-status"))
      .toHaveTextContent("Approval locked");
  });

  it("keeps a visible blocked status when no approval item is routed", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        approvalItems={[]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-shell-progress-dock"))
      .toHaveStyle({ position: "fixed" });
    expect(screen.getByTestId("source-shell-progress-status"))
      .toHaveTextContent("Approval locked");
  });

  it("does not call a complete stage decision-ready without routed approval", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        evidenceStates={SCOPE_READY_EVIDENCE}
        artifacts={SCOPE_READY_ARTIFACTS}
        approvalItems={[]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.getByTestId("source-shell-approval-readiness"))
      .toHaveTextContent("Approval routing unavailable");
    expect(screen.getByTestId("source-shell-approval-readiness"))
      .not.toHaveTextContent("Ready to decide");
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
  });

  it("hides stage approval on direct Approvals navigation while required evidence is missing", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...COMPLETE_SCOPE_STAGE,
          gate: {
            ...COMPLETE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale: "Reviewed the current Scope decision basis.",
              confirmationKeys: ["scopeEvidenceComplete", "scopeInputsReviewed", "scopeStageFinal"],
              redirectStageKey: "rfp",
            },
          },
        }}
        artifacts={SCOPE_READY_ARTIFACTS}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-stage-gate-blocked"))
      .toHaveTextContent("required evidence");
    expect(screen.getByTestId("source-shell-approval-readiness"))
      .toHaveTextContent("Required evidence still open");
    expect(screen.getByTestId("source-shell-approval-readiness"))
      .toHaveTextContent("7/7 inputs captured");
    expect(screen.getByTestId("source-shell-approval-readiness"))
      .not.toHaveTextContent("Ready to decide");
    expect(screen.getByTestId("source-shell-approval-return-steps"))
      .toBeInTheDocument();
  });

  it("does not offer approval when a record-backed evidence row is only client-stated", () => {
    const evidenceStates = SCOPE_READY_EVIDENCE.map((row) =>
      row.requirementId === "EVID-SRC-SCOPE-SLA-BASELINE"
        ? { ...row, currentState: "Available" as const, sourceEventFactIds: [], sourceArtifactId: null }
        : row,
    );
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        artifacts={SCOPE_READY_ARTIFACTS}
        evidenceStates={evidenceStates}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-shell-approval-readiness"))
      .toHaveTextContent("Required evidence still open");
  });

  it("keeps stage approval hidden until the rationale meets the server minimum", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...COMPLETE_SCOPE_STAGE,
          gate: {
            ...COMPLETE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale: "approved",
              confirmationKeys: [
                "scopeEvidenceComplete",
                "scopeInputsReviewed",
                "scopeStageFinal",
              ],
              redirectStageKey: "rfp",
            },
          },
        }}
        evidenceStates={SCOPE_READY_EVIDENCE}
        artifacts={SCOPE_READY_ARTIFACTS}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    expect(screen.getByTestId("source-shell-progress-status"))
      .toHaveTextContent("Enter an approval rationale");
    fireEvent.change(screen.getByLabelText("Scope approval rationale"), {
      target: { value: "Reviewed the required evidence." },
    });
    expect(screen.getByTestId("source-stage-gate-approve")).toBeEnabled();
  });

  it("requires sponsor context but attributes SELF Scope approval to the signed-in user", async () => {
    render(
      <SourceAnalyticsCanvas
        event={{ ...EVENT, approvalPolicyCode: "self_v1" }}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...COMPLETE_SCOPE_STAGE,
          gate: {
            ...COMPLETE_SCOPE_STAGE.gate,
            action: {
              eventId: EVENT.id,
              rationale: "I reviewed the current Scope memo and required evidence.",
              confirmationKeys: ["scopeEvidenceComplete", "scopeInputsReviewed", "scopeStageFinal"],
            },
          },
        }}
        evidenceStates={SCOPE_READY_EVIDENCE}
        artifacts={SCOPE_READY_ARTIFACTS}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    fireEvent.change(screen.getByLabelText("Sponsor name"), { target: { value: "Morgan Lee" } });
    fireEvent.change(screen.getByLabelText("Sponsor title"), { target: { value: "Chief Technology Officer" } });
    fireEvent.change(screen.getByLabelText("Sponsor role"), { target: { value: "Executive sponsor" } });
    fireEvent.change(screen.getByLabelText("Sponsor notification email"), { target: { value: "morgan@example.test" } });
    expect(screen.queryByTestId("source-stage-gate-approve")).toBeNull();
    fireEvent.click(screen.getByLabelText("I am approving this stage, not the sponsor. A notification will be attempted after the decision; delivery is audited separately."));
    const approve = screen.getByTestId("source-stage-gate-approve");
    expect(approve).toBeEnabled();
    fireEvent.click(approve);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      `/api/v1/source/events/${EVENT.id}/approve`, expect.anything(),
    ));
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.sponsorContext).toEqual({
      name: "Morgan Lee",
      title: "Chief Technology Officer",
      role: "Executive sponsor",
      email: "morgan@example.test",
      ownerAcknowledged: true,
    });
  });

  it("renders one active stage canvas with a gated Continue button", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
    expect(screen.queryByText("Your inputs & feedback")).toBeNull();
    expect(screen.queryByText("steps ready")).toBeNull();

    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(screen.getByText(/Required before Continue/)).toBeInTheDocument();
    expect(screen.getByTestId("source-stage-header-readiness-label"))
      .toHaveTextContent(/^inputs captured$/);
    expect(screen.getByTestId("source-stage-header-readiness"))
      .toHaveAttribute("aria-label", expect.stringContaining("required evidence items open"));
    expect(screen.getByTestId("source-shell-progress-dock"))
      .toHaveStyle({ position: "fixed" });
    expect(screen.getByTestId("source-shell-progress-status"))
      .toHaveTextContent("Continue locked");
    expect(screen.queryByTestId("source-shell-progress-action")).toBeNull();

    expect(
      screen.getByTestId("source-scope-operating-status"),
    ).toHaveTextContent("Scope gate readiness");
    expect(
      screen.getByTestId("source-scope-operating-status"),
    ).toHaveTextContent("0/6 ready");
    expect(
      screen.getByTestId("source-scope-operating-status"),
    ).toHaveTextContent("Load required evidence");
    expect(
      screen.getByTestId("source-scope-operating-status"),
    ).toHaveTextContent("Scope Memo with Boundaries");
    const activeNeed = screen.getByTestId("source-shell-active-step-needs");
    expect(activeNeed).toHaveTextContent("L2/L3 ticket history and service volumetrics");
    expect(activeNeed).toHaveTextContent("Source: ServiceNow ITSM");
    expect(activeNeed).toHaveTextContent("Needed: Available");
    expect(activeNeed).toHaveTextContent("Now: Not loaded");
    expect(activeNeed).toHaveTextContent("Open Files to upload");
    expect(screen.getByTestId("task-dropzone")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Confirm the applications in scope/,
      }),
    );

    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Complete");
    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Readback: workflow confirmation captured.");
    expect(
      screen.getByTestId("source-shell-active-step-needs"),
    ).toHaveTextContent("Input captured; Continue.");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled();
    expect(screen.getByTestId("source-shell-progress-action"))
      .toHaveStyle({ background: "#2a5a3a", color: "#fff" });
    expect(screen.queryByTestId("source-shell-progress-status")).toBeNull();
  });

  it("keeps progression out of sight and shows only the active step's evidence", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(screen.getAllByTestId("source-shell-active-step-needs")).toHaveLength(1);
    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("L2/L3 ticket history and service volumetrics");
    expect(screen.queryByTestId("source-shell-evidence-ask-table")).toBeNull();
  });

  it("reads a validated ticket receipt when no computed stage view exists", () => {
    const ticketEvidence = SCOPE_READY_EVIDENCE.find(
      (row) => row.requirementId === "EVID-SRC-SCOPE-TICKET-HISTORY",
    )!;
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        evidenceStates={[{
          ...ticketEvidence,
          id: `fact-derived:${EVENT.id}:${ticketEvidence.requirementId}`,
          currentState: "Available",
        }]}
        initialWorkspace="steps"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Provide ticket volumes/ }));
    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("Readback: typed facts available.");
    expect(screen.getByRole("button", { name: /Continue/ })).toBeEnabled();
  });

  it("does not present exemplar Scope completion or files as live event evidence", () => {
    const fallback = liveFallbackStageViewFor("scope");
    expect(fallback.tasks).toHaveLength(6);
    expect(fallback.tasks.every((task) => task.state === "todo"))
      .toBe(true);
    expect(fallback.tasks.every((task) => !task.rows?.length && !task.file && !task.provenance))
      .toBe(true);
    expect(fallback.intel.points).toHaveLength(0);

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByRole("button", { name: /Confirm the applications in scope/ }))
      .toBeNull();
    expect(screen.queryByText(/147 apps|147 across 3 tiers/i))
      .toBeNull();
    expect(screen.getByRole("button", { name: /Provide ticket volumes/ }))
      .toBeInTheDocument();
    expect(screen.getByTestId("source-stage-header-readiness"))
      .toHaveTextContent(/0\s*\/\s*6/);
    expect(screen.getByRole("button", { name: /Confirm retained vs\. vendor/ }))
      .not.toHaveTextContent("✓");
    expect(screen.getByRole("button", { name: /Confirm what's out of scope/ }))
      .not.toHaveTextContent("✓");
    fireEvent.click(screen.getByRole("button", { name: /Confirm retained vs\. vendor/ }));
    expect(screen.getByRole("heading", { name: "Confirm retained vs. vendor" }))
      .toBeInTheDocument();
    expect(screen.queryByText(/current-sla-baseline-2025\.pdf|pre-filled with a row per tower/i))
      .toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Confirm what's out of scope/ }));
    expect(screen.queryByText(/6 exclusions|2 apps mid-decommission/i))
      .toBeNull();
  });

  it("does not unlock fallback steps from an unrelated or unvalidated receipt", () => {
    const ticketEvidence = SCOPE_READY_EVIDENCE.find(
      (row) => row.requirementId === "EVID-SRC-SCOPE-TICKET-HISTORY",
    )!;
    const { rerender } = render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        evidenceStates={[ticketEvidence]}
        initialWorkspace="steps"
      />,
    );
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();

    rerender(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        evidenceStates={[{
          ...ticketEvidence,
          id: `fact-derived:${EVENT.id}:EVID-SRC-SCOPE-APP-INV`,
          requirementId: "EVID-SRC-SCOPE-APP-INV",
        }]}
        initialWorkspace="steps"
      />,
    );
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });

  it("keeps the active evidence request at the upload action without a duplicate table", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("L2/L3 ticket history and service volumetrics");
    expect(screen.getByTestId("task-dropzone")).toBeInTheDocument();
    expect(screen.queryByTestId("source-shell-evidence-ask-table")).toBeNull();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });

  it("keeps a captured step open until its mapped required evidence is usable", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        artifacts={SCOPE_READY_ARTIFACTS}
        initialWorkspace="steps"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Provide ticket volumes/ }));
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(screen.queryByTestId("source-shell-stage-ready-panel")).toBeNull();
    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("L2/L3 ticket history and service volumetrics");
    expect(screen.getByText("Required before Continue")).toBeInTheDocument();
  });

  it("keeps the gate action hidden while file review remains open", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        evidenceStates={SCOPE_READY_EVIDENCE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-stage-ready-primary-files"))
      .toBeInTheDocument();
    expect(screen.queryByTestId("source-stage-ready-open-approval"))
      .toBeNull();
    expect(screen.getByTestId("source-shell-progress-status"))
      .toHaveTextContent("Approval locked");
    expect(screen.queryByTestId("source-shell-evidence-ask-table"))
      .toBeNull();
  });

  it("does not offer stage approval when tasks are complete but required evidence is missing", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={COMPLETE_SCOPE_STAGE}
        artifacts={SCOPE_READY_ARTIFACTS}
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByTestId("source-shell-stage-ready-panel"))
      .toBeNull();
    expect(screen.queryByTestId("source-stage-ready-open-approval"))
      .toBeNull();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("L2/L3 ticket history and service volumetrics");
  });

  it("shows a stored template file as awaiting extraction without unlocking Continue", () => {
    const storedFileStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) =>
        task.id === "scope.volumetrics"
          ? {
              ...task,
              file: {
                format: "CSV",
                name: "client-volumetrics-VOLUMETRICS_V1.csv",
                meta: "2 KB · uploaded · awaiting extraction",
              },
            }
          : task,
      ),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={storedFileStage}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("client-volumetrics-VOLUMETRICS_V1.csv");
    expect(screen.getByTestId("task-dropzone")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });

  it("offers a prior-baseline absence decision in the active Scope step without requiring vendor terms", () => {
    const baselineTask = SAMPLE_SCOPE_STAGE.tasks.find((task) => task.id === "scope.prior-baseline");
    expect(baselineTask).toBeDefined();
    if (!baselineTask) return;
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{ ...SAMPLE_SCOPE_STAGE, tasks: [baselineTask] }}
        evidenceStates={[{
          ...SCOPE_READY_EVIDENCE.find((row) => row.requirementId === "EVID-SRC-SCOPE-FY-CONTRACT")!,
          currentState: "Not Requested",
          sourceArtifactId: null,
          sourceEventFactIds: [],
          applicabilityStatus: "applicable",
        }]}
        initialWorkspace="steps"
      />,
    );

    const needs = screen.getByTestId("source-shell-active-step-needs");
    expect(needs).toHaveTextContent("Prior fiscal contract and run-cost baseline");
    expect(screen.getByText("Prior record or absence decision")).toBeInTheDocument();
    fireEvent.click(within(needs).getByRole("button", { name: "Declare no prior contract or run-cost baseline" }));
    expect(within(needs).getByRole("checkbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    expect(screen.queryByText("Vendor commercials file")).toBeNull();
  });

  it("offers an accountable no-current-SOW decision in the exclusions step without unlocking Continue", () => {
    const exclusionsTask = SAMPLE_SCOPE_STAGE.tasks.find((task) => task.id === "scope.exclusions");
    expect(exclusionsTask).toBeDefined();
    if (!exclusionsTask) return;
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{ ...SAMPLE_SCOPE_STAGE, tasks: [exclusionsTask] }}
        evidenceStates={[{
          ...SCOPE_READY_EVIDENCE.find((row) => row.requirementId === "EVID-SRC-SCOPE-CURRENT-SOW")!,
          currentState: "Not Requested",
          sourceArtifactId: null,
          sourceEventFactIds: [],
          applicabilityStatus: "applicable",
        }]}
        initialWorkspace="steps"
      />,
    );

    const needs = screen.getByTestId("source-shell-active-step-needs");
    expect(needs).toHaveTextContent("Current SOW and change-order scope");
    fireEvent.click(within(needs).getByRole("button", { name: "Declare no current SOW or change-order history" }));
    expect(within(needs).getByRole("checkbox")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
  });

  it("resets the upload pane when evidence readback advances to the next provide step", async () => {
    const provideSteps = SAMPLE_SCOPE_STAGE.tasks.filter((task) =>
      ["scope.volumetrics", "scope.app-inventory"].includes(task.id),
    );
    const stageView = { ...SAMPLE_SCOPE_STAGE, tasks: provideSteps };
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          artifact: {
            id: "artifact-volumetrics",
            originalName: "volumetrics.csv",
            sourceFormat: "csv",
            sizeBytes: 1024,
            parseStatus: "parsed",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          factsWritten: 5,
          unmappedColumns: [],
          rejectedRows: [],
        }),
      });

    const { rerender } = render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={stageView}
        initialWorkspace="steps"
      />,
    );

    fireEvent.change(screen.getByTestId("task-file-input"), {
      target: {
        files: [new File(["value"], "volumetrics.csv", { type: "text/csv" })],
      },
    });

    await screen.findByText("volumetrics.csv");
    expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull();
    rerender(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={{
          ...stageView,
          tasks: provideSteps.map((task) => task.id === "scope.volumetrics"
            ? { ...task, state: "done" as const, evidenceComplete: true }
            : task),
        }}
        evidenceStates={SCOPE_READY_EVIDENCE.filter((row) =>
          ["EVID-SRC-SCOPE-TICKET-HISTORY", "EVID-SRC-SCOPE-SLA-BASELINE"]
            .includes(row.requirementId))}
        initialWorkspace="steps"
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Provide the application or service inventory",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("volumetrics.csv")).not.toBeInTheDocument();
    expect(screen.getByTestId("task-file-input")).toHaveValue("");
  });

  it("generates a missing current-stage artifact from the Files review queue", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: { artifactCode: "d04_app_inv" },
      }),
    });

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        initialWorkspace="files"
      />,
    );

    fireEvent.click(screen.getByTestId("source-generate-artifact-d04_app_inv"));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/source/evt-scope/artifacts/d04_app_inv/generate",
        { method: "POST", credentials: "include" },
      ),
    );
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("reviews an accepted flagship artifact without replacing its body", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        artifact: { artifactCode: "d05_scope_memo" },
      }),
    });

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={SAMPLE_SCOPE_STAGE}
        artifacts={[
          {
            id: "scope-memo-final",
            artifactCode: "d05_scope_memo",
            stageKey: "scope",
            status: "client_final",
            isClientFinal: true,
            title: "Scope Memo with Boundaries",
            body: "Approved scope memo with evidence basis, decision, boundaries, risks, and next actions.",
          },
        ]}
        initialWorkspace="files"
      />,
    );

    fireEvent.click(
      screen.getAllByTestId("source-review-artifact-quality-d05_scope_memo")[0],
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/v1/source/evt-scope/artifacts/d05_scope_memo/generate",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewExistingBody: true }),
        },
      ),
    );
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("opens the approval workspace once all required stage inputs are complete", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        evidenceStates={SCOPE_READY_EVIDENCE}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("Required inputs are complete");
    expect(screen.getByTestId("source-shell-v2-steps")).toHaveTextContent(
      "Review required evidence and Files before the approval action appears",
    );
    expect(screen.getByTestId("source-shell-v2-steps")).not.toHaveTextContent(
      "Open the approval gate when the owner is ready",
    );
    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("artifact review items remain");
    expect(
      screen.getByTestId("source-stage-header-readiness"),
    ).toHaveTextContent("7 / 7");
    expect(
      screen.getByTestId("source-stage-header-readiness-label"),
    ).toHaveTextContent(/^inputs ready$/);
    expect(
      screen.getByTestId("source-journey-current-stage-status"),
    ).toHaveTextContent(/^review files$/);
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "7/7 complete",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "file review gaps",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Review required evidence in Files",
    );
    expect(
      screen.getByTestId("source-stage-ready-primary-files"),
    ).toHaveTextContent("Review evidence");
    expect(screen.queryByTestId("source-stage-ready-open-approval"))
      .toBeNull();
    expect(
      screen.getByTestId("source-stage-ready-approval-blocker"),
    ).toHaveTextContent("Approval gate blocker");
    expect(
      screen.getByTestId("source-stage-ready-approval-blocker"),
    ).toHaveTextContent(
      "Continue to approval is blocked until required evidence and client-final artifact review are complete.",
    );
    expect(
      screen.queryByTestId("source-stage-ready-review-approval"),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("source-shell-evidence-ask-table"))
      .toBeNull();

    fireEvent.click(screen.getByTestId("source-shell-workspace-approvals"));

    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Artifact queue blocks the gate");
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Not gate-ready");
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Clear artifact queue.");
    expect(
      screen.getByTestId("source-shell-approval-review-gaps"),
    ).toHaveTextContent("Clear these artifact actions before approval");
    expect(
      screen.getByTestId("source-shell-approval-review-gaps"),
    ).toHaveTextContent(
      "not decision-ready until the current-stage artifact queue is cleared",
    );
    expect(
      screen.getByTestId("source-shell-approval-open-files"),
    ).toHaveTextContent("Clear artifact queue");
    expect(
      screen.getByTestId("source-shell-approval-open-files"),
    ).toHaveAttribute(
      "href",
      `/source/events/${EVENT.id}?stage=scope&workspace=files`,
    );
    const approvalsWorkspace = screen.getByTestId("source-shell-v2-approvals");
    expect(screen.queryByRole("button", { name: "Retire event" })).toBeNull();
    expect(approvalsWorkspace).toHaveTextContent(
      "All 7 workflow inputs complete",
    );
    expect(approvalsWorkspace).not.toHaveTextContent(
      "All 7 required evidence items ready",
    );
  });

  it("does not offer retirement once an event is archived", () => {
    render(
      <SourceAnalyticsCanvas
        event={{ ...EVENT, status: "archived", statusLabel: "Archived" }}
        canRetireEvent
        viewStage="scope"
        tenantName="Demo Client"
        initialWorkspace="approvals"
      />,
    );

    expect(screen.queryByRole("button", { name: "Retire event" })).toBeNull();
  });

  it("offers retirement to an authorized decision-maker on an active event", () => {
    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        canRetireEvent
        viewStage="scope"
        tenantName="Demo Client"
        initialWorkspace="approvals"
      />,
    );

    expect(screen.getByRole("button", { name: "Retire event" })).toBeInTheDocument();
  });

  it("discloses when a stage was approved with required inputs still open", () => {
    // Live-found: a stage reading 0/1 whose approval record was already in the
    // ledger still said "1 step left before Strategy can move to approval" —
    // describing an approved stage as pre-approval, and hiding the gap.
    // Approve-with-gaps is a supported decision; it just has to stay visible.
    const openScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task, index) => ({
        ...task,
        state: index === 0 ? ("todo" as const) : task.state,
        evidenceComplete: index === 0 ? false : task.evidenceComplete,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={openScopeStage}
        approvalItems={[APPROVAL]}
        approvalLedger={[
          {
            stageKey: "scope",
            stageLabel: "Scope",
            index: 2,
            state: "approved",
            approverName: "A. Approver",
            approvedAtIso: "2026-08-01T00:00:00.000Z",
            authorizationNote: "",
            approverRationale: null,
          },
        ]}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByText(/was approved with/i)).toHaveTextContent(
      "required input",
    );
    expect(screen.getByText(/was approved with/i)).toHaveTextContent(
      "not mistaken for completed work",
    );
    expect(
      screen.queryByText(/left before Scope can move to approval/i),
    ).not.toBeInTheDocument();
  });

  it("does not claim stage inputs are complete while workflow steps are still open", () => {
    // Regression: the artifact-queue banner asserted "Stage inputs are
    // complete" regardless of workflow state, so a stage reading
    // "0/1 steps complete" contradicted itself inside the same panel.
    const openScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task, index) => ({
        ...task,
        state: index === 0 ? ("todo" as const) : task.state,
        evidenceComplete: index === 0 ? false : task.evidenceComplete,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={openScopeStage}
        approvalItems={[APPROVAL]}
        initialWorkspace="approvals"
      />,
    );

    const gaps = screen.getByTestId("source-shell-approval-review-gaps");
    expect(gaps).not.toHaveTextContent("Stage inputs are complete");
    expect(gaps).toHaveTextContent("Stage inputs are still open");
    expect(gaps).toHaveTextContent(
      "before the approval gate is decision-ready",
    );
  });

  it("opens Files as the primary next action when completed workflow inputs still have artifact blockers", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        evidenceStates={SCOPE_READY_EVIDENCE}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    fireEvent.click(screen.getByTestId("source-stage-ready-primary-files"));

    expect(screen.getByTestId("source-shell-v2-files")).toBeInTheDocument();
  });

  it("presents a direct approval gate action once workflow inputs and gate artifacts are ready", () => {
    const completedScopeStage = {
      ...SAMPLE_SCOPE_STAGE,
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };

    render(
      <SourceAnalyticsCanvas
        event={EVENT}
        viewStage="scope"
        tenantName="Demo Client"
        stageView={completedScopeStage}
        evidenceStates={SCOPE_READY_EVIDENCE}
        artifacts={[
          {
            id: "scope-app-inventory",
            artifactCode: "d04_app_inv",
            stageKey: "scope",
            status: "client_final",
            title: "Application Inventory & Tiering",
          },
          {
            id: "scope-memo",
            artifactCode: "d05_scope_memo",
            stageKey: "scope",
            status: "client_final",
            isClientFinal: true,
            title: "Scope Memo with Boundaries",
            body: `Decision requested: approve the Scope boundary for the managed-services sourcing event.
            Executive summary: the application estate, service tower, exclusion log, ticket baseline,
            retained responsibility model, and sponsor commitment are complete enough for a sourcing
            owner to advance to the next gate. Scope in: Tier 1 and Tier 2 business applications,
            L2/L3 support services, knowledge transfer, service desk escalation, incident triage,
            and operational reporting. Scope out: end-user device support, SOC operations, business
            process ownership, and applications already in decommission. Evidence basis: application
            inventory, scope memo, exclusion log, ticket history, retained responsibility matrix, and
            sponsor sign-off. Required exhibits: in scope towers, support tiers, exclusions,
            run change boundary, open scope questions. The in scope towers are application
            management, incident management, release support, and reporting. Support tiers are
            Tier 1 business-critical and Tier 2 important applications. Exclusions are end-user
            device support, SOC operations, and decommissioning apps. The run/change boundary puts
            steady-state support in scope and project delivery out of scope. Open scope questions:
            final vendor-facing volume bands and SLA history must be confirmed in the next gate.
            sponsor sign-off. Remaining risk: pricing should continue to validate volumes and SLA
            history before vendor release. Recommended action: open the Scope approval gate and
            advance to RFP preparation.`,
            bodyGenerationMetadata: {
              qualityGate: {
                passed: true,
                overallScore: 9,
                finalSummary: "Passed: evidence-bound scope memo.",
                unsupportedClaims: [],
                missingEvidence: [],
              },
            },
          },
          {
            id: "scope-exclusions",
            artifactCode: "d06_excl_log",
            stageKey: "scope",
            status: "client_final",
            title: "Exclusion Log",
          },
          {
            id: "scope-ticket-history",
            artifactCode: "d07_ticket_synth",
            stageKey: "scope",
            status: "client_final",
            title: "Ticket History Synthesis",
          },
        ]}
        approvalItems={[APPROVAL]}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-shell-stage-ready-panel"),
    ).toHaveTextContent("All required evidence is ready for Scope");
    expect(
      screen.getByTestId("source-stage-header-readiness-label"),
    ).toHaveTextContent(/^ready$/);
    expect(
      screen.getByTestId("source-journey-current-stage-status"),
    ).toHaveTextContent(/^7\/7$/);
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Ready for approval",
    );
    expect(screen.getByTestId("source-stage-ready-status")).toHaveTextContent(
      "Open approval gate",
    );
    expect(
      screen.queryByTestId("source-stage-ready-primary-files"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("source-shell-progress-dock"))
      .toHaveStyle({ position: "fixed" });
    expect(screen.getByTestId("source-stage-ready-open-approval"))
      .toHaveStyle({ background: "#2a5a3a", color: "#fff" });

    fireEvent.click(screen.getByTestId("source-stage-ready-open-approval"));

    expect(routerPush).toHaveBeenCalledWith(
      `/source/events/${EVENT.id}?stage=scope&workspace=approvals`,
    );
    expect(screen.getByTestId("source-shell-v2-approvals")).toBeInTheDocument();
    expect(
      screen.getByTestId("source-shell-approval-readiness"),
    ).toHaveTextContent("Ready to decide");
  });

  it("does not substitute a modeled BAFO scenario without live vendor context", () => {
    const completedBafoStage = {
      ...SAMPLE_BAFO_STAGE,
      tasks: SAMPLE_BAFO_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const bafoEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "bafo",
      currentStageLabel: "BAFO",
      nextAction: "Open BAFO approval gate",
    };

    render(
      <SourceAnalyticsCanvas
        event={bafoEvent}
        viewStage="bafo"
        tenantName="Demo Client"
        stageView={completedBafoStage}
        approvalItems={[]}
        initialWorkspace="steps"
      />,
    );

    expect(screen.queryByTestId("source-shell-stage-ready-panel")).toBeNull();
    expect(screen.getByTestId("source-shell-active-step-needs"))
      .toHaveTextContent("Negotiation issue and trap log");
    expect(
      screen.queryByTestId("source-bafo-scenario-compare"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-steps")).not.toHaveTextContent(
      /Vendor A|Vendor B|Vendor C/,
    );
  });

  it("keeps a completed terminal approval audit gap open without another approve action", () => {
    const completeValueStage = {
      ...SAMPLE_SCOPE_STAGE,
      stageKey: "value" as const,
      stageName: "Value",
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const valueEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "value",
      currentStageLabel: "Value",
    };
    const valueApproval: ApprovalsInboxItem = {
      ...APPROVAL,
      stageKey: "value",
      stageLabel: "Value",
      versionKey: `${valueEvent.id}:value`,
      versionLabel: "Value",
      ask: "Approve advancing out of Value.",
    };

    render(
      <SourceAnalyticsCanvas
        event={valueEvent}
        viewStage="value"
        tenantName="Demo Client"
        stageView={completeValueStage}
        approvalItems={[valueApproval]}
        approvalLedger={[
          {
            stageKey: "value",
            stageLabel: "Value",
            index: 11,
            state: "approved",
            approverName: "A. Approver",
            approvedAtIso: "2026-09-09T00:00:00.000Z",
            authorizationNote: "Approved by A. Approver.",
            approverRationale: "Final value record accepted.",
          },
        ]}
        initialWorkspace="approvals"
      />,
    );

    const readiness = screen.getByTestId("source-shell-approval-readiness");
    expect(readiness).toHaveTextContent("Approval recorded; audit gaps open");
    expect(readiness).toHaveTextContent("Resolve approval record gaps");
    expect(readiness).not.toHaveTextContent("Stage approved");
    expect(readiness).not.toHaveTextContent("No further approval required");
    expect(screen.queryByText("Approve now")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Approve advancing out of Value."),
    ).not.toBeInTheDocument();
  });

  it("keeps a recorded Transition approval while surfacing blocked Stage 08 handoff work", () => {
    const completeTransitionStage = {
      ...SAMPLE_TRANSITION_STAGE,
      tasks: SAMPLE_TRANSITION_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const transitionEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "transition",
      currentStageLabel: "Transition",
      nextAction: "Complete canonical handoff evidence",
    };
    const transitionApproval: ApprovalsInboxItem = {
      ...APPROVAL,
      stageKey: "transition",
      stageLabel: "Transition",
      versionKey: `${transitionEvent.id}:transition`,
      versionLabel: "Transition",
      ask: "Approve advancing out of Transition.",
    };

    render(
      <SourceAnalyticsCanvas
        event={transitionEvent}
        viewStage="transition"
        tenantName="Demo Client"
        stageView={completeTransitionStage}
        artifacts={[
          {
            id: "transition-plan-final",
            artifactCode: "d29_transition_plan",
            stageKey: "transition",
            sourceOrigin: "uploaded",
            status: "client_final",
            isClientFinal: true,
          },
          {
            id: "checkpoint-log-final",
            artifactCode: "d30_checkpoint_log",
            stageKey: "transition",
            sourceOrigin: "uploaded",
            status: "client_final",
            isClientFinal: true,
          },
          {
            id: "kt-evidence-final",
            artifactCode: "d31_kt_evidence",
            stageKey: "transition",
            sourceOrigin: "uploaded",
            status: "client_final",
            isClientFinal: true,
          },
        ]}
        approvalItems={[transitionApproval]}
        approvalLedger={[
          {
            stageKey: "transition",
            stageLabel: "Transition",
            index: 10,
            state: "approved",
            approverName: "A. Approver",
            approvedAtIso: "2026-09-09T00:00:00.000Z",
            authorizationNote: "Approved by A. Approver.",
            approverRationale: "Transition stage decision accepted.",
          },
        ]}
        initialWorkspace="steps"
      />,
    );

    const readyPanel = screen.getByTestId("source-shell-stage-ready-panel");
    expect(readyPanel).toHaveTextContent("Stage approval recorded");
    expect(readyPanel).toHaveTextContent("Stage 08 handoff remains blocked");
    expect(readyPanel).toHaveTextContent("Resolve Stage 08 handoff blockers");
    expect(readyPanel).not.toHaveTextContent("No further approval required");

    const handoffPanel = screen.getByLabelText(
      "Stage 08 Award and SOW handoff readiness panel",
    );
    expect(handoffPanel).toHaveTextContent(
      /Contract formation package\s*blocked/,
    );
    expect(handoffPanel).toHaveTextContent("Handoff ready: no");
  });

  it("fails closed when a recorded terminal approval has no bound decision metadata", () => {
    const completeValueStage = {
      ...SAMPLE_SCOPE_STAGE,
      stageKey: "value" as const,
      stageName: "Value",
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const valueEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "value",
      currentStageLabel: "Value",
    };

    render(
      <SourceAnalyticsCanvas
        event={valueEvent}
        viewStage="value"
        tenantName="Demo Client"
        stageView={completeValueStage}
        approvalItems={[]}
        approvalLedger={[
          {
            stageKey: "value",
            stageLabel: "Value",
            index: 11,
            state: "approved",
            approverName: "A. Approver",
            approvedAtIso: "2026-09-09T00:00:00.000Z",
            authorizationNote: "Approved by A. Approver.",
            approverRationale: "Final value record accepted.",
          },
        ]}
        initialWorkspace="approvals"
      />,
    );

    const readiness = screen.getByTestId("source-shell-approval-readiness");
    expect(readiness).toHaveTextContent("Approval recorded; audit gaps open");
    expect(readiness).toHaveTextContent("Resolve approval record gaps");
    expect(readiness).not.toHaveTextContent("No further approval required");
    expect(screen.queryByText("Approve now")).not.toBeInTheDocument();
  });

  it("renders a historically approved RFP with current gaps as remediation, not a new approval gate", () => {
    const completedRfpStage = {
      ...SAMPLE_SCOPE_STAGE,
      stageKey: "rfp" as const,
      stageName: "RFP",
      tasks: SAMPLE_SCOPE_STAGE.tasks.map((task) => ({
        ...task,
        state: "done" as const,
        evidenceComplete: true,
      })),
    };
    const advancedEvent: SourcingEventSummary = {
      ...EVENT,
      currentStageKey: "responses",
      currentStageLabel: "Responses",
    };

    render(
      <SourceAnalyticsCanvas
        event={advancedEvent}
        viewStage="rfp"
        tenantName="Demo Client"
        stageView={completedRfpStage}
        artifacts={[
          {
            id: "rfp-draft-1",
            artifactCode: "d09_rfp_pack",
            stageKey: "rfp",
            sourceOrigin: "generated",
            status: "draft",
          },
        ]}
        approvalLedger={[
          {
            stageKey: "rfp",
            stageLabel: "RFP",
            index: 4,
            state: "approved",
            approverName: null,
            approvedAtIso: null,
            authorizationNote:
              "Approved - approver not recorded for this stage (predates stage-level tracking).",
            approverRationale: null,
          },
        ]}
        initialWorkspace="steps"
      />,
    );

    const readyPanel = screen.getByTestId("source-shell-stage-ready-panel");
    expect(readyPanel).toHaveTextContent("Stage approved");
    expect(readyPanel).toHaveTextContent(
      "advanced before stage-level approval tracking",
    );
    expect(readyPanel).toHaveTextContent("RFP decision status");
    expect(readyPanel).toHaveTextContent("Remediate current gaps");
    expect(readyPanel).toHaveTextContent("Current controls");
    expect(readyPanel).not.toHaveTextContent("Open approval gate");
    expect(readyPanel).not.toHaveTextContent("accepted exception record");
  });

  it("consolidates commercial lenses above the active workflow canvas", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...EVENT,
          currentStageKey: "bafo",
          currentStageLabel: "BAFO",
          nextAction: "Prepare BAFO asks",
        }}
        viewStage="bafo"
        tenantName="Demo Client"
        stageView={SAMPLE_BAFO_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(
      screen.getByTestId("source-commercial-active-canvas"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-rail")).toBeInTheDocument();

    [
      "summary",
      "pricing",
      "bafo",
      "risks",
      "readiness",
      "missions",
      "signals",
      "linked_program",
    ].forEach((lens) => {
      expect(
        screen.getByTestId(`source-commercial-nav-${lens}`),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("source-commercial-nav-pricing")).toHaveAttribute(
      "href",
      `/source/events/${EVENT.id}?stage=pricing`,
    );
    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("Where are we commercially in BAFO?");

    fireEvent.click(screen.getByTestId("source-commercial-nav-linked_program"));

    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("What downstream program must be prepared?");
    expect(
      screen.getByTestId("source-commercial-active-lens"),
    ).toHaveTextContent("Carry open actions into the next stage");
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
  });

  it("fails closed when pricing has no normalized vendor response context", () => {
    render(
      <SourceAnalyticsCanvas
        event={{
          ...EVENT,
          currentStageKey: "pricing",
          currentStageLabel: "Pricing",
          nextAction: "Clarify vendor pricing gaps",
        }}
        viewStage="pricing"
        tenantName="Demo Client"
        stageView={SAMPLE_PRICING_STAGE}
        initialWorkspace="steps"
      />,
    );

    expect(screen.getByTestId("source-stage-decision-lens")).toHaveTextContent(
      "No normalized vendor response profiles are available for this event",
    );
    expect(
      screen.getByTestId("source-pricing-completeness-summary"),
    ).toHaveTextContent("0/0");
    expect(
      screen.queryByTestId("source-pricing-cross-vendor-gaps"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Vendor A|Vendor B|Vendor C/),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("source-shell-v2-steps")).toBeInTheDocument();
  });
});
