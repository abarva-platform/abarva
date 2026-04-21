// Assembler · merges specialist outputs into a single composition bundle.
// Dedupe claims on fingerprint, rank by relevance × confidence × freshness,
// trim to 60K tokens (spec §3.2 Phase 4).

import type { ContradictionOutput } from './specialists/contradiction';
import type { DecisionOutput } from './specialists/decision';
import type { EvidenceClaim } from './specialists/evidence';
import type { ValueOutput } from './specialists/value';
import type { NexusMode, Source } from '@/lib/intelligence/types';

export interface CompositionBundle {
  mode: NexusMode;
  query: string;
  entities: string[];
  evidence: EvidenceClaim[];
  valueSignals: ValueOutput['signals'];
  valueHeadline: string | null;
  contradictions: ContradictionOutput['flags'];
  contradictionSelfCheck: ContradictionOutput['selfCheck'];
  decision: DecisionOutput;
  sources: Source[];
  contextTokenEstimate: number;
}

const MAX_TOKENS = 60_000;
const TOKENS_PER_CLAIM = 60; // rough estimate for budgeting

function claimFingerprint(c: EvidenceClaim): string {
  return `${c.source.id}::${c.text.slice(0, 120).toLowerCase()}`;
}

function claimScore(c: EvidenceClaim): number {
  const conf = c.confidence === 'high' ? 1 : c.confidence === 'medium' ? 0.6 : 0.3;
  const recency = c.source.asOf
    ? Math.max(0, 1 - (Date.now() - Date.parse(c.source.asOf)) / (365 * 86_400_000))
    : 0.5;
  const dim = c.dimension === 'emergent' ? 0.9 : c.dimension === 'graph' ? 0.8 : 0.7;
  return 0.5 * conf + 0.2 * recency + 0.3 * dim;
}

export function assemble(input: {
  mode: NexusMode;
  query: string;
  entities: string[];
  evidence: EvidenceClaim[];
  value: ValueOutput;
  contradiction: ContradictionOutput;
  decision: DecisionOutput;
}): CompositionBundle {
  // Dedupe
  const seen = new Set<string>();
  const deduped: EvidenceClaim[] = [];
  for (const c of input.evidence) {
    const fp = claimFingerprint(c);
    if (seen.has(fp)) continue;
    seen.add(fp);
    deduped.push(c);
  }

  // Rank
  const ranked = deduped
    .map((c) => ({ c, score: claimScore(c) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  // Trim
  const maxClaims = Math.floor(MAX_TOKENS / TOKENS_PER_CLAIM);
  const trimmed = ranked.slice(0, Math.min(maxClaims, 80));
  const contextTokenEstimate = trimmed.length * TOKENS_PER_CLAIM + 2000;

  const sources: Source[] = Array.from(new Map(trimmed.map((c) => [c.source.id, c.source])).values()).slice(0, 12);

  return {
    mode: input.mode,
    query: input.query,
    entities: input.entities,
    evidence: trimmed,
    valueSignals: input.value.signals,
    valueHeadline: input.value.headline,
    contradictions: input.contradiction.flags,
    contradictionSelfCheck: input.contradiction.selfCheck,
    decision: input.decision,
    sources,
    contextTokenEstimate,
  };
}
