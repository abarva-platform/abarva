/**
 * Controlled vocabulary for AI spend attribution.
 *
 * Without a closed taxonomy, cost reports fragment into dozens of nearly
 * equivalent labels ("tower_answer", "towerAnswer", "tower-answer-v2") and the
 * "top 5 workloads by spend" exhibit becomes meaningless. Every model call
 * recorded in `ai_egress_audit` must carry a value from AI_WORKLOADS, and the
 * daily rollup in `ai_cost_daily` inherits it.
 *
 * Adding a workload is a deliberate act: add it here, and the rollup picks it
 * up. Do NOT pass a free-text string at a call site.
 */

/** Economic lane. Maps to a dedicated provider API key so the Admin API can
 *  attribute spend without relying on our own instrumentation being complete. */
export const AI_KEY_LANES = [
  "prod-realtime", // Intelligence + Tower production answers
  "offline-generation", // Home packs, Moves deliverables, Source artifacts
  "qa-evaluation", // pressure tests and graders
  "engineering-scripts", // ad hoc repository and operator scripts
] as const;
export type AiKeyLane = (typeof AI_KEY_LANES)[number];

/** Product surface that initiated the call. */
export const AI_MODULES = [
  "intelligence",
  "tower",
  "home",
  "moves",
  "source",
  "qa",
  "eval",
  "platform",
] as const;
export type AiModule = (typeof AI_MODULES)[number];

/**
 * The unit of economic analysis. Granular enough that a routing decision can be
 * made per entry — if two workloads would always be routed identically, they
 * should be one workload.
 */
export const AI_WORKLOADS = {
  intelligence_answer: { module: "intelligence", lane: "prod-realtime" },
  intelligence_followups: { module: "intelligence", lane: "prod-realtime" },
  intelligence_export: { module: "intelligence", lane: "prod-realtime" },

  tower_answer: { module: "tower", lane: "prod-realtime" },
  tower_visual_contract: { module: "tower", lane: "prod-realtime" },
  tower_export: { module: "tower", lane: "prod-realtime" },

  home_pack_narrative: { module: "home", lane: "offline-generation" },
  home_dimension_story: { module: "home", lane: "offline-generation" },
  home_visual_spec: { module: "home", lane: "offline-generation" },
  home_relationship_explanation: { module: "home", lane: "offline-generation" },

  moves_architecture: { module: "moves", lane: "offline-generation" },
  moves_business_case: { module: "moves", lane: "offline-generation" },
  moves_roadmap: { module: "moves", lane: "offline-generation" },
  moves_quality_review: { module: "moves", lane: "offline-generation" },

  source_rfp: { module: "source", lane: "offline-generation" },
  source_decision_brief: { module: "source", lane: "offline-generation" },
  source_quality_review: { module: "source", lane: "offline-generation" },

  qa_pressure_test: { module: "qa", lane: "qa-evaluation" },
  eval_grading: { module: "eval", lane: "qa-evaluation" },
  schema_repair: { module: "platform", lane: "prod-realtime" },
} as const satisfies Record<string, { module: AiModule; lane: AiKeyLane }>;

export type AiWorkload = keyof typeof AI_WORKLOADS;

export const AI_WORKLOAD_KEYS = Object.keys(AI_WORKLOADS) as AiWorkload[];

export function isAiWorkload(value: unknown): value is AiWorkload {
  return typeof value === "string" && value in AI_WORKLOADS;
}

export function moduleForWorkload(workload: AiWorkload): AiModule {
  return AI_WORKLOADS[workload].module;
}

export function laneForWorkload(workload: AiWorkload): AiKeyLane {
  return AI_WORKLOADS[workload].lane;
}

/**
 * Task shape — drives routing policy independently of which surface asked.
 * `structured_extraction` from Tower and from Source should route the same way.
 */
export const AI_TASK_TYPES = [
  "executive_synthesis", // long-form reasoning, frontier model
  "structured_extraction", // schema-constrained, cheap-model candidate
  "classification", // intent/routing, cheap-model candidate
  "narration", // deterministic data into prose, cheap-model candidate
  "grading", // eval judging, cheap-model candidate with escalation
  "repair", // schema/format fix on a failed prior call
] as const;
export type AiTaskType = (typeof AI_TASK_TYPES)[number];

/**
 * Task types whose historical validation rate makes them candidates for
 * shadow-testing a cheaper model. This is a hypothesis list, not a routing
 * decision — route only after a shadow run clears an acceptance threshold.
 */
export const CHEAP_MODEL_CANDIDATE_TASKS: readonly AiTaskType[] = [
  "structured_extraction",
  "classification",
  "narration",
  "grading",
];
