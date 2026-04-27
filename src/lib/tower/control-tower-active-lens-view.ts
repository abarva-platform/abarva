// Control Tower Active Lens View
// Deterministic read model for the Control Tower page lens-switching surface.
// No model calls, no network calls, no database calls.

export type TowerLens =
  | 'portfolio'
  | 'adoption'
  | 'value'
  | 'risk'
  | 'cost'
  | 'productivity'
  | 'tech_data_readiness';

export type ScorecardStatus = 'on_track' | 'at_risk' | 'blocked' | 'not_started' | 'deferred';

export interface TowerScorecard {
  scorecardId: string;
  label: string;
  status: ScorecardStatus;
  summary: string;
  evidenceBasis: string;
  owner: string;
  deterministicSeed: true;
}

export interface TowerPressureCard {
  pressureId: string;
  lens: TowerLens;
  label: string;
  pressureSummary: string;
  businessImpact: string;
  recommendedAction: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Extended lens detail — added for W32C (Adoption/Value/Risk lenses)
// ---------------------------------------------------------------------------

export interface TowerLensDetail {
  lensId: TowerLens;
  primaryQuestion: string;
  dataAvailable: string[];
  dataMissing: string[];
  topSignal: string;
  nextAction: string;
  atlasRecommendation: string;
  lowContextDisclosure: string | null;
  deterministicSeed: true;
  caveat: string;
}

export interface ControlTowerActiveLensView {
  tenantSlug: string;
  activeLens: TowerLens;
  lensLabel: string;
  availableLenses: TowerLens[];
  scorecards: TowerScorecard[]; // max 5
  pressureCards: TowerPressureCard[]; // max 3
  lensDetail: TowerLensDetail | null; // populated for non-portfolio lenses
  askAtlasDeferred: boolean; // always true — Ask Atlas is a drawer, not main affordance
  deterministicSeedCaveat: string;
  deterministicSeed: true;
}

const ALL_LENSES: TowerLens[] = [
  'portfolio',
  'adoption',
  'value',
  'risk',
  'cost',
  'productivity',
  'tech_data_readiness',
];

const LENS_LABEL_MAP: Record<TowerLens, string> = {
  portfolio: 'Portfolio',
  adoption: 'Adoption',
  value: 'Value',
  risk: 'Risk',
  cost: 'Cost',
  productivity: 'Productivity',
  tech_data_readiness: 'Tech / Data Readiness',
};

export function getLensLabel(lens: TowerLens): string {
  return LENS_LABEL_MAP[lens];
}

export function listAvailableLenses(): TowerLens[] {
  return [...ALL_LENSES];
}

// ---------------------------------------------------------------------------
// Portfolio lens — scorecards and pressure cards
// ---------------------------------------------------------------------------

const APEX_RETAIL_PORTFOLIO_SCORECARDS: TowerScorecard[] = [
  {
    scorecardId: 'sc-apex-portfolio-cdp',
    label: 'CDP Activation — Synthesis',
    status: 'on_track',
    summary: 'Phase 5 workshop synthesis in progress. Delivery team aligned on 3 remaining deliverables.',
    evidenceBasis: 'Deterministic Wave 2 seed — not live telemetry.',
    owner: 'Programme Lead',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-portfolio-ams-bafo',
    label: 'AMS Outsourcing — BAFO Readiness',
    status: 'at_risk',
    summary: 'BAFO requirements pack incomplete. SLA governance gap identified. Vendor submissions pending scope clarification.',
    evidenceBasis: 'Deterministic Wave 2 seed — not live telemetry.',
    owner: 'Source Event Owner',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-portfolio-value-baseline',
    label: 'Value Baseline — Measurement',
    status: 'blocked',
    summary: 'Value baseline not yet established. G3 hard gate requires baseline before value realization can be tracked.',
    evidenceBasis: 'Deterministic Wave 2 seed — not live telemetry.',
    owner: 'Programme Sponsor',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_PORTFOLIO_PRESSURE_CARDS: TowerPressureCard[] = [
  {
    pressureId: 'pc-apex-ams-bafo-readiness',
    lens: 'portfolio',
    label: 'AMS BAFO Readiness Gate',
    pressureSummary:
      'BAFO requirements pack is incomplete. SLA exception and scope gap remain unresolved. Evaluation is stalled.',
    businessImpact:
      'AMS outsourcing timeline at risk. Without BAFO resolution, contract execution cannot proceed.',
    recommendedAction:
      'Issue scope clarification RFI and include mandatory SLA terms before issuing BAFO to vendors.',
    deterministicSeed: true,
  },
  {
    pressureId: 'pc-apex-workshop5-gate',
    lens: 'portfolio',
    label: 'Workshop 5 Gate Pending',
    pressureSummary:
      'CDP Activation Phase 5 gate requires 9 outstanding deliverables before gate approval can be assessed.',
    businessImpact:
      'Phase 5 gate blocks transition to Execute phase. Evidence deficit prevents evidence-based decision.',
    recommendedAction:
      'Prioritise completion of 9 Phase 5 deliverables. Assign accountable owner per deliverable.',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Adoption lens — W32C
// ---------------------------------------------------------------------------

const APEX_RETAIL_ADOPTION_SCORECARDS: TowerScorecard[] = [
  {
    scorecardId: 'sc-apex-adoption-cdp-readiness',
    label: 'CDP Adoption Readiness',
    status: 'not_started',
    summary:
      'CDP is in Build phase. Adoption readiness assessment has not begun. ' +
      'User onboarding plan and change management programme not yet initiated.',
    evidenceBasis: 'Deterministic Wave 2 seed — not live telemetry.',
    owner: 'Change Management Lead',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-adoption-training',
    label: 'Training Programme Status',
    status: 'not_started',
    summary:
      'No training materials or user enablement programme in place. ' +
      'Required before CDP activation gate can be approved.',
    evidenceBasis: 'Deterministic Wave 2 seed — not live telemetry.',
    owner: 'Programme Lead',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_ADOPTION_LENS_DETAIL: TowerLensDetail = {
  lensId: 'adoption',
  primaryQuestion: 'Is this organisation ready to adopt and use these AI programmes?',
  dataAvailable: [
    'Programme phase tracking (CDP in Build phase)',
    'Delivery team alignment status',
    'Workshop attendance records (stub)',
  ],
  dataMissing: [
    'User adoption baseline measurement',
    'Change management programme plan',
    'Training completion tracking',
    'Business readiness assessment',
  ],
  topSignal:
    'CDP programme is approaching the Activate phase with no adoption readiness plan in place. ' +
    'Change management programme not yet initiated.',
  nextAction:
    'Initiate adoption readiness assessment and appoint a change management lead before the ' +
    'CDP Activate phase gate.',
  atlasRecommendation:
    'Atlas recommends: schedule an adoption readiness review before Phase 5 gate closes. ' +
    'Organisations that skip adoption planning at this stage face higher activation failure risk.',
  lowContextDisclosure: null,
  deterministicSeed: true,
  caveat:
    'Adoption signals are deterministic seed — not live adoption telemetry. ' +
    'These indicators are fixed until live ingestion is wired.',
};

// ---------------------------------------------------------------------------
// Value lens — W32C
// ---------------------------------------------------------------------------

const APEX_RETAIL_VALUE_SCORECARDS: TowerScorecard[] = [
  {
    scorecardId: 'sc-apex-value-cdp-baseline',
    label: 'CDP Value Baseline',
    status: 'blocked',
    summary:
      'Value baseline not established. G3 gate requires a confirmed measurement framework. ' +
      '$2.4M CDP value at stake — cannot be tracked without baseline.',
    evidenceBasis: 'Workshop 5 business case — deterministic Wave 2 seed.',
    owner: 'Programme Sponsor',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-value-ams-savings',
    label: 'AMS Outsourcing — Cost Avoidance Target',
    status: 'at_risk',
    summary:
      'BAFO incompleteness puts targeted cost avoidance at risk. ' +
      'Without complete vendor submissions, final savings projection cannot be confirmed.',
    evidenceBasis: 'Deterministic Wave 2 seed — AMS BAFO tracking.',
    owner: 'Procurement Lead',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_VALUE_LENS_DETAIL: TowerLensDetail = {
  lensId: 'value',
  primaryQuestion: 'What measurable value is at stake, and is it being tracked?',
  dataAvailable: [
    'Workshop 5 business case ($2.4M CDP value identified)',
    'Programme phase tracking',
    'BAFO tracking (incomplete)',
  ],
  dataMissing: [
    'Confirmed value baseline measurement framework',
    'Benefit realisation tracking mechanism',
    'ROI measurement cadence',
    'Baseline KPI documentation',
  ],
  topSignal:
    '$2.4M CDP value identified in Workshop 5 business case, but G3 gate blocks value baseline ' +
    'establishment. Value cannot be tracked until the gate is cleared.',
  nextAction:
    'Establish a value measurement framework and document the baseline in the evidence fabric ' +
    'to unlock the G3 hard gate.',
  atlasRecommendation:
    'Atlas recommends: do not proceed to the Activate phase without a confirmed value baseline. ' +
    'Programmes without baselines are significantly more likely to report value erosion post-activation.',
  lowContextDisclosure: null,
  deterministicSeed: true,
  caveat:
    'Value signals are deterministic seed data from the Wave 2 workshop business case. ' +
    'These figures are not live financial data.',
};

// ---------------------------------------------------------------------------
// Risk lens — W32C
// ---------------------------------------------------------------------------

const APEX_RETAIL_RISK_SCORECARDS: TowerScorecard[] = [
  {
    scorecardId: 'sc-apex-risk-bafo-incomplete',
    label: 'AMS BAFO Incomplete — Procurement Risk',
    status: 'at_risk',
    summary:
      '2 of 4 AMS vendors have not submitted complete BAFO responses. ' +
      'SLA governance terms missing. Evaluation cannot proceed. BAFO deadline pressure is escalating.',
    evidenceBasis: 'Deterministic Wave 2 seed — AMS BAFO tracking document.',
    owner: 'Source Event Owner',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-risk-connector-stubs',
    label: 'Connector Stubs Only — Data Risk',
    status: 'blocked',
    summary:
      'All connectors are in stub state. No live data ingestion is wired. ' +
      'CDP programme cannot proceed to production without connector activation.',
    evidenceBasis: 'Deterministic Wave 2 seed — connector readiness stub inventory.',
    owner: 'Platform Engineering',
    deterministicSeed: true,
  },
  {
    scorecardId: 'sc-apex-risk-evidence-gap',
    label: 'Evidence Gap — Decision Risk',
    status: 'at_risk',
    summary:
      'Multiple programme gates require evidence that has not been uploaded. ' +
      'Decisions are being made without full evidence basis.',
    evidenceBasis: 'Deterministic Wave 2 seed — evidence manifest.',
    owner: 'Steward',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_RISK_PRESSURE_CARDS: TowerPressureCard[] = [
  {
    pressureId: 'pc-apex-risk-bafo-deadline',
    lens: 'risk',
    label: 'BAFO Deadline Pressure',
    pressureSummary:
      '2 AMS vendors have not responded to BAFO. Evaluation window is closing. SLA exception unresolved.',
    businessImpact:
      'AMS outsourcing contract execution cannot proceed. Procurement timeline at risk.',
    recommendedAction:
      'Issue vendor clarification notice immediately and escalate SLA exception to procurement leadership.',
    deterministicSeed: true,
  },
];

const APEX_RETAIL_RISK_LENS_DETAIL: TowerLensDetail = {
  lensId: 'risk',
  primaryQuestion: 'What risks could derail programme delivery or value realisation?',
  dataAvailable: [
    'BAFO tracking — 2 vendors incomplete',
    'Connector readiness stub inventory',
    'Evidence manifest with gaps identified',
    'Gate readiness checks',
  ],
  dataMissing: [
    'Formal risk register',
    'Risk owner assignments',
    'Mitigation plan documentation',
    'Risk likelihood and impact scoring',
  ],
  topSignal:
    'Three concurrent risks: (1) AMS BAFO incomplete with 2 vendors pending, ' +
    '(2) all connectors are stubs only, ' +
    '(3) multiple gate-blocking evidence gaps.',
  nextAction:
    'Establish a programme risk register and assign risk owners for the three active risk signals. ' +
    'Prioritise BAFO resolution and connector activation plan.',
  atlasRecommendation:
    'Atlas recommends: convene a risk review session before the next programme gate. ' +
    'The combination of BAFO incompleteness and connector stub state represents a compound delivery risk.',
  lowContextDisclosure: null,
  deterministicSeed: true,
  caveat:
    'Risk signals are deterministic seed — not live risk monitoring. ' +
    'These indicators are fixed until live ingestion is wired.',
};

// ---------------------------------------------------------------------------
// Low-context lens detail (meridian / thin tenants) — W32C
// ---------------------------------------------------------------------------

function buildLowContextLensDetail(lensId: TowerLens): TowerLensDetail {
  const LOW_CONTEXT_MSG =
    'This tenant has a limited evidence base. Lens signals are indicative only. ' +
    'Upload programme documentation and evidence to enable Atlas to generate ' +
    'meaningful lens signals.';

  return {
    lensId,
    primaryQuestion: LENS_LABEL_MAP[lensId] + ' signals are not yet available for this tenant.',
    dataAvailable: [],
    dataMissing: ['Programme documentation', 'Evidence uploads', 'Connector data'],
    topSignal: 'Insufficient data — see low-context disclosure.',
    nextAction: 'Upload evidence to enable ' + LENS_LABEL_MAP[lensId] + ' lens signals.',
    atlasRecommendation:
      'Atlas cannot generate ' +
      LENS_LABEL_MAP[lensId] +
      ' recommendations without evidence. Upload documentation to proceed.',
    lowContextDisclosure: LOW_CONTEXT_MSG,
    deterministicSeed: true,
    caveat:
      'Lens signals are deterministic seed — not live telemetry. ' +
      'These indicators are fixed until live ingestion is wired.',
  };
}

// ---------------------------------------------------------------------------
// Lens detail dispatch
// ---------------------------------------------------------------------------

function getLensDetail(
  tenantSlug: string,
  lens: TowerLens,
): TowerLensDetail | null {
  if (lens === 'portfolio') return null; // portfolio uses scorecards/pressure cards directly

  if (tenantSlug !== 'apex-retail') {
    return buildLowContextLensDetail(lens);
  }

  switch (lens) {
    case 'adoption':
      return APEX_RETAIL_ADOPTION_LENS_DETAIL;
    case 'value':
      return APEX_RETAIL_VALUE_LENS_DETAIL;
    case 'risk':
      return APEX_RETAIL_RISK_LENS_DETAIL;
    default:
      // cost, productivity, tech_data_readiness — not yet seeded
      return buildLowContextLensDetail(lens);
  }
}

const DETERMINISTIC_SEED_CAVEAT =
  'Signals are deterministic seed — not live AI telemetry. These indicators are fixed until live ingestion is wired.';

export function buildControlTowerActiveLensView(
  tenantSlug: string,
  activeLens: TowerLens = 'portfolio',
): ControlTowerActiveLensView {
  const isApexRetail = tenantSlug === 'apex-retail';

  // Scorecards
  let rawScorecards: TowerScorecard[] = [];
  if (isApexRetail) {
    switch (activeLens) {
      case 'portfolio':
        rawScorecards = APEX_RETAIL_PORTFOLIO_SCORECARDS;
        break;
      case 'adoption':
        rawScorecards = APEX_RETAIL_ADOPTION_SCORECARDS;
        break;
      case 'value':
        rawScorecards = APEX_RETAIL_VALUE_SCORECARDS;
        break;
      case 'risk':
        rawScorecards = APEX_RETAIL_RISK_SCORECARDS;
        break;
      default:
        rawScorecards = [];
    }
  }

  // Pressure cards
  let rawPressureCards: TowerPressureCard[] = [];
  if (isApexRetail) {
    switch (activeLens) {
      case 'portfolio':
        rawPressureCards = APEX_RETAIL_PORTFOLIO_PRESSURE_CARDS;
        break;
      case 'risk':
        rawPressureCards = APEX_RETAIL_RISK_PRESSURE_CARDS;
        break;
      default:
        rawPressureCards = [];
    }
  }

  // Enforce max 5 scorecards, max 3 pressure cards
  const scorecards = rawScorecards.slice(0, 5);
  const pressureCards = rawPressureCards.slice(0, 3);

  return {
    tenantSlug,
    activeLens,
    lensLabel: getLensLabel(activeLens),
    availableLenses: listAvailableLenses(),
    scorecards,
    pressureCards,
    lensDetail: getLensDetail(tenantSlug, activeLens),
    askAtlasDeferred: true,
    deterministicSeedCaveat: DETERMINISTIC_SEED_CAVEAT,
    deterministicSeed: true,
  };
}
