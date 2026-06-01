import { notFound } from 'next/navigation';
import { UniversalCanvasShell } from '@/components/source/canvas/UniversalCanvasShell';
import { getSourcingEvent, scaffoldNewEventSubstrate } from '@/lib/source/queries';
import { getActiveClientRow } from '@/lib/active-client';
import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { canonicalClientDisplayName } from '@/lib/client-config';
import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
  loadArtifactTemplate,
} from '@/lib/source/canvas-substrate';
import { listSourceArtifactsForSourceEventId } from '@/lib/source/artifact-registry';
import { SOURCE_ARTIFACT_SPECS } from '@/lib/source/canonical-specs';
import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from '@/lib/source/constants';
import type { SourceStageKey } from '@/lib/source/types';
import type { SourceEventGateCriterion } from '@/lib/source/canvas-substrate';
import type { ActivityEntry } from '@/components/source/canvas/workspace-tabs/LogTab';
import { ensureThreadForSourceEvent } from '@/lib/decisions/auto-linker';
import { verifiedGateCriterionForDisplay } from '@/lib/source/source-governance-enforcement';

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
  const currentStage: SourceStageKey = SOURCE_STAGE_ORDER.includes(event.currentStageKey)
    ? event.currentStageKey
    : 'strategy';
  const requestedStage = normalizedView ?? currentStage;
  const currentStageIndex = SOURCE_STAGE_ORDER.indexOf(currentStage);
  const requestedStageIndex = SOURCE_STAGE_ORDER.indexOf(requestedStage);
  const viewStage: SourceStageKey =
    requestedStageIndex >= 0 && requestedStageIndex <= currentStageIndex
      ? requestedStage
      : currentStage;

  // Read canvas substrate (RLS-scoped server-side). Use the resolved
  // event.id (UUID) — when the slug is an event_code (B7), passing the
  // raw URL slug to these queries returns empty silently because
  // source_event_*_states.source_event_id is a UUID FK.
  let [artifactStates, gateCriterionStates, evidenceStates] = await Promise.all([
    listArtifactStatesForEvent(event.id),
    listGateCriterionStatesForEvent(event.id),
    listEvidenceStatesForEvent(event.id),
  ]);
  if (
    activeClient?.key &&
    isUuid(event.id) &&
    artifactStates.length === 0 &&
    gateCriterionStates.length === 0 &&
    evidenceStates.length === 0
  ) {
    await scaffoldNewEventSubstrate(event.id, activeClient.key).catch((error) => {
      console.error(
        '[SourceEventDetailPage] legacy canvas substrate scaffold failed',
        error instanceof Error ? error.message : String(error),
      );
    });
    [artifactStates, gateCriterionStates, evidenceStates] = await Promise.all([
      listArtifactStatesForEvent(event.id),
      listGateCriterionStatesForEvent(event.id),
      listEvidenceStatesForEvent(event.id),
    ]);
  }
  const registryArtifacts = await listSourceArtifactsForSourceEventId(event.id).catch((error) => {
    console.error(
      '[SourceEventDetailPage] source_artifacts registry read failed',
      error instanceof Error ? error.message : String(error),
    );
    return [];
  });
  const actorLabels = await resolveSourceActorLabels([
    ...gateCriterionStates.map((criterion) => criterion.reviewerUserId),
    ...artifactStates.map((artifact) => artifact.bodyAuthoredBy),
  ]);
  const labeledGateCriterionStates = gateCriterionStates.map((criterion) => ({
    ...criterion,
    reviewerUserId: labelForActor(criterion.reviewerUserId, actorLabels),
  }));
  const displayGateCriterionStates = labeledGateCriterionStates.map((criterion) =>
    verifiedGateCriterionForDisplay({
      criterion,
      artifacts: artifactStates,
      evidence: evidenceStates,
    }),
  );
  const labeledArtifactStates = artifactStates.map((artifact) => ({
    ...artifact,
    bodyAuthoredBy: labelForActor(artifact.bodyAuthoredBy, actorLabels),
  }));

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
  const decisionThread = activeClient?.key
    ? await ensureThreadForSourceEvent({
        clientId: activeClient.key,
        sourceEventId: event.id,
        title: event.name,
        ownerRole: event.owner,
        linkedBy: 'auto',
      }).catch((error) => {
        console.error(
          '[SourceEventDetailPage] decision dossier auto-link failed',
          error instanceof Error ? error.message : String(error),
        );
        return null;
      })
    : null;

  // Wave 1 activity log: synthesize from event metadata until a real audit
  // table is wired. Wave 2 will read from a source_event_activity table.
  const activityEntries: ActivityEntry[] = buildActivityEntriesPlaceholder(
    event.id,
    evidenceStates.length,
    labeledArtifactStates,
    labeledGateCriterionStates,
    displayGateCriterionStates,
  );

  return (
    <UniversalCanvasShell
      event={event}
      viewStage={viewStage}
      artifactStates={labeledArtifactStates}
      gateCriterionStates={displayGateCriterionStates}
      evidenceStates={evidenceStates}
      registryArtifacts={registryArtifacts}
      templateByCode={templateByCode}
      activityEntries={activityEntries}
      tenantName={tenantName}
      decisionThreadId={decisionThread?.id ?? null}
    />
  );
}

function buildActivityEntriesPlaceholder(
  eventId: string,
  evidenceCount: number,
  artifactStates: Awaited<ReturnType<typeof listArtifactStatesForEvent>>,
  gateCriterionStates: Awaited<ReturnType<typeof listGateCriterionStatesForEvent>>,
  displayGateCriterionStates: SourceEventGateCriterion[],
): ActivityEntry[] {
  const now = new Date().toISOString();
  const entries: ActivityEntry[] = [];
  const reviewedCriteria = gateCriterionStates
    .filter((criterion) => criterion.reviewedAt)
    .sort((a, b) => {
      const at = new Date(a.reviewedAt ?? 0).getTime();
      const bt = new Date(b.reviewedAt ?? 0).getTime();
      return bt - at;
    });

  for (const criterion of reviewedCriteria) {
    const action =
      criterion.state === 'met'
        ? 'marked met'
        : criterion.state === 'not_met'
          ? 'marked not met'
          : criterion.state;
    entries.push({
      id: `gate-${criterion.id}-${criterion.updatedAt}`,
      at: criterion.reviewedAt ?? criterion.updatedAt,
      actor: criterion.reviewerUserId ?? 'Source approver',
      body: `Gate ${criterion.criterionId} ${action}. Reason: ${criterion.notes ?? 'No reason recorded.'}`,
    });
  }

  const displayById = new Map(displayGateCriterionStates.map((criterion) => [criterion.id, criterion]));
  for (const criterion of reviewedCriteria) {
    const display = displayById.get(criterion.id);
    if (criterion.state === 'met' && display?.state === 'pending') {
      entries.push({
        id: `gate-invalidated-${criterion.id}-${criterion.updatedAt}`,
        at: criterion.updatedAt,
        actor: 'Source governance',
        body: `Gate ${criterion.criterionId} was previously marked met, but is not counted because current controls require a reason, committed artifact, and ready evidence.`,
      });
    }
  }

  const authoredArtifacts = artifactStates
    .filter((artifact) => artifact.bodyUpdatedAt)
    .sort((a, b) => {
      const at = new Date(a.bodyUpdatedAt ?? 0).getTime();
      const bt = new Date(b.bodyUpdatedAt ?? 0).getTime();
      return bt - at;
    });
  for (const artifact of authoredArtifacts.slice(0, 12)) {
    entries.push({
      id: `artifact-${artifact.id}-${artifact.bodyUpdatedAt}`,
      at: artifact.bodyUpdatedAt ?? artifact.updatedAt,
      actor: artifact.bodyAuthoredBy ?? 'Source author',
      body: `Artifact ${artifact.artifactCode} body updated. Status: ${artifact.status}.`,
    });
  }

  const artifactCount = artifactStates.length;
  const criterionCount = gateCriterionStates.length;
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

async function resolveSourceActorLabels(
  actorIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const ids = [...new Set(actorIds.filter((id): id is string => Boolean(id)))];
  const personIds = ids.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );
  const labels = new Map<string, string>();
  if (personIds.length === 0) return labels;
  const { data, error } = await getAzureReadFluentClient()
    .from('persons')
    .select('id, name, email')
    .in('id', personIds);
  if (error) {
    console.error('[SourceEventDetailPage] actor label lookup failed', error.message);
    return labels;
  }
  for (const row of (data ?? []) as Array<{ id: string; name?: string | null; email?: string | null }>) {
    labels.set(row.id, row.name || row.email || row.id);
  }
  return labels;
}

function labelForActor(actorId: string | null, labels: Map<string, string>): string | null {
  if (!actorId) return null;
  return labels.get(actorId) ?? 'Unresolved approver (record incomplete)';
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
