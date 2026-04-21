// POST /api/v1/programs/:programId/nexus/draft · Mode B module-embedded drafting
//
// Non-SSE (wait for full draft, then return). The draft lands as a new
// version on deliverables_v2 + deliverable_versions, attributed to
// created_by='nexus'. Caller can then POST /publish to move to in_review.
//
// Body: { moduleKey, deliverableTypeKey, title, prompt }
// Returns: { deliverableId, versionId, content, provenance }

import { NextRequest } from 'next/server';
import { streamAgentTurn } from '@/lib/agent/stream';
import { assembleContext, describePendingComposerCall, draftModuleDeliverable } from '@/lib/programs/nexus';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json()) as {
      moduleKey?: string;
      deliverableTypeKey?: string;
      title?: string;
      prompt?: string;
    };
    if (!body?.moduleKey || !body?.deliverableTypeKey || !body?.title || !body?.prompt) {
      return Response.json(
        { error: 'bad_request', detail: 'moduleKey + deliverableTypeKey + title + prompt required' },
        { status: 400 },
      );
    }

    const context = await assembleContext(ctx, programId);
    const plan = describePendingComposerCall({ mode: 'module_drafting', context, prompt: body.prompt });

    const systemPrompt = [
      'You are Nexus, embedded delivery agent drafting a Program deliverable.',
      plan.systemPromptHint,
      `Program: ${context.program.name}`,
      `Module: ${body.moduleKey}`,
      `Deliverable type: ${body.deliverableTypeKey}`,
      `Archetype: ${context.program.archetype ?? 'strategic_transformation'}`,
      context.patternPreload ? 'Use attached pattern pre-load as the canonical shape.' : '',
      'Output should be self-contained, cite provenance inline when possible, commit to claims.',
    ].filter(Boolean).join('\n\n');

    let content = '';
    for await (const chunk of streamAgentTurn({
      system: systemPrompt,
      messages: [{ role: 'user', content: body.prompt }],
      model: plan.model,
      maxTokens: 4096,
    })) {
      content += chunk;
    }

    const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: body.moduleKey,
      deliverableTypeKey: body.deliverableTypeKey,
      title: body.title,
      draftContent: content,
      structuredData: { prompt: body.prompt, mode: 'module_drafting' },
      provenanceMap: {
        pattern_key: (context.patternPreload?.topic_key as string | undefined) ?? null,
        module: body.moduleKey,
        program: context.program.name,
      },
      contextHash: hashContext(context),
    });

    return Response.json({
      deliverableId,
      versionId,
      content,
      provenance: {
        patternAttached: !!context.patternPreload,
        moduleCount: context.modules.length,
        flagCount: context.flags.length,
      },
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/nexus/draft]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}

function hashContext(context: Awaited<ReturnType<typeof assembleContext>>): string {
  const shape = [
    context.program.name,
    context.program.currentPhase,
    context.modules.length,
    context.deliverables.length,
    context.flags.length,
    Date.now().toString().slice(0, -4),
  ].join('|');
  let hash = 0;
  for (let i = 0; i < shape.length; i += 1) hash = ((hash << 5) - hash + shape.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(16);
}
