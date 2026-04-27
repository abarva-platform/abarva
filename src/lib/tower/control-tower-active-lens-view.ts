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

export interface ControlTowerActiveLensView {
  tenantSlug: string;
  activeLens: TowerLens;
  lensLabel: string;
  availableLenses: TowerLens[];
  scorecards: TowerScorecard[]; // max 5
  pressureCards: TowerPressureCard[]; // max 3
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

const DETERMINISTIC_SEED_CAVEAT =
  'Signals are deterministic seed — not live AI telemetry. These indicators are fixed until live ingestion is wired.';

export function buildControlTowerActiveLensView(
  tenantSlug: string,
  activeLens: TowerLens = 'portfolio',
): ControlTowerActiveLensView {
  const isApexRetail = tenantSlug === 'apex-retail';

  const rawScorecards: TowerScorecard[] = isApexRetail
    ? activeLens === 'portfolio'
      ? APEX_RETAIL_PORTFOLIO_SCORECARDS
      : []
    : [];

  const rawPressureCards: TowerPressureCard[] =
    isApexRetail && activeLens === 'portfolio' ? APEX_RETAIL_PORTFOLIO_PRESSURE_CARDS : [];

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
    askAtlasDeferred: true,
    deterministicSeedCaveat: DETERMINISTIC_SEED_CAVEAT,
    deterministicSeed: true,
  };
}
