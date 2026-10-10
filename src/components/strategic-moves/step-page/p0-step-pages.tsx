import type { PhaseStepPageMap, StepPageHostProps } from "./phase-step-pages";
import { TextCaptureStep, type TextCaptureStepConfig } from "./TextCaptureStep";

const CONFIG: readonly TextCaptureStepConfig[] = [
  { view: "p0-signal", stepId: "P0.1", recordKey: "p0_signal_step", title: "Name the signal and problem", intro: "State why this Move is being opened and what problem Discovery must test.", ready: "The signal and problem are recorded. Continue to Scope boundary", fields: ["business_trigger", "problem_statement"] },
  { view: "p0-scope", stepId: "P0.2", recordKey: "p0_scope_step", title: "Draw the scope boundary", intro: "Name what this Move includes and excludes; the declared archetype is shown for context.", ready: "The scope boundary is recorded. Continue to Value hypothesis", fields: ["affected_function_process", "scope_out"], showArchetype: true },
  { view: "p0-value", stepId: "P0.3", recordKey: "p0_value_step", title: "State the value hypothesis", intro: "Capture the causal hypothesis and what Discovery will validate. Planning figures remain estimates with register references.", ready: "The value hypothesis is recorded. Continue to Owner and evidence", fields: ["initial_value_hypothesis", "outcomes_success", "discovery_questions"], planningFigures: true },
  { view: "p0-owner-evidence", stepId: "P0.4", recordKey: "p0_owner_evidence_step", title: "Name owners and evidence", intro: "Record role ownership, known evidence and gaps; review uploaded P0 source evidence before the gate.", ready: "Owners and evidence are recorded. Continue to Approve origination", fields: ["stakeholder_owner_view", "known_evidence", "missing_evidence_open_questions"], evidence: true },
];

export const P0_STEP_PAGES: PhaseStepPageMap = Object.fromEntries(CONFIG.map((config) => [
  config.view,
  (host: StepPageHostProps) => <TextCaptureStep host={host} config={config} />,
])) as PhaseStepPageMap;
