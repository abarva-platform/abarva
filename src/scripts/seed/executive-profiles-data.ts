import type { TenantKey } from './seed-wave-lib';

export interface ExecutiveCareerEntry {
  id: string;
  ordinal: number;
  role: string;
  company: string;
  tenureStart?: string | null;
  tenureEnd?: string | null;
  notableAccomplishments?: string[];
  exitContext?: 'promotion' | 'lateral' | 'departure' | 'retirement' | 'company_exit' | null;
}

export interface ExecutivePublicStatement {
  id: string;
  ordinal: number;
  statementSummary: string;
  source: string;
  statementDate?: string | null;
  topicTags: string[];
  commitmentQuality: 'directional' | 'specific' | 'quantified';
}

export interface ExecutivePersonaOverrides {
  usePreferredNameInGreetings: boolean;
  specificFramesToOpenWith: string[];
  topicsToLeadWith: string[];
  sensitivitiesToAcknowledge: string[];
  avoidFramings: string[];
}

export interface ExecutiveProfileSeed {
  id: string;
  profileType: 'real_world' | 'composite_tenant';
  tenantKey?: TenantKey;
  personName?: string | null;
  fullName: string;
  preferredName: string;
  pronouns?: string | null;
  currentRole: string;
  currentCompany: string;
  currentTenureStart?: string | null;
  currentRemit: string;
  reportingStructure: Record<string, unknown>;
  strategicPrioritiesPersonallyOwned: string[];
  initiativesPersonallySponsored: string[];
  communicationStyle: Record<string, unknown>;
  decisionPatterns: Record<string, unknown>;
  knownPriorities: Array<Record<string, unknown>>;
  knownConstraints: Array<Record<string, unknown>>;
  influentialVoices: Array<Record<string, unknown>>;
  abarvaRelationshipHistory: Record<string, unknown>;
  sourceMaterial: Array<Record<string, unknown>>;
  reasoningScopeId: string;
  disclosureScopeId: string;
  profileUseStatement: string;
  profileNonUseStatement: string;
  humanReviewedBy: string;
  humanReviewedAt: string;
  confidence: 'high' | 'medium' | 'low';
  metadata: Record<string, unknown>;
  careerHistory: ExecutiveCareerEntry[];
  publicStatements: ExecutivePublicStatement[];
  personaOverrides?: ExecutivePersonaOverrides | null;
}

export interface AccessScopeSeedRow {
  id: string;
  tenantKey?: TenantKey;
  summary: string;
  scopeType: 'broad' | 'program' | 'role' | 'maestro' | 'regulatory_restricted';
  programIds: string[];
  roleFilter: string[];
  maestroFilter: string[];
  outputModeFilter: 'chat_only' | 'artifacts_only' | 'both' | 'reasoning_only';
  regulatoryConstraints: string[];
  conditions: string[];
  auditRequired: boolean;
  scopePayload: Record<string, unknown>;
}

export const EXECUTIVE_PROFILE_ACCESS_SCOPES: AccessScopeSeedRow[] = [
  {
    id: 'exec_profile_scope_keystone_tenant',
    tenantKey: 'keystone',
    summary: 'Keystone-tenant executive profile access for composite maestro reasoning and disclosure.',
    scopeType: 'broad',
    programIds: [],
    roleFilter: [],
    maestroFilter: ['program_maestro'],
    outputModeFilter: 'both',
    regulatoryConstraints: [],
    conditions: ['tenant_bounded'],
    auditRequired: true,
    scopePayload: { profile_scope: 'composite_tenant', tenant: 'keystone' },
  },
  {
    id: 'exec_profile_scope_apex_tenant',
    tenantKey: 'apex',
    summary: 'Apex-tenant executive profile access for composite maestro reasoning and disclosure.',
    scopeType: 'broad',
    programIds: [],
    roleFilter: [],
    maestroFilter: ['program_maestro'],
    outputModeFilter: 'both',
    regulatoryConstraints: [],
    conditions: ['tenant_bounded'],
    auditRequired: true,
    scopePayload: { profile_scope: 'composite_tenant', tenant: 'apex' },
  },
  {
    id: 'exec_profile_scope_meridian_tenant',
    tenantKey: 'meridian',
    summary: 'Meridian-tenant executive profile access for composite maestro reasoning and disclosure.',
    scopeType: 'broad',
    programIds: [],
    roleFilter: [],
    maestroFilter: ['program_maestro'],
    outputModeFilter: 'both',
    regulatoryConstraints: ['HIPAA'],
    conditions: ['tenant_bounded'],
    auditRequired: true,
    scopePayload: { profile_scope: 'composite_tenant', tenant: 'meridian' },
  },
  {
    id: 'exec_profile_scope_first_capital_tenant',
    tenantKey: 'first_capital',
    summary: 'First Capital-tenant executive profile access for composite maestro reasoning and disclosure.',
    scopeType: 'broad',
    programIds: [],
    roleFilter: [],
    maestroFilter: ['program_maestro'],
    outputModeFilter: 'both',
    regulatoryConstraints: ['GLBA'],
    conditions: ['tenant_bounded'],
    auditRequired: true,
    scopePayload: { profile_scope: 'composite_tenant', tenant: 'first_capital' },
  },
];

export const COMPOSITE_EXECUTIVE_PROFILES: ExecutiveProfileSeed[] = [
  {
    id: 'c2eddbb9-0a44-4b8a-b375-8ae887c6a301',
    profileType: 'composite_tenant',
    tenantKey: 'keystone',
    personName: 'Jonathan Aldridge',
    fullName: 'Jonathan Aldridge',
    preferredName: 'Jonathan',
    pronouns: 'he/him',
    currentRole: 'EVP Chief Customer and Technology Officer',
    currentCompany: 'Keystone Energy Holdings',
    currentTenureStart: '2026-02-01',
    currentRemit: 'Leads the newly combined customer and technology organization spanning customer strategy, enterprise technology, cyber, data, and digital transformation.',
    reportingStructure: {
      reports_to: 'Marcus Kittrell',
      direct_reports_count: 6,
      organizational_scope: 'Combined customer strategy, customer operations, enterprise IT, cybersecurity, data and analytics, digital channels, and enterprise architecture',
    },
    strategicPrioritiesPersonallyOwned: [
      'customer-technology alignment',
      'post-ai-deployment integration',
      'platform consolidation',
      'cybersecurity maturation',
    ],
    initiativesPersonallySponsored: [
      'phase-4 integrated customer and technology transformation',
      'enterprise ai platform and governance',
      'digital self-service modernization',
    ],
    communicationStyle: {
      preferred_modality: 'written_brief',
      response_cadence: 'same_day',
      information_density: 'dense',
      evidence_preference: 'quantitative',
      decision_time_horizon: 'deliberate',
      meeting_style: 'problem_first',
      written_style_observations: ['measured', 'systems-oriented', 'operator voice'],
    },
    decisionPatterns: {
      risk_tolerance: 'balanced',
      horizon_preference: 'medium_term',
      consensus_building: 'driver',
      pushback_patterns: ['under-specified proposals', 'vendor-led framing without operator consequences'],
      acceleration_patterns: ['operator-focused platform thinking', 'specific implementation milestones'],
      typical_first_questions: ['What specific problem are we solving?', 'How does this fit the existing operating model?', 'What is the first operator story?'],
    },
    knownPriorities: [
      { priority_description: 'Customer and technology alignment as an operating principle', source: 'Keystone comprehensive seed', confidence: 'high' },
      { priority_description: 'Post-AI-deployment integration over AI theater', source: 'Executive profile system Part 4', confidence: 'high' },
      { priority_description: 'Platform consolidation with workforce enablement', source: 'Executive profile system Part 4', confidence: 'high' },
    ],
    knownConstraints: [
      { constraint_description: 'Role is newly created and needs early proof of value', source: 'Keystone comprehensive seed', confidence: 'high' },
      { constraint_description: 'NERC CIP and multi-jurisdictional operating complexity shape every technology move', source: 'Keystone comprehensive seed', confidence: 'high' },
    ],
    influentialVoices: [
      { voice_description: 'Reports directly to CEO Marcus Kittrell and must reconcile customer-service and IT cultures quickly', source: 'Keystone comprehensive seed' },
    ],
    abarvaRelationshipHistory: {},
    sourceMaterial: [
      { source_type: 'article', source_reference: 'keystone-energy-holdings-comprehensive-seed.md §4.4', ingestion_date: '2026-04-21', confidence: 'high' },
      { source_type: 'linkedin_post', source_reference: 'public framing on post-AI-deployment integration', ingestion_date: '2026-04-21', confidence: 'medium' },
    ],
    reasoningScopeId: 'exec_profile_scope_keystone_tenant',
    disclosureScopeId: 'exec_profile_scope_keystone_tenant',
    profileUseStatement: 'Composite-tenant personalization for Keystone demos, sponsor briefings, and style-aware program interactions.',
    profileNonUseStatement: 'Not for cross-tenant leakage, psychological profiling, or disclosure outside Keystone-scoped work.',
    humanReviewedBy: 'codex',
    humanReviewedAt: '2026-04-21T20:00:00Z',
    confidence: 'high',
    metadata: { analog_to_real_world_profile: 'Tim Peterson', source_spec: 'executive-profile-system.md' },
    careerHistory: [
      {
        id: '30c4c328-9794-4930-8fd9-2578514b5f10',
        ordinal: 1,
        role: 'SVP, Chief Information Officer and Chief Technology Officer',
        company: 'Upper Midwest regional utility',
        notableAccomplishments: ['Led large-scale grid modernization and billing upgrades'],
        exitContext: 'promotion',
      },
      {
        id: 'f08a39f7-dd54-4f8d-ab51-9ee05d6e1430',
        ordinal: 2,
        role: 'Chief Information Officer',
        company: 'Optum',
        notableAccomplishments: ['Ran large multi-function technology teams in a regulated domain'],
        exitContext: 'lateral',
      },
    ],
    publicStatements: [
      {
        id: '0a72e4fb-6fa5-4e63-95a2-cf78a2da784c',
        ordinal: 1,
        statementSummary: 'The harder work after AI deployment is making it add up inside the operating model.',
        source: 'LinkedIn post / utility-technology public framing',
        statementDate: '2026-02-15',
        topicTags: ['ai integration', 'operating model', 'platform strategy'],
        commitmentQuality: 'specific',
      },
    ],
    personaOverrides: {
      usePreferredNameInGreetings: true,
      specificFramesToOpenWith: ['customer-technology combined-org framing', 'operator-focused platform modernization'],
      topicsToLeadWith: ['customer experience transformation', 'platform consolidation', 'multi-jurisdictional complexity'],
      sensitivitiesToAcknowledge: ['regulatory complexity', 'NERC CIP posture', 'new-role proof points'],
      avoidFramings: ['generic digital transformation', 'cutting-edge AI demo theater'],
    },
  },
  {
    id: '5d1ec9f4-0bd9-4b5f-bd73-87724caf17bc',
    profileType: 'composite_tenant',
    tenantKey: 'apex',
    personName: 'Karel Jensen',
    fullName: 'Karel Jensen',
    preferredName: 'Karel',
    pronouns: 'she/her',
    currentRole: 'Chief Marketing and Customer Officer',
    currentCompany: 'Apex Retail Group',
    currentTenureStart: '2024-02-01',
    currentRemit: 'Owns brand marketing, customer segmentation, loyalty strategy, customer analytics, and the commercial story behind customer experience transformation.',
    reportingStructure: {
      reports_to: 'Vincent Okafor',
      direct_reports_count: 5,
      organizational_scope: 'Marketing, loyalty strategy, customer analytics, and omnichannel customer-experience agenda',
    },
    strategicPrioritiesPersonallyOwned: [
      'apex plus loyalty evolution',
      'customer lifetime value optimization',
      'omnichannel customer experience cohesion',
    ],
    initiativesPersonallySponsored: [
      'loyalty program 2.0',
      'customer data platform consolidation',
      'customer experience transformation',
    ],
    communicationStyle: {
      preferred_modality: 'video',
      response_cadence: 'same_day',
      information_density: 'moderate',
      evidence_preference: 'mixed',
      decision_time_horizon: 'fast_decisive',
      meeting_style: 'structured_agenda',
      written_style_observations: ['polished', 'strategic', 'comfortable moving between story and metrics'],
    },
    decisionPatterns: {
      risk_tolerance: 'balanced',
      horizon_preference: 'medium_term',
      consensus_building: 'driver',
      pushback_patterns: ['capability positioning without customer-outcome grounding', 'brand claims unsupported by commercial rigor'],
      acceleration_patterns: ['customer-insight framing', 'clear commercial upside', 'loyalty and CLV linkages'],
      typical_first_questions: ['What changes for the customer?', 'What does this do to loyalty economics?', 'How do we prove the lift?'],
    },
    knownPriorities: [
      { priority_description: 'Loyalty program economics and customer lifetime value improvement', source: 'Apex comprehensive seed', confidence: 'high' },
      { priority_description: 'Customer-data infrastructure modernization to improve segmentation', source: 'Apex comprehensive seed', confidence: 'high' },
      { priority_description: 'Commercially rigorous customer-experience differentiation', source: 'Apex comprehensive seed', confidence: 'high' },
    ],
    knownConstraints: [
      { constraint_description: 'Loyalty economics are under scrutiny from finance', source: 'Apex comprehensive seed', confidence: 'high' },
      { constraint_description: 'Customer-data fragmentation limits segmentation sophistication', source: 'Apex comprehensive seed', confidence: 'high' },
    ],
    influentialVoices: [
      { voice_description: 'Works closely with Priya Sethi and Evan Soriano on digital and data-linked customer programs', source: 'Apex comprehensive seed' },
    ],
    abarvaRelationshipHistory: {},
    sourceMaterial: [
      { source_type: 'article', source_reference: 'apex-retail-group-comprehensive-seed.md §4.9', ingestion_date: '2026-04-21', confidence: 'high' },
    ],
    reasoningScopeId: 'exec_profile_scope_apex_tenant',
    disclosureScopeId: 'exec_profile_scope_apex_tenant',
    profileUseStatement: 'Composite-tenant personalization for Apex sponsor briefings, loyalty and CX program conversations, and demo calibration.',
    profileNonUseStatement: 'Not for cross-tenant disclosure, not for inventing personal traits beyond observed public/business context.',
    humanReviewedBy: 'codex',
    humanReviewedAt: '2026-04-21T20:00:00Z',
    confidence: 'high',
    metadata: {
      source_spec: 'executive-profile-system.md',
      spec_name_conflict: 'Executive-profile-system listed Marcus Whitfield; current authoritative Apex seed uses Karel Jensen as the customer/loyalty executive.',
    },
    careerHistory: [
      {
        id: '1c62ce70-6251-42de-9888-6b2f604d84be',
        ordinal: 1,
        role: 'Chief Marketing Officer',
        company: 'Global beverage brand',
        notableAccomplishments: ['Led large-scale brand and customer marketing agenda'],
        exitContext: 'lateral',
      },
      {
        id: 'ef8ad321-0f0f-4b77-84e6-8c2b1dc2c49c',
        ordinal: 2,
        role: 'Marketing leader',
        company: 'Luxury brand',
        notableAccomplishments: ['Built multilingual, premium brand positioning muscle'],
        exitContext: 'lateral',
      },
    ],
    publicStatements: [
      {
        id: '93f4f418-f925-4b09-8651-8e9b1a451118',
        ordinal: 1,
        statementSummary: 'Customer and loyalty programs need commercial rigor, not just experience rhetoric.',
        source: 'Apex profile-derived commercial positioning',
        topicTags: ['loyalty', 'customer analytics', 'brand differentiation'],
        commitmentQuality: 'directional',
      },
    ],
    personaOverrides: {
      usePreferredNameInGreetings: true,
      specificFramesToOpenWith: ['customer insights and loyalty economics', 'commercially grounded experience improvement'],
      topicsToLeadWith: ['customer experience', 'loyalty evolution', 'customer data fragmentation'],
      sensitivitiesToAcknowledge: ['finance scrutiny on loyalty economics', 'brand-differentiation pressure'],
      avoidFramings: ['technology-first framing without customer outcome', 'generic retail transformation language'],
    },
  },
  {
    id: '69bfd954-4f3d-41a6-84a4-ee8d70ed5e32',
    profileType: 'composite_tenant',
    tenantKey: 'meridian',
    personName: 'Linda Chen-Winters',
    fullName: 'Linda Chen-Winters',
    preferredName: 'Linda',
    pronouns: 'she/her',
    currentRole: 'President, Meridian Health Plans',
    currentCompany: 'Meridian Health System',
    currentTenureStart: '2021-01-01',
    currentRemit: 'Leads Meridian Health Plans across commercial, marketplace, Medicare Advantage, and Medicaid managed care lines with accountability for payer-side economics and growth.',
    reportingStructure: {
      reports_to: 'Meridian executive committee',
      direct_reports_count: 4,
      organizational_scope: 'Integrated payer business inside the broader provider-payer system',
    },
    strategicPrioritiesPersonallyOwned: [
      'medicare advantage growth and quality',
      'commercial aco launch',
      'member retention',
      'health-plan-provider economics',
    ],
    initiativesPersonallySponsored: [
      'value-based care progression',
      'payer-side operations excellence',
      'meridian health plans growth agenda',
    ],
    communicationStyle: {
      preferred_modality: 'written_brief',
      response_cadence: '48_hour',
      information_density: 'dense',
      evidence_preference: 'quantitative',
      decision_time_horizon: 'consultative_slow',
      meeting_style: 'structured_agenda',
      written_style_observations: ['clinically and financially literate', 'tight meeting operator', 'policy-aware'],
    },
    decisionPatterns: {
      risk_tolerance: 'balanced',
      horizon_preference: 'medium_term',
      consensus_building: 'convener',
      pushback_patterns: ['payer proposals without economics', 'care-model changes without quality evidence'],
      acceleration_patterns: ['clinical-financial integration', 'member-retention leverage', 'evidence-backed VBC pathways'],
      typical_first_questions: ['What does this do to plan economics?', 'How does this affect quality and retention?', 'Where are the operational dependencies?'],
    },
    knownPriorities: [
      { priority_description: 'VBC progression on the payer side', source: 'Meridian comprehensive seed', confidence: 'high' },
      { priority_description: 'MA star-rating and member retention performance', source: 'Meridian comprehensive seed', confidence: 'high' },
      { priority_description: 'Tighter health-plan and provider economics alignment', source: 'Meridian comprehensive seed', confidence: 'high' },
    ],
    knownConstraints: [
      { constraint_description: 'CMS audit findings touched Medicare Advantage operations in her scope', source: 'Meridian comprehensive seed', confidence: 'high' },
      { constraint_description: 'Competitive pressure from national plans entering local markets', source: 'Meridian comprehensive seed', confidence: 'high' },
    ],
    influentialVoices: [
      { voice_description: 'Regularly creates productive tension with physician leaders over utilization-management and formulary decisions', source: 'Meridian comprehensive seed' },
    ],
    abarvaRelationshipHistory: {},
    sourceMaterial: [
      { source_type: 'article', source_reference: 'meridian-health-system-comprehensive-seed.md §4.3', ingestion_date: '2026-04-21', confidence: 'high' },
    ],
    reasoningScopeId: 'exec_profile_scope_meridian_tenant',
    disclosureScopeId: 'exec_profile_scope_meridian_tenant',
    profileUseStatement: 'Composite-tenant personalization for Meridian payer-side conversations, VBC planning, and executive sponsor briefings.',
    profileNonUseStatement: 'Not for use outside Meridian-scoped work and not for disclosing profile mechanics in conversations.',
    humanReviewedBy: 'codex',
    humanReviewedAt: '2026-04-21T20:00:00Z',
    confidence: 'high',
    metadata: { source_spec: 'executive-profile-system.md' },
    careerHistory: [
      {
        id: '44f79e6e-749f-494b-9561-d36f8f229f24',
        ordinal: 1,
        role: 'Chief Operating Officer',
        company: 'Meridian Health Plans',
        tenureStart: '2017-01-01',
        tenureEnd: '2021-01-01',
        notableAccomplishments: ['Scaled payer operations before promotion to president'],
        exitContext: 'promotion',
      },
      {
        id: 'f2684e29-a75e-47cb-b9d1-8cd25f6c86f7',
        ordinal: 2,
        role: 'Senior health-plan leader',
        company: 'Large national payer',
        notableAccomplishments: ['Built commercial and Medicare Advantage operating depth'],
        exitContext: 'lateral',
      },
    ],
    publicStatements: [
      {
        id: '2473e1c0-a6ab-4fee-88a0-e70a31e84363',
        ordinal: 1,
        statementSummary: 'Integrated payer-provider systems win when clinical quality and financial discipline are treated as the same operating conversation.',
        source: 'Meridian composite executive framing',
        topicTags: ['clinical-financial integration', 'member retention', 'value-based care'],
        commitmentQuality: 'directional',
      },
    ],
    personaOverrides: {
      usePreferredNameInGreetings: false,
      specificFramesToOpenWith: ['clinical-financial integration', 'payer-side VBC economics'],
      topicsToLeadWith: ['MA quality', 'member retention', 'health-plan-provider economics'],
      sensitivitiesToAcknowledge: ['HIPAA compliance as baseline', 'CMS audit exposure', 'member economics'],
      avoidFramings: ['tech-first healthcare hype', 'purely clinical framing without economics'],
    },
  },
  {
    id: '85b3bd6f-f213-49c5-a4d4-ef13e6955410',
    profileType: 'composite_tenant',
    tenantKey: 'first_capital',
    personName: 'Elaine Burakovsky-Park',
    fullName: 'Elaine Burakovsky-Park',
    preferredName: 'Elaine',
    pronouns: 'she/her',
    currentRole: 'Chief Financial Officer',
    currentCompany: 'First Capital Financial',
    currentTenureStart: '2025-05-01',
    currentRemit: 'Runs enterprise finance, investor relations, capital management, and financial infrastructure for regulatory and business reporting.',
    reportingStructure: {
      reports_to: 'First Capital executive committee',
      direct_reports_count: 5,
      organizational_scope: 'Enterprise finance, investor relations, capital management, and regulatory financial reporting',
    },
    strategicPrioritiesPersonallyOwned: [
      'ccar preparation',
      'capital allocation framework refinement',
      'investor communication on AI investment',
      'efficiency ratio discipline',
    ],
    initiativesPersonallySponsored: [
      'capital management modernization',
      'financial reporting infrastructure',
      'regulatory exam readiness',
    ],
    communicationStyle: {
      preferred_modality: 'written_brief',
      response_cadence: '48_hour',
      information_density: 'dense',
      evidence_preference: 'quantitative',
      decision_time_horizon: 'deliberate',
      meeting_style: 'data_first',
      written_style_observations: ['technical', 'precise', 'audit-shaped rigor'],
    },
    decisionPatterns: {
      risk_tolerance: 'conservative',
      horizon_preference: 'long_term',
      consensus_building: 'delegator',
      pushback_patterns: ['financial claims without support', 'capital asks without regulatory grounding'],
      acceleration_patterns: ['balance-sheet clarity', 'regulatory-safe efficiency gains', 'thorough scenario support'],
      typical_first_questions: ['What does this do to capital?', 'What is the regulatory implication?', 'How do we defend the assumptions?'],
    },
    knownPriorities: [
      { priority_description: 'Capital efficiency and CCAR preparation', source: 'First Capital comprehensive seed', confidence: 'high' },
      { priority_description: 'Investor communication on the AI investment and activist dimension', source: 'First Capital comprehensive seed', confidence: 'high' },
      { priority_description: 'Financial infrastructure modernization with regulatory rigor', source: 'First Capital comprehensive seed', confidence: 'high' },
    ],
    knownConstraints: [
      { constraint_description: 'Efficiency-ratio narrative remains under pressure', source: 'First Capital comprehensive seed', confidence: 'high' },
      { constraint_description: 'Balancing capital return commitments with organic growth funding remains politically sensitive', source: 'First Capital comprehensive seed', confidence: 'high' },
    ],
    influentialVoices: [
      { voice_description: 'Works closely with regulatory, risk, and investor-relations functions; rigor is a credibility filter for new programs', source: 'First Capital comprehensive seed' },
    ],
    abarvaRelationshipHistory: {},
    sourceMaterial: [
      { source_type: 'article', source_reference: 'first-capital-financial-comprehensive-seed.md §4.3', ingestion_date: '2026-04-21', confidence: 'high' },
    ],
    reasoningScopeId: 'exec_profile_scope_first_capital_tenant',
    disclosureScopeId: 'exec_profile_scope_first_capital_tenant',
    profileUseStatement: 'Composite-tenant personalization for First Capital finance- and risk-shaped conversations and sponsor briefings.',
    profileNonUseStatement: 'Not for disclosure outside First Capital scope and not for turning profile data into generic persuasion tactics.',
    humanReviewedBy: 'codex',
    humanReviewedAt: '2026-04-21T20:00:00Z',
    confidence: 'high',
    metadata: {
      source_spec: 'executive-profile-system.md',
      spec_name_conflict: 'Executive-profile-system listed Daniel Kovač for First Capital; current authoritative First Capital seed uses Elaine Burakovsky-Park.',
    },
    careerHistory: [
      {
        id: '98a21931-69fe-487a-b1f3-f677ebc94a5d',
        ordinal: 1,
        role: 'Partner, Financial Services Practice',
        company: 'Big Four accounting firm',
        notableAccomplishments: ['Led financial-services practice work across regulatory and reporting programs'],
        exitContext: 'lateral',
      },
      {
        id: '7de09f9e-fa07-4859-b8a2-23c96b5a7485',
        ordinal: 2,
        role: 'Bank finance leader',
        company: 'Large money-center institution',
        notableAccomplishments: ['Built finance and reporting depth in regulated banking'],
        exitContext: 'lateral',
      },
    ],
    publicStatements: [
      {
        id: 'd529e63e-fd16-4ef7-8990-ff60c2ed92b6',
        ordinal: 1,
        statementSummary: 'The AI-investment narrative must land with investors and regulators, not just operators.',
        source: 'First Capital composite finance framing',
        topicTags: ['capital management', 'investor relations', 'regulatory posture'],
        commitmentQuality: 'specific',
      },
    ],
    personaOverrides: {
      usePreferredNameInGreetings: true,
      specificFramesToOpenWith: ['financial performance and regulatory posture', 'balance-sheet-safe modernization'],
      topicsToLeadWith: ['capital efficiency', 'investor narrative', 'regulatory financial reporting'],
      sensitivitiesToAcknowledge: ['CCAR and exam cycle', 'capital-return tension', 'proof requirements'],
      avoidFramings: ['growth claims without numbers', 'operator enthusiasm without balance-sheet grounding'],
    },
  },
];

export const REAL_WORLD_EXECUTIVE_PROFILES_PENDING_ETHICS: Array<Pick<ExecutiveProfileSeed, 'id' | 'fullName' | 'profileType' | 'metadata'>> = [
  {
    id: 'e8277566-f510-47d2-a8be-b7f241e072ad',
    fullName: 'Prat Vemana',
    profileType: 'real_world',
    metadata: { ethics_review_required: true },
  },
  {
    id: 'b9b61439-91cf-4700-9b36-efcd6c1c760b',
    fullName: 'Shail Jain',
    profileType: 'real_world',
    metadata: { ethics_review_required: true },
  },
  {
    id: '7beff229-4b99-4b64-8e9b-9c78d0a78181',
    fullName: 'Tim Peterson',
    profileType: 'real_world',
    metadata: { ethics_review_required: true },
  },
  {
    id: 'd0c26cb6-d0d9-439d-95d7-7d259046d8f4',
    fullName: 'Ranjan Goswami',
    profileType: 'real_world',
    metadata: { ethics_review_required: true },
  },
];
