import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from "@/lib/source/constants";
import type {
  SourceStageKey,
  SourcingEventSummary,
} from "@/lib/source/types";
import {
  SOURCE_AI_DRAFT_GOVERNANCE_LABEL,
  SOURCE_AI_DRAFT_GOVERNANCE_MESSAGE,
  SOURCE_CLIENT_FINAL_GOVERNANCE_MESSAGE,
} from "@/lib/source/artifact-governance";
import {
  buildSourceArtifactLifecycleSummary,
  type SourceArtifactLifecycleSummary,
} from "@/lib/source/artifact-lifecycle-matrix";
import type {
  IntelProvenance,
  StageAnalyticsView,
  StageTaskView,
  StepInsightView,
} from "@/components/source/canvas/analytics/view-model";
import type { ApprovalsInboxItem } from "@/lib/source/approvals-inbox";

export type SourceShellWorkspace = "steps" | "files" | "intelligence" | "approvals";

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
  governanceLabel: string;
  governanceMessage: string | null;
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
    pattern: "intake" | "upload-heavy" | "workflow" | "analytics-heavy" | "negotiation";
    ready: number;
    total: number;
    readyPct: number;
    groups: SourceShellStepGroup[];
    activeStep: SourceShellStep | null;
    gateReadinessLine: string;
  };
  files: {
    items: SourceShellFileItem[];
    byStage: { stageKey: string; stageLabel: string; items: SourceShellFileItem[] }[];
    lifecycle: SourceArtifactLifecycleSummary;
  };
  intelligence: SourceShellIntelligenceExplorer;
  approvals: SourceShellApprovalsWorkspace;
}

export interface SourceShellArtifactLike {
  id: string;
  artifactCode?: string | null;
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
}

export interface BuildSourceEventShellViewInput {
  event: SourcingEventSummary;
  tenantName: string;
  viewedStageKey: SourceStageKey;
  stageView: StageAnalyticsView;
  stepInsight?: StepInsightView | null;
  artifacts?: readonly SourceShellArtifactLike[];
  approvalItems?: readonly ApprovalsInboxItem[];
  activeWorkspace?: SourceShellWorkspace;
  intelligenceOpen?: boolean;
}

export function buildSourceEventShellView(
  input: BuildSourceEventShellViewInput,
): SourceEventShellView {
  const activeWorkspace = input.activeWorkspace ?? "steps";
  const tasks = input.stageView.tasks;
  const ready = tasks.filter((task) => isTaskCaptured(task)).length;
  const total = tasks.length;
  const viewedStageLabel =
    SOURCE_STAGE_LABELS[input.viewedStageKey] ?? input.stageView.stageName;
  const currentStageIndex = SOURCE_STAGE_ORDER.indexOf(input.event.currentStageKey);

  const journey: SourceShellJourneyStage[] = SOURCE_STAGE_ORDER.map((stageKey, index) => {
    const viewed = stageKey === input.viewedStageKey;
    const current = stageKey === input.event.currentStageKey;
    const stageDone = stageKey === input.viewedStageKey ? ready : index < currentStageIndex ? 1 : 0;
    const stageTotal = stageKey === input.viewedStageKey ? Math.max(total, 1) : 1;
    const state: SourceShellJourneyStage["state"] =
      index < currentStageIndex ? "past" : current ? "current" : "future";
    return {
      key: stageKey,
      label: SOURCE_STAGE_LABELS[stageKey] ?? stageKey,
      index: index + 1,
      current,
      viewed,
      done: stageDone,
      total: stageTotal,
      state,
    };
  });

  const groups = groupSteps(tasks);
  const stepsById = new Map(
    groups.flatMap((group) => group.steps).map((step) => [step.id, step]),
  );
  const activeStep =
    tasks
      .map((task) => stepsById.get(task.id))
      .find((step) => step && step.status !== "captured") ?? null;
  const artifacts = (input.artifacts ?? []).map(toFileItem);
  const lifecycle = buildSourceArtifactLifecycleSummary(input.artifacts ?? []);
  const approvals = Array.from(input.approvalItems ?? []);
  const currentStageItem =
    approvals.find(
      (item) =>
        item.eventId === input.event.id &&
        item.stageKey === input.event.currentStageKey,
    ) ?? null;
  const stepInsight = input.stepInsight ?? input.stageView.stepInsight ?? null;
  const intelSourceBasis = intelligenceBasis(input.stageView.intel.provenance, stepInsight);

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
      available: ["steps", "files", "intelligence", "approvals"],
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
          ? "All steps complete - review approval inside this event workspace."
          : `${total - ready} step${total - ready === 1 ? "" : "s"} left - finish the inputs before opening this event's approval workspace.`,
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
        sourceBasis: point.tone === "archetype" ? "archetype" : intelSourceBasis,
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

function toShellStep(task: StageTaskView, firstInGroup: boolean): SourceShellStep {
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
  if (task.evidenceComplete === true || task.factTemplateCode) return "live_fact";
  if (task.file) return "live_artifact";
  return "computed";
}

function toFileItem(artifact: SourceShellArtifactLike): SourceShellFileItem {
  const stageKey = String(artifact.stageKey ?? artifact.sourcingStage ?? "other");
  const artifactCode = String(artifact.artifactCode ?? artifact.artifactType ?? "");
  const group = String(artifact.artifactGroup ?? artifact.artifactFamily ?? "artifact");
  const sourceOrigin = String(artifact.sourceOrigin ?? "");
  const state = String(
    artifact.status ?? artifact.approvalState ?? artifact.evidenceState ?? "registered",
  );
  const isClientFinal = artifact.isClientFinal === true || state === "client_final";
  const governance = fileGovernanceFor({ group, sourceOrigin, isClientFinal });
  return {
    id: artifact.id,
    artifactCode,
    stageKey,
    stageLabel: SOURCE_STAGE_LABELS[stageKey as SourceStageKey] ?? humanize(stageKey),
    format: String(artifact.fileFormat ?? artifact.sourceFormat ?? "unknown").toUpperCase(),
    name: String(artifact.title ?? artifact.fileName ?? artifact.originalName ?? artifact.artifactType ?? "Source artifact"),
    state,
    group,
    sourceBasis: "live_artifact",
    governanceLabel: governance.label,
    governanceMessage: governance.message,
  };
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

function groupFilesByStage(items: SourceShellFileItem[]): SourceEventShellView["files"]["byStage"] {
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
  if (stageKey === "pricing" || stageKey === "evaluation" || stageKey === "value") {
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
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
