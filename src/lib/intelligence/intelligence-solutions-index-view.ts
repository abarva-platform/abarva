// I5 · INT-IDX-SOLUTIONS — Intelligence solutions index view model.
//
// Deterministic view builder for the /intelligence/solutions route.
// Bridges the shell-solutions-fixture into a typed
// IntelligenceSolutionsIndexView consumed by IntelligenceSolutionsIndexPage.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { SOLUTIONS_INDEX_VIEW } from '@/lib/intelligence/shell-solutions-fixture';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SolutionCardView {
  id: string;
  name: string;
  domain: string;
  description: string;
  /** Pattern IDs this solution builds on. */
  patterns: readonly string[];
  programCount: number;
  maturity: 'proven' | 'emerging' | 'experimental';
  /** URL to the solution detail page. */
  href: string;
}

export interface IntelligenceSolutionsIndexView {
  // ── Catalog ───────────────────────────────────────────────────────────────
  solutions: readonly SolutionCardView[];
  totalSolutions: number;

  // ── Sentinel agent voice ──────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── I5: Provenance ribbon ─────────────────────────────────────────────────
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

function buildSolutionsProvenanceRibbon(
  programCount: number,
  solutionCount: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Solution',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'shell fixture · read model · no live retrieval',
    signalCount: solutionCount,
    programCount,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all known solution IDs (URL-safe slugs, e.g. 'cdp-activation').
 */
export function getKnownSolutionIds(): readonly string[] {
  return SOLUTIONS_INDEX_VIEW.archetypes.map((a) => a.id);
}

/**
 * Builds a deterministic IntelligenceSolutionsIndexView.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceSolutionsIndexView(): IntelligenceSolutionsIndexView {
  const solutions: SolutionCardView[] = SOLUTIONS_INDEX_VIEW.archetypes.map((a) => ({
    id: a.id,
    name: a.name,
    domain: a.domain,
    description: a.description,
    patterns: a.patterns,
    programCount: a.programCount,
    maturity: a.maturity,
    href: `/intelligence/solutions/${a.id}`,
  }));

  const totalPrograms = solutions.reduce((sum, s) => sum + s.programCount, 0);

  return {
    solutions,
    totalSolutions: solutions.length,

    agentQuote: SOLUTIONS_INDEX_VIEW.agentQuote,
    agentContext: SOLUTIONS_INDEX_VIEW.agentContext,

    provenanceRibbon: buildSolutionsProvenanceRibbon(totalPrograms, solutions.length),

    intelligenceLandingHref: '/intelligence',

    honestDisclaimer:
      'This solutions index is driven by deterministic shell fixtures. ' +
      'No live Sentinel runtime, no model invocation, no live retrieval is in use.',
    deterministicSeed: true,
  };
}
