import 'server-only';

// GET /api/programs/:id/discovery/template
//
// Discovery Intake (S8c): serves the current-state assessment template as an
// .xlsx download — built from the Move's persisted discovery plan (domains ×
// use-case-scoped dimensions). Flag-gated by `discovery_intake_v2`; 404 when the
// flag is off, the Move is unreadable, or no plan has been captured yet.

import { requireTenancy, tenancyErrorResponse } from '@/app/api/v1/programs/_auth';
import { isFeatureEnabled } from '@/lib/features/is-feature-enabled';
import { getProgramById } from '@/lib/programs/queries';
import { readDiscoveryPlanFromCharter } from '@/lib/programs/discovery/charter-transformers';
import { buildAssessmentTemplate } from '@/lib/programs/discovery/assessment-template';
import { renderAssessmentTemplateXlsx } from '@/lib/programs/discovery/assessment-template-xlsx';

function notFound(code: string): Response {
  return new Response(JSON.stringify({ error: code }), {
    status: 404,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    ctx = await requireTenancy();
  } catch (err) {
    return tenancyErrorResponse(err);
  }

  const { id: programId } = await params;

  if (!isFeatureEnabled(ctx, 'discovery_intake_v2')) {
    return notFound('discovery_intake_disabled');
  }

  const program = await getProgramById(ctx, programId);
  if (!program) {
    return notFound('program_not_found');
  }

  const plan = readDiscoveryPlanFromCharter(program.charter);
  if (!plan) {
    return notFound('no_discovery_plan');
  }

  const template = buildAssessmentTemplate(plan, { moveLabel: program.name ?? 'Move' });
  const xlsx = await renderAssessmentTemplateXlsx(template);
  const filename = `current-state-assessment-${programId}.xlsx`;

  return new Response(new Uint8Array(xlsx), {
    status: 200,
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, max-age=0, no-store',
    },
  });
}
