import type {
  AntiPattern,
  BriefData,
  MapData,
  Pattern,
  Provenance,
  Regulatory,
  UseCase,
  Vendor,
} from '../types';

const TENANT_BRAND_BLUE = '#1E3A8A';

const PROV = (sources: string[], date = '2026-Q1'): Provenance => ({
  primarySources: sources.map((source) => ({
    source,
    currencyDate: date,
    reliability: 'HIGH' as const,
  })),
  curationPass: 'first-capital-bootstrap-2026-05-10',
});

function makeUseCase(input: {
  id: string;
  name: string;
  short?: string;
  office: UseCase['office'];
  domainTags: string[];
  problemStatement: string;
  framing: string;
  value: string;
  ttv: string;
  lifecycleStage: UseCase['lifecycleStage'];
  successPatterns: string[];
  antiPatterns?: string[];
  vendors: UseCase['vendorLandscape'];
  regulatory: string[];
}): UseCase {
  return {
    id: input.id,
    name: input.name,
    displayNameShort: input.short,
    industry: 'finserv',
    office: input.office,
    domainTags: input.domainTags,
    problemStatement: input.problemStatement,
    artOfPossibleFraming: input.framing,
    businessValueRanges: {
      perCompanySize: { mid: input.value, large: input.value },
      timeToValueMonths: input.ttv,
      confidenceBand: 'MED',
    },
    lifecycleStage: input.lifecycleStage,
    lifecycleBasis: 'Regional banking AI pattern and First Capital tenant substrate',
    successPatterns: input.successPatterns.map((patternId) => ({ patternId, relevance: 'HIGH' as const })),
    antiPatterns: input.antiPatterns?.map((apId) => ({ apId, severity: 'HIGH' as const })),
    vendorLandscape: input.vendors,
    siLandscape: {
      crediblePractice: ['Accenture Financial Services', 'Deloitte Banking', 'EY Technology Risk'],
      emergingPractice: ['Boutique FedNow integrators', 'Model-risk specialty firms'],
    },
    regulatoryContext: { applicable: input.regulatory },
    provenance: PROV(['First Capital seeded tenant profile', 'Banking AI pattern corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  };
}

const USE_CASES: Record<string, UseCase> = {
  'UC-FS-MIDDLE-001': makeUseCase({
    id: 'UC-FS-MIDDLE-001',
    name: 'FedNow Payment Rails Modernization',
    short: 'FedNow modernization',
    office: 'middle',
    domainTags: ['payments', 'core banking', 'commercial deposits'],
    problemStatement:
      'Commercial clients are pressuring First Capital for real-time payment rails while the core architecture still depends on aging middleware.',
    framing:
      'FedNow is not just a payments feature. For First Capital it is a deposit-retention and regulatory-resilience move that forces the core API layer, payment operations, and fraud controls to modernize together.',
    value: '$8M-$22M annual',
    ttv: '6-10',
    lifecycleStage: 'scaling',
    successPatterns: ['P-FS-004', 'P-FS-011'],
    antiPatterns: ['AP-FS-002'],
    vendors: {
      incumbent: ['FIS', 'Q2'],
      challenger: ['Finzly', 'Volante'],
      emerging: ['Tassat'],
    },
    regulatory: ['REG-FS-001', 'REG-FS-004'],
  }),
  'UC-FS-MIDDLE-002': makeUseCase({
    id: 'UC-FS-MIDDLE-002',
    name: 'Model Risk Governance for ML',
    short: 'Model risk governance',
    office: 'middle',
    domainTags: ['SR 11-7', 'model inventory', 'controls'],
    problemStatement:
      'AI and ML models are expanding faster than model-risk documentation, validation cadence, and ownership rights.',
    framing:
      'The highest-confidence governance move is to make model-risk management an enablement layer, not a blocker. It should let compliant ML scale while stopping undocumented models from reaching production.',
    value: '$4M-$12M risk-adjusted',
    ttv: '4-8',
    lifecycleStage: 'mature',
    successPatterns: ['P-FS-001', 'P-FS-008'],
    antiPatterns: ['AP-FS-001'],
    vendors: {
      incumbent: ['SAS', 'IBM OpenPages'],
      challenger: ['ModelOp', 'Credo AI'],
      emerging: ['Fiddler AI'],
    },
    regulatory: ['REG-FS-002', 'REG-FS-003'],
  }),
  'UC-FS-FRONT-001': makeUseCase({
    id: 'UC-FS-FRONT-001',
    name: 'Digital Account Opening Recovery',
    short: 'Account opening recovery',
    office: 'front',
    domainTags: ['digital banking', 'onboarding', 'customer acquisition'],
    problemStatement:
      'Digital abandonment and mobile experience gaps are dragging acquisition while regional peers move toward lower-friction onboarding.',
    framing:
      'This is a customer-experience move with a data-quality tail. AI can recover drop-off only if identity proofing, application state, and branch follow-up are joined in one operating loop.',
    value: '$6M-$18M annual',
    ttv: '5-9',
    lifecycleStage: 'scaling',
    successPatterns: ['P-FS-006'],
    antiPatterns: ['AP-FS-005'],
    vendors: {
      incumbent: ['Q2', 'nCino'],
      challenger: ['Blend', 'Amount'],
      emerging: ['MANTL'],
    },
    regulatory: ['REG-FS-004'],
  }),
  'UC-FS-BACK-001': makeUseCase({
    id: 'UC-FS-BACK-001',
    name: 'Legacy Data Platform Rationalization',
    short: 'Data platform rationalization',
    office: 'back',
    domainTags: ['data platform', 'legacy modernization', 'FinOps'],
    problemStatement:
      'Legacy SQL Server, shadow SaaS, and fragmented data flows create cost drag and weaken the evidence base for AI and regulatory reporting.',
    framing:
      'The platform move should be scoped around the AI and regulatory decisions it unlocks. A generic migration program will sprawl; a decision-substrate program can pay back faster.',
    value: '$10M-$25M annual',
    ttv: '9-15',
    lifecycleStage: 'mature',
    successPatterns: ['P-FS-010'],
    antiPatterns: ['AP-FS-004'],
    vendors: {
      incumbent: ['Microsoft', 'Snowflake'],
      challenger: ['Databricks'],
      emerging: ['dbt Labs'],
    },
    regulatory: ['REG-FS-002'],
  }),
  'UC-FS-MIDDLE-003': makeUseCase({
    id: 'UC-FS-MIDDLE-003',
    name: 'AML Alert Triage Automation',
    short: 'AML triage',
    office: 'middle',
    domainTags: ['AML', 'fraud', 'operations'],
    problemStatement:
      'Manual alert review is expensive and creates examiner exposure when overrides and explanations are not traceable.',
    framing:
      'AML automation earns its keep only when the explanation trail is as strong as the productivity gain. Otherwise it creates a faster path to a model-risk finding.',
    value: '$5M-$14M annual',
    ttv: '6-12',
    lifecycleStage: 'scaling',
    successPatterns: ['P-FS-001'],
    antiPatterns: ['AP-FS-001'],
    vendors: {
      incumbent: ['NICE Actimize', 'SAS'],
      challenger: ['Feedzai', 'Featurespace'],
      emerging: ['Unit21'],
    },
    regulatory: ['REG-FS-002', 'REG-FS-003'],
  }),
};

const PATTERNS: Record<string, Pattern> = {
  'P-FS-004': {
    id: 'P-FS-004',
    name: 'Payment-rail modernization requires operations co-ownership',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      'Real-time payments succeed when technology, treasury operations, fraud, and commercial banking own the operating cutover together.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-MIDDLE-001'],
      observationCount: 'Regional bank payment-modernization cohort',
      confidence: 'HIGH',
    },
    quantifiedSignal: {
      withPattern: { metric: 'Operational cutover confidence', valueRange: 'high' },
      withoutPattern: { metric: 'Cutover rework risk', valueRange: 'material' },
      source: 'Banking payment-modernization pattern corpus',
      confidence: 'HIGH',
    },
    provenance: PROV(['Banking payment-modernization pattern corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'P-FS-001': {
    id: 'P-FS-001',
    name: 'SR 11-7 controls-first deployment',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      'Financial-services AI scales when validation, monitoring, explainability, and ownership are designed before production use.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-MIDDLE-002', 'UC-FS-MIDDLE-003'],
      observationCount: 'Model-risk governance pattern corpus',
      confidence: 'HIGH',
    },
    quantifiedSignal: {
      withPattern: { metric: 'Exam defensibility', valueRange: 'strong' },
      withoutPattern: { metric: 'Remediation exposure', valueRange: 'high' },
      source: 'SR 11-7 model-risk pattern corpus',
      confidence: 'HIGH',
    },
    provenance: PROV(['SR 11-7 model-risk pattern corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'P-FS-011': {
    id: 'P-FS-011',
    name: 'Core API wrapper before channel expansion',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      'Banks with aging cores should isolate a stable API wrapper before scaling real-time channel and payment use cases.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-MIDDLE-001', 'UC-FS-BACK-001'],
      observationCount: 'Core-modernization pattern corpus',
      confidence: 'MED',
    },
    provenance: PROV(['Core-modernization pattern corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'P-FS-006': {
    id: 'P-FS-006',
    name: 'Onboarding recovery loop',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      'Digital account-opening recovery works when identity proofing, application state, branch outreach, and product nudges are stitched together.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-FRONT-001'],
      observationCount: 'Digital banking conversion corpus',
      confidence: 'MED',
    },
    provenance: PROV(['Digital banking conversion corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'P-FS-010': {
    id: 'P-FS-010',
    name: 'Decision-substrate modernization',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'mixed',
    description:
      'Data-platform work earns executive support when tied to named decisions: model risk, payments, AML, digital onboarding, and regulatory reporting.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-BACK-001'],
      observationCount: 'Bank data-platform modernization corpus',
      confidence: 'MED',
    },
    provenance: PROV(['Bank data-platform modernization corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'P-FS-008': {
    id: 'P-FS-008',
    name: 'Central model inventory before AI expansion',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    patternType: 'success',
    description:
      'A central model inventory is the minimum control surface before a bank scales new LLM or ML-enabled workflows.',
    evidenceBasis: {
      observedInUseCases: ['UC-FS-MIDDLE-002'],
      observationCount: 'Model governance corpus',
      confidence: 'HIGH',
    },
    provenance: PROV(['Model governance corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
};

const ANTI_PATTERNS: Record<string, AntiPattern> = {
  'AP-FS-001': {
    id: 'AP-FS-001',
    name: 'Undocumented model drift',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    description:
      'Models enter production without validation lineage, monitoring thresholds, or named owners.',
    observedInUseCases: ['UC-FS-MIDDLE-002', 'UC-FS-MIDDLE-003'],
    observationCount: 'Model-risk governance pattern corpus',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Exam remediation risk', valueRange: 'high' },
      withoutAntiPattern: { metric: 'Exam remediation risk', valueRange: 'manageable' },
      source: 'SR 11-7 model-risk pattern corpus',
      confidence: 'HIGH',
    },
    earlySignals: [{ signal: 'No central model inventory', severity: 'HIGH' }],
    typicalRecovery: 'Create inventory, validation cadence, and owner map before new deployment.',
    provenance: PROV(['SR 11-7 model-risk pattern corpus']),
    lastRefreshed: '2026-05-10',
  },
  'AP-FS-002': {
    id: 'AP-FS-002',
    name: 'Core modernization theater',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    description:
      'A core-modernization program looks active but never clears the specific API, payment, and operating-control gates required by the business use case.',
    observedInUseCases: ['UC-FS-MIDDLE-001'],
    observationCount: 'Core banking modernization pattern corpus',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Business value delay', valueRange: '12-24 months' },
      withoutAntiPattern: { metric: 'Business value delay', valueRange: '6-10 months' },
      source: 'Core banking modernization pattern corpus',
      confidence: 'MED',
    },
    earlySignals: [{ signal: 'Architecture scope not tied to a named business cutover', severity: 'HIGH' }],
    typicalRecovery: 'Anchor scope to FedNow cutover, fraud controls, and commercial-deposit retention.',
    provenance: PROV(['Core banking modernization pattern corpus']),
    lastRefreshed: '2026-05-10',
  },
  'AP-FS-004': {
    id: 'AP-FS-004',
    name: 'Migration without decision owner',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    description:
      'Data-platform migrations overrun when no executive decision owner ties the work to regulatory, risk, or revenue outcomes.',
    observedInUseCases: ['UC-FS-BACK-001'],
    observationCount: 'Bank data-platform modernization corpus',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Overscope risk', valueRange: 'high' },
      withoutAntiPattern: { metric: 'Overscope risk', valueRange: 'moderate' },
      source: 'Bank data-platform modernization corpus',
      confidence: 'MED',
    },
    earlySignals: [{ signal: 'Platform roadmap framed as technology hygiene only', severity: 'MED' }],
    typicalRecovery: 'Tie migration waves to model-risk, payments, AML, and digital onboarding decisions.',
    provenance: PROV(['Bank data-platform modernization corpus']),
    lastRefreshed: '2026-05-10',
  },
  'AP-FS-005': {
    id: 'AP-FS-005',
    name: 'Channel fix without identity proofing',
    scope: 'industry_specific',
    applicableIndustries: ['finserv'],
    description:
      'Digital onboarding fixes underperform when identity proofing and application-state data are treated as separate workstreams.',
    observedInUseCases: ['UC-FS-FRONT-001'],
    observationCount: 'Digital banking conversion corpus',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Abandonment improvement', valueRange: 'limited' },
      withoutAntiPattern: { metric: 'Abandonment improvement', valueRange: 'material' },
      source: 'Digital banking conversion corpus',
      confidence: 'MED',
    },
    earlySignals: [{ signal: 'Branch follow-up cannot see abandoned digital application state', severity: 'MED' }],
    typicalRecovery: 'Join identity, application state, branch outreach, and product nudges in one loop.',
    provenance: PROV(['Digital banking conversion corpus']),
    lastRefreshed: '2026-05-10',
  },
};

const VENDORS: Record<string, Vendor> = {
  'V-FS-001': {
    id: 'V-FS-001',
    name: 'Finzly',
    productLines: [{ productName: 'Payment Hub', servesUseCases: ['UC-FS-MIDDLE-001'] }],
    vendorType: 'challenger',
    financialHealth: 'moderate',
    shareTrajectory: 'gaining',
    trajectorySignalBasis: 'Regional-bank FedNow enablement demand',
    contractPatterns: { pricingModels: ['implementation fee', 'transaction-linked pricing'] },
    provenance: PROV(['First Capital vendor substrate']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'V-FS-002': {
    id: 'V-FS-002',
    name: 'FIS',
    productLines: [{ productName: 'HORIZON core banking', servesUseCases: ['UC-FS-MIDDLE-001', 'UC-FS-BACK-001'] }],
    vendorType: 'incumbent',
    financialHealth: 'strong',
    shareTrajectory: 'holding',
    trajectorySignalBasis: 'Incumbent core relationship',
    provenance: PROV(['First Capital vendor substrate']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'V-FS-003': {
    id: 'V-FS-003',
    name: 'ModelOp',
    productLines: [{ productName: 'ModelOps Governance', servesUseCases: ['UC-FS-MIDDLE-002'] }],
    vendorType: 'challenger',
    financialHealth: 'moderate',
    shareTrajectory: 'gaining',
    trajectorySignalBasis: 'Model-risk governance category growth',
    provenance: PROV(['Financial services vendor corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'V-FS-004': {
    id: 'V-FS-004',
    name: 'Q2',
    productLines: [{ productName: 'Digital Banking Platform', servesUseCases: ['UC-FS-FRONT-001', 'UC-FS-MIDDLE-001'] }],
    vendorType: 'incumbent',
    financialHealth: 'strong',
    shareTrajectory: 'holding',
    trajectorySignalBasis: 'Existing digital banking footprint',
    provenance: PROV(['First Capital vendor substrate']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'V-FS-005': {
    id: 'V-FS-005',
    name: 'Databricks',
    productLines: [{ productName: 'Lakehouse Platform', servesUseCases: ['UC-FS-BACK-001'] }],
    vendorType: 'challenger',
    financialHealth: 'strong',
    shareTrajectory: 'gaining',
    trajectorySignalBasis: 'Banking ML and governance workloads',
    provenance: PROV(['Financial services data-platform corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'V-FS-006': {
    id: 'V-FS-006',
    name: 'NICE Actimize',
    productLines: [{ productName: 'AML and Fraud Suite', servesUseCases: ['UC-FS-MIDDLE-003'] }],
    vendorType: 'incumbent',
    financialHealth: 'strong',
    shareTrajectory: 'holding',
    trajectorySignalBasis: 'Established AML footprint',
    provenance: PROV(['Financial services vendor corpus']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
};

const REGULATORY: Record<string, Regulatory> = {
  'REG-FS-001': {
    id: 'REG-FS-001',
    name: 'FedNow operating controls',
    jurisdiction: 'United States',
    issuingBody: 'Federal Reserve',
    applicableIndustries: ['finserv'],
    summary: 'Real-time payment participation requires operational controls, fraud monitoring, and liquidity procedures.',
    keyRequirements: ['Payment operations controls', 'Fraud monitoring', 'Settlement and liquidity procedures'],
    provenance: PROV(['Federal Reserve FedNow operating materials']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'REG-FS-002': {
    id: 'REG-FS-002',
    name: 'SR 11-7 model risk management',
    jurisdiction: 'United States',
    issuingBody: 'Federal Reserve / OCC',
    applicableIndustries: ['finserv'],
    summary: 'Bank models require validation, governance, documentation, monitoring, and independent challenge.',
    keyRequirements: ['Model inventory', 'Validation', 'Monitoring', 'Independent challenge'],
    provenance: PROV(['SR 11-7 model risk management guidance']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'REG-FS-003': {
    id: 'REG-FS-003',
    name: 'OCC AI and model-risk examination posture',
    jurisdiction: 'United States',
    issuingBody: 'OCC',
    applicableIndustries: ['finserv'],
    summary: 'Examiners expect evidence that AI-enabled workflows are explainable, controlled, and monitored.',
    keyRequirements: ['Explainability', 'Audit trail', 'Control ownership'],
    provenance: PROV(['OCC supervision and model-risk materials']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
  'REG-FS-004': {
    id: 'REG-FS-004',
    name: 'Consumer financial data rights',
    jurisdiction: 'United States',
    issuingBody: 'CFPB',
    applicableIndustries: ['finserv'],
    summary: 'Customer-authorized data sharing raises API, consent, and data-control requirements for banks.',
    keyRequirements: ['Authorized data access', 'Consent records', 'API controls'],
    provenance: PROV(['CFPB consumer data rights materials']),
    lastRefreshed: '2026-05-10',
    refreshCadence: 'quarterly',
  },
};

export function getFirstCapitalMapData(): MapData {
  const nodes = [
    { id: 'UC-FS-MIDDLE-001', x: 28, y: 12, r: 22, engagementState: 'not_started' as const, score: 88 },
    { id: 'UC-FS-MIDDLE-002', x: 38, y: 20, r: 19, engagementState: 'in_flight' as const, initiativeDisplayId: 'FC-02', score: 84 },
    { id: 'UC-FS-FRONT-001', x: 52, y: 32, r: 17, engagementState: 'not_started' as const, score: 76 },
    { id: 'UC-FS-BACK-001', x: 62, y: 44, r: 18, engagementState: 'at_risk' as const, initiativeDisplayId: 'FC-07', score: 73 },
    { id: 'UC-FS-MIDDLE-003', x: 44, y: 40, r: 16, engagementState: 'not_started' as const, score: 70 },
  ];

  return {
    tenantName: 'First Capital Financial',
    tenantBrandColor: TENANT_BRAND_BLUE,
    industry: 'finserv',
    totalUseCases: nodes.length,
    inFlightCount: nodes.filter((n) => n.engagementState === 'in_flight').length,
    atRiskCount: nodes.filter((n) => n.engagementState === 'at_risk').length,
    candidateCount: nodes.filter((n) => n.engagementState === 'not_started').length,
    refreshedLabel: 'last 2026-Q1',
    whatChanged: [
      {
        entityId: 'REG-FS-002',
        entityType: 'regulatory',
        summary: 'SR 11-7 model-risk posture is binding for any ML expansion.',
        source: 'per model-risk corpus',
      },
      {
        entityId: 'UC-FS-MIDDLE-001',
        entityType: 'use_case',
        summary: 'FedNow modernization remains the strongest deposit-retention bet.',
        source: 'per First Capital tenant substrate',
      },
      {
        entityId: 'V-FS-001',
        entityType: 'vendor',
        summary: 'Payment hub vendors are credible, but core integration remains the gating risk.',
        source: 'per Source vendor substrate',
      },
    ],
    nodes: nodes.map((node) => ({
      ...node,
      useCase: USE_CASES[node.id]!,
    })),
    edges: [
      { fromUseCaseId: 'UC-FS-MIDDLE-001', toUseCaseId: 'UC-FS-BACK-001', basis: 'pattern_cooccurrence', patternId: 'P-FS-011' },
      { fromUseCaseId: 'UC-FS-MIDDLE-002', toUseCaseId: 'UC-FS-MIDDLE-003', basis: 'pattern_cooccurrence', patternId: 'P-FS-001' },
      { fromUseCaseId: 'UC-FS-FRONT-001', toUseCaseId: 'UC-FS-BACK-001', basis: 'anti_pattern_shared' },
    ],
    defaultSelectedId: 'UC-FS-MIDDLE-001',
  };
}

export function getFirstCapitalBriefData(): BriefData {
  return {
    tenantName: 'First Capital Financial',
    tenantBrandColor: TENANT_BRAND_BLUE,
    industry: 'finserv',
    composedAt: '2026-05-10T21:55:00Z',
    synthesis:
      "Sentinel's read for this quarter: FedNow payment modernization is the highest-urgency bet because it links deposit retention, core API modernization, and payment-ops controls. Model-risk governance is the second binding move; without it, new ML and AML automation create examiner exposure. Digital account-opening recovery is attractive, but it should not outrank the payment and control-plane work.",
    bets: [
      {
        rank: 1,
        useCase: USE_CASES['UC-FS-MIDDLE-001']!,
        score: 88,
        scoreFactors: [
          { name: 'Commercial deposit retention pressure', delta: 20 },
          { name: 'Real-time payments capability gap', delta: 18 },
          { name: 'Core API modernization dependency', delta: 15 },
          { name: 'Fraud and operations controls required', delta: 10 },
          { name: 'Executive urgency visible in tenant substrate', delta: 25 },
        ],
        engagementState: 'not_started',
        decision: {
          kind: 'originate',
          label: 'Originate now',
          reason: 'Deposit risk · core modernization · control-plane urgency',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-FS-004']!,
            quantifiedRow: {
              withLabel: '+ Ops co-owned',
              withoutLabel: '- Tech-only',
              description: 'Payment-rail modernization needs treasury ops, fraud, commercial banking, and CIO ownership together.',
              source: 'Banking payment-modernization pattern corpus',
            },
          },
          {
            pattern: PATTERNS['P-FS-011']!,
            quantifiedRow: {
              withLabel: '+ API wrapper',
              withoutLabel: '- Core sprawl',
              description: 'Core API wrapper should precede broad channel expansion on aging cores.',
              source: 'Core-modernization pattern corpus',
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-FS-002']!,
            description: 'Core-modernization programs stall when not tied to a named business cutover.',
            source: 'Core banking modernization pattern corpus',
          },
        ],
        vendors: [
          { vendor: VENDORS['V-FS-001']!, tier: 'challenger', healthLabel: 'Gaining · payment hub' },
          { vendor: VENDORS['V-FS-002']!, tier: 'incumbent', healthLabel: 'Existing core', isCurrent: true },
          { vendor: VENDORS['V-FS-004']!, tier: 'incumbent', healthLabel: 'Digital banking footprint' },
        ],
        regulatory: [
          { regulatory: REGULATORY['REG-FS-001']!, currencyDate: '2026-Q1' },
          { regulatory: REGULATORY['REG-FS-003']!, currencyDate: '2026-Q1' },
        ],
      },
      {
        rank: 2,
        useCase: USE_CASES['UC-FS-MIDDLE-002']!,
        score: 84,
        scoreFactors: [
          { name: 'SR 11-7 posture binding', delta: 20 },
          { name: 'ML model inventory exposure', delta: 18 },
          { name: 'Enables AML and decisioning modernization', delta: 16 },
          { name: 'Control ownership still needs sponsor clarity', delta: -5, isWarning: true },
          { name: 'Regulatory defensibility upside', delta: 35 },
        ],
        engagementState: 'in_flight',
        initiativeDisplayId: 'FC-02',
        decision: {
          kind: 'approve_scale',
          label: 'Approve control buildout',
          reason: 'Required before new ML expansion',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-FS-001']!,
            quantifiedRow: {
              withLabel: '+ Controls first',
              withoutLabel: '- Remediation',
              description: 'Validation, monitoring, explainability, and ownership should be designed before production use.',
              source: 'SR 11-7 model-risk pattern corpus',
            },
          },
          {
            pattern: PATTERNS['P-FS-008']!,
            quantifiedRow: {
              withLabel: '+ Inventory',
              withoutLabel: '- Shadow models',
              description: 'A central model inventory is the minimum control surface before scaling AI workflows.',
              source: 'Model governance corpus',
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-FS-001']!,
            description: 'Undocumented production models create examiner exposure.',
            source: 'SR 11-7 model-risk pattern corpus',
          },
        ],
        vendors: [
          { vendor: VENDORS['V-FS-003']!, tier: 'challenger', healthLabel: 'Model governance fit' },
          { vendor: VENDORS['V-FS-006']!, tier: 'incumbent', healthLabel: 'AML controls fit' },
        ],
        regulatory: [
          { regulatory: REGULATORY['REG-FS-002']!, currencyDate: '2026-Q1' },
          { regulatory: REGULATORY['REG-FS-003']!, currencyDate: '2026-Q1' },
        ],
      },
      {
        rank: 3,
        useCase: USE_CASES['UC-FS-FRONT-001']!,
        score: 76,
        scoreFactors: [
          { name: 'Digital acquisition drag visible', delta: 15 },
          { name: 'Customer experience upside', delta: 14 },
          { name: 'Identity proofing dependency', delta: -6, isWarning: true },
          { name: 'Branch follow-up loop needs operating owner', delta: 8 },
          { name: 'Can follow payment and data-foundation work', delta: 45 },
        ],
        engagementState: 'not_started',
        decision: {
          kind: 'evaluate',
          label: 'Prove readiness',
          reason: 'Attractive, but identity and workflow data must be joined',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-FS-006']!,
            quantifiedRow: {
              withLabel: '+ Recovery loop',
              withoutLabel: '- Channel fix',
              description: 'Identity proofing, application state, branch outreach, and nudges need one operating loop.',
              source: 'Digital banking conversion corpus',
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-FS-005']!,
            description: 'Channel-only fixes underperform when identity and application-state data stay separate.',
            source: 'Digital banking conversion corpus',
          },
        ],
        vendors: [
          { vendor: VENDORS['V-FS-004']!, tier: 'incumbent', healthLabel: 'Existing digital banking fit', isCurrent: true },
        ],
        regulatory: [{ regulatory: REGULATORY['REG-FS-004']!, currencyDate: '2026-Q1' }],
      },
    ],
    belowTheLine: [
      {
        rank: 4,
        useCaseId: 'UC-FS-BACK-001',
        useCaseName: 'Legacy Data Platform Rationalization',
        score: 73,
        state: 'evaluating',
        initiativeDisplayId: 'FC-07',
        valueLabel: '$10M-$25M',
        ttvLabel: '9-15 mo',
        hint: 'Important foundation, but should be tied to payments, model risk, AML, and reporting decisions.',
      },
      {
        rank: 5,
        useCaseId: 'UC-FS-MIDDLE-003',
        useCaseName: 'AML Alert Triage Automation',
        score: 70,
        state: 'candidate',
        valueLabel: '$5M-$14M',
        ttvLabel: '6-12 mo',
        hint: 'Good candidate after model-risk governance and explanation trail are locked.',
      },
    ],
    patternsTriggered: [
      {
        pattern: PATTERNS['P-FS-001']!,
        issue: 'Any ML or AML automation must clear SR 11-7 governance before scale.',
        recommendedAction: 'Treat model-risk governance as an enabling Move, not a compliance sidecar.',
        cta: { primary: { label: 'Open in Nexus', href: '/strategic-moves' } },
      },
    ],
    proofPoints: [],
    totals: {
      totalUseCases: 5,
      totalPatterns: 6,
      totalVendors: 6,
      totalRegulatory: 4,
      refreshCadence: 'quarterly',
      lastRefreshQuarter: '2026-Q1',
    },
  };
}
