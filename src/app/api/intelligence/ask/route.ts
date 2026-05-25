import { NextRequest } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { askIntelligence } from '@/lib/intelligence/ask';
import { classifySentinelIntent, runSentinelReasoning } from '@/lib/agents/sentinel-reasoning';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import { assembleUserContextBlock } from '@/lib/agent/prompts/_shared/user-context';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import type { AskSurfaceContext } from '@/lib/intelligence/ask';
import {
  appendAskSessionTurn,
  normalizeAskTabId,
  prepareAskSessionMemory,
} from '@/lib/intelligence/ask/session-memory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
}

async function handleAsk(payload: AskPayload) {
  const { query, requestedClient, surfaceContext } = payload;
  if (!query.trim()) {
    return new Response(JSON.stringify({ error: 'q required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let userContextBlock = '';
  let tenantId: string | null = null;
  let userId: string | null = null;
  let tenantInventoryKey: string | null = null;
  let sentinelClientId: string = requestedClient ?? 'apexretail';
  let sessionUserId: string | null = null;
  let activePersonGraphNodeId: string | null = null;
  let activePersonDisplayName: string | null = null;
  try {
    const [person, clerkUser, client] = await Promise.all([
      getCurrentPerson(),
      currentUser().catch(() => null),
      getActiveClientRow(requestedClient).catch(() => null),
    ]);
    sessionUserId = clerkUser?.id ?? null;
    tenantInventoryKey = client?.key
      ? clientKeyToInventorySubstrateKey(client.key)
      : null;
    tenantId = client?.id ?? null;
    sentinelClientId = client?.id ?? tenantInventoryKey ?? requestedClient ?? sentinelClientId;
    if (person) {
      userId = person.id;
      activePersonGraphNodeId = person.graph_node_id;
      activePersonDisplayName = person.name;
      userContextBlock = await assembleUserContextBlock({
        personId: person.id,
        displayName: person.name,
        activeTenantDisplayName: client?.name ?? null,
      });
    }
    userId = sessionUserId ?? userId;
  } catch (err) {
    console.warn('[ask.user-context]', err);
  }

  const memory = await prepareAskSessionMemory({
    tenantId,
    userId,
    tabId: tenantId && userId ? normalizeAskTabId(payload.tabId, userId, tenantId) : payload.tabId,
    query,
  }).catch((err) => {
    console.warn('[ask.session-memory.prepare]', err);
    return null;
  });
  await appendAskSessionTurn({
    sessionId: memory?.sessionId,
    tenantId,
    userId,
    role: 'user',
    content: query,
    metadata: {
      client: requestedClient,
      tabId: memory?.tabId ?? payload.tabId,
      surfaceContext,
    },
  }).catch((err) => console.warn('[ask.session-memory.user-turn]', err));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let assistantText = '';
      let classificationForMemory: unknown = null;
      try {
        if (memory?.sessionId) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'session',
            sessionId: memory.sessionId,
            tabId: memory.tabId,
            priorTurnCount: memory.priorTurnCount,
          }) + '\n'));
        }
        const sentinelIntent = await classifySentinelIntent({
          query,
          clientId: sentinelClientId,
          userId,
        });
        classificationForMemory = {
          intent: sentinelIntent.intent,
          confidence: sentinelIntent.confidence,
          matchedPatternSlugs: sentinelIntent.matchedPatternSlugs,
        };
        if (sentinelIntent.intent === 'it_productivity') {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'classified',
            classification: {
              intent: 'it_productivity',
              entities: sentinelIntent.entities,
              confidence: sentinelIntent.confidence,
              matchedPatternSlugs: sentinelIntent.matchedPatternSlugs,
              reason: sentinelIntent.reason,
            },
          }) + '\n'));
          for await (const stage of runSentinelReasoning({
            query,
            clientId: sentinelClientId,
            userId,
            surfaceContext,
            conversationContextBlock: memory?.contextBlock,
            intelligenceSessionId: memory?.sessionId ?? null,
          })) {
            assistantText += `${stage.name}: ${stage.content}\n`;
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'sentinel-stage', stage }) + '\n'));
          }
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
          return;
        }
        for await (const event of askIntelligence(query, {
          userContextBlock,
          tenantId,
          userId,
          tenantInventoryKey,
          surfaceContext,
          conversationContextBlock: memory?.contextBlock,
          activePersonGraphNodeId,
          activePersonDisplayName,
        })) {
          if (event.type === 'classified') classificationForMemory = event.classification ?? classificationForMemory;
          if (event.type === 'delta' && event.text) assistantText += event.text;
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'unknown' }) + '\n'),
        );
      } finally {
        await appendAskSessionTurn({
          sessionId: memory?.sessionId,
          tenantId,
          userId,
          role: 'assistant',
          content: assistantText,
          metadata: {
            client: requestedClient,
            classification: classificationForMemory,
          },
        }).catch((err) => console.warn('[ask.session-memory.assistant-turn]', err));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}

async function parseGetPayload(req: NextRequest): Promise<AskPayload> {
  const url = new URL(req.url);
  return {
    query: url.searchParams.get('q') ?? '',
    requestedClient: url.searchParams.get('client'),
    surfaceContext: parseSurfaceContext(url.searchParams.get('surfaceContext')),
    tabId: url.searchParams.get('tabId') ?? req.cookies.get('ai-ask-tab-id')?.value ?? null,
  };
}

async function parsePostPayload(req: NextRequest): Promise<AskPayload> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return {
    query: readString(payload.q) ?? readString(payload.query) ?? '',
    requestedClient: readString(payload.client),
    surfaceContext: normalizeSurfaceContext(payload.surfaceContext),
    tabId: readString(payload.tabId) ?? req.cookies.get('ai-ask-tab-id')?.value ?? null,
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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
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
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);
}
