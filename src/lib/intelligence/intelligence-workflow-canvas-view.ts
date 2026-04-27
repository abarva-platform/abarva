export type IntelligenceCanvasMode =
  | 'summary'
  | 'evidence'
  | 'programs'
  | 'actions'
  | 'signals';

export type IntelligenceConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export interface SentinelBriefView {
  agentLabel: 'Sentinel';
  tenantSlug: string;
  tenantName: string;
  surface: 'intelligence';
  topPatternCategory: string;
  topPatternLabel: string;
  contextUsed: string[];
  confidenceLevel: IntelligenceConfidenceLevel;
  confidenceReason: string;
  unsupportedClaims: string[];
  missingEvidence: string[];
  affectedPrograms: string[];
  affectedSourceEvents: string[];
  recommendedNextAction: string;
  deterministicSeedCaveat: string;
  tenantRichnessCaveat: string;
  deterministicSeed: true;
}

export interface IntelligencePatternItem {
  patternId: string;
  category: string;
  label: string;
  confidenceLevel: IntelligenceConfidenceLevel;
  evidenceBasis: string;
  missingEvidence: string | null;
  affectedWorkItem: string | null;
  deterministicSeed: true;
}

export interface IntelligenceWorkflowCanvasView {
  tenantSlug: string;
  activeMode: IntelligenceCanvasMode;
  sentinelBrief: SentinelBriefView;
  patternStrip: IntelligencePatternItem[];
  availableModes: IntelligenceCanvasMode[];
  deterministicSeedCaveat: string;
  deterministicSeed: true;
}

export function buildSentinelBriefView(tenantSlug: string): SentinelBriefView {
  // Returns deterministic Sentinel brief for apex-retail
  // For other tenants, returns low-confidence brief with appropriate caveat
  const isRich = tenantSlug === 'apex-retail';
  return {
    agentLabel: 'Sentinel',
    tenantSlug,
    tenantName: tenantSlug === 'apex-retail' ? 'Apex Retail' : tenantSlug,
    surface: 'intelligence',
    topPatternCategory: isRich ? 'vendor_assumption_divergence' : 'insufficient_data',
    topPatternLabel: isRich
      ? 'Vendor assumption divergence detected across AMS consolidation responses'
      : 'Insufficient data for client-specific pattern detection',
    contextUsed: isRich
      ? ['AMS vendor responses (4)', 'RFP scope document', 'Programme APX-CDP-2026 context']
      : ['Deterministic seed data only'],
    confidenceLevel: isRich ? 'medium' : 'low',
    confidenceReason: isRich
      ? 'Partial — 2 of 4 vendor responses complete. Assumption gap detected but not yet validated.'
      : 'Insufficient evidence. No client-specific data seeded for this tenant.',
    unsupportedClaims: isRich
      ? ['Final pricing recommendation — BAFO required', 'Vendor ranking — selection criteria not yet approved']
      : [],
    missingEvidence: isRich
      ? ['BluePeak Digital Operations full pricing response', 'Horizon Application Services assumptions document', 'Approved scorecard for vendor evaluation']
      : ['Client-specific vendor data', 'Programme evidence', 'Procurement context'],
    affectedPrograms: isRich ? ['APX-CDP-2026 · CDP Activation'] : [],
    affectedSourceEvents: isRich ? ['AMS Vendor Consolidation 2026'] : [],
    recommendedNextAction: isRich
      ? 'Request full pricing response from BluePeak Digital Operations and Horizon Application Services before BAFO.'
      : 'No actionable recommendation available. Seed Apex Retail demo data for full Intelligence experience.',
    deterministicSeedCaveat: 'Deterministic pattern detection. Not client-specific live intelligence. All patterns are seed data.',
    tenantRichnessCaveat: isRich
      ? 'Apex Retail — Partial demo data. Source AMS scenario linked.'
      : 'Thin or shell-only tenant. Intelligence demo is not meaningful without real or seeded data.',
    deterministicSeed: true,
  };
}

export function buildIntelligenceWorkflowCanvasView(
  tenantSlug: string,
  activeMode: IntelligenceCanvasMode = 'summary'
): IntelligenceWorkflowCanvasView {
  const sentinelBrief = buildSentinelBriefView(tenantSlug);
  const patternStrip: IntelligencePatternItem[] = tenantSlug === 'apex-retail'
    ? [
        {
          patternId: 'PAT-001',
          category: 'vendor_assumption_divergence',
          label: 'Assumption divergence across AMS vendor responses',
          confidenceLevel: 'medium',
          evidenceBasis: '3 of 4 vendor responses reviewed',
          missingEvidence: 'BluePeak full pricing response',
          affectedWorkItem: 'AMS Vendor Consolidation 2026',
          deterministicSeed: true,
        },
        {
          patternId: 'PAT-002',
          category: 'bafo_readiness_gap',
          label: 'BAFO readiness gap — 2 vendors incomplete',
          confidenceLevel: 'medium',
          evidenceBasis: 'Pricing normalization model (Wave 14)',
          missingEvidence: 'Horizon Application Services pricing sheet',
          affectedWorkItem: 'AMS Vendor Consolidation 2026',
          deterministicSeed: true,
        },
        {
          patternId: 'PAT-003',
          category: 'programme_evidence_gap',
          label: 'CDP Activation — value hypothesis evidence incomplete',
          confidenceLevel: 'low',
          evidenceBasis: 'Workshop 5 outcomes (partial)',
          missingEvidence: 'Approved value baseline, platform owner confirmation',
          affectedWorkItem: 'APX-CDP-2026 · CDP Activation',
          deterministicSeed: true,
        },
      ]
    : [];

  return {
    tenantSlug,
    activeMode,
    sentinelBrief,
    patternStrip,
    availableModes: ['summary', 'evidence', 'programs', 'actions', 'signals'],
    deterministicSeedCaveat: 'All patterns are deterministic seed data. Not live intelligence.',
    deterministicSeed: true,
  };
}
