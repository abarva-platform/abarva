// Deliverable Quality Transformation — ArchitectureModel generation pass (W2 live)
//
// The missing generation capability: given the engagement context, the model
// emits a STRUCTURED, validated ArchitectureModel (not prose) via forced
// tool-use. The renderer then draws it — so the cloud/services/agents come from
// the model the LLM reasons PER ENGAGEMENT, never predetermined.
//
// ENFORCEMENT DESIGN (no bandages): this module owns NO model client. The model
// call is INJECTED as a governed adapter so the only way to run it in production
// is through the egress governance (tenant policy + preflight + audit) that the
// orchestrator wires. The pass is pure prompt + schema + validation, identical
// for every tenant and use case; grounding comes from the tenant's own context.

import {
  validateArchitectureModel,
  type ArchValidationIssue,
  type ArchitectureModel,
} from "./architecture-model";

export const DEFAULT_ARCHITECTURE_MODEL = "claude-opus-4-8";

const NODE_SCHEMA = {
  type: "object",
  required: ["id", "label", "kind", "layer"],
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    kind: {
      type: "string",
      enum: [
        "channel",
        "application",
        "service",
        "data_store",
        "agent",
        "model",
        "integration",
        "control",
        "system",
        "external",
      ],
    },
    layer: {
      type: "string",
      enum: [
        "experience",
        "agentic",
        "application",
        "data_platform",
        "integration",
        "core_systems",
        "infrastructure",
      ],
    },
    service: {
      type: "string",
      description: "Named platform/service if applicable",
    },
    provider: {
      type: "string",
      enum: ["azure", "aws", "gcp", "on_prem", "saas", "hybrid", "other"],
    },
    note: { type: "string", description: "One-line business implication" },
    status: { type: "string", enum: ["existing", "new", "changed", "retired"] },
  },
} as const;

const FLOW_SCHEMA = {
  type: "object",
  required: ["id", "from", "to", "kind"],
  properties: {
    id: { type: "string" },
    from: { type: "string", description: "source node id" },
    to: { type: "string", description: "target node id" },
    label: { type: "string" },
    kind: {
      type: "string",
      enum: ["data", "control", "event", "human_approval"],
      description:
        "data = information movement; control = AI decision/agent flow",
    },
    note: { type: "string" },
  },
} as const;

const STATE_SCHEMA = {
  type: "object",
  required: ["title", "thesis", "nodes", "flows"],
  properties: {
    title: { type: "string" },
    thesis: { type: "string" },
    nodes: { type: "array", items: NODE_SCHEMA },
    flows: { type: "array", items: FLOW_SCHEMA },
  },
} as const;

const CURRENT_STATE_FLOW_SCHEMA = {
  type: "object",
  required: ["id", "label"],
  properties: {
    id: { type: "string" },
    label: { type: "string" },
    actor: { type: "string" },
    trigger: { type: "string" },
    systems: { type: "array", items: { type: "string" } },
    dataSources: { type: "array", items: { type: "string" } },
    handoff: { type: "string" },
    decision: { type: "string" },
    manualWork: { type: "string" },
    delay: { type: "string" },
    bottleneck: { type: "string" },
    missingTelemetry: { type: "string" },
    controlGap: { type: "string" },
    valueLeakage: { type: "string" },
  },
} as const;

const OBSERVED_GAP_SCHEMA = {
  type: "object",
  required: ["id", "observation", "gap", "designImplication"],
  properties: {
    id: { type: "string" },
    observation: { type: "string" },
    gap: { type: "string" },
    designImplication: { type: "string" },
  },
} as const;

const GAP_BRIDGE_SCHEMA = {
  type: "object",
  required: [
    "id",
    "observation",
    "gap",
    "designImplication",
    "targetCapability",
    "architectureResponse",
  ],
  properties: {
    id: { type: "string" },
    gapId: { type: "string" },
    observation: { type: "string" },
    gap: { type: "string" },
    designImplication: { type: "string" },
    targetCapability: { type: "string" },
    architectureResponse: { type: "string" },
  },
} as const;

const ARCH_LEVEL_SCHEMA = {
  type: "object",
  required: ["title", "thesis", "nodes", "flows", "soWhat"],
  properties: {
    title: { type: "string" },
    thesis: { type: "string" },
    nodes: { type: "array", items: NODE_SCHEMA },
    flows: { type: "array", items: FLOW_SCHEMA },
    soWhat: { type: "string" },
  },
} as const;

const EXHIBIT_IDS = [
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
] as const;

const EXHIBIT_PLAN_SCHEMA = {
  type: "object",
  required: ["id", "title", "soWhat", "decisionImplication"],
  properties: {
    id: { type: "string", enum: [...EXHIBIT_IDS] },
    title: { type: "string" },
    soWhat: { type: "string" },
    decisionImplication: { type: "string" },
  },
} as const;

const DECISION_SCHEMA = {
  type: "object",
  required: ["id", "decision", "recommendation", "rationale"],
  properties: {
    id: { type: "string" },
    decision: { type: "string" },
    recommendation: { type: "string" },
    rationale: { type: "string" },
    status: { type: "string", enum: ["recommended", "open", "deferred"] },
  },
} as const;

/** The forced-output tool schema (Anthropic tool / structured-output contract). */
export const ARCHITECTURE_TOOL = {
  name: "emit_architecture_model",
  description:
    "Emit the structured current-state and target-state architecture for this engagement. " +
    "Cloud and services must reflect the solution you reason for THIS client — never a default. " +
    "Render data flow (kind=data) distinct from AI decision/control flow (kind=control). Include " +
    "an agentic overlay showing how the services come alive.",
  input_schema: {
    type: "object",
    required: [
      "engagement",
      "client",
      "decisionHeadline",
      "currentStateFlow",
      "gapsMap",
      "gapToTargetBridge",
      "architectureLevels",
      "exhibitPlan",
      "decisionLog",
      "current",
      "target",
      "agentic",
      "patterns",
      "controlPoints",
      "waves",
    ],
    properties: {
      engagement: { type: "string" },
      client: { type: "string" },
      decisionHeadline: { type: "string" },
      currentStateFlow: {
        type: "array",
        items: CURRENT_STATE_FLOW_SCHEMA,
        description:
          "Ordered current-state operating flow: actors, trigger, systems, handoffs, decisions, manual work, bottlenecks, telemetry/control gaps, value leakage.",
      },
      gapsMap: {
        type: "array",
        items: OBSERVED_GAP_SCHEMA,
        description:
          "Current observation → gap → design implication. Must be grounded in the client context.",
      },
      gapToTargetBridge: {
        type: "array",
        items: GAP_BRIDGE_SCHEMA,
        description:
          "Explicit current observation → gap → design implication → target capability → architecture response chain.",
      },
      architectureLevels: {
        type: "object",
        required: ["conceptual", "logical", "physical"],
        properties: {
          conceptual: ARCH_LEVEL_SCHEMA,
          logical: ARCH_LEVEL_SCHEMA,
          physical: ARCH_LEVEL_SCHEMA,
        },
      },
      exhibitPlan: {
        type: "array",
        items: EXHIBIT_PLAN_SCHEMA,
        description:
          "All 13 required exhibits, each with a so-what and decision implication.",
      },
      decisionLog: { type: "array", items: DECISION_SCHEMA },
      provenanceNote: {
        type: "string",
        description:
          "Where the cloud/service choices came from (the solution).",
      },
      current: STATE_SCHEMA,
      target: STATE_SCHEMA,
      agentic: {
        type: "array",
        items: {
          type: "object",
          required: ["agentId", "role", "callsTools"],
          properties: {
            agentId: {
              type: "string",
              description: "a target 'agent' node id",
            },
            role: { type: "string" },
            callsTools: { type: "array", items: { type: "string" } },
            grounding: { type: "array", items: { type: "string" } },
            guardrails: { type: "array", items: { type: "string" } },
            humanInLoop: { type: "string" },
          },
        },
      },
      patterns: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "name", "appliesTo", "implication"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            appliesTo: { type: "array", items: { type: "string" } },
            implication: { type: "string" },
          },
        },
      },
      controlPoints: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "label", "what"],
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            what: { type: "string" },
            owner: { type: "string" },
          },
        },
      },
      waves: {
        type: "array",
        items: {
          type: "object",
          required: ["id", "label", "scope", "outcome"],
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            window: { type: "string" },
            scope: { type: "array", items: { type: "string" } },
            outcome: { type: "string" },
          },
        },
      },
      openInputs: { type: "array", items: { type: "string" } },
    },
  },
} as const;

export const ARCHITECTURE_SYSTEM_PROMPT = `You are a principal enterprise architect at a top-tier consulting firm.
You produce board-grade target architectures grounded in the client's ACTUAL estate.

Rules:
- The APPROVED SOLUTION APPROACH block is authoritative. Preserve its decision id, version, hash,
  selected option, boundaries, tradeoffs, and exclusions. Never reopen, blend, or silently replace it.
- Tell a coherent client story. The artifact must read like an architecture lead walking an executive
  through the decision: current operating pain → root cause in the current flow → target decision
  system → what changes in the work → human/AI controls → implementation waves → decision still
  needed. Do not emit a bundle of standalone sections, disconnected diagrams, or generic architecture
  inventory.
- Anchor the story in appropriate executive frameworks: current-state journey/value-stream, SWOT or
  strengths-gaps-risks-opportunities where useful, MECE issue tree/root-cause frame, option decision
  matrix, capability map, human/AI decision-rights matrix, risk-control matrix, and implementation
  wave map. Use these as lenses to make the client's decision clearer; do not write generic framework
  explanations.
- Follow this traceability chain for every target component: approved option → current-state evidence →
  diagnosed gap → design implication → target capability → architecture component → control → metric.
- Stop without emitting a model when the approved option is absent, ambiguous, internally inconsistent,
  or contradicted by evidence in a way that would change the decision. Surface the conflict as an unresolved
  decision; do not manufacture a generic fallback architecture.
- Unknown client facts belong in openInputs. They may not be converted into asserted products, volumes,
  integration contracts, security controls, estimates, or implementation commitments.
- Cloud provider and named services come from the solution YOU reason for this client and this use
  case — never a generic default. Use the providers/services implied by the client's stated target
  platform and systems of record. State that lineage in provenanceNote.
- Emit ArchitectureModel v2: currentStateFlow, gapsMap, gapToTargetBridge, conceptual/logical/physical
  architecture levels, all 13 exhibitPlan items, and an architecture decision log.
- The exhibitPlan is the storyline map. Every exhibit must have a soWhat and decisionImplication
  that explain why the visual changes the reader's decision; no decorative or merely illustrative
  diagrams.
- The currentStateFlow must show actors/teams, triggering event, systems, data sources, handoffs,
  decisions, manual work, delays/bottlenecks, missing telemetry/control gaps, and value leakage where
  the context supports them.
- Every gap must bridge to a target capability and an architecture response. Do not jump from current
  state to target state without the reasoning chain.
- Keep diagram labels executive-readable and architecture-grade: concise nouns, named control points,
  real operating roles, bounded systems, and visible trust boundaries. Avoid tiny prose boxes,
  low-value labels, repeated generic "layer" language, and implementation ids.
- Conceptual architecture = business capabilities and human/AI/context/integration/governance/value
  layers. Logical architecture = components, services, interactions, data flows, decision points.
  Physical architecture = cloud/environment, tenant boundary, runtime, stores, endpoints, identity,
  logging, model boundary, security, and deployment waves.
- Model the CURRENT state (as-is) honestly from the client's existing systems, and the TARGET state
  (to-be) as the designed future. Mark target nodes new/changed/existing.
- Data flow (kind=data) is DISTINCT from AI decision/control flow (kind=control). Include event and
  human_approval flows where they belong.
- Provide an agentic overlay: which agents call which tools, what grounds them, what guards them,
  where a human approves.
- Every agentic overlay item must use an agentId that is also declared in target.nodes as a node
  with kind="agent" and layer="agentic". Do not create an agent binding without the target node.
- Flows must reference node ids that exist. Keep ids short and stable.
- Do not fabricate volumes or financials; put unknown operating facts in openInputs.
Call emit_architecture_model exactly once with the complete structured model.`;

export interface ArchitectureGenRequest {
  engagement: string;
  client: string;
  /** Grounding context assembled from the TENANT'S OWN governed context. */
  contextText: string;
  model?: string;
  maxTokens?: number;
}

export interface GovernedToolDefinition {
  name: string;
  description: string;
  input_schema: unknown;
}

/**
 * The governed model call, INJECTED by the caller. Production wires this to the
 * egress governance (tenant policy + preflight + audit); tests pass a fake.
 * Returns the tool-use input (the raw structured model) and the resolved model id.
 */
export type GovernedToolCall = (params: {
  system: string;
  userMessage: string;
  tool: GovernedToolDefinition;
  model: string;
  maxTokens: number;
}) => Promise<{
  toolInput: unknown;
  modelId: string;
  stopReason?: string | null;
  outputTokens?: number;
}>;

export interface GeneratedArchitecture {
  model: ArchitectureModel;
  issues: ArchValidationIssue[];
  modelId: string;
}

export function buildArchitectureUserMessage(
  req: ArchitectureGenRequest,
): string {
  return (
    `Engagement: ${req.engagement}\nClient: ${req.client}\n\n` +
    `Client context and use-case brief:\n${req.contextText}\n\n` +
    `Produce a story-led current-state and target-state architecture for this engagement. ` +
    `The output should feel like a polished executive architecture packet: each visual advances ` +
    `the narrative and each section prepares the next decision.`
  );
}

function labelFromAgentBinding(agentId: string, role: string): string {
  const candidate = role.replace(/\s+/g, " ").replace(/\.$/, "").trim();
  if (candidate) {
    return candidate.length > 72
      ? `${candidate.slice(0, 69).trim()}...`
      : candidate;
  }
  return agentId
    .replace(/^agt[-_]/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeGeneratedArchitectureModel(
  model: ArchitectureModel,
): ArchitectureModel {
  const targetNodes = Array.isArray(model.target?.nodes)
    ? [...model.target.nodes]
    : [];
  const targetIds = new Set(targetNodes.map((n) => n.id));
  let added = false;

  for (const binding of model.agentic ?? []) {
    if (!binding?.agentId || targetIds.has(binding.agentId)) {
      continue;
    }
    targetNodes.push({
      id: binding.agentId,
      label: labelFromAgentBinding(binding.agentId, binding.role),
      kind: "agent",
      layer: "agentic",
      status: "new",
      note: binding.role,
    });
    targetIds.add(binding.agentId);
    added = true;
  }

  if (!added) {
    return model;
  }

  return {
    ...model,
    target: {
      ...model.target,
      nodes: targetNodes,
    },
  };
}

/**
 * Generate a validated ArchitectureModel through the injected governed call.
 * Pure orchestration — identical for every tenant and use case.
 */
export async function generateArchitectureModel(
  req: ArchitectureGenRequest,
  call: GovernedToolCall,
): Promise<GeneratedArchitecture> {
  const model = req.model ?? DEFAULT_ARCHITECTURE_MODEL;
  const maxTokens = req.maxTokens ?? 32_000;
  const { toolInput, modelId, stopReason, outputTokens } = await call({
    system: ARCHITECTURE_SYSTEM_PROMPT,
    userMessage: buildArchitectureUserMessage(req),
    tool: ARCHITECTURE_TOOL,
    model,
    maxTokens,
  });
  if (stopReason === "max_tokens") {
    throw new Error(
      `Architecture generation was truncated at the ${maxTokens}-token output limit` +
        `${typeof outputTokens === "number" ? ` after ${outputTokens} output tokens` : ""}.`,
    );
  }
  if (!toolInput || typeof toolInput !== "object") {
    throw new Error("Architecture generation returned no structured model.");
  }
  const archModel = normalizeGeneratedArchitectureModel(
    toolInput as ArchitectureModel,
  );
  const issues = validateArchitectureModel(archModel);
  if (issues.some((i) => i.level === "error")) {
    throw new Error(
      `Generated architecture failed validation: ${issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
  return { model: archModel, issues, modelId };
}
