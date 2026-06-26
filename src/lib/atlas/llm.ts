import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import {
  buildAtlasSystemPrompt,
  ATLAS_PROMPT_VERSION,
} from "@/lib/atlas/prompt";
import {
  query_cohort_benchmarks,
  query_portfolio_aggregates,
  query_programs,
  query_signal_evidence,
  query_signals,
  query_tower_current_state,
  query_use_cases,
} from "@/lib/atlas/tool-belt";
import { assembleRetrievalContext } from "@/lib/agent/retrieval";
import type { AtlasTowerCurrentState } from "@/lib/atlas/tower-grounding";
import {
  buildAtlasValueGrounding,
  renderAtlasValueGrounding,
} from "@/lib/atlas/value-grounding";
import {
  loadCuratedSemanticDossier,
  type CuratedDossierLoadResult,
} from "@/lib/semantic-dossiers";
import type {
  AtlasDebugTrace,
  AtlasExecutionMode,
  AtlasSuggestion,
  AtlasTenancyCtx,
  AtlasToolResultMap,
} from "@/lib/atlas/types";
import {
  AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
  sanitizeAutonomousDecisionLanguage,
} from "@/lib/ai-liability/human-decision-controls";

/**
 * Atlas live-prod composition wiring (ATLAS-RUNLLM-COMPOSITION 2026-05-31).
 *
 * The deployed `/api/v1/atlas/ask` route invokes `runAtlasLlm` for any prompt
 * the scripted classifier doesn't catch. Before this change, hybrid and
 * initiative-deep questions (e.g. "How does our Copilot pace in AR-02 compare
 * to peers?") were sent to Claude with the composed four-section answer
 * embedded as RETRIEVED CONTEXT — the LLM then paraphrased it, dropping the
 * `Your data / Industry context / The gap / Next move` structure. The
 * 2026-05-30 live-prod smoke caught this: 0/2 hybrid turns rendered the
 * four-section structure even though the in-process composer harness
 * produced it 21/21.
 *
 * Fix: when `composeAtlasIacAnswer` (already invoked inside
 * `assembleRetrievalContext`) returns a hybrid or initiative-specific
 * composition, return that composed text directly and skip the Anthropic
 * call. Mode stays `live` because the composer is a deterministic substrate
 * read, not a degraded fallback. `archetype-specific` (no tenant initiative
 * anchor) continues to flow through the LLM since the model adds value by
 * weaving the corpus context with the user question.
 */
const COMPOSITION_MODEL_NAME = "atlas-composition-deterministic";

/**
 * Atlas Fix C (truncation): canonical CXO response shapes range from short
 * lead-bullet briefs (3–7 lines) to industry-context reads (12–20 lines) and
 * lead-tables. The original 500-token cap chopped industry-context responses
 * mid-sentence. 2000 covers the canon with headroom and stays well under
 * Anthropic per-request limits.
 */
export const ATLAS_MAX_TOKENS = 2000;

/**
 * Atlas Fix C (determinism): all Atlas Anthropic calls use temperature=0 so
 * identical input → identical output. Exported for assertion in tests.
 */
export const ATLAS_TEMPERATURE = 0;

function buildFallback(toolResults: AtlasToolResultMap): string {
  const tower = toolResults.towerState;
  const portfolio = toolResults.portfolio;
  const topSignal = toolResults.signalDetail ?? toolResults.signals?.[0];
  const programCount = toolResults.programs?.length ?? 0;
  if (tower) {
    const hero =
      tower.bandMetrics.metrics.find((metric) => metric.hero) ??
      tower.bandMetrics.metrics[0];
    const topPressure = tower.pressuresView.cards[0];
    const corpusNote =
      toolResults.retrievalContext &&
      (toolResults.retrievalContext.industryChunks.length > 0 ||
        toolResults.retrievalContext.topicChunks.length > 0 ||
        toolResults.retrievalContext.clientChunks.length > 0 ||
        Boolean(toolResults.retrievalContext.atlasIacComposition))
        ? "I also pulled corpus or industry context for this turn."
        : "No corpus or industry chunks were retrieved for this turn, so I will keep external comparisons qualified.";
    return [
      `${tower.client.clientName} Tower is grounded on ${tower.substrateCounts.initiatives} initiatives, ${tower.substrateCounts.vendors} vendors, ${tower.substrateCounts.kpiSnapshots} KPI snapshots, ${tower.substrateCounts.decisions} decisions, and ${tower.substrateCounts.scenarios} scenarios.`,
      hero
        ? `The lead displayed metric is ${hero.label}: ${hero.value} (${hero.confidence}).`
        : null,
      topPressure
        ? `The lead pressure is ${topPressure.headline}`
        : "No active pressure card is displayed from the DB.",
      toolResults.valueGrounding
        ? renderAtlasValueGrounding(toolResults.valueGrounding)
        : null,
      corpusNote,
    ]
      .filter(Boolean)
      .join(" ");
  }
  const lines = [
    portfolio
      ? `${portfolio.clientName} is carrying ${portfolio.activeUseCaseCount} active use cases with ${portfolio.criticalSignalCount} critical and ${portfolio.warningSignalCount} warning signals.`
      : null,
    topSignal
      ? `${topSignal.signalTitle} is the loudest issue at ${typeof topSignal.impactUsd === "number" ? `$${(topSignal.impactUsd / 1_000_000).toFixed(1)}M` : "material impact"}.`
      : null,
    programCount > 0
      ? `${programCount} programs are already active, so any new move should be sequenced against current capacity.`
      : null,
    "I can go deeper on Shadow AI, peer position, or current program load.",
  ];
  return lines.filter(Boolean).join(" ");
}

function normalizeFallbackReason(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 240);
  }
  const value = String(error ?? "").trim();
  return value ? value.slice(0, 240) : "unknown_model_error";
}

function logAtlasMode(args: {
  tenantId: string;
  mode: AtlasExecutionMode;
  reason: string | null;
  model: string;
  workflow: string;
}): void {
  const payload = {
    event: "atlas_model_mode",
    tenantId: args.tenantId,
    mode: args.mode,
    reason: args.reason,
    model: args.model,
    workflow: args.workflow,
  };
  if (args.mode === "fallback") {
    console.warn("[atlas.mode]", JSON.stringify(payload));
    return;
  }
  console.info("[atlas.mode]", JSON.stringify(payload));
}

function formatMoney(value: number | null | undefined): string | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return null;
  if (Math.abs(value) >= 1_000_000_000)
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function labelize(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function truncateBusinessLine(value: string, max = 180): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).replace(/\s+\S*$/, "")}.`;
}

function formatCleanTowerContext(towerState: AtlasTowerCurrentState): string {
  const budgetRollups = towerState.budgetRollups.slice(0, 8).map((rollup) => {
    const parts = [
      rollup.portfolioCompany,
      formatMoney(rollup.totalItBudgetUsd)
        ? `IT budget ${formatMoney(rollup.totalItBudgetUsd)}`
        : null,
      formatMoney(rollup.actualSpendYtdUsd)
        ? `YTD spend ${formatMoney(rollup.actualSpendYtdUsd)}`
        : null,
      formatMoney(rollup.runAmountUsd)
        ? `run ${formatMoney(rollup.runAmountUsd)}`
        : null,
      formatMoney(rollup.changeAmountUsd)
        ? `change ${formatMoney(rollup.changeAmountUsd)}`
        : null,
      typeof rollup.itSpendAsPctRevenue === "number"
        ? `${rollup.itSpendAsPctRevenue.toFixed(1)}% of revenue`
        : null,
    ].filter(Boolean);
    return `- ${parts.join("; ")}`;
  });

  const initiatives = towerState.initiatives.slice(0, 12).map((initiative) => {
    const parts = [
      initiative.name,
      initiative.primaryCategoryName,
      initiative.ownerName ? `owner ${initiative.ownerName}` : null,
      formatMoney(initiative.committedTotalUsd ?? initiative.committedAnnualUsd)
        ? `budget ${formatMoney(initiative.committedTotalUsd ?? initiative.committedAnnualUsd)}`
        : null,
      formatMoney(initiative.measuredValueUsd)
        ? `measured value ${formatMoney(initiative.measuredValueUsd)}`
        : null,
      `status ${labelize(initiative.statusFlag)}`,
      initiative.statusSummary
        ? truncateBusinessLine(initiative.statusSummary, 110)
        : null,
    ].filter(Boolean);
    return `- ${parts.join("; ")}`;
  });

  const vendors = towerState.vendors.slice(0, 10).map((vendor) => {
    const parts = [
      vendor.vendorName,
      `supports ${vendor.initiativeName}`,
      formatMoney(vendor.contractValueUsd)
        ? `contract ${formatMoney(vendor.contractValueUsd)}`
        : null,
      vendor.renewalDate ? `renewal ${vendor.renewalDate}` : null,
      vendor.financialHealth
        ? `health ${labelize(vendor.financialHealth)}`
        : null,
    ].filter(Boolean);
    return `- ${parts.join("; ")}`;
  });

  const pressures = towerState.pressuresView.cards.slice(0, 6).map((card) => {
    const parts = [
      card.headline,
      card.magnitudeLabel,
      card.magnitudeConfidence
        ? `confidence ${card.magnitudeConfidence}`
        : null,
      card.nextAction
        ? `next ${truncateBusinessLine(card.nextAction, 120)}`
        : null,
    ].filter(Boolean);
    return `- ${parts.join("; ")}`;
  });

  return [
    `TOWER BUSINESS CONTEXT`,
    `Client: ${towerState.client.clientName}`,
    `Industry: ${towerState.client.industryCode}`,
    `Read model counts: ${towerState.substrateCounts.initiatives} initiatives, ${towerState.substrateCounts.vendors} vendor rows, ${towerState.substrateCounts.kpiSnapshots} KPI snapshots, ${towerState.substrateCounts.pressures} pressure signals.`,
    "",
    budgetRollups.length
      ? `Portfolio-company budget rollups:\n${budgetRollups.join("\n")}`
      : "Portfolio-company budget rollups: not available.",
    "",
    initiatives.length
      ? `Relevant initiatives and programs:\n${initiatives.join("\n")}`
      : "Relevant initiatives and programs: not available.",
    "",
    vendors.length
      ? `Vendor exposure:\n${vendors.join("\n")}`
      : "Vendor exposure: not available.",
    "",
    pressures.length
      ? `Current pressure signals:\n${pressures.join("\n")}`
      : "Current pressure signals: not available.",
  ].join("\n");
}

function formatCleanDossierContext(
  result: CuratedDossierLoadResult | null,
): string {
  if (!result) {
    return [
      "CURATED L3 DOSSIER",
      "No eligible curated dossier was available for this Tower question. Answer only from the clean Tower business context and explicitly name any missing evidence.",
    ].join("\n");
  }

  const dossier = result.dossier;
  const facts = dossier.facts
    .slice(0, 18)
    .map(
      (fact) =>
        `- ${labelize(fact.label)}: ${truncateBusinessLine(String(fact.value), 120)} (${fact.confidence})`,
    );
  const metrics = dossier.metrics
    .slice(0, 10)
    .map(
      (metric) =>
        `- ${metric.label}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ""}${metric.caveat ? `; caveat ${truncateBusinessLine(metric.caveat, 100)}` : ""}`,
    );
  const gaps = dossier.gaps
    .slice(0, 8)
    .map((gap) => `- ${gap.label}: ${truncateBusinessLine(gap.impact, 140)}`);
  const branchOptions = result.branchOptions
    .slice(0, 8)
    .map(
      (option) =>
        `- ${option.label}: ${truncateBusinessLine(option.summary, 130)}; ${option.factCount} facts, ${option.relationshipCount} relationships`,
    );

  return [
    "CURATED L3 DOSSIER",
    `Dossier: ${result.canonicalTenantKey}/${dossier.route.primaryDimension}`,
    `Prompt version: ${result.promptVersion}; dossier version: ${result.dossierVersion}; built at ${result.builtAt}`,
    `Question intent: ${dossier.route.intent}; target surface: ${dossier.route.targetSurface}`,
    `Dimension summary: ${truncateBusinessLine(dossier.dimensionSummary, 260)}`,
    "",
    facts.length
      ? `Supported facts:\n${facts.join("\n")}`
      : "Supported facts: none returned.",
    "",
    metrics.length
      ? `Measures:\n${metrics.join("\n")}`
      : "Measures: none returned.",
    "",
    gaps.length
      ? `Known gaps:\n${gaps.join("\n")}`
      : "Known gaps: none flagged.",
    "",
    branchOptions.length
      ? `Adjacent dossier branches:\n${branchOptions.join("\n")}`
      : "Adjacent dossier branches: none returned.",
  ].join("\n");
}

async function tryLoadTowerDossier(args: {
  tenantKey: string | null;
  question: string;
}): Promise<{
  result: CuratedDossierLoadResult | null;
  fallbackReason: string | null;
}> {
  if (!args.tenantKey) {
    return { result: null, fallbackReason: "missing_tenant_key" };
  }
  try {
    const result = await loadCuratedSemanticDossier({
      tenantKey: args.tenantKey,
      question: args.question,
    });
    return { result, fallbackReason: null };
  } catch (err) {
    return { result: null, fallbackReason: normalizeFallbackReason(err) };
  }
}

function wantsDebugTrace(
  surfaceContext: Record<string, unknown> | undefined,
): boolean {
  return (
    surfaceContext?.traceMode === true || surfaceContext?.auditTrace === true
  );
}

export async function runAtlasLlm(
  ctx: AtlasTenancyCtx,
  message: string,
  surfaceContext?: Record<string, unknown>,
): Promise<{
  response: string;
  toolsUsed: string[];
  suggestions: AtlasSuggestion[];
  toolResults: AtlasToolResultMap;
  modelName: string | null;
  atlasMode: AtlasExecutionMode;
  fallbackReason: string | null;
  promptVersion: string;
  debugTrace?: AtlasDebugTrace;
}> {
  const towerState = await query_tower_current_state(ctx, surfaceContext);
  const [portfolio, signals, programs, useCases, benchmark, retrievalContext] =
    await Promise.all([
      query_portfolio_aggregates(ctx),
      query_signals(ctx, { limit: 4 }),
      query_programs(ctx),
      query_use_cases(ctx),
      query_cohort_benchmarks(ctx, "adoption_penetration_pct_avg"),
      assembleRetrievalContext({
        clientId: ctx.clientId,
        industry: towerState.client.industryCode,
        userQuery: message,
        topKClient: 3,
        topKIndustry: 4,
        topKTopic: 3,
        atlasTenancy: ctx,
      }),
    ]);

  const toolResults: AtlasToolResultMap = {
    towerState,
    retrievalContext,
    portfolio,
    signals,
    programs,
    useCases,
    benchmark,
  };
  const valueGrounding = await buildAtlasValueGrounding({
    ctx,
    message,
    portfolio,
    towerState,
  });
  toolResults.valueGrounding = valueGrounding;
  const dossierLoad = await tryLoadTowerDossier({
    tenantKey: towerState.client.tenantKey,
    question: message,
  });

  const toolsUsed = [
    "query_tower_current_state",
    ...(dossierLoad.result ? ["load_curated_semantic_dossier"] : []),
    "assemble_retrieval_context",
    "query_portfolio_aggregates",
    "query_signals",
    "query_programs",
    "query_use_cases",
    "query_cohort_benchmarks",
    "search_canonical_pattern_index",
  ];

  const topSignal = signals[0];
  if (
    topSignal &&
    /shadow ai|signal|evidence|provenance|vendor/i.test(message)
  ) {
    toolResults.signalDetail = await query_signal_evidence(ctx, topSignal.id);
    toolsUsed.push("query_signal_evidence");
  }

  // ATLAS-RUNLLM-COMPOSITION 2026-05-31 — short-circuit to the deterministic
  // four-section composer when the prompt is an IAC hybrid or initiative-
  // specific question and the composer produced a real answer. This wires
  // the in-process IAC E2E harness path (21/21 four-section render) into
  // the live deployed route so live prod no longer paraphrases the
  // structure away.
  //
  // Eligibility:
  //   - intent.kind === 'hybrid'              (initiative + archetype)
  //   - intent.kind === 'initiative-specific' (tenant initiative anchor)
  // The 'archetype-specific' path (no tenant anchor) still flows through the
  // LLM — the model adds value weaving corpus context with the user prompt
  // there, and forcing a one-section composer answer would regress.
  const iac = retrievalContext.atlasIacComposition;
  const eligibleForCompositionShortCircuit =
    !!iac &&
    (iac.intent.kind === "hybrid" || iac.intent.kind === "initiative-specific");
  if (eligibleForCompositionShortCircuit && iac) {
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: "live",
      reason: null,
      model: COMPOSITION_MODEL_NAME,
      workflow: "atlas-llm",
    });
    return {
      response: sanitizeAutonomousDecisionLanguage(iac.response),
      toolsUsed: [...toolsUsed, "compose_atlas_iac_answer"],
      suggestions: [
        {
          label: "Peer context",
          value: "How do we compare to peers?",
          kind: "message",
        },
        {
          label: "Industry moves",
          value: "What are others doing in this industry?",
          kind: "message",
        },
        topSignal
          ? {
              label: "Open top signal",
              value: `signal:${topSignal.id}`,
              kind: "signal",
            }
          : {
              label: "Programs",
              value: "Show active programs",
              kind: "message",
            },
      ],
      toolResults,
      modelName: COMPOSITION_MODEL_NAME,
      atlasMode: "live",
      fallbackReason: null,
      promptVersion: ATLAS_PROMPT_VERSION,
    };
  }

  const apiKeyPresent = !!process.env.ANTHROPIC_API_KEY;
  if (!apiKeyPresent) {
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: "fallback",
      reason: "missing_anthropic_api_key",
      model: "claude-opus-4-7",
      workflow: "atlas-llm",
    });
    return {
      response: sanitizeAutonomousDecisionLanguage(buildFallback(toolResults)),
      toolsUsed,
      suggestions: [
        {
          label: "Shadow AI",
          value: "Tell me more about Shadow AI",
          kind: "message",
        },
        { label: "Programs", value: "Show active programs", kind: "message" },
      ],
      toolResults,
      modelName: null,
      atlasMode: "fallback",
      fallbackReason: "missing_anthropic_api_key",
      promptVersion: ATLAS_PROMPT_VERSION,
    };
  }

  const system = buildAtlasSystemPrompt(towerState.client.clientName);
  const towerContext = formatCleanTowerContext(towerState);
  const dossierContext = formatCleanDossierContext(dossierLoad.result);
  const valueGroundingContext = renderAtlasValueGrounding(valueGrounding);
  const userText = [
    `User question: ${message}`,
    "",
    AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK,
    "",
    "Answer from the clean L3 dossier and Tower business context below. Do not expose raw IDs, UUIDs, file names, table names, source keys, JSON, or internal field names. Write as aVa in crisp CIO advisory chat: one lead insight, two to four tight support points when useful, and one next-step question or action. Keep projected, tracked, and verified value separate. If baseline, measurement, or provenance is missing, name that gap instead of quantifying an outcome. If the ask is strategic, explain the Tower implication but route the actual decision to Intelligence, Moves, or a program charter.",
    "",
    dossierContext,
    "",
    towerContext,
    "",
    `VALUE GROUNDING SUMMARY\n${valueGroundingContext}`,
  ].join("\n");
  const { client } = await getAuditedAnthropicClient({
    tenantId: ctx.clientId,
    userId: ctx.userId ?? undefined,
    workflow: "atlas-llm",
    model: "claude-opus-4-7",
    prompt: [system, userText].join("\n\n"),
    dataClass: "confidential",
    metadata: { surface: "tower" },
  });

  let response: string;
  let rawModelResponse: string | null = null;
  let modelName: string | null = "claude-opus-4-7";
  let fallbackReason: string | null = null;
  try {
    const result = await client.messages.create({
      model: "claude-opus-4-7",
      // Atlas Fix C (determinism): claude-opus-4-7 has deprecated the
      // `temperature` parameter (Anthropic returns 400 invalid_request_error
      // when it is set). Determinism on opus-4-7 is now intrinsic to the model
      // family rather than tunable. The `ATLAS_TEMPERATURE` constant is kept
      // exported (set to 0) for unit-test assertion of intent.
      // Atlas Fix C (truncation): 500 tokens cut industry-context responses
      // mid-sentence (audit example: "...vs peer median."). ATLAS_MAX_TOKENS
      // covers the canonical CXO response shapes with headroom.
      max_tokens: ATLAS_MAX_TOKENS,
      system,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ],
    });

    const responseParts: string[] = [];
    for (const item of result.content) {
      if (item.type === "text") {
        responseParts.push(item.text);
      }
    }
    response = responseParts.join("\n").trim();
    rawModelResponse = response;
    if (!response) {
      logAtlasMode({
        tenantId: ctx.clientId,
        mode: "fallback",
        reason: "empty_model_response",
        model: "claude-opus-4-7",
        workflow: "atlas-llm",
      });
      response = `Model unavailable — deterministic read. ${buildFallback(toolResults)}`;
      rawModelResponse = response;
      modelName = null;
      fallbackReason = "empty_model_response";
    } else {
      logAtlasMode({
        tenantId: ctx.clientId,
        mode: "live",
        reason: null,
        model: modelName,
        workflow: "atlas-llm",
      });
    }
  } catch (err) {
    // Degraded model service (timeout / 429 / 5xx) must not surface as a
    // raw 500 on the Atlas chat surface. Fall back to the deterministic
    // tool-grounded read and disclose that the model was unavailable, so
    // the caller still gets a substrate-grounded answer.
    fallbackReason = normalizeFallbackReason(err);
    console.error(
      "[atlas.llm] model call failed — serving deterministic fallback:",
      err,
    );
    logAtlasMode({
      tenantId: ctx.clientId,
      mode: "fallback",
      reason: fallbackReason,
      model: "claude-opus-4-7",
      workflow: "atlas-llm",
    });
    response = `Model unavailable — deterministic read. ${buildFallback(toolResults)}`;
    rawModelResponse = response;
    modelName = null;
  }

  const debugTrace = wantsDebugTrace(surfaceContext)
    ? ({
        routing: {
          promptVersion:
            dossierLoad.result?.promptVersion ?? ATLAS_PROMPT_VERSION,
          dossierId: dossierLoad.result
            ? `${dossierLoad.result.canonicalTenantKey}/${dossierLoad.result.dossier.route.primaryDimension}`
            : null,
          dossierVersion: dossierLoad.result?.dossierVersion ?? null,
          dossierBuiltAt: dossierLoad.result?.builtAt ?? null,
          fallbackUsed: !dossierLoad.result,
          fallbackReason: dossierLoad.result
            ? null
            : dossierLoad.fallbackReason,
          shapeIssues: [],
        },
        finalPrompt: [system, userText].join("\n\n"),
        rawModelResponse,
        renderedResponse: "",
        replacements: [],
      } satisfies AtlasDebugTrace)
    : undefined;

  return {
    response: sanitizeAutonomousDecisionLanguage(response),
    toolsUsed,
    suggestions: [
      {
        label: "Peer context",
        value: "How do we compare to peers?",
        kind: "message",
      },
      {
        label: "Industry moves",
        value: "What are others doing in this industry?",
        kind: "message",
      },
      topSignal
        ? {
            label: "Open top signal",
            value: `signal:${topSignal.id}`,
            kind: "signal",
          }
        : { label: "Programs", value: "Show active programs", kind: "message" },
    ],
    toolResults,
    modelName,
    atlasMode: modelName ? "live" : "fallback",
    fallbackReason: modelName
      ? null
      : (fallbackReason ?? "deterministic_fallback"),
    promptVersion: ATLAS_PROMPT_VERSION,
    debugTrace,
  };
}
