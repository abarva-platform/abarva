/**
 * vendor-detail.ts
 *
 * Seeded vendor detail fixture for the Source Vendor Detail page (T10).
 * Covers the AMS Outsourcing 2026 event vendors (Northstar, ArcVault,
 * BlueMaster, DataPeak) with enriched fields for response completeness,
 * normalized pricing, risk posture, scorecard rows, and BAFO history.
 */

export type VendorStatus =
  | 'finalist'
  | 'invited-bafo'
  | 'shortlisted'
  | 'declined'
  | 'disqualified';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface VendorScoreRow {
  criterion: string;
  weight: number; // 0–100
  score: number;  // 0–100
  weighted: number;
  rater1: number;
  rater2: number;
  deviation: number;
}

export interface BafoRound {
  round: number;
  description: string;
  status: 'open' | 'closed' | 'signed';
  closedAt?: string;
  questionsCount?: number;
  answeredCount?: number;
}

export interface VendorDetail {
  id: string;
  name: string;
  shortName: string;
  status: VendorStatus;
  rank?: number;
  // Company profile
  exchange?: string;
  ticker?: string;
  hq?: string;
  employees?: string;
  trackRecord?: string;
  // Response completeness (Step 4)
  responseReceivedAt?: string;
  mandatoryItemsTotal?: number;
  mandatoryItemsComplete?: number;
  optionalItemsTotal?: number;
  optionalItemsComplete?: number;
  clarificationsTotal?: number;
  clarificationsResolved?: number;
  // Pricing (Step 6 normalized)
  listTcoUsd?: number;
  normalizedTcoUsd?: number;
  openTraps?: { severity: 'P0' | 'P1' | 'P2'; description: string }[];
  // Risk posture (Sentinel)
  riskFinancial?: RiskLevel;
  riskSecurity?: RiskLevel;
  riskConcentration?: RiskLevel;
  riskGeopolitical?: RiskLevel;
  // Scorecard (Step 5)
  scorecardRows?: VendorScoreRow[];
  scorecardWeightedTotal?: number;
  // BAFO history (Step 7)
  bafoHistory?: BafoRound[];
  // Differentiators
  differentiators?: string[];
}

// ─── Event → vendor map ────────────────────────────────────────────────────

const AMS_VENDORS: VendorDetail[] = [
  {
    id: 'northstar-managed-services',
    name: 'Northstar Managed Services',
    shortName: 'Northstar',
    status: 'finalist',
    rank: 1,
    exchange: 'NASDAQ',
    ticker: 'NSMS',
    hq: 'Austin, TX',
    employees: '3,800',
    trackRecord: '11-year enterprise AMS track record',
    responseReceivedAt: 'Feb 3 · day 14 of 14',
    mandatoryItemsTotal: 44,
    mandatoryItemsComplete: 44,
    optionalItemsTotal: 14,
    optionalItemsComplete: 11,
    clarificationsTotal: 6,
    clarificationsResolved: 6,
    listTcoUsd: 9_800_000,
    normalizedTcoUsd: 11_540_000,
    openTraps: [
      { severity: 'P0', description: 'Tier-2 support cost bundled in platform fee — no itemised breakdown' },
      { severity: 'P1', description: 'SLA scope broader than reference — may expand footprint post-award' },
    ],
    riskFinancial: 'low',
    riskSecurity: 'low',
    riskConcentration: 'moderate',
    riskGeopolitical: 'low',
    scorecardRows: [
      { criterion: 'Capability fit',     weight: 25, score: 91, weighted: 22.75, rater1: 93, rater2: 89, deviation: 2 },
      { criterion: 'AMS track record',   weight: 20, score: 88, weighted: 17.6,  rater1: 90, rater2: 86, deviation: 2 },
      { criterion: 'Transition quality', weight: 20, score: 79, weighted: 15.8,  rater1: 80, rater2: 78, deviation: 1 },
      { criterion: 'Commercial model',   weight: 20, score: 74, weighted: 14.8,  rater1: 75, rater2: 73, deviation: 1 },
      { criterion: 'Governance',         weight: 15, score: 83, weighted: 12.45, rater1: 84, rater2: 82, deviation: 1 },
    ],
    scorecardWeightedTotal: 83.4,
    bafoHistory: [
      {
        round: 2,
        description: 'Itemised tier-2 pricing provided · SLA scope narrowed to Apex reference spec · pricing reduced 4.2%',
        status: 'signed',
        closedAt: 'May 10',
      },
      {
        round: 1,
        description: '5 questions sent · 4 answered fully · 1 partial (tier-2 cost). Pricing trap on bundled fee flagged for round 2.',
        status: 'closed',
        closedAt: 'May 3',
        questionsCount: 5,
        answeredCount: 4,
      },
    ],
    differentiators: [
      'Strong AMS track record in retail verticals',
      'Dedicated run-team model with named staffing',
      'Pre-negotiated SLA framework aligned to Apex Retail ops cadence',
    ],
  },
  {
    id: 'arcvault-managed',
    name: 'ArcVault Managed',
    shortName: 'ArcVault',
    status: 'finalist',
    rank: 2,
    hq: 'Chicago, IL',
    employees: '2,100',
    trackRecord: '7-year managed services record',
    responseReceivedAt: 'Feb 3 · day 14 of 14',
    mandatoryItemsTotal: 44,
    mandatoryItemsComplete: 44,
    optionalItemsTotal: 14,
    optionalItemsComplete: 9,
    clarificationsTotal: 4,
    clarificationsResolved: 4,
    listTcoUsd: 10_200_000,
    normalizedTcoUsd: 11_760_000,
    openTraps: [
      { severity: 'P0', description: 'Governance framework incomplete — steering committee and escalation paths undefined' },
    ],
    riskFinancial: 'low',
    riskSecurity: 'moderate',
    riskConcentration: 'low',
    riskGeopolitical: 'low',
    scorecardRows: [
      { criterion: 'Capability fit',     weight: 25, score: 80, weighted: 20.0,  rater1: 82, rater2: 78, deviation: 2 },
      { criterion: 'AMS track record',   weight: 20, score: 77, weighted: 15.4,  rater1: 79, rater2: 75, deviation: 2 },
      { criterion: 'Transition quality', weight: 20, score: 85, weighted: 17.0,  rater1: 86, rater2: 84, deviation: 1 },
      { criterion: 'Commercial model',   weight: 20, score: 88, weighted: 17.6,  rater1: 89, rater2: 87, deviation: 1 },
      { criterion: 'Governance',         weight: 15, score: 62, weighted: 9.3,   rater1: 64, rater2: 60, deviation: 2 },
    ],
    scorecardWeightedTotal: 79.3,
    bafoHistory: [
      {
        round: 1,
        description: '3 questions sent · 3 answered fully. Governance gap acknowledged — supplementary steering model submitted.',
        status: 'signed',
        closedAt: 'May 8',
        questionsCount: 3,
        answeredCount: 3,
      },
    ],
    differentiators: [
      'Hybrid onshore/nearshore model — resilience without full offshore dependency',
      'Application rationalization advisory included in base scope',
      'Proven CDP/SAP integration AMS experience (2 named references)',
    ],
  },
  {
    id: 'bluemaster-operations',
    name: 'BlueMaster Operations',
    shortName: 'BlueMaster',
    status: 'declined',
    rank: 3,
    hq: 'Bangalore, IN',
    employees: '6,500',
    trackRecord: '5-year offshore AMS delivery',
    responseReceivedAt: 'Feb 3 · day 14 of 14',
    mandatoryItemsTotal: 44,
    mandatoryItemsComplete: 42,
    optionalItemsTotal: 14,
    optionalItemsComplete: 6,
    clarificationsTotal: 8,
    clarificationsResolved: 5,
    listTcoUsd: 7_900_000,
    normalizedTcoUsd: 9_100_000,
    openTraps: [
      { severity: 'P0', description: 'Transition plan is 6 pages vs industry expectation of 25–40 — critical milestones absent' },
    ],
    riskFinancial: 'low',
    riskSecurity: 'moderate',
    riskConcentration: 'low',
    riskGeopolitical: 'moderate',
    scorecardRows: [
      { criterion: 'Capability fit',     weight: 25, score: 71, weighted: 17.75, rater1: 72, rater2: 70, deviation: 1 },
      { criterion: 'AMS track record',   weight: 20, score: 68, weighted: 13.6,  rater1: 70, rater2: 66, deviation: 2 },
      { criterion: 'Transition quality', weight: 20, score: 52, weighted: 10.4,  rater1: 55, rater2: 49, deviation: 3 },
      { criterion: 'Commercial model',   weight: 20, score: 91, weighted: 18.2,  rater1: 92, rater2: 90, deviation: 1 },
      { criterion: 'Governance',         weight: 15, score: 70, weighted: 10.5,  rater1: 71, rater2: 69, deviation: 1 },
    ],
    scorecardWeightedTotal: 70.45,
    differentiators: [
      'Lowest total-cost profile across 40+ application estate',
      'Automated L1/L2 resolution — documented 62% auto-resolution rate',
      'Offshore-dominant delivery model',
    ],
  },
  {
    id: 'datapeak-services',
    name: 'DataPeak Services',
    shortName: 'DataPeak',
    status: 'declined',
    rank: 4,
    hq: 'Toronto, CA',
    employees: '1,400',
    trackRecord: '8-year analytics-adjacent AMS experience',
    responseReceivedAt: 'Feb 5 · day 16 of 14 (late)',
    mandatoryItemsTotal: 44,
    mandatoryItemsComplete: 38,
    optionalItemsTotal: 14,
    optionalItemsComplete: 4,
    clarificationsTotal: 10,
    clarificationsResolved: 7,
    listTcoUsd: 11_100_000,
    normalizedTcoUsd: 12_800_000,
    openTraps: [
      { severity: 'P1', description: 'CDP integration timeline conflicts with Apex Q3 milestone — 16-week onboarding vs 10-week window' },
    ],
    riskFinancial: 'moderate',
    riskSecurity: 'low',
    riskConcentration: 'low',
    riskGeopolitical: 'low',
    scorecardRows: [
      { criterion: 'Capability fit',     weight: 25, score: 64, weighted: 16.0,  rater1: 66, rater2: 62, deviation: 2 },
      { criterion: 'AMS track record',   weight: 20, score: 59, weighted: 11.8,  rater1: 61, rater2: 57, deviation: 2 },
      { criterion: 'Transition quality', weight: 20, score: 62, weighted: 12.4,  rater1: 63, rater2: 61, deviation: 1 },
      { criterion: 'Commercial model',   weight: 20, score: 75, weighted: 15.0,  rater1: 76, rater2: 74, deviation: 1 },
      { criterion: 'Governance',         weight: 15, score: 73, weighted: 10.95, rater1: 74, rater2: 72, deviation: 1 },
    ],
    scorecardWeightedTotal: 66.15,
    differentiators: [
      'Deep analytics and data platform AMS capability',
      'Embedded pattern alerting in managed service toolchain',
      'Strong reference from comparable retail client (2023–present)',
    ],
  },
];

// Event-keyed vendor registry (expand when more seeded events get vendors)
const VENDOR_REGISTRY: Record<string, VendorDetail[]> = {
  'apex-retail-ams-outsourcing-2026': AMS_VENDORS,
  // alias used by some routes
  'ams-vendor-2026': AMS_VENDORS,
};

export function getVendorsForEvent(eventId: string): VendorDetail[] {
  return VENDOR_REGISTRY[eventId] ?? [];
}

export function getVendorDetail(eventId: string, vendorId: string): VendorDetail | null {
  const vendors = getVendorsForEvent(eventId);
  return vendors.find((v) => v.id === vendorId) ?? null;
}

export function formatUsdM(cents: number): string {
  return `$${(cents / 1_000_000).toFixed(1)}M`;
}

export function riskLevelLabel(level: RiskLevel): string {
  return level.toUpperCase();
}

export function riskLevelColor(level: RiskLevel): string {
  switch (level) {
    case 'low':      return '#1d9e75';
    case 'moderate': return '#ba7517';
    case 'high':     return '#c0392b';
    case 'critical': return '#8e1010';
  }
}
