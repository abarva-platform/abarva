// AMS_IT_OUTSOURCING stage-gate playbook — the 12 sourcing stages, each with its full
// recommended standard and the minimum-viable subset required to advance without a Maestro
// override. Data-driven: extend here, not in the resolver.

import type { RequirementKind, RequirementTier, StageGateDefinition, StageGateRequirement } from './types';

const ARCH = 'AMS_IT_OUTSOURCING';

function req(
  key: string,
  label: string,
  tier: RequirementTier,
  kind: RequirementKind,
  riskIfMissing: string,
  downstreamImpact: string[] = [],
): StageGateRequirement {
  return { key, label, tier, kind, riskIfMissing, downstreamImpact };
}

export const AMS_STAGE_GATES: StageGateDefinition[] = [
  {
    archetype: ARCH, stageKey: 'origination', stageNumber: 1, stageName: 'Origination & Event Framing',
    purpose: 'Frame the sourcing event, confirm archetype, scope direction, and sponsorship.',
    approvalRoles: ['CIO', 'Procurement'],
    requirements: [
      req('event_type_confirmed', 'Event type / archetype confirmed', 'minimum_viable', 'decision', 'Wrong archetype drives the wrong process and evidence set.'),
      req('scope_direction', 'Directional scope agreed', 'minimum_viable', 'decision', 'Scope drift downstream; vendors size inconsistently.', ['scope_service_towers']),
      req('sponsor_confirmed', 'Executive sponsor confirmed', 'recommended', 'decision', 'No decision authority for gates and award.'),
      req('objectives_documented', 'Sourcing objectives documented', 'recommended', 'artifact', 'Strategy and evaluation lack a north star.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'evidence_baseline', stageNumber: 2, stageName: 'Evidence Readiness & Current-State Baseline',
    purpose: 'Establish the governed current-state baseline that grounds the RFP.',
    approvalRoles: ['CIO', 'IT Ops'],
    requirements: [
      req('application_inventory', 'Application / system inventory', 'minimum_viable', 'evidence', 'Scope-by-tower and sizing are unfounded.', ['scope_service_towers', 'current_environment']),
      req('service_tower_scope', 'Service tower scope', 'minimum_viable', 'evidence', 'Towers cannot be defined; bidders cannot scope.', ['scope_service_towers']),
      req('ticket_volumes', 'Ticket / incident / change volumes', 'recommended', 'evidence', 'SLA sizing and resource-unit pricing are unfounded.', ['sla_kpi', 'pricing_commercial', 'current_state_baseline']),
      req('sla_baseline', 'SLA / service-level baseline', 'recommended', 'evidence', 'SLA schedule and credits are not defensible.', ['sla_kpi']),
      req('run_cost_baseline', 'Run-cost / IT financial baseline', 'recommended', 'evidence', 'Should-cost and negotiation leverage are weak.', ['pricing_commercial']),
    ],
  },
  {
    archetype: ARCH, stageKey: 'sourcing_strategy', stageNumber: 3, stageName: 'Sourcing Strategy',
    purpose: 'Set the commercial model, evaluation approach, and go-to-market.',
    approvalRoles: ['CIO', 'CPO', 'CFO'],
    requirements: [
      req('strategy_session', 'Sourcing strategy working session', 'minimum_viable', 'session', 'Strategy is not stakeholder-aligned.'),
      req('commercial_model_chosen', 'Commercial model direction chosen', 'minimum_viable', 'decision', 'Pricing template cannot be designed.', ['pricing_commercial']),
      req('market_landscape', 'Vendor landscape assessed', 'recommended', 'artifact', 'Bidder shortlist may miss capable vendors.'),
      req('negotiation_levers', 'Negotiation levers identified', 'recommended', 'artifact', 'Weaker negotiation position.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'rfp_design', stageNumber: 4, stageName: 'RFP Package Design',
    purpose: 'Design the issue-ready RFP package across all sections.',
    approvalRoles: ['CPO', 'Procurement', 'Legal'],
    requirements: [
      req('rfp_sections_drafted', 'All RFP sections drafted', 'minimum_viable', 'artifact', 'Incomplete RFP cannot be issued.'),
      req('pricing_template', 'Pricing response template', 'minimum_viable', 'artifact', 'Bids are not comparable.', ['pricing_commercial']),
      req('evaluation_weights', 'Final evaluation weights confirmed', 'recommended', 'decision', 'Scoring is not defensible; protest risk.', ['evaluation_criteria']),
      req('procurement_review', 'Procurement review of RFP', 'recommended', 'review', 'Process/compliance defects in the issued RFP.'),
      req('legal_review', 'Legal review of terms appendix', 'recommended', 'review', 'Contractual exposure in issued terms.', ['contracting_terms']),
    ],
  },
  {
    archetype: ARCH, stageKey: 'vendor_briefing', stageNumber: 5, stageName: 'Vendor Briefing / Market Engagement',
    purpose: 'Brief the market and run the Q&A / bidder process.',
    approvalRoles: ['Procurement'],
    requirements: [
      req('vendor_discussion_guide', 'Vendor discussion guide prepared', 'minimum_viable', 'artifact', 'Inconsistent vendor briefings.'),
      req('qa_process', 'Q&A / addendum process defined', 'minimum_viable', 'decision', 'Uncontrolled bidder communications.'),
      req('bidder_conference', 'Bidder conference held', 'recommended', 'session', 'Bidders under-informed; weaker proposals.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'proposal_intake', stageNumber: 6, stageName: 'Proposal Intake & Normalization',
    purpose: 'Receive and normalize proposals for like-for-like comparison.',
    approvalRoles: ['Procurement'],
    requirements: [
      req('proposals_received', 'Proposals received', 'minimum_viable', 'artifact', 'Nothing to evaluate.'),
      req('normalization', 'Proposals normalized to template', 'minimum_viable', 'artifact', 'Bids are not comparable.', ['evaluation_criteria', 'pricing_commercial']),
      req('completeness_check', 'Completeness / compliance check', 'recommended', 'review', 'Non-compliant bids skew results.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'evaluation', stageNumber: 7, stageName: 'Evaluation & Scoring',
    purpose: 'Score proposals against the approved model.',
    approvalRoles: ['Procurement', 'CIO'],
    requirements: [
      req('scoring_model_approved', 'Scoring model approved', 'minimum_viable', 'decision', 'Scores are not defensible.', ['evaluation_criteria']),
      req('evaluators_scored', 'Evaluators completed scoring', 'minimum_viable', 'artifact', 'No evaluation outcome.'),
      req('consensus_session', 'Consensus / calibration session', 'recommended', 'session', 'Inconsistent scoring across evaluators.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'commercial_analysis', stageNumber: 8, stageName: 'Commercial & Pricing Analysis',
    purpose: 'Analyze pricing vs should-cost and baseline.',
    approvalRoles: ['CFO', 'Procurement'],
    requirements: [
      req('pricing_normalized', 'Pricing normalized & compared', 'minimum_viable', 'artifact', 'Commercial comparison is unreliable.', ['pricing_commercial']),
      req('should_cost', 'Should-cost / baseline comparison', 'recommended', 'artifact', 'No leverage benchmark for negotiation.'),
      req('affordability_confirmed', 'Affordability / budget ceiling confirmed', 'recommended', 'decision', 'Award may exceed budget.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'negotiation', stageNumber: 9, stageName: 'Negotiation / BAFO Strategy',
    purpose: 'Plan and run negotiation / best-and-final.',
    approvalRoles: ['CPO', 'CFO', 'Legal'],
    requirements: [
      req('negotiation_memo', 'Negotiation strategy memo', 'minimum_viable', 'artifact', 'Unstructured negotiation; value left on the table.'),
      req('bafo_process', 'BAFO process defined', 'recommended', 'decision', 'Inconsistent best-and-final handling.'),
      req('risk_protections', 'Risk protections / key terms set', 'recommended', 'review', 'Residual contractual risk.', ['contracting_terms']),
    ],
  },
  {
    archetype: ARCH, stageKey: 'award_recommendation', stageNumber: 10, stageName: 'Award Recommendation',
    purpose: 'Recommend the award decision to executives.',
    approvalRoles: ['Steering Committee'],
    requirements: [
      req('recommendation_memo', 'Executive recommendation drafted', 'minimum_viable', 'artifact', 'No decision artifact for the committee.'),
      req('evaluation_outcome', 'Evaluation outcome finalized', 'minimum_viable', 'artifact', 'Recommendation is not evidence-backed.'),
      req('exec_briefing', 'Executive briefing held', 'recommended', 'session', 'Committee under-informed at decision.'),
    ],
  },
  {
    archetype: ARCH, stageKey: 'contracting_handoff', stageNumber: 11, stageName: 'Contracting Handoff',
    purpose: 'Hand off to contracting with all terms and obligations.',
    approvalRoles: ['Legal', 'Procurement'],
    requirements: [
      req('handoff_pack', 'Contracting handoff pack', 'minimum_viable', 'artifact', 'Contracting lacks the negotiated basis.'),
      req('legal_terms_final', 'Legal terms finalized', 'recommended', 'review', 'Contract exposure; cannot mark final.', ['contracting_terms']),
      req('transition_obligations', 'Transition obligations captured', 'recommended', 'artifact', 'Transition risk not contractually bound.', ['transition']),
    ],
  },
  {
    archetype: ARCH, stageKey: 'post_award_controls', stageNumber: 12, stageName: 'Post-Award Controls',
    purpose: 'Stand up value tracking and governance controls.',
    approvalRoles: ['CIO', 'Vendor Management'],
    requirements: [
      req('governance_model', 'Governance & SLA controls stood up', 'minimum_viable', 'artifact', 'No accountability for delivery.'),
      req('value_tracking', 'Value realization tracking in place', 'recommended', 'artifact', 'Promised value is not measured.'),
      req('benchmarking_clause', 'Benchmarking / audit cadence set', 'recommended', 'decision', 'No mechanism to keep pricing competitive.'),
    ],
  },
];

export function getAmsStageGate(stageKey: string): StageGateDefinition | undefined {
  return AMS_STAGE_GATES.find((s) => s.stageKey === stageKey);
}
