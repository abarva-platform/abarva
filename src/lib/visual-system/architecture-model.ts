// Deliverable Quality Transformation — ArchitectureModel (W2)
//
// The typed, cloud-AGNOSTIC architecture model the synthesis layer emits per
// engagement. The renderer draws this model; it never hardcodes a cloud or a
// service. A banking engagement might show AWS/Databricks because the solution
// reasoned it — a different engagement yields different providers/services in the
// SAME fields. Cloud is an OUTPUT, never a build-time setting.
//
// Models two states (as-is + to-be), an agentic "come-alive" overlay that
// animates the target, the patterns in play, the control points, and the
// implementation waves — everything the Target Architecture exhibit needs.
//
// Reference: docs/build/DELIVERABLE_QUALITY_TRANSFORMATION_BUILD_SEQUENCE.md (§2)

import type { ObservedGap } from "@/lib/deliverables/planning/deliverable-plan";

/** The seven architecture layers, top (user) to bottom (infra). */
export type ArchLayer =
  | "experience" // channels, users, front doors
  | "agentic" // agent orchestration / reasoning
  | "application" // services, apps, business logic
  | "data_platform" // data stores, lakehouse, ML/feature platform
  | "integration" // APIs, events, middleware, rails
  | "core_systems" // systems of record
  | "infrastructure"; // cloud runtime, security, observability

export const ARCH_LAYER_ORDER: ReadonlyArray<ArchLayer> = [
  "experience",
  "agentic",
  "application",
  "data_platform",
  "integration",
  "core_systems",
  "infrastructure",
];

export const ARCH_LAYER_LABELS: Readonly<Record<ArchLayer, string>> = {
  experience: "Experience & Channels",
  agentic: "Agentic Orchestration",
  application: "Applications & Services",
  data_platform: "Data & ML Platform",
  integration: "Integration & Rails",
  core_systems: "Core Systems of Record",
  infrastructure: "Cloud & Platform",
};

/** Provider is whatever the solution chose — NOT predetermined. */
export type CloudProvider =
  | "azure"
  | "aws"
  | "gcp"
  | "on_prem"
  | "saas"
  | "hybrid"
  | "other";

export type ArchNodeKind =
  | "channel"
  | "application"
  | "service"
  | "data_store"
  | "agent"
  | "model"
  | "integration"
  | "control"
  | "system"
  | "external";

/** Delta status used to show the current→target journey. */
export type ArchNodeStatus = "existing" | "new" | "changed" | "retired";

export interface ArchNode {
  id: string;
  label: string;
  kind: ArchNodeKind;
  layer: ArchLayer;
  /** Named service/platform, e.g. "Databricks", "Azure AI Search", "Bedrock". */
  service?: string;
  /** Provider — populated from the engagement solution, not a fixed default. */
  provider?: CloudProvider;
  /** One-line implication/caption: why it matters for this decision. */
  note?: string;
  status?: ArchNodeStatus;
}

export type ArchFlowKind = "data" | "control" | "event" | "human_approval";

export interface ArchFlow {
  id: string;
  from: string; // node id
  to: string; // node id
  label?: string;
  /** data flow is rendered DISTINCT from AI control flow (hard requirement). */
  kind: ArchFlowKind;
  note?: string;
}

export interface ArchitectureStateModel {
  title: string;
  /** One-line thesis for this state. */
  thesis: string;
  nodes: ArchNode[];
  flows: ArchFlow[];
}

/** The agentic overlay — how the services come alive. */
export interface AgentBinding {
  /** node id of an 'agent' node in the target state. */
  agentId: string;
  role: string;
  /** node ids this agent invokes as tools. */
  callsTools: string[];
  /** node ids it grounds/retrieves from. */
  grounding?: string[];
  /** control node ids that gate it (model-risk, policy). */
  guardrails?: string[];
  /** where a human approves. */
  humanInLoop?: string;
}

export interface ArchPattern {
  id: string;
  name: string; // 'RAG', 'tool-use', 'multi-agent orchestration', 'event-driven', 'human-in-the-loop'
  appliesTo: string[]; // node ids
  implication: string; // one-line business implication
}

export interface ControlPoint {
  id: string;
  label: string;
  what: string;
  owner?: string;
}

export interface ImplementationWave {
  id: string;
  label: string; // 'Wave 1 — Foundation'
  window?: string; // '0–90 days'
  scope: string[]; // descriptions or node ids
  outcome: string;
}

export interface CurrentStateFlowStep {
  id: string;
  label: string;
  actor?: string;
  trigger?: string;
  systems?: string[];
  dataSources?: string[];
  handoff?: string;
  decision?: string;
  manualWork?: string;
  delay?: string;
  bottleneck?: string;
  missingTelemetry?: string;
  controlGap?: string;
  valueLeakage?: string;
}

export interface GapToTargetBridgeItem {
  id: string;
  /** Optional pointer to gapsMap.id, when this bridge item derives from one gap. */
  gapId?: string;
  observation: string;
  gap: string;
  designImplication: string;
  targetCapability: string;
  architectureResponse: string;
}

export type ArchitectureLevel = "conceptual" | "logical" | "physical";

export interface ArchitectureLevelModel {
  title: string;
  thesis: string;
  nodes: ArchNode[];
  flows: ArchFlow[];
  soWhat: string;
}

export interface ArchitectureDecision {
  id: string;
  decision: string;
  recommendation: string;
  rationale: string;
  status?: "recommended" | "open" | "deferred";
}

export type ArchitectureExhibitKey =
  | "current_state_operating_flow"
  | "current_state_system_data_flow"
  | "current_state_gaps_map"
  | "target_conceptual_architecture"
  | "target_logical_architecture"
  | "target_physical_deployment"
  | "end_to_end_data_flow"
  | "ai_recommendation_control_flow"
  | "human_approval_override_model"
  | "integration_map"
  | "governance_audit_telemetry_flow"
  | "implementation_waves"
  | "architecture_decision_log";

export interface ArchitectureExhibitPlanItem {
  id: ArchitectureExhibitKey;
  title: string;
  soWhat: string;
  decisionImplication: string;
}

export const ARCHITECTURE_V2_EXHIBITS: ReadonlyArray<ArchitectureExhibitKey> = [
  "current_state_operating_flow",
  "current_state_system_data_flow",
  "current_state_gaps_map",
  "target_conceptual_architecture",
  "target_logical_architecture",
  "target_physical_deployment",
  "end_to_end_data_flow",
  "ai_recommendation_control_flow",
  "human_approval_override_model",
  "integration_map",
  "governance_audit_telemetry_flow",
  "implementation_waves",
  "architecture_decision_log",
];

export interface ArchitectureModel {
  engagement: string;
  client: string;
  /** The architecture decision/recommendation — leads the exhibit. */
  decisionHeadline: string;
  /** Ordered current-state operating flow: actors, events, handoffs, decisions, leakage. */
  currentStateFlow?: CurrentStateFlowStep[];
  /** Current observation → gap → design implication. */
  gapsMap?: ObservedGap[];
  /** Explicit current→gap→target bridge the reader can inspect. */
  gapToTargetBridge?: GapToTargetBridgeItem[];
  /** Conceptual, logical, and physical architecture levels. */
  architectureLevels?: Partial<
    Record<ArchitectureLevel, ArchitectureLevelModel>
  >;
  /** The 13 visual exhibits the renderer must draw, each with interpretation. */
  exhibitPlan?: ArchitectureExhibitPlanItem[];
  /** Architecture decision log for open/recommended design choices. */
  decisionLog?: ArchitectureDecision[];
  current: ArchitectureStateModel; // as-is
  target: ArchitectureStateModel; // to-be
  agentic: AgentBinding[]; // come-alive overlay on target
  patterns: ArchPattern[];
  controlPoints: ControlPoint[];
  waves: ImplementationWave[];
  /** Single consolidated list (not scattered placeholders). */
  openInputs?: string[];
  /** Where the cloud/service choices came from (the solution). */
  provenanceNote?: string;
}

export interface ArchValidationIssue {
  level: "error" | "warn";
  message: string;
}

function hasText(s: string | undefined): boolean {
  return !!s?.trim();
}

function validateLevel(
  level: ArchitectureLevel,
  model: ArchitectureLevelModel | undefined,
  issues: ArchValidationIssue[],
): void {
  if (!model) {
    issues.push({
      level: "error",
      message: `Missing ${level} architecture level.`,
    });
    return;
  }
  if (
    !hasText(model.title) ||
    !hasText(model.thesis) ||
    !hasText(model.soWhat)
  ) {
    issues.push({
      level: "error",
      message: `${level} architecture level is missing title, thesis, or soWhat.`,
    });
  }
  const nodes = Array.isArray(model.nodes) ? model.nodes : [];
  const flows = Array.isArray(model.flows) ? model.flows : [];
  if (!nodes.length) {
    issues.push({
      level: "error",
      message: `${level} architecture level has no nodes.`,
    });
  }
  const ids = new Set(nodes.map((n) => n.id));
  for (const f of flows) {
    if (!ids.has(f.from) || !ids.has(f.to)) {
      issues.push({
        level: "error",
        message: `${level} architecture flow ${f.id} references an unknown node (${f.from}→${f.to}).`,
      });
    }
  }
}

/** Validate referential integrity + the transformation's hard requirements. */
export function validateArchitectureModel(
  model: ArchitectureModel,
): ArchValidationIssue[] {
  const issues: ArchValidationIssue[] = [];
  if (!model || typeof model !== "object") {
    return [{ level: "error", message: "Architecture model is missing." }];
  }

  const current = model.current;
  const target = model.target;
  if (!current) {
    issues.push({ level: "error", message: "Missing current architecture state." });
  }
  if (!target) {
    issues.push({ level: "error", message: "Missing target architecture state." });
  }

  const currentNodes = Array.isArray(current?.nodes) ? current.nodes : [];
  const currentFlows = Array.isArray(current?.flows) ? current.flows : [];
  const targetNodes = Array.isArray(target?.nodes) ? target.nodes : [];
  const targetFlows = Array.isArray(target?.flows) ? target.flows : [];
  if (current && !currentNodes.length) {
    issues.push({ level: "error", message: "Current architecture state has no nodes." });
  }
  if (target && !targetNodes.length) {
    issues.push({ level: "error", message: "Target architecture state has no nodes." });
  }

  const targetIds = new Set(targetNodes.map((n) => n.id));
  const currentIds = new Set(currentNodes.map((n) => n.id));

  for (const [state, ids] of [
    ["current", currentIds],
    ["target", targetIds],
  ] as const) {
    const flows = state === "current" ? currentFlows : targetFlows;
    for (const f of flows) {
      if (!ids.has(f.from) || !ids.has(f.to)) {
        issues.push({
          level: "error",
          message: `${state} flow ${f.id} references an unknown node (${f.from}→${f.to}).`,
        });
      }
    }
  }

  // Hard requirement: data flow distinct from AI control flow on the target.
  const kinds = new Set(targetFlows.map((f) => f.kind));
  if (!kinds.has("data")) {
    issues.push({ level: "warn", message: "Target has no data-flow edges." });
  }
  if (!kinds.has("control")) {
    issues.push({
      level: "warn",
      message:
        "Target has no AI control/decision-flow edges (agentic overlay).",
    });
  }

  // Agentic overlay must reference real agent + tool nodes.
  for (const b of model.agentic ?? []) {
    if (!targetIds.has(b.agentId)) {
      issues.push({
        level: "error",
        message: `Agent binding references unknown agent node ${b.agentId}.`,
      });
    }
    for (const t of b.callsTools) {
      if (!targetIds.has(t)) {
        issues.push({
          level: "warn",
          message: `Agent ${b.agentId} calls unknown tool node ${t}.`,
        });
      }
    }
  }

  // A target with named services but no provenance note risks looking predetermined.
  const hasNamedServices = targetNodes.some((n) => n.service);
  if (hasNamedServices && !model.provenanceNote) {
    issues.push({
      level: "warn",
      message:
        "Target names services but carries no provenanceNote (where the cloud choice came from).",
    });
  }

  if (!model.currentStateFlow?.length) {
    issues.push({
      level: "error",
      message: "Current-state operating flow is empty.",
    });
  }

  if (!model.gapsMap?.length) {
    issues.push({
      level: "error",
      message: "Gaps map is empty.",
    });
  }
  for (const g of model.gapsMap ?? []) {
    if (
      !hasText(g.observation) ||
      !hasText(g.gap) ||
      !hasText(g.designImplication)
    ) {
      issues.push({
        level: "error",
        message: `Gap ${g.id} is missing observation / gap / designImplication.`,
      });
    }
  }

  if (!model.gapToTargetBridge?.length) {
    issues.push({
      level: "error",
      message: "Gap-to-target bridge is empty.",
    });
  }
  const gapIds = new Set((model.gapsMap ?? []).map((g) => g.id));
  for (const b of model.gapToTargetBridge ?? []) {
    if (
      !hasText(b.observation) ||
      !hasText(b.gap) ||
      !hasText(b.designImplication) ||
      !hasText(b.targetCapability) ||
      !hasText(b.architectureResponse)
    ) {
      issues.push({
        level: "error",
        message: `Gap bridge ${b.id} is missing observation / gap / designImplication / targetCapability / architectureResponse.`,
      });
    }
    if (b.gapId && !gapIds.has(b.gapId)) {
      issues.push({
        level: "error",
        message: `Gap bridge ${b.id} references unknown gap ${b.gapId}.`,
      });
    }
  }
  for (const g of model.gapsMap ?? []) {
    const covered = (model.gapToTargetBridge ?? []).some(
      (b) => b.gapId === g.id || b.gap === g.gap,
    );
    if (!covered) {
      issues.push({
        level: "error",
        message: `Gap ${g.id} is not covered by the gap-to-target bridge.`,
      });
    }
  }

  validateLevel("conceptual", model.architectureLevels?.conceptual, issues);
  validateLevel("logical", model.architectureLevels?.logical, issues);
  validateLevel("physical", model.architectureLevels?.physical, issues);

  const exhibitIds = new Set((model.exhibitPlan ?? []).map((e) => e.id));
  for (const id of ARCHITECTURE_V2_EXHIBITS) {
    if (!exhibitIds.has(id)) {
      issues.push({
        level: "error",
        message: `Missing required architecture exhibit plan item ${id}.`,
      });
    }
  }
  for (const e of model.exhibitPlan ?? []) {
    if (!hasText(e.soWhat) || !hasText(e.decisionImplication)) {
      issues.push({
        level: "error",
        message: `Exhibit ${e.id} is missing soWhat or decisionImplication.`,
      });
    }
  }

  return issues;
}
