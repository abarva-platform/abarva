import { classifyIntent } from './classifier';
import { route } from './router';
import { synthesizeStream } from './synthesizer';
import { generateFollowups } from './followups';
import type { AskSource, IntentClassification } from './types';

export type { AskIntent, AskSource, IntentClassification } from './types';

export interface AskEvent {
  type: 'classified' | 'sources' | 'delta' | 'followups' | 'done' | 'error';
  classification?: IntentClassification;
  sources?: AskSource[];
  text?: string;
  followups?: string[];
  error?: string;
}

export async function* askIntelligence(query: string): AsyncGenerator<AskEvent> {
  const trimmed = query.trim();
  if (!trimmed) {
    yield { type: 'error', error: 'empty query' };
    return;
  }

  try {
    const classification = await classifyIntent(trimmed);
    yield { type: 'classified', classification };

    const { sources, averageConfidence } = await route(classification.intent, classification.entities);
    yield { type: 'sources', sources };

    if (sources.length === 0) {
      const msg = "We don't have indexed data on that yet. Try narrowing your question or browse the Library directly. Pack B ingestion + Pack L topics populate the knowledge layer over the coming days.";
      for (const chunk of msg.match(/.{1,40}/g) ?? []) yield { type: 'delta', text: chunk };
      yield { type: 'done' };
      return;
    }

    let answer = '';
    let confidencePrefixDone = false;
    for await (const delta of synthesizeStream({ query: trimmed, sources, intent: classification.intent })) {
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
