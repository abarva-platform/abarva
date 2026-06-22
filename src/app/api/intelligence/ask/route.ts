import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { askIntelligence } from "@/lib/intelligence/ask";
import {
  classifySentinelIntent,
  runSentinelReasoning,
} from "@/lib/agents/sentinel-reasoning";
import type { SentinelCitation } from "@/lib/agents/sentinel-reasoning";
import { getCurrentPerson } from "@/lib/auth/maestro";
import { assembleUserContextBlock } from "@/lib/agent/prompts/_shared/user-context";
import type { AskSource, AskSurfaceContext } from "@/lib/intelligence/ask";
import {
  buildSentinelTrace,
  emitAgentContextTraceAsync,
  hashModelInput,
  type RawAskSource,
} from "@/lib/agent-trace";
import { randomUUID } from "node:crypto";
import { validateClaimsAndCitations } from "@/lib/agent-claims";
import {
  appendAskSessionTurn,
  normalizeAskTabId,
  prepareAskSessionMemory,
} from "@/lib/intelligence/ask/session-memory";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import type { CanonicalTenant } from "@/lib/tenant/CanonicalTenant";
import { recordSynthesisEvent } from "@/lib/reasoning/synthesis-telemetry";
import { routeQuestion } from "@/lib/intelligence/answer/router";
import { expertIndustryForClientKey } from "@/lib/intelligence/answer/expert-grounding";
import {
  buildStructuredExhibits,
  hasRenderableStructuredExhibits,
} from "@/lib/intelligence/answer/structured-exhibits";
import type { AgentAnswer } from "@/lib/intelligence/answer/agent-answer";
import "@/lib/reasoning/telemetry-init";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  return handleAsk(await parseGetPayload(req));
}

export async function POST(req: NextRequest) {
  return handleAsk(await parsePostPayload(req));
}

interface AskPayload {
  query: string;
  requestedClient: string | null;
  surfaceContext: AskSurfaceContext | null;
  tabId: string | null;
  /** Caller surface renders Markdown — allow light formatting (tables/bold). Default false. */
  richText: boolean;
}

async function handleAsk(payload: AskPayload) {
  const { query, requestedClient, surfaceContext, richText } = payload;
  if (!query.trim()) {
    return new Response(JSON.stringify({ error: "q required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let userContextBlock = "";
  let tenantId: string | null = null;
  let userId: string | null = null;
  let tenantInventoryKey: string | null = null;
  let tenantClientKey: string | null = null;
  let tenant: CanonicalTenant | null = null;
  const requestedOrSurfaceClient =
    requestedClient ??
    surfaceContext?.clientKey ??
    surfaceContext?.activeClient ??
    null;
  let sentinelClientId: string =
    requestedOrSurfaceClient ?? "unknown-active-tenant";
  let sessionUserId: string | null = null;
  let activePersonGraphNodeId: string | null = null;
  let activePersonDisplayName: string | null = null;
  try {
    const [person, clerkUser, client] = await Promise.all([
      getCurrentPerson(),
      currentUser().catch(() => null),
      resolveTenant({
        requestedClient,
        surfaceClientKey: surfaceContext?.clientKey,
        surfaceActiveClient: surfaceContext?.activeClient,
        allowFallback: false,
      }).catch(() => null),
    ]);
    tenant = client;
    sessionUserId = clerkUser?.id ?? null;
    const resolvedClient = client;
    tenantInventoryKey = resolvedClient?.canonicalKey ?? null;
    tenantClientKey = resolvedClient?.appClientKey ?? null;
    tenantId = resolvedClient?.clientId ?? null;
    sentinelClientId =
      resolvedClient?.clientId ??
      tenantInventoryKey ??
      tenantClientKey ??
      requestedOrSurfaceClient ??
      "unknown-active-tenant";
    if (person) {
      userId = person.id;
      activePersonGraphNodeId = person.graph_node_id;
      activePersonDisplayName = person.name;
      userContextBlock = await assembleUserContextBlock({
        personId: person.id,
        displayName: person.name,
        activeTenantDisplayName: resolvedClient?.displayName ?? null,
      });
    }
    userId = sessionUserId ?? userId;
  } catch (err) {
    console.warn("[ask.user-context]", err);
  }

  const memory = await prepareAskSessionMemory({
    tenantId,
    userId,
    tabId:
      tenantId && userId
        ? normalizeAskTabId(payload.tabId, userId, tenantId)
        : payload.tabId,
    query,
  }).catch((err) => {
    console.warn("[ask.session-memory.prepare]", err);
    return null;
  });
  await appendAskSessionTurn({
    sessionId: memory?.sessionId,
    tenantId,
    userId,
    role: "user",
    content: query,
    metadata: {
      client: requestedOrSurfaceClient,
      tabId: memory?.tabId ?? payload.tabId,
      surfaceContext,
    },
  }).catch((err) => console.warn("[ask.session-memory.user-turn]", err));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let assistantText = "";
      let classificationForMemory: unknown = null;
      let citationCount = 0;
      let patternId: string | null = null;
      let sawStreamError = false;
      // Agent-trace capture (Sentinel intelligence path).
      let traceSources: RawAskSource[] = [];
      let traceModelInputHash: string | undefined;
      try {
        if (memory?.sessionId) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "session",
                sessionId: memory.sessionId,
                tabId: memory.tabId,
                priorTurnCount: memory.priorTurnCount,
              }) + "\n",
            ),
          );
        }
        const sentinelIntent = await classifySentinelIntent({
          query,
          clientId: sentinelClientId,
          tenantKey: tenantInventoryKey ?? tenantClientKey,
          activeClient: surfaceContext?.activeClient,
          userId,
        });
        classificationForMemory = {
          intent: sentinelIntent.intent,
          confidence: sentinelIntent.confidence,
          matchedPatternSlugs: sentinelIntent.matchedPatternSlugs,
        };
        patternId = sentinelIntent.matchedPatternSlugs[0] ?? null;
        if (sentinelIntent.intent === "it_productivity") {
          const sentinelCitations: SentinelCitation[] = [];
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "classified",
                classification: {
                  intent: "it_productivity",
                  entities: sentinelIntent.entities,
                  confidence: sentinelIntent.confidence,
                  matchedPatternSlugs: sentinelIntent.matchedPatternSlugs,
                  reason: sentinelIntent.reason,
                },
              }) + "\n",
            ),
          );
          for await (const stage of runSentinelReasoning({
            query,
            clientId: sentinelClientId,
            userId,
            surfaceContext,
            conversationContextBlock: memory?.contextBlock,
            intelligenceSessionId: memory?.sessionId ?? null,
          })) {
            assistantText += `${stage.name}: ${stage.content}\n`;
            citationCount += stage.citations.length;
            sentinelCitations.push(...stage.citations);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "sentinel-stage", stage }) + "\n",
              ),
            );
          }
          const routing = routeQuestion({
            query,
            industry: expertIndustryForClientKey(tenantClientKey),
          });
          const exhibits = buildStructuredExhibits({
            prose: assistantText,
            routing,
            sources: sentinelSourcesFromCitations(sentinelCitations),
          });
          if (
            hasRenderableStructuredExhibits({ ...exhibits, graphs: [] }) ||
            exhibits.citations.length > 0 ||
            routing.experts.length > 0
          ) {
            const agentAnswer: AgentAnswer = {
              engineVersion: "agent-answer/v1",
              surface: "intelligence",
              expertId: routing.experts[0]?.id ?? null,
              contributingExperts: routing.experts,
              prose: exhibits.prose,
              tables: exhibits.tables,
              charts: exhibits.charts,
              graphs: [],
              citations: exhibits.citations,
              gaps: [],
              recommendedActions: [],
              groundingMode: exhibits.citations.some(
                (citation) => citation.sourceClass === "tenant-fact",
              )
                ? "mixed"
                : "industry-pattern",
              confidence: exhibits.citations.length > 0 ? "medium" : "low",
              limits: [
                "Charts and tables are emitted only when Ava has validated structured data; citations and expert attribution remain visible otherwise.",
              ],
              crossTenantBlocked: false,
            };
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: agentAnswer,
                }) + "\n",
              ),
            );
          }
          const event = recordSentinelTelemetry({
            startedAt,
            tenantId,
            instanceId:
              memory?.sessionId ??
              memory?.tabId ??
              requestedOrSurfaceClient ??
              "sentinel-ask",
            patternId,
            citationCount,
          });
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "done",
                telemetryEventId: event.id,
              }) + "\n",
            ),
          );
          return;
        }
        for await (const event of askIntelligence(query, {
          userContextBlock,
          tenantId,
          tenantClientKey,
          tenant,
          richText,
          userId,
          tenantInventoryKey,
          surfaceContext,
          conversationContextBlock: memory?.contextBlock,
          activePersonGraphNodeId,
          activePersonDisplayName,
          onModelInput: (parts) => {
            traceModelInputHash = hashModelInput(parts);
          },
        })) {
          if (event.type === "classified")
            classificationForMemory =
              event.classification ?? classificationForMemory;
          if (event.type === "sources") {
            citationCount = event.sources?.length ?? 0;
            patternId =
              event.sources?.find((source) => source.type === "PATTERN")?.id ??
              patternId;
            traceSources = (event.sources ?? []) as RawAskSource[];
          }
          if (event.type === "delta" && event.text) assistantText += event.text;
          if (event.type === "error") sawStreamError = true;
          if (event.type === "done") continue;
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
        if (!sawStreamError && assistantText.trim()) {
          const event = recordSentinelTelemetry({
            startedAt,
            tenantId,
            instanceId:
              memory?.sessionId ??
              memory?.tabId ??
              requestedOrSurfaceClient ??
              "sentinel-ask",
            patternId,
            citationCount,
          });
          // Observability · build the context-bundle trace, run post-response
          // claim/citation + tenant-isolation validation against it, stamp the
          // verdicts, then emit (non-blocking). IDs only; model input hashed.
          const sentinelTrace = buildSentinelTrace({
            questionId: randomUUID(),
            tenantId,
            tenantKey: tenantInventoryKey,
            surface: "intelligence",
            userIntent:
              (classificationForMemory as { intent?: string } | null)?.intent ??
              null,
            modelInputHash: traceModelInputHash ?? "no_model_call",
            responseId: event.id,
            citationObjectsEmitted: traceSources
              .map((s) => s.id)
              .filter((id): id is string => Boolean(id)),
            emittedAt: new Date().toISOString(),
            sources: traceSources,
          });
          let validation: ReturnType<typeof validateClaimsAndCitations> | null =
            null;
          try {
            validation = validateClaimsAndCitations({
              trace: {
                tenant_key: sentinelTrace.tenant_key,
                retrieved_tenant_context:
                  sentinelTrace.retrieved_tenant_context,
                retrieved_corpus_patterns:
                  sentinelTrace.retrieved_corpus_patterns,
                retrieved_artifacts: sentinelTrace.retrieved_artifacts,
                citation_objects_emitted:
                  sentinelTrace.citation_objects_emitted,
              },
              answerText: assistantText,
            });
            sentinelTrace.claim_validation_status =
              validation.claimValidationStatus;
            sentinelTrace.tenant_isolation_status =
              validation.tenantIsolationStatus;
          } catch {
            // Validation must never break the response path.
          }
          emitAgentContextTraceAsync(sentinelTrace);
          if (
            validation &&
            (validation.unsupportedClaims.length > 0 ||
              validation.namespaceFindings.length > 0 ||
              validation.tenantLeakage.length > 0)
          ) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "validation",
                  claimValidationStatus: validation.claimValidationStatus,
                  tenantIsolationStatus: validation.tenantIsolationStatus,
                  unsupportedClaims: validation.unsupportedClaims,
                  namespaceFindings: validation.namespaceFindings,
                  tenantLeakage: validation.tenantLeakage,
                }) + "\n",
              ),
            );
          }
          const routing = routeQuestion({
            query,
            industry: expertIndustryForClientKey(tenantClientKey),
          });
          const exhibits = buildStructuredExhibits({
            prose: assistantText,
            routing,
            sources: traceSources as AskSource[],
          });
          if (
            hasRenderableStructuredExhibits({ ...exhibits, graphs: [] }) ||
            exhibits.citations.length > 0 ||
            routing.experts.length > 0
          ) {
            const agentAnswer: AgentAnswer = {
              engineVersion: "agent-answer/v1",
              surface: "intelligence",
              expertId: routing.experts[0]?.id ?? null,
              contributingExperts: routing.experts,
              prose: exhibits.prose,
              tables: exhibits.tables,
              charts: exhibits.charts,
              graphs: [],
              citations: exhibits.citations,
              gaps: [],
              recommendedActions: [],
              groundingMode: exhibits.citations.some(
                (citation) => citation.sourceClass === "tenant-fact",
              )
                ? "mixed"
                : "industry-pattern",
              confidence: exhibits.citations.length > 0 ? "medium" : "low",
              limits: [
                "Charts and tables are emitted only when Ava has validated structured data; citations and expert attribution remain visible otherwise.",
              ],
              crossTenantBlocked: false,
            };
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: agentAnswer,
                }) + "\n",
              ),
            );
          }
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "done",
                telemetryEventId: event.id,
              }) + "\n",
            ),
          );
        } else if (!sawStreamError) {
          sawStreamError = true;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                error: "ask_synthesis_empty",
              }) + "\n",
            ),
          );
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              error: err instanceof Error ? err.message : "unknown",
            }) + "\n",
          ),
        );
      } finally {
        await appendAskSessionTurn({
          sessionId: memory?.sessionId,
          tenantId,
          userId,
          role: "assistant",
          content: assistantText,
          metadata: {
            client: requestedOrSurfaceClient,
            classification: classificationForMemory,
          },
        }).catch((err) =>
          console.warn("[ask.session-memory.assistant-turn]", err),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}

function sentinelSourcesFromCitations(
  citations: SentinelCitation[],
): AskSource[] {
  const seen = new Set<string>();
  const sources: AskSource[] = [];
  for (const citation of citations) {
    const key = citation.id || `${citation.label}:${citation.detail ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({
      type:
        citation.sourceType === "client_data"
          ? "TENANT"
          : citation.sourceType === "reasoning_trace"
            ? "GRAPH"
            : "PATTERN",
      id: citation.id || null,
      name: citation.label || citation.id || "Sentinel citation",
      detail: citation.detail ?? "",
      url: citation.url,
      confidence: undefined,
    });
  }
  return sources;
}

function recordSentinelTelemetry(input: {
  startedAt: number;
  tenantId: string | null;
  instanceId: string | null;
  patternId: string | null;
  citationCount: number;
}) {
  return recordSynthesisEvent({
    surface: "sentinel",
    tenantId: input.tenantId ?? undefined,
    instanceId: input.instanceId ?? "sentinel-ask",
    patternId: input.patternId,
    cacheHit: false,
    latencyMs: Math.max(0, Date.now() - input.startedAt),
    citationCount: input.citationCount,
    contradictionCount: 0,
    failureModeCount: 0,
    gateCount: 0,
  });
}

async function parseGetPayload(req: NextRequest): Promise<AskPayload> {
  const url = new URL(req.url);
  return {
    query: url.searchParams.get("q") ?? "",
    requestedClient: url.searchParams.get("client"),
    surfaceContext: parseSurfaceContext(url.searchParams.get("surfaceContext")),
    tabId:
      url.searchParams.get("tabId") ??
      req.cookies.get("ai-ask-tab-id")?.value ??
      null,
    richText: url.searchParams.get("format") === "rich",
  };
}

async function parsePostPayload(req: NextRequest): Promise<AskPayload> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    query: readString(payload.q) ?? readString(payload.query) ?? "",
    requestedClient: readString(payload.client),
    surfaceContext: normalizeSurfaceContext(payload.surfaceContext),
    tabId:
      readString(payload.tabId) ??
      req.cookies.get("ai-ask-tab-id")?.value ??
      null,
    richText:
      readString(payload.format) === "rich" || payload.richText === true,
  };
}

function parseSurfaceContext(raw: string | null): AskSurfaceContext | null {
  if (!raw) return null;
  try {
    return normalizeSurfaceContext(JSON.parse(raw));
  } catch {
    return null;
  }
}

function normalizeSurfaceContext(value: unknown): AskSurfaceContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return {
    activeTab: readString(record.activeTab),
    activeClient: readString(record.activeClient),
    clientKey: readString(record.clientKey),
    substrate: record.substrate,
    pageFacts: readStringArray(record.pageFacts),
    stageFacts: readStringArray(record.stageFacts),
    tenantFacts: readStringArray(record.tenantFacts),
    vendorFacts: readStringArray(record.vendorFacts),
    useCaseFacts: readStringArray(record.useCaseFacts),
    graphFacts: readStringArray(record.graphFacts),
    riskFacts: readStringArray(record.riskFacts),
    strategyFacts: readStringArray(record.strategyFacts),
    sourceFacts: readStringArray(record.sourceFacts),
    qualityFacts: readStringArray(record.qualityFacts),
    facts: readStringArray(record.facts),
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);
}
