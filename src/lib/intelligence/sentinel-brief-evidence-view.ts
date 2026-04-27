export type EvidenceItemStatus = 'confirmed' | 'candidate' | 'missing' | 'deferred';
export type SentinelBriefSurface = 'intelligence' | 'source' | 'programs';

export interface EvidenceItem {
  evidenceId: string;
  label: string;
  status: EvidenceItemStatus;
  source: string | null;
  note: string;
  deterministicSeed: true;
}

export interface SentinelEvidenceBriefView {
  tenantSlug: string;
  tenantName: string;
  surface: SentinelBriefSurface;
  topPatternCategory: string;
  topPatternSummary: string;
  contextUsed: string[];
  evidenceConfidenceLevel: 'high' | 'medium' | 'low' | 'insufficient';
  evidenceConfidenceReason: string;
  confirmedEvidence: EvidenceItem[];
  missingEvidence: EvidenceItem[];
  unsupportedClaims: string[];
  affectedWork: string[];
  recommendedNextAction: string;
  deterministicSeedCaveat: string;
  deterministicSeed: true;
}

export function buildSentinelEvidenceBriefView(
  tenantSlug: string,
  surface: SentinelEvidenceBriefView['surface'] = 'intelligence'
): SentinelEvidenceBriefView {
  const isRich = tenantSlug === 'apex-retail';
  return {
    tenantSlug,
    tenantName: tenantSlug === 'apex-retail' ? 'Apex Retail' : tenantSlug,
    surface,
    topPatternCategory: isRich ? 'vendor_assumption_divergence' : 'insufficient_data',
    topPatternSummary: isRich
      ? 'Vendor assumption divergence across AMS outsourcing responses. 2 of 4 responses incomplete. BAFO readiness at risk.'
      : 'Insufficient data for Sentinel analysis. No client-specific evidence seeded.',
    contextUsed: isRich
      ? ['AMS vendor responses (partial — 4 vendors, 2 complete)', 'RFP scope document', 'Pricing normalization model (Wave 14)', 'Programme APX-CDP-2026 workshop 5 outcomes']
      : ['Deterministic seed data only. No client-specific context.'],
    evidenceConfidenceLevel: isRich ? 'medium' : 'insufficient',
    evidenceConfidenceReason: isRich
      ? 'Partial — 2 of 4 vendor responses complete. Missing BluePeak and Horizon pricing data. Value hypothesis unconfirmed.'
      : 'Insufficient — no client-specific evidence. Sentinel cannot assess without real or seeded data.',
    confirmedEvidence: isRich
      ? [
          { evidenceId: 'EV-001', label: 'Northstar Managed Services pricing response', status: 'confirmed', source: 'AMS scenario seed (Wave 19)', note: 'Complete — scope and pricing included.', deterministicSeed: true },
          { evidenceId: 'EV-002', label: 'Meridian Systems Partners pricing response', status: 'confirmed', source: 'AMS scenario seed (Wave 19)', note: 'Complete — scope and pricing included.', deterministicSeed: true },
          { evidenceId: 'EV-003', label: 'Workshop 5 stakeholder alignment note', status: 'candidate', source: 'Workshop 5 outcomes (Wave 19)', note: 'Captured but not yet approved as formal evidence.', deterministicSeed: true },
        ]
      : [],
    missingEvidence: isRich
      ? [
          { evidenceId: 'MEV-001', label: 'BluePeak Digital Operations full pricing response', status: 'missing', source: null, note: 'Requested — not received. Required for BAFO readiness.', deterministicSeed: true },
          { evidenceId: 'MEV-002', label: 'Horizon Application Services assumptions document', status: 'missing', source: null, note: 'Partial response only. Assumption basis unclear.', deterministicSeed: true },
          { evidenceId: 'MEV-003', label: 'Approved value baseline for CDP Activation', status: 'missing', source: null, note: 'Required for Synthesis → Design gate. Platform owner confirmation needed.', deterministicSeed: true },
        ]
      : [
          { evidenceId: 'MEV-THIN-001', label: 'Client-specific vendor data', status: 'missing', source: null, note: 'Not seeded for this tenant.', deterministicSeed: true },
          { evidenceId: 'MEV-THIN-002', label: 'Programme evidence', status: 'missing', source: null, note: 'Not seeded for this tenant.', deterministicSeed: true },
        ],
    unsupportedClaims: isRich
      ? ['Final vendor ranking — selection criteria not approved', 'Value savings projection — value baseline missing']
      : [],
    affectedWork: isRich
      ? ['AMS Vendor Consolidation 2026', 'APX-CDP-2026 · CDP Activation — Synthesis gate']
      : [],
    recommendedNextAction: isRich
      ? 'Request full pricing response from BluePeak Digital Operations and complete assumption document from Horizon Application Services. Resolve before BAFO.'
      : 'No actionable recommendation. Apex Retail is the recommended demo tenant for full Sentinel experience.',
    deterministicSeedCaveat: 'All evidence items are deterministic seed data. Not real vendor responses. Not real programme evidence.',
    deterministicSeed: true,
  };
}
