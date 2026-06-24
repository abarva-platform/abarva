import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { askIntelligence } from "@/lib/intelligence/ask";
import { inferClientKeyFromEmail } from "@/lib/client-config";
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
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  buildHomeKnowAgentAnswer,
  homeKnowResponseToAvaAnswer,
  shouldUseHomeKnowAgentAnswer,
} from "@/lib/home/know/home-know-agent-answer";
import { appClientKeyForTenant, tenantAliasesFor } from "@/lib/tenant/aliases";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
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
  let signedInTenantAliases: string[] = [];
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
    signedInTenantAliases = aliasesForClerkTenant(clerkUser);
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
        if (shouldUseHomeKnowAgentAnswer({ query, surfaceContext })) {
          const foreignTenantAliases =
            signedInTenantAliases.length > 0
              ? signedInTenantAliases
              : [tenantInventoryKey, tenantClientKey].filter(Boolean);
          if (mentionsForeignTenant(query, foreignTenantAliases)) {
            const answer = buildHomeKnowTenantFenceAnswer({
              activeTenantDisplayName:
                tenant?.displayName ??
                surfaceContext?.activeClient ??
                requestedOrSurfaceClient ??
                "the signed-in tenant",
            });
            assistantText = answer.directAnswer;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer,
                }) + "\n",
              ),
            );
            const event = recordSentinelTelemetry({
              startedAt,
              tenantId,
              instanceId:
                memory?.sessionId ??
                memory?.tabId ??
                requestedOrSurfaceClient ??
                "home-know-ask",
              patternId: "home-know-fence",
              citationCount: 0,
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
          const homeTenantKey =
            tenantInventoryKey ??
            tenantClientKey ??
            requestedOrSurfaceClient ??
            null;
          let response: HomeKnowResponse;
          let answer: AvaAnswerPacket;
          try {
            const built = await buildHomeKnowAgentAnswer({
              question: query,
              tenantKey: homeTenantKey,
              client: tenantClientKey ?? requestedOrSurfaceClient,
            });
            response = built.response;
            answer = built.answer;
          } catch (err) {
            console.warn("[home-know.blank-guard]", err);
            response = buildHomeKnowRouteFallbackResponse({
              tenantKey:
                homeTenantKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
            });
            answer = homeKnowResponseToAvaAnswer(response);
          }
          classificationForMemory = {
            mode: "home-know",
            intent: response.intent,
            answerStatus: response.answerStatus,
          };
          assistantText = answer.directAnswer;
          citationCount = answer.citations.length;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "agent-answer",
                answer,
              }) + "\n",
            ),
          );
          const event = recordSentinelTelemetry({
            startedAt,
            tenantId,
            instanceId:
              memory?.sessionId ??
              memory?.tabId ??
              requestedOrSurfaceClient ??
              "home-know-ask",
            patternId: "home-know",
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
            hasRenderableStructuredExhibits(exhibits) ||
            exhibits.citations.length > 0 ||
            routing.experts.length > 0
          ) {
            const agentAnswer = composeAvaAnswer({
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey:
                tenantInventoryKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
              intent: routing.outputShape,
              status: "answered",
              directAnswer: exhibits.prose,
              interpretation:
                "This is an advisory synthesis: use the cited tenant context for client-specific claims and treat corpus/expert context as pattern support.",
              artifacts: [
                ...exhibits.tables.map((table) => ({
                  ...table,
                  artifact: "table" as const,
                })),
                ...exhibits.charts.map((chart) => ({
                  ...chart,
                  artifact: "chart" as const,
                })),
                ...exhibits.graphs.map((graph) => ({
                  ...graph,
                  artifact: "graph" as const,
                })),
              ],
              citations: exhibits.citations,
              caveats: [
                {
                  id: "validated-structure-only",
                  label: "Structured exhibits",
                  detail:
                    "Tables, charts, and graphs appear only when Ava has validated structured data.",
                },
              ],
              expertsUsed: routing.experts,
              corpusUsed: exhibits.citations.some(
                (citation) => citation.sourceClass !== "tenant-fact",
              )
                ? [{ id: "corpus-support", label: "Corpus or pattern support" }]
                : [],
              retrievalSummary: {
                substrate: "module_read_model",
                sourceCount: exhibits.citations.length,
                hasTenantFacts: exhibits.citations.some(
                  (citation) => citation.sourceClass === "tenant-fact",
                ),
                hasCorpus: exhibits.citations.some(
                  (citation) => citation.sourceClass !== "tenant-fact",
                ),
                hasExperts: routing.experts.length > 0,
              },
            });
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
            hasRenderableStructuredExhibits(exhibits) ||
            exhibits.citations.length > 0 ||
            routing.experts.length > 0
          ) {
            const agentAnswer = composeAvaAnswer({
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey:
                tenantInventoryKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
              intent: routing.outputShape,
              status: "answered",
              directAnswer: exhibits.prose,
              interpretation:
                "This is an advisory synthesis: use the cited tenant context for client-specific claims and treat corpus/expert context as pattern support.",
              artifacts: [
                ...exhibits.tables.map((table) => ({
                  ...table,
                  artifact: "table" as const,
                })),
                ...exhibits.charts.map((chart) => ({
                  ...chart,
                  artifact: "chart" as const,
                })),
                ...exhibits.graphs.map((graph) => ({
                  ...graph,
                  artifact: "graph" as const,
                })),
              ],
              citations: exhibits.citations,
              caveats: [
                {
                  id: "validated-structure-only",
                  label: "Structured exhibits",
                  detail:
                    "Tables, charts, and graphs appear only when Ava has validated structured data.",
                },
              ],
              expertsUsed: routing.experts,
              corpusUsed: exhibits.citations.some(
                (citation) => citation.sourceClass !== "tenant-fact",
              )
                ? [{ id: "corpus-support", label: "Corpus or pattern support" }]
                : [],
              retrievalSummary: {
                substrate: "module_read_model",
                sourceCount: exhibits.citations.length,
                hasTenantFacts: exhibits.citations.some(
                  (citation) => citation.sourceClass === "tenant-fact",
                ),
                hasCorpus: exhibits.citations.some(
                  (citation) => citation.sourceClass !== "tenant-fact",
                ),
                hasExperts: routing.experts.length > 0,
              },
            });
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

function mentionsForeignTenant(
  query: string,
  activeTenantAliases: Array<string | null | undefined>,
): boolean {
  const normalized = query.toLowerCase();
  const current = new Set(
    activeTenantAliases.flatMap((value) => tenantAliasesFor(value)),
  );
  const tenants = [
    {
      aliases: tenantAliasesFor("apexretail"),
      terms: ["apex retail", "apexretail"],
    },
    {
      aliases: tenantAliasesFor("arcturus"),
      terms: ["first capital", "arcturus", "firstcapital"],
    },
    {
      aliases: tenantAliasesFor("skyharbor"),
      terms: ["skyharbor", "skyharbor air"],
    },
    {
      aliases: tenantAliasesFor("meridian"),
      terms: ["meridian", "meridian health"],
    },
    { aliases: tenantAliasesFor("lakeshore"), terms: ["lakeshore"] },
  ];
  for (const tenant of tenants) {
    if (!tenant.terms.some((term) => normalized.includes(term))) continue;
    if (tenant.aliases.some((alias) => current.has(alias))) continue;
    return true;
  }
  return false;
}

function aliasesForClerkTenant(
  user: Awaited<ReturnType<typeof currentUser>>,
): string[] {
  const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
  const metadataClient =
    readString(metadata?.clientId) ??
    readString(metadata?.defaultClientId) ??
    readString(metadata?.tenantKey);
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  const appClientKey =
    appClientKeyForTenant(metadataClient) ?? inferClientKeyFromEmail(email);
  return appClientKey ? tenantAliasesFor(appClientKey) : [];
}

function buildHomeKnowTenantFenceAnswer(input: {
  activeTenantDisplayName: string;
}): AvaAnswerPacket {
  return composeAvaAnswer({
    surface: "home",
    mode: "KNOW",
    tenantKey: "signed-in-tenant",
    question: "cross-tenant request",
    intent: "tenant_fence",
    status: "blocked",
    directAnswer: `I can't share or use another tenant's data from Home. Your signed-in session is fenced to ${input.activeTenantDisplayName}; ask from this tenant's loaded context only.`,
    citations: [],
    gaps: [
      {
        id: "tenant-fence",
        label: "Tenant fence",
        detail: "Cross-tenant data is fenced by the signed-in session tenant.",
      },
    ],
    caveats: [
      {
        id: "blocked-before-retrieval",
        label: "Blocked before retrieval",
        detail: "Cross-tenant request blocked before retrieval.",
      },
    ],
    retrievalSummary: {
      substrate: "none",
      hasTenantFacts: false,
    },
  });
}

function buildHomeKnowRouteFallbackResponse(input: {
  tenantKey: string;
  question: string;
}): HomeKnowResponse {
  const normalized = input.question.toLowerCase();
  const wantsGraph =
    /\b(graph|map|topolog|dependency|dependencies|relationship|relationships|lineage|integration|interfaces?)\b/i.test(
      input.question,
    );
  const wantsChart =
    !wantsGraph &&
    /\b(chart|visuali[sz]e|visual|plot|waterfall)\b/i.test(input.question);
  const wantsTable = /\b(table|list|show|compare|comparing)\b/i.test(
    input.question,
  );
  const citation = {
    id: "c1",
    label: `Home KNOW context model for ${input.tenantKey}`,
    sourceClass: "tenant-fact" as const,
    sourceFile: null,
    sourceRowNumber: null,
    excerpt:
      "Home KNOW fallback guard returned a specific artifact gap instead of a blank response.",
    confidence: "low" as const,
  };
  const gaps = [
    {
      id: "gap-home-know-blank-guard",
      dimensionId: wantsGraph
        ? "relationship_graph"
        : wantsChart
          ? "chart_artifact"
          : "home_read_model",
      objectType: wantsGraph
        ? "relationship edge"
        : wantsChart
          ? "numeric series"
          : "home context model",
      expectedField: wantsGraph
        ? "source_to_target_edge_pair"
        : wantsChart
          ? "chart_value_series"
          : "query_result_rows",
      displayLabel: wantsGraph
        ? "Graph edge pairs"
        : wantsChart
          ? "Chart value series"
          : "Home context rows",
      severity: "high" as const,
      message: wantsGraph
        ? "source-to-target integration edge pairs did not return for this graph request"
        : wantsChart
          ? "the numeric value series needed for this chart did not return for this request"
          : "Home context rows did not return for this request",
      citationIds: [citation.id],
    },
  ];
  return {
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: wantsChart || wantsGraph ? "chart" : wantsTable ? "table" : "gap",
    answerStatus: "partial",
    prose:
      "I could not assemble a complete Home artifact for this request, so I am returning the specific source gap instead of a blank answer.",
    dimensionsUsed: [
      wantsGraph
        ? "relationship_graph"
        : wantsChart
          ? "chart_artifact"
          : "home_read_model",
    ],
    facts: [],
    tables: wantsTable
      ? [
          {
            id: "home-context-model-gap-table",
            title: "Home Artifact Gap",
            dimensionId: "home_read_model",
            columns: [
              { key: "request", label: "Request" },
              { key: "gap", label: "Specific Gap" },
            ],
            rows: [
              {
                request: normalized.includes("security")
                  ? "security/compliance table"
                  : normalized.includes("initiative")
                    ? "initiative comparison table"
                    : "requested Home table",
                gap:
                  gaps[0]?.message ??
                  "Home context rows did not return for this request",
              },
            ],
            citationIds: [citation.id],
          },
        ]
      : [],
    charts: wantsChart
      ? [
          {
            id: "home-chart-gap",
            title: "Chart Data Gap",
            kind: "bar",
            type: "bar",
            dimensionId: "chart_artifact",
            data: [],
            sourceIds: [],
            citationIds: [citation.id],
            caveats: [gaps[0]?.message ?? "chart value series missing"],
            status: "unavailable",
          },
        ]
      : [],
    graphs: wantsGraph
      ? [
          {
            id: "home-graph-gap",
            title: "Graph Edge Gap",
            nodes: [],
            edges: [],
            nodeTypes: [],
            edgeTypes: [],
            sourceIds: [],
            citationIds: [citation.id],
            confidence: "low",
            gaps: [
              gaps[0]?.message ?? "source-to-target integration edges missing",
            ],
            inferredEdges: false,
            warning: gaps[0]?.message,
          },
        ]
      : [],
    gaps,
    conflicts: [],
    citations: [citation],
    handoff: null,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved: 0,
      frontendTripwireShouldFire: false,
    },
  };
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
