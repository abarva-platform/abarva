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
import { logAudit } from '@/lib/audit/log';
import { assignTopic } from '@/lib/topics/db';
import { canonicalClientDisplayName } from '@/lib/client-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  const { getActiveClientRow } = await import('@/lib/active-client');
  const [maestro, persons, activeClient] = await Promise.all([
    getCurrentMaestro(),
    getAllPersons(),
    getActiveClientRow(),
  ]);
  const activeClientDisplayName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    activeClient?.name ??
    null;
  // Scope sponsor candidates to the active client's organization when
  // we can identify one. Case-insensitive substring match handles the
  // 'Meridian Health' vs 'Meridian Health System' variance.
  const activeOrgKeyword = activeClientDisplayName?.split(/\s+/)[0]?.toLowerCase() ?? null;
  const scopedPersons = activeOrgKeyword
    ? persons.filter((p) => (p.organization ?? '').toLowerCase().includes(activeOrgKeyword))
    : persons;
  // Expose richer role/title/unit metadata so Nexus can surface non-CXO
  // sponsors (VPs, directors, functional heads) alongside C-suite.
  const knownPersons = scopedPersons.map((p) => {
    const style = (p.communication_style ?? {}) as {
      title?: string;
      cxo_function?: string;
      primary_focus?: string;
      unit?: string;
    };
    return {
      graph_node_id: p.graph_node_id ?? '',
      name: p.name,
      role: p.role,
      organization: p.organization,
      title: style.title ?? null,
      cxo_function: style.cxo_function ?? null,
      primary_focus: style.primary_focus ?? null,
      unit: style.unit ?? null,
    };
  });

  const system = assembleEngagementCreateSystemPrompt({
    maestro,
    knownPersons,
    industries: INDUSTRIES,
    functions: FUNCTIONS,
    objectives: OBJECTIVES,
    activeClient: activeClient
      ? { name: activeClientDisplayName ?? activeClient.name, industryCode: activeClient.industry_code }
      : null,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        console.info('[program.create.start]', {
          messageCount: body.messages?.length ?? 0,
          activeClientId: activeClient?.id ?? null,
          activeClientName: activeClientDisplayName,
        });
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
            const personSync = await Promise.allSettled([
              syncPersonToGraph({
              graph_node_id: sponsorGraphId,
              name: newPerson.name,
              role: newPerson.role ?? parsed.sponsor_payload.role,
              organization: newPerson.organization ?? parsed.sponsor_payload.organization,
              }),
            ]);
            if (personSync[0]?.status === 'rejected') {
              console.warn('[program.create.person_graph_sync_failed]', personSync[0].reason);
            }
          } else {
            throw new Error(`sponsor ${parsed.sponsor_graph_node_id} not found and no creation payload supplied`);
          }

          const engagement = await createEngagement({
            name: parsed.name,
            sponsor_person_id: sponsorRowId,
            client_id: activeClient?.id ?? null,
            industry_code: parsed.industry_code,
            function_code: parsed.function_code,
            objective_code: parsed.objective_code,
            topic_code: parsed.topic_code,
            maestro_person_id: maestro?.id ?? null,
          });
          console.info('[program.create.committed]', {
            id: engagement.id,
            graph_node_id: engagement.graph_node_id,
            client_id: activeClient?.id ?? null,
            sponsor_person_id: sponsorRowId,
          });

          // Re-fetch so we return the full row (consistent with what the page expects)
          const hydrated = (await getEngagementByGraphId(engagement.graph_node_id)) ?? engagement;
          if (!hydrated?.graph_node_id) {
            throw new Error('engagement_persisted_without_graph_node_id');
          }

          // Denormalise sponsor + label data for the confirmation readout so
          // the client doesn't need a second round-trip to render it.
          const sponsorRow = sponsorRowId ? persons.find((p) => p.id === sponsorRowId) ?? null : null;
          const sponsorStyle = ((sponsorRow?.communication_style ?? {}) as {
            title?: string;
            cxo_function?: string;
            primary_focus?: string;
          });
          const sponsorSummary = sponsorRow
            ? {
                graph_node_id: sponsorRow.graph_node_id,
                name: sponsorRow.name,
                role: sponsorRow.role,
                organization: sponsorRow.organization,
                title: sponsorStyle.title ?? null,
                cxo_function: sponsorStyle.cxo_function ?? null,
                primary_focus: sponsorStyle.primary_focus ?? null,
              }
            : parsed.sponsor_creation_needed && parsed.sponsor_payload
              ? {
                  graph_node_id: sponsorGraphId,
                  name: parsed.sponsor_payload.name,
                  role: parsed.sponsor_payload.role,
                  organization: parsed.sponsor_payload.organization,
                  title: parsed.sponsor_payload.title ?? null,
                  cxo_function: parsed.sponsor_payload.cxo_function ?? null,
                  primary_focus: parsed.sponsor_payload.primary_focus ?? null,
                }
              : null;

          const labels = {
            industry: INDUSTRIES.find((i) => i.code === parsed.industry_code)?.name ?? parsed.industry_code,
            function: FUNCTIONS.find((f) => f.code === parsed.function_code)?.name ?? parsed.function_code,
            objective: OBJECTIVES.find((o) => o.code === parsed.objective_code)?.name ?? parsed.objective_code,
          };

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'engagement_created',
                engagement: hydrated,
                sponsor: sponsorSummary,
                labels,
                active_client: activeClientDisplayName,
              }) + '\n',
            ),
          );
          console.info('[program.create.response_sent]', {
            id: hydrated.id,
            graph_node_id: hydrated.graph_node_id,
            active_client: activeClientDisplayName,
          });

          const sideEffects = await Promise.allSettled([
            syncEngagementToGraph({
              graph_node_id: engagement.graph_node_id,
              name: engagement.name,
              industry_code: engagement.industry_code,
              function_code: engagement.function_code,
              objective_code: engagement.objective_code,
              topic_code: engagement.topic_code ?? '',
              sponsor_graph_node_id: sponsorGraphId,
              maestro_graph_node_id: maestro?.graph_node_id ?? null,
            }).then(() => {
              console.info('[program.create.graph_synced]', {
                graph_node_id: engagement.graph_node_id,
                sponsor_graph_node_id: sponsorGraphId,
              });
            }),
            parsed.topic_code
              ? assignTopic({
                  engagementId: engagement.id,
                  topicKey: parsed.topic_code,
                  assignedBy: maestro?.id ?? null,
                  isPrimary: true,
                }).then(() => {
                  console.info('[program.create.topic_assigned]', {
                    engagement_id: engagement.id,
                    topic_key: parsed.topic_code,
                  });
                })
              : Promise.resolve(),
            logAudit({
              actorPersonId: maestro?.id ?? null,
              action: 'engagement.created',
              targetTable: 'engagements',
              targetId: engagement.id,
              newValue: {
                name: engagement.name,
                graph_node_id: engagement.graph_node_id,
                industry_code: engagement.industry_code,
                sponsor_person_id: engagement.sponsor_person_id,
                current_phase: 0,
              },
            }),
          ]);

          for (const effect of sideEffects) {
            if (effect.status === 'rejected') {
              console.warn('[program.create.side_effect_failed]', effect.reason);
            }
          }
        }

        controller.enqueue(encoder.encode(JSON.stringify({ type: 'done' }) + '\n'));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'unknown error';
        console.error('[program.create.error]', err);
        controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: message }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' },
  });
}
