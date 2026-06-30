import { classifyIntent } from './classifier';
import { route } from './router';
import { isExplicitConciseAsk, synthesizeStream } from './synthesizer';
import { generateFollowups } from './followups';
import { retrieveWorldview } from './retrievers/worldview';
import { retrieveSurfaceContextSources } from './retrievers/surface-context';
import { retrieveRetailOverlaySources } from './retrievers/retail-overlay';
import {
  retrieveTenantEnterpriseSources,
  retrieveTenantStructuredFacts,
} from '@/lib/knowledge/tenant-enterprise-context';
import { retrieveTenantTechnologySources } from '@/lib/knowledge/tenant-technology-context';
import {
  formatTenantFactAvailabilityBlock,
  getTenantFactFingerprint,
} from './tenant-fact-fingerprint';
import type { AskSource, IntentClassification, AskSurfaceContext } from './types';
import type { CanonicalTenant } from '@/lib/tenant/CanonicalTenant';
import {
  assertCoverage,
  classifyQuestionCategory,
  type CoverageReport,
} from '@/lib/knowledge/coverage';
import { formatCoverageReportForPrompt } from '@/lib/knowledge/coverageReport';
import {
  isBroadCurrentStateQuestion,
} from './response-policy';
import type { AnswerTraceEnvelope } from '@/lib/debug/answer-trace';
import {
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
} from './skyharbor-cto-readiness-source';

export type { AskIntent, AskSource, AskSurfaceContext, IntentClassification } from './types';

export interface AskEvent {
  type: 'classified' | 'sources' | 'trace' | 'delta' | 'followups' | 'done' | 'error';
  classification?: IntentClassification;
  sources?: AskSource[];
  coverageReport?: CoverageReport;
  trace?: AnswerTraceEnvelope;
  text?: string;
  followups?: string[];
  error?: string;
}

export interface AskOptions {
  userContextBlock?: string;
  conversationContextBlock?: string;
  tenantId?: string | null;
  tenantClientKey?: string | null;
  tenant?: CanonicalTenant | null;
  userId?: string | null;
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
  activePersonGraphNodeId?: string | null;
  activePersonDisplayName?: string | null;
  traceEnabled?: boolean;
  traceSession?: {
    user?: AnswerTraceEnvelope['session']['user'];
    tenant?: unknown;
    question?: string | null;
  };
}

function compactSourceDetailsForConciseAsk(sources: AskSource[]): AskSource[] {
  return sources.map((source) => {
    if (source.detail.length <= 900) return source;
    return {
      ...source,
      detail: `${source.detail.slice(0, 900).trimEnd()}\n[truncated for concise Ask response]`,
    };
  });
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
    const classification = await classifyIntent(trimmed, {
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    yield { type: 'classified', classification };
    const questionCategory = classifyQuestionCategory(trimmed, classification.intent);

    const surfaceContext = retrieveSurfaceContextSources(opts.surfaceContext, trimmed);
    // Keep DB-backed retrieval sequential to avoid exhausting session-mode pools under Ask verifier load.
    const tenantEnterprise = await retrieveTenantEnterpriseSources(opts.tenant ?? opts.tenantInventoryKey, trimmed, {
      activePersonGraphNodeId: opts.activePersonGraphNodeId,
      activePersonDisplayName: opts.activePersonDisplayName,
      userContextBlock: opts.userContextBlock,
    });
    const tenantStructuredFacts = await retrieveTenantStructuredFacts(opts.tenant ?? opts.tenantInventoryKey, trimmed);
    const tenantTechnology = await retrieveTenantTechnologySources(opts.tenantInventoryKey, trimmed);
    const retailOverlay = await retrieveRetailOverlaySources(opts.tenant, trimmed, questionCategory);
    const routed = await route(classification.intent, classification.entities, {
      query: trimmed,
      tenantInventoryKey: opts.tenantInventoryKey,
      surfaceContext: opts.surfaceContext,
    });
    const worldview = await retrieveWorldview(trimmed, 3, { tenantId: opts.tenantId, userId: opts.userId });
    const factFingerprint = await getTenantFactFingerprint({
      tenantId: opts.tenantId,
      tenantInventoryKey: opts.tenantInventoryKey,
    });
    const factAvailabilityBlock = formatTenantFactAvailabilityBlock(factFingerprint);
    const skyHarborCtoSource = buildSkyHarborCtoReadinessSource(trimmed, [
      opts.tenantClientKey,
      opts.tenantInventoryKey,
      opts.tenant?.appClientKey,
      opts.tenant?.canonicalKey,
      opts.tenant?.displayName,
      opts.surfaceContext?.clientKey,
      opts.surfaceContext?.activeClient,
    ]);
    const skyHarborCtoPromptAddendum = buildSkyHarborCtoReadinessPromptAddendum(trimmed, [
      opts.tenantClientKey,
      opts.tenantInventoryKey,
      opts.tenant?.appClientKey,
      opts.tenant?.canonicalKey,
      opts.tenant?.displayName,
      opts.surfaceContext?.clientKey,
      opts.surfaceContext?.activeClient,
    ]);
    const conciseAsk = isExplicitConciseAsk(trimmed);
    const sourceLimit = conciseAsk ? 8 : 16;
    const rawSources: AskSource[] = [
      ...(skyHarborCtoSource ? [skyHarborCtoSource] : []),
      ...surfaceContext,
      ...tenantStructuredFacts,
      ...tenantEnterprise,
      ...tenantTechnology,
      ...retailOverlay,
      ...routed.sources,
      ...worldview.sources,
    ].slice(0, sourceLimit);
    const sources = conciseAsk ? compactSourceDetailsForConciseAsk(rawSources) : rawSources;
    const averageConfidence = sources.length > 0
      ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
      : 0;
    const coverageReport = assertCoverage(questionCategory, sources);
    yield { type: 'sources', sources, coverageReport };

    const handoff = atlasStakeholderConflictHandoff(trimmed);
    const currentStateAsk = isBroadCurrentStateQuestion(trimmed);

    // INT-VOICE.STRAT-2026-05-10b — Streaming whitespace bug fix.
    //
    // The synthesizer owns final answer text and chunks it into ~80-char
    // pieces that each end with the trailing whitespace from
    // `/.{1,80}(?:\s|$)/g`. We used to call sanitizeAskSynthesis(delta, 500)
    // again here per chunk; that call's `.trim()` stripped the trailing whitespace from every chunk,
    // which the SentinelChat client then concatenated together producing
    // the "ApexRetail" / "demandsensing" / "upstreamconditions" word-fusion
    // Carlos saw on every test in the 2026-05-10 re-test. The double-
    // sanitize is also redundant — hollow openers, markdown, and the word
    // cap are already applied at the synthesizer entry. Pass chunks
    // through unchanged.
    let answer = '';
    for await (const delta of synthesizeStream({
      query: trimmed,
      sources,
      intent: classification.intent,
      tenantId: opts.tenantId,
      tenantClientKey: opts.tenantClientKey,
      userId: opts.userId,
      userContextBlock: opts.userContextBlock,
      factAvailabilityBlock,
      coverageReportBlock: formatCoverageReportForPrompt(coverageReport),
      conversationContextBlock: [
        skyHarborCtoPromptAddendum,
        opts.conversationContextBlock,
        handoff
          ? `ROUTING ADVISORY CONTEXT: A stakeholder-conflict question may need an Atlas handoff. Do not emit a deterministic handoff. Author the final user-visible answer yourself and, if a handoff is warranted, say it naturally. Suggested context only: ${handoff}`
          : '',
        currentStateAsk
          ? 'CURRENT-STATE QUESTION CONTEXT: The user is asking for a broad current-state read. Author the answer from the selected sources and visible output contract; do not rely on deterministic fallback prose.'
          : '',
      ].filter(Boolean).join('\n\n') || undefined,
      averageConfidence,
    })) {
      answer += delta;
      yield { type: 'delta', text: delta };
    }
    if (opts.traceEnabled) {
      yield {
        type: 'trace',
        trace: {
          traceVersion: 'answer-quality-v1',
          route: '/api/intelligence/ask',
          surface: 'intelligence',
          timestamp: new Date().toISOString(),
          session: opts.traceSession ?? {
            tenant: opts.tenant ?? opts.tenantClientKey ?? opts.tenantInventoryKey ?? null,
            question: trimmed,
          },
          router: {
            selectedEndpoint: '/api/intelligence/ask',
            surface: 'intelligence',
            intent: classification.intent,
            primaryDimension: questionCategory,
            secondaryDimensions: classification.entities ?? [],
            answerMode: 'advisory_decision',
            fallbackEligibility: true,
          },
          evidenceSelection: {
            selectedDossierIds: sources.filter((source) => source.type === 'TENANT' || source.type === 'GRAPH').map((source) => source.id),
            dossierEligibilityState: { coverageReport },
            selectedReadModels: sources.map((source) => `${source.type}:${source.name}`),
            selectedMetricSnapshots: sources
              .filter((source) => /\$|\d+%|\b\d+(?:\.\d+)?\b/.test(source.detail))
              .slice(0, 12)
              .map((source) => ({ id: source.id, name: source.name, detail: source.detail.slice(0, 500) })),
            selectedGaps: coverageReport.missingSegments,
            selectedCitations: sources.map((source) => ({ id: source.id, name: source.name, type: source.type, confidence: source.confidence })),
            artifactPlan: /\b(table|rank|compare|scorecard|chart)\b/i.test(trimmed) ? ['table'] : ['prose'],
          },
          modelCall: {
            fallbackUsed: true,
            fallbackReason: 'synthesis_trace_missing',
          },
          apiPayload: {
            answer,
            followupsPending: true,
          },
          validation: {
            coverageReport,
          },
        },
      };
    }

    const followups = await generateFollowups({
      query: trimmed,
      answer,
      entities: classification.entities,
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    yield { type: 'followups', followups };
    yield { type: 'done' };
  } catch (err) {
    yield { type: 'error', error: err instanceof Error ? err.message : 'unknown' };
  }
}
