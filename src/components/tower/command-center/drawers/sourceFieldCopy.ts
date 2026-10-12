/** Presentation labels for source-declared context. The source value remains visible in the drawer. */
const PROGRAM_STATUS: Record<string, string> = {
  active: "Active",
  at_risk: "At risk",
  complete: "Completed",
  execution_delayed: "Delivery delayed",
  hold_until_evidence: "On hold until evidence is available",
  not_started: "Not started",
  on_track: "On track",
  planned: "Planned",
  planning: "In planning",
  prove_value: "Needs proof of value",
  scale_candidate: "Candidate for wider rollout",
  watch: "Needs watching",
};

const PROGRAM_PHASE: Record<string, string> = {
  build: "Being built",
  candidate: "Candidate",
  charter: "Scope being defined",
  charter_approved: "Scope approved",
  control_ready: "Controls ready",
  data_ready: "Data ready",
  delivery: "Delivery underway",
  design: "Being designed",
  discovery: "Being explored",
  execute: "Delivery underway",
  execution: "Delivery underway",
  ideate: "Idea being explored",
  in_flight: "Work underway",
  mobilize: "Getting started",
  model_validated: "Model validation recorded",
  pilot: "In pilot",
  pilot_exit: "Pilot review",
  pilot_live: "Pilot in use",
  planned: "Planned",
  planning: "In planning",
  production: "In use",
  retired: "Retired",
  scale: "Wider rollout",
  scale_decision: "Decision on wider rollout",
  scale_gate: "Wider rollout review",
  stabilization: "Being stabilized",
};

const AI_CASE_STATUS: Record<string, string> = {
  evaluation: "Being evaluated",
  paused_pending_governance_review: "Paused while controls are reviewed",
  pilot: "In pilot",
  pilot_day1_telemetry: "Pilot started; initial measurements being collected",
  pilot_multi_facility: "Pilot across several sites",
  pilot_single_facility: "Pilot at one site",
  pilot_single_hub: "Pilot at one hub",
  planned_not_started: "Planned; work has not started",
  production_enterprise_wide: "In use across the organization",
  production_limited_intents: "In use for limited tasks",
  production_partial: "In use in part of the organization",
  production_partial_fleet: "In use on part of the fleet",
  target_state_pending_cdp: "Target setup waiting on a named dependency",
};

const BENEFIT_KIND: Record<string, string> = {
  cost_productivity_or_cycle_time: "May lower cost, free staff time, or speed up work",
  revenue_uplift_or_experience: "May improve revenue or customer experience",
  yield_leakage_or_regulatory_exposure: "May reduce lost value or regulatory risk",
  time_savings: "May save staff time",
  cost_avoidance: "May avoid future costs",
};

const LABELS = {
  programStatus: PROGRAM_STATUS,
  programPhase: PROGRAM_PHASE,
  aiCaseStatus: AI_CASE_STATUS,
  benefitKind: BENEFIT_KIND,
} as const;

export type SourceFieldKind = keyof typeof LABELS;

export function sourceFieldLabel(kind: SourceFieldKind, raw: string): string {
  const sourceValue = raw.trim();
  const key = sourceValue.toLowerCase().replace(/[\s-]+/g, "_");
  const known = LABELS[kind] as Record<string, string>;
  if (known[key]) return known[key];
  const readable = sourceValue.replace(/_/g, " ").replace(/\s+/g, " ");
  return readable ? readable.charAt(0).toUpperCase() + readable.slice(1) : "Not recorded";
}

export function sourceFieldNote(raw: string, context?: string): string {
  return `Recorded in intake as “${raw}”.${context ? ` ${context}` : ""}`;
}
