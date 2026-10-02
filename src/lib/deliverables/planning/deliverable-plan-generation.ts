import { deliverableModel } from "../model-policy";
import {
  validateDeliverablePlan,
  type DeliverablePlan,
  type PlanValidationIssue,
} from "./deliverable-plan";
import type { GovernedToolCall } from "@/lib/visual-system/architecture-generation";

export const DEFAULT_DELIVERABLE_PLAN_MODEL = deliverableModel();

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

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDeliverablePlan(
  value: unknown,
  req: DeliverablePlanGenRequest,
): DeliverablePlan {
  const plan = value as Partial<DeliverablePlan>;
  if (!text(plan.readerTakeaway)) {
    plan.readerTakeaway =
      text(plan.targetStateHypothesis) ||
      text(plan.storyline) ||
      `The reader can explain the ${req.client} current-to-target decision chain for ${req.initiative}.`;
  }
  return plan as DeliverablePlan;
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

/**
 * Output budget for the plan, and the one larger budget tried if the first is
 * exhausted.
 *
 * A plan cut off at the limit still arrives as a well-formed object: the
 * streaming client parses the partial tool input, so the fields emitted before
 * the cut are present and the later ones are simply absent. Validated as if it
 * were complete, that reads as "story spine has fewer than 3 beats" and "no
 * planned exhibits" — a verdict on the plan's reasoning, when the plan was
 * never finished. The stop reason is the only signal that distinguishes the
 * two, so it is checked before validation.
 */
export const DELIVERABLE_PLAN_MAX_TOKENS = 12_000;
export const DELIVERABLE_PLAN_RETRY_MAX_TOKENS = 24_000;

/**
 * Fields the plan cannot be judged without. `readerTakeaway` is absent from
 * the list because a missing one is repaired from the target hypothesis.
 */
const STRUCTURAL_PLAN_FIELDS = [
  "storyline",
  "currentStateInterpretation",
  "majorGaps",
  "targetStateHypothesis",
  "requiredDecisions",
  "requiredExhibits",
  "narrativeSequence",
] as const;

/** Structural fields the model never emitted — absent, not merely weak. */
export function missingPlanFields(toolInput: unknown): string[] {
  if (!toolInput || typeof toolInput !== "object") {
    return [...STRUCTURAL_PLAN_FIELDS];
  }
  const record = toolInput as Record<string, unknown>;
  return STRUCTURAL_PLAN_FIELDS.filter(
    (field) => record[field] === undefined || record[field] === null,
  );
}

function describeStop(result: {
  stopReason?: string | null;
  outputTokens?: number;
}): string {
  const reason = result.stopReason ?? "not reported";
  return typeof result.outputTokens === "number"
    ? `stop reason: ${reason}, ${result.outputTokens} output tokens`
    : `stop reason: ${reason}`;
}

/**
 * Generate and validate the plan.
 *
 * Two ways a response can be unfinished rather than wrong, both retried once:
 *
 * - It hit the output limit (`max_tokens`). Retried with a larger budget.
 * - It ended for any other reason with structural fields never emitted. The
 *   streaming client returns whatever was parsed before the end as a
 *   well-formed object, so an early end looks exactly like a plan with no
 *   target state, no decisions and no exhibits. The first version of this
 *   check recognised only `max_tokens`; a build then failed on a plan that
 *   stopped after two fields with a different stop reason, and the failure
 *   said nothing about why. Retried with the missing fields named.
 *
 * A response with every field present is validated as it stands and never
 * retried: a weak plan is a verdict, an unfinished one is not. Every failure
 * reports the stop reason, so the cause is in the run record.
 */
export async function generateDeliverablePlan(
  req: DeliverablePlanGenRequest,
  call: GovernedToolCall,
): Promise<GeneratedDeliverablePlan> {
  const model = req.model ?? DEFAULT_DELIVERABLE_PLAN_MODEL;
  const firstBudget = req.maxTokens ?? DELIVERABLE_PLAN_MAX_TOKENS;
  const request = (maxTokens: number, retryNote?: string) =>
    call({
      system: DELIVERABLE_PLAN_SYSTEM_PROMPT,
      userMessage: retryNote
        ? `${buildDeliverablePlanUserMessage(req)}\n\n${retryNote}`
        : buildDeliverablePlanUserMessage(req),
      tool: DELIVERABLE_PLAN_TOOL,
      model,
      maxTokens,
    });

  let result = await request(firstBudget);
  if (result.stopReason === "max_tokens") {
    const retryBudget = Math.max(
      firstBudget * 2,
      DELIVERABLE_PLAN_RETRY_MAX_TOKENS,
    );
    result = await request(retryBudget);
    if (result.stopReason === "max_tokens") {
      throw new Error(
        `Deliverable plan generation was cut off at the ${retryBudget}-token output limit` +
          ` after an earlier cut-off at ${firstBudget}; the plan is incomplete and was not validated.`,
      );
    }
  } else {
    const missing = missingPlanFields(result.toolInput);
    if (missing.length > 0) {
      const firstStop = describeStop(result);
      result = await request(
        firstBudget,
        `Your previous attempt ended before these required fields were emitted: ${missing.join(", ")}. ` +
          "Emit every required field of the plan in this call.",
      );
      const stillMissing = missingPlanFields(result.toolInput);
      if (stillMissing.length > 0) {
        throw new Error(
          `Deliverable plan generation ended early twice without required fields (${stillMissing.join(", ")}); ` +
            `first attempt ${firstStop}; second attempt ${describeStop(result)}. ` +
            "The plan is incomplete and was not validated.",
        );
      }
    }
  }
  const { toolInput, modelId } = result;
  if (!toolInput || typeof toolInput !== "object") {
    throw new Error("Deliverable plan generation returned no structured plan.");
  }
  const plan = normalizeDeliverablePlan(toolInput, req);
  const issues = validateDeliverablePlan(plan, {
    requireGapChain: req.requireGapChain === true,
  });
  if (issues.some((i) => i.level === "error")) {
    throw new Error(
      `Generated deliverable plan failed validation: ${issues
        .filter((i) => i.level === "error")
        .map((i) => i.message)
        .join("; ")} (${describeStop(result)})`,
    );
  }
  return { plan, issues, modelId };
}
