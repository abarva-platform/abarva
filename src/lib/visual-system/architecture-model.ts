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

export interface ArchitectureModel {
  engagement: string;
  client: string;
  /** The architecture decision/recommendation — leads the exhibit. */
  decisionHeadline: string;
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

/** Validate referential integrity + the transformation's hard requirements. */
export function validateArchitectureModel(
  model: ArchitectureModel,
): ArchValidationIssue[] {
  const issues: ArchValidationIssue[] = [];
  const targetIds = new Set(model.target.nodes.map((n) => n.id));
  const currentIds = new Set(model.current.nodes.map((n) => n.id));

  for (const [state, ids] of [
    ["current", currentIds],
    ["target", targetIds],
  ] as const) {
    const flows = model[state].flows;
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
  const kinds = new Set(model.target.flows.map((f) => f.kind));
  if (!kinds.has("data")) {
    issues.push({ level: "warn", message: "Target has no data-flow edges." });
  }
  if (!kinds.has("control")) {
    issues.push({
      level: "warn",
      message: "Target has no AI control/decision-flow edges (agentic overlay).",
    });
  }

  // Agentic overlay must reference real agent + tool nodes.
  for (const b of model.agentic) {
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
  const hasNamedServices = model.target.nodes.some((n) => n.service);
  if (hasNamedServices && !model.provenanceNote) {
    issues.push({
      level: "warn",
      message:
        "Target names services but carries no provenanceNote (where the cloud choice came from).",
    });
  }

  return issues;
}
