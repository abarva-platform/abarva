import { NextRequest } from 'next/server';
import { askIntelligence } from '@/lib/intelligence/ask';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getActiveClientRow } from '@/lib/active-client';
import { assembleUserContextBlock } from '@/lib/agent/prompts/_shared/user-context';
import { clientKeyToInventorySubstrateKey } from '@/lib/agent/tools/intelligence/_shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q') ?? '';
  if (!query.trim()) {
    return new Response(JSON.stringify({ error: 'q required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let userContextBlock = '';
  let tenantInventoryKey: string | null = null;
  try {
    const [person, client] = await Promise.all([
      getCurrentPerson(),
      getActiveClientRow().catch(() => null),
    ]);
    tenantInventoryKey = client?.key
      ? clientKeyToInventorySubstrateKey(client.key)
      : null;
    if (person) {
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
        for await (const event of askIntelligence(query, { userContextBlock, tenantInventoryKey })) {
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
