// Contradiction specialist · detects conflicts across sources and across
// conversation turns. Two modes:
//   1 · cross-source · pick 2 claims that disagree on same metric/entity
//   2 · cross-turn · compare current turn against prior turn summaries
//
// Returns structured flags the assembler can surface inline (Cap 5
// auto-contradiction self-check).

import type { NexusTurnData } from '@/lib/intelligence/types';
import type { EvidenceClaim } from './evidence';

export interface ContradictionFlag {
  kind: 'cross_source' | 'cross_turn' | 'material';
  headline: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  claims?: Array<{ text: string; source: string }>;
}

export interface ContradictionOutput {
  flags: ContradictionFlag[];
  selfCheck: {
    priorTurnId: string;
    priorSummary: string;
    currentDeparture: string;
    reconciliationPaths: string[];
  } | null;
}

// Cheap cross-source · same entity, conflicting numbers
function crossSource(claims: EvidenceClaim[]): ContradictionFlag[] {
  const numberMap = new Map<string, Array<{ text: string; source: string; n: number }>>();
  for (const c of claims) {
    const m = c.text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[^$%\d]*(\$?\d[\d.]*[%MBk]?)/);
    if (m) {
      const entity = m[1];
      const val = m[2];
      const num = parseFloat(val.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(num)) continue;
      const existing = numberMap.get(entity) ?? [];
      existing.push({ text: c.text, source: c.source.name, n: num });
      numberMap.set(entity, existing);
    }
  }
  const flags: ContradictionFlag[] = [];
  for (const [entity, rows] of numberMap) {
    if (rows.length < 2) continue;
    const min = Math.min(...rows.map((r) => r.n));
    const max = Math.max(...rows.map((r) => r.n));
    if (max / Math.max(min, 1e-9) > 1.15) {
      flags.push({
        kind: 'cross_source',
        headline: `${entity} figures disagree across sources (${min} … ${max})`,
        detail: rows.slice(0, 2).map((r) => `${r.source}: ${r.n}`).join(' vs '),
        severity: max / Math.max(min, 1e-9) > 1.5 ? 'high' : 'medium',
        claims: rows.slice(0, 3).map((r) => ({ text: r.text, source: r.source })),
      });
    }
  }
  return flags.slice(0, 3);
}

// Cross-turn · naive string similarity with prior decision claims
function crossTurn(query: string, priorTurns: NexusTurnData[]): ContradictionOutput['selfCheck'] {
  const decisionTurn = priorTurns
    .filter((t) => t.mode === 'grounded' || t.mode === 'pivot')
    .slice(-1)[0];
  if (!decisionTurn) return null;

  const priorKeywords = decisionTurn.payload.hero ?? decisionTurn.payload.framing ?? decisionTurn.payload.answer ?? '';
  const overlap = countOverlap(query, priorKeywords);
  const contradictsVocab = /\b(actually|but|wait|instead|different|change|add|include|pathology|surgery|ED)\b/i.test(query);
  if (overlap < 0.1 && !contradictsVocab) return null;
  if (overlap > 0.4) return null; // too similar · not a departure

  return {
    priorTurnId: decisionTurn.id,
    priorSummary: priorKeywords.slice(0, 160),
    currentDeparture: 'Current turn adds scope or changes a prior assumption',
    reconciliationPaths: [
      'Treat the prior decision as stable and layer the new scope on top',
      'Reopen the prior decision with the expanded scope',
      'Split into two separate programs',
    ],
  };
}

function countOverlap(a: string, b: string): number {
  const tokens = (s: string) => new Set(s.toLowerCase().split(/\W+/).filter((t) => t.length > 3));
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / Math.min(ta.size, tb.size);
}

export function runContradiction(input: {
  query: string;
  claims: EvidenceClaim[];
  priorTurns: NexusTurnData[];
}): ContradictionOutput {
  return {
    flags: crossSource(input.claims),
    selfCheck: crossTurn(input.query, input.priorTurns),
  };
}
