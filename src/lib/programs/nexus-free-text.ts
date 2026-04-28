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
import type { NexusConfidence, Source } from '@/lib/intelligence/types';
import type { ProgramContextBundle } from '@/lib/programs/nexus';
import { AGENT_DEMO_SYSTEM_BLOCK } from '@/lib/agent/demo-context';

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
  'program',
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
  'walk',
  'through',
  'main',
  'risk',
]);

export interface ProgramsNexusTenantCtx {
  clientKey: string;
  clientName: string;
  industryCode: string | null;
  userId: string | null;
}

export interface ProgramsNexusCitation {
  slug: string;
  label: string;
  href: string;
  evidenceCount: number;
  observationCount: number;
  deliverableCount: number;
  freshnessLabel: string;
  confidence: number;
  confidenceBand: NexusConfidence;
  matchReason: string;
}

export interface ProgramsNexusTurnResponse {
  response: string;
  routeType: 'llm' | 'manifest_fallback';
  confidence: NexusConfidence;
  sparseEvidence: boolean;
  citations: ProgramsNexusCitation[];
  sources: Source[];
  suggestions: string[];
  activePatternSlug: string | null;
}

interface RankedPattern {
  pattern: PatternManifestEntry;
  score: number;
  confidence: number;
  confidenceBand: NexusConfidence;
  applicablePrograms: PatternApplicableProgram[];
  matchReason: string;
}

function normalizePatternKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/^pattern[-_]/, '').replace(/_/g, '-');
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

function readStringList(value: unknown): string[] {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry === 'string') return entry.trim() ? [entry.trim()] : [];
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const body = typeof record.body === 'string' ? record.body.trim() : '';
    const text = [title, body].filter(Boolean).join(': ');
    return text ? [text] : [];
  });
}

function renderCitation(citation: ProgramsNexusCitation): string {
  return `[${citation.label}](${citation.href})`;
}

function programContextSource(context: ProgramContextBundle): Source {
  return {
    id: `program:${context.programId}`,
    type: 'engagement',
    name: context.program.name,
    detail: [
      context.program.currentPhase === null ? 'Phase unassigned' : `Phase ${context.program.currentPhase}`,
      `${context.deliverables.length} deliverables`,
      `${context.flags.length} open flags`,
    ].join(' · '),
    confidence: 'high',
  };
}

function buildSource(citation: ProgramsNexusCitation): Source {
  return {
    id: `pattern:${citation.slug}`,
    type: 'pattern',
    name: citation.label,
    detail: `${citation.evidenceCount} evidence sources · ${citation.observationCount} observations · ${citation.deliverableCount} tenant deliverables · ${citation.matchReason}`,
    confidence: citation.confidenceBand,
    url: citation.href,
    asOf: citation.freshnessLabel,
  };
}

function matchProgramByName(
  applicablePrograms: PatternApplicableProgram[],
  programName: string,
): boolean {
  const normalizedProgram = programName.trim().toLowerCase();
  return applicablePrograms.some((program) => program.name.trim().toLowerCase() === normalizedProgram);
}

function estimateConfidence(score: number, floor: number | null, anchored: boolean): number {
  const retrievalScore = Math.min(1, score / (anchored ? 95 : 70));
  const floorScore = floor ?? 0.55;
  return Math.max(0.22, Math.min(0.95, floorScore * 0.55 + retrievalScore * 0.45));
}

function confidenceBand(score: number): NexusConfidence {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

function buildCitation(
  ranked: RankedPattern,
): ProgramsNexusCitation {
  const deliverableCount = ranked.applicablePrograms.reduce(
    (sum, program) => sum + program.deliverables.length,
    0,
  );

  return {
    slug: ranked.pattern.slug,
    label: ranked.pattern.name,
    href: `/preview/intelligence/patterns/${encodeURIComponent(ranked.pattern.slug)}`,
    evidenceCount: ranked.pattern.evidenceCount,
    observationCount: ranked.pattern.observationCount || ranked.pattern.observations.length,
    deliverableCount,
    freshnessLabel: formatFreshness(ranked.pattern.lastUpdatedAt),
    confidence: ranked.confidence,
    confidenceBand: ranked.confidenceBand,
    matchReason: ranked.matchReason,
  };
}

function scorePattern(args: {
  pattern: PatternManifestEntry;
  message: string;
  context: ProgramContextBundle;
  clientKey: string;
  anchorKey: string | null;
}): RankedPattern {
  const normalizedMessage = args.message.toLowerCase();
  const queryTokens = tokenize(args.message);
  const applicablePrograms = getPatternApplicableProgramsForTenant(args.pattern.slug, args.clientKey);
  const hasProgramMatch = matchProgramByName(applicablePrograms, args.context.program.name);
  const patternAnchorKey = normalizePatternKey((args.context.patternPreload?.topic_key as string | undefined) ?? null);
  const isAnchored = args.anchorKey !== null && normalizePatternKey(args.pattern.slug) === args.anchorKey;
  const isPreloadedAnchor = patternAnchorKey !== null && normalizePatternKey(args.pattern.slug) === patternAnchorKey;

  const patternText = [
    args.pattern.name,
    args.pattern.slug,
    args.pattern.category ?? '',
    args.pattern.shortDescription ?? '',
    args.pattern.longDescription ?? '',
    args.pattern.triggerSymptoms.join(' '),
    args.pattern.detectionSignals.join(' '),
    args.pattern.diagnosticQuestions.join(' '),
    args.pattern.interventions.join(' '),
    args.pattern.observations.join(' '),
    args.pattern.sections.map((section) => `${section.title} ${section.body}`).join(' '),
  ]
    .join(' ')
    .toLowerCase();

  const preloadSignals = [
    ...readStringList(args.context.patternPreload?.failure_modes),
    ...readStringList(args.context.patternPreload?.diagnostic_questions),
    ...readStringList(args.context.patternPreload?.success_signals),
  ]
    .join(' ')
    .toLowerCase();

  const flagText = args.context.flags
    .map((flag) => `${flag.headline} ${flag.severity}`)
    .join(' ')
    .toLowerCase();

  const deliverableText = args.context.deliverables
    .map((deliverable) => `${deliverable.title} ${deliverable.typeKey} ${deliverable.status}`)
    .join(' ')
    .toLowerCase();

  let score = 0;
  let matchReason = 'semantic proximity to the current program ask';

  if (isAnchored || isPreloadedAnchor) {
    score += 48;
    matchReason = 'active program pattern anchor';
  }

  if (
    normalizedMessage.includes(args.pattern.slug.toLowerCase())
    || normalizedMessage.includes(args.pattern.name.toLowerCase())
  ) {
    score += 28;
    matchReason = 'pattern named directly in the user query';
  }

  for (const token of queryTokens) {
    if (patternText.includes(token)) score += 7;
    if (preloadSignals.includes(token)) score += 5;
    if (flagText.includes(token) && patternText.includes(token)) score += 6;
    if (deliverableText.includes(token) && patternText.includes(token)) score += 4;
  }

  if (/(assumption|assumptions|confidence|interval|derive|derivation|range|estimate|math)/i.test(args.message)) {
    score += args.pattern.evidenceCount > 0 ? 12 : -4;
  }

  if (/(risk|blocker|pressure|concern|stall|slip|contradiction|red flag|why)/i.test(args.message)) {
    score += args.pattern.triggerSymptoms.length > 0 ? 10 : 0;
  }

  if (/(next step|what should|move next|recommend|do now|how do we proceed|what now)/i.test(args.message)) {
    score += args.pattern.interventions.length > 0 ? 8 : 0;
  }

  if (args.context.flags.length > 0 && args.pattern.detectionSignals.length > 0) {
    score += 6;
  }

  if ((score > 0 || isAnchored || isPreloadedAnchor) && hasProgramMatch) {
    score += 12;
    matchReason = isAnchored || isPreloadedAnchor
      ? matchReason
      : 'tenant program precedent for this exact program family';
  } else if (score > 0 && applicablePrograms.length > 0) {
    score += 6;
  }

  if (score > 0 && args.pattern.demoCritical) {
    score += 3;
  }

  const confidence = estimateConfidence(
    score,
    args.pattern.confidenceFloor,
    isAnchored || isPreloadedAnchor,
  );

  return {
    pattern: args.pattern,
    score,
    confidence,
    confidenceBand: confidenceBand(confidence),
    applicablePrograms,
    matchReason,
  };
}

function buildSparseResponse(args: {
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
}): string {
  const primary = args.citations[0];
  const programPhase = args.context.program.currentPhase === null
    ? 'an unassigned phase'
    : `Phase ${args.context.program.currentPhase}`;

  if (!primary) {
    return [
      `Evidence is thin for this question inside ${args.context.program.name}. I can see the program is sitting in ${programPhase} with ${args.context.deliverables.length} deliverables and ${args.context.flags.length} open flags, but the current retrieval pass did not return a pattern I can cite honestly.`,
      `Next step: point me at the exact deliverable, estimate, or decision you want pressure-tested and I will stay explicit about what is evidence versus what is still an assumption.`,
    ].join('\n\n');
  }

  return [
    `Evidence is thin beyond ${renderCitation(primary)}. That pattern is the best available anchor for ${args.context.program.name}, but the live program context still looks lighter than a measured-outcomes case.`,
    `Next step: give me the specific assumption chain or deliverable you want to interrogate, and I will tell you what supports it versus what still needs proof.`,
  ].join('\n\n');
}

function buildFollowUps(
  citations: ProgramsNexusCitation[],
  query: string,
): string[] {
  const primary = citations[0];
  const secondary = citations[1];
  if (!primary) {
    return [
      'Show me the assumption stack you want pressure-tested first',
      'Point me at the deliverable or estimate behind this question',
    ];
  }

  if (/(assumption|assumptions|confidence|interval|range|estimate)/i.test(query)) {
    return [
      `Pressure-test the assumptions behind ${primary.label}`,
      `Show me what would change confidence on ${primary.label}`,
    ];
  }

  if (/(risk|blocker|pressure|concern|stall|slip|red flag)/i.test(query)) {
    return [
      `Show me the biggest failure mode inside ${primary.label}`,
      secondary ? `Compare ${primary.label} with ${secondary.label}` : `Show me the next-best pattern after ${primary.label}`,
    ];
  }

  return [
    `Tell me what to challenge next in ${primary.label}`,
    secondary ? `Open the adjacent pattern: ${secondary.label}` : `Show me the evidence behind ${primary.label}`,
  ];
}

function buildStructuredResponse(args: {
  message: string;
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
  sparseEvidence: boolean;
}): string {
  const [primary, secondary] = args.citations;
  if (!primary) return buildSparseResponse(args);

  const leadSignal =
    readStringList(args.context.patternPreload?.failure_modes)[0]
    ?? readStringList(args.context.patternPreload?.diagnostic_questions)[0]
    ?? 'the unresolved operating assumption stack';
  const diagnosticQuestion =
    readStringList(args.context.patternPreload?.diagnostic_questions)[0]
    ?? 'Which assumption, if wrong, would collapse the current plan fastest?';
  const nextPattern = secondary
    ? `${renderCitation(secondary)} is the adjacent pattern I would keep open if the problem spills beyond one workstream.`
    : 'I would stay anchored on the first pattern until the evidence forces a second explanation.';

  if (/(plain english|stop the structured output|just tell me|plainly)/i.test(args.message)) {
    return [
      `Plain English: I would anchor this on ${renderCitation(primary)}. The load-bearing issue is ${leadSignal.toLowerCase()}, and I would not pretend the current program context proves more than it does.`,
      `${args.sparseEvidence ? 'Evidence is thin beyond that anchor.' : `The evidence base behind that anchor is ${primary.evidenceCount} sources and ${primary.observationCount} observations.`} The next question that will move the answer most is "${diagnosticQuestion}"`,
    ].join('\n\n');
  }

  if (/(assumption|assumptions|confidence|interval|derive|derivation|range|estimate|math)/i.test(args.message)) {
    return [
      `1. Best anchor: ${renderCitation(primary)} is the closest pattern I can cite for ${args.context.program.name}. Confidence is ${primary.confidenceBand} because the live program context shows ${args.context.deliverables.length} deliverables and ${args.context.flags.length} open flags, but not a fully exposed derivation chain.`,
      `2. What underpins the range: the pattern says the pressure usually sits in ${leadSignal.toLowerCase()}. I have ${primary.evidenceCount} sources and ${primary.observationCount} observations behind that anchor, which is enough to frame the assumption stack but not enough to call it measured customer-outcome evidence.`,
      `3. What I would test next: answer "${diagnosticQuestion}" before treating the range as board-ready. ${nextPattern}`,
    ].join('\n\n');
  }

  if (/(risk|blocker|pressure|concern|stall|slip|contradiction|red flag|why)/i.test(args.message)) {
    return [
      `1. Load-bearing risk: ${renderCitation(primary)} is the pattern that best explains the pressure here. The first signal I would hold onto is ${leadSignal.toLowerCase()}.`,
      `2. What that means: ${args.sparseEvidence ? 'evidence is still thin, so I would treat this as a pressure-tested hypothesis, not settled fact.' : `this is grounded in ${primary.evidenceCount} sources and ${primary.observationCount} observations, but it is still authored/composite evidence rather than measured customer outcomes.`}`,
      `3. Next move: put "${diagnosticQuestion}" in front of the sponsor or workstream lead this turn. ${nextPattern}`,
    ].join('\n\n');
  }

  return [
    `1. Best anchor: ${renderCitation(primary)} is the most relevant pattern for this ask in ${args.context.program.name}.`,
    `2. What I would pressure-test: ${leadSignal}. ${args.sparseEvidence ? 'Evidence is thin beyond this anchor, so I would keep the claim directional.' : `The support behind it is ${primary.evidenceCount} sources and ${primary.observationCount} observations, still mostly authored/composite rather than measured outcomes.`}`,
    `3. Concrete next step: force an answer to "${diagnosticQuestion}" before you lock scope, funding, or delivery commitments. ${nextPattern}`,
  ].join('\n\n');
}

async function synthesizeWithClaude(args: {
  message: string;
  ctx: ProgramsNexusTenantCtx;
  context: ProgramContextBundle;
  citations: ProgramsNexusCitation[];
  sparseEvidence: boolean;
}): Promise<string | null> {
  if (
    process.env.NODE_ENV === 'test'
    || !process.env.ANTHROPIC_API_KEY
    || args.citations.length === 0
  ) {
    return null;
  }

  const client = getAnthropicClient();
  const result = await client.messages.create({
    model: process.env.NEXUS_COMPOSER_MODEL ?? 'claude-opus-4-7',
    max_tokens: 380,
    system: [
      'You are Nexus, the Programs-zone orchestration agent for the AbarVa platform.',
      'Use only the provided composition and context. Do not invent program state, evidence, or gate decisions.',
      'Stay direct, structured, and specific. Never flatter the user.',
      'Use the provided markdown citations verbatim.',
      'If sparseEvidence is true, say "Evidence is thin" in the first sentence.',
      'Be explicit that most support here is authored/composite unless the composition says otherwise.',
      'Close with one concrete next step.',
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
                program: args.context.program,
                modules: args.context.modules,
                deliverables: args.context.deliverables,
                flags: args.context.flags,
                sparseEvidence: args.sparseEvidence,
                question: args.message,
                citationRegistry: args.citations.map((citation) => ({
                  label: citation.label,
                  markdown: renderCitation(citation),
                  evidenceCount: citation.evidenceCount,
                  observationCount: citation.observationCount,
                  matchReason: citation.matchReason,
                })),
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

  if (!response) return null;
  const hasKnownCitation = args.citations.some(
    (citation) => response.includes(citation.href) || response.includes(citation.label),
  );
  return hasKnownCitation ? response : null;
}

export async function runProgramsNexusTurn(args: {
  ctx: ProgramsNexusTenantCtx;
  message: string;
  context: ProgramContextBundle;
}): Promise<ProgramsNexusTurnResponse> {
  const patterns = getPatternManifestEntriesWithMetrics(args.ctx.clientKey)
    .filter((pattern) => patternMatchesIndustry(pattern, args.ctx.industryCode));
  const anchorKey = normalizePatternKey((args.context.patternPreload?.topic_key as string | undefined) ?? null);

  const rankedPatterns = patterns
    .map((pattern) => scorePattern({
      pattern,
      message: args.message,
      context: args.context,
      clientKey: args.ctx.clientKey,
      anchorKey,
    }))
    .filter((entry) => entry.score > 0 || normalizePatternKey(entry.pattern.slug) === anchorKey)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const citations = rankedPatterns.map((entry) => buildCitation(entry));
  const confidentMatches = rankedPatterns.filter((entry) => entry.confidence >= 0.6);
  const sparseEvidence = confidentMatches.length < 3;
  const fallback = buildStructuredResponse({
    message: args.message,
    context: args.context,
    citations,
    sparseEvidence,
  });

  const llmText = await synthesizeWithClaude({
    message: args.message,
    ctx: args.ctx,
    context: args.context,
    citations,
    sparseEvidence,
  }).catch(() => null);

  const response = llmText ?? fallback;
  const routeType = llmText ? 'llm' : 'manifest_fallback';
  const confidence = citations[0]?.confidenceBand ?? 'low';
  const sources = [
    programContextSource(args.context),
    ...citations.map(buildSource),
  ];

  return {
    response,
    routeType,
    confidence,
    sparseEvidence,
    citations,
    sources,
    suggestions: buildFollowUps(citations, args.message),
    activePatternSlug: citations[0]?.slug ?? anchorKey,
  };
}
