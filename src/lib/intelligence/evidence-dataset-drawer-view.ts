// I6 · Evidence Dataset Drawer view model.
//
// Pure deterministic read model that catalogs which datasets / artifacts
// could back a Sentinel pattern detection today. Every entry is a seed
// citation locator (deterministic structured form, never a real URL),
// labelled with usability and freshness, and (when partial or blocked)
// with an explicit list of missing citations.
//
// The drawer view exists so the future Sentinel pattern detail surface
// can answer the question "what evidence and what datasets back this
// pattern, and where are the gaps?" without inventing live retrieval.
//
// No live retrieval. No external HTTP. No live registry binding. No
// model invocation. Same pattern key → identical view every call.
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

export type EvidenceDatasetSourceKind =
  | 'internal_tenant_artifact'
  | 'internal_program_evidence'
  | 'internal_dataset_domain'
  | 'external_public_pattern_pack'
  | 'external_industry_benchmark';

export type EvidenceFreshnessLabel = 'fresh' | 'aging' | 'stale' | 'unknown';

export type EvidenceUsabilityLabel =
  | 'usable_as_evidence'
  | 'partial'
  | 'blocked'
  | 'no_evidence_loaded';

export interface EvidenceDatasetEntry {
  id: string;
  patternKey: string;
  sourceKind: EvidenceDatasetSourceKind;
  sourceLabel: string;
  usability: EvidenceUsabilityLabel;
  freshness: EvidenceFreshnessLabel;
  citationLocator: string;
  missingCitations: readonly string[];
  qualityNotes: readonly string[];
  createdFrom: 'deterministic_evidence_dataset_drawer_seed';
}

export interface EvidenceDatasetDrawerView {
  patternKey: string;
  patternLabel: string;
  totalEntries: number;
  internalEntries: readonly EvidenceDatasetEntry[];
  externalEntries: readonly EvidenceDatasetEntry[];
  usabilityBreakdown: Record<EvidenceUsabilityLabel, number>;
  freshnessBreakdown: Record<EvidenceFreshnessLabel, number>;
  totalMissingCitations: number;
  honestDisclaimer: string;
  createdFrom: 'deterministic_seed';
}

// ---------------------------------------------------------------------
// Pattern label map (canonical, hand-authored — mirrors I1 names)
// ---------------------------------------------------------------------

const PATTERN_LABELS: Record<SentinelPatternKey, string> = {
  value_ledger_incompleteness: 'Value ledger incompleteness',
  evidence_chain_gap: 'Evidence chain gap',
  gate_governance_gap: 'Gate governance gap',
  program_context_sparsity: 'Program context sparsity',
  ai_governance_operating_model_gap: 'AI governance operating model gap',
};

const HONEST_DISCLAIMER =
  'Composed from a deterministic seed; no live external retrieval, no model invocation, no Sentinel runtime call. Locators are structured seed references, not live URLs.';

// Internal kinds (used to partition on the view).
const INTERNAL_KINDS: ReadonlySet<EvidenceDatasetSourceKind> = new Set([
  'internal_tenant_artifact',
  'internal_program_evidence',
  'internal_dataset_domain',
]);

// ---------------------------------------------------------------------
// Seed entries (deterministic, hand-authored)
// ---------------------------------------------------------------------
//
// Seed coverage requirements (enforced by tests):
//   * ≥ 4 entries per pattern for at least 3 distinct pattern keys
//   * ≥ 2 internal entries per seeded pattern
//   * ≥ 1 external entry per seeded pattern
//   * across the seed set: all 5 source kinds present
//   * across the seed set: all 4 freshness labels present
//   * across the seed set: all 4 usability labels present
//   * every partial/blocked entry has ≥ 1 missingCitation
//   * citationLocator strings are structured seed refs (no http(s)://)
//   * no E-### / E-#### literal citation tokens

interface SeedEntry {
  patternKey: SentinelPatternKey;
  sourceKind: EvidenceDatasetSourceKind;
  sourceLabel: string;
  usability: EvidenceUsabilityLabel;
  freshness: EvidenceFreshnessLabel;
  citationLocator: string;
  missingCitations: readonly string[];
  qualityNotes: readonly string[];
}

const SEED_ENTRIES: ReadonlyArray<SeedEntry> = [
  // -----------------------------------------------------------------
  // value_ledger_incompleteness · 5 entries (3 internal · 2 external)
  // -----------------------------------------------------------------
  {
    patternKey: 'value_ledger_incompleteness',
    sourceKind: 'internal_tenant_artifact',
    sourceLabel: 'Apex Retail · CFO baseline value memo',
    usability: 'usable_as_evidence',
    freshness: 'fresh',
    citationLocator: 'tenant/apex-retail/artifact/cfo-baseline-memo#section-2',
    missingCitations: [],
    qualityNotes: [
      'Captured during workshop; baseline figure ties to ledger row.',
    ],
  },
  {
    patternKey: 'value_ledger_incompleteness',
    sourceKind: 'internal_program_evidence',
    sourceLabel: 'Apex Retail · CDP program · projected value worksheet',
    usability: 'partial',
    freshness: 'aging',
    citationLocator: 'program/apex-retail-cdp/value-worksheet#row-7',
    missingCitations: [
      'confidence band on projected uplift',
      'G3 sign-off attestation',
    ],
    qualityNotes: [
      'Worksheet present but lacks confidence band; G3 attestation missing.',
    ],
  },
  {
    patternKey: 'value_ledger_incompleteness',
    sourceKind: 'internal_dataset_domain',
    sourceLabel: 'finance · monthly margin actuals',
    usability: 'usable_as_evidence',
    freshness: 'fresh',
    citationLocator: 'dataset/finance-margin-actuals/lineage#row-12',
    missingCitations: [],
    qualityNotes: [
      'Actuals lineage current through last close; tie-out passes.',
    ],
  },
  {
    patternKey: 'value_ledger_incompleteness',
    sourceKind: 'external_industry_benchmark',
    sourceLabel: 'Retail AI benchmark · CDP uplift band (deterministic seed)',
    usability: 'partial',
    freshness: 'aging',
    citationLocator: 'benchmark/retail-ai-cdp-uplift/band#range-mid',
    missingCitations: [
      'tenant-specific calibration note',
    ],
    qualityNotes: [
      'Industry band is directional only; not yet calibrated to Apex baseline.',
    ],
  },
  {
    patternKey: 'value_ledger_incompleteness',
    sourceKind: 'external_public_pattern_pack',
    sourceLabel: 'Public pattern pack · value ledger incompleteness archetype',
    usability: 'no_evidence_loaded',
    freshness: 'unknown',
    citationLocator: 'pattern-pack/public/value-ledger-incompleteness#archetype-1',
    missingCitations: [],
    qualityNotes: [
      'Reference archetype only; no tenant evidence is bound here yet.',
    ],
  },

  // -----------------------------------------------------------------
  // evidence_chain_gap · 5 entries (3 internal · 2 external)
  // -----------------------------------------------------------------
  {
    patternKey: 'evidence_chain_gap',
    sourceKind: 'internal_tenant_artifact',
    sourceLabel: 'Apex Retail · CXO interview notes (workshop)',
    usability: 'partial',
    freshness: 'fresh',
    citationLocator: 'tenant/apex-retail/workshop-notes/cxo#turn-3',
    missingCitations: [
      'per-deliverable citation row',
      'interview consent attestation',
    ],
    qualityNotes: [
      'Notes captured but not yet linked to specific deliverable conclusions.',
    ],
  },
  {
    patternKey: 'evidence_chain_gap',
    sourceKind: 'internal_program_evidence',
    sourceLabel: 'Apex Retail · contact-center AI · charter draft',
    usability: 'blocked',
    freshness: 'stale',
    citationLocator: 'program/apex-retail-contact-center-ai/charter#section-4',
    missingCitations: [
      'source citation for adoption assumption',
      'CXO sign-off attestation',
      'data source attribution row',
    ],
    qualityNotes: [
      'Charter conclusions cannot be traced to interview or telemetry sources.',
    ],
  },
  {
    patternKey: 'evidence_chain_gap',
    sourceKind: 'internal_dataset_domain',
    sourceLabel: 'contact-center · weekly call telemetry',
    usability: 'usable_as_evidence',
    freshness: 'fresh',
    citationLocator: 'dataset/contact-center-call-telemetry/lineage#row-3',
    missingCitations: [],
    qualityNotes: [
      'Telemetry lineage present and tied to specific deliverable rows.',
    ],
  },
  {
    patternKey: 'evidence_chain_gap',
    sourceKind: 'external_public_pattern_pack',
    sourceLabel: 'Public pattern pack · evidence chain gap archetype',
    usability: 'partial',
    freshness: 'unknown',
    citationLocator: 'pattern-pack/public/evidence-chain-gap#archetype-2',
    missingCitations: [
      'tenant-bound mapping row',
    ],
    qualityNotes: [
      'Archetype is directional; tenant binding has not been completed.',
    ],
  },
  {
    patternKey: 'evidence_chain_gap',
    sourceKind: 'external_industry_benchmark',
    sourceLabel: 'Industry benchmark · CXO review acceptance rates',
    usability: 'no_evidence_loaded',
    freshness: 'aging',
    citationLocator: 'benchmark/industry-cxo-review-acceptance/aggregate#row-1',
    missingCitations: [],
    qualityNotes: [
      'Reference benchmark only; not yet calibrated to tenant context.',
    ],
  },

  // -----------------------------------------------------------------
  // gate_governance_gap · 4 entries (2 internal · 2 external)
  // -----------------------------------------------------------------
  {
    patternKey: 'gate_governance_gap',
    sourceKind: 'internal_program_evidence',
    sourceLabel: 'Apex Retail · demand forecasting · gate-2 packet',
    usability: 'partial',
    freshness: 'fresh',
    citationLocator: 'program/apex-retail-demand-forecasting/gate-2#section-1',
    missingCitations: [
      'executive decision log row',
      'gate-2 hard input attestation',
    ],
    qualityNotes: [
      'Packet drafted but executive decision is overdue; canonical hard input missing.',
    ],
  },
  {
    patternKey: 'gate_governance_gap',
    sourceKind: 'internal_tenant_artifact',
    sourceLabel: 'Apex Retail · steering committee minutes (Q1)',
    usability: 'usable_as_evidence',
    freshness: 'aging',
    citationLocator: 'tenant/apex-retail/steering/minutes-q1#row-9',
    missingCitations: [],
    qualityNotes: [
      'Minutes capture decision intent but predate current cycle scope.',
    ],
  },
  {
    patternKey: 'gate_governance_gap',
    sourceKind: 'external_public_pattern_pack',
    sourceLabel: 'Public pattern pack · gate governance gap archetype',
    usability: 'no_evidence_loaded',
    freshness: 'unknown',
    citationLocator: 'pattern-pack/public/gate-governance-gap#archetype-3',
    missingCitations: [],
    qualityNotes: [
      'Reference archetype only; tenant cycle is not bound here.',
    ],
  },
  {
    patternKey: 'gate_governance_gap',
    sourceKind: 'external_industry_benchmark',
    sourceLabel: 'Industry benchmark · gate cadence cohort',
    usability: 'partial',
    freshness: 'stale',
    citationLocator: 'benchmark/industry-gate-cadence/cohort#row-2',
    missingCitations: [
      'cohort vintage note',
    ],
    qualityNotes: [
      'Cohort vintage predates current AI portfolio gating canon.',
    ],
  },

  // -----------------------------------------------------------------
  // program_context_sparsity · 4 entries (2 internal · 2 external)
  // -----------------------------------------------------------------
  {
    patternKey: 'program_context_sparsity',
    sourceKind: 'internal_program_evidence',
    sourceLabel: 'Apex Retail · store associate productivity · context bundle',
    usability: 'blocked',
    freshness: 'stale',
    citationLocator: 'program/apex-retail-store-associate-productivity/context-bundle#section-1',
    missingCitations: [
      'workshop intake transcript',
      'baseline KPI attestation',
      'CXO charter sign-off',
    ],
    qualityNotes: [
      'Bundle is thin; required deliverables remain at Stub tier.',
    ],
  },
  {
    patternKey: 'program_context_sparsity',
    sourceKind: 'internal_dataset_domain',
    sourceLabel: 'workforce · associate scheduling lineage',
    usability: 'partial',
    freshness: 'aging',
    citationLocator: 'dataset/workforce-associate-scheduling/lineage#row-5',
    missingCitations: [
      'tenant-scoped consent note',
    ],
    qualityNotes: [
      'Lineage exists but consent attestation is missing for downstream use.',
    ],
  },
  {
    patternKey: 'program_context_sparsity',
    sourceKind: 'external_public_pattern_pack',
    sourceLabel: 'Public pattern pack · program context sparsity archetype',
    usability: 'no_evidence_loaded',
    freshness: 'unknown',
    citationLocator: 'pattern-pack/public/program-context-sparsity#archetype-4',
    missingCitations: [],
    qualityNotes: [
      'Archetype only; tenant context is not bound here.',
    ],
  },
  {
    patternKey: 'program_context_sparsity',
    sourceKind: 'external_industry_benchmark',
    sourceLabel: 'Industry benchmark · context bundle completeness cohort',
    usability: 'partial',
    freshness: 'aging',
    citationLocator: 'benchmark/industry-context-bundle-completeness/cohort#row-4',
    missingCitations: [
      'cohort segment definition',
    ],
    qualityNotes: [
      'Cohort segment definition is broader than tenant scope; calibration deferred.',
    ],
  },
];

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic Evidence Dataset Drawer view for a single
 * pattern key. Pure: same key → identical view every call.
 *
 * Returns a view with empty entries (and zeroed breakdowns) for any
 * pattern key without seed coverage; the honestDisclaimer stays
 * stable so the drawer can render an honest "no evidence loaded yet"
 * surface without inventing data.
 */
export function buildEvidenceDatasetDrawerView(
  patternKey: string,
): EvidenceDatasetDrawerView {
  const entries = SEED_ENTRIES.filter((e) => e.patternKey === patternKey);
  const built = entries.map((seed, idx) => buildEntry(seed, idx));

  const internal = built.filter((e) => INTERNAL_KINDS.has(e.sourceKind));
  const external = built.filter((e) => !INTERNAL_KINDS.has(e.sourceKind));

  const usabilityBreakdown: Record<EvidenceUsabilityLabel, number> = {
    usable_as_evidence: 0,
    partial: 0,
    blocked: 0,
    no_evidence_loaded: 0,
  };
  const freshnessBreakdown: Record<EvidenceFreshnessLabel, number> = {
    fresh: 0,
    aging: 0,
    stale: 0,
    unknown: 0,
  };

  let totalMissingCitations = 0;
  for (const entry of built) {
    usabilityBreakdown[entry.usability] += 1;
    freshnessBreakdown[entry.freshness] += 1;
    totalMissingCitations += entry.missingCitations.length;
  }

  const patternLabel = isCanonicalPatternKey(patternKey)
    ? PATTERN_LABELS[patternKey]
    : patternKey;

  return {
    patternKey,
    patternLabel,
    totalEntries: built.length,
    internalEntries: internal,
    externalEntries: external,
    usabilityBreakdown,
    freshnessBreakdown,
    totalMissingCitations,
    honestDisclaimer: HONEST_DISCLAIMER,
    createdFrom: 'deterministic_seed',
  };
}

/**
 * Build the deterministic seed view for every canonical pattern key
 * that has seed coverage today (rank order from I1).
 */
export function buildEvidenceDatasetDrawerSeedAll(): readonly EvidenceDatasetDrawerView[] {
  const out: EvidenceDatasetDrawerView[] = [];
  for (const key of SENTINEL_PATTERN_KEYS_IN_RANK_ORDER) {
    const view = buildEvidenceDatasetDrawerView(key);
    if (view.totalEntries > 0) out.push(view);
  }
  return out;
}

/**
 * Convenience accessor for the internal partition of a built view.
 */
export function getInternalSources(
  view: EvidenceDatasetDrawerView,
): readonly EvidenceDatasetEntry[] {
  return view.internalEntries;
}

/**
 * Convenience accessor for the external partition of a built view.
 */
export function getExternalSources(
  view: EvidenceDatasetDrawerView,
): readonly EvidenceDatasetEntry[] {
  return view.externalEntries;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildEntry(seed: SeedEntry, idx: number): EvidenceDatasetEntry {
  return {
    id: `evid-dataset-seed-${idx + 1}`,
    patternKey: seed.patternKey,
    sourceKind: seed.sourceKind,
    sourceLabel: seed.sourceLabel,
    usability: seed.usability,
    freshness: seed.freshness,
    citationLocator: seed.citationLocator,
    missingCitations: seed.missingCitations,
    qualityNotes: seed.qualityNotes,
    createdFrom: 'deterministic_evidence_dataset_drawer_seed',
  };
}

function isCanonicalPatternKey(key: string): key is SentinelPatternKey {
  return (SENTINEL_PATTERN_KEYS_IN_RANK_ORDER as ReadonlyArray<string>).includes(
    key,
  );
}
