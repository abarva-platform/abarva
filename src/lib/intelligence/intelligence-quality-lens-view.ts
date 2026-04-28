// I7 · INT-LNS-QUALITY — Intelligence knowledge quality lens view model.
//
// Deterministic view builder for /intelligence/quality.
// Aggregates seed counts across all pattern domains, contradictions, and
// solutions into a typed IntelligenceQualityLensView.
//
// This is the meta-view of the knowledge layer's own health — the page the
// founder reviews quarterly to understand coverage, contradiction density,
// freshness, and identified gaps.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { AI_PROGRAM_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-ai-programs';
import { CDP_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-cdp';
import { SOURCING_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-sourcing';
import { ARCHITECTURE_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-architecture';
import { META_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-meta';
import { INDUSTRY_PATTERN_COUNT } from '@/lib/intelligence/seed-patterns-industry';
import { CONTRADICTION_SEED_COUNT, CONTRADICTION_SEEDS } from '@/lib/intelligence/seed-contradictions';
import { SOLUTIONS_INDEX_VIEW } from '@/lib/intelligence/shell-solutions-fixture';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CoverageStrength = 'strong' | 'moderate' | 'thin';

export interface DomainCoverageRow {
  /** Machine key, e.g. 'ai-programs'. */
  id: string;
  /** Display label, e.g. 'AI Programs'. */
  domain: string;
  patternCount: number;
  /** True when at least one canonical detail fixture exists for this domain. */
  hasDetailFixtures: boolean;
  coverage: CoverageStrength;
}

export interface ContradictionStatusSummary {
  open: number;
  underReview: number;
  resolvedTowardA: number;
  resolvedTowardB: number;
  acceptedAsTension: number;
  total: number;
}

export interface GapRow {
  id: string;
  description: string;
  /** How many program/tower decisions reference this area without a backing pattern. */
  occurrences: number;
  priority: 'high' | 'medium' | 'low';
}

export interface IntelligenceQualityLensView {
  // ── Summary metrics ───────────────────────────────────────────────────────
  totalPatterns: number;
  totalSolutions: number;
  totalContradictions: number;
  /** Open + under-review contradictions (need attention). */
  activeContradictions: number;
  /** Resolved (toward A or B) + accepted-as-tension. */
  resolvedContradictions: number;
  /** Open contradictions per 100 primitives (patterns + solutions + contradictions). */
  contradictionDensityPer100: string;

  // ── Coverage by domain ────────────────────────────────────────────────────
  domainCoverage: readonly DomainCoverageRow[];

  // ── Contradiction status breakdown ────────────────────────────────────────
  contradictionStatus: ContradictionStatusSummary;

  // ── Gap analysis ──────────────────────────────────────────────────────────
  identifiedGaps: readonly GapRow[];

  // ── Health narrative ──────────────────────────────────────────────────────
  healthSummary: string;

  // ── Sentinel agent voice ──────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── I7: Provenance ribbon ─────────────────────────────────────────────────
  provenanceRibbon: IntelligenceProvenanceRibbonView;

  // ── Navigation ────────────────────────────────────────────────────────────
  intelligenceLandingHref: '/intelligence';

  // ── Honesty ───────────────────────────────────────────────────────────────
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function classifyCoverage(count: number): CoverageStrength {
  if (count >= 11) return 'strong';
  if (count >= 7) return 'moderate';
  return 'thin';
}

function buildDomainCoverage(): DomainCoverageRow[] {
  return [
    {
      id: 'ai-programs',
      domain: 'AI Programs',
      patternCount: AI_PROGRAM_PATTERN_COUNT,
      hasDetailFixtures: false,
      coverage: classifyCoverage(AI_PROGRAM_PATTERN_COUNT),
    },
    {
      id: 'sourcing',
      domain: 'Sourcing',
      patternCount: SOURCING_PATTERN_COUNT,
      hasDetailFixtures: false,
      coverage: classifyCoverage(SOURCING_PATTERN_COUNT),
    },
    {
      id: 'cdp',
      domain: 'Customer Data',
      patternCount: CDP_PATTERN_COUNT,
      hasDetailFixtures: true,  // T3-H01, T3-H03 are CDP fixtures
      coverage: classifyCoverage(CDP_PATTERN_COUNT),
    },
    {
      id: 'architecture',
      domain: 'Architecture',
      patternCount: ARCHITECTURE_PATTERN_COUNT,
      hasDetailFixtures: false,
      coverage: classifyCoverage(ARCHITECTURE_PATTERN_COUNT),
    },
    {
      id: 'industry',
      domain: 'Industry',
      patternCount: INDUSTRY_PATTERN_COUNT,
      hasDetailFixtures: false,
      coverage: classifyCoverage(INDUSTRY_PATTERN_COUNT),
    },
    {
      id: 'meta',
      domain: 'Meta / Governance',
      patternCount: META_PATTERN_COUNT,
      hasDetailFixtures: true,  // T1-F02 is a governance/foundation fixture
      coverage: classifyCoverage(META_PATTERN_COUNT),
    },
  ];
}

function buildContradictionStatus(): ContradictionStatusSummary {
  const counts = { open: 0, underReview: 0, resolvedTowardA: 0, resolvedTowardB: 0, acceptedAsTension: 0 };
  for (const c of CONTRADICTION_SEEDS) {
    if (c.status === 'open') counts.open++;
    else if (c.status === 'under-review') counts.underReview++;
    else if (c.status === 'resolved-toward-A') counts.resolvedTowardA++;
    else if (c.status === 'resolved-toward-B') counts.resolvedTowardB++;
    else if (c.status === 'accepted-as-tension') counts.acceptedAsTension++;
  }
  return {
    ...counts,
    total: CONTRADICTION_SEED_COUNT,
  };
}

/** Deterministic gap seed — based on audit and design spec gap examples. */
const IDENTIFIED_GAPS: readonly GapRow[] = [
  {
    id: 'GAP-001',
    description: 'Cross-vendor inference cost normalization — appears in 6+ programs and 3 Tower decisions but lacks a backing pattern',
    occurrences: 9,
    priority: 'high',
  },
  {
    id: 'GAP-002',
    description: 'Talent and future-of-work domain — thin coverage; only meta-level patterns, no use-case tier patterns',
    occurrences: 4,
    priority: 'medium',
  },
  {
    id: 'GAP-003',
    description: 'Embedded AI feature governance — boundary between sanctioned vendor AI and enterprise governance policy has no T2 pattern',
    occurrences: 6,
    priority: 'high',
  },
  {
    id: 'GAP-004',
    description: 'Compliance and regulatory AI — coverage exists at T1 but no T2/T3 use-case layer for regulated industries',
    occurrences: 3,
    priority: 'medium',
  },
  {
    id: 'GAP-005',
    description: 'Healthcare ambulatory AI operating model — industry patterns cover clinical ambient but not full care-team workflow integration',
    occurrences: 2,
    priority: 'low',
  },
];

function buildQualityProvenanceRibbon(
  totalPatterns: number,
  totalSolutions: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Pattern',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'seed pattern counts + contradiction seeds + shell fixture · read model · no live retrieval',
    signalCount: totalPatterns,
    programCount: totalSolutions,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic IntelligenceQualityLensView.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceQualityLensView(): IntelligenceQualityLensView {
  const totalPatterns =
    AI_PROGRAM_PATTERN_COUNT +
    CDP_PATTERN_COUNT +
    SOURCING_PATTERN_COUNT +
    ARCHITECTURE_PATTERN_COUNT +
    META_PATTERN_COUNT +
    INDUSTRY_PATTERN_COUNT;

  const totalSolutions = SOLUTIONS_INDEX_VIEW.archetypes.length;
  const totalContradictions = CONTRADICTION_SEED_COUNT;

  const contraStatus = buildContradictionStatus();
  const activeContradictions = contraStatus.open + contraStatus.underReview;
  const resolvedContradictions =
    contraStatus.resolvedTowardA + contraStatus.resolvedTowardB + contraStatus.acceptedAsTension;

  const totalPrimitives = totalPatterns + totalSolutions + totalContradictions;
  const densityPer100 = totalPrimitives > 0
    ? ((activeContradictions / totalPrimitives) * 100).toFixed(1)
    : '0.0';

  const domainCoverage = buildDomainCoverage();
  const strongDomains = domainCoverage.filter((d) => d.coverage === 'strong').map((d) => d.domain);
  const thinDomains = domainCoverage.filter((d) => d.coverage === 'thin').map((d) => d.domain);

  const healthSummary =
    `Knowledge layer: ${totalPatterns} patterns across ${domainCoverage.length} domains, ` +
    `${totalSolutions} solution archetypes, ${totalContradictions} contradictions ` +
    `(${activeContradictions} active, ${resolvedContradictions} resolved/accepted). ` +
    `Strong coverage in: ${strongDomains.join(', ')}. ` +
    (thinDomains.length > 0 ? `Thin coverage in: ${thinDomains.join(', ')}. ` : '') +
    `${IDENTIFIED_GAPS.filter((g) => g.priority === 'high').length} high-priority gaps identified.`;

  const agentQuote =
    `Knowledge layer health: ${totalPatterns} patterns, ${totalSolutions} solutions, ` +
    `${totalContradictions} contradictions. ` +
    `Coverage is strong in ${strongDomains.slice(0, 2).join(' and ')}; ` +
    (thinDomains.length > 0 ? `thin in ${thinDomains.join(' and ')}. ` : '') +
    `${activeContradictions} contradiction${activeContradictions !== 1 ? 's' : ''} active. ` +
    `${IDENTIFIED_GAPS.filter((g) => g.priority === 'high').length} high-priority gaps flagged.`;

  return {
    totalPatterns,
    totalSolutions,
    totalContradictions,
    activeContradictions,
    resolvedContradictions,
    contradictionDensityPer100: densityPer100,

    domainCoverage,
    contradictionStatus: contraStatus,
    identifiedGaps: IDENTIFIED_GAPS,

    healthSummary,
    agentQuote,
    agentContext: `Sentinel · Quality Lens · ${totalPatterns} patterns · ${totalContradictions} contradictions`,

    provenanceRibbon: buildQualityProvenanceRibbon(totalPatterns, totalSolutions),

    intelligenceLandingHref: '/intelligence',

    honestDisclaimer:
      'This quality lens view is driven by deterministic seed counts. ' +
      'No live Sentinel runtime, no model invocation, no live retrieval is in use. ' +
      'Pattern counts reflect seed files; gap analysis is a deterministic planning seed.',
    deterministicSeed: true,
  };
}
