// PR-2 — AMS / IT-outsourcing RFP section map (data-driven).
//
// The 16-section AMS RFP package as RfpSectionDefinition[], extending the archetype
// AMS_MANAGED_SERVICES.rfpDocumentStructure + its evidence families. Each section
// declares its default mode, required/optional inputs (mapped to archetype evidence
// families or client decisions), evidence families, review flags, and disclosure tier.
// resolveSectionReadiness computes the effective mode + status against live evidence.

import type { RfpSectionDefinition, SectionInput, SectionResolutionContext } from './types';
import { resolveSectionReadiness, buildReadinessScorecard } from './resolver';

const ARCH = 'AMS_MANAGED_SERVICES';
// archetype evidence-family input (satisfied when agent_ready)
const ev = (key: string, label: string): SectionInput => ({ key, label, evidenceFamily: key });
// client-judgment input (satisfied only by a captured/attested answer)
const cd = (key: string, label: string): SectionInput => ({ key, label, clientDecision: true });

export const AMS_RFP_SECTIONS: RfpSectionDefinition[] = [
  {
    id: 'exec_overview', sectionNumber: 1, title: 'Executive Overview', archetype: ARCH,
    description: 'Objectives, mandate, and headline current-state framing.',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [], optionalInputs: [cd('strategic_objectives', 'Strategic objectives / drivers')],
    evidenceFamilies: ['application_inventory', 'sla_baseline'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'pptx'],
  },
  {
    id: 'procurement_instructions', sectionNumber: 2, title: 'Procurement Instructions & Timeline', archetype: ARCH,
    description: 'Submission rules, Q&A process, milestones, single point of contact.',
    defaultMode: 'auto_template', disclosureTier: 'vendor_facing',
    requiredInputs: [cd('procurement_timeline', 'Procurement timeline (issue/Q&A/due/orals/award)'), cd('procurement_contact', 'Sourcing contact + submission channel')],
    optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: true,
    pricingReviewRequired: false, clientCompleteAllowed: true, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'current_state', sectionNumber: 3, title: 'Background & Current-State Context', archetype: ARCH,
    description: 'De-identified, aggregate current-state (estate, volumes, cost posture).',
    defaultMode: 'auto_governed', disclosureTier: 'aggregate_only',
    requiredInputs: [ev('application_inventory', 'Application inventory'), ev('ticket_volumes', 'Ticket/incident volumes')],
    optionalInputs: [ev('run_cost_baseline', 'Run cost baseline')],
    evidenceFamilies: ['application_inventory', 'ticket_volumes', 'incident_problem_change'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'xlsx'],
  },
  {
    id: 'service_towers', sectionNumber: 4, title: 'Scope of Services by Tower', archetype: ARCH,
    description: 'Tower-by-tower scope of services.',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('service_tower_scope', 'Service tower scope'), ev('application_inventory', 'Application inventory')],
    optionalInputs: [cd('scope_decisions', 'In/out-of-scope & retain-vs-outsource per tower')],
    evidenceFamilies: ['service_tower_scope', 'application_inventory'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'xlsx'],
  },
  {
    id: 'current_environment', sectionNumber: 5, title: 'Current Environment Exhibits', archetype: ARCH,
    description: 'Application/infra inventory exhibits (de-identified) for bidder sizing.',
    defaultMode: 'auto_governed', disclosureTier: 'aggregate_only',
    requiredInputs: [ev('application_inventory', 'Application inventory')],
    optionalInputs: [cd('utilization_volumes', 'Transaction/utilization volume summaries')],
    evidenceFamilies: ['application_inventory', 'tooling_landscape'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['xlsx', 'docx'],
  },
  {
    id: 'service_requirements', sectionNumber: 6, title: 'Service Requirements', archetype: ARCH,
    description: 'Functional service requirements (L1/L2/L3, incident/problem/change).',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('incident_problem_change', 'Incident/problem/change data')],
    optionalInputs: [], evidenceFamilies: ['incident_problem_change', 'sla_baseline'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'transition', sectionNumber: 7, title: 'Transition Requirements', archetype: ARCH,
    description: 'Transition approach, knowledge transfer, parallel-run, blackout windows.',
    defaultMode: 'elicit', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('transition_constraints', 'Transition constraints')],
    optionalInputs: [], evidenceFamilies: ['transition_constraints'],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'sla_kpi', sectionNumber: 8, title: 'SLA / KPI Schedule', archetype: ARCH,
    description: 'Required service levels, KPI schedule, and credit framework.',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('sla_baseline', 'SLA baseline')],
    optionalInputs: [cd('target_slas', 'Final target SLA levels & credit policy')],
    evidenceFamilies: ['sla_baseline'],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'xlsx'],
  },
  {
    id: 'security_compliance', sectionNumber: 9, title: 'Security, Compliance & Risk Requirements', archetype: ARCH,
    description: 'Required security frameworks, data protection, compliance, risk controls.',
    defaultMode: 'client_complete', disclosureTier: 'vendor_facing',
    requiredInputs: [cd('security_requirements', 'Required frameworks / data residency / background checks')],
    optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: true, preliminaryDraftAllowed: false,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'governance_retained_org', sectionNumber: 10, title: 'Governance & Retained Organization Model', archetype: ARCH,
    description: 'Retained-org design, governance cadence, decision rights.',
    defaultMode: 'elicit', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('retained_org_model', 'Retained organization model')],
    optionalInputs: [cd('governance_model', 'Governance operating model & cadence')],
    evidenceFamilies: ['retained_org_model', 'staffing_baseline'],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: true, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'vendor_response_instructions', sectionNumber: 11, title: 'Vendor Response Instructions', archetype: ARCH,
    description: 'Required response structure, format, and submission checklist.',
    defaultMode: 'auto_template', disclosureTier: 'vendor_facing',
    requiredInputs: [], optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: true,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'xlsx'],
  },
  {
    id: 'pricing_commercial', sectionNumber: 12, title: 'Pricing Template & Commercial Model', archetype: ARCH,
    description: 'Resource-unit pricing template + required commercial model.',
    defaultMode: 'auto_template', disclosureTier: 'vendor_facing',
    requiredInputs: [ev('staffing_baseline', 'Staffing baseline'), ev('run_cost_baseline', 'Run cost baseline')],
    optionalInputs: [cd('budget_ceiling', 'Budget ceiling / NTE')],
    evidenceFamilies: ['staffing_baseline', 'run_cost_baseline'],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: true, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['xlsx', 'docx'],
  },
  {
    id: 'evaluation_criteria', sectionNumber: 13, title: 'Evaluation Criteria', archetype: ARCH,
    description: 'Evaluation methodology, criteria weights, disqualifiers.',
    defaultMode: 'auto_template', disclosureTier: 'vendor_facing',
    requiredInputs: [cd('evaluation_weights', 'Final evaluation criteria weights & disqualifiers')],
    optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: true,
    pricingReviewRequired: false, clientCompleteAllowed: true, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx', 'xlsx'],
  },
  {
    id: 'assumptions_dependencies', sectionNumber: 14, title: 'Assumptions, Dependencies & Client-to-Complete', archetype: ARCH,
    description: 'Transparent register of assumptions, open items, and client actions.',
    defaultMode: 'auto_governed', disclosureTier: 'vendor_facing',
    requiredInputs: [], optionalInputs: [], evidenceFamilies: [],
    citationRequired: false, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: true,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'contracting_terms', sectionNumber: 15, title: 'Contracting / Terms Appendix', archetype: ARCH,
    description: 'Sample agreement / commercial terms placeholders.',
    defaultMode: 'client_complete', disclosureTier: 'vendor_facing',
    requiredInputs: [cd('legal_terms', 'Liability, indemnity, insurance, exit, audit, IP terms')],
    optionalInputs: [], evidenceFamilies: ['contract_baseline'],
    citationRequired: false, legalReviewRequired: true, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: true, preliminaryDraftAllowed: false,
    outputArtifactTypes: ['docx'],
  },
  {
    id: 'source_register', sectionNumber: 16, title: 'Source Register & Evidence Appendix', archetype: ARCH,
    description: 'Governed evidence citations supporting the RFP (internal/audit).',
    defaultMode: 'auto_governed', disclosureTier: 'internal_only',
    requiredInputs: [], optionalInputs: [], evidenceFamilies: [],
    citationRequired: true, legalReviewRequired: false, procurementReviewRequired: false,
    pricingReviewRequired: false, clientCompleteAllowed: false, preliminaryDraftAllowed: false,
    outputArtifactTypes: ['docx'],
  },
];

export function getAmsSection(id: string): RfpSectionDefinition | undefined {
  return AMS_RFP_SECTIONS.find((s) => s.id === id);
}

/** Resolve the whole AMS RFP package against live evidence → per-section readiness + scorecard. */
export function buildAmsRfpReadiness(ctx: SectionResolutionContext) {
  const sections = AMS_RFP_SECTIONS.map((d) => resolveSectionReadiness(d, ctx));
  return { sections, scorecard: buildReadinessScorecard(sections) };
}
