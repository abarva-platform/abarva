// I2 · INT-DTL-PATTERN — Intelligence pattern detail view model.
//
// Deterministic view builder for the fixture-based /intelligence/[patternId]
// route. Bridges the four shell pattern fixtures (T3-H01, T3-H03, T1-F02,
// T2-C03) into a typed IntelligencePatternDetailView consumed by the server
// component IntelligencePatternDetailPage.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import { T3_H01_PATTERN } from '@/lib/intelligence/shell-pattern-detail-fixture';
import { T3_H03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-inreview-fixture';
import { T1_F02_PATTERN } from '@/lib/intelligence/shell-pattern-detail-candidate-fixture';
import { T2_C03_PATTERN } from '@/lib/intelligence/shell-pattern-detail-deprecated-fixture';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PatternEvidenceRow {
  /** Derived from section heading. */
  id: string;
  heading: string;
  body: string;
}

export interface PatternSentinelVerdict {
  status: 'validated' | 'in-review' | 'candidate' | 'deprecated';
  confidence: 'high' | 'medium' | 'low';
  verdictDate: string;
  evidenceSources: number;
  note: string;
}

export interface PatternUsingProgram {
  id: string;
  displayId: string;
  name: string;
  phase?: string | number;
  phaseLabel?: string;
  context?: string;
  href: string;
}

export interface IntelligencePatternDetailView {
  // ── Identity ──────────────────────────────────────────────────────────────
  /** URL slug, e.g. 't3-h01'. */
  patternId: string;
  /** Display key, e.g. 'T3-H01'. */
  patternKey: string;
  patternName: string;
  tier: 'T1' | 'T2' | 'T3';
  status: 'validated' | 'in-review' | 'candidate' | 'deprecated';
  lastReviewed: string;
  usedInPrograms: number;

  // ── Sentinel verdict ──────────────────────────────────────────────────────
  verdict: PatternSentinelVerdict;

  // ── Evidence rows (from reading sections) ─────────────────────────────────
  /** Each section in the fixture becomes one evidence row. Min 2 for T3-H03. */
  evidenceRows: readonly PatternEvidenceRow[];

  // ── Programs using this pattern ───────────────────────────────────────────
  usingPrograms: readonly PatternUsingProgram[];

  // ── Sentinel agent voice ──────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── I2: Provenance ribbon view ────────────────────────────────────────────
  /** Built server-side; passed directly to IntelligenceProvenanceRibbon. */
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

function slugify(key: string): string {
  return key.toLowerCase().replace('/', '-');
}

function buildEvidenceRows(
  sections: Array<{ heading: string; body: string }>,
): readonly PatternEvidenceRow[] {
  return sections.map((s) => ({
    id: s.heading.toLowerCase().replace(/\s+/g, '-'),
    heading: s.heading,
    body: s.body,
  }));
}

function buildProvenanceRibbon(
  status: IntelligencePatternDetailView['status'],
  evidenceSources: number,
  programCount: number,
): IntelligenceProvenanceRibbonView {
  const citationStatus: string =
    status === 'validated'
      ? 'not_yet_wired'
      : status === 'in-review'
      ? 'not_yet_wired'
      : 'not_yet_wired';

  return {
    primitive: 'Pattern',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'shell fixture · read model · no live retrieval',
    signalCount: evidenceSources,
    programCount,
    citationReadinessLabel: citationStatus,
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

function normalizeUsingPrograms(
  raw: unknown,
): readonly PatternUsingProgram[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>).map((p) => ({
    id: String(p.id ?? ''),
    displayId: String(p.displayId ?? p.id ?? ''),
    name: String(p.name ?? ''),
    phase: p.phase as string | number | undefined,
    phaseLabel: p.phaseLabel as string | undefined,
    context: p.context as string | undefined,
    href: String(p.href ?? '/intelligence'),
  }));
}

// ---------------------------------------------------------------------------
// Fixture registry
// ---------------------------------------------------------------------------

const PATTERN_REGISTRY: Record<string, unknown> = {
  [slugify(T3_H01_PATTERN.id)]: T3_H01_PATTERN,
  [slugify(T3_H03_PATTERN.id)]: T3_H03_PATTERN,
  [slugify(T1_F02_PATTERN.id)]: T1_F02_PATTERN,
  [slugify(T2_C03_PATTERN.id)]: T2_C03_PATTERN,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all known pattern ID slugs (URL-safe, e.g. 't3-h01').
 */
export function getKnownPatternIds(): readonly string[] {
  return Object.keys(PATTERN_REGISTRY);
}

/**
 * Builds a deterministic IntelligencePatternDetailView for the given
 * URL slug (e.g. 't3-h01'). Returns null when the slug is unknown.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligencePatternDetailView(
  patternId: string,
): IntelligencePatternDetailView | null {
  const fixture = PATTERN_REGISTRY[patternId.toLowerCase()];
  if (!fixture) return null;

  const f = fixture as {
    id: string;
    name: string;
    tier: 'T1' | 'T2' | 'T3';
    status: 'validated' | 'in-review' | 'candidate' | 'deprecated';
    lastReviewed: string;
    usedInPrograms: number;
    sentinelVerdict: {
      status: string;
      confidence: string;
      verdictDate: string;
      evidenceSources: number;
      note: string;
    };
    sections: Array<{ heading: string; body: string }>;
    usingPrograms?: unknown;
    agentQuote: string;
    agentContext: string;
  };

  const evidenceRows = buildEvidenceRows(f.sections);
  const usingPrograms = normalizeUsingPrograms(f.usingPrograms);
  const provenanceRibbon = buildProvenanceRibbon(
    f.status,
    f.sentinelVerdict.evidenceSources,
    usingPrograms.length,
  );

  return {
    patternId: patternId.toLowerCase(),
    patternKey: f.id,
    patternName: f.name,
    tier: f.tier,
    status: f.status,
    lastReviewed: f.lastReviewed,
    usedInPrograms: f.usedInPrograms,

    verdict: {
      status: f.sentinelVerdict.status as PatternSentinelVerdict['status'],
      confidence: f.sentinelVerdict.confidence as PatternSentinelVerdict['confidence'],
      verdictDate: f.sentinelVerdict.verdictDate,
      evidenceSources: f.sentinelVerdict.evidenceSources,
      note: f.sentinelVerdict.note,
    },

    evidenceRows,
    usingPrograms,

    agentQuote: f.agentQuote,
    agentContext: f.agentContext,

    provenanceRibbon,

    intelligenceLandingHref: '/intelligence',

    honestDisclaimer:
      'This pattern detail view is driven by deterministic shell fixtures. ' +
      'No live Sentinel runtime, no model invocation, no live retrieval is in use.',
    deterministicSeed: true,
  };
}
