import type { SourceStageKey } from './types';

export interface StageChoice {
  label: string;
  description: string;
  prompt: string;
}

export interface StageCanvasConfig {
  stageKey: SourceStageKey;
  stepNumber: number;
  leadAgent: 'Nexus' | 'Sentinel' | 'Steward' | 'Atlas';
  intent: string;
  exitCriteria: string[];
  choices: [StageChoice, StageChoice, StageChoice];
  artifactIds: string[];
}

const STAGE_CONFIGS: Record<SourceStageKey, StageCanvasConfig> = {
  strategy: {
    stageKey: 'strategy',
    stepNumber: 1,
    leadAgent: 'Nexus',
    intent:
      'Confirm why this event exists, who owns the decision, and what commercial outcome it must achieve. Strategy locks the event mandate before Scope can begin.',
    exitCriteria: [
      'Business trigger documented and sponsor-confirmed',
      'Decision owner named with approval authority stated',
      'IT category confirmed in-scope for Source',
      'Value target or savings floor established',
      'Baseline data owner identified',
    ],
    choices: [
      {
        label: 'Name the trigger and owner',
        description: 'Confirm what makes this sourcing necessary and who has authority to decide.',
        prompt:
          'What makes this sourcing event necessary right now, and who has the authority to make the final vendor decision? Give me the trigger and the decision owner.',
      },
      {
        label: 'Size the value case',
        description: 'Establish the commercial target Atlas and Sentinel need to frame the event.',
        prompt:
          'What is the commercial outcome this sourcing event must achieve? Give me the value target, savings floor, or cost-avoidance rationale in concrete terms.',
      },
      {
        label: 'Define IT scope',
        description: 'State which systems, platforms, or services are candidates for this event.',
        prompt:
          'Which IT systems, platforms, or services are in scope for this sourcing event, and what is explicitly excluded? Help me draw the boundary.',
      },
    ],
    artifactIds: ['strategy_memo', 'decision_authority_log', 'scope_boundary_draft'],
  },
  scope: {
    stageKey: 'scope',
    stepNumber: 2,
    leadAgent: 'Nexus',
    intent:
      'Define the exact boundary of what is being sourced, tier the applications or services, and confirm exclusions with sponsor sign-off. Scope memo must be signed before RFP drafting begins.',
    exitCriteria: [
      'Application or service inventory with tier classification',
      'In-scope / out-of-scope boundary confirmed by sponsor',
      'Exclusion log reviewed and approved',
      'Ticket or usage history parsed and available',
      'Scope memo signed by sponsor and EA council',
    ],
    choices: [
      {
        label: 'Lock boundary now',
        description: 'Finalize in-scope / out-of-scope and advance with current evidence.',
        prompt:
          'Help me finalize the scope boundary for this event. What is confirmed in-scope, what is explicitly excluded, and what evidence do we have to support the boundary?',
      },
      {
        label: 'Request missing evidence',
        description: 'Pause scope and identify what data Sentinel still needs to parse.',
        prompt:
          'What evidence is still missing or not yet parsed that would prevent us from locking scope? Give me a prioritized list of data gaps and who owns each one.',
      },
      {
        label: 'Split scope by criticality',
        description: 'Proceed with Tier 1; flag Tier 2–3 as conditional scope.',
        prompt:
          'Can we split scope by application criticality tier? Help me define which Tier 1 applications proceed now and what conditions Tier 2/3 would need to be included.',
      },
    ],
    artifactIds: ['app_inventory_tiering', 'scope_memo', 'exclusion_log', 'ticket_history_synthesis'],
  },
  rfp: {
    stageKey: 'rfp',
    stepNumber: 3,
    leadAgent: 'Nexus',
    intent:
      'Draft and finalize the RFP package based on confirmed scope. All evaluation criteria, weighting, and response format requirements must be locked before the document ships to vendors.',
    exitCriteria: [
      'RFP structure drafted with all required sections',
      'Evaluation criteria defined and weights approved by Steward',
      'Response format and submission deadline confirmed',
      'Legal and compliance requirements reviewed',
      'RFP issued to qualified vendors',
    ],
    choices: [
      {
        label: 'Draft RFP structure',
        description: 'Scaffold sections, requirements, and evaluation criteria for this event.',
        prompt:
          'Draft the RFP structure for this sourcing event. What sections are required, what requirements must vendors respond to, and what evaluation criteria should be included?',
      },
      {
        label: 'Set evaluation weights',
        description: 'Define scorecard criteria and weights before the RFP ships.',
        prompt:
          'Help me define the scorecard evaluation criteria and weights for this RFP. What dimensions matter most for this category, and how should they be weighted?',
      },
      {
        label: 'Review scope gaps',
        description: 'Check for missing requirements before the RFP goes to vendors.',
        prompt:
          'Review the current RFP draft for gaps. Are there missing requirements, ambiguous scope statements, or criteria that vendors will dispute? Flag anything that needs to be resolved before the RFP ships.',
      },
    ],
    artifactIds: ['rfp_package', 'evaluation_criteria_doc', 'vendor_shortlist'],
  },
  responses: {
    stageKey: 'responses',
    stepNumber: 4,
    leadAgent: 'Nexus',
    intent:
      'Track vendor submission status, flag incomplete or non-compliant responses, and confirm all required responses are received before evaluation scoring begins.',
    exitCriteria: [
      'All shortlisted vendors have submitted responses',
      'Incomplete or non-compliant submissions flagged and resolved',
      'Response completeness check performed by Sentinel',
      'Evaluation team briefed on response quality',
      'Evaluation scoring session scheduled',
    ],
    choices: [
      {
        label: 'Track submission status',
        description: 'Mark which vendors responded and flag any missing or late submissions.',
        prompt:
          'What is the current submission status across vendors? Which vendors have responded, which are outstanding, and are there any late or incomplete submissions that need follow-up?',
      },
      {
        label: 'Flag incomplete responses',
        description: 'Identify vendors whose submissions have gaps or non-compliant sections.',
        prompt:
          'Review the vendor responses received so far. Are there any incomplete sections, non-compliant answers, or missing required documents? Which vendors need to resubmit or clarify?',
      },
      {
        label: 'Prepare for evaluation',
        description: 'Confirm scorecard is locked and evaluation team is ready to score.',
        prompt:
          'What needs to be confirmed before we move to the evaluation scoring session? Is the scorecard locked, is the evaluation team briefed, and are all responses ready for scoring?',
      },
    ],
    artifactIds: ['response_tracker', 'response_completeness_check', 'evaluation_schedule'],
  },
  evaluation: {
    stageKey: 'evaluation',
    stepNumber: 5,
    leadAgent: 'Steward',
    intent:
      'Score vendor responses against weighted criteria. Steward governs the scorecard to ensure weights are locked, rationale is documented, and the evaluation is defensible before pricing begins.',
    exitCriteria: [
      'All criteria scored for all vendors with documented rationale',
      'Scorecard weights locked and approved',
      'Evidence cited for each score (no unsupported assertions)',
      'Score disputes resolved and documented',
      'Vendor ranking confirmed by evaluation team',
    ],
    choices: [
      {
        label: 'Score all criteria',
        description: "Work through each vendor's response against the locked evaluation criteria.",
        prompt:
          'Guide me through scoring vendor responses against each criterion. What evidence supports each score, and where are there gaps or disputes that need resolution?',
      },
      {
        label: 'Resolve weight dispute',
        description: 'Handle contested scorecard weights before locking the evaluation.',
        prompt:
          'Are there any scorecard weight disputes or contested criteria scores? Help me understand what the disagreement is, what evidence applies, and how Steward recommends resolving it.',
      },
      {
        label: 'Generate comparison matrix',
        description: 'Produce a vendor comparison summary artifact for review.',
        prompt:
          "Generate a vendor comparison matrix based on current scores. Show each vendor's performance by criterion, weighted total, and highlight the top 2 vendors for Steward review.",
      },
    ],
    artifactIds: ['scorecard_matrix', 'vendor_comparison', 'evaluation_rationale_log'],
  },
  pricing: {
    stageKey: 'pricing',
    stepNumber: 6,
    leadAgent: 'Nexus',
    intent:
      'Normalize vendor pricing to a common structure, identify anomalies and hidden costs, and produce a pricing comparison table that Atlas can use for the BAFO brief and executive decision.',
    exitCriteria: [
      'All vendor pricing normalized to common unit and term',
      'Transition and implementation costs itemized separately',
      'Pricing anomalies flagged and vendor-confirmed',
      'Total cost of ownership (TCO) modeled for finalist vendors',
      'Pricing table reviewed by Atlas and CFO stakeholder',
    ],
    choices: [
      {
        label: 'Normalize price components',
        description: 'Map all vendor pricing to a common unit for apples-to-apples comparison.',
        prompt:
          'Help me normalize vendor pricing to a common structure. What pricing components have each vendor submitted, how do they need to be restructured for comparison, and what cost assumptions need to be flagged?',
      },
      {
        label: 'Flag pricing anomalies',
        description: 'Identify vendors carrying unusual pricing structures or hidden assumptions.',
        prompt:
          'Are there any pricing anomalies across vendor submissions? Identify vendors with unusual rate structures, transition costs embedded in run-rate, or pricing assumptions that differ from the RFP requirements.',
      },
      {
        label: 'Build comparison table',
        description: 'Generate the pricing matrix for executive and BAFO review.',
        prompt:
          'Generate a pricing comparison table for all vendors. Show year 1 and total contract value side-by-side, highlight the variance from the baseline, and flag any vendor where pricing requires clarification before BAFO.',
      },
    ],
    artifactIds: ['pricing_workbook', 'tco_model', 'pricing_anomaly_log'],
  },
  bafo: {
    stageKey: 'bafo',
    stepNumber: 7,
    leadAgent: 'Nexus',
    intent:
      'Issue best-and-final-offer requests to finalist vendors, compare BAFO responses against initial bids, and identify the selection-ready candidate for the executive decision.',
    exitCriteria: [
      'BAFO brief issued to 2–3 finalist vendors',
      'BAFO responses received by deadline',
      'BAFO vs. initial bid comparison documented per vendor',
      'Preferred vendor identified with commercial rationale',
      'BAFO summary reviewed by Atlas before Decision stage',
    ],
    choices: [
      {
        label: 'Issue BAFO brief',
        description: 'Send best-and-final-offer request with specific improvement targets.',
        prompt:
          'Draft the BAFO brief for finalist vendors. What are the specific improvement targets — pricing, service levels, transition terms — we need to negotiate in the final round?',
      },
      {
        label: 'Compare BAFO vs. initial bid',
        description: 'Measure vendor improvement per price and service level component.',
        prompt:
          "Compare each vendor's BAFO response against their initial bid. Which vendors improved meaningfully, where did improvements fall short, and what does the BAFO comparison tell us about preferred vendor selection?",
      },
      {
        label: 'Identify preferred vendor',
        description: 'Flag the selection-ready candidate before moving to Decision.',
        prompt:
          'Based on evaluation scores and BAFO responses, which vendor should be the preferred candidate? Summarize the commercial and capability rationale for the executive decision brief.',
      },
    ],
    artifactIds: ['bafo_brief', 'bafo_comparison_table', 'preferred_vendor_summary'],
  },
  executive_decision: {
    stageKey: 'executive_decision',
    stepNumber: 8,
    leadAgent: 'Atlas',
    intent:
      'Present the executive decision brief to the CIO and sponsor. Atlas generates the recommendation with evidence-backed rationale. Steward confirms gate approval before contract negotiation begins.',
    exitCriteria: [
      'Executive decision brief prepared with vendor recommendation',
      'Value case and risk summary included in the brief',
      'Approval obtained from CIO and sponsor',
      'Any objections or dissent documented',
      'Award decision confirmed in the event record',
    ],
    choices: [
      {
        label: 'Prepare decision brief',
        description: 'Generate the executive summary with vendor recommendation and evidence.',
        prompt:
          'Prepare the executive decision brief for this sourcing event. Include the preferred vendor recommendation, evidence-backed rationale, value case, key risks, and what the CIO needs to sign off on.',
      },
      {
        label: 'Route for CIO approval',
        description: 'Submit the decision brief to the CIO and sponsor for sign-off.',
        prompt:
          'What is the approval path for this sourcing decision? Who needs to sign off, in what order, what can be delegated, and what does the sponsor need to see before approving?',
      },
      {
        label: 'Document stakeholder objections',
        description: 'Record any dissent or conditions before the gate closes.',
        prompt:
          'Are there any stakeholder objections, dissenting views, or conditions attached to the approval? Document the objections and how they were addressed so the audit trail is complete.',
      },
    ],
    artifactIds: ['executive_brief', 'approval_record', 'dissent_log'],
  },
  selection: {
    stageKey: 'selection',
    stepNumber: 9,
    leadAgent: 'Nexus',
    intent:
      'Finalize the vendor award, review contract terms, and confirm the transition team and go-live owner. Selection is complete when the award is documented and the transition plan is initiated.',
    exitCriteria: [
      'Award decision confirmed and recorded',
      'Key contract terms reviewed: SLAs, exit clauses, pricing schedule',
      'Unsuccessful vendors notified',
      'Transition owner named and accepted',
      'Transition kick-off scheduled',
    ],
    choices: [
      {
        label: 'Confirm the award',
        description: 'Finalize the selected vendor and document the decision rationale.',
        prompt:
          'Confirm the vendor award for this sourcing event. What is the selected vendor, the final contract value, key terms, and what documentation is needed to close out the selection stage?',
      },
      {
        label: 'Review contract terms',
        description: 'Check SLAs, exit clauses, and pricing schedule before signing.',
        prompt:
          'What are the key contract terms that need review before we sign? Focus on SLA commitments, exit provisions, pricing schedule, and any terms that differ from the RFP requirements.',
      },
      {
        label: 'Assign transition owner',
        description: 'Name the person responsible for the transition workstream.',
        prompt:
          'Who should own the transition workstream for this sourcing event? What are the key transition deliverables, go-live date, and what does the transition owner need to know on day one?',
      },
    ],
    artifactIds: ['award_notice', 'contract_summary', 'transition_plan_initiation'],
  },
  transition: {
    stageKey: 'transition',
    stepNumber: 10,
    leadAgent: 'Nexus',
    intent:
      'Execute the transition workstream: knowledge transfer, system cutover, and go-live. Sentinel monitors milestone completion and flags blockers. Stage closes when go-live is confirmed and value measurement begins.',
    exitCriteria: [
      'All transition milestones completed or formally deferred',
      'Knowledge transfer sessions completed and documented',
      'System cutover executed with rollback plan in place',
      'Go-live confirmed by transition owner',
      'Value measurement baseline established',
    ],
    choices: [
      {
        label: 'Track milestone progress',
        description: 'Mark transition checkpoints as completed, at risk, or blocked.',
        prompt:
          'What is the current status of transition milestones? Which checkpoints are complete, which are at risk, and what blockers need immediate attention to keep go-live on track?',
      },
      {
        label: 'Flag open blockers',
        description: 'Identify vendor, client, or governance issues blocking go-live.',
        prompt:
          'What are the open blockers to transition go-live? For each blocker, identify who owns resolution, what the dependency is, and what the impact is on the go-live date.',
      },
      {
        label: 'Confirm knowledge transfer',
        description: 'Verify documentation, training, and handoff are complete.',
        prompt:
          'Is knowledge transfer complete for this transition? What documentation exists, what training has been delivered, and what handoff activities are still outstanding before go-live can be confirmed?',
      },
    ],
    artifactIds: ['transition_tracker', 'go_live_checklist', 'knowledge_transfer_log'],
  },
  value: {
    stageKey: 'value',
    stepNumber: 11,
    leadAgent: 'Atlas',
    intent:
      'Measure and report sourcing value realization. Atlas tracks projected vs. committed vs. realized savings with evidence. Value stage is open until the full contract term delivers on commitments.',
    exitCriteria: [
      'Value baseline confirmed at go-live',
      'Measurement methodology agreed with Finance',
      'First savings confirmation reported',
      'Value realization report shared with CIO sponsor',
      'Ongoing measurement cadence established',
    ],
    choices: [
      {
        label: 'Review value posture',
        description: 'Compare projected vs. committed vs. realized savings.',
        prompt:
          'What is the current value posture for this sourcing event? Compare projected, committed, and realized savings. Where are we tracking to target and where are there gaps?',
      },
      {
        label: 'Log realized value',
        description: 'Record confirmed savings with evidence and audit trail.',
        prompt:
          'What value has been realized so far from this sourcing event? Help me log confirmed savings with the evidence, measurement period, and which stakeholder confirmed the number.',
      },
      {
        label: 'Flag value at risk',
        description: 'Identify commitments not tracking to target.',
        prompt:
          'Which value commitments are not tracking to target? For each at-risk item, identify the gap, the root cause, and what intervention could recover the projected value.',
      },
    ],
    artifactIds: ['value_ledger', 'savings_report', 'value_realization_dashboard'],
  },
  // Legacy aliases — map to canonical configs
  intake: {
    stageKey: 'strategy',
    stepNumber: 1,
    leadAgent: 'Nexus',
    intent: 'Confirm why this event exists and who owns the decision.',
    exitCriteria: ['Trigger documented', 'Decision owner named', 'Value target set'],
    choices: [
      { label: 'Name the trigger', description: 'Confirm the business trigger.', prompt: 'What is the trigger for this sourcing event?' },
      { label: 'Name the owner', description: 'Confirm who decides.', prompt: 'Who has authority to make the final vendor decision?' },
      { label: 'Size the value case', description: 'Establish the commercial target.', prompt: 'What commercial outcome must this event achieve?' },
    ],
    artifactIds: ['strategy_memo'],
  },
  sourcing_strategy: {
    stageKey: 'strategy',
    stepNumber: 1,
    leadAgent: 'Nexus',
    intent: 'Confirm why this event exists and who owns the decision.',
    exitCriteria: ['Trigger documented', 'Decision owner named'],
    choices: [
      { label: 'Name the trigger', description: 'Confirm the business trigger.', prompt: 'What is the trigger for this sourcing event?' },
      { label: 'Name the owner', description: 'Confirm who decides.', prompt: 'Who has authority to make the final vendor decision?' },
      { label: 'Size the value case', description: 'Establish the commercial target.', prompt: 'What commercial outcome must this event achieve?' },
    ],
    artifactIds: ['strategy_memo'],
  },
  rfp_rfi_package: {
    stageKey: 'rfp',
    stepNumber: 3,
    leadAgent: 'Nexus',
    intent: 'Draft and finalize the RFP package.',
    exitCriteria: ['RFP drafted', 'Criteria weighted', 'RFP issued'],
    choices: [
      { label: 'Draft RFP structure', description: 'Scaffold the RFP.', prompt: 'Draft the RFP structure for this event.' },
      { label: 'Set evaluation weights', description: 'Define criteria weights.', prompt: 'Define the evaluation criteria and weights.' },
      { label: 'Review scope gaps', description: 'Check for missing requirements.', prompt: 'Review the RFP for gaps.' },
    ],
    artifactIds: ['rfp_package'],
  },
  vendor_responses: {
    stageKey: 'responses',
    stepNumber: 4,
    leadAgent: 'Nexus',
    intent: 'Track vendor submission status.',
    exitCriteria: ['All responses received', 'Completeness checked'],
    choices: [
      { label: 'Track submissions', description: 'Mark who responded.', prompt: 'What is the vendor submission status?' },
      { label: 'Flag incomplete responses', description: 'Identify gaps.', prompt: 'Which vendor responses are incomplete?' },
      { label: 'Prepare for evaluation', description: 'Confirm readiness.', prompt: 'What needs to be confirmed before evaluation scoring?' },
    ],
    artifactIds: ['response_tracker'],
  },
  orals_bafo: {
    stageKey: 'bafo',
    stepNumber: 7,
    leadAgent: 'Nexus',
    intent: 'Issue BAFO requests and compare responses.',
    exitCriteria: ['BAFO issued', 'Responses compared', 'Preferred vendor identified'],
    choices: [
      { label: 'Issue BAFO brief', description: 'Send the BAFO request.', prompt: 'Draft the BAFO brief.' },
      { label: 'Compare BAFO vs. initial', description: 'Measure improvement.', prompt: 'Compare BAFO vs. initial bids.' },
      { label: 'Identify preferred vendor', description: 'Flag selection candidate.', prompt: 'Which vendor should be preferred?' },
    ],
    artifactIds: ['bafo_brief'],
  },
  contract_mobilization: {
    stageKey: 'transition',
    stepNumber: 10,
    leadAgent: 'Nexus',
    intent: 'Execute transition milestones.',
    exitCriteria: ['Milestones complete', 'Go-live confirmed'],
    choices: [
      { label: 'Track milestones', description: 'Mark transition checkpoints.', prompt: 'What is the milestone status?' },
      { label: 'Flag blockers', description: 'Identify go-live blockers.', prompt: 'What is blocking go-live?' },
      { label: 'Confirm handoff', description: 'Verify knowledge transfer.', prompt: 'Is knowledge transfer complete?' },
    ],
    artifactIds: ['transition_tracker'],
  },
  value_realization: {
    stageKey: 'value',
    stepNumber: 11,
    leadAgent: 'Atlas',
    intent: 'Measure and report value realization.',
    exitCriteria: ['Baseline confirmed', 'Savings reported'],
    choices: [
      { label: 'Review value posture', description: 'Compare projected vs. realized.', prompt: 'What is the current value posture?' },
      { label: 'Log realized value', description: 'Record confirmed savings.', prompt: 'Log confirmed savings with evidence.' },
      { label: 'Flag value at risk', description: 'Identify gaps to target.', prompt: 'Which commitments are at risk?' },
    ],
    artifactIds: ['value_ledger'],
  },
};

export function getStageCanvasConfig(stageKey: SourceStageKey | string): StageCanvasConfig | null {
  return (STAGE_CONFIGS as Record<string, StageCanvasConfig>)[stageKey] ?? null;
}

/** Map a stage spine label ("Strategy", "Scope", "RFP", …) to a canonical key. */
const LABEL_TO_KEY: Record<string, SourceStageKey> = {
  Strategy: 'strategy',
  Scope: 'scope',
  RFP: 'rfp',
  Responses: 'responses',
  Evaluate: 'evaluation',
  Evaluation: 'evaluation',
  Pricing: 'pricing',
  BAFO: 'bafo',
  'Executive Decision': 'executive_decision',
  Decision: 'executive_decision',
  Select: 'selection',
  Selection: 'selection',
  Transition: 'transition',
  Value: 'value',
};

export function stageLabelToKey(label: string): SourceStageKey | null {
  return (LABEL_TO_KEY[label] ?? null) as SourceStageKey | null;
}
