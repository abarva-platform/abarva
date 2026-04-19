import { NextRequest } from 'next/server';
import { assembleIdentitySystemPrompt } from '@/lib/agent/prompts/identity';
import { streamAgentTurn } from '@/lib/agent/stream';
import { parseUserReadyBlock } from '@/lib/agent/parse';
import { parseChoicesFromText } from '@/lib/agent/parse-choices';
import { assembleMaestroContextBlock } from '@/lib/agent/prompts/_shared/maestro-context';
import { updateMaestroProfile } from '@/lib/agent/maestro-extractor';
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

  const maestroContextBlock = maestro
    ? await assembleMaestroContextBlock({ personId: maestro.id, personName: maestro.name })
    : '';

  const system = assembleIdentitySystemPrompt({ maestro, maestroContextBlock });
  const encoder = new TextEncoder();

  const lastUserMessage = [...messages].reverse().find((m) => m?.role === 'user');
  const lastUserText = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let full = '';
        for await (const delta of streamAgentTurn({ system, messages })) {
          full += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }

        const { text: cleanedAgentText, choices: turnChoices } = parseChoicesFromText(full);
        if (turnChoices.length > 0) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'choices', choices: turnChoices }) + '\n'));
        }

        const parsed = parseUserReadyBlock(cleanedAgentText);
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

        if (maestro && lastUserText.trim().length > 0) {
          void (async () => {
            try {
              await updateMaestroProfile({
                maestroPersonId: maestro.id,
                turnId: `identity-${Date.now()}`,
                turnText: lastUserText,
                engagementId: null,
                engagementIndustry: null,
              });
            } catch (err) {
              console.error('[maestro-extractor-identity]', err);
            }
          })();
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
