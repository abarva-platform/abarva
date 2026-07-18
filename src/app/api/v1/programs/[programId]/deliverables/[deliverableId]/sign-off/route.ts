// POST /api/v1/programs/:programId/deliverables/:deliverableId/sign-off
// in_review → signed_off. Requires sponsor or approver authority per Packet 4 matrix.
//
// Two modes, both real client approval — not just an AI-generation trigger:
//   - JSON body (or no body): approve the AI-drafted content as-is.
//   - multipart/form-data with a `file` field: approve by uploading an edited
//     replacement. The file is registered in move_artifacts
//     (artifact_family=generated_deliverable) via the existing File Cabinet
//     write path, then linked back via deliverables_v2.approved_artifact_id.
// Either way, deliverables_v2.signed_off_version is set to the version being
// approved so later regeneration (v2-generator.ts) can never silently clobber
// the approval record, and moves-generate-deps.ts / deliverable-content-signals.ts
// prefer this version when feeding content forward to the next phase.

import { signOffDeliverable } from '@/lib/programs/mutations';
import { hasAuthority } from '@/lib/programs/governance';
import { requireTenancy, tenancyErrorResponse } from '../../../../_auth';
import { getProgramById } from '@/lib/programs/queries';
import { getProgramsRouteSupabase } from '@/lib/programs/programs-auth-mode-server';
import { saveMoveArtifact } from '@/lib/programs/deliverables/move-artifacts';
import { DELIVERABLE_REGISTRY } from '@/lib/programs/deliverable-registry';
import {
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '@/lib/programs/attachments/mime';
import { extractProgramEvidenceFromUploadBuffer } from '@/lib/programs/evidence-ingestion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request, { params }: { params: Promise<{ programId: string; deliverableId: string }> }) {
  try {
    const { programId, deliverableId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase('mutation');
    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: 'not_found' }, { status: 404 });

    const canApprove = (await hasAuthority(ctx, programId, 'approver', { supabase })) || ctx.role === 'founder' || ctx.role === 'maestro';
    if (!canApprove) {
      return Response.json({ error: 'forbidden', detail: 'approver authority or higher required' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') ?? '';
    let approvedArtifactId: string | undefined;
    let approvedContent:
      | {
          content: string;
          fileName: string;
          mimeType: string;
          parseMethod: string;
          warnings: string[];
        }
      | undefined;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('file');
      if (file instanceof File && file.size > 0) {
        if (!isWithinSizeLimit(file.size)) {
          return Response.json({ error: 'file_too_large', detail: `max ${MAX_ATTACHMENT_SIZE_BYTES} bytes` }, { status: 413 });
        }
        if (file.type && !isAllowedMimeType(file.type)) {
          return Response.json({ error: 'unsupported_type', detail: file.type }, { status: 415 });
        }

        const { data: deliverableRow, error: deliverableError } = await supabase
          .from('deliverables_v2')
          .select('deliverable_type_key, title')
          .eq('id', deliverableId)
          .eq('engagement_id', programId)
          .maybeSingle();
        if (deliverableError) throw deliverableError;
        if (!deliverableRow) return Response.json({ error: 'not_found' }, { status: 404 });
        const { deliverable_type_key: deliverableTypeKey, title } = deliverableRow as {
          deliverable_type_key: string;
          title: string;
        };

        const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
        const body = Buffer.from(await file.arrayBuffer());
        const phase = DELIVERABLE_REGISTRY.find(
          (spec) => spec.deliverableTypeKey === deliverableTypeKey,
        )?.phase ?? 0;
        const parsed = await extractProgramEvidenceFromUploadBuffer({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          buffer: body,
          cacheScope: `program:${programId}:deliverable:${deliverableId}:approval`,
        });
        const parsedText = parsed.extractedText?.trim();
        if (!parsedText) {
          return Response.json(
            {
              error: 'approved_upload_not_extractable',
              detail:
                'Client-approved replacement files must contain extractable text before they can become the downstream source of truth.',
              parseMethod: parsed.extractedStructured.parse_method,
              warnings: parsed.extractedStructured.warnings,
            },
            { status: 422 },
          );
        }

        const saved = await saveMoveArtifact(ctx, {
          moveId: programId,
          phase,
          artifactType: deliverableTypeKey,
          artifactFamily: 'generated_deliverable',
          title: title || deliverableTypeKey.replace(/_/g, ' '),
          description: 'Client-approved replacement — uploaded to replace the AI draft.',
          fileName: file.name,
          fileFormat: ext,
          body,
          status: 'approved',
          sourceBasis: 'client_upload',
          confidence: 'high',
          citationReady: true,
          generatedBy: ctx.email ?? 'client-approval',
          metadata: {
            uploadedBy: ctx.email ?? null,
            mime: file.type || null,
            deliverableId,
            clientApprovedReplacement: true,
            parseMethod: parsed.extractedStructured.parse_method,
            parseWarnings: parsed.extractedStructured.warnings,
          },
        });
        approvedArtifactId = saved.artifactId;
        approvedContent = {
          content: parsedText,
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          parseMethod: parsed.extractedStructured.parse_method,
          warnings: parsed.extractedStructured.warnings,
        };
      }
    }

    const signedOff = await signOffDeliverable(ctx, programId, deliverableId, { supabase, approvedArtifactId, approvedContent });
    if (!signedOff) return Response.json({ error: 'not_found' }, { status: 404 });
    return Response.json({
      ok: true,
      deliverableId,
      status: 'signed_off',
      signedOffBy: ctx.userId,
      approvedArtifactId: approvedArtifactId ?? null,
    });
  } catch (err) {
    try { return tenancyErrorResponse(err); } catch {}
    console.error('[POST /programs/:id/deliverables/:did/sign-off]', err);
    return Response.json({ error: 'internal_error', message: (err as Error).message }, { status: 500 });
  }
}
