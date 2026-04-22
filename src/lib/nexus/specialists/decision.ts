// Decision specialist · frames tradeoffs + produces the CRUX box for
// Mode 2/3 turns. Produces a structured set of branches with condition
// language ("Pick X if...") that the composer can inline into the
// response payload.

import type { EvidenceClaim } from './evidence';
import type { NexusConfidence } from '@/lib/intelligence/types';

export interface DecisionBranch {
  verdict: string;
  condition: string;
  confidence: NexusConfidence;
}

export interface DecisionOutput {
  crux: string | null;
  branches: DecisionBranch[];
  tiebreaker: { question: string; resolver: string; effort: string } | null;
}

// Identify named options (e.g. "DAX vs Abridge") from the query or the
// entities list. Very shallow — the composer will improve phrasing.
function extractOptions(query: string, entities: string[]): string[] {
  const vs = query.match(/([A-Z][\w.-]+)\s+(?:vs|versus|or)\s+([A-Z][\w.-]+)/i);
  if (vs) return [vs[1], vs[2]];
  return entities.slice(0, 3);
}

export function runDecision(input: {
  query: string;
  entities: string[];
  claims: EvidenceClaim[];
}): DecisionOutput {
  const options = extractOptions(input.query, input.entities);
  if (options.length < 2) return { crux: null, branches: [], tiebreaker: null };

  const branches: DecisionBranch[] = options.map((opt, i) => ({
    verdict: `Pick ${opt}`,
    condition:
      i === 0
        ? `your primary constraint is the area ${opt} is strongest in (see sources)`
        : `your constraint is the area ${opt} differentiates on`,
    confidence: 'medium',
  }));

  const crux = `The fork is which constraint dominates — ${options.join(' vs ')}.`;

  const tiebreaker = {
    question: `Can you rank your top 3 constraints among: cost, speed of rollout, integration surface, vendor viability, change-management load?`,
    resolver: 'Sponsor + Maestro in a 30-min session',
    effort: '30-min alignment call',
  };

  return { crux, branches, tiebreaker };
}
