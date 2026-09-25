export type SourceReadModelContractField =
  | "canonicalInputs"
  | "keys"
  | "asOf"
  | "reconciliationEquation"
  | "denominator"
  | "tenantFence"
  | "oppositeTenantQuery"
  | "freshnessSla"
  | "owner"
  | "projectionTrigger"
  | "staleBehavior"
  | "fieldAuthority"
  | "buildJob";

export interface SourceReadModelDefinition {
  id: string;
  state: "proposed";
  grain: string;
  consumingSurface: string;
  canonicalInputs?: readonly string[];
  keys?: readonly string[];
  asOf?: string;
  reconciliationEquation?: string;
  denominator?: string;
  tenantFence?: string;
  oppositeTenantQuery?: string;
  freshnessSla?: string;
  owner?: string;
  projectionTrigger?: string;
  staleBehavior?: string;
  fieldAuthority?: string;
  buildJob?: string;
}

// These are proposed grains and consumers, not deployed read models or approved build contracts.
export const SOURCE_READ_MODEL_INVENTORY: readonly SourceReadModelDefinition[] = [
  { id: "event_queue_v1", grain: "tenant + event", consumingSurface: "Requests and active Events", state: "proposed" },
  { id: "event_gate_v1", grain: "event + applicable stage", consumingSurface: "Progress and next action", state: "proposed" },
  { id: "event_artifact_index_v1", grain: "event + artifact version", consumingSurface: "Files explorer", state: "proposed" },
  { id: "supplier_readiness_v1", grain: "event + supplier legal entity", consumingSurface: "Supplier readiness", state: "proposed" },
  { id: "response_coverage_v1", grain: "event + package version + supplier + question family", consumingSurface: "Response coverage", state: "proposed" },
  { id: "evaluation_compare_v1", grain: "event + supplier + frozen criterion", consumingSurface: "Evaluation comparison", state: "proposed" },
  { id: "pricing_compare_v1", grain: "event + supplier + scenario/period", consumingSurface: "Pricing comparison", state: "proposed" },
  { id: "bafo_movement_v1", grain: "event + supplier + round + comparison basis", consumingSurface: "BAFO movement", state: "proposed" },
  { id: "decision_packet_v1", grain: "event + frozen packet version", consumingSurface: "Executive decision", state: "proposed" },
  { id: "transition_readiness_v1", grain: "event + milestone", consumingSurface: "Transition readiness", state: "proposed" },
  { id: "event_value_v1", grain: "event + opportunity + reporting period", consumingSurface: "Value lifecycle", state: "proposed" },
  { id: "industry_context_v1", grain: "archetype + metric + observation/version", consumingSurface: "Industry context", state: "proposed" },
  { id: "ava_event_context_v1", grain: "tenant + event + accepted snapshot", consumingSurface: "aVa event context", state: "proposed" },
];

const requiredFields: readonly SourceReadModelContractField[] = [
  "canonicalInputs", "keys", "asOf", "reconciliationEquation", "denominator",
  "tenantFence", "oppositeTenantQuery", "freshnessSla", "owner",
  "projectionTrigger", "staleBehavior", "fieldAuthority", "buildJob",
];

export function assessSourceReadModelContract(
  definition: SourceReadModelDefinition,
): { metadataComplete: boolean; missing: SourceReadModelContractField[] } {
  const missing = requiredFields.filter((field) => {
    const value = definition[field];
    return Array.isArray(value)
      ? value.length === 0 || value.some((entry) => !entry.trim())
      : typeof value !== "string" || !value.trim();
  });
  return { metadataComplete: missing.length === 0, missing };
}
