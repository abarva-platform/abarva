// I5 · INT-DTL-SOLUTION — Intelligence solution detail view model.
//
// Deterministic view builder for the /intelligence/solutions/[solutionId]
// route. Bridges the shell-solutions-fixture into a typed
// IntelligenceSolutionDetailView consumed by IntelligenceSolutionDetailPage.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { SOLUTIONS_INDEX_VIEW } from '@/lib/intelligence/shell-solutions-fixture';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SolutionPatternRef {
  patternId: string;
  /** URL slug to pattern detail, e.g. 't1-f01'. */
  href: string;
  /** Role of this pattern in the solution composition. */
  role: 'foundation' | 'variation' | 'signal-calibrator';
}

export interface IntelligenceSolutionDetailView {
  // ── Identity ──────────────────────────────────────────────────────────────
  solutionId: string;
  name: string;
  domain: string;
  description: string;
  maturity: 'proven' | 'emerging' | 'experimental';
  programCount: number;

  // ── Composition manifest ──────────────────────────────────────────────────
  /** Patterns that compose this solution, with roles. */
  compositionPatterns: readonly SolutionPatternRef[];

  // ── Sentinel agent voice ──────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── I5: Provenance ribbon ─────────────────────────────────────────────────
  provenanceRibbon: IntelligenceProvenanceRibbonView;

  // ── Navigation ────────────────────────────────────────────────────────────
  solutionsIndexHref: '/intelligence/solutions';
  intelligenceLandingHref: '/intelligence';

  // ── Honesty ───────────────────────────────────────────────────────────────
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Assign a role heuristic based on pattern ID prefix.
 * Foundation = T1 (core capability), Variation = T2 (capability variant),
 * Signal-calibrator = T3 (use-case).
 */
function inferRole(patternId: string): SolutionPatternRef['role'] {
  if (patternId.startsWith('T1')) return 'foundation';
  if (patternId.startsWith('T2')) return 'variation';
  return 'signal-calibrator';
}

function buildSolutionProvenanceRibbon(
  programCount: number,
  patternCount: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Solution',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'shell fixture · read model · no live retrieval',
    signalCount: patternCount,
    programCount,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all known solution ID slugs (e.g. 'cdp-activation').
 */
export function getKnownSolutionIds(): readonly string[] {
  return SOLUTIONS_INDEX_VIEW.archetypes.map((a) => a.id);
}

/**
 * Builds a deterministic IntelligenceSolutionDetailView for the given
 * solution ID slug (e.g. 'cdp-activation'). Returns null when unknown.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceSolutionDetailView(
  solutionId: string,
): IntelligenceSolutionDetailView | null {
  const archetype = SOLUTIONS_INDEX_VIEW.archetypes.find(
    (a) => a.id === solutionId.toLowerCase(),
  );
  if (!archetype) return null;

  const compositionPatterns: SolutionPatternRef[] = archetype.patterns.map((pid) => ({
    patternId: pid,
    href: `/intelligence/${pid.toLowerCase().replace('/', '-')}`,
    role: inferRole(pid),
  }));

  return {
    solutionId: archetype.id,
    name: archetype.name,
    domain: archetype.domain,
    description: archetype.description,
    maturity: archetype.maturity,
    programCount: archetype.programCount,

    compositionPatterns,

    agentQuote:
      `${archetype.name} is a ${archetype.maturity} archetype in the ${archetype.domain} domain. ` +
      `It builds on ${archetype.patterns.length} pattern${archetype.patterns.length !== 1 ? 's' : ''} ` +
      `and is active in ${archetype.programCount} program${archetype.programCount !== 1 ? 's' : ''}.`,
    agentContext: `Sentinel · Solution · ${archetype.name} · ${archetype.domain}`,

    provenanceRibbon: buildSolutionProvenanceRibbon(
      archetype.programCount,
      archetype.patterns.length,
    ),

    solutionsIndexHref: '/intelligence/solutions',
    intelligenceLandingHref: '/intelligence',

    honestDisclaimer:
      'This solution detail view is driven by deterministic shell fixtures. ' +
      'No live Sentinel runtime, no model invocation, no live retrieval is in use.',
    deterministicSeed: true,
  };
}
