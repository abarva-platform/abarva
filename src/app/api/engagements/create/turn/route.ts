import { NextRequest } from 'next/server';
import { assembleEngagementCreateSystemPrompt } from '@/lib/agent/prompts/engagement-create';
import { streamAgentTurn } from '@/lib/agent/stream';
import { parseEngagementReadyBlock } from '@/lib/agent/parse';
import {
  createEngagement,
  getEngagementByGraphId,
} from '@/lib/db/engagement';
import { createPerson, getAllPersons } from '@/lib/db/person';
import { syncEngagementToGraph } from '@/lib/graph/engagement-sync';
import { syncPersonToGraph } from '@/lib/graph/mutations';
import { getCurrentMaestro } from '@/lib/auth/maestro';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INDUSTRIES = [
  { code: 'HEALTHCARE_IDN', name: 'Healthcare IDN' },
  { code: 'FINSERV', name: 'Financial Services' },
  { code: 'RETAIL', name: 'Retail' },
];
const FUNCTIONS = [
  { code: 'FRONT_OFFICE', name: 'Front Office' },
  { code: 'MIDDLE_OFFICE', name: 'Middle Office' },
  { code: 'BACK_OFFICE', name: 'Back Office' },
];
const OBJECTIVES = [
  { code: 'GROW', name: 'Grow' },
  { code: 'OPTIMISE', name: 'Optimise' },
  { code: 'PROTECT', name: 'Protect' },
];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
  if (!Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'messages array required' }), { status: 400 });
  }

  const [maestro, persons] = await Promise.all([getCurrentMaestro(), getAllPersons()]);
  const knownPersons = persons.map((p) => ({
    graph_node_id: p.graph_node_id ?? '',
    name: p.name,
    role: p.role,
    organization: p.organization,
  }));

  const system = assembleEngagementCreateSystemPrompt({
    maestro,
    knownPersons,
    industries: INDUSTRIES,
    functions: FUNCTIONS,
    objectives: OBJECTIVES,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let full = '';
        for await (const delta of streamAgentTurn({ system, messages: body.messages! })) {
          full += delta;
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'delta', text: delta }) + '\n'));
        }

        const parsed = parseEngagementReadyBlock(full);
        if (parsed) {
          // Resolve sponsor — existing or inline-created
          let sponsorRowId: string | null = null;
          let sponsorGraphId = parsed.sponsor_graph_node_id;

          const existing = persons.find((p) => p.graph_node_id === parsed.sponsor_graph_node_id);
          if (existing) {
            sponsorRowId = existing.id;
          } else if (parsed.sponsor_creation_needed && parsed.sponsor_payload) {
            const newPerson = await createPerson({
              name: parsed.sponsor_payload.name,
              title: parsed.sponsor_payload.title,
              organization: parsed.sponsor_payload.organization,
              role: parsed.sponsor_payload.role,
              cxo_function: parsed.sponsor_payload.cxo_function,
              primary_focus: parsed.sponsor_payload.primary_focus,
            });
            sponsorRowId = newPerson.id;
            sponsorGraphId = newPerson.graph_node_id ?? parsed.sponsor_graph_node_id;
            await syncPersonToGraph({
              graph_node_id: sponsorGraphId,
              name: newPerson.name,
              role: newPerson.role ?? parsed.sponsor_payload.role,
              organization: newPerson.organization ?? parsed.sponsor_payload.organization,
            });
          } else {
            throw new Error(`sponsor ${parsed.sponsor_graph_node_id} not found and no creation payload supplied`);
          }

          const engagement = await createEngagement({
            name: parsed.name,
            sponsor_person_id: sponsorRowId,
            industry_code: parsed.industry_code,
            function_code: parsed.function_code,
            objective_code: parsed.objective_code,
            topic_code: parsed.topic_code,
            maestro_person_id: maestro?.id ?? null,
          });

          await syncEngagementToGraph({
            graph_node_id: engagement.graph_node_id,
            name: engagement.name,
            industry_code: engagement.industry_code,
            function_code: engagement.function_code,
            objective_code: engagement.objective_code,
            topic_code: engagement.topic_code ?? '',
            sponsor_graph_node_id: sponsorGraphId,
            maestro_graph_node_id: maestro?.graph_node_id ?? null,
          });

          // Re-fetch so we return the full row (consistent with what the page expects)
          const hydrated = (await getEngagementByGraphId(engagement.graph_node_id)) ?? engagement;

          controller.enqueue(
            encoder.encode(JSON.stringify({ type: 'engagement_created', engagement: hydrated }) + '\n'),
          );
        }

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: message }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
  });
}
