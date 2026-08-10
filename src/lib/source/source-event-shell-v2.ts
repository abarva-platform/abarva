import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import {
  SOURCE_JOURNEYS,
  sourceJourneyLabelForStage,
  sourceJourneyStageKeys,
  type SourceJourneyDefinition,
} from "@/lib/source/sourcing-motion-journeys";
import type { SourceStageKey, SourcingEventSummary } from "@/lib/source/types";
import type { ApprovalLedgerRow } from "@/lib/source/approval-ledger-model";
import {
  SOURCE_AI_DRAFT_GOVERNANCE_LABEL,
  SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
  SOURCE_COMPLIANCE_REVIEW_FLAG_LABEL,
  SOURCE_COMPLIANCE_REVIEW_FLAG_MESSAGE,
  hasComplianceReviewFlag,
} from "@/lib/source/artifact-governance";
import {
  buildSourceArtifactLifecycleSummary,
  type SourceArtifactLifecycleSummary,
} from "@/lib/source/artifact-lifecycle-matrix";
import { specByCode } from "@/lib/source/canonical-specs/artifact-specs";
import type {
  IntelProvenance,
  StageAnalyticsView,
  StageTaskView,
  StepInsightView,
} from "@/components/source/canvas/analytics/view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate/types";
import type { SourceStageGuidebookRecord } from "@/lib/source/stage-guidebooks/types";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";

export type SourceShellWorkspace =
  | "steps"
  | "files"
  | "intelligence"
  | "approvals"
  | "guidebook";

export type SourceShellEvidenceBasis =
  | "live_fact"
  | "live_artifact"
  | "computed"
  | "archetype"
  | "sample"
  | "missing";

export interface SourceShellJourneyStage {
  key: SourceStageKey;
  label: string;
  index: number;
  current: boolean;
  viewed: boolean;
  done: number;
  total: number;
  state: "complete" | "current" | "future" | "past";
}

export interface SourceShellStepGroup {
  id: string;
  label: string;
  steps: SourceShellStep[];
}

export interface SourceShellStep {
  id: string;
  title: string;
  help: string;
  type: StageTaskView["type"];
  status: "captured" | "active" | "open";
  sourceBasis: SourceShellEvidenceBasis;
  cta: string;
  rows: NonNullable<StageTaskView["rows"]>;
  file: StageTaskView["file"] | null;
  template: StageTaskView["template"] | null;
  provenance: StageTaskView["provenance"] | null;
  factTemplateCode: StageTaskView["factTemplateCode"] | null;
}

export interface SourceShellFileItem {
  id: string;
  artifactCode: string;
  stageKey: string;
  stageLabel: string;
  format: string;
  name: string;
  state: string;
  group: string;
  sourceBasis: SourceShellEvidenceBasis;
  /**
   * Whether this artifact is required for stage-gate promotion
   * (`authoritative`, derived from the canonical spec's `gateDefining` flag
   * — same source of truth `ArtifactLifecyclePanel`'s Gate-defining/
   * Supporting split already uses) or purely supporting context
   * (`evidence`). Defaults to `evidence` for artifact codes with no
   * canonical spec match, so an unknown artifact never falsely gates.
   */
  artifactRole: "authoritative" | "evidence";
  governanceLabel: string;
  governanceMessage: string | null;
  /** True when the backstop compliance scan flagged this artifact for review. */
  needsComplianceReview: boolean;
  complianceReviewLabel: string | null;
  complianceReviewMessage: string | null;
  /** First-mile extraction status from the durable Source artifact row. */
  parseStatus: string | null;
  /** Search/vector readiness status from the durable Source artifact row. */
  embeddingStatus: string | null;
  /** Graph/entity projection status from the durable Source artifact row. */
  graphStatus: string | null;
  /**
   * The most recent explicit "accept as authoritative" record for this
   * artifact (SOURCE-SHELL-004), or null if it has never been accepted.
   * Distinct from `governanceLabel`/`governanceMessage` above, which are
   * inferred from status flags — this is a real, reasoned, append-only
   * action a human took.
   */
  latestAcceptance: ArtifactAcceptanceRecord | null;
}

export interface SourceShellIntelligenceFinding {
  id: string;
  tag: string;
  text: string;
  sourceBasis: SourceShellEvidenceBasis;
}

export interface SourceShellIntelligenceExplorer {
  state: "hidden" | "open";
  contextChips: string[];
  lead: string;
  provenance: IntelProvenance;
  sourceBasis: SourceShellEvidenceBasis;
  findings: SourceShellIntelligenceFinding[];
  stepInsight: StepInsightView | null;
  captureSemantics: {
    conversationOnlyLabel: string;
    saveActionLabel: string;
  };
}

export interface SourceShellApprovalsWorkspace {
  items: ApprovalsInboxItem[];
  currentStageItem: ApprovalsInboxItem | null;
  readinessLine: string;
  /** Full 11-stage per-event ledger — see approval-ledger.ts. Empty when not loaded. */
  ledger: ApprovalLedgerRow[];
}

export interface SourceShellGuidebookWorkspace {
  available: boolean;
  record: SourceStageGuidebookRecord | null;
  emptyMessage: string;
}

export interface SourceEventShellView {
  event: {
    id: string;
    code: string;
    name: string;
    tenantName: string;
    accountName: string;
    statusLabel: string;
    valueAtStakeLabel: string;
    currentStageKey: SourceStageKey;
    viewedStageKey: SourceStageKey;
    viewedStageLabel: string;
  };
  workspaces: {
    active: SourceShellWorkspace;
    available: SourceShellWorkspace[];
  };
  journey: SourceShellJourneyStage[];
  stage: {
    key: SourceStageKey;
    label: string;
    purpose: string;
    pattern:
      | "intake"
      | "upload-heavy"
      | "workflow"
      | "analytics-heavy"
      | "negotiation";
    ready: number;
    total: number;
    readyPct: number;
    groups: SourceShellStepGroup[];
    activeStep: SourceShellStep | null;
    gateReadinessLine: string;
    approvalHref: string;
    approvalCtaLabel: string;
    approvalLockedLabel: string;
  };
  files: {
    items: SourceShellFileItem[];
    byStage: {
      stageKey: string;
      stageLabel: string;
      items: SourceShellFileItem[];
    }[];
    lifecycle: SourceArtifactLifecycleSummary;
  };
  intelligence: SourceShellIntelligenceExplorer;
  approvals: SourceShellApprovalsWorkspace;
  guidebook: SourceShellGuidebookWorkspace;
}

export interface SourceShellArtifactLike {
  id: string;
  artifactCode?: string | null;
  artifactKind?: string | null;
  stageKey?: string | null;
  sourcingStage?: string | null;
  sourceEventId?: string | null;
  artifactGroup?: string | null;
  artifactType?: string | null;
  artifactFamily?: string | null;
  sourceOrigin?: string | null;
  title?: string | null;
  fileName?: string | null;
  fileFormat?: string | null;
  sourceFormat?: string | null;
  originalName?: string | null;
  status?: string | null;
  approvalState?: string | null;
  evidenceState?: string | null;
  isClientFinal?: boolean | null;
  isCurrentAuthoritative?: boolean | null;
  sourceGeneratedArtifactId?: string | null;
  body?: string | null;
  bodyMarkdown?: string | null;
  renderedText?: string | null;
  plainTextSummary?: string | null;
  parseStatus?: string | null;
  embeddingStatus?: string | null;
  graphStatus?: string | null;
  /**
   * Registry note (source_artifacts.description). Only ever read here to
   * derive the client-safe `needsComplianceReview` flag on the resulting
   * file item — the raw string itself must never be forwarded into a UI
   * surface, since it can carry internal governance banner text.
   */
  description?: string | null;
}

export interface BuildSourceEventShellViewInput {
  event: SourcingEventSummary;
  tenantName: string;
  viewedStageKey: SourceStageKey;
  stageView: StageAnalyticsView;
  stepInsight?: StepInsightView | null;
  artifacts?: readonly SourceShellArtifactLike[];
  approvalItems?: readonly ApprovalsInboxItem[];
  approvalLedger?: readonly ApprovalLedgerRow[];
  activeWorkspace?: SourceShellWorkspace;
  intelligenceOpen?: boolean;
  /** Facilitator guidebook for the viewed stage. null = not authored for this stage (expected — most stages have no guidebook yet), not an error. */
  guidebook?: SourceStageGuidebookRecord | null;
  /** Latest acceptance record per artifact id (SOURCE-SHELL-004), keyed by `source_artifacts.id`. Artifacts with no key present have never been accepted. */
  latestArtifactAcceptancesById?: ReadonlyMap<string, ArtifactAcceptanceRecord>;
  /** Event-specific visible journey. Storage still uses canonical stage keys. */
  journey?: SourceJourneyDefinition;
}

export function mergeSourceShellArtifactsWithArtifactStateBodies(
  registryArtifacts: readonly SourceShellArtifactLike[],
  artifactStates: readonly SourceEventArtifactState[],
): SourceShellArtifactLike[] {
  const authoredStates = artifactStates.filter((state) => state.body?.trim());
  if (authoredStates.length === 0) return [...registryArtifacts];

  const statesByCode = new Map(
    authoredStates.map((state) => [state.artifactCode, state]),
  );
  const merged = registryArtifacts.map((artifact) => {
    const code = artifactCodeFor(artifact);
    const state = code ? statesByCode.get(code) : undefined;
    if (!state || artifactBodyFor(artifact)?.trim()) return artifact;
    return {
      ...artifact,
      body: state.body,
      bodyMarkdown:
        state.bodyFormat === "markdown" ? state.body : artifact.bodyMarkdown,
      renderedText:
        state.bodyFormat !== "markdown" ? state.body : artifact.renderedText,
    };
  });
  const existingCodes = new Set(
    merged.map(artifactCodeFor).filter((code): code is string => Boolean(code)),
  );

  for (const state of authoredStates) {
    if (existingCodes.has(state.artifactCode)) continue;
    merged.push({
      id: `artifact-state:${state.id}`,
      sourceEventId: state.sourceEventId,
      artifactCode: state.artifactCode,
      artifactKind: state.artifactCode,
      stageKey: state.stage,
      sourcingStage: state.stage,
      artifactGroup: "generated",
      artifactFamily: state.family,
      sourceOrigin: "generated",
      title: humanize(state.artifactCode),
      fileName: `${state.artifactCode}.${state.bodyFormat === "html" ? "html" : "md"}`,
      fileFormat: state.bodyFormat === "html" ? "html" : "md",
      sourceFormat: state.bodyFormat === "html" ? "html" : "markdown",
      status: state.status,
      approvalState:
        state.status === "approved" || state.status === "locked"
          ? "approved"
          : "draft",
      body: state.body,
      bodyMarkdown: state.bodyFormat === "markdown" ? state.body : null,
      renderedText: state.bodyFormat !== "markdown" ? state.body : null,
    });
    existingCodes.add(state.artifactCode);
  }

  return merged;
}

export function buildSourceEventShellView(
  input: BuildSourceEventShellViewInput,
): SourceEventShellView {
  const activeWorkspace = input.activeWorkspace ?? "steps";
  const tasks = input.stageView.tasks;
  const ready = tasks.filter((task) => isTaskCaptured(task)).length;
  const total = tasks.length;
  const viewedStageLabel =
    sourceJourneyLabelForStage(input.journey, input.viewedStageKey) ||
    input.stageView.stageName;
  const visibleStageOrder = sourceJourneyStageKeys(
    input.journey ?? SOURCE_JOURNEYS.competitive_rfp,
  );
  const visibleCurrentStageKey = visibleStageOrder.includes(
    input.event.currentStageKey,
  )
    ? input.event.currentStageKey
    : input.viewedStageKey;
  const currentStageIndex = visibleStageOrder.indexOf(visibleCurrentStageKey);

  const journey: SourceShellJourneyStage[] = visibleStageOrder.map(
    (stageKey, index) => {
      const viewed = stageKey === input.viewedStageKey;
      const current = stageKey === visibleCurrentStageKey;
      const state: SourceShellJourneyStage["state"] =
        index < currentStageIndex ? "past" : current ? "current" : "future";
      const stageTotal = viewed && state !== "past" ? Math.max(total, 1) : 1;
      const stageDone =
        state === "past" ? stageTotal : viewed ? ready : 0;
      return {
        key: stageKey,
        label: sourceJourneyLabelForStage(input.journey, stageKey),
        index: index + 1,
        current,
        viewed,
        done: stageDone,
        total: stageTotal,
        state,
      };
    },
  );

  const groups = groupSteps(tasks);
  const stepsById = new Map(
    groups.flatMap((group) => group.steps).map((step) => [step.id, step]),
  );
  const activeStep =
    tasks
      .map((task) => stepsById.get(task.id))
      .find((step) => step && step.status !== "captured") ?? null;
  const artifacts = (input.artifacts ?? []).map((artifact) =>
    toFileItem(
      artifact,
      input.latestArtifactAcceptancesById?.get(artifact.id) ?? null,
    ),
  );
  const lifecycle = buildSourceArtifactLifecycleSummary(input.artifacts ?? []);
  // The raw inbox is cross-tenant ("everything waiting on you across every
  // event" — the portfolio-level /source/approvals page is where that
  // belongs). This per-event canvas must only ever show THIS event's items.
  const thisEventApprovals = Array.from(input.approvalItems ?? []).filter(
    (item) => item.eventId === input.event.id,
  );
  const rawCurrentStageItem =
    thisEventApprovals.find(
      (item) => item.stageKey === input.event.currentStageKey,
    ) ?? null;
  const stageApprovalHref = `/source/events/${encodeURIComponent(input.event.id)}?stage=${encodeURIComponent(input.viewedStageKey)}&workspace=approvals`;
  const viewedStageIsCurrent =
    input.viewedStageKey === input.event.currentStageKey;
  const completedViewedStage = total > 0 && ready === total;
  const currentStageItem =
    rawCurrentStageItem && viewedStageIsCurrent && completedViewedStage
      ? {
          ...rawCurrentStageItem,
          status: "ready" as const,
          readiness: `All ${total} required evidence item${total === 1 ? "" : "s"} ready — review and approve ${viewedStageLabel}.`,
          href: stageApprovalHref,
          actionLabel: "Approve now",
        }
      : rawCurrentStageItem;
  // currentStageItem already renders featured above the list — exclude it
  // here so it doesn't also render a second time inside the list.
  const approvals = thisEventApprovals.filter(
    (item) => item !== rawCurrentStageItem,
  );
  const stepInsight = input.stepInsight ?? input.stageView.stepInsight ?? null;
  const intelSourceBasis = intelligenceBasis(
    input.stageView.intel.provenance,
    stepInsight,
  );

  return {
    event: {
      id: input.event.id,
      code: input.event.code,
      name: input.event.name,
      tenantName: input.tenantName,
      accountName: input.event.accountName,
      statusLabel: input.event.statusLabel,
      valueAtStakeLabel: formatUsdPerYear(input.event.valueAtStakeUsd),
      currentStageKey: input.event.currentStageKey,
      viewedStageKey: input.viewedStageKey,
      viewedStageLabel,
    },
    workspaces: {
      active: activeWorkspace,
      available: ["steps", "files", "intelligence", "approvals", "guidebook"],
    },
    journey,
    stage: {
      key: input.viewedStageKey,
      label: viewedStageLabel,
      purpose: input.stageView.purpose,
      pattern: stagePattern(input.viewedStageKey),
      ready,
      total,
      readyPct: total > 0 ? Math.round((ready / total) * 100) : 0,
      groups,
      activeStep,
      gateReadinessLine:
        ready === total
          ? "Stage complete - all required evidence is ready. Open the approval workspace to advance."
          : `${total - ready} steps left - ${total - ready} required evidence item${total - ready === 1 ? "" : "s"} before approval.`,
      approvalHref: stageApprovalHref,
      approvalCtaLabel: `Open ${viewedStageLabel} approval`,
      approvalLockedLabel: "Approval opens when required evidence is ready",
    },
    files: {
      items: artifacts,
      byStage: groupFilesByStage(artifacts),
      lifecycle,
    },
    intelligence: {
      state: input.intelligenceOpen ? "open" : "hidden",
      contextChips: [
        input.event.code,
        viewedStageLabel,
        input.event.archetype,
        `${ready}/${total || 0} steps`,
      ],
      lead: input.stageView.intel.lead,
      provenance: input.stageView.intel.provenance,
      sourceBasis: intelSourceBasis,
      findings: input.stageView.intel.points.map((point, index) => ({
        id: `${input.viewedStageKey}-finding-${index + 1}`,
        tag: point.tag,
        text: point.text,
        sourceBasis:
          point.tone === "archetype" ? "archetype" : intelSourceBasis,
      })),
      stepInsight,
      captureSemantics: {
        conversationOnlyLabel:
          "Used in this conversation - not saved to the Source record.",
        saveActionLabel: "Save to Source record",
      },
    },
    approvals: {
      items: approvals,
      currentStageItem,
      readinessLine:
        currentStageItem?.readiness ??
        "No approval item is currently routed for this viewed stage.",
      ledger: Array.from(input.approvalLedger ?? []),
    },
    guidebook: {
      available: input.guidebook != null,
      record: input.guidebook ?? null,
      emptyMessage: `No facilitator guidebook has been authored for the ${viewedStageLabel} stage yet.`,
    },
  };
}

function isTaskCaptured(task: StageTaskView): boolean {
  return task.state === "done" || task.evidenceComplete === true;
}

function groupSteps(tasks: readonly StageTaskView[]): SourceShellStepGroup[] {
  const groups = new Map<string, SourceShellStep[]>();
  tasks.forEach((task) => {
    const label = taskGroupLabel(task);
    const list = groups.get(label) ?? [];
    list.push(toShellStep(task, list.length === 0));
    groups.set(label, list);
  });
  return Array.from(groups.entries()).map(([label, steps], index) => ({
    id: `group-${index + 1}-${slug(label)}`,
    label,
    steps,
  }));
}

function toShellStep(
  task: StageTaskView,
  firstInGroup: boolean,
): SourceShellStep {
  const captured = isTaskCaptured(task);
  return {
    id: task.id,
    title: task.title,
    help: task.guide || task.subtitle,
    type: task.type,
    status: captured ? "captured" : firstInGroup ? "active" : "open",
    sourceBasis: captured ? taskSourceBasis(task) : "missing",
    cta: task.cta,
    rows: task.rows ?? [],
    file: task.file ?? null,
    template: task.template ?? null,
    provenance: task.provenance ?? null,
    factTemplateCode: task.factTemplateCode ?? null,
  };
}

function taskGroupLabel(task: StageTaskView): string {
  const text = `${task.title} ${task.subtitle}`;
  if (/exclusion|included|applications?|inventory/i.test(text)) {
    return "Inclusions & exclusions";
  }
  if (/owner|boundary|sponsor|responsibility|retained/i.test(text)) {
    return "Boundary & owner";
  }
  if (/baseline|volume|sla|commercial|contract|evidence|cost/i.test(text)) {
    return "Baseline evidence";
  }
  if (task.type === "provide") return "Evidence intake";
  if (task.type === "decide") return "Decision work";
  return "Review work";
}

function taskSourceBasis(task: StageTaskView): SourceShellEvidenceBasis {
  if (task.evidenceComplete === true || task.factTemplateCode)
    return "live_fact";
  if (task.file) return "live_artifact";
  return "computed";
}

function toFileItem(
  artifact: SourceShellArtifactLike,
  latestAcceptance: ArtifactAcceptanceRecord | null = null,
): SourceShellFileItem {
  const stageKey = String(
    artifact.stageKey ?? artifact.sourcingStage ?? "other",
  );
  const artifactCode = String(
    artifact.artifactCode ??
      artifact.artifactKind ??
      artifact.artifactType ??
      "",
  );
  const group = String(
    artifact.artifactGroup ?? artifact.artifactFamily ?? "artifact",
  );
  const sourceOrigin = String(artifact.sourceOrigin ?? "");
  const state = String(
    artifact.status ??
      artifact.approvalState ??
      artifact.evidenceState ??
      "registered",
  );
  const isClientFinal =
    artifact.isClientFinal === true || state === "client_final";
  const governance = fileGovernanceFor({ group, sourceOrigin, isClientFinal });
  const needsComplianceReview = hasComplianceReviewFlag(artifact.description);
  const artifactRole: "authoritative" | "evidence" = specByCode(artifactCode)
    ?.gateDefining
    ? "authoritative"
    : "evidence";
  return {
    id: artifact.id,
    artifactCode,
    stageKey,
    stageLabel:
      SOURCE_STAGE_LABELS[stageKey as SourceStageKey] ?? humanize(stageKey),
    format: String(
      artifact.fileFormat ?? artifact.sourceFormat ?? "unknown",
    ).toUpperCase(),
    name: String(
      artifact.title ??
        artifact.fileName ??
        artifact.originalName ??
        artifact.artifactType ??
        "Source artifact",
    ),
    state,
    group,
    sourceBasis: "live_artifact",
    artifactRole,
    governanceLabel: governance.label,
    governanceMessage: governance.message,
    needsComplianceReview,
    complianceReviewLabel: needsComplianceReview
      ? SOURCE_COMPLIANCE_REVIEW_FLAG_LABEL
      : null,
    complianceReviewMessage: needsComplianceReview
      ? SOURCE_COMPLIANCE_REVIEW_FLAG_MESSAGE
      : null,
    parseStatus: artifact.parseStatus ?? null,
    embeddingStatus: artifact.embeddingStatus ?? null,
    graphStatus: artifact.graphStatus ?? null,
    latestAcceptance,
  };
}

function artifactCodeFor(artifact: SourceShellArtifactLike): string | null {
  return (
    artifact.artifactCode ??
    artifact.artifactKind ??
    artifact.artifactType ??
    null
  );
}

function artifactBodyFor(artifact: SourceShellArtifactLike): string | null {
  return (
    artifact.body ??
    artifact.bodyMarkdown ??
    artifact.renderedText ??
    artifact.plainTextSummary ??
    null
  );
}

function fileGovernanceFor({
  group,
  sourceOrigin,
  isClientFinal,
}: {
  group: string;
  sourceOrigin: string;
  isClientFinal: boolean;
}): { label: string; message: string | null } {
  if (isClientFinal) {
    return {
      label: "Client-approved final",
      message: SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
    };
  }

  if (group === "generated" || sourceOrigin === "generated") {
    return {
      label: SOURCE_AI_DRAFT_GOVERNANCE_LABEL,
      message: SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
    };
  }

  return {
    label: "File evidence",
    message: null,
  };
}

function groupFilesByStage(
  items: SourceShellFileItem[],
): SourceEventShellView["files"]["byStage"] {
  const groups = new Map<string, SourceShellFileItem[]>();
  for (const item of items) {
    const list = groups.get(item.stageKey) ?? [];
    list.push(item);
    groups.set(item.stageKey, list);
  }
  return Array.from(groups.entries()).map(([stageKey, stageItems]) => ({
    stageKey,
    stageLabel:
      SOURCE_STAGE_LABELS[stageKey as SourceStageKey] ?? humanize(stageKey),
    items: stageItems,
  }));
}

function intelligenceBasis(
  provenance: IntelProvenance,
  stepInsight: StepInsightView | null,
): SourceShellEvidenceBasis {
  if (stepInsight?.provenance === "live") return "computed";
  return provenance === "live" ? "computed" : "sample";
}

function stagePattern(
  stageKey: SourceStageKey,
): SourceEventShellView["stage"]["pattern"] {
  if (stageKey === "responses" || stageKey === "rfp") return "upload-heavy";
  if (
    stageKey === "pricing" ||
    stageKey === "evaluation" ||
    stageKey === "value"
  ) {
    return "analytics-heavy";
  }
  if (stageKey === "bafo") return "negotiation";
  if (stageKey === "strategy" || stageKey === "scope") return "intake";
  return "workflow";
}

function formatUsdPerYear(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "Value at stake pending";
  return `$${(value / 1_000_000).toFixed(1)}M/yr at stake`;
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
