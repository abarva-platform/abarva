// Moves — the 10 governed solution building blocks (industry-agnostic).
// These are reusable solution *lanes*, NOT archetype labels. See
// docs/build/moves-design/MOVES_SOLUTION_BUILDING_BLOCKS.md. Do not add new
// top-level blocks; use subtypes if more detail is needed.

export const BUILDING_BLOCK_KEYS = [
  'process_redesign',
  'data_readiness',
  'knowledge_retrieval_copilot',
  'ai_assisted_decision_support',
  'workflow_automation',
  'human_in_loop_agent',
  'analytics_intelligence_layer',
  'system_platform_implementation',
  'controls_governance_risk',
  'value_tracking_operating_cadence',
] as const;

export type BuildingBlockKey = (typeof BUILDING_BLOCK_KEYS)[number];

/** Client-friendly labels — never expose the raw keys in the UI. */
export const BUILDING_BLOCK_LABELS: Record<BuildingBlockKey, string> = {
  process_redesign: 'Process redesign',
  data_readiness: 'Data readiness / remediation',
  knowledge_retrieval_copilot: 'Knowledge / retrieval copilot',
  ai_assisted_decision_support: 'AI-assisted decision support',
  workflow_automation: 'Workflow automation',
  human_in_loop_agent: 'Human-in-the-loop agent',
  analytics_intelligence_layer: 'Analytics / intelligence layer',
  system_platform_implementation: 'System / platform implementation',
  controls_governance_risk: 'Controls / governance / risk model',
  value_tracking_operating_cadence: 'Value tracking / operating cadence',
};

export function isBuildingBlockKey(x: string): x is BuildingBlockKey {
  return (BUILDING_BLOCK_KEYS as readonly string[]).includes(x);
}

export function buildingBlockLabel(key: BuildingBlockKey): string {
  return BUILDING_BLOCK_LABELS[key];
}
