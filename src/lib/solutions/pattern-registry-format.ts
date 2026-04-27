// PAT1 (Wave 30) · Pattern Registry Format
//
// Canonical schema and registry format for AbarVa solution patterns.
// Defines the structural contract that all pattern packs must conform to
// for inclusion in the AbarVa pattern library. Acts as the schema authority
// consumed by the pack spec validator (OPS4) and the pattern manifest (PAT5).
//
// This module is the single source of truth for:
//   - The canonical category taxonomy for all patterns
//   - The evidence requirement schema for pattern claims
//   - The Sentinel signal schema for pattern risk indicators
//   - The pattern readiness gate (is a pattern pack ready for production use?)
//   - The pattern registry entry format (what a registered pattern looks like)
//
// No DB writes, no migrations, no live retrieval, no model invocation,
// no fs reads, no Date.now, no Math.random.

// ---------------------------------------------------------------------
// Category taxonomy
// ---------------------------------------------------------------------

/**
 * Canonical category for a solution pattern.
 *
 * Categories define where in the sourcing/evaluation lifecycle the pattern
 * applies. A single pattern can span multiple categories.
 */
export type PatternCategory =
  | 'sourcing'         // vendor identification, RFx design, shortlisting
  | 'evaluation'       // criteria scoring, demos, POC design
  | 'governance'       // approval gates, policy compliance, data rights
  | 'transition'       // migration plans, knowledge transfer, go-live gates
  | 'ongoing-ops'      // SLA management, relationship governance, escalation
  | 'failure-modes'    // AI/tech failure taxonomy and intervention
  | 'runtime-mapping'  // connecting failure modes to program actions
  | 'commercial'       // pricing, BAFO, contract terms, commercial risk
  | 'vertical';        // industry-specific vertical overlay

/**
 * Applicability dimension — which technology/domain does the pattern apply to?
 */
export type PatternDomain =
  | 'data-platform'
  | 'infrastructure-managed-services'
  | 'ai-software-platform'
  | 'cloud-operations'
  | 'data-engineering'
  | 'analytics-platform'
  | 'enterprise-ai'
  | 'retail-technology'
  | 'supply-chain-technology'
  | 'financial-technology'
  | 'healthcare-technology'
  | 'generic';

/**
 * Pattern maturity level — how production-ready is this pattern?
 */
export type PatternMaturity =
  | 'draft'       // authored but not yet validated in a real engagement
  | 'validated'   // used in at least one live engagement
  | 'canonical'   // used in 3+ engagements, reviewed, no known gaps
  | 'deprecated'; // superseded by a newer pattern

/**
 * Agent that primarily uses this pattern.
 */
export type PatternOwnerAgent = 'nexus' | 'sentinel' | 'atlas' | 'steward';

// ---------------------------------------------------------------------
// Evidence requirement schema
// ---------------------------------------------------------------------

/**
 * A requirement for evidence when applying a pattern criterion.
 * Tells agents and users what proof is needed to satisfy a pattern criterion.
 */
export interface PatternEvidenceRequirement {
  evidenceId: string;
  label: string;
  description: string;
  /**
   * When true, this evidence is mandatory for the criterion to pass.
   * When false, it is recommended but not blocking.
   */
  required: boolean;
  /**
   * Acceptable evidence formats (e.g., "written reference", "demo recording",
   * "contract extract", "financial audit").
   */
  acceptedFormats: ReadonlyArray<string>;
  /**
   * How stale the evidence can be before it must be refreshed.
   * Expressed in calendar days. 0 = no staleness limit.
   */
  maxStaleDays: number;
}

// ---------------------------------------------------------------------
// Sentinel signal schema
// ---------------------------------------------------------------------

/**
 * Risk signal levels for Sentinel pattern signals.
 */
export type SentinelSignalLevel = 'critical' | 'high' | 'medium' | 'low';

/**
 * A Sentinel risk signal produced when a pattern detects a concerning pattern
 * in vendor responses, evidence, or commercial terms.
 */
export interface PatternSentinelSignal {
  signalId: string;
  label: string;
  description: string;
  level: SentinelSignalLevel;
  /**
   * What triggers this signal (observable condition).
   */
  trigger: string;
  /**
   * Recommended action when this signal fires.
   */
  recommendedAction: string;
  /**
   * Whether this signal should block the sourcing event from advancing
   * without explicit human review.
   */
  blocksProgression: boolean;
}

// ---------------------------------------------------------------------
// Pattern readiness gate
// ---------------------------------------------------------------------

/**
 * Readiness check result for a single gate condition.
 */
export interface PatternReadinessCheckResult {
  gateId: string;
  passed: boolean;
  detail: string;
}

/**
 * Full readiness gate result for a pattern entry.
 */
export interface PatternReadinessGateResult {
  patternId: string;
  isReady: boolean;
  passedGates: number;
  totalGates: number;
  results: ReadonlyArray<PatternReadinessCheckResult>;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------
// Pattern registry entry
// ---------------------------------------------------------------------

/**
 * A single registered pattern in the AbarVa pattern library.
 * This is the canonical format for all pattern packs.
 */
export interface PatternRegistryEntry {
  /**
   * Stable unique identifier. Must match the `createdFrom` discriminator
   * in the source pack module.
   */
  patternId: string;
  /**
   * URL-safe slug for the pattern, e.g. "data-platform-vendor-selection".
   */
  slug: string;
  /**
   * Human-readable display name.
   */
  name: string;
  /**
   * Short description (40–200 chars) for index and tooltip display.
   */
  shortDescription: string;
  /**
   * The primary question this pattern answers for an agent or user.
   */
  primaryQuestion: string;
  /**
   * Categories this pattern applies to.
   */
  categories: ReadonlyArray<PatternCategory>;
  /**
   * Technology/domain areas this pattern applies to.
   */
  domains: ReadonlyArray<PatternDomain>;
  /**
   * Maturity level — draft, validated, canonical, or deprecated.
   */
  maturity: PatternMaturity;
  /**
   * The agent that primarily surfaces this pattern.
   */
  primaryAgent: PatternOwnerAgent;
  /**
   * All agents that consume this pattern.
   */
  consumerAgents: ReadonlyArray<PatternOwnerAgent>;
  /**
   * Evidence requirements for applying this pattern.
   */
  evidenceRequirements: ReadonlyArray<PatternEvidenceRequirement>;
  /**
   * Sentinel signals emitted when this pattern detects risk.
   */
  sentinelSignals: ReadonlyArray<PatternSentinelSignal>;
  /**
   * Slugs of related patterns in the registry.
   */
  relatedPatternSlugs: ReadonlyArray<string>;
  /**
   * Wave this pattern was authored in.
   */
  authoredInWave: string;
  /**
   * Provenance seed — identifies the module that produced this entry.
   */
  createdFrom: string;
}

// ---------------------------------------------------------------------
// Pattern registry (canonical entries)
// ---------------------------------------------------------------------

/**
 * The full pattern registry.
 */
export interface PatternRegistry {
  version: '1.0';
  patterns: ReadonlyArray<PatternRegistryEntry>;
  totalPatterns: number;
  lastUpdated: string;
  createdFrom: 'pat1_w30_pattern_registry_format';
}

// ---------------------------------------------------------------------
// Readiness gate logic
// ---------------------------------------------------------------------

/**
 * Check whether a pattern registry entry passes the production readiness gate.
 *
 * Gate conditions:
 * 1. patternId is non-empty and has no whitespace
 * 2. slug is lowercase alphanumeric + hyphens, min 3 chars
 * 3. name is non-empty
 * 4. shortDescription is 40–200 chars
 * 5. primaryQuestion is at least 20 chars
 * 6. categories array is non-empty
 * 7. domains array is non-empty
 * 8. primaryAgent is a valid PatternOwnerAgent
 * 9. evidenceRequirements array is present (may be empty for draft patterns)
 * 10. createdFrom is non-empty
 *
 * Pure function — same input always produces the same output.
 */
export function evaluatePatternReadinessGate(
  entry: PatternRegistryEntry,
): PatternReadinessGateResult {
  const results: PatternReadinessCheckResult[] = [];

  // Gate 1: patternId
  const g1 = /^\S+$/.test(entry.patternId ?? '');
  results.push({
    gateId: 'G1-pattern-id',
    passed: g1,
    detail: g1 ? 'patternId is valid' : 'patternId is empty or contains whitespace',
  });

  // Gate 2: slug
  const g2 = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(entry.slug ?? '') && (entry.slug ?? '').length >= 3;
  results.push({
    gateId: 'G2-slug',
    passed: g2,
    detail: g2 ? 'slug is valid' : 'slug must be lowercase alphanumeric + hyphens, min 3 chars',
  });

  // Gate 3: name
  const g3 = typeof entry.name === 'string' && entry.name.trim().length > 0;
  results.push({
    gateId: 'G3-name',
    passed: g3,
    detail: g3 ? 'name is non-empty' : 'name is required',
  });

  // Gate 4: shortDescription length
  const descLen = typeof entry.shortDescription === 'string' ? entry.shortDescription.trim().length : 0;
  const g4 = descLen >= 40 && descLen <= 200;
  results.push({
    gateId: 'G4-short-description',
    passed: g4,
    detail: g4 ? `shortDescription length ${descLen} is in range` : `shortDescription is ${descLen} chars — required 40–200`,
  });

  // Gate 5: primaryQuestion
  const qLen = typeof entry.primaryQuestion === 'string' ? entry.primaryQuestion.trim().length : 0;
  const g5 = qLen >= 20;
  results.push({
    gateId: 'G5-primary-question',
    passed: g5,
    detail: g5 ? 'primaryQuestion meets minimum length' : `primaryQuestion is ${qLen} chars — required ≥20`,
  });

  // Gate 6: categories non-empty
  const g6 = Array.isArray(entry.categories) && entry.categories.length > 0;
  results.push({
    gateId: 'G6-categories',
    passed: g6,
    detail: g6 ? `${entry.categories.length} category(ies) defined` : 'categories array must be non-empty',
  });

  // Gate 7: domains non-empty
  const g7 = Array.isArray(entry.domains) && entry.domains.length > 0;
  results.push({
    gateId: 'G7-domains',
    passed: g7,
    detail: g7 ? `${entry.domains.length} domain(s) defined` : 'domains array must be non-empty',
  });

  // Gate 8: primaryAgent valid
  const VALID_AGENTS: PatternOwnerAgent[] = ['nexus', 'sentinel', 'atlas', 'steward'];
  const g8 = VALID_AGENTS.includes(entry.primaryAgent as PatternOwnerAgent);
  results.push({
    gateId: 'G8-primary-agent',
    passed: g8,
    detail: g8 ? `primaryAgent "${entry.primaryAgent}" is valid` : `primaryAgent "${entry.primaryAgent}" is not a valid PatternOwnerAgent`,
  });

  // Gate 9: evidenceRequirements is an array
  const g9 = Array.isArray(entry.evidenceRequirements);
  results.push({
    gateId: 'G9-evidence-requirements',
    passed: g9,
    detail: g9 ? 'evidenceRequirements is an array' : 'evidenceRequirements must be an array',
  });

  // Gate 10: createdFrom non-empty
  const g10 = typeof entry.createdFrom === 'string' && entry.createdFrom.trim().length > 0;
  results.push({
    gateId: 'G10-created-from',
    passed: g10,
    detail: g10 ? 'createdFrom provenance is present' : 'createdFrom is required',
  });

  const passedGates = results.filter((r) => r.passed).length;

  return {
    patternId: entry.patternId ?? '',
    isReady: passedGates === results.length,
    passedGates,
    totalGates: results.length,
    results,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------
// Registry helpers
// ---------------------------------------------------------------------

/**
 * Return patterns filtered by category. Pure.
 */
export function getPatternsByCategory(
  registry: PatternRegistry,
  category: PatternCategory,
): ReadonlyArray<PatternRegistryEntry> {
  return registry.patterns.filter((p) => p.categories.includes(category));
}

/**
 * Return patterns filtered by domain. Pure.
 */
export function getPatternsByDomain(
  registry: PatternRegistry,
  domain: PatternDomain,
): ReadonlyArray<PatternRegistryEntry> {
  return registry.patterns.filter((p) => p.domains.includes(domain));
}

/**
 * Return patterns filtered by maturity. Pure.
 */
export function getPatternsByMaturity(
  registry: PatternRegistry,
  maturity: PatternMaturity,
): ReadonlyArray<PatternRegistryEntry> {
  return registry.patterns.filter((p) => p.maturity === maturity);
}

/**
 * Return patterns that fire at least one critical Sentinel signal. Pure.
 */
export function getCriticalSignalPatterns(
  registry: PatternRegistry,
): ReadonlyArray<PatternRegistryEntry> {
  return registry.patterns.filter((p) =>
    p.sentinelSignals.some((s) => s.level === 'critical'),
  );
}

/**
 * Look up a pattern by its slug. Returns undefined if not found. Pure.
 */
export function getPatternBySlug(
  registry: PatternRegistry,
  slug: string,
): PatternRegistryEntry | undefined {
  return registry.patterns.find((p) => p.slug === slug);
}

/**
 * Summarize the pattern registry for index display. Pure.
 */
export interface PatternRegistrySummary {
  totalPatterns: number;
  byCategory: Partial<Record<PatternCategory, number>>;
  byDomain: Partial<Record<PatternDomain, number>>;
  byMaturity: Record<PatternMaturity, number>;
  byAgent: Record<PatternOwnerAgent, number>;
  criticalSignalCount: number;
  deterministicSeed: true;
}

export function summarizePatternRegistry(
  registry: PatternRegistry,
): PatternRegistrySummary {
  const byCategory: Partial<Record<PatternCategory, number>> = {};
  const byDomain: Partial<Record<PatternDomain, number>> = {};
  const byMaturity: Record<PatternMaturity, number> = {
    draft: 0,
    validated: 0,
    canonical: 0,
    deprecated: 0,
  };
  const byAgent: Record<PatternOwnerAgent, number> = {
    nexus: 0,
    sentinel: 0,
    atlas: 0,
    steward: 0,
  };
  let criticalSignalCount = 0;

  for (const p of registry.patterns) {
    for (const cat of p.categories) {
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }
    for (const dom of p.domains) {
      byDomain[dom] = (byDomain[dom] ?? 0) + 1;
    }
    byMaturity[p.maturity] += 1;
    byAgent[p.primaryAgent] += 1;
    if (p.sentinelSignals.some((s) => s.level === 'critical')) {
      criticalSignalCount += 1;
    }
  }

  return {
    totalPatterns: registry.patterns.length,
    byCategory,
    byDomain,
    byMaturity,
    byAgent,
    criticalSignalCount,
    deterministicSeed: true,
  };
}

// ---------------------------------------------------------------------
// Re-exports for test introspection
// ---------------------------------------------------------------------

export const PATTERN_CATEGORIES_IN_ORDER: ReadonlyArray<PatternCategory> = [
  'sourcing',
  'evaluation',
  'governance',
  'transition',
  'ongoing-ops',
  'failure-modes',
  'runtime-mapping',
  'commercial',
  'vertical',
];

export const PATTERN_MATURITY_LEVELS_IN_ORDER: ReadonlyArray<PatternMaturity> = [
  'draft',
  'validated',
  'canonical',
  'deprecated',
];

export const PATTERN_OWNER_AGENTS_IN_ORDER: ReadonlyArray<PatternOwnerAgent> = [
  'nexus',
  'sentinel',
  'atlas',
  'steward',
];
