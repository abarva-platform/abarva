// I7 · Internal / External Source Basis read model.
//
// Pure deterministic catalog that distinguishes intelligence derived from
// internal evidence (program evidence, workshop notes, the evidence
// ledger) from intelligence derived from the external pattern library
// (industry benchmarks, vendor intelligence, the public pattern pack).
// Every basis carries an explicit confidence label so downstream surfaces
// can render an honest "this conclusion rests on internal evidence" or
// "this conclusion rests on an external pattern" attribution.
//
// The source-basis module exists so the future Sentinel pattern detail
// surface, the Atlas executive brief, and the Maestro architecture-draft
// renderer can all answer the question "is this conclusion grounded in
// internal evidence or in an external pattern, and at what confidence?"
// without inventing a live retrieval call or a fabricated confidence
// score.
//
// No live retrieval. No external HTTP. No live registry binding. No
// model invocation. Same input → identical output every call.
//
// Layered above (read-only):
//   - SentinelPatternKey                       (I1)
//   - canonical pattern key tuple              (I1)
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**,
//     src/lib/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**, supabase/**
//   - any model SDK (anthropic / openai)

import {
  SENTINEL_PATTERN_KEYS_IN_RANK_ORDER,
  type SentinelPatternKey,
} from '@/lib/intelligence/sentinel-pattern-detections';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type IntelligenceSourceBasisKind =
  | 'internal_program_evidence'
  | 'internal_workshop_notes'
  | 'internal_evidence_ledger'
  | 'external_pattern_library'
  | 'external_industry_benchmark'
  | 'external_vendor_intelligence';

export type IntelligenceSourceBasisConfidence = 'low' | 'medium' | 'high';

export interface IntelligenceSourceBasis {
  id: string;
  patternKey: string;
  kind: IntelligenceSourceBasisKind;
  label: string;
  confidence: IntelligenceSourceBasisConfidence;
  rationale: string;
  citationLocator: string;
  createdFrom: 'deterministic_intelligence_source_basis_seed';
}

export interface IntelligenceSourceBasisSummary {
  totalBases: number;
  internalCount: number;
  externalCount: number;
  confidenceBreakdown: Record<IntelligenceSourceBasisConfidence, number>;
  kindBreakdown: Record<IntelligenceSourceBasisKind, number>;
  honestDisclaimer: string;
}

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const HONEST_DISCLAIMER =
  'Composed from a deterministic seed; no live external retrieval, no model invocation, no Sentinel runtime call. Confidence labels are hand-assigned, not computed.';

const INTERNAL_KINDS: ReadonlySet<IntelligenceSourceBasisKind> = new Set([
  'internal_program_evidence',
  'internal_workshop_notes',
  'internal_evidence_ledger',
]);

const ALL_BASIS_KINDS: ReadonlyArray<IntelligenceSourceBasisKind> = [
  'internal_program_evidence',
  'internal_workshop_notes',
  'internal_evidence_ledger',
  'external_pattern_library',
  'external_industry_benchmark',
  'external_vendor_intelligence',
];

const ALL_CONFIDENCES: ReadonlyArray<IntelligenceSourceBasisConfidence> = [
  'low',
  'medium',
  'high',
];

// ---------------------------------------------------------------------
// Seed entries (deterministic, hand-authored)
// ---------------------------------------------------------------------
//
// Seed coverage requirements (enforced by tests):
//   * all 6 source basis kinds present across the seed set
//   * all 3 confidence labels present across the seed set
//   * every seeded pattern carries at least 1 internal + 1 external basis
//   * citationLocator strings are structured seed refs (no http(s)://)

interface SeedBasis {
  patternKey: SentinelPatternKey;
  kind: IntelligenceSourceBasisKind;
  label: string;
  confidence: IntelligenceSourceBasisConfidence;
  rationale: string;
  citationLocator: string;
}

const SEED_BASES: ReadonlyArray<SeedBasis> = [
  // -----------------------------------------------------------------
  // value_ledger_incompleteness
  // -----------------------------------------------------------------
  {
    patternKey: 'value_ledger_incompleteness',
    kind: 'internal_evidence_ledger',
    label: 'Apex Retail · CFO baseline ledger row',
    confidence: 'high',
    rationale:
      'Baseline value memo ties directly to a ledger row with intact lineage; tie-out passes.',
    citationLocator: 'tenant/apex-retail/ledger/value-baseline#row-2',
  },
  {
    patternKey: 'value_ledger_incompleteness',
    kind: 'internal_program_evidence',
    label: 'Apex Retail · CDP program · projected value worksheet',
    confidence: 'medium',
    rationale:
      'Program worksheet present but missing confidence band and G3 attestation; partial internal grounding.',
    citationLocator: 'program/apex-retail-cdp/value-worksheet#row-7',
  },
  {
    patternKey: 'value_ledger_incompleteness',
    kind: 'external_industry_benchmark',
    label: 'Retail AI benchmark · CDP uplift band',
    confidence: 'low',
    rationale:
      'Industry band is directional only and not yet calibrated to the tenant baseline.',
    citationLocator: 'benchmark/retail-ai-cdp-uplift/band#range-mid',
  },

  // -----------------------------------------------------------------
  // evidence_chain_gap
  // -----------------------------------------------------------------
  {
    patternKey: 'evidence_chain_gap',
    kind: 'internal_workshop_notes',
    label: 'Apex Retail · CXO interview notes (workshop)',
    confidence: 'medium',
    rationale:
      'Workshop notes capture intent but per-deliverable citation rows are not yet linked.',
    citationLocator: 'tenant/apex-retail/workshop-notes/cxo#turn-3',
  },
  {
    patternKey: 'evidence_chain_gap',
    kind: 'internal_program_evidence',
    label: 'Apex Retail · contact-center AI · charter draft',
    confidence: 'low',
    rationale:
      'Charter conclusions cannot yet be traced to interview or telemetry sources.',
    citationLocator: 'program/apex-retail-contact-center-ai/charter#section-4',
  },
  {
    patternKey: 'evidence_chain_gap',
    kind: 'external_pattern_library',
    label: 'Public pattern pack · evidence chain gap archetype',
    confidence: 'low',
    rationale:
      'Reference archetype only; tenant-bound mapping has not been completed.',
    citationLocator: 'pattern-pack/public/evidence-chain-gap#archetype-2',
  },

  // -----------------------------------------------------------------
  // gate_governance_gap
  // -----------------------------------------------------------------
  {
    patternKey: 'gate_governance_gap',
    kind: 'internal_program_evidence',
    label: 'Apex Retail · demand forecasting · gate-2 packet',
    confidence: 'medium',
    rationale:
      'Packet drafted; canonical hard input (executive decision log) is overdue but the underlying program signal is internal.',
    citationLocator: 'program/apex-retail-demand-forecasting/gate-2#section-1',
  },
  {
    patternKey: 'gate_governance_gap',
    kind: 'external_vendor_intelligence',
    label: 'Vendor intelligence · gating cadence guidance pack',
    confidence: 'low',
    rationale:
      'Vendor guidance pack is directional and not bound to the tenant cycle scope.',
    citationLocator: 'vendor-intel/gating-cadence-guidance/pack#section-3',
  },

  // -----------------------------------------------------------------
  // program_context_sparsity
  // -----------------------------------------------------------------
  {
    patternKey: 'program_context_sparsity',
    kind: 'internal_workshop_notes',
    label: 'Apex Retail · store associate productivity · intake notes',
    confidence: 'low',
    rationale:
      'Workshop intake transcript is thin; baseline KPI attestation and CXO charter sign-off remain outstanding.',
    citationLocator:
      'tenant/apex-retail/workshop-notes/store-associate-productivity#turn-1',
  },
  {
    patternKey: 'program_context_sparsity',
    kind: 'external_industry_benchmark',
    label: 'Industry benchmark · context bundle completeness cohort',
    confidence: 'medium',
    rationale:
      'Cohort segment is broader than tenant scope; calibration to tenant context is deferred.',
    citationLocator:
      'benchmark/industry-context-bundle-completeness/cohort#row-4',
  },

  // -----------------------------------------------------------------
  // ai_governance_operating_model_gap
  // -----------------------------------------------------------------
  {
    patternKey: 'ai_governance_operating_model_gap',
    kind: 'internal_evidence_ledger',
    label: 'Apex Retail · AI governance ledger snapshot',
    confidence: 'high',
    rationale:
      'Governance ledger snapshot lists every standing AI program and resolves to internal attestation rows.',
    citationLocator: 'tenant/apex-retail/ledger/ai-governance#snapshot-1',
  },
  {
    patternKey: 'ai_governance_operating_model_gap',
    kind: 'external_pattern_library',
    label: 'Public pattern pack · AI governance operating model archetype',
    confidence: 'medium',
    rationale:
      'Archetype is widely cited but tenant-specific committee scope is not bound.',
    citationLocator:
      'pattern-pack/public/ai-governance-operating-model#archetype-5',
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic source-basis seed for every canonical pattern
 * key in canonical I1 rank order. Pure: same call → identical array
 * every invocation.
 */
export function buildIntelligenceSourceBasisSeed(): readonly IntelligenceSourceBasis[] {
  const ordered: IntelligenceSourceBasis[] = [];
  let runningId = 0;
  for (const key of SENTINEL_PATTERN_KEYS_IN_RANK_ORDER) {
    for (const seed of SEED_BASES) {
      if (seed.patternKey !== key) continue;
      runningId += 1;
      ordered.push(buildBasis(seed, runningId));
    }
  }
  return ordered;
}

/**
 * Reduce a list of source bases into a deterministic summary
 * (internal vs external counts, confidence breakdown, kind breakdown).
 * Pure: same input array → identical summary every call.
 */
export function summarizeIntelligenceSourceBasis(
  bases: readonly IntelligenceSourceBasis[],
): IntelligenceSourceBasisSummary {
  const confidenceBreakdown: Record<IntelligenceSourceBasisConfidence, number> = {
    low: 0,
    medium: 0,
    high: 0,
  };
  const kindBreakdown: Record<IntelligenceSourceBasisKind, number> = {
    internal_program_evidence: 0,
    internal_workshop_notes: 0,
    internal_evidence_ledger: 0,
    external_pattern_library: 0,
    external_industry_benchmark: 0,
    external_vendor_intelligence: 0,
  };

  let internalCount = 0;
  let externalCount = 0;

  for (const basis of bases) {
    confidenceBreakdown[basis.confidence] += 1;
    kindBreakdown[basis.kind] += 1;
    if (INTERNAL_KINDS.has(basis.kind)) {
      internalCount += 1;
    } else {
      externalCount += 1;
    }
  }

  return {
    totalBases: bases.length,
    internalCount,
    externalCount,
    confidenceBreakdown,
    kindBreakdown,
    honestDisclaimer: HONEST_DISCLAIMER,
  };
}

/**
 * Convenience accessor returning only the bases backed by internal
 * evidence (program evidence, workshop notes, evidence ledger).
 */
export function getInternalOnlyBases(
  bases: readonly IntelligenceSourceBasis[],
): readonly IntelligenceSourceBasis[] {
  return bases.filter((b) => INTERNAL_KINDS.has(b.kind));
}

/**
 * Convenience accessor returning only the bases backed by external
 * pattern library, industry benchmark, or vendor intelligence sources.
 */
export function getExternalOnlyBases(
  bases: readonly IntelligenceSourceBasis[],
): readonly IntelligenceSourceBasis[] {
  return bases.filter((b) => !INTERNAL_KINDS.has(b.kind));
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildBasis(seed: SeedBasis, n: number): IntelligenceSourceBasis {
  return {
    id: `intel-source-basis-seed-${n}`,
    patternKey: seed.patternKey,
    kind: seed.kind,
    label: seed.label,
    confidence: seed.confidence,
    rationale: seed.rationale,
    citationLocator: seed.citationLocator,
    createdFrom: 'deterministic_intelligence_source_basis_seed',
  };
}

// ---------------------------------------------------------------------
// Test-only conveniences
// ---------------------------------------------------------------------

/**
 * Canonical kind tuple. Exported so tests can assert coverage without
 * hard-coding a duplicate list.
 */
export const INTELLIGENCE_SOURCE_BASIS_KINDS = ALL_BASIS_KINDS;

/**
 * Canonical confidence tuple. Exported so tests can assert coverage
 * without hard-coding a duplicate list.
 */
export const INTELLIGENCE_SOURCE_BASIS_CONFIDENCES = ALL_CONFIDENCES;
