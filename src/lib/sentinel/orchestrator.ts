import { getAnthropicClient } from '@/lib/agent/stream';
import type {
  PatternApplicableProgram,
  PatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';
import {
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntriesWithMetrics,
  patternMatchesIndustry,
} from '@/lib/intelligence/pattern-manifest';
import type {
  SentinelCitation,
  SentinelConfidenceBand,
  SentinelQueryResponse,
} from '@/lib/sentinel/types';
import { AGENT_DEMO_SYSTEM_BLOCK } from '@/lib/agent/demo-context';

export interface SentinelTenancyCtx {
  clientKey: string;
  clientName: string;
  industryCode: string | null;
  userId: string | null;
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'what',
  'when',
  'where',
  'which',
  'will',
  'would',
  'could',
  'should',
  'into',
  'about',
  'there',
  'their',
  'have',
  'has',
  'your',
  'tenant',
  'plain',
  'english',
  'stop',
  'structured',
  'output',
  'need',
  'just',
  'show',
  'tell',
  'does',
  'than',
  'them',
]);

interface RankedPattern {
  pattern: PatternManifestEntry;
  score: number;
  applicablePrograms: PatternApplicableProgram[];
}

function confidenceBand(floor: number | null): SentinelConfidenceBand {
  if (floor === null) return 'medium';
  if (floor >= 0.75) return 'high';
  if (floor >= 0.5) return 'medium';
  return 'thin';
}

function formatFreshness(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const days = Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return '1d';
  if (days < 30) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function scorePattern(pattern: PatternManifestEntry, message: string, anchorSlug: string | null): number {
  const normalized = message.toLowerCase();
  const haystacks = [
    pattern.name,
    pattern.slug,
    pattern.category ?? '',
    pattern.shortDescription ?? '',
    pattern.longDescription ?? '',
    pattern.triggerSymptoms.join(' '),
    pattern.detectionSignals.join(' '),
    pattern.diagnosticQuestions.join(' '),
    pattern.interventions.join(' '),
    pattern.observations.join(' '),
    pattern.sections.map((section) => `${section.title} ${section.body}`).join(' '),
  ].map((value) => value.toLowerCase());

  let score = pattern.demoCritical ? 2 : 0;
  if (anchorSlug && pattern.slug === anchorSlug) score += 100;
  if (normalized.includes(pattern.slug.toLowerCase()) || normalized.includes(pattern.name.toLowerCase())) {
    score += 36;
  }

  for (const token of tokenize(message)) {
    if (haystacks.some((haystack) => haystack.includes(token))) score += 8;
  }

  if (/(evidence|citation|source|proof|fresh|updated)/i.test(message)) score += pattern.evidenceCount > 0 ? 12 : -8;
  if (/(vendor|tool|overlap|stack|platform)/i.test(message)) {
    const vendorSection = pattern.sections.find((section) => /vendor|landscape|capability/i.test(section.title));
    if (vendorSection) score += 14;
  }
  if (/(risk|biggest|why|pressure|block|contradiction)/i.test(message) && pattern.triggerSymptoms.length > 0) {
    score += 10;
  }
  if (/(apply|relevant|fit|ambient|clinical|workflow|board|counterfactual)/i.test(message) && pattern.diagnosticQuestions.length > 0) {
    score += 10;
  }

  return score;
}

function buildCitation(pattern: PatternManifestEntry, applicablePrograms: PatternApplicableProgram[], tenantKey: string): SentinelCitation {
  const deliverableCount = applicablePrograms.reduce((sum, program) => sum + program.deliverables.length, 0);
  return {
    slug: pattern.slug,
    label: pattern.name,
    href: `/tenant/${encodeURIComponent(tenantKey)}/intelligence/patterns/${encodeURIComponent(pattern.slug)}`,
    evidenceCount: pattern.evidenceCount,
    observationCount: pattern.observationCount || pattern.observations.length,
    deliverableCount,
    freshnessLabel: formatFreshness(pattern.lastUpdatedAt),
  };
}

function buildFallbackResponse(args: {
  message: string;
  rankedPatterns: RankedPattern[];
  activeClientName: string;
}): { text: string; confidence: SentinelConfidenceBand } {
  const [primary, secondary] = args.rankedPatterns;
  if (!primary) {
    return {
      text: `I don't have a strong pattern match for ${args.activeClientName} yet. Honest answer: evidence is thin until a pattern is anchored, so I would start with the library and pick the closest operating symptom rather than fabricate certainty.`,
      confidence: 'thin',
    };
  }

  const band = confidenceBand(primary.pattern.confidenceFloor);
  const leadingSignal = primary.pattern.detectionSignals[0] ?? primary.pattern.triggerSymptoms[0] ?? 'the lead operating signal';
  const firstQuestion = primary.pattern.diagnosticQuestions[0] ?? 'the first unresolved diagnostic question';

  if (/(evidence|citation|source|proof|fresh|updated)/i.test(args.message)) {
    const freshness = formatFreshness(primary.pattern.lastUpdatedAt);
    const secondLine = secondary
      ? `If you want a comparator, ${secondary.pattern.name} is the next closest pattern at ${secondary.pattern.evidenceCount} sources and ${secondary.pattern.observationCount || secondary.pattern.observations.length} observations.`
      : `These sources are authored from industry knowledge and composite observations, not measured customer outcomes.`;
    return {
      text: `${primary.pattern.name} is the strongest evidence-backed match I have for ${args.activeClientName}: ${primary.pattern.evidenceCount} sources, ${primary.pattern.observationCount || primary.pattern.observations.length} composite observations, updated ${freshness}. ${secondLine}`,
      confidence: band,
    };
  }

  if (/(risk|biggest|why|pressure|block|counterfactual|plain english)/i.test(args.message)) {
    const secondSentence = secondary
      ? `The second pattern I would keep open is ${secondary.pattern.name}, because it compounds the same operating pressure from a different angle.`
      : `I would not call this measured outcome evidence yet — it's a pattern-authored diagnostic hypothesis.`;
    return {
      text: `Plain English: the load-bearing risk is ${leadingSignal.toLowerCase()}. ${primary.pattern.name} is the pattern that explains it best, and the first question I'd force into the room is "${firstQuestion}". ${secondSentence}`,
      confidence: band,
    };
  }

  if (/(apply|relevant|which pattern|patterns|ambient|clinical|workflow|board)/i.test(args.message)) {
    const secondSentence = secondary
      ? `${secondary.pattern.name} is the next pattern on the stack, especially if the issue is spreading beyond one workflow or owner group.`
      : `I would stay anchored on this one pattern until the first deliverable or evidence chain proves a second is really in play.`;
    return {
      text: `For ${args.activeClientName}, I would start with ${primary.pattern.name}. The anchor signal is ${leadingSignal.toLowerCase()}, and the right next step is to test it against "${firstQuestion}". ${secondSentence}`,
      confidence: band,
    };
  }

  const secondSentence = secondary
    ? `The adjacent pattern worth checking next is ${secondary.pattern.name}.`
    : `If the evidence chain stays sparse, I will say that directly instead of overselling confidence.`;
  return {
    text: `${primary.pattern.name} is my best match for this question. It is grounded in ${primary.pattern.evidenceCount} sources and ${primary.pattern.observationCount || primary.pattern.observations.length} composite observations, but I would still anchor the answer on ${leadingSignal.toLowerCase()} and pressure-test it with "${firstQuestion}". ${secondSentence}`,
    confidence: band,
  };
}

async function synthesizeWithClaude(args: {
  message: string;
  ctx: SentinelTenancyCtx;
  rankedPatterns: RankedPattern[];
}): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || args.rankedPatterns.length === 0) return null;

  const client = getAnthropicClient();
  const context = args.rankedPatterns.map(({ pattern, applicablePrograms }) => ({
    name: pattern.name,
    slug: pattern.slug,
    category: pattern.category,
    shortDescription: pattern.shortDescription,
    evidenceCount: pattern.evidenceCount,
    observationCount: pattern.observationCount || pattern.observations.length,
    confidenceBand: confidenceBand(pattern.confidenceFloor),
    lastUpdatedAt: pattern.lastUpdatedAt,
    triggerSymptoms: pattern.triggerSymptoms.slice(0, 4),
    detectionSignals: pattern.detectionSignals.slice(0, 4),
    diagnosticQuestions: pattern.diagnosticQuestions.slice(0, 4),
    interventions: pattern.interventions.slice(0, 4),
    applicablePrograms: applicablePrograms.map((program) => ({
      name: program.name,
      currentPhaseSpec: program.currentPhaseSpec,
      deliverableCount: program.deliverables.length,
    })),
  }));

  const result = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 420,
    system: [
      'You are Sentinel, the AbarVa intelligence librarian.',
      'Your role: validate, curate, and advise on AI patterns in the Intelligence library.',
      'Use only the provided context. Do not invent evidence.',
      'Name the most relevant pattern or patterns explicitly — use the T-code IDs (T3-H01, T3-H03, etc.) from the demo context when relevant.',
      'Say when evidence is thin or authored from industry knowledge rather than measured customer outcomes.',
      'Write in plain English. No bullet lists. Two short paragraphs max.',
      AGENT_DEMO_SYSTEM_BLOCK,
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                tenant: args.ctx.clientName,
                question: args.message,
                retrievedPatterns: context,
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  });

  const response = result.content
    .filter((item) => item.type === 'text')
    .map((item) => item.text)
    .join('\n')
    .trim();

  return response || null;
}

export async function runSentinelTurn(args: {
  ctx: SentinelTenancyCtx;
  message: string;
  activePatternSlug?: string | null;
}): Promise<SentinelQueryResponse> {
  const patterns = getPatternManifestEntriesWithMetrics(args.ctx.clientKey)
    .filter((pattern) => patternMatchesIndustry(pattern, args.ctx.industryCode));
  const anchorSlug = args.activePatternSlug ?? null;

  const rankedPatterns = patterns
    .map((pattern) => ({
      pattern,
      score: scorePattern(pattern, args.message, anchorSlug),
      applicablePrograms: getPatternApplicableProgramsForTenant(pattern.slug, args.ctx.clientKey),
    }))
    .filter((entry) => entry.score > 0 || entry.pattern.slug === anchorSlug)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const citations = rankedPatterns.map(({ pattern, applicablePrograms }) =>
    buildCitation(pattern, applicablePrograms, args.ctx.clientKey),
  );
  const fallback = buildFallbackResponse({
    message: args.message,
    rankedPatterns,
    activeClientName: args.ctx.clientName,
  });

  const llmText = await synthesizeWithClaude({
    message: args.message,
    ctx: args.ctx,
    rankedPatterns,
  }).catch(() => null);

  return {
    response: llmText ?? fallback.text,
    routeType: llmText ? 'llm' : 'manifest_fallback',
    confidence: fallback.confidence,
    citations,
    suggestions: rankedPatterns
      .slice(0, 2)
      .map(({ pattern }) => `Open ${pattern.name}`),
    activePatternSlug: rankedPatterns[0]?.pattern.slug ?? anchorSlug,
  };
}
