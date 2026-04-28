// I5 · INT-DTL-CONTRADICTION — Intelligence contradiction detail view model.
//
// Deterministic view builder for /intelligence/contradictions/[contradictionId].
// Bridges CONTRADICTION_SEEDS into a typed IntelligenceContradictionDetailView
// consumed by IntelligenceContradictionDetailPage.
//
// Contradictions are the most distinctive surface in Intelligence — explicit
// conflicts between two competing claims, made visible.
//
// Deterministic and file-pure — no live calls, no randomness, no date reads.
// Every output is a pure function of its inputs and the fixture data.

import CONTRADICTION_SEEDS from '@/lib/intelligence/seed-contradictions';
import type { IntelligenceProvenanceRibbonView } from '@/lib/intelligence/intelligence-provenance-ribbon-view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContradictionStatus =
  | 'open'
  | 'under-review'
  | 'resolved-toward-A'
  | 'resolved-toward-B'
  | 'accepted-as-tension';

export interface ContradictionPartyView {
  claim: string;
  source: string;
  evidence: string;
  /** 0–1 confidence. */
  confidence: number;
  /** Formatted as percentage, e.g. '95%'. */
  confidenceLabel: string;
}

export interface IntelligenceContradictionDetailView {
  // ── Identity ──────────────────────────────────────────────────────────────
  contradictionId: string;
  title: string;
  status: ContradictionStatus;
  /** Human-readable status label. */
  statusLabel: string;

  // ── Parties ───────────────────────────────────────────────────────────────
  partyA: ContradictionPartyView;
  partyB: ContradictionPartyView;

  // ── Resolution ──────────────────────────────────���─────────────────────────
  whyBothCannotBeTrue: string;
  resolutionTimeline: string;
  body: string;

  // ── Affected entities ─────────────────────────────────────────────────────
  affectedPatternIds: readonly string[];

  // ── Sentinel agent voice ──────────────────────────────────────────────────
  agentQuote: string;
  agentContext: string;

  // ── I5: Provenance ribbon ─────────────────────────────────────────────────
  provenanceRibbon: IntelligenceProvenanceRibbonView;

  // ── Navigation ───────────────────────────────────────────────────────────���
  intelligenceLandingHref: '/intelligence';

  // ── Honesty ───────────────────────────────────────────────────────────────
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ContradictionStatus, string> = {
  open: 'Open',
  'under-review': 'Under review',
  'resolved-toward-A': 'Resolved → Party A',
  'resolved-toward-B': 'Resolved → Party B',
  'accepted-as-tension': 'Accepted as tension',
};

function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function buildContradictionProvenanceRibbon(
  patternCount: number,
): IntelligenceProvenanceRibbonView {
  return {
    primitive: 'Contradiction',
    sourceLabel: 'deterministic_seed',
    storeBinding: 'shell fixture · read model · no live retrieval',
    signalCount: patternCount,
    programCount: 0,
    citationReadinessLabel: 'not_yet_wired',
    runtimeLabel: 'no live Sentinel / no model invocation',
  };
}

function buildAgentQuote(
  title: string,
  status: ContradictionStatus,
  affectedCount: number,
): string {
  const statusFragment =
    status === 'resolved-toward-A'
      ? 'resolved toward Party A'
      : status === 'resolved-toward-B'
      ? 'resolved toward Party B'
      : status === 'accepted-as-tension'
      ? 'accepted as a durable tension'
      : status === 'under-review'
      ? 'under active review'
      : 'open and unresolved';

  return (
    `This contradiction is ${statusFragment}. ` +
    `It affects ${affectedCount} pattern${affectedCount !== 1 ? 's' : ''} in the library. ` +
    `${title.length > 60 ? 'Review the full claim analysis below.' : ''}`
  ).trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all known contradiction IDs (e.g. 'con-001').
 */
export function getKnownContradictionIds(): readonly string[] {
  return CONTRADICTION_SEEDS.map((c) => c.id.toLowerCase());
}

/**
 * Builds a deterministic IntelligenceContradictionDetailView for the given
 * contradiction ID slug (e.g. 'con-001'). Returns null when unknown.
 *
 * Pure: same input → identical output. No live calls.
 */
export function buildIntelligenceContradictionDetailView(
  contradictionId: string,
): IntelligenceContradictionDetailView | null {
  const seed = CONTRADICTION_SEEDS.find(
    (c) => c.id.toLowerCase() === contradictionId.toLowerCase(),
  );
  if (!seed) return null;

  const status = seed.status as ContradictionStatus;

  return {
    contradictionId: seed.id.toLowerCase(),
    title: seed.title,
    status,
    statusLabel: STATUS_LABELS[status] ?? status,

    partyA: {
      claim: seed.partyA.claim,
      source: seed.partyA.source,
      evidence: seed.partyA.evidence,
      confidence: seed.partyA.confidence,
      confidenceLabel: formatConfidence(seed.partyA.confidence),
    },
    partyB: {
      claim: seed.partyB.claim,
      source: seed.partyB.source,
      evidence: seed.partyB.evidence,
      confidence: seed.partyB.confidence,
      confidenceLabel: formatConfidence(seed.partyB.confidence),
    },

    whyBothCannotBeTrue: seed.whyBothCannotBeTrue,
    resolutionTimeline: seed.resolutionTimeline,
    body: seed.body,

    affectedPatternIds: seed.affectedPatternIds,

    agentQuote: buildAgentQuote(seed.title, status, seed.affectedPatternIds.length),
    agentContext: `Sentinel · Contradiction · ${seed.id} · ${STATUS_LABELS[status]}`,

    provenanceRibbon: buildContradictionProvenanceRibbon(seed.affectedPatternIds.length),

    intelligenceLandingHref: '/intelligence',

    honestDisclaimer:
      'This contradiction detail view is driven by deterministic shell fixtures. ' +
      'No live Sentinel runtime, no model invocation, no live retrieval is in use.',
    deterministicSeed: true,
  };
}
