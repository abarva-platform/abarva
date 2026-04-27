// SRC34 — AMS Outsourcing 2026 Apex Retail Vendor Storyline View Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.
// tenantSlug: apex-retail | sourceEventId: apex-retail-ams-outsourcing-2026

export const AMS_OUTSOURCING_2026_EVENT_ID = 'apex-retail-ams-outsourcing-2026';
export const AMS_OUTSOURCING_2026_EVENT_NAME = 'AMS Outsourcing 2026';
export const AMS_OUTSOURCING_2026_TENANT_SLUG = 'apex-retail';
export const AMS_OUTSOURCING_2026_LINKED_PROGRAM = 'APX-CDP-2026';

// ---------------------------------------------------------------------------
// Vendor proposal status
// ---------------------------------------------------------------------------

export type AmsVendorProposalStatus =
  | 'received'
  | 'under_review'
  | 'bafo_requested';

export type AmsPricingBand = 'low' | 'medium' | 'high';

export type AmsRiskSignalSeverity = 'critical' | 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Vendor storyline
// ---------------------------------------------------------------------------

export interface AmsVendorStorylineItem {
  vendorId: string;
  vendorLabel: string;
  proposalStatus: AmsVendorProposalStatus;
  proposalStatusLabel: string;
  keyDifferentiators: string[];
  riskFlags: Array<{
    severity: AmsRiskSignalSeverity;
    label: string;
    detail: string;
    sentinelPatternRef: string | null;
  }>;
  pricingBand: AmsPricingBand;
  pricingBandLabel: string;
  sourceToProgramBridge: string;
  deterministicSeed: true;
}

export interface AmsVendorStorylineSummary {
  eventId: string;
  eventName: string;
  tenantSlug: string;
  linkedProgramCode: string;
  vendors: AmsVendorStorylineItem[];
  pricingDivergenceNote: string;
  evidenceCaveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const VENDOR_STORYLINE: AmsVendorStorylineItem[] = [
  {
    vendorId: 'northstar-managed-services',
    vendorLabel: 'Northstar Managed Services',
    proposalStatus: 'bafo_requested',
    proposalStatusLabel: 'BAFO Requested',
    keyDifferentiators: [
      'Strong AMS track record in retail verticals',
      'Dedicated run-team model with named staffing',
      'Pre-negotiated SLA framework aligned to Apex Retail ops cadence',
    ],
    riskFlags: [
      {
        severity: 'high',
        label: 'Pricing opacity on tier-2 application support',
        detail: 'Tier-2 application support cost is bundled into a platform fee — no itemised breakdown provided.',
        sentinelPatternRef: 'PAT-AMS-001',
      },
      {
        severity: 'medium',
        label: 'SLA scope creep indicators',
        detail: 'SLA definitions in Section 4.2 are broader than the Apex Retail reference scope — may expand managed footprint post-award.',
        sentinelPatternRef: 'PAT-AMS-002',
      },
    ],
    pricingBand: 'medium',
    pricingBandLabel: 'Mid-range',
    sourceToProgramBridge:
      'Northstar Managed Services staffing assumptions feed into the CDP Implementation delivery model under APX-CDP-2026.',
    deterministicSeed: true,
  },
  {
    vendorId: 'bluemaster-operations',
    vendorLabel: 'BlueMaster Operations',
    proposalStatus: 'under_review',
    proposalStatusLabel: 'Under Review',
    keyDifferentiators: [
      'Lowest total-cost profile across 40+ application estate',
      'Automated L1/L2 resolution — documented 62% auto-resolution rate',
      'Offshore-dominant delivery model',
    ],
    riskFlags: [
      {
        severity: 'critical',
        label: 'Transition plan quality gap',
        detail: 'Transition plan is 6 pages vs industry expectation of 25–40. Critical knowledge transfer milestones absent.',
        sentinelPatternRef: 'PAT-AMS-001',
      },
    ],
    pricingBand: 'low',
    pricingBandLabel: 'Below-market',
    sourceToProgramBridge:
      'BlueMaster low-cost model could affect CDP program quality assumptions if selected for AMS delivery.',
    deterministicSeed: true,
  },
  {
    vendorId: 'datapeak-services',
    vendorLabel: 'DataPeak Services',
    proposalStatus: 'under_review',
    proposalStatusLabel: 'Under Review',
    keyDifferentiators: [
      'Deep analytics and data platform AMS capability',
      'Embedded Sentinel-like pattern alerting in managed service toolchain',
      'Strong reference from comparable retail client (2023–present)',
    ],
    riskFlags: [
      {
        severity: 'medium',
        label: 'CDP integration timeline risk',
        detail: 'DataPeak\'s standard onboarding cadence is 16 weeks — conflicts with CDP program Q3 milestone.',
        sentinelPatternRef: 'PAT-AMS-002',
      },
    ],
    pricingBand: 'high',
    pricingBandLabel: 'Premium',
    sourceToProgramBridge:
      'DataPeak\'s data platform AMS scope directly supports the CDP data migration workstream in APX-CDP-2026.',
    deterministicSeed: true,
  },
  {
    vendorId: 'arcvault-managed',
    vendorLabel: 'ArcVault Managed',
    proposalStatus: 'bafo_requested',
    proposalStatusLabel: 'BAFO Requested',
    keyDifferentiators: [
      'Hybrid onshore/nearshore model — resilience without full offshore dependency',
      'Application rationalization advisory included in base scope',
      'Proven CDP/SAP integration AMS experience (2 named references)',
    ],
    riskFlags: [
      {
        severity: 'high',
        label: 'Governance framework incomplete',
        detail: 'Steering committee and escalation paths are not defined in the proposal — creates oversight gap in Year 1.',
        sentinelPatternRef: 'PAT-AMS-001',
      },
    ],
    pricingBand: 'medium',
    pricingBandLabel: 'Mid-range',
    sourceToProgramBridge:
      'ArcVault hybrid model supports both AMS continuity and CDP delivery resource sharing in APX-CDP-2026.',
    deterministicSeed: true,
  },
];

export function buildAmsVendorStoryline(): AmsVendorStorylineSummary {
  return {
    eventId: AMS_OUTSOURCING_2026_EVENT_ID,
    eventName: AMS_OUTSOURCING_2026_EVENT_NAME,
    tenantSlug: AMS_OUTSOURCING_2026_TENANT_SLUG,
    linkedProgramCode: AMS_OUTSOURCING_2026_LINKED_PROGRAM,
    vendors: VENDOR_STORYLINE.map((v) => ({ ...v })),
    pricingDivergenceNote:
      'Significant pricing spread observed across vendor proposals. Relative bands (low/medium/high) reflect normalised comparison — no absolute figures are shown as live pricing has not been confirmed.',
    evidenceCaveat:
      'All vendor data is deterministic seed for demonstration purposes only. No live vendor response has been ingested. Risk flags are indicative, not advisory.',
    deterministicSeed: true,
  };
}

export function getAmsVendorById(
  vendorId: string,
): AmsVendorStorylineItem | null {
  return VENDOR_STORYLINE.find((v) => v.vendorId === vendorId) ?? null;
}
