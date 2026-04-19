import { NextRequest } from 'next/server';
import { assembleIdentitySystemPrompt } from '@/lib/agent/prompts/identity';
import { streamAgentTurn } from '@/lib/agent/stream';
import { parseUserReadyBlock } from '@/lib/agent/parse';
import { createPerson } from '@/lib/db/person';
import { syncPersonToGraph } from '@/lib/graph/mutations';
import { getCurrentMaestro } from '@/lib/auth/maestro';
import { clerkClient } from '@clerk/nextjs/server';
import { logAudit } from '@/lib/audit/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
  }

  const maestro = await getCurrentMaestro();
  const actorMaestro = maestro;
  const system = assembleIdentitySystemPrompt({ maestro });
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
          // Best-effort: sync person_id into Clerk public metadata so Clerk
          // JWTs carry it forward for RLS. Silent no-op if no matching Clerk
          // user exists yet (they may sign up later).
          if (person.email) {
            void (async () => {
              try {
                const clerk = await clerkClient();
                const users = await clerk.users.getUserList({ emailAddress: [person.email!] });
                if (users.data.length > 0) {
                  await clerk.users.updateUserMetadata(users.data[0].id, {
                    publicMetadata: { person_id: person.id },
                  });
                }
              } catch (err) {
                console.error('[clerk-metadata-sync]', err);
              }
            })();
          }
          await logAudit({
            actorPersonId: actorMaestro?.id ?? null,
            action: 'person.created',
            targetTable: 'persons',
            targetId: person.id,
            newValue: {
              name: person.name,
              role: person.role,
              organization: person.organization,
              graph_node_id: person.graph_node_id,
            },
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
