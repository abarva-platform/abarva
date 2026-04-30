import { classifyIntent } from './classifier';
import { route } from './router';
import { synthesizeStream } from './synthesizer';
import { generateFollowups } from './followups';
import { retrieveWorldview } from './retrievers/worldview';
import type { AskSource, IntentClassification, AskIntent } from './types';

export type { AskIntent, AskSource, IntentClassification } from './types';

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

function emptyStateMessage(intent: AskIntent): string {
  switch (intent) {
    case 'vendor_lookup':
      return "No vendor matches that name in the current index. The vendor graph populates as Pack J + Pack K portfolios land — try a capability or industry instead, or browse /platform → Vendors.";
    case 'vendor_comparison':
      return "We don't have indexed vendor data that matches that comparison. Vendor pricing + performance records populate as Pack K + Pack J portfolios land. For now, browse /platform → Vendors for the current vendor graph.";
    case 'pattern_inquiry':
      return "No matching Genome pattern is indexed yet. The library currently holds failure patterns across AI-program governance, vendor SLAs, data readiness, and change management — try one of those angles, or browse /library for the full list.";
    case 'topic_synthesis':
      return "That topic isn't yet synthesized in the knowledge layer. Pack L (topics + deliverables) is staged to fill this in the next slice — for now the Library has source-level material.";
    case 'research_query':
      return "No research match. The research index covers AI-program ROI benchmarks, data readiness, vendor SLAs, change management, and executive-mandate patterns — try one of those angles.";
    case 'regulation_query':
      return "No regulatory source indexed for that query. Regulation coverage is limited to healthcare (HIPAA/42 CFR Part 2), finserv (GLBA/CFPB/FINRA/SR 11-7), and retail (PCI DSS/state privacy) — try narrowing to a specific regime.";
    case 'benchmark_query':
      return "No benchmark matches. The benchmark library skews industry-wide (AI programs, cost-to-income, cloud adoption) — try broadening to a category or peer cohort.";
    case 'insight_query':
      return "No insight matches that query yet. Insights build up from engagement outcomes — the library grows as more Phase 2/4 gates close.";
    case 'general_synthesis':
    default:
      return "We don't have indexed data that answers that directly. Try narrowing to a specific vendor, pattern, client, or metric — or browse /library for what's currently indexed.";
  }
}

export async function* askIntelligence(query: string, opts: AskOptions = {}): AsyncGenerator<AskEvent> {
  const trimmed = query.trim();
  if (!trimmed) {
    yield { type: 'error', error: 'empty query' };
    return;
  }

  try {
    const classification = await classifyIntent(trimmed);
    yield { type: 'classified', classification };

    const [routed, worldview] = await Promise.all([
      route(classification.intent, classification.entities),
      retrieveWorldview(trimmed),
    ]);
    const sources = [...routed.sources, ...worldview.sources].slice(0, 10);
    const averageConfidence = sources.length > 0
      ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
      : 0;
    yield { type: 'sources', sources };

    const handoff = atlasStakeholderConflictHandoff(trimmed);
    if (handoff) {
      for (const chunk of handoff.match(/.{1,80}(?:\s|$)/g) ?? [handoff]) {
        yield { type: 'delta', text: chunk.trimEnd() };
      }
      yield { type: 'followups', followups: ['Ask Atlas to map the contradiction', 'Show the evidence behind this tension'] };
      yield { type: 'done' };
      return;
    }

    if (sources.length === 0) {
      const msg = emptyStateMessage(classification.intent);
      for (const chunk of msg.match(/.{1,40}/g) ?? []) yield { type: 'delta', text: chunk };
      yield { type: 'done' };
      return;
    }

    let answer = '';
    let confidencePrefixDone = false;
    for await (const delta of synthesizeStream({
      query: trimmed,
      sources,
      intent: classification.intent,
      userContextBlock: opts.userContextBlock,
    })) {
      if (!confidencePrefixDone && averageConfidence < 0.6) {
        const prefix = 'Limited indexed data — confidence is moderate. ';
        yield { type: 'delta', text: prefix };
        answer += prefix;
        confidencePrefixDone = true;
      }
      answer += delta;
      yield { type: 'delta', text: delta };
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
