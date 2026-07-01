import { notFound } from "next/navigation";
import { UniversalCanvasShell } from "@/components/source/canvas/UniversalCanvasShell";
import { getSourcingEvent } from "@/lib/source/queries";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  listArtifactStatesForEvent,
  listEvidenceStatesForEvent,
  listGateCriterionStatesForEvent,
  loadArtifactTemplate,
  buildVirtualEventScaffold,
  mergeMissingVirtualScaffold,
} from "@/lib/source/canvas-substrate";
import { listSourceArtifactsForSourceEventId } from "@/lib/source/artifact-registry";
import { SOURCE_ARTIFACT_SPECS } from "@/lib/source/canonical-specs";
import {
  SOURCE_STAGE_ORDER,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import type { SourceStageKey } from "@/lib/source/types";
import { ensureThreadForSourceEvent } from "@/lib/decisions/auto-linker";
import { listSourceEventActivityEntries } from "@/lib/source/activity-log";
import { buildSourceVendorResponseCompleteness } from "@/lib/source/vendor-response-completeness";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

export const dynamic = "force-dynamic";

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
  const stageParam = typeof sp.stage === "string" ? sp.stage : null;
  const normalizedView = stageParam
    ? normalizeSourceStageKey(stageParam)
    : null;
  const viewStage: SourceStageKey =
    normalizedView ??
    (SOURCE_STAGE_ORDER.includes(event.currentStageKey)
      ? event.currentStageKey
      : "strategy");

  // Read canvas substrate (RLS-scoped server-side). Use the resolved
  // event.id (UUID) — when the slug is an event_code (B7), passing the
  // raw URL slug to these queries returns empty silently because
  // source_event_*_states.source_event_id is a UUID FK.
  let [artifactStates, gateCriterionStates, evidenceStates] = await Promise.all(
    [
      listArtifactStatesForEvent(event.id),
      listGateCriterionStatesForEvent(event.id),
      listEvidenceStatesForEvent(event.id),
    ],
  );
  const scaffoldInput = {
    sourceEventId: event.id,
    tenantKey: activeClient?.key ?? "unknown",
  };
  if (
    artifactStates.length === 0 &&
    gateCriterionStates.length === 0 &&
    evidenceStates.length === 0
  ) {
    const virtualScaffold = buildVirtualEventScaffold(scaffoldInput);
    artifactStates = virtualScaffold.artifactStates;
    gateCriterionStates = virtualScaffold.gateCriterionStates;
    evidenceStates = virtualScaffold.evidenceStates;
  } else {
    const merged = mergeMissingVirtualScaffold(scaffoldInput, {
      artifactStates,
      gateCriterionStates,
      evidenceStates,
    });
    artifactStates = merged.artifactStates;
    gateCriterionStates = merged.gateCriterionStates;
    evidenceStates = merged.evidenceStates;
  }
  const registryArtifacts = await listSourceArtifactsForSourceEventId(
    event.id,
  ).catch((error) => {
    console.error(
      "[SourceEventDetailPage] source_artifacts registry read failed",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  });

  // Pre-load all template bodies — server-side only because the loader uses
  // fs. Pre-loading the full catalog keeps tab switching snappy without a
  // round-trip per artifact.
  const templateByCode: Record<string, string | null> = {};
  for (const spec of SOURCE_ARTIFACT_SPECS) {
    const t = loadArtifactTemplate(spec.code);
    templateByCode[spec.code] = t ? t.body : null;
  }

  const tenantName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? event.accountName;
  const decisionThread = activeClient?.key
    ? await ensureThreadForSourceEvent({
        clientId: activeClient.key,
        sourceEventId: event.id,
        title: event.name,
        ownerRole: event.owner,
        linkedBy: "auto",
      }).catch((error) => {
        console.error(
          "[SourceEventDetailPage] decision dossier auto-link failed",
          error instanceof Error ? error.message : String(error),
        );
        return null;
      })
    : null;

  const activityEntries = await listSourceEventActivityEntries(event.id);
  const vendorResponseReadiness = buildSourceVendorResponseCompleteness({
    event,
  });
  const vendorResponseProfiles = buildVendorResponseMveProfiles({
    id: event.id,
    code: event.code,
    name: event.name,
    accountName: event.accountName,
  });
  const vendorChallengeIntelligence =
    buildVendorChallengeIntelligence(vendorResponseProfiles);
  const vendorBafoInstructionPack = buildVendorBafoInstructionPack(
    vendorChallengeIntelligence,
  );
  const vendorEvaluationDecisionView = buildVendorEvaluationDecisionView(
    vendorResponseProfiles,
    vendorChallengeIntelligence,
    vendorBafoInstructionPack,
  );
  const flagScope = {
    clientKey: activeClient?.key ?? null,
    clientId: activeClient?.id ?? null,
  };
  const workspaceExplorerEnabled = isFeatureEnabled(
    flagScope,
    "workspace_explorer_source",
  );
  const strategyAutoDraftEnabled = isFeatureEnabled(
    flagScope,
    "source_strategy_auto_draft",
  );
  const simpleFrontEnabled = isFeatureEnabled(flagScope, "source_simple_front");

  return (
    <UniversalCanvasShell
      event={event}
      viewStage={viewStage}
      artifactStates={artifactStates}
      gateCriterionStates={gateCriterionStates}
      evidenceStates={evidenceStates}
      registryArtifacts={registryArtifacts}
      templateByCode={templateByCode}
      activityEntries={activityEntries}
      tenantName={tenantName}
      decisionThreadId={decisionThread?.id ?? null}
      vendorResponseReadiness={vendorResponseReadiness}
      vendorResponseProfiles={vendorResponseProfiles}
      vendorChallengeIntelligence={vendorChallengeIntelligence}
      vendorBafoInstructionPack={vendorBafoInstructionPack}
      vendorEvaluationDecisionView={vendorEvaluationDecisionView}
      workspaceExplorerEnabled={workspaceExplorerEnabled}
      strategyAutoDraftEnabled={strategyAutoDraftEnabled}
      simpleFrontEnabled={simpleFrontEnabled}
    />
  );
}
