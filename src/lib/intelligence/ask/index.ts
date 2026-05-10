import { classifyIntent } from './classifier';
import { route } from './router';
import { synthesizeStream } from './synthesizer';
import { generateFollowups } from './followups';
import { retrieveWorldview } from './retrievers/worldview';
import { retrieveSurfaceContextSources } from './retrievers/surface-context';
import { retrieveTenantTechnologySources } from '@/lib/knowledge/tenant-technology-context';
import type { AskSource, IntentClassification, AskSurfaceContext } from './types';
import {
  buildCurrentStateAdvisory,
  chunkAskText,
  isBroadCurrentStateQuestion,
  sanitizeAskSynthesis,
} from './response-policy';

export type { AskIntent, AskSource, AskSurfaceContext, IntentClassification } from './types';

export interface AskEvent {
  type: 'classified' | 'sources' | 'delta' | 'followups' | 'done' | 'error';
  classification?: IntentClassification;
  sources?: AskSource[];
  text?: string;
  followups?: string[];
  error?: string;
}

export interface AskOptions {
  userContextBlock?: string;
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
}

export function atlasStakeholderConflictHandoff(query: string): string | null {
  const normalized = query.toLowerCase();
  const asksForAdvice = /\b(what should i do|what do i do|how should i handle|give me.*playbook|resolution path)\b/.test(normalized);
  const namesConflict =
    /\b(cmo|cfo|stakeholder|executive|sponsor)\b/.test(normalized) &&
    /\b(conflict|contradiction|tension|misalignment|vs|versus)\b/.test(normalized);
  if (!asksForAdvice || !namesConflict) return null;

  return [
    'Atlas should own that call. I can surface the contradiction and evidence, but Sentinel should not prescribe the political resolution.',
    'Handoff to Atlas: map the growth thesis, cost-takeout posture, affected programs, and decision owner; then return options with tradeoffs.',
    'Which program is the conflict surfacing in?',
  ].join(' ');
}

// INT-VOICE.STRAT-2026-05-10 · Canned-refusal short-circuit removed.
//
// Previously this file short-circuited with retrieval-mechanics framings like
// "We don't have indexed data that answers that directly" / "That topic isn't
// yet synthesized in the knowledge layer" whenever the retriever returned zero
// sources, AND prefixed every low-confidence answer with "Limited indexed data
// — confidence is moderate." Both behaviours bypassed the synthesizer's
// senior-advisor prompt and produced exactly the over-refusal Carlos / Apex
// flagged in the 2026-05-10 audit.
//
// Doctrine now: ~80% of strategic questions will not hit the corpus directly.
// In that case, Sentinel must take the tenant context block + broad domain
// expertise and answer like a senior AI strategy advisor. Honesty is reserved
// for tenant-specific quantitative claims (KPI values, exact vendor figures,
// quantified business cases) — and the model handles that itself, in one
// short, natural caveat at the end.

export async function* askIntelligence(query: string, opts: AskOptions = {}): AsyncGenerator<AskEvent> {
  const trimmed = query.trim();
  if (!trimmed) {
    yield { type: 'error', error: 'empty query' };
    return;
  }

  try {
    const classification = await classifyIntent(trimmed);
    yield { type: 'classified', classification };

    const surfaceContext = retrieveSurfaceContextSources(opts.surfaceContext, trimmed);
    const [tenantTechnology, routed, worldview] = await Promise.all([
      retrieveTenantTechnologySources(opts.tenantInventoryKey, trimmed),
      route(classification.intent, classification.entities),
      retrieveWorldview(trimmed),
    ]);
    const sources: AskSource[] = [
      ...surfaceContext,
      ...tenantTechnology,
      ...routed.sources,
      ...worldview.sources,
    ].slice(0, 16);
    const averageConfidence = sources.length > 0
      ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
      : 0;
    yield { type: 'sources', sources };

    const handoff = atlasStakeholderConflictHandoff(trimmed);
    if (handoff) {
      for (const chunk of chunkAskText(sanitizeAskSynthesis(handoff, 140))) {
        yield { type: 'delta', text: chunk.trimEnd() };
      }
      yield { type: 'followups', followups: ['Ask Atlas to map the contradiction', 'Show the evidence behind this tension'] };
      yield { type: 'done' };
      return;
    }

    if (isBroadCurrentStateQuestion(trimmed)) {
      const advisory = buildCurrentStateAdvisory(sources);
      if (advisory) {
        for (const chunk of chunkAskText(sanitizeAskSynthesis(advisory, 170))) {
          yield { type: 'delta', text: chunk };
        }
        yield {
          type: 'followups',
          followups: ['Give me the CFO value lens', 'Give me the CIO delivery lens', 'Pressure-test the CMO growth lens'],
        };
        yield { type: 'done' };
        return;
      }
    }

    let answer = '';
    for await (const delta of synthesizeStream({
      query: trimmed,
      sources,
      intent: classification.intent,
      userContextBlock: opts.userContextBlock,
      averageConfidence,
    })) {
      const cleanDelta = sanitizeAskSynthesis(delta, 500);
      answer += cleanDelta;
      yield { type: 'delta', text: cleanDelta };
    }

    const followups = await generateFollowups({
      query: trimmed,
      answer,
      entities: classification.entities,
    });
    yield { type: 'followups', followups };
    yield { type: 'done' };
  } catch (err) {
    yield { type: 'error', error: err instanceof Error ? err.message : 'unknown' };
  }
}
