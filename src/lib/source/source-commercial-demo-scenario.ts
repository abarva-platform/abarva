// SRC28 — Source Commercial Demo Scenario Seed
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type DemoVendorPricingStatus = 'complete' | 'partial' | 'missing';
export type DemoRiskSeverity = 'critical' | 'high' | 'medium' | 'low';
export type DemoReadinessStatus = 'ready' | 'partial' | 'not-ready';
export type DemoMissionPriority = 'high' | 'medium' | 'low';
export type DemoSignalSeverity = 'critical' | 'warning' | 'info';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DemoVendorSummary {
  vendorId: string;
  vendorLabel: string;           // generic: "Vendor Alpha", "Vendor Beta", etc.
  pricingStatus: DemoVendorPricingStatus;
  missingSections: string[];
  bafoOpportunities: string[];
  commercialAssumptions: string[];
  deterministicSeed: true;       // always true — marks data as seed
}

export interface DemoRiskItem {
  riskId: string;
  category: string;
  label: string;
  severity: DemoRiskSeverity;
  detail: string;
}

export interface DemoMissionItem {
  missionId: string;
  agentOwner: string;            // "Nexus" | "Sentinel" | "Atlas" | "Steward"
  label: string;
  priority: DemoMissionPriority;
}

export interface DemoSignalItem {
  signalId: string;
  signalType: string;
  label: string;
  severity: DemoSignalSeverity;
  shortSummary: string;
}

export interface SourceCommercialDemoScenario {
  scenarioId: string;            // 'ams-outsourcing-demo-2026'
  eventName: string;
  clientContext: string;
  sourcingScope: string;
  vendors: DemoVendorSummary[];  // 4 vendors
  risks: DemoRiskItem[];         // 5 risks
  readinessState: DemoReadinessStatus;
  readinessDetail: string;
  missions: DemoMissionItem[];   // 5 missions
  signals: DemoSignalItem[];     // 4 signals
  bafoOpportunities: string[];   // 3 top-level BAFO items
  caveats: string[];             // 3 caveats
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSourceCommercialDemoScenario(): SourceCommercialDemoScenario {
  const vendors: DemoVendorSummary[] = [
    {
      vendorId: 'vendor-alpha',
      vendorLabel: 'Vendor Alpha',
      pricingStatus: 'complete',
      missingSections: [],
      bafoOpportunities: ['Volume commitment discount', 'SLA rebate structure'],
      commercialAssumptions: ['FTE cost normalised to onshore equivalent'],
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-beta',
      vendorLabel: 'Vendor Beta',
      pricingStatus: 'partial',
      missingSections: ['L3 support rate card', 'Knowledge transfer costs'],
      bafoOpportunities: ['Offshore ratio optimisation'],
      commercialAssumptions: ['Offshore rate applied uniformly'],
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-gamma',
      vendorLabel: 'Vendor Gamma',
      pricingStatus: 'partial',
      missingSections: ['Transition management costs'],
      bafoOpportunities: ['Transition milestone payment deferral'],
      commercialAssumptions: ['Transition timeline assumes parallel run'],
      deterministicSeed: true,
    },
    {
      vendorId: 'vendor-delta',
      vendorLabel: 'Vendor Delta',
      pricingStatus: 'missing',
      missingSections: [
        'Full rate card',
        'SLA commercial framework',
        'Rebate structure',
      ],
      bafoOpportunities: [],
      commercialAssumptions: [],
      deterministicSeed: true,
    },
  ];

  const risks: DemoRiskItem[] = [
    {
      riskId: 'risk-001',
      category: 'pricing',
      label: 'Incomplete rate card coverage',
      severity: 'high',
      detail:
        'Vendor Delta has not submitted a complete rate card. Vendor Beta is missing L3 support rates.',
    },
    {
      riskId: 'risk-002',
      category: 'commercial',
      label: 'Assumption divergence across vendors',
      severity: 'medium',
      detail:
        'Vendors have applied different offshore ratios making direct comparison difficult.',
    },
    {
      riskId: 'risk-003',
      category: 'transition',
      label: 'Transition cost opacity',
      severity: 'high',
      detail:
        'Vendor Gamma transition management costs not included in submission.',
    },
    {
      riskId: 'risk-004',
      category: 'governance',
      label: 'SLA rebate structure absent for two vendors',
      severity: 'medium',
      detail:
        'Without rebate structures it is not possible to assess commercial risk protection.',
    },
    {
      riskId: 'risk-005',
      category: 'evidence',
      label: 'Knowledge transfer cost unknown for Vendor Beta',
      severity: 'low',
      detail:
        'Knowledge transfer costs not submitted; likely to surface in BAFO.',
    },
  ];

  const missions: DemoMissionItem[] = [
    {
      missionId: 'mission-001',
      agentOwner: 'Nexus',
      label: 'Request complete rate card from Vendor Delta',
      priority: 'high',
    },
    {
      missionId: 'mission-002',
      agentOwner: 'Sentinel',
      label: 'Validate L3 support rate card from Vendor Beta',
      priority: 'high',
    },
    {
      missionId: 'mission-003',
      agentOwner: 'Atlas',
      label: 'Normalise offshore cost assumptions across all vendors',
      priority: 'medium',
    },
    {
      missionId: 'mission-004',
      agentOwner: 'Steward',
      label: 'Confirm SLA rebate framework with Vendor Alpha and Gamma',
      priority: 'medium',
    },
    {
      missionId: 'mission-005',
      agentOwner: 'Nexus',
      label: 'Prepare executive decision brief pending Vendor Delta clarification',
      priority: 'low',
    },
  ];

  const signals: DemoSignalItem[] = [
    {
      signalId: 'signal-001',
      signalType: 'pricing_gap',
      label: 'Rate card gap — Vendor Delta',
      severity: 'critical',
      shortSummary:
        'Vendor Delta rate card missing. Cannot proceed to normalised comparison without complete submission.',
    },
    {
      signalId: 'signal-002',
      signalType: 'assumption_divergence',
      label: 'Offshore ratio divergence',
      severity: 'warning',
      shortSummary:
        'Offshore ratios vary materially across vendors. Normalisation required before BAFO.',
    },
    {
      signalId: 'signal-003',
      signalType: 'bafo_readiness',
      label: 'BAFO scope partially confirmed',
      severity: 'warning',
      shortSummary:
        'BAFO strategy confirmed for Vendor Alpha and Beta. Vendor Gamma and Delta pending.',
    },
    {
      signalId: 'signal-004',
      signalType: 'governance_gap',
      label: 'Rebate framework absent',
      severity: 'info',
      shortSummary:
        'Two vendors have not provided SLA rebate structures. Governance risk if not resolved before award.',
    },
  ];

  const bafoOpportunities: string[] = [
    'Volume commitment step-down at 24 months',
    'Offshore ratio optimisation for steady-state',
    'SLA rebate commercial protection',
  ];

  const caveats: string[] = [
    'All pricing data in this scenario is deterministic seed data. Values are representative and do not reflect real market rates or vendor proposals.',
    'Vendor labels are generic identifiers. No real vendor names or proprietary information are used.',
    'This scenario is for demonstration purposes only. Commercial decisions must be based on actual vendor submissions and independent legal review.',
  ];

  return {
    scenarioId: 'ams-outsourcing-demo-2026',
    eventName: 'Application Management Services — Vendor Consolidation 2026',
    clientContext:
      'Large enterprise IT organisation seeking to consolidate three incumbent AMS providers into a preferred-supplier structure. Engagement scope includes application support, incident management, and platform operations across 40+ applications.',
    sourcingScope:
      'Scope: Application Management Services (AMS), L1/L2/L3 support, incident SLAs, platform operations, knowledge transfer. 3-year initial term.',
    vendors,
    risks,
    readinessState: 'partial',
    readinessDetail:
      'Pricing normalisation incomplete due to missing rate cards. Risk assessment partially complete. BAFO strategy available for Vendor Alpha and Beta only. Executive decision pending clarification from Vendor Delta.',
    missions,
    signals,
    bafoOpportunities,
    caveats,
    generatedAt: '2026-04-26',
  };
}
