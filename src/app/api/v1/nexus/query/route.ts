// POST /api/v1/nexus/query
// The main event · SSE stream driving the 6-phase orchestrator.
// Events per spec §7.2: turn_started · clarifying_question ·
// retrieval_progress · content_delta · source_attached · turn_complete
// · error.

import { NextRequest } from 'next/server';
import { runPipeline } from '@/lib/nexus/orchestrator';
import { createThread, touchThread } from '@/lib/intelligence/db/threadRepository';
import { appendTurn, listTurns } from '@/lib/intelligence/db/turnRepository';
import { makeNexusStream, SSE_HEADERS } from '@/lib/nexus/sseStream';
import { requireTenancy, TenancyError } from '../../_intel-auth';
import type { NexusFormat } from '@/lib/intelligence/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface QueryBody {
  query?: string;
  threadId?: string;
  conversationId?: string;
  format_override?: NexusFormat;
  capabilities_hints?: string[];
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

  let body: QueryBody;
  try {
    body = (await req.json()) as QueryBody;
  } catch {
    return Response.json({ error: 'bad_request', detail: 'malformed JSON' }, { status: 400 });
  }
  if (!body?.query) {
    return Response.json({ error: 'bad_request', detail: 'query required' }, { status: 400 });
  }
  const query = body.query;

  const stream = makeNexusStream(async (emitter) => {
    // Resolve or create the thread
    let threadId = body.threadId;
    if (!threadId) {
      const thread = await createThread(ctx, {
        title: query.slice(0, 80),
        conversationId: body.conversationId,
      });
      threadId = thread.id;
    }

    // Persist the user turn first
    await appendTurn(ctx, {
      threadId,
      role: 'user',
      payload: { answer: query },
    });

    const priorTurns = await listTurns(ctx, threadId, { limit: 50 });
    const turnCount = priorTurns.filter((t) => t.role === 'nexus').length;

    const turnId = `turn-${Date.now()}`;
    emitter.emit({
      type: 'turn_started',
      turnId,
      mode: 'research',
      format: body.format_override ?? 'one_sentence',
    });

    const result = await runPipeline({
      query,
      tenancy: ctx,
      priorTurns,
      formatOverride: body.format_override,
      onProgress: (p) => {
        emitter.emit({
          type: 'retrieval_progress',
          phase: p.phase,
          status: p.status,
          latencyMs: p.latencyMs,
        });
      },
      onTextDelta: (text) => {
        emitter.emit({ type: 'content_delta', text });
      },
    });

    if (result.clarifying?.fires) {
      emitter.emit({
        type: 'clarifying_question',
        question: result.clarifying.question ?? 'Clarification needed',
        options: result.clarifying.options ?? [],
      });
    }

    // Attach source pills
    for (const source of result.bundle.sources) {
      emitter.emit({
        type: 'source_attached',
        claimId: source.id,
        source: source as unknown as Record<string, unknown>,
      });
    }

    // Persist assistant turn
    const assistantTurn = await appendTurn(ctx, {
      threadId,
      role: 'nexus',
      mode: result.mode,
      format: result.format,
      confidence: (result.payload.confidence as 'high' | 'medium' | 'low' | null) ?? null,
      payload: result.payload,
      sources: result.bundle.sources,
      capabilitiesActive: result.clarifying?.fires ? ['clarifying'] : [],
      latencyMs: result.latencyMs.total,
      firstTokenMs: result.latencyMs.compose > 0 ? result.latencyMs.compose : null,
    });

    // Auto-advance thread state at turn 3 per spec §1.3 state C
    if (turnCount + 1 >= 3) {
      await touchThread(ctx, threadId).catch(() => void 0);
    }

    emitter.emit({
      type: 'turn_complete',
      turnId: assistantTurn.id,
      payload: {
        threadId,
        mode: result.mode,
        format: result.format,
        latencyMs: result.latencyMs,
        strippedCount: result.strippedCount,
      },
    });
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
