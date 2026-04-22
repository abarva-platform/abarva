// POST /api/v1/programs/:programId/nexus/ask · Mode A side-panel Q&A
//
// SSE stream. Mode A is read-only — no program-state writes. Assembles
// context via assembleContext() then streams Claude Opus 4.7 response
// via the shared streamAgentTurn infra.
//
// Events:
//   context_ready  — context bundle summary
//   delta          — { text } text deltas from Claude
//   sources        — { sources } provenance pills (future)
//   complete       — { latency_ms, token_estimate }
//   error          — { message }

import { NextRequest } from 'next/server';
import { streamAgentTurn } from '@/lib/agent/stream';
import { assembleContext, describePendingComposerCall, touchThread } from '@/lib/programs/nexus';
import { getServerSupabase } from '@/lib/supabase-server';
import { requireTenancy, TenancyError } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function sseMessage(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  let ctx;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    if (err instanceof TenancyError) {
      return Response.json({ error: err.code }, { status: err.code === 'unauthenticated' ? 401 : 403 });
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
  if (!body?.query) {
    return Response.json({ error: 'bad_request', detail: 'query required' }, { status: 400 });
  }

  const userQuery = body.query;
  const threadId = body.threadId;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      const started = Date.now();

      try {
        const context = await assembleContext(ctx, programId);
        const composerPlan = describePendingComposerCall({
          mode: 'side_panel',
          context,
          prompt: userQuery,
        });

        send('context_ready', {
          programName: context.program.name,
          currentPhase: context.program.currentPhase,
          moduleCount: context.modules.length,
          deliverableCount: context.deliverables.length,
          flagCount: context.flags.length,
          hasPattern: !!context.patternPreload,
          tokenEstimate: composerPlan.contextTokenEstimate,
        });

        const systemPrompt = buildSystemPrompt(composerPlan.systemPromptHint, context);
        const gen = streamAgentTurn({
          system: systemPrompt,
          messages: [{ role: 'user', content: userQuery }],
          model: composerPlan.model,
          maxTokens: 1024,
        });

        for await (const chunk of gen) {
          send('delta', { text: chunk });
        }

        if (threadId) {
          await touchThread(threadId).catch(() => void 0);
        }

        send('complete', { latencyMs: Date.now() - started });
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

function buildSystemPrompt(modeHint: string, context: Awaited<ReturnType<typeof assembleContext>>): string {
  const sections = [
    'You are Nexus, the embedded delivery agent for AbarVa Programs. Voice: commit to claims, never hedge, always cite provenance when possible. Follow the 8 response formats when appropriate (ONE-SENTENCE · MATRIX · CRUX · RANKED LIST · ARTIFACT · CLARIFICATION · COUNTER-PAIR · "I DON\'T KNOW"). Forbidden phrases: "As an AI language model", "Great question", "Let me know if you need anything else", apologies for not knowing.',
    `Mode: ${modeHint}`,
    `Program: ${context.program.name}`,
    `Current phase: ${context.program.currentPhase ?? 'not yet on a phase'}`,
    `Archetype: ${context.program.archetype ?? 'unknown'}`,
    context.modules.length > 0 ? `Modules: ${context.modules.map((m) => `${m.moduleKey}(${m.status})`).join(', ')}` : '',
    context.deliverables.length > 0 ? `Deliverables: ${context.deliverables.map((d) => `${d.typeKey}(${d.status})`).join(', ')}` : '',
    context.flags.length > 0 ? `Open flags: ${context.flags.map((f) => f.headline).join(' · ')}` : '',
    context.patternPreload ? 'A pattern pre-load is attached; lean on it when relevant.' : 'No pattern attached.',
  ];
  return sections.filter(Boolean).join('\n\n');
}
