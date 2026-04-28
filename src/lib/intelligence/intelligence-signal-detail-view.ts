// I3 · INT-DTL-SIGNAL — Intelligence signal detail view model.
//
// Deterministic view builder for the fixture-based /intelligence/signals/[signalId]
// route. Bridges MANUAL_SIGNALS from seed-signals-manual.ts into a typed
// IntelligenceSignalDetailView consumed by IntelligenceSignalDetailPage.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { MANUAL_SIGNALS, type SignalSeed } from '@/lib/intelligence/seed-signals-manual';
import { SOURCE_TYPE_LABELS, getKnownSignalIds } from '@/lib/intelligence/intelligence-signals-index-view';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// Re-export for convenience
export { getKnownSignalIds };

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntelligenceSignalDetailView {
  // ── Identity ────────────────────────────────────────────────────────────
  signalId: string;
  title: string;
  sourceType: SignalSeed['sourceType'];
  sourceTypeLabel: string;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  observedAt: string;
  ingestedAt: string;
  confidence: number;
  /** e.g. "91%" */
  confidenceLabel: string;
  ttlDays: number;

  // ── Affected entities ────────────────────────────────────────────────────
  affectedPatternIds: readonly string[];
  affectedProgramIds: readonly string[];

  // ── Navigation ───────────────────────────────────────────────────────────
  signalsLandingHref: '/intelligence/signals';
  intelligenceLandingHref: '/intelligence';

  // ── Provenance ribbon ────────────────────────────────────────────────────
  provenanceRibbon: IntelligenceProvenanceRibbonView;

  // ── Sentinel agent voice ─────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── Honesty ──────────────────────────────────────────────────────────────
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map from lowercase signal ID → seed record. Built once, reused. */
const SIGNAL_REGISTRY: Map<string, SignalSeed> = new Map(
  MANUAL_SIGNALS.map((s) => [s.id.toLowerCase(), s]),
);

function buildSignalProvenanceRibbon(
  affectedPatternCount: number,
  affectedProgramCount: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Signal',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'seed-signals-manual.ts · read model · no live ingestion',
    signalCount: 1,
    programCount: affectedProgramCount,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

function agentQuoteForSignal(s: SignalSeed): string {
  switch (s.sourceType) {
    case 'vendor_announcement':
      return `Vendor announcements mark the edge of what's being deployed, not just promised. "${s.sourceName}" is telling you what the market is pricing in.`;
    case 'regulatory':
      return 'Regulatory signals set the constraint envelope before enterprise teams can move. This signal defines where the fence is.';
    case 'analyst':
      return 'Analyst signals aggregate practitioner patterns into a single frame. Worth weighting alongside your own evidence.';
    case 'manual_curated':
      return 'Manually curated signals represent observed market behavior distilled into a single signal point. High precision, low volume — use accordingly.';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic IntelligenceSignalDetailView for the given
 * URL slug (e.g. 'sig-src-2025-001'). Returns null when the slug is unknown.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceSignalDetailView(
  signalId: string,
): IntelligenceSignalDetailView | null {
  const seed = SIGNAL_REGISTRY.get(signalId.toLowerCase());
  if (!seed) return null;

  const provenanceRibbon = buildSignalProvenanceRibbon(
    seed.affectedPatternIds.length,
    seed.affectedProgramIds.length,
  );

  return {
    signalId:          seed.id.toLowerCase(),
    title:             seed.title,
    sourceType:        seed.sourceType,
    sourceTypeLabel:   SOURCE_TYPE_LABELS[seed.sourceType],
    sourceName:        seed.sourceName,
    sourceUrl:         seed.sourceUrl,
    summary:           seed.summary,
    observedAt:        seed.observedAt,
    ingestedAt:        seed.ingestedAt,
    confidence:        seed.confidence,
    confidenceLabel:   `${Math.round(seed.confidence * 100)}%`,
    ttlDays:           seed.ttlDays,
    affectedPatternIds: seed.affectedPatternIds,
    affectedProgramIds: seed.affectedProgramIds,

    signalsLandingHref:     '/intelligence/signals',
    intelligenceLandingHref: '/intelligence',

    provenanceRibbon,
    agentQuote:   agentQuoteForSignal(seed),
    agentContext: `Sentinel · Signal detail · ${SOURCE_TYPE_LABELS[seed.sourceType]} · ${seed.sourceName}`,

    honestDisclaimer:
      'This signal detail view is driven by a deterministic shell fixture. ' +
      'No live Sentinel runtime, no model invocation, and no live signal ingestion is in use.',
    deterministicSeed: true,
  };
}
