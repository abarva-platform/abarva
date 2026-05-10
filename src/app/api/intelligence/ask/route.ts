import { NextRequest } from 'next/server';
import { askIntelligence } from '@/lib/intelligence/ask';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import { assembleUserContextBlock } from '@/lib/agent/prompts/_shared/user-context';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';
import type { AskSurfaceContext } from '@/lib/intelligence/ask';

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
  let tenantInventoryKey: string | null = null;
  let activePersonGraphNodeId: string | null = null;
  let activePersonDisplayName: string | null = null;
  try {
    const [person, client] = await Promise.all([
      getCurrentPerson(),
      getActiveClientRow(requestedClient).catch(() => null),
    ]);
    tenantInventoryKey = client?.key
      ? clientKeyToInventorySubstrateKey(client.key)
      : null;
    if (person) {
      activePersonGraphNodeId = person.graph_node_id;
      activePersonDisplayName = person.name;
      userContextBlock = await assembleUserContextBlock({
        personId: person.id,
        displayName: person.name,
        activeTenantDisplayName: client?.name ?? null,
      });
    }
  } catch (err) {
    console.warn('[ask.user-context]', err);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of askIntelligence(query, {
          userContextBlock,
          tenantInventoryKey,
          surfaceContext,
          activePersonGraphNodeId,
          activePersonDisplayName,
        })) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'unknown' }) + '\n'),
        );
      } finally {
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
