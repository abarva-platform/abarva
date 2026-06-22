import {
  validateDeliverablePlan,
  type DeliverablePlan,
  type PlanValidationIssue,
} from "./deliverable-plan";
import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";

export const DEFAULT_DELIVERABLE_PLAN_MODEL = "claude-opus-4-8";

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

const PLANNED_EXHIBIT_SCHEMA = {
  type: "object",
  required: ["exhibit", "purpose", "soWhat"],
  properties: {
    exhibit: { type: "string" },
    purpose: { type: "string" },
    soWhat: { type: "string" },
  },
} as const;

const STORY_BEAT_SCHEMA = {
  type: "object",
  required: ["id", "point"],
  properties: {
    id: { type: "string" },
    point: { type: "string" },
  },
} as const;

export const DELIVERABLE_PLAN_TOOL = {
  name: "emit_deliverable_plan",
  description:
    "Emit the reason-first DeliverablePlan for this client-facing artifact before any narrative or visual artifact is generated.",
  input_schema: {
    type: "object",
    required: [
      "artifactType",
      "audience",
      "decisionPurpose",
      "storyline",
      "currentStateInterpretation",
      "majorGaps",
      "targetStateHypothesis",
      "requiredDecisions",
      "requiredExhibits",
      "narrativeSequence",
      "evidenceNeeded",
      "missingInputs",
      "assumptions",
      "risks",
      "readerTakeaway",
    ],
    properties: {
      artifactType: { type: "string" },
      audience: { type: "string" },
      decisionPurpose: { type: "string" },
      storyline: { type: "string" },
      currentStateInterpretation: { type: "string" },
      majorGaps: { type: "array", items: OBSERVED_GAP_SCHEMA },
      targetStateHypothesis: { type: "string" },
      requiredDecisions: { type: "array", items: { type: "string" } },
      requiredExhibits: { type: "array", items: PLANNED_EXHIBIT_SCHEMA },
      narrativeSequence: { type: "array", items: STORY_BEAT_SCHEMA },
      evidenceNeeded: { type: "array", items: { type: "string" } },
      missingInputs: { type: "array", items: { type: "string" } },
      assumptions: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      readerTakeaway: { type: "string" },
    },
  },
} as const;

export const DELIVERABLE_PLAN_SYSTEM_PROMPT = `You are the planning director for a senior consulting deliverable.
You must emit the hidden reason-first plan before any artifact is written.

Rules:
- Ground the plan in the client's actual context. Do not create a generic section outline.
- State the decision the reader must make.
- For architecture artifacts, reason current state -> observed gap -> design implication -> target state.
- Every required exhibit must have a purpose and a so-what interpretation.
- Do not invent unsupported numbers. Put missing facts in missingInputs.
- Use client-facing judgment language, not system labels or raw ids.
Call emit_deliverable_plan exactly once with the complete structured plan.`;

export interface DeliverablePlanGenRequest {
  artifactType: string;
  audience: string;
  decisionPurpose: string;
  client: string;
  initiative: string;
  contextText: string;
  requireGapChain?: boolean;
  model?: string;
  maxTokens?: number;
}

export interface GeneratedDeliverablePlan {
  plan: DeliverablePlan;
  issues: PlanValidationIssue[];
  modelId: string;
}

export function buildDeliverablePlanUserMessage(
  req: DeliverablePlanGenRequest,
): string {
  return [
    `Client: ${req.client}`,
    `Initiative: ${req.initiative}`,
    `Artifact type: ${req.artifactType}`,
    `Audience: ${req.audience}`,
    `Decision purpose: ${req.decisionPurpose}`,
    "",
    "Governed context:",
    req.contextText,
    "",
    "Produce the reason-first deliverable plan.",
  ].join("\n");
}

export async function generateDeliverablePlan(
  req: DeliverablePlanGenRequest,
  call: GovernedToolCall,
): Promise<GeneratedDeliverablePlan> {
  const model = req.model ?? DEFAULT_DELIVERABLE_PLAN_MODEL;
  const { toolInput, modelId } = await call({
    system: DELIVERABLE_PLAN_SYSTEM_PROMPT,
    userMessage: buildDeliverablePlanUserMessage(req),
    tool: DELIVERABLE_PLAN_TOOL,
    model,
    maxTokens: req.maxTokens ?? 5000,
  });
  if (!toolInput || typeof toolInput !== "object") {
    throw new Error("Deliverable plan generation returned no structured plan.");
  }
  const plan = toolInput as DeliverablePlan;
  const issues = validateDeliverablePlan(plan, {
    requireGapChain: req.requireGapChain === true,
  });
  if (issues.some((i) => i.level === "error")) {
    throw new Error(
      `Generated deliverable plan failed validation: ${issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")}`,
    );
  }
  return { plan, issues, modelId };
}
