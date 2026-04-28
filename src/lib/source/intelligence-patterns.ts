// Source intelligence pattern detection.
// Identifies negotiation and commercial patterns from Source event data.
// Deterministic — no model calls, no network calls.

export type IntelligencePatternCategory =
  | 'pricing_compression'     // vendors are compressing on price
  | 'scope_anchor'            // vendor anchoring on broad scope
  | 'evidence_leverage'       // leveraging evidence gaps
  | 'timeline_pressure'       // artificial urgency from vendor
  | 'bundling_trap'           // bundling high/low value services
  | 'governance_avoidance'    // avoiding commitments
  | 'champion_dependency'     // single internal champion risk
  | 'reference_manipulation'  // cherry-picked references
  | 'pricing_opacity'         // opaque pricing structure
  | 'scope_creep_setup';      // scope designed to expand

export type IntelligencePatternStrength = 'confirmed' | 'likely' | 'possible' | 'not_detected';
export type IntelligencePatternSource = 'pricing' | 'scope' | 'evidence' | 'timeline' | 'governance' | 'commercial';

export interface IntelligencePattern {
  patternId: string;
  category: IntelligencePatternCategory;
  name: string;
  description: string;
  strength: IntelligencePatternStrength;
  vendorIds: string[];  // empty = event-level
  indicators: string[];
  counterStrategy: string;
  riskIfIgnored: string;
  source: IntelligencePatternSource;
  detectedAt: string;
}

export interface IntelligencePatternSummary {
  eventId: string;
  eventName: string;
  generatedAt: string;
  patterns: IntelligencePattern[];
  confirmedCount: number;
  likelyCount: number;
  possibleCount: number;
  topPatternCategory: IntelligencePatternCategory | null;
  narrativeSummary: string;
}

export interface IntelligencePatternInput {
  eventId: string;
  eventName: string;
  vendorIds: string[];
  hasOpaquePricing: boolean;
  hasBroadScope: boolean;
  hasEvidenceGaps: boolean;
  hasTimelinePressure: boolean;
  hasGovernanceAvoidance: boolean;
  hasBundledServices: boolean;
}

export function detectIntelligencePatterns(
  input: IntelligencePatternInput,
): IntelligencePatternSummary {
  const patterns: IntelligencePattern[] = [];

  if (input.hasOpaquePricing) {
    patterns.push({
      patternId: `pat-${input.eventId}-pricing-opacity`,
      category: 'pricing_opacity',
      name: 'Opaque Pricing Structure',
      description: 'Vendor pricing lacks line-item transparency, making comparison difficult.',
      strength: 'confirmed',
      vendorIds: input.vendorIds,
      indicators: ['Lump-sum pricing', 'No tower breakdown', 'Missing unit rates'],
      counterStrategy: 'Require fully itemized pricing with tower and role breakdowns in BAFO.',
      riskIfIgnored: 'Unable to benchmark or negotiate specific line items.',
      source: 'pricing',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasBroadScope) {
    patterns.push({
      patternId: `pat-${input.eventId}-scope-anchor`,
      category: 'scope_anchor',
      name: 'Scope Anchoring',
      description: 'Vendor SOW uses broad, inclusive language to anchor on maximum scope.',
      strength: 'likely',
      vendorIds: input.vendorIds,
      indicators: ['Inclusive language ("including but not limited to")', 'No exclusion list', 'Broad assumption bundle'],
      counterStrategy: 'Require explicit exclusion list and itemized assumption bundle.',
      riskIfIgnored: 'Scope creep and change order costs post-award.',
      source: 'scope',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasEvidenceGaps) {
    patterns.push({
      patternId: `pat-${input.eventId}-evidence-leverage`,
      category: 'evidence_leverage',
      name: 'Evidence Gap Leverage',
      description: 'Vendor may be leveraging buyer evidence gaps to avoid accountability.',
      strength: 'possible',
      vendorIds: [],
      indicators: ['Low evidence coverage', 'Claims without references', 'Missing benchmark data'],
      counterStrategy: 'Fill evidence gaps before BAFO to improve negotiating position.',
      riskIfIgnored: 'Vendor claims cannot be challenged without evidence baseline.',
      source: 'evidence',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasTimelinePressure) {
    patterns.push({
      patternId: `pat-${input.eventId}-timeline-pressure`,
      category: 'timeline_pressure',
      name: 'Artificial Timeline Pressure',
      description: 'Vendor is applying urgency to limit buyer evaluation time.',
      strength: 'likely',
      vendorIds: input.vendorIds,
      indicators: ['BAFO deadline pressure', 'Price validity short window', 'Escalating urgency communications'],
      counterStrategy: 'Formally extend evaluation timeline; document any vendor attempts to rush.',
      riskIfIgnored: 'Suboptimal award decision due to compressed evaluation.',
      source: 'timeline',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasGovernanceAvoidance) {
    patterns.push({
      patternId: `pat-${input.eventId}-governance-avoidance`,
      category: 'governance_avoidance',
      name: 'Governance Avoidance',
      description: 'Vendor is avoiding explicit SLA, penalty, or governance commitments.',
      strength: 'confirmed',
      vendorIds: [],
      indicators: ['No SLA offered', 'Soft performance language', 'Unclear escalation path'],
      counterStrategy: 'Make SLA and governance terms mandatory in BAFO. No governance = disqualification.',
      riskIfIgnored: 'No performance accountability post-award.',
      source: 'governance',
      detectedAt: '2026-04-26',
    });
  }

  if (input.hasBundledServices) {
    patterns.push({
      patternId: `pat-${input.eventId}-bundling-trap`,
      category: 'bundling_trap',
      name: 'Service Bundling Trap',
      description: 'High-value services are bundled with low-value ones to obscure pricing.',
      strength: 'possible',
      vendorIds: input.vendorIds,
      indicators: ['Single-line bundled pricing', 'Difficulty unbundling', 'Cross-service dependencies'],
      counterStrategy: 'Require separate pricing for each service tower. Reject single-bundle bids.',
      riskIfIgnored: 'Overpaying for low-value services; limited future flexibility.',
      source: 'commercial',
      detectedAt: '2026-04-26',
    });
  }

  const confirmedCount = patterns.filter((p) => p.strength === 'confirmed').length;
  const likelyCount = patterns.filter((p) => p.strength === 'likely').length;
  const possibleCount = patterns.filter((p) => p.strength === 'possible').length;

  // Top pattern by strength order: confirmed > likely > possible
  const topPattern = patterns.find((p) => p.strength === 'confirmed')
    ?? patterns.find((p) => p.strength === 'likely')
    ?? patterns.find((p) => p.strength === 'possible')
    ?? null;

  return {
    eventId: input.eventId,
    eventName: input.eventName,
    generatedAt: '2026-04-26',
    patterns,
    confirmedCount,
    likelyCount,
    possibleCount,
    topPatternCategory: topPattern?.category ?? null,
    narrativeSummary: patterns.length === 0
      ? 'No intelligence patterns detected.'
      : `${patterns.length} pattern(s) detected: ${confirmedCount} confirmed, ${likelyCount} likely, ${possibleCount} possible.`,
  };
}
