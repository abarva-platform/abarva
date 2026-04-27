/**
 * PAT5 · Solution Pattern Manifest
 *
 * Machine-readable registry of all AbarVa solution pattern packs.
 * Enumerates every pattern pack (PAT1–PAT4), its slugs, pattern counts,
 * applicable categories, and agent ownership — without duplicating
 * the pattern data itself.
 *
 * Consumers use the manifest for:
 *   - Discovering available patterns without importing every pack
 *   - Cross-pattern navigation in Nexus / Steward agents
 *   - Build-time validation (all slugs resolvable, all packs referenced)
 *   - Pattern library UI index (future slice)
 *
 * No model calls. No DB writes. No React hooks. No Date.now reads.
 * Same input → identical output every time (deterministic seed).
 *
 * This module does NOT import:
 *   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
 *   - src/lib/agent/**, src/components/agent/**
 *   - src/lib/source/**, src/app/(maestro)/source/**
 *   - src/app/programs/**
 *   - src/lib/programs/mock.ts
 *   - src/lib/auth/**
 *   - supabase/**
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type PatternManifestPackId =
  | 'pat1_data_platform_managed_services'
  | 'pat2_ims_managed_services'
  | 'pat3_vendor_evaluation'
  | 'pat4_ai_failure_modes_solution_map';

export type PatternManifestCategory =
  | 'sourcing'
  | 'evaluation'
  | 'governance'
  | 'transition'
  | 'ongoing-ops'
  | 'failure-modes'
  | 'runtime-mapping';

export type PatternManifestAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

export interface PatternManifestSlug {
  slug: string;
  name: string;
  category: PatternManifestCategory;
  /** Approximate count of criteria / modes in this slug. */
  criteriaCount: number;
}

export interface PatternManifestEntry {
  /** Stable unique identifier matching the `createdFrom` discriminator. */
  id: PatternManifestPackId;
  /** Human-readable pack name. */
  name: string;
  /** Short description of what this pack contains. */
  description: string;
  /** Source module path relative to src/. */
  modulePath: string;
  /** Categories covered by this pack. */
  categories: ReadonlyArray<PatternManifestCategory>;
  /** All slugs available within this pack. */
  slugs: ReadonlyArray<PatternManifestSlug>;
  /** Primary owning agent for this pack. */
  primaryAgent: PatternManifestAgent;
  /** All agents that can consume this pack. */
  consumers: ReadonlyArray<PatternManifestAgent>;
  /** Applicable procurement / technology categories. */
  applicableCategories: ReadonlyArray<string>;
  /** Wave this pack was authored in. */
  authoredInWave: string;
  createdFrom: 'pat5_pattern_manifest';
}

export interface PatternManifest {
  version: '1.0';
  packs: ReadonlyArray<PatternManifestEntry>;
  totalPacks: number;
  totalSlugs: number;
  createdFrom: 'pat5_pattern_manifest';
}

// ---------------------------------------------------------------------------
// Manifest data
// ---------------------------------------------------------------------------

const MANIFEST_ENTRIES: ReadonlyArray<PatternManifestEntry> = [
  // --------------------------------------------------------------------------
  // PAT1 — Data Platform Managed Services
  // --------------------------------------------------------------------------
  {
    id: 'pat1_data_platform_managed_services',
    name: 'Data Platform Managed Services Pattern Pack',
    description:
      'Structured criteria for selecting a data platform managed services partner, with failure modes, BAFO readiness signals, and transition governance gates for Databricks, Snowflake, dbt and equivalent stacks.',
    modulePath: 'lib/solutions/data-platform-managed-services-pack.ts',
    categories: ['sourcing', 'evaluation', 'transition', 'governance'],
    slugs: [
      {
        slug: 'data-platform-vendor-selection-criteria',
        name: 'Data Platform Managed Services: Vendor Selection Criteria',
        category: 'sourcing',
        criteriaCount: 5,
      },
      {
        slug: 'data-platform-transition-governance',
        name: 'Data Platform Managed Services: Transition Governance',
        category: 'transition',
        criteriaCount: 2,
      },
    ],
    primaryAgent: 'steward',
    consumers: ['nexus', 'sentinel', 'atlas', 'steward'],
    applicableCategories: [
      'data-platform-managed-services',
      'data-engineering',
      'analytics-platform',
    ],
    authoredInWave: 'wave-27',
    createdFrom: 'pat5_pattern_manifest',
  },
  // --------------------------------------------------------------------------
  // PAT2 — Infrastructure Managed Services
  // --------------------------------------------------------------------------
  {
    id: 'pat2_ims_managed_services',
    name: 'Infrastructure Managed Services Pattern Pack',
    description:
      'Core evaluation criteria for selecting an IMS vendor covering technical capability, operational model, transition risk, SLA design, and commercial structure for cloud infrastructure and application operations.',
    modulePath: 'lib/solutions/ims-managed-services-pack.ts',
    categories: ['sourcing', 'evaluation', 'ongoing-ops'],
    slugs: [
      {
        slug: 'ims-vendor-selection-criteria',
        name: 'Infrastructure Managed Services: Vendor Selection Criteria',
        category: 'sourcing',
        criteriaCount: 5,
      },
    ],
    primaryAgent: 'steward',
    consumers: ['nexus', 'sentinel', 'atlas', 'steward'],
    applicableCategories: [
      'infrastructure-managed-services',
      'cloud-operations',
      'application-operations',
    ],
    authoredInWave: 'wave-27',
    createdFrom: 'pat5_pattern_manifest',
  },
  // --------------------------------------------------------------------------
  // PAT3 — Vendor Evaluation Scorecard
  // --------------------------------------------------------------------------
  {
    id: 'pat3_vendor_evaluation',
    name: 'Vendor Evaluation Scorecard — Enterprise AI/Technology Selection',
    description:
      'Structured 8-dimension weighted scorecard with BAFO eligibility threshold (55/100), auto-exclusion criteria, commercial risk signals, and buildVendorScorecard() function for normalised scoring.',
    modulePath: 'lib/solutions/vendor-evaluation-pattern.ts',
    categories: ['evaluation'],
    slugs: [
      {
        slug: 'vendor-evaluation-scorecard',
        name: 'Vendor Evaluation Scorecard — Enterprise AI/Technology Selection',
        category: 'evaluation',
        criteriaCount: 10,
      },
    ],
    primaryAgent: 'nexus',
    consumers: ['nexus', 'sentinel', 'atlas', 'steward'],
    applicableCategories: [
      'data-platform-managed-services',
      'infrastructure-managed-services',
      'ai-software-platform',
      'professional-services',
    ],
    authoredInWave: 'wave-27',
    createdFrom: 'pat5_pattern_manifest',
  },
  // --------------------------------------------------------------------------
  // PAT4 — AI Failure Modes → Solution Map
  // --------------------------------------------------------------------------
  {
    id: 'pat4_ai_failure_modes_solution_map',
    name: 'AI Program Failure Modes → Solution Pattern Runtime Map',
    description:
      'Bridges the PF1 AI Program Failure Modes pack with PAT1–PAT3 solution patterns. Maps 12 canonical failure mode keys to applicable sourcing and evaluation patterns with salient criteria IDs and agent routing.',
    modulePath: 'lib/solutions/ai-failure-modes-solution-map.ts',
    categories: ['runtime-mapping', 'failure-modes'],
    slugs: [
      {
        slug: 'ai-failure-modes-solution-map',
        name: 'AI Program Failure Modes → Solution Pattern Runtime Map',
        category: 'runtime-mapping',
        criteriaCount: 16, // number of mapping entries in the table
      },
    ],
    primaryAgent: 'nexus',
    consumers: ['nexus', 'sentinel', 'atlas', 'steward'],
    applicableCategories: [
      'ai-software-platform',
      'data-platform-managed-services',
      'infrastructure-managed-services',
      'professional-services',
    ],
    authoredInWave: 'wave-27',
    createdFrom: 'pat5_pattern_manifest',
  },
];

// ---------------------------------------------------------------------------
// Manifest object
// ---------------------------------------------------------------------------

export const PATTERN_MANIFEST: PatternManifest = {
  version: '1.0',
  packs: MANIFEST_ENTRIES,
  totalPacks: MANIFEST_ENTRIES.length,
  totalSlugs: MANIFEST_ENTRIES.reduce((sum, p) => sum + p.slugs.length, 0),
  createdFrom: 'pat5_pattern_manifest',
};

// ---------------------------------------------------------------------------
// Accessor functions
// ---------------------------------------------------------------------------

/**
 * Return all entries in the manifest (canonical order).
 */
export function listPatternManifestEntries(): ReadonlyArray<PatternManifestEntry> {
  return PATTERN_MANIFEST.packs;
}

/**
 * Return a single manifest entry by pack ID, or null if not found.
 */
export function getPatternManifestEntry(
  id: PatternManifestPackId,
): PatternManifestEntry | null {
  return MANIFEST_ENTRIES.find((e) => e.id === id) ?? null;
}

/**
 * Return all manifest entries whose slugs include the given slug.
 */
export function findManifestEntriesBySlug(
  slug: string,
): ReadonlyArray<PatternManifestEntry> {
  return MANIFEST_ENTRIES.filter((e) => e.slugs.some((s) => s.slug === slug));
}

/**
 * Return all manifest entries for a given category.
 */
export function getManifestEntriesByCategory(
  category: PatternManifestCategory,
): ReadonlyArray<PatternManifestEntry> {
  return MANIFEST_ENTRIES.filter((e) => e.categories.includes(category));
}

/**
 * Return all manifest entries consumed by a given agent.
 */
export function getManifestEntriesForAgent(
  agent: PatternManifestAgent,
): ReadonlyArray<PatternManifestEntry> {
  return MANIFEST_ENTRIES.filter((e) => e.consumers.includes(agent));
}

/**
 * Return all unique slugs across all packs in the manifest.
 */
export function getAllManifestSlugs(): ReadonlyArray<string> {
  return MANIFEST_ENTRIES.flatMap((e) => e.slugs.map((s) => s.slug));
}

export const PATTERN_MANIFEST_PACK_IDS: ReadonlyArray<PatternManifestPackId> =
  MANIFEST_ENTRIES.map((e) => e.id);
