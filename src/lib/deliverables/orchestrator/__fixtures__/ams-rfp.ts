// Shared fixtures: a representative AMS RFP request for SkyHarbor (cover name).
import type {
  DeliverableGenerationPlan,
  DeliverableIntelligenceRequest,
  RenderableDeliverable,
} from '../types';

export function amsRfpRequest(overrides: Partial<DeliverableIntelligenceRequest> = {}): DeliverableIntelligenceRequest {
  return {
    module: 'source',
    useCaseArchetype: 'AMS_IT_OUTSOURCING',
    phaseOrStage: 'rfp_build',
    deliverableType: 'rfp_package',
    audience: ['cio', 'cpo', 'procurement'],
    decisionContext: 'Approve issuance of the AMS RFP and the scope/evaluation/commercial model it commits to.',
    clientDisplayName: 'SkyHarbor Air',
    initiativeDisplayName: 'AMS / IT Outsourcing 2026',
    governedEvidenceBundle: [
      { citationNumber: 1, label: 'Service tower scope', statement: '7 in-scope towers including Mainframe, Application Mgmt, Service Desk.', evidenceFamily: 'service_tower_scope', confidence: 'high', asOf: 'FY2026', disclosureTier: 'vendor_facing', provenanceRef: 'ev-tower-1' },
      { citationNumber: 2, label: 'Application inventory', statement: '320 applications; 41 tier-1 critical.', evidenceFamily: 'application_inventory', confidence: 'high', asOf: 'FY2026', disclosureTier: 'vendor_facing', provenanceRef: 'ev-app-1' },
      { citationNumber: 3, label: 'SLA baseline', statement: 'Mainframe availability target 99.9% measured monthly.', evidenceFamily: 'sla_baseline', confidence: 'high', asOf: 'FY2026', disclosureTier: 'vendor_facing', provenanceRef: 'ev-sla-1' },
      { citationNumber: 4, label: 'Ticket volumes', statement: '15,600 L1 service-desk tickets/month.', evidenceFamily: 'ticket_volumes', confidence: 'medium', asOf: '2026-05', disclosureTier: 'vendor_facing', provenanceRef: 'ev-itsm-1' },
      { citationNumber: 5, label: 'Incumbent contract value', statement: 'Incumbent AMS contract at $280M/yr.', evidenceFamily: 'contract_baseline', confidence: 'high', asOf: 'FY2026', disclosureTier: 'internal_only', provenanceRef: 'ev-contract-1' },
    ],
    sourceRegister: [],
    missingEvidence: [
      { evidenceFamily: 'transition_constraints', label: 'Transition constraints', whyItMatters: 'Sizing the transition window.', blocksSections: ['transition'], completionPath: 'Upload transition constraints template' },
    ],
    clientCompleteItems: [
      { key: 'evaluation_final_weights', label: 'Final evaluation weights', owner: 'procurement', reason: 'procurement_signoff', placeholderText: '[CLIENT TO COMPLETE: confirm final evaluation weights]' },
      { key: 'legal_positions', label: 'Legal terms positions', owner: 'legal', reason: 'legal_review', placeholderText: '[CLIENT TO COMPLETE: legal to confirm contract positions]' },
    ],
    approvedAssumptions: [
      { key: 'commercial_model', statement: 'Resource-unit pricing with a productivity glidepath.', basis: 'Standard for enterprise AMS at this scale.', mustValidate: true },
    ],
    artifactStandard: 'SOURCE_DELIVERABLE_STANDARD',
    exemplarGuidance: undefined,
    outputFormats: ['docx', 'xlsx'],
    formattingProfile: {
      bodyPointSize: 11,
      headingStyle: 'numbered',
      tableStyle: 'banded',
      wideDataToExcelCompanion: true,
      includeCoverPage: true,
      includeTableOfContents: true,
      includeSourceRegisterSection: true,
    },
    qualityBar: {
      minSections: 6,
      minBodyWords: 250,
      requiresCitations: true,
      requiresDecisionSection: true,
      requiresRecommendation: true,
      requiresRiskTable: true,
      requiresSourceRegister: true,
      requiresClientCompleteChecklistWhenGaps: true,
      tone: 'board_grade_consulting',
    },
    ...overrides,
  };
}

export function goodPlan(): DeliverableGenerationPlan {
  return {
    sectionPlan: [
      { key: 'exec_overview', title: 'Executive Overview & Objectives', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: 'Frame decision.' },
      { key: 'scope_service_towers', title: 'Scope & Service Towers', groundingMode: 'governed_facts', evidenceCitations: [1, 2], assumptionsUsed: [], placeholders: [], rationale: 'Define scope.' },
      { key: 'current_environment', title: 'Current Environment', groundingMode: 'governed_facts', evidenceCitations: [2], assumptionsUsed: [], placeholders: [], rationale: 'Estate.' },
      { key: 'service_requirements', title: 'Service Requirements', groundingMode: 'mixed', evidenceCitations: [1], assumptionsUsed: [], placeholders: [], rationale: 'Reqs.' },
      { key: 'sla_kpi', title: 'SLA / KPI Schedule', groundingMode: 'governed_facts', evidenceCitations: [3], assumptionsUsed: [], placeholders: [], rationale: 'SLAs.' },
      { key: 'transition', title: 'Transition & Cutover', groundingMode: 'mixed', evidenceCitations: [], assumptionsUsed: [], placeholders: ['transition_constraints'], rationale: 'Transition.' },
      { key: 'pricing_commercial', title: 'Pricing & Commercial Model', groundingMode: 'mixed', evidenceCitations: [], assumptionsUsed: ['commercial_model'], placeholders: [], rationale: 'Pricing template.' },
      { key: 'vendor_response_instructions', title: 'Instructions to Bidders', groundingMode: 'expert_template', evidenceCitations: [], assumptionsUsed: [], placeholders: [], rationale: 'Standard.' },
      { key: 'evaluation_criteria', title: 'Evaluation Criteria & Weights', groundingMode: 'client_to_complete', evidenceCitations: [], assumptionsUsed: [], placeholders: ['evaluation_final_weights'], rationale: 'Client confirms.' },
    ],
    evidenceMapping: [
      { citationNumber: 1, usedInSections: ['exec_overview', 'scope_service_towers'], supportsClaim: 'tower scope' },
      { citationNumber: 2, usedInSections: ['scope_service_towers', 'current_environment'], supportsClaim: 'app inventory' },
      { citationNumber: 3, usedInSections: ['sla_kpi'], supportsClaim: 'SLA targets' },
    ],
    missingEvidenceHandling: [
      { evidenceFamily: 'transition_constraints', handledAs: 'client_to_complete', note: 'Placeholder in transition.' },
    ],
    artifactEnhancementSuggestions: [
      { suggestion: 'Add a tower-scope matrix exhibit.', addsSectionOrExhibit: 'tower_scope_map', rationale: 'Bidders size effort faster.' },
    ],
    tableAndExhibitPlan: [
      { key: 'application_inventory', title: 'Application Inventory', kind: 'table', targetFormat: 'xlsx', groundingMode: 'governed_facts' },
      { key: 'risk_register', title: 'Risks, Issues & Dependencies', kind: 'table', targetFormat: 'docx', groundingMode: 'mixed' },
    ],
    clientCompletePlan: [
      { key: 'evaluation_final_weights', label: 'Final evaluation weights', owner: 'procurement', placement: 'evaluation_criteria' },
      { key: 'legal_positions', label: 'Legal positions', owner: 'legal', placement: 'contracting_terms' },
    ],
    outputPackagePlan: [
      { format: 'docx', contents: 'Main RFP document.' },
      { format: 'xlsx', contents: 'Application inventory + pricing template companion.' },
    ],
  };
}

const para =
  'This section synthesizes the relevant evidence into an executive view, with explicit implications and a clear decision orientation for the steering committee to act upon without ambiguity or filler.';

export function goodDocument(): RenderableDeliverable {
  const sections = [
    { key: 'exec_overview', title: '1. Executive Overview', body: `SkyHarbor Air is sourcing application management across 7 towers [1] covering 320 applications [2]. ${para} The decision sought: approve issuance of the RFP and its commercial model.` },
    { key: 'scope_service_towers', title: '2. Scope & Service Towers', body: `In-scope towers per [1]; the estate spans 320 applications, 41 tier-1 [2]. ${para}` },
    { key: 'current_environment', title: '3. Current Environment', body: `The application estate [2] anchors vendor sizing. ${para}` },
    { key: 'sla_kpi', title: '4. SLA / KPI Schedule', body: `Mainframe availability target is 99.9% monthly [3]. ${para}` },
    { key: 'transition', title: '5. Transition & Cutover', body: `[CLIENT TO COMPLETE: transition constraints]. A standard phased approach with KT and parallel run applies. ${para}` },
    { key: 'pricing_commercial', title: '6. Pricing & Commercial Model', body: `[ASSUMPTION TO VALIDATE: resource-unit pricing with a productivity glidepath]. ${para}` },
    { key: 'evaluation_criteria', title: '7. Evaluation Criteria', body: `[CLIENT TO COMPLETE: final evaluation weights]. A weighted model is proposed. ${para}` },
    { key: 'recommendation', title: '8. Recommendation & Decision', body: `We recommend approval to issue the RFP. ${para} The ask is a go decision at the next steering committee.` },
  ];
  return {
    title: 'SkyHarbor Air — AMS / IT Outsourcing RFP',
    subtitle: 'Board-grade sourcing package',
    clientDisplayName: 'SkyHarbor Air',
    initiativeDisplayName: 'AMS / IT Outsourcing 2026',
    generatedSections: sections.map((s) => ({ key: s.key, title: s.title, bodyMarkdown: s.body, groundingMode: 'mixed' as const, citationsUsed: [] })),
    tables: [
      { key: 'application_inventory', title: 'Application Inventory', columns: ['App', 'Criticality', 'Tower'], rows: [['Reservations Core', 'tier1', 'App Mgmt']], targetFormat: 'xlsx' },
      { key: 'risk_register', title: 'Risks, Issues & Dependencies', columns: ['Item', 'Type', 'Impact', 'Owner', 'Mitigation'], rows: [['Transition window', 'risk', 'high', 'CIO', 'Phased KT']], targetFormat: 'docx' },
    ],
    exhibits: [{ key: 'tower_scope_map', title: 'Service Tower Scope Map', kind: 'matrix', description: 'Towers × services.', targetFormat: 'xlsx' }],
    sourceRegister: [
      { citationNumber: 1, label: 'Service tower scope', evidenceFamily: 'service_tower_scope', confidence: 'high', asOf: 'FY2026' },
      { citationNumber: 2, label: 'Application inventory', evidenceFamily: 'application_inventory', confidence: 'high', asOf: 'FY2026' },
      { citationNumber: 3, label: 'SLA baseline', evidenceFamily: 'sla_baseline', confidence: 'high', asOf: 'FY2026' },
    ],
    assumptions: [{ key: 'commercial_model', statement: 'Resource-unit pricing with a productivity glidepath.', basis: 'Standard for enterprise AMS.', mustValidate: true }],
    clientCompleteChecklist: [
      { key: 'evaluation_final_weights', label: 'Final evaluation weights', owner: 'procurement', reason: 'procurement_signoff', placeholderText: '[CLIENT TO COMPLETE]' },
    ],
    recommendation: 'We recommend the steering committee approve issuance of the AMS RFP with the scope, SLA framework, and resource-unit commercial model described, subject to legal and procurement completing the marked client-to-complete items before release.',
    nextActions: ['Confirm evaluation weights', 'Legal to complete contract positions', 'Issue RFP'],
  };
}
