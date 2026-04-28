// pattern-registry-lifecycle.ts — PAT1
//
// Deterministic registry lifecycle contract for intelligence patterns.
// No React. No network calls. No model calls. Deterministic seed output only.
//
// PAT1 explicitly DOES NOT:
//   - call fetch, Date.now, Math.random, or new Date.
//   - read from src/lib/source/, src/lib/nexus/, src/lib/atlas/,
//     src/lib/agent/, src/lib/auth/, supabase.
//   - render any UI or invoke any agent runtime.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PatternLifecycleStage =
  | 'proposed'
  | 'active'
  | 'deprecated'
  | 'archived';

export type PatternSignalStrength =
  | 'weak'
  | 'moderate'
  | 'strong'
  | 'definitive';

export interface PatternRegistryEntry {
  patternKey: string;
  name: string;
  lifecycleStage: PatternLifecycleStage;
  signalStrength: PatternSignalStrength;
  description: string;
  triggerConditions: readonly string[];
  contraIndicators: readonly string[];
  remedyHooks: readonly string[];
  addedVersion: string;
  deprecationNote: string | null;
  deterministicSeed: true;
}

export interface PatternRegistryView {
  entries: readonly PatternRegistryEntry[];
  totalCount: number;
  activeCount: number;
  deprecatedCount: number;
  archivedCount: number;
  proposedCount: number;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Seed data — 8 patterns
// ---------------------------------------------------------------------------

const PATTERN_REGISTRY_ENTRIES: readonly PatternRegistryEntry[] = [
  {
    patternKey: 'data-silo-fragmentation',
    name: 'Data Silo Fragmentation',
    lifecycleStage: 'active',
    signalStrength: 'strong',
    description: 'Data exists in disconnected silos preventing unified analytics',
    triggerConditions: [
      'More than 3 independent data stores with no shared identity key',
      'Cross-functional reporting requires manual data joins',
      'No enterprise data catalog or shared schema registry in place',
    ],
    contraIndicators: [
      'Single unified data warehouse is the system of record',
      'Shared identity resolution layer is operational',
    ],
    remedyHooks: [
      'recommend-unified-data-platform',
      'flag-integration-gap',
      'surface-data-governance-pattern',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'adoption-plateau',
    name: 'Adoption Plateau',
    lifecycleStage: 'active',
    signalStrength: 'moderate',
    description: 'User adoption stalls after initial onboarding phase',
    triggerConditions: [
      'Active user count flat or declining 30+ days post-launch',
      'Feature utilization rate below 40% across core workflows',
      'Support ticket volume rising despite stable defect rate',
    ],
    contraIndicators: [
      'Active user count growing month-over-month',
      'Feature utilization rate above 70%',
    ],
    remedyHooks: [
      'recommend-change-management-program',
      'flag-training-gap',
      'surface-adoption-dashboard',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'vendor-consolidation-lag',
    name: 'Vendor Consolidation Lag',
    lifecycleStage: 'active',
    signalStrength: 'moderate',
    description: 'Vendor base exceeds rational consolidation target',
    triggerConditions: [
      'More than 15 active SaaS vendors in the same functional category',
      'Overlapping capability coverage across 3 or more contracts',
      'Vendor management overhead consuming more than 10% of IT budget',
    ],
    contraIndicators: [
      'Vendor portfolio reviewed and approved by procurement in last 12 months',
      'Single-vendor strategy formally adopted for category',
    ],
    remedyHooks: [
      'recommend-vendor-rationalization',
      'flag-contract-overlap',
      'surface-spend-analytics',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'tech-debt-accumulation',
    name: 'Tech Debt Accumulation',
    lifecycleStage: 'active',
    signalStrength: 'strong',
    description: 'Technical debt compounds across system versions',
    triggerConditions: [
      'Core systems running versions more than 2 major releases behind current',
      'Hotfix rate exceeding 5 per sprint',
      'Architectural review board backlog older than 6 months unaddressed',
    ],
    contraIndicators: [
      'Active tech debt reduction program with quarterly targets',
      'Systems running within 1 major version of current release',
    ],
    remedyHooks: [
      'recommend-modernization-roadmap',
      'flag-version-lag',
      'surface-architecture-review',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'governance-gap',
    name: 'Governance Gap',
    lifecycleStage: 'active',
    signalStrength: 'definitive',
    description: 'Missing governance framework creating compliance risk',
    triggerConditions: [
      'No formal data governance policy in place or enforced',
      'Audit findings unaddressed for more than 90 days',
      'Regulatory obligation without documented control owner',
    ],
    contraIndicators: [
      'Governance framework documented, published, and owner-assigned',
      'Last audit completed with zero critical findings',
    ],
    remedyHooks: [
      'recommend-governance-framework',
      'flag-compliance-risk',
      'surface-audit-findings',
      'escalate-to-ciso',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'change-management-deficit',
    name: 'Change Management Deficit',
    lifecycleStage: 'active',
    signalStrength: 'moderate',
    description: 'Inadequate change management for major system rollout',
    triggerConditions: [
      'No formal change management plan for rollout with more than 100 affected users',
      'Stakeholder alignment score below 60% in pre-launch survey',
      'Training completion rate below 50% at go-live date',
    ],
    contraIndicators: [
      'PROSCI or equivalent change management methodology adopted',
      'Stakeholder alignment score above 80%',
    ],
    remedyHooks: [
      'recommend-change-management-program',
      'flag-rollout-risk',
      'surface-training-gap',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'roi-measurement-gap',
    name: 'ROI Measurement Gap',
    lifecycleStage: 'proposed',
    signalStrength: 'weak',
    description: 'No systematic ROI tracking across initiatives',
    triggerConditions: [
      'Investment decisions made without defined success metrics',
      'Post-implementation review process absent or inconsistently applied',
      'Business case assumptions not tracked against actuals',
    ],
    contraIndicators: [
      'Portfolio-level ROI dashboard active and reviewed quarterly',
      'All initiatives have documented benefit realization plans',
    ],
    remedyHooks: [
      'recommend-roi-framework',
      'flag-measurement-gap',
    ],
    addedVersion: 'v1.1.0',
    deprecationNote: null,
    deterministicSeed: true,
  },
  {
    patternKey: 'shadow-it-proliferation',
    name: 'Shadow IT Proliferation',
    lifecycleStage: 'deprecated',
    signalStrength: 'strong',
    description: 'Shadow IT systems bypassing IT governance',
    triggerConditions: [
      'Unapproved SaaS tools discovered in spend audit',
      'Data exfiltration risk from unmanaged cloud storage',
      'Compliance scope expanding due to shadow systems',
    ],
    contraIndicators: [
      'IT asset inventory covers 100% of spend categories',
      'SaaS approval process in place with documented exceptions',
    ],
    remedyHooks: [
      'recommend-it-governance',
      'flag-shadow-system',
    ],
    addedVersion: 'v1.0.0',
    deprecationNote:
      'Superseded by governance-gap pattern which covers the root cause',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countByStage(
  entries: readonly PatternRegistryEntry[],
  stage: PatternLifecycleStage,
): number {
  let count = 0;
  for (const e of entries) {
    if (e.lifecycleStage === stage) count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the registry entry for a single pattern by its key, or null if the
 * key is not in the seed.
 */
export function getPatternEntry(
  patternKey: string,
): PatternRegistryEntry | null {
  for (const entry of PATTERN_REGISTRY_ENTRIES) {
    if (entry.patternKey === patternKey) return entry;
  }
  return null;
}

/**
 * Builds the full PatternRegistryView across all seeded patterns.
 */
export function buildPatternRegistryView(): PatternRegistryView {
  return {
    entries: PATTERN_REGISTRY_ENTRIES,
    totalCount: PATTERN_REGISTRY_ENTRIES.length,
    activeCount: countByStage(PATTERN_REGISTRY_ENTRIES, 'active'),
    deprecatedCount: countByStage(PATTERN_REGISTRY_ENTRIES, 'deprecated'),
    archivedCount: countByStage(PATTERN_REGISTRY_ENTRIES, 'archived'),
    proposedCount: countByStage(PATTERN_REGISTRY_ENTRIES, 'proposed'),
    deterministicSeed: true,
  };
}

/**
 * Returns all patterns with lifecycleStage === 'active'.
 */
export function listActivePatterns(): readonly PatternRegistryEntry[] {
  return PATTERN_REGISTRY_ENTRIES.filter((e) => e.lifecycleStage === 'active');
}

/**
 * Returns all patterns matching the given signal strength, regardless of
 * lifecycle stage.
 */
export function getPatternsBySignalStrength(
  strength: PatternSignalStrength,
): readonly PatternRegistryEntry[] {
  return PATTERN_REGISTRY_ENTRIES.filter(
    (e) => e.signalStrength === strength,
  );
}

/**
 * Returns a concise prose description of a PatternRegistryView.
 * Example: "8 patterns: 6 active, 1 proposed, 1 deprecated, 0 archived"
 */
export function describePatternRegistry(view: PatternRegistryView): string {
  return (
    view.totalCount +
    ' patterns: ' +
    view.activeCount +
    ' active, ' +
    view.proposedCount +
    ' proposed, ' +
    view.deprecatedCount +
    ' deprecated, ' +
    view.archivedCount +
    ' archived'
  );
}
