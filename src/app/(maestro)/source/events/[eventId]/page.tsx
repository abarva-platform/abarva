import { notFound } from 'next/navigation';
import { UniversalCanvasShell } from '@/components/source/canvas/UniversalCanvasShell';
import { getSourcingEvent } from '@/lib/source/queries';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
  loadArtifactTemplate,
} from '@/lib/source/canvas-substrate';
import { SOURCE_ARTIFACT_SPECS } from '@/lib/source/canonical-specs';
import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import type { ActivityEntry } from '@/components/source/canvas/workspace-tabs/LogTab';

export const dynamic = 'force-dynamic';

export default async function SourceEventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp: Record<string, string | string[] | undefined> =
    (await (searchParams ?? Promise.resolve({}))) ?? {};

  const [event, activeClient] = await Promise.all([
    getSourcingEvent(eventId),
    getActiveClientRow().catch(() => null),
  ]);
  if (!event) notFound();

  // Resolve viewing stage from ?stage=<key>; default to current stage.
  const stageParam = typeof sp.stage === 'string' ? sp.stage : null;
  const normalizedView = stageParam ? normalizeSourceStageKey(stageParam) : null;
  const viewStage: SourceStageKey =
    normalizedView ??
    (SOURCE_STAGE_ORDER.includes(event.currentStageKey) ? event.currentStageKey : 'strategy');

  // Read canvas substrate (RLS-scoped server-side).
  const [artifactStates, gateCriterionStates, evidenceStates] = await Promise.all([
    listArtifactStatesForEvent(eventId),
    listGateCriterionStatesForEvent(eventId),
    listEvidenceStatesForEvent(eventId),
  ]);

  // Pre-load all template bodies — server-side only because the loader uses
  // fs. Pre-loading the full catalog keeps tab switching snappy without a
  // round-trip per artifact.
  const templateByCode: Record<string, string | null> = {};
  for (const spec of SOURCE_ARTIFACT_SPECS) {
    const t = loadArtifactTemplate(spec.code);
    templateByCode[spec.code] = t ? t.body : null;
  }

  const tenantName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    event.accountName;

  // Wave 1 activity log: synthesize from event metadata until a real audit
  // table is wired. Wave 2 will read from a source_event_activity table.
  const activityEntries: ActivityEntry[] = buildActivityEntriesPlaceholder(
    event.id,
    artifactStates.length,
    gateCriterionStates.length,
    evidenceStates.length,
  );

  return (
    <UniversalCanvasShell
      event={event}
      viewStage={viewStage}
      artifactStates={artifactStates}
      gateCriterionStates={gateCriterionStates}
      evidenceStates={evidenceStates}
      templateByCode={templateByCode}
      activityEntries={activityEntries}
      tenantName={tenantName}
    />
  );
}

function buildActivityEntriesPlaceholder(
  eventId: string,
  artifactCount: number,
  criterionCount: number,
  evidenceCount: number,
): ActivityEntry[] {
  const now = new Date().toISOString();
  const entries: ActivityEntry[] = [];
  if (artifactCount > 0) {
    entries.push({
      id: `placeholder-scaffold-${eventId}`,
      at: now,
      actor: 'Sentinel',
      body: `Canvas substrate scaffolded — ${artifactCount} artifact slots, ${criterionCount} gate criteria, ${evidenceCount} evidence requirements.`,
    });
  }
  return entries;
}
