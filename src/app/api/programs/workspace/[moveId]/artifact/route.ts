// POST /api/programs/workspace/[moveId]/artifact · Wave 4A workspace artifact drafting
//
// Lets the Nexus workspace chat generate deliverable drafts and persist them to
// deliverables_v2. Mirrors the pattern from /api/v1/programs/[programId]/nexus/draft
// but scoped to the strategic-moves workspace surface and simplified for the
// phase-keyed workspace schema.
//
// Body: {
//   phase: 1-5,
//   deliverableKey: string,  // e.g. "charter", "diagnose_report", "design_spec", "roadmap", "mobilize_plan"
//   title: string,
//   prompt: string           // what Nexus should draft
// }
// Returns: { deliverableId, versionId, content, phase }

import { NextRequest } from 'next/server';
import { streamAgentTurn } from '@/lib/agent/stream';
import { assembleContext, draftModuleDeliverable } from '@/lib/programs/nexus';
import { runQualityGates } from '@/lib/programs/quality-gates';
import { raiseMaestroFlag } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { getProgramById } from '@/lib/programs/queries';
import { PHASE_LABEL_MAP } from '@/lib/programs/programs-fixture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PHASE_TO_MODULE_KEY: Record<number, string> = {
  1: 'charter',
  2: 'diagnose',
  3: 'design',
  4: 'roadmap',
  5: 'mobilize',
};

const PHASE_LABEL: Record<number, string> = {
  1: PHASE_LABEL_MAP[1] ?? 'Discovery',
  2: PHASE_LABEL_MAP[2] ?? 'Synthesis',
  3: PHASE_LABEL_MAP[3] ?? 'Design',
  4: PHASE_LABEL_MAP[4] ?? 'Execution Roadmap',
  5: PHASE_LABEL_MAP[5] ?? 'Approval & Mobilization',
};

function deliverableKeyToExpectedShape(
  deliverableKey: string,
): 'charter' | 'outcome' | 'design' | 'free' {
  if (deliverableKey === 'charter') return 'charter';
  if (deliverableKey === 'outcome_report' || deliverableKey === 'mobilize_plan') return 'outcome';
  if (deliverableKey === 'design_spec') return 'design';
  return 'free';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moveId: string }> },
) {
  try {
    const { moveId } = await params;

    // 1. Auth gate
    const ctx = await requireTenancy();

    // 2. Tenant gate — confirm the move/program belongs to this tenant
    const program = await getProgramById(ctx, moveId);
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });
    if (program.archivedAt || program.deletedAt) {
      return Response.json({ error: 'archived_or_deleted' }, { status: 410 });
    }

    // 3. Validate body
    const body = (await req.json()) as {
      phase?: number;
      deliverableKey?: string;
      title?: string;
      prompt?: string;
    };

    if (
      !body?.phase ||
      !Number.isInteger(body.phase) ||
      body.phase < 1 ||
      body.phase > 5
    ) {
      return Response.json(
        { error: 'bad_request', detail: 'phase must be an integer in [1,5]' },
        { status: 400 },
      );
    }
    if (!body?.deliverableKey || !body?.title || !body?.prompt) {
      return Response.json(
        { error: 'bad_request', detail: 'deliverableKey + title + prompt required' },
        { status: 400 },
      );
    }

    const phase = body.phase;
    const moduleKey = PHASE_TO_MODULE_KEY[phase];
    const phaseLabel = PHASE_LABEL[phase];

    // 4. Assemble context (reuses existing nexus context assembly)
    const context = await assembleContext(ctx, moveId);

    // 5. Phase-specific system prompt
    const systemPrompt = [
      `You are Nexus, workspace delivery agent for ${phaseLabel}.`,
      `Draft the ${body.deliverableKey} for ${context.program.name}.`,
      `Move code: ${program.name}. Phase: P${phase} ${phaseLabel}.`,
      `Archetype: ${context.program.archetype ?? 'strategic_transformation'}.`,
      context.patternPreload
        ? 'Use attached pattern pre-load as the canonical shape.'
        : '',
      'Draft should be self-contained, cite provenance inline when possible, commit to claims.',
      'Output should be a structured deliverable — not a chat reply. Use headings, bullets, and evidence anchors.',
    ]
      .filter(Boolean)
      .join('\n\n');

    // 6. Generate content via streamAgentTurn
    let content = '';
    for await (const chunk of streamAgentTurn({
      system: systemPrompt,
      messages: [{ role: 'user', content: body.prompt }],
      model: process.env.NEXUS_COMPOSER_MODEL ?? 'claude-opus-4-7',
      maxTokens: 4096,
    })) {
      content += chunk;
    }

    // 7. Quality gates — hard failures block the draft; raise a Maestro flag for review
    const expectedShape = deliverableKeyToExpectedShape(body.deliverableKey);
    const gates = runQualityGates(content, { expectedShape });

    if (!gates.pass) {
      const hardCount = gates.issues.filter((i) => i.severity === 'hard').length;
      await raiseMaestroFlag(ctx, moveId, {
        flagType: 'quality_concern',
        severity: 'warning',
        raisedBy: 'nexus',
        headline: `Nexus workspace draft for ${body.deliverableKey} (phase ${phase}) blocked at quality gate (${hardCount} hard issue${hardCount === 1 ? '' : 's'})`,
        context: {
          phase,
          module_key: moduleKey,
          deliverable_key: body.deliverableKey,
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
          detail:
            'Draft did not pass Nexus quality gates. Maestro flag raised for review.',
        },
        { status: 422 },
      );
    }

    // 8. Persist to deliverables_v2 via draftModuleDeliverable
    const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
      programId: moveId,
      moduleKey,
      deliverableTypeKey: body.deliverableKey,
      title: body.title,
      draftContent: gates.cleanedContent,
      structuredData: {
        prompt: body.prompt,
        phase,
        mode: 'workspace_artifact',
        gate_metadata: gates.metadata,
      },
      provenanceMap: {
        pattern_key:
          (context.patternPreload?.topic_key as string | undefined) ?? null,
        module: moduleKey,
        program: context.program.name,
        phase,
        phase_label: phaseLabel,
        provenance_hints: gates.metadata.provenanceHints,
      },
    });

    return Response.json({
      deliverableId,
      versionId,
      content: gates.cleanedContent,
      phase,
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {}
    console.error('[POST /programs/workspace/:moveId/artifact]', err);
    return Response.json(
      { error: 'internal_error', message: (err as Error).message },
      { status: 500 },
    );
  }
}
