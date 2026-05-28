import { searchCorpus } from '@/lib/corpus/retrieval';
import type { CorpusSearchHit } from '@/lib/corpus/types';
import { callSentinelModel } from './model';
import type { SentinelCitation, SentinelIntentClassification } from './types';

// Terms that strongly indicate the question belongs to the Sentinel six-stage
// IT-productivity reasoning workflow. Keep this list narrow: generic words like
// "initiative", "kill list", "application portfolio" matched too broadly during
// the 2026-05-25 Meridian stress test and caused Q3/Q4/Q5 to all collapse to
// identical canned-template responses scored 10/10. Tenant-specific tokens
// (Apex SAP/AS-400/Punchh/Wipro) were also removed — they do not belong in a
// generic classifier and a tenant-tagged term should never tip routing.
const IT_PRODUCTIVITY_TERMS = [
  'it productivity',
  'developer productivity',
  'engineering productivity',
  'ai productivity',
  'github copilot',
  'devex',
  'application rationalization',
  'run grow transform',
  'time matrix',
  'ai fit score',
  'application managed services',
  'platform team',
  'tooling governance',
  'sibling move',
  'integration topology',
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
  // Deterministic gate tightened 2026-05-25 after Meridian stress test.
  // Previously: `keywordConfidence > 0.25 || semanticConfidence > 0` and the
  // final routing OR'd model with deterministic — meaning a single keyword
  // OR a single corpus hit OR an over-eager model would all push the question
  // into the six-stage IT-productivity workflow, producing identical
  // canned-template answers for Q3/Q4/Q5. Two changes:
  // (1) tightened the IT_PRODUCTIVITY_TERMS list (above) to drop generic
  //     tokens ('initiative', 'kill list', 'application portfolio') and
  //     tenant-specific Apex tokens that don't belong in a generic classifier;
  // (2) require BOTH model AND deterministic agreement (not OR) before
  //     routing into the six-stage workflow.
  const deterministicIntent = keywordConfidence > 0 || semanticConfidence > 0
    ? 'it_productivity'
    : 'general';

  const finalIntent: 'it_productivity' | 'general' =
    modelIntent === 'it_productivity' && deterministicIntent === 'it_productivity'
      ? 'it_productivity'
      : 'general';

  return {
    intent: finalIntent,
    confidence,
    entities: extractEntities(query),
    matchedPatternSlugs: corpusHits.map((hit) => hit.slug),
    citations: corpusHits.slice(0, 5).map(corpusCitation),
    reason: parsed.reason ?? (model.denied ? 'Deterministic classifier used after AI egress denial.' : 'Classifier completed.'),
  };
}
