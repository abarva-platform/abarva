// Moves — governed phase-template catalog.
// >=20 templates across P2..Tower. Each maps sections to building-block lanes and
// declares the next-phase Inputs Pack items it contributes to. Content is
// deterministic (data, not prose); Claude assembles patterns FROM this, it does
// not invent the catalog.

import type { BuildingBlockKey } from './building-blocks';
import type {
  MovePhaseTemplateDefinition,
  ParsedOutputType,
  TemplateSection,
} from './types';

const sec = (
  section: string,
  mappedBlocks: BuildingBlockKey[],
  parsedOutputs: ParsedOutputType[],
): TemplateSection => ({ section, mappedBlocks, parsedOutputs });

function derive(
  d: Omit<MovePhaseTemplateDefinition, 'parsedOutputTypes' | 'optionalSections'> & {
    optionalSections?: TemplateSection[];
  },
): MovePhaseTemplateDefinition {
  const optionalSections = d.optionalSections ?? [];
  const parsedOutputTypes = Array.from(
    new Set([...d.requiredSections, ...optionalSections].flatMap((s) => s.parsedOutputs)),
  );
  return { ...d, optionalSections, parsedOutputTypes };
}

export const PHASE_TEMPLATE_CATALOG: MovePhaseTemplateDefinition[] = [
  // ─────────────── P2 — Understand Current State ───────────────
  derive({
    templateId: 'p2_current_state_interview_guide',
    phase: 'P2',
    label: 'Current-State Interview Guide',
    clientPurpose: 'Run structured interviews to capture how the work happens today and where it breaks.',
    recommendedAudience: ['Business sponsor', 'Legal Operations Lead', 'Business process owner'],
    recommendedSessionType: 'interview',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'human_in_loop_agent', 'controls_governance_risk'],
    requiredSections: [
      sec('How work enters and is triaged', ['process_redesign'], ['process_map', 'current_state_finding']),
      sec('Where work waits and gets approved', ['process_redesign', 'human_in_loop_agent'], ['process_map', 'current_state_finding']),
      sec('Exceptions and escalations', ['process_redesign', 'controls_governance_risk'], ['current_state_finding', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['currentWorkflowWithPainPoints', 'humanApprovalCheckpoints'],
    sampleQuestions: ['Where does a request enter?', 'Who approves, and when?', 'Where do exceptions happen?'],
    examplesByUseCase: {
      lakeshore_legal: 'Contract requests arrive by email, form, and shared folder; triage is manual and inconsistent.',
      healthcare_provider: 'Prior-auth requests arrive across fax, portal, and phone with inconsistent intake.',
    },
  }),
  derive({
    templateId: 'p2_process_walkthrough',
    phase: 'P2',
    label: 'Process Walkthrough Template',
    clientPurpose: 'Map the end-to-end current-state workflow with handoffs and cycle time.',
    recommendedAudience: ['Business process owner', 'Legal Operations Lead'],
    recommendedSessionType: 'workshop',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'workflow_automation'],
    requiredSections: [
      sec('Workflow stages and handoffs', ['process_redesign', 'workflow_automation'], ['process_map', 'current_state_finding']),
      sec('Cycle time and queue points', ['process_redesign', 'value_tracking_operating_cadence'], ['baseline_metric']),
    ],
    nextPhaseInputsCreated: ['currentWorkflowWithPainPoints', 'towerMetricCandidates'],
    sampleQuestions: ['What are the stages from intake to close?', 'Where does work queue and age?'],
    examplesByUseCase: {
      lakeshore_legal: 'Average review cycle time is 31.6 days with a P90 of 52 days.',
    },
  }),
  derive({
    templateId: 'p2_systems_data_inventory',
    phase: 'P2',
    label: 'Systems and Data Inventory Template',
    clientPurpose: 'Inventory the systems and data involved, and identify the system of record.',
    recommendedAudience: ['IT / CLM owner', 'Data owner'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['data_readiness', 'system_platform_implementation'],
    requiredSections: [
      sec('Systems in scope', ['system_platform_implementation'], ['systems_inventory', 'current_state_finding']),
      sec('Required data fields and gaps', ['data_readiness'], ['data_gap', 'current_state_finding']),
      sec('Source of truth and ownership', ['data_readiness', 'controls_governance_risk'], ['data_gap', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['requiredFieldContract', 'controlBoundaries'],
    sampleQuestions: ['Which fields are missing?', 'Which system is the source of truth?', 'Who owns data quality?'],
    examplesByUseCase: {
      lakeshore_legal: '81.5% of requests arrive missing at least one required intake field; obligation ownership is unreliable.',
      healthcare_provider: 'Claims, EMR, and pharmacy data are fragmented; member identity does not resolve cleanly.',
    },
  }),
  derive({
    templateId: 'p2_pain_root_cause_summary',
    phase: 'P2',
    label: 'Pain-Point and Root-Cause Workshop Summary',
    clientPurpose: 'Synthesize pain points into root-cause candidates the solution must address.',
    recommendedAudience: ['Business sponsor', 'Legal Operations Lead', 'Business process owner'],
    recommendedSessionType: 'workshop',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'data_readiness', 'human_in_loop_agent'],
    requiredSections: [
      sec('Pain points by stage', ['process_redesign'], ['current_state_finding']),
      sec('Root-cause candidates', ['process_redesign', 'data_readiness'], ['root_cause']),
      sec('Open questions', ['process_redesign'], ['current_state_finding']),
    ],
    nextPhaseInputsCreated: ['openQuestionsForSolutionDesign', 'currentWorkflowWithPainPoints'],
    sampleQuestions: ['What is the real root cause, not the symptom?', 'What is out of scope?'],
    examplesByUseCase: {
      lakeshore_legal: 'Root cause is incomplete intake and inconsistent triage — not attorney capacity.',
    },
  }),
  derive({
    templateId: 'p2_business_appetite_for_change',
    phase: 'P2',
    label: 'Business Appetite for Change Template',
    clientPurpose: 'Capture how much change and disruption the business is ready to absorb.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner'],
    recommendedSessionType: 'interview',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Appetite for workflow disruption', ['process_redesign'], ['change_appetite', 'current_state_finding']),
      sec('Value expectations and proof bar', ['value_tracking_operating_cadence'], ['value_assumption', 'change_appetite']),
    ],
    nextPhaseInputsCreated: ['towerMetricCandidates', 'openQuestionsForSolutionDesign'],
    sampleQuestions: ['How much change can the team absorb in phase one?', 'What proof do you need before scaling?'],
    examplesByUseCase: {
      lakeshore_legal: 'Phase one should minimize workflow disruption; hard savings require finance attestation.',
    },
  }),
  derive({
    templateId: 'p2_current_state_final_review',
    phase: 'P2',
    label: 'Current-State Final Review Template',
    clientPurpose: 'The client-reviewed, confirmed current-state view that P3 designs against.',
    recommendedAudience: ['Business sponsor', 'Legal / compliance reviewer'],
    recommendedSessionType: 'final_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'data_readiness', 'controls_governance_risk', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Confirmed current-state truth', ['process_redesign', 'data_readiness'], ['current_state_finding']),
      sec('Confirmed baselines', ['value_tracking_operating_cadence'], ['baseline_metric']),
      sec('Confirmed control boundaries', ['controls_governance_risk'], ['control_requirement']),
    ],
    nextPhaseInputsCreated: ['currentWorkflowWithPainPoints', 'requiredFieldContract', 'controlBoundaries', 'towerMetricCandidates', 'openQuestionsForSolutionDesign'],
    sampleQuestions: ['Do we agree on what is happening today and what is broken?'],
    examplesByUseCase: {
      lakeshore_legal: 'Client-confirmed: intake quality and handoffs are the constraint; attorney approval stays for non-standard terms.',
    },
  }),

  // ─────────────── P3 — Choose the Approach ───────────────
  derive({
    templateId: 'p3_solution_options_canvas',
    phase: 'P3',
    label: 'Solution Options Canvas',
    clientPurpose: 'Lay out 2–3 realistic solution options before committing to architecture.',
    recommendedAudience: ['Business sponsor', 'IT / CLM owner', 'Legal Operations Lead'],
    recommendedSessionType: 'workshop',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'ai_assisted_decision_support', 'workflow_automation', 'system_platform_implementation'],
    requiredSections: [
      sec('Option definitions', ['process_redesign', 'ai_assisted_decision_support'], ['solution_option']),
      sec('Fit to current-state findings', ['process_redesign'], ['solution_option']),
    ],
    nextPhaseInputsCreated: ['deferredOptions', 'architectureConstraints'],
    sampleQuestions: ['What are the practical options?', 'Which is realistic for phase one?'],
    examplesByUseCase: {
      lakeshore_legal: 'A: process-first cleanup · B: CLM-embedded assisted triage & obligation extraction · C: cross-system orchestration layer.',
    },
  }),
  derive({
    templateId: 'p3_tradeoff_matrix',
    phase: 'P3',
    label: 'Pros / Cons and Tradeoff Matrix',
    clientPurpose: 'Compare options on value, risk, readiness, and effort.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner', 'IT / CLM owner'],
    recommendedSessionType: 'decision_review',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['ai_assisted_decision_support', 'controls_governance_risk', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Tradeoffs by option', ['ai_assisted_decision_support'], ['tradeoff']),
      sec('Readiness impact', ['controls_governance_risk'], ['tradeoff', 'architecture_constraint']),
    ],
    nextPhaseInputsCreated: ['deferredOptions', 'valueAssumptionsToValidate'],
    sampleQuestions: ['What do we accept and give up with each option?'],
    examplesByUseCase: {
      lakeshore_legal: 'Option B balances speed, adoption, control, and measurable value; C is high integration risk before baseline proof.',
    },
  }),
  derive({
    templateId: 'p3_human_ai_work_split',
    phase: 'P3',
    label: 'Human + AI Work Split Template',
    clientPurpose: 'Define exactly what AI does versus what humans decide and approve.',
    recommendedAudience: ['Legal Operations Lead', 'Legal / compliance reviewer'],
    recommendedSessionType: 'working_session',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['human_in_loop_agent', 'ai_assisted_decision_support', 'controls_governance_risk'],
    requiredSections: [
      sec('What AI recommends', ['ai_assisted_decision_support'], ['human_ai_split']),
      sec('Where humans approve', ['human_in_loop_agent', 'controls_governance_risk'], ['human_ai_split', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['controlRequirements'],
    sampleQuestions: ['What can AI do alone?', 'Where must a human approve?'],
    examplesByUseCase: {
      lakeshore_legal: 'AI suggests risk tier and missing info; attorney approves non-standard terms. No autonomous approval.',
    },
  }),
  derive({
    templateId: 'p3_architecture_constraints',
    phase: 'P3',
    label: 'Architecture Constraints Template',
    clientPurpose: 'Capture the constraints the target architecture must respect.',
    recommendedAudience: ['IT / CLM owner', 'Information Security'],
    recommendedSessionType: 'working_session',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['system_platform_implementation', 'controls_governance_risk', 'data_readiness'],
    requiredSections: [
      sec('Systems and integration constraints', ['system_platform_implementation'], ['architecture_constraint']),
      sec('Security / privilege constraints', ['controls_governance_risk'], ['architecture_constraint', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['architectureConstraints', 'controlRequirements'],
    sampleQuestions: ['Can the current platform support this?', 'What must be fenced?'],
    examplesByUseCase: {
      lakeshore_legal: 'Embed in the existing CLM; preserve privilege and privacy boundaries; no new platform in phase one.',
    },
  }),
  derive({
    templateId: 'p3_controls_guardrails_checklist',
    phase: 'P3',
    label: 'Controls and Guardrails Checklist',
    clientPurpose: 'Confirm the control boundaries and guardrails the design must enforce.',
    recommendedAudience: ['Legal / compliance reviewer', 'Information Security'],
    recommendedSessionType: 'sme_review',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['controls_governance_risk', 'human_in_loop_agent'],
    requiredSections: [
      sec('Approval boundaries', ['controls_governance_risk', 'human_in_loop_agent'], ['control_requirement']),
      sec('Audit and privacy requirements', ['controls_governance_risk'], ['control_requirement']),
    ],
    nextPhaseInputsCreated: ['controlRequirements'],
    sampleQuestions: ['What must be approved?', 'What must be logged?', 'What cannot be automated?'],
    examplesByUseCase: {
      lakeshore_legal: 'Attorney approval required; full audit trail; privilege fence; no autonomous legal decisions.',
    },
  }),
  derive({
    templateId: 'p3_solution_approach_decision_summary',
    phase: 'P3',
    label: 'Solution Approach Decision Summary',
    clientPurpose: 'The client-reviewed decision: chosen approach, rationale, and what is deferred.',
    recommendedAudience: ['Business sponsor', 'Legal Operations Lead', 'Finance / value owner'],
    recommendedSessionType: 'decision_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['ai_assisted_decision_support', 'human_in_loop_agent', 'controls_governance_risk', 'workflow_automation'],
    requiredSections: [
      sec('Selected solution approach', ['ai_assisted_decision_support', 'workflow_automation'], ['selected_approach']),
      sec('Rejected / deferred options', ['ai_assisted_decision_support'], ['solution_option', 'tradeoff']),
      sec('Human + AI split and controls', ['human_in_loop_agent', 'controls_governance_risk'], ['human_ai_split', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['selectedSolutionApproach', 'deferredOptions', 'controlRequirements', 'workstreamCandidates'],
    sampleQuestions: ['Which solution approach should we use, and why?'],
    examplesByUseCase: {
      lakeshore_legal: 'Selected Option B (CLM-embedded assisted triage & obligation extraction). Deferred: autonomous review, orchestration layer.',
    },
  }),

  // ─────────────── P4 — Build the Plan ───────────────
  derive({
    templateId: 'p4_roadmap_workstream',
    phase: 'P4',
    label: 'Roadmap Workstream Template',
    clientPurpose: 'Convert the approved approach into sequenced workstreams.',
    recommendedAudience: ['Business sponsor', 'IT / CLM owner', 'Legal Operations Lead'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['process_redesign', 'data_readiness', 'workflow_automation', 'human_in_loop_agent', 'controls_governance_risk', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Workstreams by lane', ['process_redesign', 'workflow_automation'], ['workstream']),
      sec('Dependencies and sequence', ['system_platform_implementation'], ['workstream', 'risk']),
    ],
    nextPhaseInputsCreated: ['workstreams', 'dependencies'],
    sampleQuestions: ['What are the workstreams and their order?'],
    examplesByUseCase: {
      lakeshore_legal: 'Intake redesign · metadata remediation · CLM routing config · AI-assisted triage · controls · Tower metrics.',
    },
  }),
  derive({
    templateId: 'p4_cost_effort_assumptions',
    phase: 'P4',
    label: 'Cost and Effort Assumptions Template',
    clientPurpose: 'Capture cost/effort assumptions per workstream for the business case.',
    recommendedAudience: ['Finance / value owner', 'IT / CLM owner'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['system_platform_implementation', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Effort by workstream', ['system_platform_implementation'], ['workstream', 'value_assumption']),
      sec('Delivery model options', ['system_platform_implementation'], ['value_assumption']),
    ],
    nextPhaseInputsCreated: ['fundingAssumptions'],
    sampleQuestions: ['What is the phase-one cost range and delivery model?'],
    examplesByUseCase: {
      lakeshore_legal: 'Boutique-led hybrid $0.95–1.45M vs Big 4 $1.8–2.8M vs offshore-heavy $0.62–0.98M (control/adoption risk).',
    },
  }),
  derive({
    templateId: 'p4_value_assumptions_review',
    phase: 'P4',
    label: 'Value Assumptions Review Template',
    clientPurpose: 'Validate value assumptions with finance and separate directional from hard value.',
    recommendedAudience: ['Finance / value owner', 'Business sponsor'],
    recommendedSessionType: 'sme_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence', 'controls_governance_risk'],
    requiredSections: [
      sec('Value levers and proof level', ['value_tracking_operating_cadence'], ['value_assumption']),
      sec('Directional vs hard value', ['value_tracking_operating_cadence', 'controls_governance_risk'], ['value_assumption']),
    ],
    nextPhaseInputsCreated: ['fundingAssumptions'],
    sampleQuestions: ['Which value is directional and which is hard?', 'What must finance attest?'],
    examplesByUseCase: {
      lakeshore_legal: '8–12% cycle-time improvement (operational); hard dollar savings require finance evidence.',
    },
  }),
  derive({
    templateId: 'p4_risk_readiness_register',
    phase: 'P4',
    label: 'Risk and Readiness Register',
    clientPurpose: 'Record risks and readiness gaps that gate the plan.',
    recommendedAudience: ['IT / CLM owner', 'Legal / compliance reviewer'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['controls_governance_risk', 'data_readiness'],
    requiredSections: [
      sec('Risks and mitigations', ['controls_governance_risk'], ['risk']),
      sec('Readiness gaps', ['data_readiness', 'controls_governance_risk'], ['risk', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['risks', 'launchReadinessItems'],
    sampleQuestions: ['What must be true before we start?', 'What could go wrong?'],
    examplesByUseCase: {
      lakeshore_legal: 'Integration/privilege controls; requestor adoption; finance proof for hard savings.',
    },
  }),
  derive({
    templateId: 'p4_tower_metrics_definition',
    phase: 'P4',
    label: 'Tower Metrics Definition Template',
    clientPurpose: 'Define the metrics Tower will track, with baselines and targets.',
    recommendedAudience: ['Finance / value owner', 'Business sponsor'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence'],
    requiredSections: [
      sec('Metric definitions and baselines', ['value_tracking_operating_cadence'], ['tower_metric', 'baseline_metric']),
    ],
    nextPhaseInputsCreated: ['towerMetrics'],
    sampleQuestions: ['What metric proves value?', 'What is baseline and target?'],
    examplesByUseCase: {
      lakeshore_legal: 'Cycle time, intake completeness, aged queue, obligation capture, status inquiries.',
    },
  }),
  derive({
    templateId: 'p4_finance_sponsor_review_summary',
    phase: 'P4',
    label: 'Finance / Sponsor Review Summary',
    clientPurpose: 'The client-reviewed plan approval: what will be funded and how value is measured.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner'],
    recommendedSessionType: 'final_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence', 'controls_governance_risk'],
    requiredSections: [
      sec('Approved roadmap and funding', ['value_tracking_operating_cadence'], ['workstream', 'value_assumption']),
      sec('Approved measurement plan', ['value_tracking_operating_cadence'], ['tower_metric']),
    ],
    nextPhaseInputsCreated: ['fundingAssumptions', 'towerMetrics', 'launchReadinessItems'],
    sampleQuestions: ['What will we fund, when, and how will value be measured?'],
    examplesByUseCase: {
      lakeshore_legal: 'Approved 12-week boutique-led hybrid; Tower measures cycle time and obligation capture.',
    },
  }),

  // ─────────────── P5 — Prepare to Execute ───────────────
  derive({
    templateId: 'p5_raci_ownership',
    phase: 'P5',
    label: 'RACI and Ownership Template',
    clientPurpose: 'Assign an accountable owner to every workstream and lane.',
    recommendedAudience: ['Business sponsor', 'IT / CLM owner', 'Legal Operations Lead'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['process_redesign', 'data_readiness', 'workflow_automation', 'controls_governance_risk', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Owner per workstream', ['process_redesign'], ['owner_assignment']),
      sec('Approvers and reviewers', ['controls_governance_risk'], ['owner_assignment', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['metricOwners'],
    sampleQuestions: ['Who owns what?', 'Who approves?'],
    examplesByUseCase: {
      lakeshore_legal: 'Legal Ops → process; Data owner → remediation; IT → CLM; Legal → control approval; Tower owner → measurement.',
    },
  }),
  derive({
    templateId: 'p5_launch_readiness_checklist',
    phase: 'P5',
    label: 'Launch Readiness Checklist',
    clientPurpose: 'Confirm the move is ready to start.',
    recommendedAudience: ['IT / CLM owner', 'Legal / compliance reviewer'],
    recommendedSessionType: 'sme_review',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['system_platform_implementation', 'controls_governance_risk'],
    requiredSections: [
      sec('Readiness items and status', ['system_platform_implementation', 'controls_governance_risk'], ['launch_readiness_item']),
    ],
    nextPhaseInputsCreated: ['adoptionTracking'],
    sampleQuestions: ['Are we ready to start?', 'What is still open?'],
    examplesByUseCase: {
      lakeshore_legal: 'Obligation-owner matrix, controls, requestor training, and value metrics ready before mobilization.',
    },
  }),
  derive({
    templateId: 'p5_training_change_plan',
    phase: 'P5',
    label: 'Training and Change Plan Template',
    clientPurpose: 'Plan the training and change management for adoption.',
    recommendedAudience: ['Business process owner', 'Business sponsor'],
    recommendedSessionType: 'working_session',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'human_in_loop_agent'],
    requiredSections: [
      sec('Training plan by role', ['process_redesign'], ['launch_readiness_item']),
      sec('Change and adoption approach', ['process_redesign', 'human_in_loop_agent'], ['launch_readiness_item']),
    ],
    nextPhaseInputsCreated: ['adoptionTracking'],
    sampleQuestions: ['Who needs training?', 'How will we drive adoption?'],
    examplesByUseCase: {
      lakeshore_legal: 'Requestor guidance on complete intake; reviewer training on the confirmation step.',
    },
  }),
  derive({
    templateId: 'p5_approval_conditions',
    phase: 'P5',
    label: 'Approval Conditions Template',
    clientPurpose: 'Capture the conditions and approvals required to proceed.',
    recommendedAudience: ['Legal / compliance reviewer', 'Business sponsor'],
    recommendedSessionType: 'decision_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['controls_governance_risk'],
    requiredSections: [
      sec('Approval path and conditions', ['controls_governance_risk'], ['control_requirement', 'launch_readiness_item']),
    ],
    nextPhaseInputsCreated: ['escalationThresholds'],
    sampleQuestions: ['What approvals are needed to start?'],
    examplesByUseCase: {
      lakeshore_legal: 'Sponsor endorsement + Legal control sign-off; conditions on privilege handling.',
    },
  }),
  derive({
    templateId: 'p5_execution_handoff_review_summary',
    phase: 'P5',
    label: 'Execution Handoff Review Summary',
    clientPurpose: 'The client-reviewed mobilization plan handed to delivery and Tower.',
    recommendedAudience: ['Business sponsor', 'IT / CLM owner'],
    recommendedSessionType: 'final_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['process_redesign', 'controls_governance_risk', 'value_tracking_operating_cadence'],
    requiredSections: [
      sec('Confirmed owners and approvals', ['controls_governance_risk'], ['owner_assignment']),
      sec('Confirmed measurement handoff', ['value_tracking_operating_cadence'], ['measurement_contract_term']),
    ],
    nextPhaseInputsCreated: ['measurementContract', 'metricOwners', 'reviewCadence', 'adoptionTracking'],
    sampleQuestions: ['Who owns what, and are we ready to start?'],
    examplesByUseCase: {
      lakeshore_legal: 'Owners confirmed; Tower measurement contract accepted; ready to mobilize.',
    },
  }),

  // ─────────────── Tower — Track Outcomes ───────────────
  derive({
    templateId: 'tower_measurement_contract',
    phase: 'TOWER',
    label: 'Measurement Contract Template',
    clientPurpose: 'The agreed contract of what Tower measures and how value is proven.',
    recommendedAudience: ['Finance / value owner', 'Business sponsor'],
    recommendedSessionType: 'working_session',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence', 'controls_governance_risk'],
    requiredSections: [
      sec('Metric, baseline, target, formula', ['value_tracking_operating_cadence'], ['measurement_contract_term', 'tower_metric']),
    ],
    nextPhaseInputsCreated: ['measurementContract'],
    sampleQuestions: ['How will we know this worked?'],
    examplesByUseCase: {
      lakeshore_legal: 'Cycle time and obligation capture with baselines, targets, owners, and cadence.',
    },
  }),
  derive({
    templateId: 'tower_metric_owner_matrix',
    phase: 'TOWER',
    label: 'Metric Owner Matrix',
    clientPurpose: 'Assign an accountable owner to each Tower metric.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence'],
    requiredSections: [
      sec('Metric to owner', ['value_tracking_operating_cadence'], ['owner_assignment', 'tower_metric']),
    ],
    nextPhaseInputsCreated: ['metricOwners'],
    sampleQuestions: ['Who owns each metric?'],
    examplesByUseCase: {
      lakeshore_legal: 'Legal Ops owns cycle time; Data owner owns intake completeness; Finance owns hard-value attestation.',
    },
  }),
  derive({
    templateId: 'tower_outcome_review_cadence',
    phase: 'TOWER',
    label: 'Outcome Review Cadence Template',
    clientPurpose: 'Set the operating cadence for reviewing outcomes.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner'],
    recommendedSessionType: 'working_session',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence'],
    requiredSections: [
      sec('Cadence and participants', ['value_tracking_operating_cadence'], ['measurement_contract_term']),
    ],
    nextPhaseInputsCreated: ['reviewCadence'],
    sampleQuestions: ['How often do we review, and with whom?'],
    examplesByUseCase: {
      lakeshore_legal: 'Monthly value review with Legal Ops, Finance, and the sponsor.',
    },
  }),
  derive({
    templateId: 'tower_escalation_threshold',
    phase: 'TOWER',
    label: 'Escalation Threshold Template',
    clientPurpose: 'Define the thresholds that trigger escalation when value does not show up.',
    recommendedAudience: ['Business sponsor', 'Finance / value owner'],
    recommendedSessionType: 'working_session',
    fileFormat: 'XLSX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence', 'controls_governance_risk'],
    requiredSections: [
      sec('Thresholds and escalation path', ['value_tracking_operating_cadence', 'controls_governance_risk'], ['measurement_contract_term', 'control_requirement']),
    ],
    nextPhaseInputsCreated: ['escalationThresholds'],
    sampleQuestions: ['What if value does not show up?'],
    examplesByUseCase: {
      lakeshore_legal: 'Escalate if cycle time does not improve within two review cycles.',
    },
  }),
  derive({
    templateId: 'tower_value_realization_review',
    phase: 'TOWER',
    label: 'Value Realization Review Template',
    clientPurpose: 'Track realized value against the projection over time.',
    recommendedAudience: ['Finance / value owner', 'Business sponsor'],
    recommendedSessionType: 'final_review',
    fileFormat: 'DOCX',
    supportedBuildingBlocks: ['value_tracking_operating_cadence'],
    requiredSections: [
      sec('Realized vs projected value', ['value_tracking_operating_cadence'], ['tower_metric', 'measurement_contract_term']),
    ],
    nextPhaseInputsCreated: ['adoptionTracking'],
    sampleQuestions: ['What value did we actually realize?'],
    examplesByUseCase: {
      lakeshore_legal: 'Realized cycle-time reduction and obligation capture vs the P4 projection.',
    },
  }),
];

export const TEMPLATE_BY_ID: Record<string, MovePhaseTemplateDefinition> = Object.fromEntries(
  PHASE_TEMPLATE_CATALOG.map((t) => [t.templateId, t]),
);

export function templatesForPhase(phase: MovePhaseTemplateDefinition['phase']): MovePhaseTemplateDefinition[] {
  return PHASE_TEMPLATE_CATALOG.filter((t) => t.phase === phase);
}
