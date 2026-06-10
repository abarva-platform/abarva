// POST /api/v1/deliverables/generate
//
// In-product entry point for the Deliverable Intelligence Orchestrator. Resolves the
// caller's tenant + user, runs the governed multi-pass generation, and returns the
// persisted artifact reference (or the quality-gate blockers when the document is
// refused). One client boundary is enforced by requireTenancy.

import type { NextRequest } from 'next/server';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { runDeliverableForTenant } from '@/lib/deliverables/orchestrator/generate-service';
import type { AudienceRole, DeliverableModule, OutputFormat } from '@/lib/deliverables/orchestrator/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // multi-pass board-grade generation is long-running

interface GenerateBody {
  module?: DeliverableModule;
  useCaseArchetype?: string;
  deliverableType?: string;
  audience?: AudienceRole[];
  decisionContext?: string;
  clientDisplayName?: string;
  initiativeDisplayName?: string;
  sourceArtifactRef?: string;
  evidenceQuery?: string;
  outputFormats?: OutputFormat[];
  model?: string;
}

const MODULES: DeliverableModule[] = ['source', 'moves', 'tower', 'intelligence'];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireTenancy(); // { clientId, clientKey, userId }
    if (!ctx.clientKey) {
      return Response.json({ error: 'no_tenant_key', detail: 'Active tenant has no resolvable tenant key.' }, { status: 409 });
    }

    let body: GenerateBody;
    try {
      body = (await req.json()) as GenerateBody;
    } catch {
      return Response.json({ error: 'bad_request', detail: 'Body was not valid JSON.' }, { status: 400 });
    }

    if (!body.module || !MODULES.includes(body.module)) {
      return Response.json({ error: 'bad_request', detail: `module must be one of ${MODULES.join(', ')}.` }, { status: 400 });
    }
    const useCaseArchetype = body.useCaseArchetype?.trim();
    const deliverableType = body.deliverableType?.trim();
    const sourceArtifactRef = body.sourceArtifactRef?.trim();
    const decisionContext = body.decisionContext?.trim();
    if (!useCaseArchetype) return Response.json({ error: 'bad_request', detail: 'useCaseArchetype is required.' }, { status: 400 });
    if (!deliverableType) return Response.json({ error: 'bad_request', detail: 'deliverableType is required.' }, { status: 400 });
    if (!sourceArtifactRef) return Response.json({ error: 'bad_request', detail: 'sourceArtifactRef is required.' }, { status: 400 });
    if (!decisionContext) return Response.json({ error: 'bad_request', detail: 'decisionContext is required.' }, { status: 400 });

    const result = await runDeliverableForTenant({
      module: body.module,
      useCaseArchetype,
      deliverableType,
      audience: body.audience,
      decisionContext,
      clientDisplayName: body.clientDisplayName?.trim() || 'Client',
      initiativeDisplayName: body.initiativeDisplayName?.trim() || useCaseArchetype,
      sourceArtifactRef,
      evidenceQuery: body.evidenceQuery,
      outputFormats: body.outputFormats,
      ...(body.model ? { model: body.model } : {}),
      tenantClientKey: ctx.clientKey,
      clientId: ctx.clientId,
      userId: ctx.userId,
    });

    if (!result.ok) {
      // 422: generated but refused by the quality/plan gate — surface why, don't ship a weak doc
      return Response.json(
        {
          error: 'quality_gate_blocked',
          detail: result.blockedReason ?? 'The deliverable did not meet the board-grade quality bar.',
          blockers: result.blockers ?? [],
          retrievedEvidence: result.retrievedEvidence,
          sectionCount: result.sectionCount,
        },
        { status: 422 },
      );
    }

    return Response.json({
      success: true,
      artifactId: result.artifactId,
      blobUrl: result.blobUrl,
      qualityPass: result.qualityPass,
      sectionCount: result.sectionCount,
      retrievedEvidence: result.retrievedEvidence,
      warnings: result.warnings ?? [],
    });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error('[POST /api/v1/deliverables/generate]', err);
    return Response.json({ error: 'internal_error' }, { status: 500 });
  }
}
