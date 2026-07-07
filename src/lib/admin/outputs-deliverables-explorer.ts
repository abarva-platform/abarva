import { getStrategicMovePortfolio } from '@/lib/programs/queries';
import type { StrategicMovePortfolio } from '@/lib/programs/types.ui';
import type { TenancyCtx } from '@/lib/programs/types.db';
import { selectSourceEventsReadAdapter } from '@/lib/data-plane/read-adapters/sourceEventsReadAdapter';
import { azureRead } from '@/lib/data-plane/azureRead';
import { SOURCE_STAGE_LABELS } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import type { CurrentUser } from '@/lib/auth/current-user';
import type { AdminTenantContext } from '@/lib/admin/admin-tenant';

export type OutputExplorerOrigin = 'move' | 'source_event';

export interface OutputExplorerItem {
  id: string;
  origin: OutputExplorerOrigin;
  title: string;
  typeLabel: string;
  status: string;
  parentLabel: string;
  parentHref: string;
  outputHref: string;
  stageLabel: string;
  ownerLabel: string;
  updatedAt: string | null;
  preview: string;
}

export interface OutputsDeliverablesExplorerModel {
  tenantName: string;
  generatedAt: string;
  totals: {
    totalOutputs: number;
    moveOutputs: number;
    sourceOutputs: number;
    parentMoves: number;
    parentSourceEvents: number;
    needsReview: number;
  };
  items: OutputExplorerItem[];
  warnings: string[];
}

export interface SourceEventExplorerRow {
  id: string;
  event_code: string;
  event_name: string;
  current_stage_key: string;
  lifecycle_state: string;
  decision_owner: string | null;
  updated_at: string;
}

export interface SourceArtifactStateExplorerRow {
  id: string;
  source_event_id: string;
  artifact_code: string;
  stage_key: SourceStageKey | string;
  artifact_family: string;
  status: string;
  requirement_level: string;
  gate_defining: boolean | null;
  notes: string | null;
  body: string | null;
  body_updated_at: string | null;
  updated_at: string;
}

interface BuildModelInput {
  tenantName: string;
  generatedAt?: string;
  movePortfolio?: StrategicMovePortfolio | null;
  sourceEvents?: SourceEventExplorerRow[];
  sourceArtifacts?: SourceArtifactStateExplorerRow[];
  warnings?: string[];
}

function cleanLabel(value: string | null | undefined, fallback: string): string {
  const cleaned = value?.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || fallback;
}

function compactPreview(value: string | null | undefined, fallback: string): string {
  const cleaned = value
    ?.replace(/[#*_`>\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallback;
  return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
}

function isNeedsReview(status: string): boolean {
  return /review|draft|blocked|not_started|needs|pending|failed/i.test(status);
}

function formatStageLabel(stageKey: string | null | undefined): string {
  if (stageKey && stageKey in SOURCE_STAGE_LABELS) {
    return SOURCE_STAGE_LABELS[stageKey as SourceStageKey];
  }
  return cleanLabel(stageKey, 'Unstaged');
}

export function buildOutputsDeliverablesExplorerModel(
  input: BuildModelInput,
): OutputsDeliverablesExplorerModel {
  const moves = input.movePortfolio?.moves ?? [];
  const sourceEvents = input.sourceEvents ?? [];
  const sourceEventById = new Map(sourceEvents.map((event) => [event.id, event]));

  const moveItems: OutputExplorerItem[] = moves.flatMap((move) =>
    move.deliverables.map((deliverable) => ({
      id: `move:${move.id}:${deliverable.id}`,
      origin: 'move' as const,
      title: cleanLabel(deliverable.title, deliverable.typeKey),
      typeLabel: cleanLabel(deliverable.typeKey, 'Move deliverable'),
      status: cleanLabel(deliverable.status, 'draft'),
      parentLabel: move.name,
      parentHref: `/strategic-moves/${move.id}`,
      outputHref: deliverable.url || `/strategic-moves/${move.id}`,
      stageLabel: move.phaseLabel,
      ownerLabel: move.sponsor?.name ?? 'Move team',
      updatedAt: deliverable.updatedAt ?? move.updatedAt,
      preview: compactPreview(deliverable.preview, 'No deliverable preview captured yet.'),
    })),
  );

  const sourceItems: OutputExplorerItem[] = (input.sourceArtifacts ?? [])
    .flatMap((artifact): OutputExplorerItem[] => {
      const event = sourceEventById.get(artifact.source_event_id);
      if (!event) return [];
      return [{
        id: `source:${artifact.source_event_id}:${artifact.artifact_code}`,
        origin: 'source_event' as const,
        title: cleanLabel(artifact.artifact_code, 'Source artifact'),
        typeLabel: cleanLabel(artifact.artifact_family, 'Source artifact'),
        status: cleanLabel(artifact.status, 'not started'),
        parentLabel: event.event_name,
        parentHref: `/source/events/${event.id}`,
        outputHref: `/source/events/${event.id}/artifacts/${encodeURIComponent(artifact.artifact_code)}`,
        stageLabel: formatStageLabel(artifact.stage_key),
        ownerLabel: event.decision_owner ?? 'Source team',
        updatedAt: artifact.body_updated_at ?? artifact.updated_at ?? event.updated_at,
        preview: compactPreview(
          artifact.notes ?? artifact.body,
          artifact.gate_defining
            ? 'Gate-defining Source output slot.'
            : `${cleanLabel(artifact.requirement_level, 'Required')} Source output slot.`,
        ),
      }];
    });

  const items = [...moveItems, ...sourceItems].sort((a, b) => {
    const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bt - at;
  });

  return {
    tenantName: input.tenantName,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    totals: {
      totalOutputs: items.length,
      moveOutputs: moveItems.length,
      sourceOutputs: sourceItems.length,
      parentMoves: moves.length,
      parentSourceEvents: sourceEvents.length,
      needsReview: items.filter((item) => isNeedsReview(item.status)).length,
    },
    items,
    warnings: input.warnings ?? [],
  };
}

async function loadSourceArtifactStates(
  tenantKey: string,
): Promise<SourceArtifactStateExplorerRow[]> {
  return azureRead.select<SourceArtifactStateExplorerRow>({
    table: 'source_event_artifact_states',
    columns: [
      'id',
      'source_event_id',
      'artifact_code',
      'stage_key',
      'artifact_family',
      'status',
      'requirement_level',
      'gate_defining',
      'notes',
      'body',
      'body_updated_at',
      'updated_at',
    ],
    where: { tenant_key: tenantKey },
    orderBy: { column: 'updated_at', direction: 'desc' },
    limit: 250,
    missingTable: 'empty',
  });
}

export async function loadOutputsDeliverablesExplorerModel(args: {
  tenant: AdminTenantContext;
  user: CurrentUser | null;
}): Promise<OutputsDeliverablesExplorerModel> {
  const warnings: string[] = [];
  const userId = args.user?.personId ?? (args.user?.clerkUserId ? `clerk:${args.user.clerkUserId}` : null);
  const ctx: TenancyCtx | null = userId
    ? {
        clientId: args.tenant.clientId,
        clientKey: args.tenant.clientKey,
        userId,
        role: args.user?.primaryRole ?? 'maestro',
        email: args.user?.email ?? null,
      }
    : null;

  const [movePortfolio, sourceEvents, sourceArtifacts] = await Promise.all([
    ctx
      ? getStrategicMovePortfolio(ctx, { limit: 50 }).catch((error) => {
          warnings.push(
            `Moves deliverables unavailable: ${error instanceof Error ? error.message : String(error)}`,
          );
          return null;
        })
      : Promise.resolve(null),
    selectSourceEventsReadAdapter()
      .getActiveEventsForClient(args.tenant.clientKey)
      .catch((error) => {
        warnings.push(
          `Source events unavailable: ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      }),
    loadSourceArtifactStates(args.tenant.clientKey).catch((error) => {
      warnings.push(
        `Source artifact states unavailable: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }),
  ]);

  if (!ctx) {
    warnings.push('No signed-in user context was available for Move RBAC scoping.');
  }

  return buildOutputsDeliverablesExplorerModel({
    tenantName: args.tenant.tenantName,
    movePortfolio,
    sourceEvents: sourceEvents as SourceEventExplorerRow[],
    sourceArtifacts,
    warnings,
  });
}
