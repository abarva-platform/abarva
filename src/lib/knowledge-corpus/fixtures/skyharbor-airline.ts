// Airline Demo corpus fixture for Intelligence Map + Brief.
//
// Sourced from datasets/skyharbor-air-synthetic-v1. This is de-identified
// synthetic tenant substrate, not live carrier-confidential data.

import type {
  AntiPattern,
  BriefData,
  MapData,
  MoveCascade,
  Pattern,
  ProofPoint,
  Provenance,
  Regulatory,
  UseCase,
  Vendor,
} from '../types';

const PROV = (sources: string[], date: string): Provenance => ({
  primarySources: sources.map((source) => ({
    source,
    currencyDate: date,
    reliability: 'HIGH' as const,
  })),
  curationPass: 'skyharbor-synthetic-substrate-2026-05',
  notes:
    'De-identified synthetic tenant shaped by public airline scale anchors and comparable-carrier modernization patterns.',
});

const DATASET_PROFILE = 'datasets/skyharbor-air-synthetic-v1/00-profile/enterprise-profile.yaml';
const DATASET_INITIATIVES = 'datasets/skyharbor-air-synthetic-v1/10-initiatives/initiatives-active.csv';
const DATASET_OVERLAY =
  'datasets/skyharbor-air-synthetic-v1/16-industry-pattern-overlay/airline-industry-pattern-overlay.jsonl';
const DATASET_BRIEFS = 'datasets/skyharbor-air-synthetic-v1/briefs/*.brief.md';

const PATTERNS: Record<string, Pattern> = {
  'P-AIR-001': {
    id: 'P-AIR-001',
    name: 'Operational coupling before acceleration',
    scope: 'industry_specific',
    applicableIndustries: ['airline'],
    patternType: 'success',
    description:
      'Modernization decisions are strongest when operational coupling, peak-day constraints, and cutover reversibility are made explicit before acceleration.',
    evidenceBasis: {
      observedInUseCases: ['UC-AIR-MIDDLE-001', 'UC-AIR-MIDDLE-002', 'UC-AIR-BACK-001'],
      observationCount: 'SkyHarbor synthetic airline overlay plus comparable-carrier patterns',
      confidence: 'MED',
    },
    failureConsequence:
      'Teams can show cloud migration activity while revenue-critical operating risk remains unresolved.',
    recommendedResponse:
      'Gate each acceleration bet on named operational telemetry, rollback ownership, and dependency closure.',
    provenance: PROV([DATASET_OVERLAY, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'P-AIR-002': {
    id: 'P-AIR-002',
    name: 'Time-boxed dual-run owner',
    scope: 'industry_specific',
    applicableIndustries: ['airline'],
    patternType: 'success',
    description:
      'Dual-run succeeds when duplicate legacy-plus-cloud complexity has a named owner, a retirement clock, and evidence that the exit is still viable.',
    evidenceBasis: {
      observedInUseCases: ['UC-AIR-BACK-002', 'UC-AIR-MIDDLE-003'],
      observationCount: 'SkyHarbor synthetic airline overlay',
      confidence: 'MED',
    },
    failureConsequence:
      'Dual-run becomes permanent cost and operational drag instead of a controlled transition state.',
    recommendedResponse:
      'Treat every dual-run extension as a CFO-visible exception with reason code and exit evidence.',
    provenance: PROV([DATASET_OVERLAY, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'P-AIR-003': {
    id: 'P-AIR-003',
    name: 'Sourcing leverage tied to exit rights',
    scope: 'industry_specific',
    applicableIndustries: ['airline'],
    patternType: 'success',
    description:
      'Mainframe-to-cloud programs gain leverage when vendor outcomes, exit rights, and technical extraction milestones are negotiated together.',
    evidenceBasis: {
      observedInUseCases: ['UC-AIR-BACK-001', 'UC-AIR-BACK-002'],
      observationCount: 'SkyHarbor synthetic sourcing and modernization ledger briefs',
      confidence: 'MED',
    },
    failureConsequence:
      'Vendor productivity claims stay disconnected from the actual modernization path.',
    recommendedResponse:
      'Bind IBM/AWS commercial changes to named extraction evidence and measurable dual-run reduction.',
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
};

const ANTI_PATTERNS: Record<string, AntiPattern> = {
  'AP-AIR-001': {
    id: 'AP-AIR-001',
    name: 'Dual-run completion theater',
    scope: 'industry_specific',
    applicableIndustries: ['airline'],
    description:
      'The program reports completion because a cloud path exists, while the legacy path still carries peak-day or revenue-critical operational load.',
    mechanism:
      'The modernization scorecard rewards build completion but does not force proof that duplicate complexity has retired.',
    observedInUseCases: ['UC-AIR-BACK-002', 'UC-AIR-MIDDLE-003'],
    observationCount: 'SkyHarbor synthetic airline overlay',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Decision quality', valueRange: 'Exit not decision-grade' },
      withoutAntiPattern: { metric: 'Decision quality', valueRange: 'Exit tied to telemetry and owner' },
      source: DATASET_OVERLAY,
      confidence: 'MED',
    },
    earlySignals: [
      { signal: 'Cloud path exists but legacy exception volume is not shrinking', severity: 'HIGH' },
      { signal: 'Dual-run extension lacks a reason code', severity: 'MED' },
    ],
    typicalRecovery:
      'Assign a dual-run owner, require exception telemetry, and reset the retirement gate before claiming value.',
    preventionPatterns: ['P-AIR-001', 'P-AIR-002'],
    provenance: PROV([DATASET_OVERLAY], '2026-05'),
    lastRefreshed: '2026-05-27',
  },
  'AP-AIR-002': {
    id: 'AP-AIR-002',
    name: 'Vendor claim as value proof',
    scope: 'industry_specific',
    applicableIndustries: ['airline'],
    description:
      'Vendor productivity claims are treated as realized value before the airline ledger proves cost, risk, or cycle-time movement.',
    mechanism:
      'Commercial outcome language outpaces source-led evidence from modernization, operations, and finance systems.',
    observedInUseCases: ['UC-AIR-BACK-001', 'UC-AIR-BACK-003'],
    observationCount: 'SkyHarbor synthetic modernization and sourcing briefs',
    quantifiedSignal: {
      withAntiPattern: { metric: 'Value proof', valueRange: 'Projected or claimed' },
      withoutAntiPattern: { metric: 'Value proof', valueRange: 'Measured in ledger' },
      source: DATASET_BRIEFS,
      confidence: 'MED',
    },
    earlySignals: [
      { signal: 'Benefits are quoted from vendor deck rather than Tower ledger', severity: 'HIGH' },
      { signal: 'No evidence owner for productivity guarantee', severity: 'MED' },
    ],
    typicalRecovery:
      'Convert vendor outcomes into ledger-backed milestones and hold renegotiation until proof is visible.',
    preventionPatterns: ['P-AIR-003'],
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
  },
};

const VENDORS: Record<string, Vendor> = {
  'V-AIR-IBM': {
    id: 'V-AIR-IBM',
    name: 'IBM',
    productLines: [
      { productName: 'Mainframe modernization and managed services', servesUseCases: ['UC-AIR-BACK-001', 'UC-AIR-BACK-003'] },
    ],
    vendorType: 'incumbent',
    financialHealth: 'strong',
    shareTrajectory: 'holding',
    trajectorySignalBasis: 'SkyHarbor active initiative roster names IBM across modernization and sourcing bets.',
    contractPatterns: {
      pricingModels: ['Outcome-based modernization terms', 'managed services'],
      negotiationLevers: 'Tie economics to extraction evidence, dual-run reduction, and exit-right milestones.',
    },
    failureModes: [{ mode: 'Claim-led value', description: 'Vendor outcomes can outrun SkyHarbor ledger evidence.' }],
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'V-AIR-AWS': {
    id: 'V-AIR-AWS',
    name: 'AWS',
    productLines: [
      { productName: 'Cloud platform and event modernization', servesUseCases: ['UC-AIR-MIDDLE-001', 'UC-AIR-MIDDLE-003'] },
    ],
    vendorType: 'challenger',
    financialHealth: 'strong',
    shareTrajectory: 'gaining',
    trajectorySignalBasis: 'SkyHarbor roster pairs AWS with cloud platform, SDLC, baggage, and landing-zone bets.',
    contractPatterns: {
      pricingModels: ['Cloud consumption', 'platform services'],
      negotiationLevers: 'Gate consumption growth on operational telemetry and platform reliability.',
    },
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'V-AIR-GCC': {
    id: 'V-AIR-GCC',
    name: 'Internal GCC',
    productLines: [
      { productName: 'Cloud engineering and AI delivery capacity', servesUseCases: ['UC-AIR-BACK-001', 'UC-AIR-MIDDLE-001'] },
    ],
    vendorType: 'emerging',
    financialHealth: 'moderate',
    shareTrajectory: 'gaining',
    trajectorySignalBasis: 'The dataset frames GCC scale as a constraint and a modernization acceleration lever.',
    contractPatterns: {
      pricingModels: ['Internal capacity investment'],
      negotiationLevers: 'Use GCC ramp as bargaining leverage where vendor dependency is strongest.',
    },
    failureModes: [{ mode: 'Capacity lag', description: 'GCC scale can trail the modernization ambition.' }],
    provenance: PROV([DATASET_PROFILE, DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
};

const REGULATORY: Record<string, Regulatory> = {
  'REG-AIR-001': {
    id: 'REG-AIR-001',
    name: 'Airline operational-control and consumer-impact guardrails',
    jurisdiction: 'United States and global airline operating markets',
    issuingBody: 'FAA, DOT, and equivalent aviation authorities',
    applicableIndustries: ['airline'],
    applicableUseCases: ['UC-AIR-MIDDLE-001', 'UC-AIR-MIDDLE-002', 'UC-AIR-FRONT-001'],
    summary:
      'Operational AI and modernization moves must preserve accountable operating control, service recovery transparency, and auditable exception handling.',
    keyRequirements: [
      'Keep accountable human ownership for operational disruptions and crew legality decisions.',
      'Preserve evidence trails for customer-impacting recovery and loyalty decisions.',
      'Do not treat automation availability as proof that operational risk has retired.',
    ],
    provenance: PROV([DATASET_OVERLAY, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
};

const USE_CASES: Record<string, UseCase> = {
  'UC-AIR-BACK-001': {
    id: 'UC-AIR-BACK-001',
    name: 'AI-Powered SDLC Modernization Factory',
    displayNameShort: 'AI SDLC factory',
    industry: 'airline',
    office: 'back',
    domainTags: ['mainframe modernization', 'engineering productivity', 'IBM to AWS'],
    problemStatement:
      'SkyHarbor needs modernization capacity to move faster without letting vendor claims outrun ledger-backed value proof.',
    artOfPossibleFraming:
      'Use AI-assisted delivery to accelerate extraction work, but require every productivity claim to tie back to source-led evidence.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$8.0M projected value from active initiative roster' },
      timeToValueMonths: '6-12',
      paybackMonths: '12-18',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'scaling',
    lifecycleBasis: 'Active roster marks this bet at scale with restructure posture.',
    successPatterns: [
      { patternId: 'P-AIR-001', relevance: 'HIGH' },
      { patternId: 'P-AIR-003', relevance: 'HIGH' },
    ],
    antiPatterns: [
      { apId: 'AP-AIR-002', severity: 'HIGH' },
    ],
    vendorLandscape: { incumbent: ['IBM'], challenger: ['AWS'], emerging: ['Internal GCC'] },
    siLandscape: { crediblePractice: ['mainframe modernization', 'airline platform engineering'], emergingPractice: ['AI-assisted SDLC factory'] },
    regulatoryContext: { applicable: ['operational resilience', 'audit trail'] },
    benchmarkMetrics: {
      primary: [{ kpi: 'Ledger-backed modernization value', leadingIndicator: true }],
    },
    provenance: PROV([DATASET_PROFILE, DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-MIDDLE-001': {
    id: 'UC-AIR-MIDDLE-001',
    name: 'IROPs Recovery Decision Engine',
    displayNameShort: 'IROPs recovery engine',
    industry: 'airline',
    office: 'middle',
    domainTags: ['irregular operations', 'service recovery', 'cloud platform'],
    problemStatement:
      'Disruption recovery decisions need faster cross-functional coordination without losing operational accountability.',
    artOfPossibleFraming:
      'A recovery decision engine can prioritize options across passenger, crew, aircraft, and service constraints when telemetry and human ownership are explicit.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$10.2M projected value from active initiative roster' },
      timeToValueMonths: '6-10',
      paybackMonths: '12-18',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'emerging',
    lifecycleBasis: 'Active roster marks the initiative in pilot with accelerate posture.',
    successPatterns: [{ patternId: 'P-AIR-001', relevance: 'HIGH' }],
    antiPatterns: [{ apId: 'AP-AIR-001', severity: 'MED' }],
    vendorLandscape: { incumbent: [], challenger: ['AWS'], emerging: ['Internal GCC'] },
    siLandscape: { crediblePractice: ['airline operations modernization'], emergingPractice: ['AI recovery orchestration'] },
    regulatoryContext: { applicable: ['operational control', 'consumer-impact evidence'] },
    benchmarkMetrics: {
      primary: [{ kpi: 'Recovery decision cycle time', leadingIndicator: true }],
    },
    provenance: PROV([DATASET_INITIATIVES, DATASET_OVERLAY], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-MIDDLE-002': {
    id: 'UC-AIR-MIDDLE-002',
    name: 'Crew Legality Cloud Extract',
    displayNameShort: 'Crew legality extract',
    industry: 'airline',
    office: 'middle',
    domainTags: ['crew legality', 'cloud extraction', 'operational risk'],
    problemStatement:
      'Crew legality capability must move off legacy constraints without introducing unsafe or unauditable operating exceptions.',
    artOfPossibleFraming:
      'Extract crew-legality decision support in a reversible sequence with explicit exception logging and operational-owner signoff.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$12.4M projected value from active initiative roster' },
      timeToValueMonths: '9-15',
      paybackMonths: '15-24',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'emerging',
    lifecycleBasis: 'Active roster marks the initiative in build with accelerate posture.',
    successPatterns: [{ patternId: 'P-AIR-001', relevance: 'HIGH' }],
    antiPatterns: [{ apId: 'AP-AIR-001', severity: 'HIGH' }],
    vendorLandscape: { incumbent: ['IBM'], challenger: [], emerging: ['GCC Partner'] },
    siLandscape: { crediblePractice: ['airline operations modernization'], emergingPractice: ['crew decision-support extraction'] },
    regulatoryContext: { applicable: ['crew legality evidence', 'operational control'] },
    benchmarkMetrics: {
      primary: [{ kpi: 'Exception-rate trend after cutover', leadingIndicator: true }],
    },
    provenance: PROV([DATASET_INITIATIVES, DATASET_OVERLAY], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-FRONT-001': {
    id: 'UC-AIR-FRONT-001',
    name: 'Loyalty Personalization Guardrails',
    displayNameShort: 'Loyalty guardrails',
    industry: 'airline',
    office: 'front',
    domainTags: ['loyalty', 'customer personalization', 'guardrails'],
    problemStatement:
      'SkyHarbor needs personalization value without creating opaque customer-impacting decisions or loyalty trust risk.',
    artOfPossibleFraming:
      'Pair personalization with customer-impact evidence, explainability thresholds, and exception handling before scale.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$14.6M projected value from active initiative roster' },
      timeToValueMonths: '6-12',
      paybackMonths: '12-18',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'emerging',
    lifecycleBasis: 'Active roster marks this initiative in design.',
    successPatterns: [{ patternId: 'P-AIR-001', relevance: 'MED' }],
    vendorLandscape: { incumbent: ['IBM'], challenger: ['AWS'], emerging: [] },
    siLandscape: { crediblePractice: ['customer AI governance'], emergingPractice: ['loyalty decision guardrails'] },
    regulatoryContext: { applicable: ['consumer-impact evidence', 'customer trust'] },
    benchmarkMetrics: {
      primary: [{ kpi: 'Personalization exception review rate', leadingIndicator: true }],
    },
    provenance: PROV([DATASET_INITIATIVES, DATASET_OVERLAY], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-MIDDLE-003': {
    id: 'UC-AIR-MIDDLE-003',
    name: 'Baggage Recovery Event Stream',
    displayNameShort: 'Baggage recovery stream',
    industry: 'airline',
    office: 'middle',
    domainTags: ['baggage recovery', 'event stream', 'service recovery'],
    problemStatement:
      'Baggage recovery needs shared event visibility across customer service, airport operations, and platform systems.',
    artOfPossibleFraming:
      'Create a recovery event stream that exposes exception status and ownership without claiming completion until legacy paths retire.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$21.2M projected value from active initiative roster' },
      timeToValueMonths: '9-14',
      paybackMonths: '15-24',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'emerging',
    lifecycleBasis: 'Active roster marks this initiative in pilot with accelerate posture.',
    successPatterns: [
      { patternId: 'P-AIR-001', relevance: 'HIGH' },
      { patternId: 'P-AIR-002', relevance: 'MED' },
    ],
    antiPatterns: [{ apId: 'AP-AIR-001', severity: 'MED' }],
    vendorLandscape: { incumbent: ['IBM'], challenger: ['AWS'], emerging: [] },
    siLandscape: { crediblePractice: ['event-driven operations'], emergingPractice: ['AI-assisted recovery orchestration'] },
    regulatoryContext: { applicable: ['customer-impact evidence', 'service recovery'] },
    benchmarkMetrics: {
      primary: [{ kpi: 'Baggage exception closure cycle time', leadingIndicator: true }],
    },
    provenance: PROV([DATASET_INITIATIVES, DATASET_OVERLAY], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-BACK-002': {
    id: 'UC-AIR-BACK-002',
    name: 'Customer Profile Dual-Run Exit',
    displayNameShort: 'Profile dual-run exit',
    industry: 'airline',
    office: 'back',
    domainTags: ['customer profile', 'dual-run', 'legacy retirement'],
    problemStatement:
      'Customer profile modernization has to prove duplicate complexity is retiring, not just that a cloud path exists.',
    artOfPossibleFraming:
      'Make dual-run exit a value and risk decision with exception telemetry, owner signoff, and a retirement clock.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$19.0M projected value from active initiative roster' },
      timeToValueMonths: '9-15',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'scaling',
    successPatterns: [{ patternId: 'P-AIR-002', relevance: 'HIGH' }],
    antiPatterns: [{ apId: 'AP-AIR-001', severity: 'HIGH' }],
    vendorLandscape: { incumbent: ['IBM'], challenger: [], emerging: ['GCC Partner'] },
    siLandscape: { crediblePractice: ['legacy retirement'], emergingPractice: ['customer-profile decomposition'] },
    regulatoryContext: { applicable: ['customer-data evidence', 'operational resilience'] },
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
  'UC-AIR-BACK-003': {
    id: 'UC-AIR-BACK-003',
    name: 'IBM Outcomes Restructure',
    displayNameShort: 'IBM outcomes restructure',
    industry: 'airline',
    office: 'back',
    domainTags: ['sourcing', 'IBM', 'commercial outcomes'],
    problemStatement:
      'Sourcing economics must be tied to modernization evidence rather than broad productivity assertions.',
    artOfPossibleFraming:
      'Renegotiate outcome terms around extraction milestones, dual-run reduction, and ledger-backed realized value.',
    businessValueRanges: {
      perCompanySize: { veryLarge: '$25.6M projected value from active initiative roster' },
      timeToValueMonths: '3-9',
      confidenceBand: 'MED',
    },
    lifecycleStage: 'emerging',
    successPatterns: [{ patternId: 'P-AIR-003', relevance: 'HIGH' }],
    antiPatterns: [{ apId: 'AP-AIR-002', severity: 'HIGH' }],
    vendorLandscape: { incumbent: ['IBM'], challenger: [], emerging: ['GCC Partner'] },
    siLandscape: { crediblePractice: ['strategic sourcing'], emergingPractice: ['outcome-based modernization contracting'] },
    regulatoryContext: { applicable: ['audit evidence', 'supplier accountability'] },
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
    refreshCadence: 'quarterly',
  },
};

const CASCADES: Record<string, MoveCascade> = {
  'MC-AIR-001': {
    id: 'MC-AIR-001',
    name: 'Modernization acceleration cascade',
    displayNameShort: 'Modernization cascade',
    industry: 'airline',
    cascadeSteps: [
      { step: 1, useCaseId: 'UC-AIR-BACK-001', typicalDurationMonths: '3-6', successThreshold: 'Ledger-backed productivity evidence' },
      { step: 2, useCaseId: 'UC-AIR-MIDDLE-002', typicalDurationMonths: '6-12', enabledByStepNMinusOne: 'Extraction capacity and delivery evidence' },
      { step: 3, useCaseId: 'UC-AIR-BACK-002', typicalDurationMonths: '6-12', enabledByStepNMinusOne: 'Operational extraction proof' },
    ],
    cascadeEvidence: {
      observationCount: 'SkyHarbor modernization briefs and active initiative roster',
      fullCascadeCompletionRate: 'Not yet measured in live corpus',
      confidence: 'MED',
    },
    failureModesAtHandoff: [
      {
        betweenStep: '1-2',
        mode: 'Productivity proof does not translate into operational extraction',
        earlySignal: 'Velocity improves but exception debt remains flat',
        typicalRecovery: 'Reset gate around operational dependency closure.',
      },
    ],
    provenance: PROV([DATASET_INITIATIVES, DATASET_BRIEFS], '2026-05'),
    lastRefreshed: '2026-05-27',
  },
};

const proofPoints: ProofPoint[] = [];

export function getSkyHarborMapData(): MapData {
  return {
    tenantName: 'Airline Demo',
    tenantBrandColor: '#1d4ed8',
    industry: 'airline',
    totalUseCases: 7,
    inFlightCount: 5,
    atRiskCount: 2,
    candidateCount: 2,
    refreshedLabel: 'SkyHarbor synthetic substrate refreshed May 2026',
    whatChanged: [
      {
        entityId: 'SHA-INIT-001',
        entityType: 'use_case',
        summary: 'AI-Powered SDLC Modernization Factory is active at scale but marked restructure.',
        source: DATASET_INITIATIVES,
      },
      {
        entityId: 'AP-AIR-001',
        entityType: 'pattern',
        summary: 'Dual-run completion theater is the key modernization failure mode to watch.',
        source: DATASET_OVERLAY,
      },
    ],
    nodes: [
      { useCase: USE_CASES['UC-AIR-MIDDLE-001']!, x: 30, y: 88, r: 18, engagementState: 'in_flight', initiativeDisplayId: 'SHA-INIT-002', score: 88 },
      { useCase: USE_CASES['UC-AIR-MIDDLE-002']!, x: 38, y: 84, r: 18, engagementState: 'in_flight', initiativeDisplayId: 'SHA-INIT-003', score: 84 },
      { useCase: USE_CASES['UC-AIR-BACK-001']!, x: 58, y: 76, r: 16, engagementState: 'at_risk', initiativeDisplayId: 'SHA-INIT-001', score: 78 },
      { useCase: USE_CASES['UC-AIR-FRONT-001']!, x: 28, y: 70, r: 16, engagementState: 'in_flight', initiativeDisplayId: 'SHA-INIT-004', score: 74 },
      { useCase: USE_CASES['UC-AIR-MIDDLE-003']!, x: 34, y: 72, r: 17, engagementState: 'in_flight', initiativeDisplayId: 'SHA-INIT-007', score: 72 },
      { useCase: USE_CASES['UC-AIR-BACK-002']!, x: 62, y: 78, r: 17, engagementState: 'in_flight', initiativeDisplayId: 'SHA-INIT-006', score: 71 },
      { useCase: USE_CASES['UC-AIR-BACK-003']!, x: 46, y: 74, r: 17, engagementState: 'at_risk', initiativeDisplayId: 'SHA-INIT-009', score: 69 },
    ],
    edges: [
      { fromUseCaseId: 'UC-AIR-BACK-001', toUseCaseId: 'UC-AIR-MIDDLE-002', basis: 'cascade_adjacency', cascadeId: 'MC-AIR-001' },
      { fromUseCaseId: 'UC-AIR-MIDDLE-002', toUseCaseId: 'UC-AIR-BACK-002', basis: 'cascade_adjacency', cascadeId: 'MC-AIR-001' },
      { fromUseCaseId: 'UC-AIR-BACK-001', toUseCaseId: 'UC-AIR-BACK-003', basis: 'pattern_cooccurrence', patternId: 'P-AIR-003' },
    ],
    defaultSelectedId: 'UC-AIR-MIDDLE-001',
  };
}

export function getSkyHarborBriefData(): BriefData {
  return {
    tenantName: 'Airline Demo',
    tenantBrandColor: '#1d4ed8',
    industry: 'airline',
    composedAt: '2026-05-27T00:00:00.000Z',
    synthesis:
      'Airline Demo has a deep airline modernization substrate: the strongest near-term bets are disruption recovery, crew legality extraction, and an AI-assisted SDLC factory. The decision risk is not whether the corpus exists; it is whether acceleration is tied to operational telemetry, dual-run exit evidence, and vendor outcome proof.',
    valueAtStake: [
      { label: 'Operational recovery', value: '$10.2M projected', captured: 20, blocked: 35, candidate: 25, tone: 'teal' },
      { label: 'Crew and legacy extraction', value: '$12.4M projected', captured: 15, blocked: 45, candidate: 20, tone: 'amber' },
      { label: 'Modernization productivity', value: '$8.0M projected', captured: 25, blocked: 40, candidate: 15, tone: 'navy' },
    ],
    openTensions: [
      {
        title: 'Acceleration vs. operational coupling',
        body: 'The airline can move faster only where peak-day constraints and rollback ownership are explicit.',
        severity: 'amber',
      },
      {
        title: 'Vendor outcomes vs. ledger proof',
        body: 'IBM/AWS economics should not be accepted as value until Tower evidence shows realized movement.',
        severity: 'red',
      },
    ],
    bets: [
      {
        rank: 1,
        useCase: USE_CASES['UC-AIR-MIDDLE-001']!,
        score: 88,
        scoreFactors: [
          { name: 'Active pilot with accelerate posture', delta: 20 },
          { name: 'Direct disruption-recovery value path', delta: 20 },
          { name: 'Operational telemetry required before scale', delta: -6, isWarning: true },
          { name: 'AWS and GCC capacity available', delta: 12 },
          { name: 'Cross-functional decision leverage', delta: 42 },
        ],
        engagementState: 'in_flight',
        initiativeDisplayId: 'SHA-INIT-002',
        measuredVsCommitted: { measured: 0, committed: 7700000 },
        decision: {
          kind: 'approve_scale',
          label: 'Approve next gate',
          reason: 'Proceed only with operational telemetry and accountable recovery owner.',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-AIR-001']!,
            quantifiedRow: {
              withLabel: '+ Coupling visible',
              withoutLabel: '- Peak-day risk hidden',
              description: 'Recovery AI is decision-grade only when disruption constraints are visible before scale.',
              source: DATASET_OVERLAY,
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-AIR-001']!,
            description: 'Do not claim recovery transformation while duplicate exception paths remain unresolved.',
            source: DATASET_OVERLAY,
          },
        ],
        vendors: [
          { vendor: VENDORS['V-AIR-AWS']!, tier: 'challenger', healthLabel: 'Cloud platform fit', isCurrent: true },
          { vendor: VENDORS['V-AIR-GCC']!, tier: 'emerging', healthLabel: 'Delivery capacity lever', isCurrent: true },
        ],
        regulatory: [{ regulatory: REGULATORY['REG-AIR-001']!, currencyDate: '2026-05' }],
      },
      {
        rank: 2,
        useCase: USE_CASES['UC-AIR-MIDDLE-002']!,
        score: 84,
        scoreFactors: [
          { name: 'Revenue-critical operating capability', delta: 20 },
          { name: 'Active build with accelerate posture', delta: 18 },
          { name: 'Crew exception handling must stay auditable', delta: -8, isWarning: true },
          { name: 'Reduces legacy operating dependency', delta: 18 },
          { name: 'Modernization cascade leverage', delta: 36 },
        ],
        engagementState: 'in_flight',
        initiativeDisplayId: 'SHA-INIT-003',
        measuredVsCommitted: { measured: 0, committed: 9400000 },
        decision: {
          kind: 'evaluate',
          label: 'Gate on exception proof',
          reason: 'Attractive extraction path, but operating-control evidence has to lead the cutover.',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-AIR-001']!,
            quantifiedRow: {
              withLabel: '+ Exception proof',
              withoutLabel: '- Unsafe cutover',
              description: 'Crew legality extraction needs named exception telemetry before acceleration.',
              source: DATASET_OVERLAY,
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-AIR-001']!,
            description: 'A cloud path is not enough if the legacy path still carries peak-day exceptions.',
            source: DATASET_OVERLAY,
          },
        ],
        vendors: [
          { vendor: VENDORS['V-AIR-IBM']!, tier: 'incumbent', healthLabel: 'Legacy dependency', isCurrent: true },
          { vendor: VENDORS['V-AIR-GCC']!, tier: 'emerging', healthLabel: 'Extraction capacity' },
        ],
        regulatory: [{ regulatory: REGULATORY['REG-AIR-001']!, currencyDate: '2026-05' }],
      },
      {
        rank: 3,
        useCase: USE_CASES['UC-AIR-BACK-001']!,
        score: 78,
        scoreFactors: [
          { name: 'Scale-stage modernization lever', delta: 18 },
          { name: 'AI delivery capacity upside', delta: 18 },
          { name: 'Restructure posture means proof is behind plan', delta: -12, isFlag: true, isWarning: true },
          { name: 'Sourcing leverage with IBM/AWS', delta: 14 },
          { name: 'Foundation for downstream extraction', delta: 40 },
        ],
        engagementState: 'at_risk',
        initiativeDisplayId: 'SHA-INIT-001',
        measuredVsCommitted: { measured: 0, committed: 6000000 },
        decision: {
          kind: 'evaluate',
          label: 'Restructure proof gate',
          reason: 'Keep the bet, but tie progress to ledger-backed productivity evidence.',
        },
        bindingPatterns: [
          {
            pattern: PATTERNS['P-AIR-003']!,
            quantifiedRow: {
              withLabel: '+ Exit rights',
              withoutLabel: '- Vendor claim',
              description: 'Commercial terms should move only when extraction evidence moves.',
              source: DATASET_BRIEFS,
            },
          },
        ],
        antiPatterns: [
          {
            antiPattern: ANTI_PATTERNS['AP-AIR-002']!,
            description: 'Vendor claims cannot substitute for SkyHarbor ledger evidence.',
            source: DATASET_BRIEFS,
          },
        ],
        vendors: [
          { vendor: VENDORS['V-AIR-IBM']!, tier: 'incumbent', healthLabel: 'Current modernization dependency', isCurrent: true },
          { vendor: VENDORS['V-AIR-AWS']!, tier: 'challenger', healthLabel: 'Cloud platform path', isCurrent: true },
          { vendor: VENDORS['V-AIR-GCC']!, tier: 'emerging', healthLabel: 'Capacity lever' },
        ],
        regulatory: [],
      },
    ],
    belowTheLine: [
      {
        rank: 4,
        useCaseId: 'UC-AIR-FRONT-001',
        useCaseName: 'Loyalty Personalization Guardrails',
        score: 74,
        state: 'in_portfolio',
        initiativeDisplayId: 'SHA-INIT-004',
        valueLabel: '$14.6M projected',
        ttvLabel: '6-12 mo',
        hint: 'Good customer-value path, but guardrail evidence should precede broad personalization.',
      },
      {
        rank: 5,
        useCaseId: 'UC-AIR-MIDDLE-003',
        useCaseName: 'Baggage Recovery Event Stream',
        score: 72,
        state: 'in_portfolio',
        initiativeDisplayId: 'SHA-INIT-007',
        valueLabel: '$21.2M projected',
        ttvLabel: '9-14 mo',
        hint: 'Attractive recovery foundation if dual-run debt stays visible.',
      },
      {
        rank: 6,
        useCaseId: 'UC-AIR-BACK-003',
        useCaseName: 'IBM Outcomes Restructure',
        score: 69,
        state: 'evaluating',
        initiativeDisplayId: 'SHA-INIT-009',
        valueLabel: '$25.6M projected',
        ttvLabel: '3-9 mo',
        hint: 'Commercially important, but value proof must come from SkyHarbor ledger evidence.',
      },
    ],
    patternsTriggered: [
      {
        pattern: PATTERNS['P-AIR-001']!,
        issue: 'Several accelerate-posture bets still depend on explicit operational coupling proof.',
        recommendedAction:
          'Before the next gate, require each owner to name the exception telemetry and rollback owner.',
        cta: { primary: { label: 'Open Tower', href: '/tower' }, secondary: { label: 'Open Moves', href: '/moves' } },
      },
      {
        pattern: PATTERNS['P-AIR-003']!,
        issue: 'Vendor economics and modernization evidence need to stay joined.',
        recommendedAction:
          'Use IBM/AWS renegotiation moments to lock extraction milestones and value-ledger proof.',
        cta: { primary: { label: 'Open Source', href: '/source' } },
      },
    ],
    cascadeIfSucceeds: {
      cascade: CASCADES['MC-AIR-001']!,
      triggerInitiativeId: 'SHA-INIT-001',
      triggerInitiativeName: 'AI-Powered SDLC Modernization Factory',
      followOnUseCases: [
        { useCaseId: 'UC-AIR-MIDDLE-002', useCaseName: 'Crew Legality Cloud Extract' },
        { useCaseId: 'UC-AIR-BACK-002', useCaseName: 'Customer Profile Dual-Run Exit' },
      ],
      evidenceLine:
        'The cascade should fire only when productivity gains are backed by ledger evidence and operational extraction proof.',
    },
    proofPoints,
    totals: {
      totalUseCases: 7,
      totalPatterns: 3,
      totalVendors: 3,
      totalRegulatory: 1,
      refreshCadence: 'quarterly',
      lastRefreshQuarter: '2026-Q2',
    },
  };
}
