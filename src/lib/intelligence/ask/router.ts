import type { AskIntent, AskSurfaceContext, RetrievalResult } from './types';
import { retrieveVendor } from './retrievers/vendor';
import { retrievePattern } from './retrievers/pattern';
import { retrieveKnowledge } from './retrievers/knowledge';
import { assertCoverage, classifyQuestionCategory } from '@/lib/knowledge/coverage';

export interface RouteOptions {
  query?: string;
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
}

export async function route(intent: AskIntent, entities: string[], opts: RouteOptions = {}): Promise<RetrievalResult> {
  const category = classifyQuestionCategory(opts.query ?? entities.join(' '), intent);
  const withCoverage = (result: RetrievalResult): RetrievalResult => ({
    ...result,
    coverageReport: assertCoverage(category, result.sources),
  });

  if (intent === 'vendor_lookup' || intent === 'vendor_comparison') {
    const primary = await retrieveVendor(entities);
    if (primary.sources.length === 0) {
      // fall back to knowledge layer in case we've indexed vendor docs
      return withCoverage(await retrieveKnowledge(entities, ['vendor_doc', 'vendor_posture'], 'VENDOR'));
    }
    return withCoverage(primary);
  }

  if (intent === 'pattern_inquiry') {
    return withCoverage(await retrievePattern(entities, opts));
  }

  if (intent === 'regulation_query') {
    return withCoverage(await retrieveKnowledge(entities, ['regulation', 'framework'], 'REGULATION'));
  }

  if (intent === 'research_query') {
    return withCoverage(await retrieveKnowledge(entities, ['research_report'], 'RESEARCH'));
  }

  if (intent === 'benchmark_query') {
    return withCoverage(await retrieveKnowledge(entities, ['benchmark'], 'BENCHMARK'));
  }

  if (intent === 'topic_synthesis') {
    // Topics table from Pack L not yet populated; fall through to broad knowledge.
    return withCoverage(await retrieveKnowledge(entities, null, 'TOPIC'));
  }

  if (intent === 'insight_query') {
    // engagement_insights table from Pack E not yet populated.
    return withCoverage({ sources: [], averageConfidence: 0 });
  }

  // general_synthesis — union of vendor + pattern + knowledge.
  // Keep the retrieval steps sequential so one Ask turn cannot fan out
  // across multiple session-mode Postgres clients at the same time.
  const v = await retrieveVendor(entities);
  const p = await retrievePattern(entities, opts);
  const k = await retrieveKnowledge(entities, null, 'GENERAL');
  const merged = [...v.sources, ...p.sources, ...k.sources].slice(0, 8);
  const avg = merged.length > 0 ? merged.reduce((s, x) => s + (x.confidence ?? 0), 0) / merged.length : 0;
  return withCoverage({ sources: merged, averageConfidence: avg });
}
