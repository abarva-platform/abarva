import { getAuditedAnthropicClient } from '@/lib/agent/stream';
import type {
  PatternApplicableProgram,
  PatternManifestEntry,
} from '@/lib/intelligence/pattern-manifest';
import {
  getPatternApplicableProgramsForTenant,
  getPatternManifestEntriesWithMetrics,
  patternMatchesIndustry,
} from '@/lib/intelligence/pattern-manifest';
import { searchIndustryScopedCorpusPatternIndex } from '@/lib/intelligence/canonical/scoped-corpus-pattern-index';
import { answerSentinelPortfolioQuestion, classifySentinelPortfolioQuestion } from '@/lib/admin/broker/sentinel/portfolio-intents';
import type { CannibalizationFinding } from '@/lib/admin/broker/portfolio/cannibalization';
import type { PortfolioSequence } from '@/lib/admin/broker/portfolio/sequence-optimizer';
import { buildPortfolioSequenceView, type PortfolioSequenceViewModel } from '@/lib/tower/portfolio-sequence-view';
import {
  buildSentinelGroundingDisclosure,
  buildSentinelGroundingSummary,
  formatGroundingFlagText,
  normalizeCanonicalIndustry,
} from '@/lib/sentinel/canonical-grounding';
import type { SentinelPromptDefinition } from '@/lib/prompts/sentinel';
import { getActiveSentinelPrompt } from '@/lib/prompts/sentinel';
import type {
  SentinelCitation,
  SentinelConfidenceBand,
  SentinelQueryResponse,
} from '@/lib/sentinel/types';
import {
  AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
  sanitizeAutonomousDecisionLanguage,
} from '@/lib/ai-liability/human-decision-controls';
import { buildAgentGroundingDisclosure } from '@/lib/intelligence/canonical/agent-grounding-disclosure';

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

function normalizePortfolioClientKey(clientKey: string): string {
  if (clientKey === 'apex-retail') return 'apexretail';
  if (clientKey === 'meridian-health') return 'meridian';
  if (clientKey === 'skyharbor-air') return 'skyharbor';
  return clientKey;
}

function maybeAnswerPortfolioQuestion(args: {
  ctx: SentinelTenancyCtx;
  message: string;
}): SentinelQueryResponse | null {
  const intent = classifySentinelPortfolioQuestion(args.message);
  if (intent === 'unsupported') return null;

  const model = buildPortfolioSequenceView({
    clientKey: normalizePortfolioClientKey(args.ctx.clientKey),
    clientName: args.ctx.clientName,
  });
  if (model.dataBasis === 'empty' || model.quarters.length === 0) return null;

  const { sequence, programNames, cannibalizationFindings } = portfolioModelToSentinelInput(model);
  const answer = answerSentinelPortfolioQuestion({
    prompt: args.message,
    clientName: args.ctx.clientName,
    sequence,
    programNames,
    cannibalizationFindings,
  });
  const basis = model.dataBasis === 'program-instance-substrate'
    ? 'Basis: current program-instance substrate and Wave 4 portfolio sequence packet.'
    : 'Basis: signature planning fixture until this client has loaded program-instance substrate.';

  return {
    response: sanitizeAutonomousDecisionLanguage(`${answer.answer} ${basis}`),
    routeType: 'manifest_fallback',
    confidence: answer.confidence === 'high' ? 'high' : answer.confidence === 'medium' ? 'medium' : 'thin',
    citations: [{
      slug: 'portfolio-sequence-packet',
      label: `${args.ctx.clientName} portfolio sequence packet`,
      href: '/tower',
      evidenceCount: model.quarters.length,
      observationCount: model.scheduledMoves + model.blockedMoves + model.overlapFindings,
      deliverableCount: answer.citedMoves.length,
      freshnessLabel: 'today',
    }],
    suggestions: [
      'Open Tower portfolio sequence',
      ...(answer.citedMoves.length > 0 ? answer.citedMoves.map((move) => `Open ${move}`) : []),
    ].slice(0, 3),
    activePatternSlug: null,
    grounding: {
      source: 'canonical_pattern_index',
      status: 'ready',
      checkedPatternCount: 0,
      canonicalPatternIds: [],
      warnings: ['Portfolio sequencing answers are grounded in the Tower sequence packet, not the canonical pattern index.'],
      gaps: [],
    },
    groundingDisclosure: buildAgentGroundingDisclosure({
      source: null,
      status: 'not_requested',
      warnings: ['Portfolio sequencing answer used Tower sequence packet grounding.'],
    }),
  };
}

function portfolioModelToSentinelInput(model: PortfolioSequenceViewModel): {
  sequence: PortfolioSequence;
  programNames: Record<string, string>;
  cannibalizationFindings: CannibalizationFinding[];
} {
  const programNames: Record<string, string> = {};
  const totalValueRealizedByQuarter: Record<string, number> = {};

  for (const quarter of model.quarters) {
    for (const move of quarter.moves) programNames[move.name] = move.name;
    for (const move of quarter.blockedMoves) programNames[move.name] = move.name;
    totalValueRealizedByQuarter[quarter.quarterId] = parseUsdLabel(quarter.totalValueLabel);
  }

  const sequence: PortfolioSequence = {
    quarters: model.quarters.map((quarter) => ({
      quarterId: quarter.quarterId,
      moves: quarter.moves.map((move) => ({
        moveId: move.name,
        phase: move.phase,
        reasoning: move.reasoning,
      })),
      blockedMoves: quarter.blockedMoves.map((blocked) => ({
        moveId: blocked.name,
        blockedBy: blocked.blockedBy,
        recommendedAction: blocked.recommendedAction,
      })),
      resourceUtilization: Object.fromEntries(
        quarter.resourceUtilization.map((resource) => [resource.label, resource.percent / 100]),
      ),
    })),
    unmetDependencies: [],
    totalValueRealizedByQuarter,
    alternativeSequences: model.alternatives,
  };

  const cannibalizationFindings: CannibalizationFinding[] = model.overlaps.map((overlap) => ({
    moveA: overlap.moveA,
    moveB: overlap.moveB,
    overlapKpi: overlap.overlapKpi,
    overlapMagnitudeUsd: parseUsdLabel(overlap.overlapMagnitudeLabel),
    recommendation: overlap.recommendation.replace(/\s+/g, '_') as CannibalizationFinding['recommendation'],
    rationale: overlap.rationale,
  }));

  return { sequence, programNames, cannibalizationFindings };
}

function parseUsdLabel(label: string): number {
  const match = label.match(/\$([0-9.]+)\s*([KMB])?/i);
  if (!match) return 0;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return 0;
  const multiplier = match[2]?.toUpperCase() === 'B'
    ? 1_000_000_000
    : match[2]?.toUpperCase() === 'M'
      ? 1_000_000
      : match[2]?.toUpperCase() === 'K'
        ? 1_000
        : 1;
  return value * multiplier;
}

async function synthesizeWithClaude(args: {
  message: string;
  ctx: SentinelTenancyCtx;
  rankedPatterns: RankedPattern[];
  activePrompt: SentinelPromptDefinition;
}): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY || args.rankedPatterns.length === 0) return null;

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

  const userPayload = JSON.stringify(
    {
      tenant: args.ctx.clientName,
      question: args.message,
      retrievedPatterns: context,
    },
    null,
    2,
  );
  const system = [
    args.activePrompt.buildSystemPrompt(),
    AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
  ].join('\n\n');
  const { client } = await getAuditedAnthropicClient({
    tenantId: args.ctx.clientKey,
    userId: args.ctx.userId ?? undefined,
    workflow: 'sentinel-orchestrator',
    model: 'claude-sonnet-4-6',
    prompt: [system, userPayload].join('\n\n'),
    dataClass: 'confidential',
    metadata: {
      clientKey: args.ctx.clientKey,
      promptVersion: args.activePrompt.version,
    },
  });

  const result = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 420,
    system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPayload,
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
  canonicalPatternSearch?: typeof searchIndustryScopedCorpusPatternIndex;
}): Promise<SentinelQueryResponse> {
  const portfolioAnswer = maybeAnswerPortfolioQuestion({
    ctx: args.ctx,
    message: args.message,
  });
  if (portfolioAnswer) return portfolioAnswer;

  const patterns = getPatternManifestEntriesWithMetrics(args.ctx.clientKey)
    .filter((pattern) => patternMatchesIndustry(pattern, args.ctx.industryCode));
  const anchorSlug = args.activePatternSlug ?? null;
  const activePrompt = getActiveSentinelPrompt();

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
  const canonicalPatternSearch = args.canonicalPatternSearch ?? searchIndustryScopedCorpusPatternIndex;
  const canonicalResult = await canonicalPatternSearch({
    tenant_key: args.ctx.clientKey,
    industry: normalizeCanonicalIndustry(args.ctx.industryCode),
    query: rankedPatterns[0]?.pattern.name ?? args.message,
    limit: 3,
  }, {
    scope: {
      tenantKey: args.ctx.clientKey,
      activeClient: args.ctx.clientName,
      facts: [args.ctx.industryCode ?? ''],
    },
  });
  const grounding = buildSentinelGroundingSummary({
    canonicalResult,
    rankedPatterns,
    tenantKey: args.ctx.clientKey,
  });
  const groundingDisclosure = buildSentinelGroundingDisclosure(canonicalResult);
  const groundingFlagText = formatGroundingFlagText(grounding);

  const llmText = await synthesizeWithClaude({
    message: args.message,
    ctx: args.ctx,
    rankedPatterns,
    activePrompt,
  }).catch(() => null);
  const responseText = [sanitizeAutonomousDecisionLanguage(llmText ?? fallback.text), groundingFlagText]
    .filter(Boolean)
    .join(' ');

  return {
    response: responseText,
    routeType: llmText ? 'llm' : 'manifest_fallback',
    confidence: fallback.confidence,
    citations,
    suggestions: rankedPatterns
      .slice(0, 2)
      .map(({ pattern }) => `Open ${pattern.name}`),
    activePatternSlug: rankedPatterns[0]?.pattern.slug ?? anchorSlug,
    grounding,
    groundingDisclosure,
  };
}
