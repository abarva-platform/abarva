// POST /api/v1/programs/originate · SSE classifier stream
//
// Input: OriginationForm (view-model).
// Output: Server-Sent Events with stage progress, then PatternMatch[] (top 3).
//
// Event types:
//   intake_parsed — origination form accepted, starting classifier
//   stage_1      — Haiku intent extraction complete
//   stage_2      — Pinecone vector match complete
//   stage_3      — weighted scoring complete
//   complete     — final { matches: PatternMatch[], extracted }
//   error        — { message }

import { NextRequest } from 'next/server';
import { classifyOrigination } from '@/lib/programs/classifier';
import { classifierMatchToViewModel } from '@/lib/programs/transformers';
import { requireTenancy, TenancyError } from '../_auth';
import type { ClassifierInput } from '@/lib/programs/types.db';
import type { ArchetypeKey, OriginationForm } from '@/lib/programs/types.ui';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function sseMessage(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
    }
    throw err;
  }

  let form: OriginationForm;
  try {
    const body = (await req.json()) as { originationForm?: OriginationForm };
    if (!body?.originationForm?.useCase) {
      return Response.json({ error: 'bad_request', detail: 'originationForm.useCase required' }, { status: 400 });
    }
    form = body.originationForm;
  } catch {
    return Response.json({ error: 'bad_request', detail: 'malformed JSON' }, { status: 400 });
  }

  const input: ClassifierInput = {
    useCase: form.useCase,
    industry: form.industryHint,
    sponsor: form.sponsorPersonId,
    entities: [],
    tenancy: ctx,
  };
  const { supabase } = await getProgramsRouteSupabase('origination');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      };

      try {
        send('intake_parsed', { name: form.name, useCase: form.useCase.slice(0, 160), startedAt: new Date().toISOString() });

        const output = await classifyOrigination(input);

        send('stage_1', {
          archetype: output.extracted.archetype,
          industry: output.extracted.industry,
          entities: output.extracted.entities,
          latencyMs: output.latencyMs.stage1,
        });

        send('stage_2', {
          candidateCount: output.matches.length,
          latencyMs: output.latencyMs.stage2,
        });

        // Enrich matches with catalog data for view-model conversion
        const keys = output.matches.map((m) => m.patternKey);
        const catalogByKey = new Map<string, Record<string, unknown>>();
        if (keys.length > 0) {
          const { data: catalog } = await supabase
            .from('engagement_topics')
            .select('topic_key, title, canonical_shape_json, deployment_count, successful_deployment_count')
            .in('topic_key', keys);
          for (const row of (catalog as Array<Record<string, unknown>> | null) ?? []) {
            catalogByKey.set(row.topic_key as string, row);
          }
        }

        const viewMatches = output.matches.map((m, i) =>
          classifierMatchToViewModel(
            m,
            (catalogByKey.get(m.patternKey) ?? null) as Parameters<typeof classifierMatchToViewModel>[1],
            i === 0,
          ),
        );

        send('stage_3', {
          totalLatencyMs: output.latencyMs.total,
          scoredCount: viewMatches.length,
        });

        send('complete', {
          matches: viewMatches,
          extracted: {
            archetype: output.extracted.archetype as ArchetypeKey | null,
            industry: output.extracted.industry,
            objectives: output.extracted.objectives,
            entities: output.extracted.entities,
          },
        });
        controller.close();
      } catch (err) {
        send('error', { message: (err as Error).message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
