// POST /api/v1/programs/:programId/nexus/ask · Programs free-text ask
//
// Free-text turns are program-scoped. Each turn:
//   1. Resolves tenancy + active client
//   2. Creates or validates a side-panel thread
//   3. Assembles program context
//   4. Runs retrieval-backed Nexus synthesis
//   5. Streams citations, text deltas, and an explicit completion payload

import { NextRequest } from 'next/server';
import { getActiveClientRow } from '@/lib/active-client';
import { runProgramsNexusTurn } from '@/lib/programs/nexus-free-text';
import { assembleContext, createThread, touchThread } from '@/lib/programs/nexus';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, TenancyError } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function sseMessage(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function summarizeThreadTitle(query: string): string {
  const compact = query.replace(/\s+/g, ' ').trim();
  return compact.length <= 96 ? compact : `${compact.slice(0, 93)}...`;
}

function splitForStream(text: string): string[] {
  const sentences = text
    .split(/\n\n+/)
    .flatMap((paragraph) => paragraph.match(/[^.!?]+[.!?]?/g) ?? [paragraph])
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return sentences.length > 0 ? sentences : [text.trim()];
}

async function validateThreadOwnership(args: {
  threadId: string;
  programId: string;
  userId: string;
}): Promise<boolean> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('program_threads')
    .select('id, engagement_id, user_id')
    .eq('id', args.threadId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return false;

  const thread = data as { engagement_id: string; user_id: string };
  return thread.user_id === args.userId && thread.engagement_id === args.programId;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return Response.json(
        { error: err.code },
        { status: err.code === 'unauthenticated' ? 401 : 403 },
      );
    }
    throw err;
  }

  const { programId } = await params;

  let body: { query?: string; threadId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return Response.json({ error: 'bad_request', detail: 'malformed JSON' }, { status: 400 });
  }

  const userQuery = body.query?.trim();
  if (!userQuery) {
    return Response.json({ error: 'bad_request', detail: 'query required' }, { status: 400 });
  }

  const activeClient = await getActiveClientRow();
  if (!activeClient) {
    return Response.json({ error: 'no_client' }, { status: 403 });
  }

  let threadId = body.threadId?.trim() || null;
  if (threadId) {
    const isOwnedThread = await validateThreadOwnership({
      threadId,
      programId,
      userId: ctx.userId,
    });
    if (!isOwnedThread) {
      return Response.json({ error: 'thread_not_found' }, { status: 404 });
    }
  } else {
    const thread = await createThread(ctx, {
      programId,
      mode: 'side_panel',
      title: summarizeThreadTitle(userQuery),
    });
    threadId = thread.id;
  }

  const context = await assembleContext(ctx, programId);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      const started = Date.now();

      try {
        send('context_ready', {
          threadId,
          programName: context.program.name,
          currentPhase: context.program.currentPhase,
          moduleCount: context.modules.length,
          deliverableCount: context.deliverables.length,
          flagCount: context.flags.length,
          hasPatternAnchor: Boolean(context.patternPreload?.topic_key),
        });

        const result = await runProgramsNexusTurn({
          ctx: {
            clientKey: activeClient.key,
            clientName: activeClient.name,
            industryCode: activeClient.industry_code,
            userId: ctx.userId,
          },
          message: userQuery,
          context,
        });

        for (const source of result.sources) {
          send('source_attached', { source });
        }

        for (const citation of result.citations) {
          send('citation_attached', { citation });
        }

        for (const chunk of splitForStream(result.response)) {
          send('delta', { text: `${chunk}${chunk.endsWith('\n') ? '' : ' '}` });
        }

        await touchThread(threadId).catch(() => void 0);

        send('complete', {
          threadId,
          routeType: result.routeType,
          confidence: result.confidence,
          sparseEvidence: result.sparseEvidence,
          activePatternSlug: result.activePatternSlug,
          citationCount: result.citations.length,
          citations: result.citations,
          suggestions: result.suggestions,
          latencyMs: Date.now() - started,
        });
      } catch (err) {
        send('error', { message: (err as Error).message });
      } finally {
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
