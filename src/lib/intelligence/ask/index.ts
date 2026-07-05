import { classifyIntent } from "./classifier";
import { route } from "./router";
import { isExplicitConciseAsk, synthesizeStream } from "./synthesizer";
import { generateFollowups } from "./followups";
import { retrieveWorldview } from "./retrievers/worldview";
import { retrieveSurfaceContextSources } from "./retrievers/surface-context";
import { retrieveRetailOverlaySources } from "./retrievers/retail-overlay";
import { retrieveV7DossierSources } from "./retrievers/v7-dossier";
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
import {
  buildIntelligenceDossier,
  type IntelligenceDossier,
} from "@/lib/intelligence/dossiers";
import {
  advisoryPacketForClientEvent,
  assembleAdvisoryPacket,
  type AdvisoryPacket,
} from "@/lib/intelligence/advisory-packet";
import { synthesizeIntelligenceConsultantText } from "@/lib/intelligence/intelligence-consultant-text-synthesis";
import {
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
} from "./skyharbor-cto-readiness-source";
import {
  buildIndustrialCioBackofficePromptAddendum,
  buildIndustrialCioBackofficeSource,
} from "./industrial-cio-backoffice-source";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  createIntelligenceLatencyTrace,
  type IntelligenceLatencyTiming,
} from "@/lib/intelligence/latency-trace";
import { isBlockingIntelligenceRepairEnabled } from "@/lib/intelligence/repair-mode";
import { buildCompanionCanvasPayload } from "./companion-canvas-engine";
import type { CompanionCanvasPayload } from "./companion-canvas";

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
    | "intelligence-dossier"
    | "advisory-packet"
    | "canvas";
  classification?: IntentClassification;
  sources?: AskSource[];
  coverageReport?: CoverageReport;
  text?: string;
  followups?: string[];
  error?: string;
  /** Question-specific advisory packet passed into the Intelligence synthesizer. */
  intelligenceDossier?: IntelligenceDossier;
  advisoryPacket?: AdvisoryPacket;
  /** Structured companion canvas payload (flag-gated). Emitted after the answer stream. */
  canvas?: CompanionCanvasPayload;
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
  /** Operator-only trace hook for the exact raw model output. */
  onModelOutput?: (parts: {
    rawText: string;
    text: string;
    model?: string;
    auditId?: string;
    route: string;
  }) => void;
  /** Operator proof mode may stream full AdvisoryPacket audit lineage. Default streams only safe labels. */
  includeAdvisoryPacketAudit?: boolean;
  /** Operator-only latency hook. Emits timings, never user-visible content. */
  onTiming?: (timing: IntelligenceLatencyTiming) => void;
  latencyTraceId?: string | null;
  latencyStartedAt?: number;
  /**
   * Companion-canvas feature. The ROUTE computes
   * `isFeatureEnabled({ clientKey, clientId }, 'intelligence_companion_canvas')`
   * and passes the result here — do NOT compute Clerk/tenant flags in this
   * generator. When true, the answer streams answer-only (true streaming) and
   * a structured `canvas` event is emitted after the answer completes. When
   * falsy, the path is unchanged.
   */
  companionCanvasEnabled?: boolean;
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
    const trace = createIntelligenceLatencyTrace({
      requestId: opts.latencyTraceId,
      startedAt: opts.latencyStartedAt,
    });
    const emitTiming = (timing: IntelligenceLatencyTiming) => {
      opts.onTiming?.(timing);
    };
    emitTiming(
      trace.mark("ask.start", {
        richText: opts.richText === true,
        tenantClientKey: opts.tenantClientKey ?? opts.tenantInventoryKey,
      }),
    );
    const classifyStartedAt = Date.now();
    const classification = await classifyIntent(trimmed, {
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    emitTiming(
      trace.finish("classification.done", classifyStartedAt, {
        intent: classification.intent,
        entityCount: classification.entities.length,
      }),
    );
    yield { type: "classified", classification };
    const questionCategory = classifyQuestionCategory(
      trimmed,
      classification.intent,
    );

    const surfaceStartedAt = Date.now();
    const surfaceContext = retrieveSurfaceContextSources(
      opts.surfaceContext,
      trimmed,
    );
    emitTiming(
      trace.finish("retrieval.surface_context.done", surfaceStartedAt, {
        sourceCount: surfaceContext.length,
      }),
    );
    // Keep DB-backed retrieval sequential to avoid exhausting session-mode pools under Ask verifier load.
    const v7DossierStartedAt = Date.now();
    const v7Dossier = await retrieveV7DossierSources(trimmed, {
      tenantInventoryKey:
        opts.tenant?.appClientKey ??
        opts.tenantInventoryKey ??
        opts.tenantClientKey,
      surfaceContext: opts.surfaceContext,
    });
    emitTiming(
      trace.finish("retrieval.v7_dossier.done", v7DossierStartedAt, {
        sourceCount: v7Dossier.sources.length,
      }),
    );
    const tenantEnterpriseStartedAt = Date.now();
    const tenantEnterprise = await retrieveTenantEnterpriseSources(
      opts.tenant ?? opts.tenantInventoryKey,
      trimmed,
      {
        activePersonGraphNodeId: opts.activePersonGraphNodeId,
        activePersonDisplayName: opts.activePersonDisplayName,
        userContextBlock: opts.userContextBlock,
      },
    );
    emitTiming(
      trace.finish("retrieval.tenant_enterprise.done", tenantEnterpriseStartedAt, {
        sourceCount: tenantEnterprise.length,
      }),
    );
    const tenantStructuredStartedAt = Date.now();
    const tenantStructuredFacts = await retrieveTenantStructuredFacts(
      opts.tenant ?? opts.tenantInventoryKey,
      trimmed,
    );
    emitTiming(
      trace.finish("retrieval.tenant_structured_facts.done", tenantStructuredStartedAt, {
        sourceCount: tenantStructuredFacts.length,
      }),
    );
    const tenantTechnologyStartedAt = Date.now();
    const tenantTechnology = await retrieveTenantTechnologySources(
      opts.tenantInventoryKey,
      trimmed,
    );
    emitTiming(
      trace.finish("retrieval.tenant_technology.done", tenantTechnologyStartedAt, {
        sourceCount: tenantTechnology.length,
      }),
    );
    const retailStartedAt = Date.now();
    const retailOverlay = await retrieveRetailOverlaySources(
      opts.tenant,
      trimmed,
      questionCategory,
    );
    emitTiming(
      trace.finish("retrieval.retail_overlay.done", retailStartedAt, {
        sourceCount: retailOverlay.length,
      }),
    );
    const routeStartedAt = Date.now();
    const routed = await route(classification.intent, classification.entities, {
      query: trimmed,
      tenantInventoryKey: opts.tenantInventoryKey,
      surfaceContext: opts.surfaceContext,
    });
    emitTiming(
      trace.finish("retrieval.route.done", routeStartedAt, {
        sourceCount: routed.sources.length,
      }),
    );
    const worldviewStartedAt = Date.now();
    const worldview = await retrieveWorldview(trimmed, 3, {
      tenantId: opts.tenantId,
      userId: opts.userId,
    });
    emitTiming(
      trace.finish("retrieval.worldview.done", worldviewStartedAt, {
        sourceCount: worldview.sources.length,
      }),
    );
    const fingerprintStartedAt = Date.now();
    const factFingerprint = await getTenantFactFingerprint({
      tenantId: opts.tenantId,
      tenantInventoryKey: opts.tenantInventoryKey,
    });
    emitTiming(
      trace.finish("retrieval.fact_fingerprint.done", fingerprintStartedAt, {
        availableFamilyCount: factFingerprint?.namedEntityClasses.length ?? 0,
      }),
    );
    const factAvailabilityBlock =
      formatTenantFactAvailabilityBlock(factFingerprint);

    // Persona expert packs are intentionally not summoned here. Intelligence
    // grounding comes from tenant substrate, structured context, corpus
    // patterns, and benchmarks; lightweight routing/lens decisions stay hidden.
    const groundedFactBlock = factAvailabilityBlock;
    const skyHarborCtoSource = buildSkyHarborCtoReadinessSource(trimmed, [
      opts.tenantClientKey,
      opts.tenantInventoryKey,
      opts.tenant?.appClientKey,
      opts.tenant?.canonicalKey,
      opts.tenant?.displayName,
      opts.surfaceContext?.clientKey,
      opts.surfaceContext?.activeClient,
    ]);
    const skyHarborCtoPromptAddendum = buildSkyHarborCtoReadinessPromptAddendum(
      trimmed,
      [
        opts.tenantClientKey,
        opts.tenantInventoryKey,
        opts.tenant?.appClientKey,
        opts.tenant?.canonicalKey,
        opts.tenant?.displayName,
        opts.surfaceContext?.clientKey,
        opts.surfaceContext?.activeClient,
      ],
    );
    const industrialCioSource = buildIndustrialCioBackofficeSource(trimmed, [
      opts.tenantClientKey,
      opts.tenantInventoryKey,
      opts.tenant?.appClientKey,
      opts.tenant?.canonicalKey,
      opts.tenant?.displayName,
      opts.surfaceContext?.clientKey,
      opts.surfaceContext?.activeClient,
    ]);
    const industrialCioPromptAddendum =
      buildIndustrialCioBackofficePromptAddendum(trimmed, [
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
      ...(industrialCioSource ? [industrialCioSource] : []),
      ...(skyHarborCtoSource ? [skyHarborCtoSource] : []),
      ...surfaceContext,
      ...v7Dossier.sources,
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
    emitTiming(
      trace.mark("retrieval.sources_selected", {
        rawSourceCount: rawSources.length,
        sourceCount: sources.length,
        sourceLimit,
      }),
    );
    const averageConfidence =
      sources.length > 0
        ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
        : 0;
    const coverageReport = assertCoverage(questionCategory, sources);
    yield { type: "sources", sources, coverageReport };
    const demoSafeTenantName =
      canonicalClientDisplayName({
        key: opts.tenantClientKey ?? opts.tenantInventoryKey ?? undefined,
        name: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      }) ??
      opts.tenant?.displayName ??
      opts.surfaceContext?.activeClient ??
      opts.tenantClientKey ??
      undefined;
    const advisoryPacket = assembleAdvisoryPacket({
      tenantKey:
        opts.tenantClientKey ?? opts.tenantInventoryKey ?? opts.tenantId,
      tenantName: demoSafeTenantName,
      question: trimmed,
      classification,
      sources,
      aliases: opts.tenant?.aliases ? Array.from(opts.tenant.aliases) : [],
      industry: opts.tenant?.industryCode,
    });
    const intelligenceDossier =
      advisoryPacket.auditLineage.sourceDossier ??
      buildIntelligenceDossier({
        tenantKey:
          opts.tenantClientKey ?? opts.tenantInventoryKey ?? opts.tenantId,
        tenantName: demoSafeTenantName,
        question: trimmed,
        classification,
        sources,
      });
    emitTiming(
      trace.mark("packet.assembled", {
        sourceCount: sources.length,
        relatedDimensionCount: intelligenceDossier.relatedDimensions.length,
        evidenceStrength: intelligenceDossier.tenantEvidenceDossier.confidence,
      }),
    );
    yield { type: "intelligence-dossier", intelligenceDossier };
    yield {
      type: "advisory-packet",
      advisoryPacket: advisoryPacketForClientEvent(
        advisoryPacket,
        opts.includeAdvisoryPacketAudit === true,
      ),
    };

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

    if (isBlockingIntelligenceRepairEnabled()) {
      const consultantText = await synthesizeIntelligenceConsultantText({
        dossier: intelligenceDossier,
        advisoryPacket,
        tenantId:
          opts.tenantId ?? opts.tenantInventoryKey ?? opts.tenantClientKey,
        userId: opts.userId,
        onModelInput: opts.onModelInput,
        onModelOutput: opts.onModelOutput,
        onTiming: emitTiming,
        latencyTraceId: trace.requestId,
        latencyStartedAt: trace.startedAt,
      });
      if (consultantText && consultantText.used) {
        let answer = "";
        for (const chunk of chunkAskText(consultantText.text)) {
          answer += chunk;
          yield { type: "delta", text: chunk };
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
        return;
      }
    } else {
      emitTiming(
        trace.mark("consultant.synthesis.skipped", {
          reason: "live_no_repair_mode",
        }),
      );
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
    const companionCanvasEnabled = opts.companionCanvasEnabled === true;
    const coverageReportBlock = formatCoverageReportForPrompt(coverageReport);
    let answer = "";
    for await (const delta of synthesizeStream({
      richText: opts.richText,
      // Companion-canvas turns stream answer-only (true streaming); the
      // structured canvas is authored separately below. Flag off → unchanged.
      answerOnlyStreaming: companionCanvasEnabled,
      query: trimmed,
      sources,
      intent: classification.intent,
      tenantId: opts.tenantId,
      tenantClientKey: opts.tenantClientKey,
      userId: opts.userId,
      userContextBlock: opts.userContextBlock,
      conversationContextBlock:
        [
          industrialCioPromptAddendum,
          skyHarborCtoPromptAddendum,
          opts.conversationContextBlock,
        ]
          .filter(Boolean)
          .join("\n\n") || undefined,
      factAvailabilityBlock: groundedFactBlock,
      coverageReportBlock,
      intelligenceDossier,
      averageConfidence,
      onModelInput: opts.onModelInput,
      onModelOutput: opts.onModelOutput,
      onTiming: emitTiming,
      latencyTraceId: trace.requestId,
      latencyStartedAt: trace.startedAt,
    })) {
      answer += delta;
      yield { type: "delta", text: delta };
    }

    // Companion canvas (flag-gated). Author the structured five-lens payload
    // AFTER the answer stream so it is adjacent to the delivered answer. Never
    // fatal: a failure leaves the answer already streamed, no canvas emitted.
    if (companionCanvasEnabled) {
      const canvasStartedAt = Date.now();
      try {
        const canvas = await buildCompanionCanvasPayload({
          query: trimmed,
          intent: classification.intent,
          answer,
          sources,
          tenantClientKey: opts.tenantClientKey ?? null,
          tenantId: opts.tenantId ?? null,
          userId: opts.userId,
          factAvailabilityBlock: groundedFactBlock,
          coverageReportBlock,
        });
        emitTiming(
          trace.finish("companion_canvas.built", canvasStartedAt, {
            tenantThin: canvas.meta.tenantThin,
            unverified: canvas.meta.unverified,
            canvasType: canvas.meta.canvasType ?? "none",
            evidenceTileCount: canvas.tabs.evidence.length,
          }),
        );
        yield { type: "canvas", canvas };
      } catch (err) {
        emitTiming(
          trace.mark("companion_canvas.failed", {
            message: err instanceof Error ? err.message : "unknown",
          }),
        );
      }
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
