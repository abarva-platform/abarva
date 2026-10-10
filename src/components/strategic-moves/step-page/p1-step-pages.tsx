import type { PhaseStepPageMap, StepPageHostProps } from "./phase-step-pages";
import { TextCaptureStep, type TextCaptureStepConfig } from "./TextCaptureStep";

const CONFIG: readonly TextCaptureStepConfig[] = [
  {
    view: "p1-sponsor-scope",
    stepId: "P1.1",
    recordKey: "p1_sponsor_scope_step",
    title: "Name sponsor and scope",
    intro:
      "The sponsor answer is a progress contact. A sponsor participant role is checked separately.",
    ready:
      "The sponsor participant and scope are recorded. Continue to Stakeholders and decision rights",
    fields: ["sponsor_commitment", "scope_boundary"],
    sponsorCheck: true,
    charterBasis: true,
  },
  {
    view: "p1-stakeholders",
    stepId: "P1.2",
    recordKey: "p1_stakeholders_step",
    title: "Set decision rights",
    intro: "Name stakeholder roles and who decides at each gate.",
    ready:
      "Stakeholders and decision rights are recorded. Continue to Success measures",
    fields: ["stakeholder_map", "decision_rights"],
    charterBasis: true,
  },
  {
    view: "p1-success",
    stepId: "P1.3",
    recordKey: "p1_success_step",
    title: "Name success measures",
    intro:
      "State the measures Discovery must validate; this step does not claim a captured baseline.",
    ready:
      "Success measures are recorded. Continue to Evidence plan and change",
    fields: ["success_criteria"],
    planningFigures: true,
    charterBasis: true,
  },
  {
    view: "p1-evidence-change",
    stepId: "P1.4",
    recordKey: "p1_evidence_change_step",
    title: "Plan evidence and change",
    intro:
      "Record the next evidence to gather and the structured business change hypothesis. Declare each answer's charter basis.",
    ready:
      "The evidence plan and business change assessment are recorded. Continue to Charter and gate",
    fields: ["evidence_plan", "business_change_assessment"],
    charterBasis: true,
  },
];

export const P1_STEP_PAGES: PhaseStepPageMap = Object.fromEntries(
  CONFIG.map((config) => [
    config.view,
    (host: StepPageHostProps) => (
      <TextCaptureStep host={host} config={config} />
    ),
  ]),
) as PhaseStepPageMap;
