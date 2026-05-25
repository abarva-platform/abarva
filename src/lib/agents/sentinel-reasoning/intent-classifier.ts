import { searchCorpus } from '@/lib/corpus/retrieval';
import type { CorpusSearchHit } from '@/lib/corpus/types';
import { callSentinelModel } from './model';
import type { SentinelCitation, SentinelIntentClassification } from './types';

const IT_PRODUCTIVITY_TERMS = [
  'it productivity',
  'developer productivity',
  'engineering productivity',
  'ai productivity',
  'copilot',
  'dora',
  'devex',
  'application portfolio',
  'application rationalization',
  'run grow transform',
  'time matrix',
  'ai fit',
  'ams',
  'operating model',
  'tom',
  'platform team',
  'tooling governance',
  'sibling move',
  'initiative',
  'initiatives',
  'kill list',
  'kill candidate',
  'what blocks',
  'as-400',
  'as400',
  'application portfolio',
  'integration topology',
  'mainframe modernization',
  'loyalty replacement',
  'punchh',
  'wipro ams',
];

function corpusCitation(hit: CorpusSearchHit): SentinelCitation {
  return {
    id: hit.slug,
    label: hit.title,
    sourceType: 'corpus_pattern',
    version: hit.version,
    url: `/intelligence/${encodeURIComponent(hit.slug)}`,
    detail: `category=${hit.category}; source=${hit.source}`,
  };
}

function extractEntities(query: string): string[] {
  const capitalized = Array.from(query.matchAll(/\b[A-Z][A-Za-z0-9&.-]{2,}(?:\s+[A-Z][A-Za-z0-9&.-]{2,})?/g))
    .map((match) => match[0]);
  const acronyms = Array.from(query.matchAll(/\b(?:DORA|TOM|AI|AMS|CTO|CIO|CFO|DevEx)\b/g)).map((match) => match[0]);
  return Array.from(new Set([...capitalized, ...acronyms])).slice(0, 8);
}

function keywordScore(query: string): number {
  const normalized = query.toLowerCase();
  const hits = IT_PRODUCTIVITY_TERMS.filter((term) => normalized.includes(term));
  return Math.min(1, hits.length / 3);
}

export async function classifySentinelIntent(args: {
  query: string;
  clientId: string;
  userId?: string | null;
}): Promise<SentinelIntentClassification> {
  const query = args.query.trim();
  const keywordConfidence = keywordScore(query);
  let corpusHits: CorpusSearchHit[] = [];
  try {
    corpusHits = await searchCorpus(query, {
      clientId: args.clientId,
      userId: args.userId ?? undefined,
      category: 'it-productivity',
      minDepthScore: 8,
      limit: 5,
    });
  } catch {
    corpusHits = [];
  }

  const semanticConfidence = Math.min(1, corpusHits.length / 3);
  const fallback = JSON.stringify({
    intent: keywordConfidence > 0 || semanticConfidence > 0 ? 'it_productivity' : 'general',
    confidence: Math.round(Math.max(keywordConfidence, semanticConfidence, 0.35) * 100),
    reason: corpusHits.length > 0
      ? 'Matched published it-productivity corpus patterns.'
      : keywordConfidence > 0
        ? 'Matched IT-productivity routing keywords.'
        : 'No IT-productivity routing evidence found.',
  });

  const model = await callSentinelModel({
    clientId: args.clientId,
    userId: args.userId,
    workflow: 'sentinel-intent',
    dataClass: 'internal',
    prompt: [
      'Classify whether this question should enter Sentinel six-stage IT-productivity reasoning.',
      'Return JSON only: {"intent":"it_productivity"|"general","confidence":0-100,"reason":"..."}',
      `Question: ${query}`,
      `Keyword score: ${keywordConfidence}`,
      `Matched it-productivity corpus slugs: ${corpusHits.map((hit) => `${hit.slug}@v${hit.version}`).join(', ') || 'none'}`,
    ].join('\n'),
    fallbackResponse: fallback,
    metadata: { corpusHitCount: corpusHits.length },
  });

  let parsed: { intent?: string; confidence?: number; reason?: string } = {};
  try {
    const match = model.text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) as typeof parsed : JSON.parse(model.text) as typeof parsed;
  } catch {
    parsed = {};
  }

  const confidence = typeof parsed.confidence === 'number'
    ? Math.max(0, Math.min(100, parsed.confidence))
    : Math.round(Math.max(keywordConfidence, semanticConfidence, 0.35) * 100);
  const modelIntent = parsed.intent === 'it_productivity' ? 'it_productivity' : 'general';
  const deterministicIntent = keywordConfidence > 0.25 || semanticConfidence > 0 ? 'it_productivity' : 'general';

  return {
    intent: modelIntent === 'it_productivity' || deterministicIntent === 'it_productivity'
      ? 'it_productivity'
      : 'general',
    confidence,
    entities: extractEntities(query),
    matchedPatternSlugs: corpusHits.map((hit) => hit.slug),
    citations: corpusHits.slice(0, 5).map(corpusCitation),
    reason: parsed.reason ?? (model.denied ? 'Deterministic classifier used after AI egress denial.' : 'Classifier completed.'),
  };
}
