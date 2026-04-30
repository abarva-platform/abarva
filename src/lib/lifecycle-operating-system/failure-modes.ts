import type { FailureModeControl, FailureModeId } from './types';

export const FAILURE_MODE_CONTROLS: Record<FailureModeId, FailureModeControl> = {
  phantom_sponsor: {
    id: 'phantom_sponsor',
    label: 'Phantom sponsor',
    promise: 'The program cannot advance on enthusiasm without a named accountable owner.',
    detectionPrompt: 'Look for passive sponsor language, unnamed executives, or delegates with no decision rights.',
    preventionMove: 'Force a named sponsor, authority test, calendar commitment, and escalation path.',
  },
  unclear_decision_rights: {
    id: 'unclear_decision_rights',
    label: 'Unclear decision rights',
    promise: 'Every gate needs a visible decision owner and a known approval route.',
    detectionPrompt: 'Look for committees, steering groups, or business/IT ownership language without a final decider.',
    preventionMove: 'Capture who decides, who advises, who can block, and what artifact they sign.',
  },
  solution_before_problem: {
    id: 'solution_before_problem',
    label: 'Solution before problem',
    promise: 'The platform keeps teams from selecting a tool before the operating problem is proven.',
    detectionPrompt: 'Look for vendor, model, platform, or architecture decisions before pain, cohort, and outcome are stable.',
    preventionMove: 'Return to problem statement, workflow, user cohort, baseline, and kill criterion.',
  },
  evidence_free_progress: {
    id: 'evidence_free_progress',
    label: 'Evidence-free progress',
    promise: 'Narrative cannot substitute for uploaded, linked, or cited evidence.',
    detectionPrompt: 'Look for confident claims with no source artifact, meeting note, baseline, data pull, or decision record.',
    preventionMove: 'Ask for upload/link, classify the evidence, and map it to the gate criterion before advancing.',
  },
  data_readiness_blindspot: {
    id: 'data_readiness_blindspot',
    label: 'Data readiness blind spot',
    promise: 'AI work cannot outrun inventory, quality, access, lineage, and privacy readiness.',
    detectionPrompt: 'Look for use-case ambition without source systems, data owners, access constraints, or quality baseline.',
    preventionMove: 'Create the data readiness request and make missing data visible as a gate risk.',
  },
  integration_unknowns: {
    id: 'integration_unknowns',
    label: 'Integration unknowns',
    promise: 'Architecture and operating integration are surfaced before build commitments harden.',
    detectionPrompt: 'Look for build plans that omit upstream/downstream systems, APIs, controls, security, or handoffs.',
    preventionMove: 'Require integration map, dependency owner, cutover assumption, and validation approach.',
  },
  adoption_afterthought: {
    id: 'adoption_afterthought',
    label: 'Adoption afterthought',
    promise: 'Change, training, incentives, and operating ownership are not delayed until launch.',
    detectionPrompt: 'Look for delivery plans with no user cohort, adoption owner, enablement artifact, or behavior metric.',
    preventionMove: 'Add adoption plan, stakeholder commitments, readiness sessions, and activation measures.',
  },
  value_baseline_missing: {
    id: 'value_baseline_missing',
    label: 'Value baseline missing',
    promise: 'Claims of success need a starting baseline and a measurement path.',
    detectionPrompt: 'Look for ROI, productivity, quality, revenue, or cost claims without current-state measurement.',
    preventionMove: 'Capture baseline, target, owner, measurement cadence, and attribution caveat.',
  },
  commercial_or_vendor_opacity: {
    id: 'commercial_or_vendor_opacity',
    label: 'Commercial or vendor opacity',
    promise: 'Vendor, pricing, contract, and walkaway assumptions stay decision-visible.',
    detectionPrompt: 'Look for selection momentum without comparable pricing, clause exceptions, risk register, or walkaway alternative.',
    preventionMove: 'Normalize offers, expose exceptions, test walkaway credibility, and document tradeoffs.',
  },
  governance_and_risk_late: {
    id: 'governance_and_risk_late',
    label: 'Governance and risk late',
    promise: 'Security, legal, compliance, model risk, and audit do not arrive after the decision is already made.',
    detectionPrompt: 'Look for late-stage signoff surprises or missing risk owners in earlier phases.',
    preventionMove: 'Pull risk owners forward, bind controls to evidence, and make unresolved risks explicit at the gate.',
  },
};

export function getFailureModeControl(id: FailureModeId): FailureModeControl {
  return FAILURE_MODE_CONTROLS[id];
}
