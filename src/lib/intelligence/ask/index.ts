import { classifyIntent } from "./classifier";
import { route } from "./router";
import {
  chunkAskText,
  isExplicitConciseAsk,
  synthesizeStream,
} from "./synthesizer";
import { applyCxoAnswerModeFallbacks } from "./answer-mode-registry";
import { buildClientGroundingPacketSource } from "./client-grounding-packet";
import { generateFollowups, normalizeGeneratedFollowup } from "./followups";
import { retrieveWorldview } from "./retrievers/worldview";
import { retrieveSurfaceContextSources } from "./retrievers/surface-context";
import { retrieveRetailOverlaySources } from "./retrievers/retail-overlay";
import { retrieveCuratedDossierSources } from "./retrievers/curated-dossier";
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
import { buildCanonicalLandscapeSource } from "./canonical-landscape-source";
import {
  classifyAbarvaAnswerMode,
  isBroadCurrentStateQuestion,
} from "./response-policy";
import type { AnswerTraceEnvelope } from "@/lib/debug/answer-trace";
import {
  buildSkyHarborCtoReadinessPromptAddendum,
  buildSkyHarborCtoReadinessSource,
} from "./skyharbor-cto-readiness-source";
import {
  createIntelligenceLatencyTrace,
  type IntelligenceLatencyTiming,
} from "@/lib/intelligence/latency-trace";
import type { IntelligenceDossier } from "@/lib/intelligence/dossiers/types";
import type { AdvisoryPacket } from "@/lib/intelligence/advisory-packet/types";
import type { CompanionCanvasPayload } from "@/lib/intelligence/ask/companion-canvas";
import {
  assembleAdvisoryPacket,
  advisoryPacketForClientEvent,
} from "@/lib/intelligence/advisory-packet/assemble-advisory-packet";
import { buildIntelligenceDossier } from "@/lib/intelligence/dossiers";
import { buildCompanionCanvasPayload } from "@/lib/intelligence/ask/companion-canvas-engine";
import {
  canonicalClientDisplayName,
  demoSafeClientText,
} from "@/lib/client-config";
import {
  buildClientSafeRetiredFactMessage,
  filterSourcesWithRetiredFacts,
  scanRetiredFacts,
  type RetiredFactFinding,
} from "./retired-fact-gate";
import {
  applyProductTruthRuntimeGuard,
  productTruthGroundingText,
  sanitizeSuggestedQuestions,
} from "@/lib/agent/product-truth";

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
    | "trace"
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
  trace?: AnswerTraceEnvelope;
  text?: string;
  followups?: string[];
  error?: string;
  retiredFactFindings?: RetiredFactFinding[];
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
  traceEnabled?: boolean;
  /** Caller surface renders the companion canvas — stream the main answer only, let the canvas fill in separately. Default false. */
  companionCanvasEnabled?: boolean;
  /** Caller surface renders inline markdown (aVa dock) — stream plain answer only with no tab payload. Overrides companionCanvasEnabled for the answerOnly path. */
  answerOnlyStreaming?: boolean;
  traceSession?: {
    user?: AnswerTraceEnvelope["session"]["user"];
    tenant?: unknown;
    question?: string | null;
  };
  /** Called with the raw system + user prompt just before the model is invoked. Used by QA probes to hash/log the model input. */
  onModelInput?: (parts: { system: string; user: string }) => void;
  /** Called with the raw model output after streaming completes. Used by QA probes to capture full answer text. */
  onModelOutput?: (parts: {
    rawText: string;
    text: string;
    model?: string;
    auditId?: string;
    route: string;
  }) => void;
  /** Latency trace request ID to resume an existing trace (passed from the route layer). */
  latencyTraceId?: string | null;
  /** Timestamp (ms) when the latency trace started at the route layer. */
  latencyStartedAt?: number;
  /** Called for each latency timing mark emitted during the ask pipeline. */
  onTiming?: (timing: IntelligenceLatencyTiming) => void;
  /** Include the advisory-packet audit block in the synthesizer prompt. Default false. */
  includeAdvisoryPacketAudit?: boolean;
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
    const tenantKeyForRetiredFactGate =
      opts.tenant?.canonicalKey ??
      opts.tenant?.appClientKey ??
      opts.tenantInventoryKey ??
      opts.tenantClientKey ??
      opts.surfaceContext?.clientKey ??
      opts.surfaceContext?.activeClient ??
      null;
    const productTruthContext = {
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      surface: opts.surfaceContext?.activeTab ?? "intelligence",
      query: trimmed,
    };
    const answerMode = classifyAbarvaAnswerMode(trimmed);
    const clientSafeRetiredFactMessage = () =>
      applyCxoAnswerModeFallbacks(
        buildClientSafeRetiredFactMessage(),
        answerMode,
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
    const surfaceRetiredFacts = scanRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      surfaceContext: opts.surfaceContext,
      sources: surfaceContext,
    });
    if (surfaceRetiredFacts.length > 0) {
      yield {
        type: "error",
        error: clientSafeRetiredFactMessage(),
        retiredFactFindings: surfaceRetiredFacts,
      };
      return;
    }
    emitTiming(
      trace.mark("retrieval.context_dossier.disabled", {
        sourceCount: 0,
        reason: "retired_v6_v7_layers_disabled",
      }),
    );
    // Current-context bridge (2026-08-04): reads the same semantic2_dossiers
    // Postgres layer Home and Atlas already serve from. Fills the grounding
    // gap left by the V7 dossier retriever's removal above — Intelligence
    // previously had no current-context Postgres source at all. Best-effort;
    // an empty result here (no eligible dossier for this tenant/question)
    // degrades to the existing tenant-context retrievers below, unchanged.
    const curatedDossierStartedAt = Date.now();
    const curatedDossier = await retrieveCuratedDossierSources(trimmed, {
      tenantAppClientKey: opts.tenant?.appClientKey,
      tenantInventoryKey: opts.tenantInventoryKey ?? opts.tenantClientKey,
      surfaceContext: opts.surfaceContext,
    });
    emitTiming(
      trace.finish(
        "retrieval.curated_dossier.done",
        curatedDossierStartedAt,
        { sourceCount: curatedDossier.sources.length },
      ),
    );
    // Keep DB-backed retrieval sequential to avoid exhausting session-mode pools under Ask verifier load.
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
      trace.finish(
        "retrieval.tenant_enterprise.done",
        tenantEnterpriseStartedAt,
        {
          sourceCount: tenantEnterprise.length,
        },
      ),
    );
    const tenantStructuredStartedAt = Date.now();
    const tenantStructuredFacts = await retrieveTenantStructuredFacts(
      opts.tenant ?? opts.tenantInventoryKey,
      trimmed,
    );
    emitTiming(
      trace.finish(
        "retrieval.tenant_structured_facts.done",
        tenantStructuredStartedAt,
        {
          sourceCount: tenantStructuredFacts.length,
        },
      ),
    );
    const tenantTechnologyStartedAt = Date.now();
    const tenantTechnology = await retrieveTenantTechnologySources(
      opts.tenantInventoryKey,
      trimmed,
    );
    emitTiming(
      trace.finish(
        "retrieval.tenant_technology.done",
        tenantTechnologyStartedAt,
        {
          sourceCount: tenantTechnology.length,
        },
      ),
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
    const factFingerprint = await getTenantFactFingerprint({
      tenantId: opts.tenantId,
      tenantInventoryKey: opts.tenantInventoryKey,
    });
    const factAvailabilityBlock =
      formatTenantFactAvailabilityBlock(factFingerprint);
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
    const conciseAsk = isExplicitConciseAsk(trimmed);
    const sourceLimit = conciseAsk ? 9 : 18;
    // Canonical as a floor. When every other retriever comes back empty -- which is how aVa ended up
    // telling a client their estate was not loaded while thousands of their records sat in the
    // projection -- this still grounds the answer.
    const canonicalLandscapeSource = await buildCanonicalLandscapeSource([
      opts.tenantClientKey,
      opts.tenantInventoryKey,
      opts.tenant?.appClientKey,
      opts.tenant?.canonicalKey,
      opts.surfaceContext?.clientKey,
    ]).catch(() => null);
    const currentTenantSources = [
      ...(canonicalLandscapeSource ? [canonicalLandscapeSource] : []),
      ...curatedDossier.sources,
      ...tenantStructuredFacts,
      ...tenantEnterprise,
      ...tenantTechnology,
      ...routed.sources,
      ...worldview.sources,
    ];
    const clientGroundingPacket = buildClientGroundingPacketSource({
      query: trimmed,
      tenantKey:
        opts.tenantClientKey ??
        opts.tenantInventoryKey ??
        opts.tenant?.appClientKey ??
        opts.surfaceContext?.clientKey,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      sources: currentTenantSources,
    });
    const rawSources: AskSource[] = [
      ...(skyHarborCtoSource ? [skyHarborCtoSource] : []),
      ...surfaceContext,
      ...(clientGroundingPacket ? [clientGroundingPacket] : []),
      ...retailOverlay,
      ...currentTenantSources,
    ].slice(0, sourceLimit);
    const selectedSources = conciseAsk
      ? compactSourceDetailsForConciseAsk(rawSources)
      : rawSources;
    const sourceSafety = filterSourcesWithRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      sources: selectedSources,
    });
    const sources = sourceSafety.sources;
    emitTiming(
      trace.mark("retrieval.sources_selected", {
        rawSourceCount: rawSources.length,
        sourceCount: sources.length,
        retiredSourceSuppressedCount: sourceSafety.findings.length,
        sourceLimit,
        clientGroundingPacket: Boolean(clientGroundingPacket),
        v7DossierDominant: false,
        suppressedLegacySourceCount: 0,
      }),
    );
    const averageConfidence =
      sources.length > 0
        ? sources.reduce((s, x) => s + (x.confidence ?? 0), 0) / sources.length
        : 0;
    const coverageReport = assertCoverage(questionCategory, sources);
    const preModelRetiredFacts = scanRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      surfaceContext: opts.surfaceContext,
      sources,
      textBlocks: [
        { location: "factAvailabilityBlock", text: factAvailabilityBlock },
        {
          location: "coverageReportBlock",
          text: formatCoverageReportForPrompt(coverageReport),
        },
      ],
    });
    if (preModelRetiredFacts.length > 0) {
      yield {
        type: "error",
        error: clientSafeRetiredFactMessage(),
        retiredFactFindings: preModelRetiredFacts,
      };
      return;
    }
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
    const advisoryPacketForEvent = advisoryPacketForClientEvent(
      advisoryPacket,
      opts.includeAdvisoryPacketAudit === true,
    );
    const packetRetiredFacts = scanRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      textBlocks: [
        {
          location: "intelligenceDossier",
          text: demoSafeClientText(JSON.stringify(intelligenceDossier)),
        },
        {
          location: "advisoryPacket",
          text: demoSafeClientText(JSON.stringify(advisoryPacketForEvent)),
        },
      ],
    });
    if (packetRetiredFacts.length > 0) {
      yield {
        type: "error",
        error: clientSafeRetiredFactMessage(),
        retiredFactFindings: packetRetiredFacts,
      };
      return;
    }
    yield { type: "intelligence-dossier", intelligenceDossier };
    yield { type: "advisory-packet", advisoryPacket: advisoryPacketForEvent };

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
    const companionCanvasEnabled = opts.companionCanvasEnabled === true;
    const coverageReportBlock = formatCoverageReportForPrompt(coverageReport);
    let answer = "";
    const pendingDeltas: string[] = [];
    for await (const delta of synthesizeStream({
      richText: opts.richText,
      // Companion-canvas turns stream answer-only (true streaming); the
      // structured canvas is authored separately below. Flag off → unchanged.
      answerOnlyStreaming: opts.answerOnlyStreaming ?? companionCanvasEnabled,
      query: trimmed,
      sources,
      intent: classification.intent,
      tenantId: opts.tenantId,
      tenantClientKey: opts.tenantClientKey,
      userId: opts.userId,
      userContextBlock: opts.userContextBlock,
      factAvailabilityBlock,
      coverageReportBlock: formatCoverageReportForPrompt(coverageReport),
      conversationContextBlock:
        [
          skyHarborCtoPromptAddendum,
          opts.conversationContextBlock,
          handoff
            ? `ROUTING ADVISORY CONTEXT: A stakeholder-conflict question may need an Atlas handoff. Do not emit a deterministic handoff. Author the final user-visible answer yourself and, if a handoff is warranted, say it naturally. Suggested context only: ${handoff}`
            : "",
          currentStateAsk
            ? "CURRENT-STATE QUESTION CONTEXT: The user is asking for a broad current-state read. Author the answer from the selected sources and visible output contract; do not rely on deterministic fallback prose."
            : "",
        ]
          .filter(Boolean)
          .join("\n\n") || undefined,
      averageConfidence,
      onModelInput: opts.onModelInput,
      onModelOutput: opts.onModelOutput,
      onTiming: emitTiming,
      latencyTraceId: trace.requestId,
      latencyStartedAt: trace.startedAt,
    })) {
      answer += delta;
      pendingDeltas.push(delta);
    }
    const modelOutputRetiredFacts = scanRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      textBlocks: [{ location: "modelOutput", text: answer }],
    });
    if (modelOutputRetiredFacts.length > 0) {
      yield {
        type: "error",
        error: clientSafeRetiredFactMessage(),
        retiredFactFindings: modelOutputRetiredFacts,
      };
      return;
    }
    const productTruthGrounding = productTruthGroundingText([
      opts.surfaceContext,
      sources,
      factAvailabilityBlock,
      coverageReportBlock,
      intelligenceDossier,
      advisoryPacketForEvent,
    ]);
    const guardedAnswer = applyProductTruthRuntimeGuard(answer, {
      ...productTruthContext,
      groundingText: productTruthGrounding,
    });
    answer = applyCxoAnswerModeFallbacks(
      guardedAnswer.text,
      classifyAbarvaAnswerMode(trimmed),
    );
    for (const delta of chunkAskText(answer)) {
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
          factAvailabilityBlock,
          coverageReportBlock,
        });
        const canvasRetiredFacts = scanRetiredFacts({
          tenantKey: tenantKeyForRetiredFactGate,
          tenantName:
            opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
          textBlocks: [
            { location: "companionCanvas", text: JSON.stringify(canvas) },
          ],
        });
        if (canvasRetiredFacts.length > 0) {
          yield {
            type: "error",
            error: clientSafeRetiredFactMessage(),
            retiredFactFindings: canvasRetiredFacts,
          };
          return;
        }
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
    if (opts.traceEnabled) {
      yield {
        type: "trace",
        trace: {
          traceVersion: "answer-quality-v1",
          route: "/api/intelligence/ask",
          surface: "intelligence",
          timestamp: new Date().toISOString(),
          session: opts.traceSession ?? {
            tenant:
              opts.tenant ??
              opts.tenantClientKey ??
              opts.tenantInventoryKey ??
              null,
            question: trimmed,
          },
          router: {
            selectedEndpoint: "/api/intelligence/ask",
            surface: "intelligence",
            intent: classification.intent,
            primaryDimension: questionCategory,
            secondaryDimensions: classification.entities ?? [],
            answerMode: "advisory_decision",
            fallbackEligibility: true,
          },
          evidenceSelection: {
            selectedDossierIds: sources
              .filter(
                (source) => source.type === "TENANT" || source.type === "GRAPH",
              )
              .map((source) => source.id),
            dossierEligibilityState: { coverageReport },
            selectedReadModels: sources.map(
              (source) => `${source.type}:${source.name}`,
            ),
            selectedMetricSnapshots: sources
              .filter((source) =>
                /\$|\d+%|\b\d+(?:\.\d+)?\b/.test(source.detail),
              )
              .slice(0, 12)
              .map((source) => ({
                id: source.id,
                name: source.name,
                detail: source.detail.slice(0, 500),
              })),
            selectedGaps: coverageReport.missingSegments,
            selectedCitations: sources.map((source) => ({
              id: source.id,
              name: source.name,
              type: source.type,
              confidence: source.confidence,
            })),
            artifactPlan: /\b(table|rank|compare|scorecard|chart)\b/i.test(
              trimmed,
            )
              ? ["table"]
              : ["prose"],
          },
          modelCall: {
            fallbackUsed: true,
            fallbackReason: "synthesis_trace_missing",
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
      groundingSources: clientGroundingPacket
        ? [clientGroundingPacket]
        : sources.slice(0, 4),
    });
    const followupRetiredFacts = scanRetiredFacts({
      tenantKey: tenantKeyForRetiredFactGate,
      tenantName: opts.tenant?.displayName ?? opts.surfaceContext?.activeClient,
      textBlocks: [{ location: "followups", text: JSON.stringify(followups) }],
    });
    if (followupRetiredFacts.length > 0) {
      yield {
        type: "error",
        error: clientSafeRetiredFactMessage(),
        retiredFactFindings: followupRetiredFacts,
      };
      return;
    }
    const guardedFollowups = sanitizeSuggestedQuestions(followups, {
      ...productTruthContext,
      groundingText: productTruthGroundingText([
        opts.surfaceContext,
        sources,
        factAvailabilityBlock,
        coverageReportBlock,
      ]),
    });
    yield {
      type: "followups",
      followups: guardedFollowups.questions
        .map(normalizeGeneratedFollowup)
        .filter(Boolean),
    };
    yield { type: "done" };
  } catch (err) {
    yield {
      type: "error",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
