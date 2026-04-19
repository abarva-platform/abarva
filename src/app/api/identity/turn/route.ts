import { NextRequest } from 'next/server';
import { assembleIdentitySystemPrompt } from '@/lib/agent/prompts/identity';
import { streamAgentTurn } from '@/lib/agent/stream';
import { parseUserReadyBlock } from '@/lib/agent/parsers/identity';
import { createPerson } from '@/lib/db/person';
import { syncPersonToGraph } from '@/lib/graph/mutations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
  }

  const system = assembleIdentitySystemPrompt({});
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let full = '';
        for await (const delta of streamAgentTurn({ system, messages })) {
          full += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }
        const parsed = parseUserReadyBlock(full);
        if (parsed) {
          const person = await createPerson({
            name: parsed.name,
            title: parsed.title,
            organization: parsed.organization,
            role: parsed.role,
            cxo_function: parsed.cxo_function,
            primary_focus: parsed.primary_focus,
          });
          await syncPersonToGraph({
            graph_node_id: person.graph_node_id!,
            name: person.name,
            role: person.role ?? parsed.role,
            organization: person.organization ?? parsed.organization,
          });
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'user_created', person }) + '\n'));
        }
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: err instanceof Error ? err.message : 'unknown' }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
  });
}
