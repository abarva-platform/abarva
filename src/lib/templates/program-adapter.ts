import type { ProgramCore, TenancyCtx } from '@/lib/programs/types.db';
import { withTemplateTransaction } from './db';

type InstanceLinkRow = {
  instance_id: string;
  template_id: string;
  template_version_pinned: number;
  engagement_id: string;
  current_gate: string | null;
  status: string;
  artifact_completion_jsonb: unknown;
  gate_skeleton_jsonb: unknown;
  template_slug: string;
  template_kind: string;
  template_name: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function attachTemplateInstancesToPrograms(
  ctx: TenancyCtx,
  programs: ProgramCore[],
): Promise<ProgramCore[]> {
  const programIds = programs.map((program) => program.id);
  if (programIds.length === 0) return programs;

  try {
    const rows = await withTemplateTransaction(async (client) => {
      const result = await client.query<InstanceLinkRow>(
        `
          SELECT
            mi.instance_id,
            mi.template_id,
            mi.template_version_pinned,
            mi.engagement_id,
            mi.current_gate,
            mi.status,
            mi.artifact_completion_jsonb,
            mi.gate_skeleton_jsonb,
            mt.slug AS template_slug,
            mt.kind AS template_kind,
            mt.name AS template_name
          FROM public.move_instances mi
          JOIN public.move_templates mt ON mt.id = mi.template_id
          WHERE mi.client_id = $1
            AND mi.engagement_id = ANY($2::uuid[])
        `,
        [ctx.clientId, programIds],
      );
      return result.rows;
    });
    if (rows.length === 0) return programs;

    const byEngagement = new Map(rows.map((row) => [row.engagement_id, row]));
    return programs.map((program) => {
      const instance = byEngagement.get(program.id);
      if (!instance) return program;
      return {
        ...program,
        currentModuleKey: program.currentModuleKey ?? instance.current_gate,
        charter: {
          ...(program.charter ?? {}),
          templateInstance: {
            instanceId: instance.instance_id,
            templateId: instance.template_id,
            templateSlug: instance.template_slug,
            templateKind: instance.template_kind,
            templateName: instance.template_name,
            templateVersionPinned: instance.template_version_pinned,
            currentGate: instance.current_gate,
            status: instance.status,
          },
        },
        gatesPassed: Array.isArray(program.gatesPassed)
          ? program.gatesPassed
          : isRecord(instance.gate_skeleton_jsonb)
          ? [instance.gate_skeleton_jsonb]
          : [],
      };
    });
  } catch {
    return programs;
  }
}
