// I3 · INT-IDX-SIGNALS — Intelligence signal stream index view model.
//
// Deterministic view builder for the fixture-based /intelligence/signals
// route. Bridges the 30 manual signal seeds (MANUAL_SIGNALS) into a typed
// IntelligenceSignalsIndexView consumed by IntelligenceSignalsIndexPage.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { MANUAL_SIGNALS, type SignalSeed } from '@/lib/intelligence/seed-signals-manual';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SignalSourceType = SignalSeed['sourceType'];

export const SOURCE_TYPE_LABELS: Record<SignalSourceType, string> = {
  vendor_announcement: 'Vendor',
  regulatory:          'Regulatory',
  analyst:             'Analyst',
  manual_curated:      'Curated',
};

export interface SignalRowView {
  id: string;
  title: string;
  sourceType: SignalSourceType;
  sourceTypeLabel: string;
  sourceName: string;
  observedAt: string;
  confidence: number;
  /** e.g. "91%" */
  confidenceLabel: string;
  affectedPatternCount: number;
  affectedProgramCount: number;
  ttlDays: number;
  href: string;
}

export interface SignalSourceTypeSummary {
  vendor_announcement: number;
  regulatory: number;
  analyst: number;
  manual_curated: number;
}

export interface IntelligenceSignalsIndexView {
  signals: readonly SignalRowView[];
  totalSignals: number;
  bySourceType: SignalSourceTypeSummary;
  provenanceRibbon: IntelligenceProvenanceRibbonView;
  agentQuote: string;
  agentContext: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toSignalRowView(s: SignalSeed): SignalRowView {
  return {
    id:                   s.id,
    title:                s.title,
    sourceType:           s.sourceType,
    sourceTypeLabel:      SOURCE_TYPE_LABELS[s.sourceType],
    sourceName:           s.sourceName,
    observedAt:           s.observedAt,
    confidence:           s.confidence,
    confidenceLabel:      `${Math.round(s.confidence * 100)}%`,
    affectedPatternCount: s.affectedPatternIds.length,
    affectedProgramCount: s.affectedProgramIds.length,
    ttlDays:              s.ttlDays,
    href:                 `/intelligence/signals/${s.id.toLowerCase()}`,
  };
}

function buildSourceTypeSummary(
  signals: readonly SignalSeed[],
): SignalSourceTypeSummary {
  const counts: SignalSourceTypeSummary = {
    vendor_announcement: 0,
    regulatory: 0,
    analyst: 0,
    manual_curated: 0,
  };
  for (const s of signals) {
    counts[s.sourceType] += 1;
  }
  return counts;
}

function buildProvenanceRibbon(
  signalCount: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Signal',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'seed-signals-manual.ts · read model · no live ingestion',
    signalCount,
    programCount: 0,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all known signal ID slugs (URL-safe lowercase, e.g. 'sig-src-2025-001').
 */
export function getKnownSignalIds(): readonly string[] {
  return MANUAL_SIGNALS.map((s) => s.id.toLowerCase());
}

/**
 * Builds the deterministic IntelligenceSignalsIndexView.
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceSignalsIndexView(): IntelligenceSignalsIndexView {
  const signals = MANUAL_SIGNALS.map(toSignalRowView);
  const bySourceType = buildSourceTypeSummary(MANUAL_SIGNALS);
  const provenanceRibbon = buildProvenanceRibbon(signals.length);

  return {
    signals,
    totalSignals: signals.length,
    bySourceType,
    provenanceRibbon,
    agentQuote:
      'Signals are the raw material of institutional intelligence. Each one is a weak echo of market movement; together they reveal the pattern before the pattern has a name.',
    agentContext:
      'Sentinel · Signal stream · Deterministic seed',
    deterministicSeed: true,
  };
}
