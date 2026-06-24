import { classifyIntent } from "./classifier";
import { route } from "./router";
import { isExplicitConciseAsk, synthesizeStream } from "./synthesizer";
import { generateFollowups } from "./followups";
import { retrieveWorldview } from "./retrievers/worldview";
import { retrieveSurfaceContextSources } from "./retrievers/surface-context";
import { retrieveRetailOverlaySources } from "./retrievers/retail-overlay";
import {
  retrieveTenantEnterpriseSources,
  retrieveTenantStructuredFacts,
} from "@/lib/knowledge/tenant-enterprise-context";
import { retrieveTenantTechnologySources } from "@/lib/knowledge/tenant-technology-context";
import {
  formatTenantFactAvailabilityBlock,
  getTenantFactFingerprint,
} from "./tenant-fact-fingerprint";
import type {
  AskSource,
  IntentClassification,
  AskSurfaceContext,
} from "./types";
import type { CanonicalTenant } from "@/lib/tenant/CanonicalTenant";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { summonExpertsForQuery } from "@/lib/intelligence/answer/expert-grounding";
import type { ExpertRef } from "@/lib/ava-answer/contract";
import {
  assertCoverage,
  classifyQuestionCategory,
  type CoverageReport,
} from "@/lib/knowledge/coverage";
import { formatCoverageReportForPrompt } from "@/lib/knowledge/coverageReport";
import {
  buildCurrentStateAdvisory,
  chunkAskText,
  isBroadCurrentStateQuestion,
  sanitizeAskSynthesis,
} from "./response-policy";

export type {
  AskIntent,
  AskSource,
  AskSurfaceContext,
  IntentClassification,
} from "./types";

export interface AskEvent {
  type:
    | "classified"
    | "sources"
    | "delta"
    | "followups"
    | "done"
    | "error"
    | "contributing-experts";
  classification?: IntentClassification;
  sources?: AskSource[];
  coverageReport?: CoverageReport;
  text?: string;
  followups?: string[];
  error?: string;
  /** Consilium experts grounding the answer (Shared Context Brain, flag-gated). */
  contributingExperts?: ExpertRef[];
}

export interface AskOptions {
  userContextBlock?: string;
  conversationContextBlock?: string;
  tenantId?: string | null;
  tenantClientKey?: string | null;
  tenant?: CanonicalTenant | null;
  /** Caller surface renders Markdown — allow light formatting (tables/bold). Default false. */
  richText?: boolean;
  userId?: string | null;
  tenantInventoryKey?: string | null;
  surfaceContext?: AskSurfaceContext | null;
  activePersonGraphNodeId?: string | null;
  activePersonDisplayName?: string | null;
  /**
   * Observability hook forwarded to the synthesizer · invoked with the exact
   * system + user content sent to the model. Used by the agent-trace spine.
   */
  onModelInput?: (parts: { system: string; user: string }) => void;
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
  const asksForAdvice =
    /\b(what should i do|what do i do|how should i handle|give me.*playbook|resolution path)\b/.test(
      normalized,
    );
  const namesConflict =
    /\b(cmo|cfo|stakeholder|executive|sponsor)\b/.test(normalized) &&
    /\b(conflict|contradiction|tension|misalignment|vs|versus)\b/.test(
      normalized,
    );
  if (!asksForAdvice || !namesConflict) return null;

  return [
    "That belongs in an Intelligence decision workspace. I can surface the contradiction and evidence, but aVa should not prescribe the political resolution from this narrow ask alone.",
    "Handoff: map the growth thesis, cost-takeout posture, affected programs, and decision owner; then return options with tradeoffs.",
    "Which program is the conflict surfacing in?",
  ].join(" ");
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
// In that case, aVa must take the tenant context block + broad domain
// expertise and answer like a senior AI strategy advisor. Honesty is reserved
// for tenant-specific quantitative claims (KPI values, exact vendor figures,
// quantified business cases) — and the model handles that itself, in one
// short, natural caveat at the end.

export async function* askIntelligence(
  query: string,
  opts: AskOptions = {},
): AsyncGenerator<AskEvent> {
  const trimmed = query.trim();
  if (!trimmed) {
    yield { type: "error", error: "empty query" };
    return;
  }

  try {
    const classification = await classifyIntent(trimmed, {
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    yield { type: "classified", classification };
    const questionCategory = classifyQuestionCategory(
      trimmed,
      classification.intent,
    );

    const surfaceContext = retrieveSurfaceContextSources(
      opts.surfaceContext,
      trimmed,
    );
    // Keep DB-backed retrieval sequential to avoid exhausting session-mode pools under Ask verifier load.
    const tenantEnterprise = await retrieveTenantEnterpriseSources(
      opts.tenant ?? opts.tenantInventoryKey,
      trimmed,
      {
        activePersonGraphNodeId: opts.activePersonGraphNodeId,
        activePersonDisplayName: opts.activePersonDisplayName,
        userContextBlock: opts.userContextBlock,
      },
    );
    const tenantStructuredFacts = await retrieveTenantStructuredFacts(
      opts.tenant ?? opts.tenantInventoryKey,
      trimmed,
    );
    const tenantTechnology = await retrieveTenantTechnologySources(
      opts.tenantInventoryKey,
      trimmed,
    );
    const retailOverlay = await retrieveRetailOverlaySources(
      opts.tenant,
      trimmed,
      questionCategory,
    );
    const routed = await route(classification.intent, classification.entities, {
      query: trimmed,
      tenantInventoryKey: opts.tenantInventoryKey,
      surfaceContext: opts.surfaceContext,
    });
    const worldview = await retrieveWorldview(trimmed, 3, {
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    const factFingerprint = await getTenantFactFingerprint({
      tenantId: opts.tenantId,
      tenantInventoryKey: opts.tenantInventoryKey,
    });
    const factAvailabilityBlock =
      formatTenantFactAvailabilityBlock(factFingerprint);

    // Shared Context Brain (W1.2/W1.3) — flag-gated, default OFF. When on for
    // the tenant, summon the Consilium expert(s) for this question and inject
    // their authored grounding (benchmarks, AI plays, honest odds, hedges) into
    // the synthesizer so Ava answers AS the expert. Dormant until the flag is
    // flipped per tenant; the existing path is byte-identical when off.
    const sharedEngineOn = isFeatureEnabled(
      { clientKey: opts.tenantClientKey },
      "scb_shared_engine_intelligence",
    );
    const expertGrounding = sharedEngineOn
      ? summonExpertsForQuery({
          query: trimmed,
          clientKey: opts.tenantClientKey,
        })
      : { experts: [] as ExpertRef[], groundingBlock: "" };
    const groundedFactBlock = expertGrounding.groundingBlock
      ? `${expertGrounding.groundingBlock}\n\n${factAvailabilityBlock}`
      : factAvailabilityBlock;

    const conciseAsk = isExplicitConciseAsk(trimmed);
    const sourceLimit = conciseAsk ? 8 : 16;
    const rawSources: AskSource[] = [
      ...surfaceContext,
      ...tenantStructuredFacts,
      ...tenantEnterprise,
      ...tenantTechnology,
      ...retailOverlay,
      ...routed.sources,
      ...worldview.sources,
    ].slice(0, sourceLimit);
    const sources = conciseAsk
      ? compactSourceDetailsForConciseAsk(rawSources)
      : rawSources;
    const averageConfidence =
      sources.length > 0
        ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
        : 0;
    const coverageReport = assertCoverage(questionCategory, sources);
    yield { type: "sources", sources, coverageReport };
    if (expertGrounding.experts.length > 0) {
      yield {
        type: "contributing-experts",
        contributingExperts: expertGrounding.experts,
      };
    }

    const handoff = atlasStakeholderConflictHandoff(trimmed);
    if (handoff) {
      for (const chunk of chunkAskText(sanitizeAskSynthesis(handoff, 140))) {
        yield { type: "delta", text: chunk.trimEnd() };
      }
      yield {
        type: "followups",
        followups: [
          "Map the contradiction in Intelligence",
          "Show the evidence behind this tension",
        ],
      };
      yield { type: "done" };
      return;
    }

    if (isBroadCurrentStateQuestion(trimmed)) {
      const advisory = buildCurrentStateAdvisory(sources);
      if (advisory) {
        for (const chunk of chunkAskText(sanitizeAskSynthesis(advisory, 170))) {
          yield { type: "delta", text: chunk };
        }
        yield {
          type: "followups",
          followups: [
            "Give me the CFO value lens",
            "Give me the CIO delivery lens",
            "Pressure-test the CMO growth lens",
          ],
        };
        yield { type: "done" };
        return;
      }
    }

    // INT-VOICE.STRAT-2026-05-10b — Streaming whitespace bug fix.
    //
    // The synthesizer already runs sanitizeAskSynthesis on the full text,
    // then chunks it via chunkAskText into ~80-char pieces that each end
    // with the trailing whitespace from `/.{1,80}(?:\s|$)/g`. We used to
    // call sanitizeAskSynthesis(delta, 500) again here per chunk; that
    // call's `.trim()` stripped the trailing whitespace from every chunk,
    // which the SentinelChat client then concatenated together producing
    // the "ApexRetail" / "demandsensing" / "upstreamconditions" word-fusion
    // Carlos saw on every test in the 2026-05-10 re-test. The double-
    // sanitize is also redundant — hollow openers, markdown, and the word
    // cap are already applied at the synthesizer entry. Pass chunks
    // through unchanged.
    let answer = "";
    for await (const delta of synthesizeStream({
      richText: opts.richText,
      query: trimmed,
      sources,
      intent: classification.intent,
      tenantId: opts.tenantId,
      tenantClientKey: opts.tenantClientKey,
      userId: opts.userId,
      userContextBlock: opts.userContextBlock,
      conversationContextBlock: opts.conversationContextBlock,
      factAvailabilityBlock: groundedFactBlock,
      coverageReportBlock: formatCoverageReportForPrompt(coverageReport),
      averageConfidence,
      onModelInput: opts.onModelInput,
    })) {
      answer += delta;
      yield { type: "delta", text: delta };
    }

    const followups = await generateFollowups({
      query: trimmed,
      answer,
      entities: classification.entities,
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    yield { type: "followups", followups };
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
