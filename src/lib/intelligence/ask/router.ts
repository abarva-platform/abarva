import type { AskIntent, RetrievalResult } from './types';
import { retrieveVendor } from './retrievers/vendor';
import { retrievePattern } from './retrievers/pattern';
import { retrieveKnowledge } from './retrievers/knowledge';

export async function route(intent: AskIntent, entities: string[]): Promise<RetrievalResult> {
  if (intent === 'vendor_lookup' || intent === 'vendor_comparison') {
    const primary = await retrieveVendor(entities);
    if (primary.sources.length === 0) {
      // fall back to knowledge layer in case we've indexed vendor docs
      return retrieveKnowledge(entities, ['vendor_doc', 'vendor_posture'], 'VENDOR');
    }
    return primary;
  }

  if (intent === 'pattern_inquiry') {
    return retrievePattern(entities);
  }

  if (intent === 'regulation_query') {
    return retrieveKnowledge(entities, ['regulation', 'framework'], 'REGULATION');
  }

  if (intent === 'research_query') {
    return retrieveKnowledge(entities, ['research_report'], 'RESEARCH');
  }

  if (intent === 'benchmark_query') {
    return retrieveKnowledge(entities, ['benchmark'], 'BENCHMARK');
  }

  if (intent === 'topic_synthesis') {
    // Topics table from Pack L not yet populated; fall through to broad knowledge.
    return retrieveKnowledge(entities, null, 'TOPIC');
  }

  if (intent === 'insight_query') {
    // engagement_insights table from Pack E not yet populated.
    return { sources: [], averageConfidence: 0 };
  }

  // general_synthesis — union of vendor + pattern + knowledge
  const [v, p, k] = await Promise.all([
    retrieveVendor(entities),
    retrievePattern(entities),
    retrieveKnowledge(entities, null, 'GENERAL'),
  ]);
  const merged = [...v.sources, ...p.sources, ...k.sources].slice(0, 8);
  const avg = merged.length > 0 ? merged.reduce((s, x) => s + (x.confidence ?? 0), 0) / merged.length : 0;
  return { sources: merged, averageConfidence: avg };
}
