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
import { runQualityGates } from '@/lib/programs/quality-gates';
import { raiseMaestroFlag } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ programId: string }> }) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
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

    // Quality gates per Packet 8 §8.7 — provenance, voice, pattern adherence, length.
    // Hard failures block draft from landing as a deliverable; raise a Maestro
    // oversight flag for review. Soft failures pass through with metadata.
    const expectedShape =
      body.deliverableTypeKey === 'charter' ? 'charter' :
      body.deliverableTypeKey === 'outcome_report' ? 'outcome' :
      body.deliverableTypeKey === 'design_spec' ? 'design' :
      body.deliverableTypeKey === 'execution_plan' ? 'free' :
      'free';
    const gates = runQualityGates(content, { expectedShape });

    if (!gates.pass) {
      await raiseMaestroFlag(ctx, programId, {
        flagType: 'quality_concern',
        severity: 'warning',
        raisedBy: 'nexus',
        headline: `Nexus draft for ${body.moduleKey} blocked at quality gate (${gates.issues.filter((i) => i.severity === 'hard').length} hard issue${gates.issues.filter((i) => i.severity === 'hard').length === 1 ? '' : 's'})`,
        context: {
          module_key: body.moduleKey,
          deliverable_type_key: body.deliverableTypeKey,
          issues: gates.issues,
          word_count: gates.metadata.wordCount,
          provenance_hints: gates.metadata.provenanceHints,
        },
      });
      return Response.json(
        {
          error: 'quality_gate_failed',
          issues: gates.issues,
          metadata: gates.metadata,
          rawContent: content,
          detail: 'Draft did not pass Nexus quality gates. Maestro flag raised for review.',
        },
        { status: 422 },
      );
    }

    const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: body.moduleKey,
      deliverableTypeKey: body.deliverableTypeKey,
      title: body.title,
      draftContent: gates.cleanedContent,
      structuredData: { prompt: body.prompt, mode: 'module_drafting', gate_metadata: gates.metadata },
      provenanceMap: {
        pattern_key: (context.patternPreload?.topic_key as string | undefined) ?? null,
        module: body.moduleKey,
        program: context.program.name,
        provenance_hints: gates.metadata.provenanceHints,
      },
      contextHash: hashContext(context),
    });

    return Response.json({
      deliverableId,
      versionId,
      content: gates.cleanedContent,
      qualityGates: gates,
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
