// SRC35 — AMS Outsourcing 2026 Intelligence Bridge Signals View Model
// Pure TypeScript, no React, no model calls, no network calls.
// All data is deterministic seed data for demonstration purposes only.
// Surfaces PAT-AMS-001, PAT-AMS-002, and the AMS→CDP cross-reference signal.

export const AMS_INTELLIGENCE_EVENT_ID = 'apex-retail-ams-outsourcing-2026';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AmsSignalConfidence = 'high' | 'medium' | 'low';
export type AmsSignalCategory =
  | 'pricing_divergence'
  | 'scope_creep_risk'
  | 'cross_program_correlation';

export interface AmsIntelligenceSignal {
  patternId: string;
  category: AmsSignalCategory;
  title: string;
  summary: string;
  confidence: AmsSignalConfidence;
  evidenceDocCount: number;
  affectedVendorIds: string[];
  cdpCorrelation: string | null;
  sourceCitation: string;
  deterministicSeed: true;
}

export interface AmsIntelligenceSignalBundle {
  eventId: string;
  generatedAt: string;
  signals: AmsIntelligenceSignal[];
  crossProgramNote: string;
  evidenceCaveat: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Signals seed
// ---------------------------------------------------------------------------

const AMS_SIGNALS: AmsIntelligenceSignal[] = [
  {
    patternId: 'PAT-AMS-001',
    category: 'pricing_divergence',
    title: 'AMS Vendor Pricing Divergence',
    summary:
      'Significant pricing spread observed across all four AMS vendor proposals. The spread is wide enough to indicate fundamentally different service delivery assumptions — not typical bid variation. BAFO normalisation is required before selection can proceed.',
    confidence: 'high',
    evidenceDocCount: 4,
    affectedVendorIds: [
      'northstar-managed-services',
      'bluemaster-operations',
      'datapeak-services',
      'arcvault-managed',
    ],
    cdpCorrelation:
      'The pricing divergence increases delivery cost uncertainty for the CDP Implementation programme. If the lowest-cost vendor is selected, CDP data migration resource assumptions may need revision.',
    sourceCitation:
      'Sentinel pattern detection — 4 vendor proposal documents ingested (deterministic seed).',
    deterministicSeed: true,
  },
  {
    patternId: 'PAT-AMS-002',
    category: 'scope_creep_risk',
    title: 'AMS Scope Creep in SLAs',
    summary:
      'Two vendor proposals contain SLA language that extends beyond the defined Apex Retail application scope. Broad SLA framing at contract award typically leads to managed footprint expansion in Year 1–2.',
    confidence: 'medium',
    evidenceDocCount: 2,
    affectedVendorIds: ['northstar-managed-services', 'datapeak-services'],
    cdpCorrelation:
      'SLA scope expansion risk overlaps with the CDP Implementation programme\'s integration timeline. An AMS scope extension post-award could delay CDP data migration milestones.',
    sourceCitation:
      'Sentinel pattern detection — 2 SLA appendices reviewed (deterministic seed).',
    deterministicSeed: true,
  },
  {
    patternId: 'PAT-AMS-CROSS-001',
    category: 'cross_program_correlation',
    title: 'AMS Scope and CDP Integration Timeline Correlation',
    summary:
      'AMS vendor onboarding timeline risk and CDP data migration window are correlated. Delayed AMS selection or a vendor with extended onboarding cadence will directly compress the CDP integration delivery window in Q3 2026.',
    confidence: 'medium',
    evidenceDocCount: 3,
    affectedVendorIds: ['datapeak-services'],
    cdpCorrelation:
      'Direct correlation: AMS implementation completion is a dependency for CDP data platform readiness. Risk is highest if DataPeak is selected (16-week onboarding).',
    sourceCitation:
      'Sentinel cross-programme pattern — AMS event + CDP programme timeline analysis (deterministic seed).',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildAmsIntelligenceSignals(): AmsIntelligenceSignalBundle {
  return {
    eventId: AMS_INTELLIGENCE_EVENT_ID,
    generatedAt: '2026-04-26T00:00:00.000Z',
    signals: AMS_SIGNALS.map((s) => ({ ...s })),
    crossProgramNote:
      'The AMS sourcing event and the CDP Implementation programme (APX-CDP-2026) share timeline dependencies. Sentinel has detected correlated risk signals. Review the CDP intelligence tab for downstream impact.',
    evidenceCaveat:
      'All intelligence signals are deterministic seed data. No live vendor response has been ingested. Confidence levels are indicative for demonstration purposes only.',
    deterministicSeed: true,
  };
}

export function getAmsSignalByPatternId(
  patternId: string,
): AmsIntelligenceSignal | null {
  return AMS_SIGNALS.find((s) => s.patternId === patternId) ?? null;
}
