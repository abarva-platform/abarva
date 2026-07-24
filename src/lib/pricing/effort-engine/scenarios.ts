/**
 * Nexus Pricing Engine — PR4 scenarios (brief §7.9).
 *
 * `traditional | ai_accelerated | vendor_led | client_led | custom`.
 * AI acceleration is an explicit, per-activity, APPROVED assumption — the
 * default hours multiplier for every activity pack is `1.0` (no silent
 * productivity reduction or increase); only the specific activity packs
 * named in `AI_ACCELERATED_ACTIVITY_OVERRIDES` below change, each with a
 * disclosed rationale. This is a scenario-level OVERRIDE MAP applied to
 * specific activities, never a single global multiplier applied uniformly.
 */
import type { PricingAgentCostRow, ScenarioKey } from "./types";
import { dollarsToCents } from "./money";

export interface ScenarioActivityOverride {
  /** Multiplies this activity pack's expected module hours. Default (unlisted) is 1.0 — see file header. */
  hoursMultiplier: number;
  rationale: string;
}

export interface ScenarioDefinition {
  scenarioKey: ScenarioKey;
  /** Keyed by activity_pack_code. An activity pack not present here always gets the identity (1.0) factor. */
  activityOverrides: Readonly<Record<string, ScenarioActivityOverride>>;
}

/**
 * The approved AI-accelerated productivity assumptions for V1. Deliberately
 * narrow and specific — hand-authored, disclosed, and tagged
 * `hand-authored-pr4` in spirit (this is code, not a CSV row, but carries
 * the same honesty posture: directional planning assumptions, not a
 * researched benchmark, expected to be tuned against real delivery data).
 */
const AI_ACCELERATED_ACTIVITY_OVERRIDES: Readonly<Record<string, ScenarioActivityOverride>> = {
  "AP-TECH-AI-02": { hoursMultiplier: 0.75, rationale: "AI-assisted code generation approved for GenAI/agent build tasks." },
  "AP-TECH-DATA-02": { hoursMultiplier: 0.8, rationale: "AI-assisted pipeline authoring/testing approved for data-engineering build." },
  "AP-TECH-APP-02": { hoursMultiplier: 0.8, rationale: "AI coding-assistant adoption approved for backend/API engineering build." },
  "AP-TECH-APP-03": { hoursMultiplier: 0.85, rationale: "AI coding-assistant adoption approved for frontend engineering build." },
  "AP-TECH-APP-05": { hoursMultiplier: 0.7, rationale: "AI-assisted test-case generation approved for quality engineering." },
  "AP-TECH-LEGACY-02": { hoursMultiplier: 0.75, rationale: "AI-assisted COBOL-to-target-language translation approved for batch engineering." },
};

const SCENARIO_DEFINITIONS: Readonly<Record<ScenarioKey, ScenarioDefinition>> = {
  traditional: { scenarioKey: "traditional", activityOverrides: {} },
  ai_accelerated: { scenarioKey: "ai_accelerated", activityOverrides: AI_ACCELERATED_ACTIVITY_OVERRIDES },
  vendor_led: { scenarioKey: "vendor_led", activityOverrides: {} },
  client_led: { scenarioKey: "client_led", activityOverrides: {} },
  custom: { scenarioKey: "custom", activityOverrides: {} },
};

/**
 * Resolve the scenario definition for `scenarioKey`. `custom` MUST be
 * accompanied by a caller-supplied `customOverrides` map (this engine never
 * invents a "custom" assumption on its own) — every other scenario key
 * ignores `customOverrides`.
 */
export function getScenarioDefinition(
  scenarioKey: ScenarioKey,
  customOverrides?: Readonly<Record<string, ScenarioActivityOverride>>,
): ScenarioDefinition {
  if (scenarioKey === "custom") {
    return { scenarioKey: "custom", activityOverrides: customOverrides ?? {} };
  }
  return SCENARIO_DEFINITIONS[scenarioKey];
}

export function scenarioHoursMultiplier(definition: ScenarioDefinition, activityPackCode: string): { factor: number; rationale: string | null } {
  const override = definition.activityOverrides[activityPackCode];
  return override ? { factor: override.hoursMultiplier, rationale: override.rationale } : { factor: 1, rationale: null };
}

export interface ScenarioAddedCostLine {
  agentCostCode: string;
  costKey: string;
  costCents: number;
  unit: string;
  rationale: string;
}

/**
 * AI-accelerated scenario ADDS the explicit platform/compute cost lines from
 * `pricing_agent_costs` applicable to this archetype (matching
 * `applies_to_archetype_code = archetypeCode` OR a null/broadly-applicable
 * row) — never netted silently against the labor-hours reduction above.
 * Every other scenario adds nothing.
 */
export function selectAgentCostLinesForScenario(
  scenarioKey: ScenarioKey,
  archetypeCode: string,
  agentCosts: readonly PricingAgentCostRow[],
): ScenarioAddedCostLine[] {
  if (scenarioKey !== "ai_accelerated") return [];
  return agentCosts
    .filter((c) => c.applies_to_archetype_code === null || c.applies_to_archetype_code === archetypeCode)
    .map((c) => ({
      agentCostCode: c.agent_cost_code,
      costKey: c.cost_key,
      costCents: dollarsToCents(c.cost_value),
      unit: c.unit,
      rationale: c.description ?? `AI-accelerated scenario cost assumption '${c.cost_key}'.`,
    }));
}
