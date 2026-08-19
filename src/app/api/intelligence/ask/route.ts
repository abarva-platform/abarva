import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { askIntelligence } from "@/lib/intelligence/ask";
import {
  buildClientSafeRetiredFactMessage,
  scanRetiredFacts,
} from "@/lib/intelligence/ask/retired-fact-gate";
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
  buildAvaTrace,
  emitAgentContextTraceAsync,
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
  advisorRequiredArtifactForQuery,
  withAdvisorSupportSources,
} from "@/lib/intelligence/ask/advisor-composer";
import { buildIndustrialCioBackofficeNativeCanvasBlock } from "@/lib/intelligence/ask/industrial-cio-backoffice-source";
import { buildSkyHarborCtoReadinessNativeCanvasBlock } from "@/lib/intelligence/ask/skyharbor-cto-readiness-source";
import {
  buildStructuredExhibits,
  hasRenderableStructuredExhibits,
} from "@/lib/intelligence/answer/structured-exhibits";
import { createStructuredFenceStreamFilter } from "@/lib/intelligence/answer/structured-fence-stream-filter";
import { parseIntelligenceTabbedResponse } from "@/lib/intelligence/tabbed-response";
import { applyCxoAnswerModeFallbacks } from "@/lib/intelligence/ask/answer-mode-registry";
import { classifyAbarvaAnswerMode } from "@/lib/intelligence/ask/response-policy";
import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import {
  scrubInternalVisibleAvaTerms,
  scrubPublicAvaAnswerText,
  scrubPublicAvaSourceText,
  scrubVisibleAvaDataStateLanguage,
} from "@/lib/ava-answer/public-answer-scrub";
import { sanitizeAgentAnswerForRender } from "@/lib/intelligence/answer/answer-safety";
import {
  homeKnowResponseToAvaAnswer,
  shouldUseHomeKnowAgentAnswer,
} from "@/lib/home/know/home-know-agent-answer";
import { buildHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import { appClientKeyForTenant, tenantAliasesFor } from "@/lib/tenant/aliases";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import {
  createIntelligenceLatencyTrace,
  type IntelligenceLatencyTiming,
} from "@/lib/intelligence/latency-trace";
import "@/lib/reasoning/telemetry-init";
import {
  applyProductTruthRuntimeGuard,
  productTruthGroundingText,
} from "@/lib/agent/product-truth";
import {
  buildSourceWorkspaceVisualAnswer,
  canBuildSourceWorkspaceVisualAnswer,
} from "@/lib/source/ava/source-workspace-visual-answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  return handleAsk(await parseGetPayload(req), req);
}

export async function POST(req: NextRequest) {
  return handleAsk(await parsePostPayload(req), req);
}

interface AskPayload {
  query: string;
  requestedClient: string | null;
  surfaceContext: AskSurfaceContext | null;
  tabId: string | null;
  traceEnabled: boolean;
  richText: boolean;
  answerOnlyStreaming: boolean;
}

async function handleAsk(payload: AskPayload, req: NextRequest) {
  const {
    query,
    requestedClient,
    surfaceContext,
    richText,
    answerOnlyStreaming,
  } = payload;
  if (!query.trim()) {
    return new Response(JSON.stringify({ error: "q required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const routeTrace = createIntelligenceLatencyTrace({
    requestId: randomUUID(),
  });
  const preStreamTimings: IntelligenceLatencyTiming[] = [
    routeTrace.mark("route.request.accepted", {
      richText,
      method: req.method,
      requestedClient: requestedClient ?? surfaceContext?.clientKey ?? null,
    }),
  ];
  const capturePreStreamTiming = (timing: IntelligenceLatencyTiming) => {
    preStreamTimings.push(timing);
  };

  let userContextBlock = "";
  let tenantId: string | null = null;
  let userId: string | null = null;
  let tenantInventoryKey: string | null = null;
  let tenantClientKey: string | null = null;
  let tenant: CanonicalTenant | null = null;
  let sessionTenant: CanonicalTenant | null = null;
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
  let includeTrace = false;
  const authStartedAt = Date.now();
  try {
    const [person, clerkUser, client, sessionClient] = await Promise.all([
      getCurrentPerson(),
      currentUser().catch(() => null),
      resolveTenant({
        requestedClient,
        surfaceClientKey: surfaceContext?.clientKey,
        surfaceActiveClient: surfaceContext?.activeClient,
        allowFallback: false,
      }).catch(() => null),
      resolveTenant({ allowFallback: false }).catch(() => null),
    ]);
    tenant = client;
    sessionTenant = sessionClient;
    sessionUserId = clerkUser?.id ?? null;
    includeTrace = shouldIncludeIntelligenceTrace(req, clerkUser, person);
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
  capturePreStreamTiming(
    routeTrace.finish("route.auth_tenant.done", authStartedAt, {
      tenantId,
      tenantClientKey,
      userId,
      includeTrace,
    }),
  );

  const memoryStartedAt = Date.now();
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
  capturePreStreamTiming(
    routeTrace.finish("route.session_memory.prepare.done", memoryStartedAt, {
      hasSession: Boolean(memory?.sessionId),
      priorTurnCount: memory?.priorTurnCount ?? 0,
    }),
  );
  const userTurnStartedAt = Date.now();
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
  capturePreStreamTiming(
    routeTrace.finish(
      "route.session_memory.user_turn.done",
      userTurnStartedAt,
      {
        hasSession: Boolean(memory?.sessionId),
      },
    ),
  );
  const includeLatencyTrace = shouldIncludeIntelligenceLatencyTrace(
    req,
    includeTrace,
  );

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const startedAt = Date.now();
      let assistantText = "";
      let classificationForMemory: unknown = null;
      let citationCount = 0;
      let patternId: string | null = null;
      let sawStreamError = false;
      const structuredFenceStreamFilter = createStructuredFenceStreamFilter();
      // Agent-trace capture (aVa Intelligence path).
      let traceSources: RawAskSource[] = [];
      let traceModelInputHash: string | undefined;
      const enqueueTiming = (timing: IntelligenceLatencyTiming) => {
        if (!includeLatencyTrace) return;
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "timing",
              timing,
            }) + "\n",
          ),
        );
      };
      const blockRetiredFacts = (input: {
        sources?: AskSource[];
        textBlocks?: Array<{
          location: string;
          text: string | null | undefined;
        }>;
      }) => {
        const findings = scanRetiredFacts({
          tenantKey:
            tenantInventoryKey ??
            tenantClientKey ??
            requestedOrSurfaceClient ??
            tenant?.canonicalKey ??
            tenant?.appClientKey ??
            null,
          tenantName: tenant?.displayName ?? surfaceContext?.activeClient,
          surfaceContext,
          sources: input.sources,
          textBlocks: input.textBlocks,
        });
        if (findings.length === 0) return false;
        sawStreamError = true;
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              error: applyCxoAnswerModeFallbacks(
                buildClientSafeRetiredFactMessage(),
                classifyAbarvaAnswerMode(query),
              ),
              retiredFactFindings: findings,
            }) + "\n",
          ),
        );
        return true;
      };
      const productTruthContext = (input?: {
        surface?: string | null;
        groundingParts?: readonly unknown[];
      }) => ({
        tenantKey:
          tenantInventoryKey ??
          tenantClientKey ??
          requestedOrSurfaceClient ??
          tenant?.canonicalKey ??
          tenant?.appClientKey ??
          null,
        tenantName: tenant?.displayName ?? surfaceContext?.activeClient,
        surface: input?.surface ?? surfaceContext?.activeTab ?? "intelligence",
        query,
        groundingText: productTruthGroundingText([
          surfaceContext,
          input?.groundingParts ?? [],
        ]),
      });
      try {
        for (const timing of preStreamTimings) {
          enqueueTiming(timing);
        }
        enqueueTiming(routeTrace.mark("route.stream.start"));
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
        if (blockRetiredFacts({})) return;
        if (
          canBuildSourceWorkspaceVisualAnswer({
            query,
            surfaceContext,
          })
        ) {
          const sourceVisualAnswer = buildSourceWorkspaceVisualAnswer({
            query,
            surfaceContext: surfaceContext as AskSurfaceContext,
          });
          if (sourceVisualAnswer) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "context-summary",
                }) + "\n",
              ),
            );
            const agentAnswer = composeAvaAnswer({
              surface: "source",
              mode: "ANALYZE",
              tenantKey:
                tenantInventoryKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
              intent: "source_contract_visual",
              status: "answered",
              directAnswer: sourceVisualAnswer.directAnswer,
              factsUsed: sourceVisualAnswer.factsUsed,
              metricsUsed: sourceVisualAnswer.metricsUsed,
              relationshipsUsed: sourceVisualAnswer.relationshipsUsed,
              artifacts: sourceVisualAnswer.artifacts,
              citations: sourceVisualAnswer.citations,
              caveats: [
                ...sourceVisualAnswer.caveats,
                {
                  id: "validated-source-visuals",
                  label: "Structured Source visuals",
                  detail:
                    "Tables, charts, and graphs are rendered from the selected contract context instead of model-authored chart instructions.",
                },
              ],
              nextSteps: sourceVisualAnswer.nextSteps,
              corpusUsed: sourceVisualAnswer.citations.some(
                (citation) => citation.sourceClass !== "tenant-fact",
              )
                ? [
                    {
                      id: "outside-in-sourcing-pattern",
                      label: "Outside-in sourcing pattern",
                    },
                  ]
                : [],
              retrievalSummary: {
                substrate: "module_read_model",
                sourceCount: sourceVisualAnswer.citations.length,
                hasTenantFacts: sourceVisualAnswer.citations.some(
                  (citation) => citation.sourceClass === "tenant-fact",
                ),
                hasCorpus: sourceVisualAnswer.citations.some(
                  (citation) => citation.sourceClass !== "tenant-fact",
                ),
                hasExperts: false,
              },
            });
            const guardedAgentAnswer = applyProductTruthToAvaAnswer(
              agentAnswer,
              productTruthContext({
                surface: "source",
                groundingParts: [surfaceContext, sourceVisualAnswer],
              }),
            );
            if (
              blockRetiredFacts({
                textBlocks: [
                  {
                    location: "route.source_visual.agent_answer",
                    text: JSON.stringify(guardedAgentAnswer),
                  },
                ],
              })
            )
              return;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: guardedAgentAnswer,
                }) + "\n",
              ),
            );
            const event = recordIntelligenceTelemetry({
              startedAt,
              tenantId,
              instanceId:
                memory?.sessionId ??
                memory?.tabId ??
                requestedOrSurfaceClient ??
                "source-visual-ask",
              patternId: "source-contract-visual-answer",
              citationCount: sourceVisualAnswer.citations.length,
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
        }
        if (shouldUseHomeKnowAgentAnswer({ query, surfaceContext })) {
          const homeTenant = sessionTenant ?? tenant;
          const homeTenantAliases =
            signedInTenantAliases.length > 0
              ? signedInTenantAliases
              : (homeTenant?.aliases ?? []);
          const requestedHomeAliases = tenantAliasesFor(
            tenantClientKey ?? requestedOrSurfaceClient,
          );
          const foreignTenantAliases =
            homeTenantAliases.length > 0
              ? homeTenantAliases
              : [tenantInventoryKey, tenantClientKey].filter(Boolean);
          if (
            (homeTenantAliases.length > 0 &&
              requestedHomeAliases.length > 0 &&
              !hasTenantAliasOverlap(
                homeTenantAliases,
                requestedHomeAliases,
              )) ||
            mentionsForeignTenant(query, foreignTenantAliases)
          ) {
            let answer = buildHomeKnowTenantFenceAnswer({
              activeTenantDisplayName:
                homeTenant?.displayName ??
                tenant?.displayName ??
                surfaceContext?.activeClient ??
                requestedOrSurfaceClient ??
                "the signed-in tenant",
            });
            if (
              blockRetiredFacts({
                textBlocks: [
                  {
                    location: "route.home_know_tenant_fence.answer",
                    text: JSON.stringify(answer),
                  },
                ],
              })
            )
              return;
            answer = applyProductTruthToAvaAnswer(
              answer,
              productTruthContext({ surface: "home" }),
            );
            assistantText = answer.directAnswer;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer,
                }) + "\n",
              ),
            );
            const event = recordIntelligenceTelemetry({
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
            homeTenant?.canonicalKey ??
            homeTenant?.appClientKey ??
            tenantInventoryKey ??
            tenantClientKey ??
            requestedOrSurfaceClient ??
            null;
          if (isFoundationTenantKey(homeTenantKey)) {
            sawStreamError = true;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  error:
                    "This tenant is governed by the Knowledge Baseline. Use the Knowledge experience or Knowledge aVa path so the answer is bound to the active baseline and consumption projection.",
                  code: "governed_knowledge_consumption_required",
                }) + "\n",
              ),
            );
            return;
          }
          let response: HomeKnowResponse;
          let answer: AvaAnswerPacket;
          try {
            // buildHomeKnowAgentAnswer's V6 file-reading path (loadV6Dataset) throws on every
            // tenant, every time -- it expects a V6_GENERATED_MANIFEST.json under a synthetic
            // dataset directory that was deleted from the repo in the tenant-input-standard
            // cleanup, and nothing regenerates it. That made this whole branch a 100%-failure
            // path silently absorbed by the catch below (the "[home-know.blank-guard]" log line
            // this codebase already carries specifically because this kept firing) -- every user
            // asking aVa a question on Home always got the degraded fallback response instead of
            // a real one. buildHomeKnowResponse is the same live engine /api/home/know/ask
            // already serves real answers with; using it here instead of the dead V6 path is the
            // actual fix, not a workaround.
            response = await buildHomeKnowResponse({
              question: query,
              tenantKey: homeTenantKey,
              client:
                homeTenant?.appClientKey ??
                tenantClientKey ??
                requestedOrSurfaceClient,
            });
            answer = homeKnowResponseToAvaAnswer(response);
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
          answer = applyProductTruthToAvaAnswer(
            answer,
            productTruthContext({
              surface: "home",
              groundingParts: [response],
            }),
          );
          classificationForMemory = {
            mode: "home-know",
            intent: response.intent,
            answerStatus: response.answerStatus,
          };
          if (
            blockRetiredFacts({
              textBlocks: [
                {
                  location: "route.home_know.response",
                  text: JSON.stringify(response),
                },
                {
                  location: "route.home_know.answer",
                  text: JSON.stringify(answer),
                },
              ],
            })
          )
            return;
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
          const event = recordIntelligenceTelemetry({
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
            const stageSources = intelligenceSourcesFromCitations(
              stage.citations,
            );
            if (
              blockRetiredFacts({
                sources: stageSources,
                textBlocks: [
                  {
                    location: `route.sentinel.stage:${stage.name}`,
                    text: stage.content,
                  },
                ],
              })
            )
              return;
            const guardedStage = applyProductTruthRuntimeGuard(
              stage.content,
              productTruthContext({
                surface: "intelligence",
                groundingParts: [stage.citations],
              }),
            );
            const safeStage = { ...stage, content: guardedStage.text };
            assistantText += `${safeStage.name}: ${safeStage.content}\n`;
            citationCount += stage.citations.length;
            sentinelCitations.push(...stage.citations);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "ava-stage", stage: safeStage }) + "\n",
              ),
            );
          }
          const routing = routeQuestion({
            query,
            industry: expertIndustryForClientKey(tenantClientKey),
          });
          const advisorOutputShape = advisorRequiredArtifactForQuery(query);
          const answerRouting = {
            ...routing,
            outputShape:
              routing.outputShape === "chart"
                ? routing.outputShape
                : (advisorOutputShape ?? routing.outputShape),
            experts: [],
          };
          const sentinelSources = withAdvisorSupportSources(
            query,
            intelligenceSourcesFromCitations(sentinelCitations),
          );
          const exhibits = buildStructuredExhibits({
            prose: assistantText,
            routing: answerRouting,
            sources: sentinelSources,
          });
          if (
            hasRenderableStructuredExhibits(exhibits) ||
            exhibits.citations.length > 0
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
              intent: answerRouting.outputShape,
              status: "answered",
              directAnswer: exhibits.prose,
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
                hasExperts: false,
              },
            });
            const guardedAgentAnswer = applyProductTruthToAvaAnswer(
              agentAnswer,
              productTruthContext({
                surface: "intelligence",
                groundingParts: [sentinelSources],
              }),
            );
            if (
              blockRetiredFacts({
                sources: sentinelSources,
                textBlocks: [
                  {
                    location: "route.sentinel.agent_answer",
                    text: JSON.stringify(guardedAgentAnswer),
                  },
                ],
              })
            )
              return;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: guardedAgentAnswer,
                }) + "\n",
              ),
            );
          }
          const event = recordIntelligenceTelemetry({
            startedAt,
            tenantId,
            instanceId:
              memory?.sessionId ??
              memory?.tabId ??
              requestedOrSurfaceClient ??
              "intelligence-ask",
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
        const companionCanvasEnabled = isFeatureEnabled(
          { clientKey: tenantClientKey, clientId: tenantId },
          "intelligence_companion_canvas",
        );
        for await (const event of askIntelligence(query, {
          userContextBlock,
          tenantId,
          tenantClientKey,
          tenant,
          richText,
          answerOnlyStreaming,
          userId,
          tenantInventoryKey,
          surfaceContext,
          companionCanvasEnabled,
          conversationContextBlock: memory?.contextBlock,
          activePersonGraphNodeId,
          activePersonDisplayName,
          traceEnabled: payload.traceEnabled,
          traceSession: payload.traceEnabled
            ? {
                tenant,
                user:
                  sessionUserId || userId
                    ? {
                        id: sessionUserId ?? userId ?? "unknown-user",
                        email: null,
                        role: activePersonDisplayName ?? null,
                      }
                    : undefined,
                question: query,
              }
            : undefined,
        })) {
          if (event.type === "classified")
            classificationForMemory =
              event.classification ?? classificationForMemory;
          if (event.type === "sources") {
            const enrichedSources = withAdvisorSupportSources(
              query,
              (event.sources ?? []) as AskSource[],
            );
            const displaySources = enrichedSources.map(displaySafeAskSource);
            citationCount = enrichedSources.length;
            patternId =
              enrichedSources.find((source) => source.type === "PATTERN")?.id ??
              patternId;
            traceSources = enrichedSources as RawAskSource[];
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  ...event,
                  sources: displaySources,
                }) + "\n",
              ),
            );
            continue;
          }
          if (event.type === "delta" && event.text) {
            assistantText += event.text;
            const displayText = displaySafeIntelligenceDelta(
              structuredFenceStreamFilter.push(event.text),
            );
            if (!displayText.trim() && !answerOnlyStreaming) continue;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ ...event, text: displayText }) + "\n",
              ),
            );
            continue;
          }
          if (
            event.type === "intelligence-dossier" ||
            event.type === "advisory-packet"
          ) {
            const summary = displaySafeContextSummary(
              event as unknown as Record<string, unknown>,
            );
            if (summary && payload.traceEnabled) {
              controller.enqueue(
                encoder.encode(JSON.stringify(summary) + "\n"),
              );
            }
            continue;
          }
          if (event.type === "error") sawStreamError = true;
          if (event.type === "done") continue;
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
        const remainingStructuredSafeText = displaySafeIntelligenceDelta(
          structuredFenceStreamFilter.flush(),
        );
        if (remainingStructuredSafeText.trim()) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "delta",
                text: remainingStructuredSafeText,
              }) + "\n",
            ),
          );
        }
        if (!sawStreamError && assistantText.trim()) {
          const event = recordIntelligenceTelemetry({
            startedAt,
            tenantId,
            instanceId:
              memory?.sessionId ??
              memory?.tabId ??
              requestedOrSurfaceClient ??
              "intelligence-ask",
            patternId,
            citationCount,
          });
          // Observability · build the context-bundle trace, run post-response
          // claim/citation + tenant-isolation validation against it, stamp the
          // verdicts, then emit (non-blocking). IDs only; model input hashed.
          const avaTrace = buildAvaTrace({
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
                tenant_key: avaTrace.tenant_key,
                retrieved_tenant_context: avaTrace.retrieved_tenant_context,
                retrieved_corpus_patterns: avaTrace.retrieved_corpus_patterns,
                retrieved_artifacts: avaTrace.retrieved_artifacts,
                citation_objects_emitted: avaTrace.citation_objects_emitted,
              },
              answerText: assistantText,
            });
            avaTrace.claim_validation_status = validation.claimValidationStatus;
            avaTrace.tenant_isolation_status = validation.tenantIsolationStatus;
          } catch {
            // Validation must never break the response path.
          }
          emitAgentContextTraceAsync(avaTrace);
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
          // Answer-only turns still need the governed packet after streaming:
          // the dock paints deltas immediately, then stores this packet for
          // typed artifacts, export, validation, and evidence accounting.
          const routing = routeQuestion({
            query,
            industry: expertIndustryForClientKey(tenantClientKey),
          });
          const advisorOutputShape = advisorRequiredArtifactForQuery(query);
          const answerRouting = {
            ...routing,
            outputShape:
              routing.outputShape === "chart"
                ? routing.outputShape
                : (advisorOutputShape ?? routing.outputShape),
            experts: [],
          };
          const advisorSources = withAdvisorSupportSources(
            query,
            traceSources as AskSource[],
          );
          const routeCanvasStartedAt = Date.now();
          // Companion-canvas flag ON → the answer streamed answer-only and a
          // structured `canvas` event already carries the five lenses. Skip the
          // legacy tab injection so we don't emit a contradictory second
          // canvas. Flag OFF → unchanged legacy behavior.
          if (!companionCanvasEnabled) {
            assistantText = ensureRouteMandatoryCanvasTabs(
              assistantText,
              query,
              advisorSources,
              tenantClientKey,
              tenantId,
            );
          }
          const tabbedResponse = parseIntelligenceTabbedResponse(assistantText);
          enqueueTiming(
            routeTrace.finish("route.canvas_parse.done", routeCanvasStartedAt, {
              tabCount: tabbedResponse.tabs.length,
              hasMainAnswer: Boolean(tabbedResponse.mainAnswer.trim()),
            }),
          );
          if (
            tabbedResponse.tabs.length > 0 &&
            tabbedResponse.mainAnswer.trim()
          ) {
            const composeStartedAt = Date.now();
            const tabbedExhibits = buildStructuredExhibits({
              prose: tabbedResponse.mainAnswer,
              routing: answerRouting,
              sources: advisorSources,
            });
            const tabbedArtifacts = [
              ...tabbedExhibits.tables.map((table) => ({
                ...table,
                artifact: "table" as const,
              })),
              ...tabbedExhibits.charts.map((chart) => ({
                ...chart,
                artifact: "chart" as const,
              })),
              ...tabbedExhibits.graphs.map((graph) => ({
                ...graph,
                artifact: "graph" as const,
              })),
            ];
            const agentAnswer = composeAvaAnswer({
              surface: "intelligence",
              mode: "ANALYZE",
              tenantKey:
                tenantInventoryKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
              intent: "decision_canvas",
              status: "answered",
              directAnswer:
                tabbedExhibits.prose.trim() || tabbedResponse.mainAnswer,
              artifacts: tabbedArtifacts,
              citations: tabbedExhibits.citations,
              corpusUsed: tabbedResponse.tabs.some(
                (tab) =>
                  tab.grounding === "industry-context" ||
                  tab.grounding === "corpus-pattern" ||
                  tab.grounding === "benchmark",
              )
                ? [
                    {
                      id: "industry-context",
                      label: "Industry or pattern context",
                    },
                  ]
                : [],
              decisionFrame: {
                intelligenceTabs: tabbedResponse.tabs,
                rendererMode: "display-only",
                rawModelOutput: tabbedResponse.rawText,
              },
              retrievalSummary: {
                substrate: "module_read_model",
                sourceCount: advisorSources.length,
                hasTenantFacts: advisorSources.some(
                  (source) => source.type === "TENANT",
                ),
                hasCorpus: advisorSources.some(
                  (source) => source.type !== "TENANT",
                ),
                hasExperts: false,
              },
            });
            const guardedAgentAnswer = applyProductTruthToAvaAnswer(
              {
                ...agentAnswer,
                prose: tabbedResponse.mainAnswer,
              } as AvaAnswerPacket,
              productTruthContext({
                surface: "intelligence",
                groundingParts: [advisorSources, tabbedResponse.tabs],
              }),
            );
            if (
              blockRetiredFacts({
                sources: advisorSources,
                textBlocks: [
                  {
                    location: "route.agent_answer.tabbed",
                    text: JSON.stringify(guardedAgentAnswer),
                  },
                ],
              })
            )
              return;
            enqueueTiming(
              routeTrace.finish("route.answer_compose.done", composeStartedAt, {
                artifactCount: tabbedArtifacts.length,
                citationCount: agentAnswer.citations?.length ?? 0,
              }),
            );
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: guardedAgentAnswer,
                }) + "\n",
              ),
            );
            enqueueTiming(routeTrace.mark("route.agent_answer.enqueued"));
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "done",
                  telemetryEventId: event.id,
                }) + "\n",
              ),
            );
            enqueueTiming(routeTrace.mark("route.done.enqueued"));
            return;
          }
          const exhibitsStartedAt = Date.now();
          const exhibits = buildStructuredExhibits({
            prose: assistantText,
            routing: answerRouting,
            sources: advisorSources,
          });
          const sourceVisualAnswer = canBuildSourceWorkspaceVisualAnswer({
            query,
            surfaceContext,
          })
            ? buildSourceWorkspaceVisualAnswer({
                query,
                surfaceContext: surfaceContext as AskSurfaceContext,
              })
            : null;
          const sourceVisualArtifacts = sourceVisualAnswer?.artifacts ?? [];
          const sourceVisualCitations = sourceVisualAnswer?.citations ?? [];
          enqueueTiming(
            routeTrace.finish(
              "route.structured_exhibits.done",
              exhibitsStartedAt,
              {
                tableCount: exhibits.tables.length,
                chartCount: exhibits.charts.length,
                graphCount: exhibits.graphs.length,
                citationCount: exhibits.citations.length,
                sourceVisualArtifactCount: sourceVisualArtifacts.length,
              },
            ),
          );
          if (
            hasRenderableStructuredExhibits(exhibits) ||
            exhibits.citations.length > 0 ||
            sourceVisualArtifacts.length > 0
          ) {
            const agentAnswer = composeAvaAnswer({
              surface: sourceVisualAnswer ? "source" : "intelligence",
              mode: "ANALYZE",
              tenantKey:
                tenantInventoryKey ??
                tenantClientKey ??
                requestedOrSurfaceClient ??
                "unknown",
              question: query,
              intent: answerRouting.outputShape,
              status: "answered",
              directAnswer: sourceVisualAnswer?.directAnswer ?? exhibits.prose,
              factsUsed: sourceVisualAnswer?.factsUsed,
              metricsUsed: sourceVisualAnswer?.metricsUsed,
              relationshipsUsed: sourceVisualAnswer?.relationshipsUsed,
              artifacts: [
                ...sourceVisualArtifacts,
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
              citations:
                sourceVisualCitations.length > 0
                  ? [...sourceVisualCitations, ...exhibits.citations]
                  : exhibits.citations,
              caveats: [
                ...(sourceVisualAnswer?.caveats ?? []),
                {
                  id: "validated-structure-only",
                  label: "Structured exhibits",
                  detail:
                    "Tables, charts, and graphs appear only when aVa has validated structured data.",
                },
              ],
              nextSteps: [
                ...(sourceVisualAnswer?.nextSteps ?? []),
                ...exhibits.followups.map((label, index) => ({
                  id: `followup-${index + 1}`,
                  label,
                })),
              ],
              corpusUsed: [...sourceVisualCitations, ...exhibits.citations].some(
                (citation) => citation.sourceClass !== "tenant-fact",
              )
                ? [
                    {
                      id: "corpus-support",
                      label: "Corpus or pattern support",
                    },
                  ]
                : [],
              retrievalSummary: {
                substrate: "module_read_model",
                sourceCount:
                  sourceVisualCitations.length + exhibits.citations.length,
                hasTenantFacts: [...sourceVisualCitations, ...exhibits.citations].some(
                  (citation) => citation.sourceClass === "tenant-fact",
                ),
                hasCorpus: [...sourceVisualCitations, ...exhibits.citations].some(
                  (citation) => citation.sourceClass !== "tenant-fact",
                ),
                hasExperts: false,
              },
            });
            const guardedAgentAnswer = applyProductTruthToAvaAnswer(
              agentAnswer,
              productTruthContext({
                surface: "intelligence",
                groundingParts: [advisorSources, exhibits],
              }),
            );
            if (
              blockRetiredFacts({
                sources: advisorSources,
                textBlocks: [
                  {
                    location: "route.agent_answer.exhibits",
                    text: JSON.stringify(guardedAgentAnswer),
                  },
                ],
              })
            )
              return;
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "agent-answer",
                  answer: guardedAgentAnswer,
                }) + "\n",
              ),
            );
            enqueueTiming(routeTrace.mark("route.agent_answer.enqueued"));
          }
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "done",
                telemetryEventId: event.id,
              }) + "\n",
            ),
          );
          enqueueTiming(routeTrace.mark("route.done.enqueued"));
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
        enqueueTiming(
          routeTrace.mark("route.error", {
            message: err instanceof Error ? err.message : "unknown",
          }),
        );
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              error: err instanceof Error ? err.message : "unknown",
            }) + "\n",
          ),
        );
      } finally {
        const assistantTurnStartedAt = Date.now();
        await appendAskSessionTurn({
          sessionId: memory?.sessionId,
          tenantId,
          userId,
          role: "assistant",
          content: assistantMemoryText(assistantText),
          metadata: {
            client: requestedOrSurfaceClient,
            classification: classificationForMemory,
          },
        }).catch((err) =>
          console.warn("[ask.session-memory.assistant-turn]", err),
        );
        enqueueTiming(
          routeTrace.finish(
            "route.session_memory.assistant_turn.done",
            assistantTurnStartedAt,
            {
              hasSession: Boolean(memory?.sessionId),
              assistantChars: assistantText.length,
            },
          ),
        );
        enqueueTiming(routeTrace.mark("route.response.close"));
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

function intelligenceSourcesFromCitations(
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
      name: citation.label || citation.id || "aVa citation",
      detail: citation.detail ?? "",
      url: citation.url,
      confidence: undefined,
    });
  }
  return sources;
}

export function displaySafeIntelligenceDelta(text: string): string {
  const scrubForDisplay = (value: string) => {
    const leadingWhitespace = value.match(/^\s+/)?.[0] ?? "";
    const trailingWhitespace = value.match(/\s+$/)?.[0] ?? "";
    const scrubbed = scrubPublicAvaAnswerText(
      scrubVisibleAvaDataStateLanguage(scrubInternalVisibleAvaTerms(value)),
    );
    if (!scrubbed) return value.trim() ? "" : value;
    return `${leadingWhitespace && !/^\s/.test(scrubbed) ? leadingWhitespace : ""}${scrubbed}${trailingWhitespace && !/\s$/.test(scrubbed) ? trailingWhitespace : ""}`;
  };
  if (!text.includes("<<<TAB:") && !text.includes("grounding:")) {
    return scrubForDisplay(text);
  }

  const parsed = parseIntelligenceTabbedResponse(text);
  if (parsed.mainAnswer.trim()) {
    return scrubForDisplay(parsed.mainAnswer);
  }

  return scrubForDisplay(text.replace(/<<<TAB:[\s\S]*$/g, "").trimEnd());
}

function numberFromPath(value: unknown, path: readonly string[]): number {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "number" && Number.isFinite(current) ? current : 0;
}

function arrayLengthFromPath(value: unknown, path: readonly string[]): number {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  return Array.isArray(current) ? current.length : 0;
}

function stringFromPath(value: unknown, path: readonly string[]): string {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? scrubPublicAvaAnswerText(current) : "";
}

function displaySafeContextSummary(
  event: Record<string, unknown>,
): Record<string, unknown> | null {
  if (event.type === "intelligence-dossier") {
    const context = event.intelligenceDossier;
    return {
      type: "context-summary",
      summary: {
        sourceSections: arrayLengthFromPath(context, [
          "tenantEvidenceDossier",
          "sections",
        ]),
        missingEvidenceItems: arrayLengthFromPath(context, [
          "evidenceBoundary",
          "missingTenantEvidence",
        ]),
        decisionOptions: arrayLengthFromPath(context, [
          "decisionOptionsDossier",
          "options",
        ]),
        evidenceStrength: stringFromPath(context, [
          "tenantEvidenceDossier",
          "confidence",
        ]),
        note: "Active enterprise context was assembled for this answer; internal trace details are kept out of the visible chat.",
      },
    };
  }
  if (event.type === "advisory-packet") {
    const context = event.advisoryPacket;
    return {
      type: "context-summary",
      summary: {
        sourceRefs: arrayLengthFromPath(context, [
          "auditLineage",
          "sourceRefs",
        ]),
        visibleFacts: arrayLengthFromPath(context, [
          "modelVisiblePacket",
          "tenantFacts",
        ]),
        visibleGaps: arrayLengthFromPath(context, [
          "modelVisiblePacket",
          "gaps",
        ]),
        retrievalWarnings: numberFromPath(context, [
          "retrievalDiagnostics",
          "warningCount",
        ]),
        note: "aVa used evidence-backed context and kept internal lineage outside the visible answer.",
      },
    };
  }
  return null;
}

const INTERNAL_SOURCE_ID_RE =
  /\b(?:candidate_move|move_id|phase_id|artifact_id|evidence_id|source_record_id|context_pack_id|program_evidence_items|move_artifacts|tenant_id|client_id|intelligence_v\d+|v\d+[._:-])/i;

function displaySafeAskSource(source: AskSource, index: number): AskSource {
  const name = scrubPublicAvaSourceText(source.name);
  const detail = scrubPublicAvaSourceText(source.detail);
  const id =
    source.id && !INTERNAL_SOURCE_ID_RE.test(source.id)
      ? scrubInternalVisibleAvaTerms(source.id)
      : `source-${index + 1}`;
  return {
    ...source,
    id,
    name: name || `Source ${index + 1}`,
    detail,
  };
}

function assistantMemoryText(text: string): string {
  const displayText = displaySafeIntelligenceDelta(text);
  return displayText.trim() ? displayText : scrubPublicAvaAnswerText(text);
}

function applyProductTruthToAvaAnswer(
  answer: AvaAnswerPacket,
  context: Parameters<typeof applyProductTruthRuntimeGuard>[1],
): AvaAnswerPacket {
  const direct = applyProductTruthRuntimeGuard(answer.directAnswer, context);
  const answerMode = classifyAbarvaAnswerMode(context?.query ?? "");
  const directAnswer = applyCxoAnswerModeFallbacks(direct.text, answerMode);
  const prose =
    typeof (answer as { prose?: unknown }).prose === "string"
      ? applyCxoAnswerModeFallbacks(
          applyProductTruthRuntimeGuard(
            (answer as { prose: string }).prose,
            context,
          ).text,
          answerMode,
        )
      : undefined;
  return sanitizeAgentAnswerForRender({
    ...answer,
    directAnswer,
    ...(prose ? { prose } : {}),
    caveats: [
      ...(answer.caveats ?? []),
      ...(direct.violations.length > 0
        ? [
            {
              id: "product-truth-guard",
              label: "Product truth guard",
              detail:
                "Client-visible answer was checked for product scope, tenant evidence, professional boundaries, and unsafe replacement language.",
            },
          ]
        : []),
    ],
  });
}

function recordIntelligenceTelemetry(input: {
  startedAt: number;
  tenantId: string | null;
  instanceId: string | null;
  patternId: string | null;
  citationCount: number;
}) {
  return recordSynthesisEvent({
    surface: "intelligence",
    tenantId: input.tenantId ?? undefined,
    instanceId: input.instanceId ?? "intelligence-ask",
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
  activeTenantAliases: readonly (string | null | undefined)[],
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

function hasTenantAliasOverlap(
  left: readonly (string | null | undefined)[],
  right: readonly (string | null | undefined)[],
): boolean {
  const leftAliases = new Set(
    left
      .flatMap((value) => tenantAliasesFor(value))
      .map((value) => value.toLowerCase()),
  );
  return right
    .flatMap((value) => tenantAliasesFor(value))
    .some((value) => leftAliases.has(value.toLowerCase()));
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

function shouldIncludeIntelligenceTrace(
  req: NextRequest,
  user: Awaited<ReturnType<typeof currentUser>>,
  person: Awaited<ReturnType<typeof getCurrentPerson>>,
): boolean {
  if (req.headers?.get("x-abarva-debug-intel") !== "1") return false;
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";
  const clerkName = (
    user?.fullName ??
    [user?.firstName, user?.lastName].filter(Boolean).join(" ")
  )
    .trim()
    .toLowerCase();
  const personName = (person?.name ?? "").trim().toLowerCase();
  const metadata = user?.publicMetadata as Record<string, unknown> | undefined;
  const role = readString(metadata?.role)?.toLowerCase() ?? "";
  const roles = Array.isArray(metadata?.roles)
    ? metadata.roles
        .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
        .filter(Boolean)
    : [];
  const allowedRole =
    ["admin", "operator", "agent", "qa"].includes(role) ||
    roles.some((value) => ["admin", "operator", "agent", "qa"].includes(value));
  const operatorTraceFlag =
    metadata?.operatorTrace === true ||
    metadata?.debugIntelTrace === true ||
    metadata?.intelligenceTrace === true;
  const allowedEmail = /@abarva\.(ai|example\.com)$/i.test(email);
  const configuredOperatorEmails = new Set(
    (process.env.ABARVA_INTELLIGENCE_TRACE_OPERATOR_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
  const founderOperatorEmail = new Set([
    "anandshp@gmail.com",
    "anand.sundaram@gmail.com",
    "anand.sundaram+skyharbor@thesundaram.com",
  ]);
  const founderOperatorName =
    personName === "anand sundaram" || clerkName === "anand sundaram";
  const allowedOperatorEmail =
    configuredOperatorEmails.has(email.toLowerCase()) ||
    founderOperatorEmail.has(email.toLowerCase());
  const syntheticLabPersona = /@(?:[a-z0-9-]+\.)?example\.com$/i.test(email);
  return (
    Boolean(user?.id || person?.id) &&
    (allowedEmail ||
      allowedRole ||
      operatorTraceFlag ||
      allowedOperatorEmail ||
      founderOperatorName ||
      syntheticLabPersona)
  );
}

function shouldIncludeIntelligenceLatencyTrace(
  req: NextRequest,
  includeTrace: boolean,
): boolean {
  if (includeTrace) return true;
  if (process.env.INTELLIGENCE_LATENCY_TRACE === "1") return true;
  return (
    req.nextUrl?.searchParams.get("latency") === "1" ||
    req.headers?.get("x-abarva-intelligence-latency") === "1"
  );
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
    directAnswer: `I can't share or use another tenant's data from Home. Your signed-in session is fenced to ${input.activeTenantDisplayName}; ask from this tenant's active enterprise context only.`,
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
    traceEnabled:
      url.searchParams.get("trace") === "1" ||
      url.searchParams.get("traceEnabled") === "true",
    richText:
      url.searchParams.get("richText") === "1" ||
      url.searchParams.get("richText") === "true",
    answerOnlyStreaming:
      url.searchParams.get("answerOnlyStreaming") === "1" ||
      url.searchParams.get("answerOnlyStreaming") === "true",
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
    traceEnabled:
      readBoolean(payload.traceEnabled) || readString(payload.trace) === "1",
    richText: readBoolean(payload.richText),
    answerOnlyStreaming: readBoolean(payload.answerOnlyStreaming),
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
    module: readString(record.module),
    sourceV4: readPlainObject(record.sourceV4),
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

function readBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}

function readPlainObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function ensureRouteMandatoryCanvasTabs(
  text: string,
  query: string,
  sources: AskSource[],
  tenantClientKey: string | null,
  tenantId: string | null,
): string {
  const parsed = parseIntelligenceTabbedResponse(text);
  const requiredLabels = [
    "Decision",
    "Industry Insights",
    "Chart",
    "Table",
    "Evidence",
  ];
  const presentLabels = new Set(parsed.tabs.map((tab) => tab.label));
  const missing = requiredLabels.filter((label) => !presentLabels.has(label));
  if (missing.length === 0) return text;

  const mainAnswer = cleanRouteCanvasMainAnswer(
    parsed.mainAnswer || parsed.rawText,
  );
  const existingTabs = parsed.tabs
    .map(
      (tab) =>
        `<<<TAB: ${tab.label} | grounding: ${tab.grounding}>>>\n${tab.content}`,
    )
    .join("\n\n");
  const fallbackTabs = missing.map((label) =>
    buildRouteFallbackCanvasTab(label, {
      query,
      sources,
      tenantClientKey,
      tenantId,
      mainAnswer,
    }),
  );

  return [mainAnswer, existingTabs, ...fallbackTabs]
    .filter((part) => part.trim().length > 0)
    .join("\n\n");
}

function cleanRouteCanvasMainAnswer(text: string): string {
  const withoutCanvas = text
    .replace(
      /```(?:abarva-canvas|json\s+abarva-canvas)\s*[\s\S]*?(?:```|$)/gi,
      "",
    )
    .replace(/\n\s*Table\s*[·:-][\s\S]*$/i, "")
    .replace(/\n\s*\|[^|\n]+\|[\s\S]*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return (
    withoutCanvas ||
    "Sequence the decision by value, readiness, and proof: scale what is evidence-backed, certify the next wave, and hold anything whose operating data is not board-ready."
  );
}

function buildRouteFallbackCanvasTab(
  label: string,
  args: {
    query: string;
    sources: AskSource[];
    tenantClientKey: string | null;
    tenantId: string | null;
    mainAnswer: string;
  },
): string {
  if (label === "Decision") {
    const firstSentence =
      args.mainAnswer
        .split(/(?<=[.!?])\s+/)
        .find(Boolean)
        ?.trim() ?? "Sequence the decision by value, readiness, and proof.";
    return [
      "<<<TAB: Decision | grounding: tenant-evidence>>>",
      `Executive choice: ${firstSentence}`,
      "Decision required: name the accountable owner, baseline, and proof gate before releasing scale funding.",
    ].join("\n");
  }

  if (label === "Industry Insights") {
    return [
      "<<<TAB: Industry Insights | grounding: industry-context>>>",
      "Industry context, not tenant proof: enterprise AI value is shifting from isolated pilots to governed value-office portfolios. The strongest pattern is to fund use cases where process ownership, data lineage, control evidence, and adoption telemetry are already credible, while thinner functions run discovery before scale.",
    ].join("\n");
  }

  if (label === "Chart") {
    const nativeCanvas = buildRouteNativeCanvasBlock(args);
    if (nativeCanvas) {
      return [
        "<<<TAB: Chart | grounding: tenant-evidence>>>",
        "Tenant-evidence exhibit: decision sequence generated from the focused enterprise packet.",
        nativeCanvas,
      ].join("\n");
    }
    const tenantCount = args.sources.filter(
      (source) => source.type === "TENANT",
    ).length;
    const contextCount = Math.max(args.sources.length - tenantCount, 0);
    return [
      "<<<TAB: Chart | grounding: mixed>>>",
      "Mixed context: available support for this answer.",
      "| Support type | Count |",
      "|---|---:|",
      `| Tenant evidence | ${tenantCount} |`,
      `| Industry or corpus context | ${contextCount} |`,
    ].join("\n");
  }

  if (label === "Table") {
    const rows = args.sources.slice(0, 5).map((source) => {
      const name = (source.name || source.id || "Evidence").replace(/\|/g, "/");
      const grounding =
        source.type === "TENANT" ? "Tenant evidence" : "Pattern context";
      return `| ${name} | ${grounding} |`;
    });
    return [
      "<<<TAB: Table | grounding: tenant-evidence>>>",
      "| Decision support | Grounding |",
      "|---|---|",
      ...(rows.length ? rows : ["| Enterprise packet | Tenant evidence |"]),
    ].join("\n");
  }

  return [
    "<<<TAB: Evidence | grounding: tenant-evidence>>>",
    `Tenant facts used: ${
      args.sources
        .filter((source) => source.type === "TENANT")
        .slice(0, 3)
        .map((source) => source.name || source.id)
        .filter(Boolean)
        .join("; ") || "tenant evidence packet"
    }.`,
    `Industry or pattern context used: ${
      args.sources
        .filter((source) => source.type !== "TENANT")
        .slice(0, 3)
        .map((source) => source.name || source.id)
        .filter(Boolean)
        .join("; ") || "none used"
    }.`,
    "Validation point: confirm the accountable owner, baseline metric, and proof gate before using the answer as board-grade guidance.",
  ].join("\n");
}

function buildRouteNativeCanvasBlock(args: {
  query: string;
  sources: AskSource[];
  tenantClientKey: string | null;
  tenantId: string | null;
}): string {
  if (
    args.sources.some(
      (source) => source.id === "industrial-cio-backoffice-readiness",
    )
  ) {
    return buildIndustrialCioBackofficeNativeCanvasBlock(args.query, [
      args.tenantClientKey,
      args.tenantId,
    ]);
  }
  if (args.sources.some((source) => source.id === "skyharbor-cto-readiness")) {
    return buildSkyHarborCtoReadinessNativeCanvasBlock(args.query, [
      args.tenantClientKey,
      args.tenantId,
    ]);
  }
  return "";
}
