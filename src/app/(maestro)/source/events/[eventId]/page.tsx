import { notFound } from "next/navigation";
import { UniversalCanvasShell } from "@/components/source/canvas/UniversalCanvasShell";
import { SourceAnalyticsCanvas } from "@/components/source/canvas/analytics";
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
import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  isSkyHarborContractOptimizationEvent,
} from "@/lib/source/contract-optimization";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { readEventFacts } from "@/lib/source/facts/event-facts-reader";
import { buildLiveStageView } from "@/lib/source/facts/view/stage-analytics-builder";

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
  const isLakeshoreDemoCaseStudy =
    /LAKE-SHARED-SERVICES-AMS-2026/i.test(event.code) ||
    /Lakeshore Shared Services AMS/i.test(event.name);
  const viewStage: SourceStageKey =
    normalizedView ??
    (isLakeshoreDemoCaseStudy ? "responses" : null) ??
    (SOURCE_STAGE_ORDER.includes(event.currentStageKey)
      ? event.currentStageKey
      : "strategy");

  // ── source_analytics · the redesigned three-beat stage canvas ──────────────
  // Ships DARK behind the master flag. When ON for the tenant, render the new
  // analytics canvas; when OFF, fall through to the untouched UniversalCanvasShell
  // below. Resolved early so the heavy substrate/vendor reads the current shell
  // needs are skipped on the analytics path.
  const sourceAnalyticsEnabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? null,
      clientId: activeClient?.id ?? null,
    },
    "source_analytics",
  );
  if (sourceAnalyticsEnabled) {
    const analyticsTenantName =
      canonicalClientDisplayName({
        key: activeClient?.key,
        name: activeClient?.name,
      }) ?? event.accountName;

    // Build a LIVE StageAnalyticsView from the event's committed facts. When the
    // facts are too thin to compute a single lever (or the read fails), pass
    // nothing so the canvas renders the honestly-marked SAMPLE view. Never break
    // the flag-off path — this whole branch is gated by source_analytics.
    let liveStageView = undefined;
    if (activeClient?.key) {
      try {
        const { inputs, citations } = await readEventFacts({
          eventId: event.id,
          clientKey: activeClient.key,
        });
        liveStageView =
          buildLiveStageView({
            inputs,
            citations,
            baselineLabel: "Value at stake (event estimate)",
            baselineAmount: event.valueAtStakeUsd ?? 0,
            stageKey: viewStage,
          }) ?? undefined;
      } catch (error) {
        console.error(
          "[SourceEventDetailPage] live analytics build failed; falling back to sample",
          error instanceof Error ? error.message : String(error),
        );
        liveStageView = undefined;
      }
    }

    return (
      <SourceAnalyticsCanvas
        event={event}
        viewStage={viewStage}
        tenantName={analyticsTenantName}
        stageView={liveStageView}
      />
    );
  }

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
  const contractOptimizationProfile = isSkyHarborContractOptimizationEvent({
    activeClientKey: activeClient?.key,
    eventCode: event.code,
    eventName: event.name,
  })
    ? buildContractOptimizationMveProfile(
        buildSkyHarborAmsExistingContractInput({
          sourceEventId: event.id,
          tenantKey: activeClient?.key ?? "skyharbor-air",
        }),
      )
    : null;
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
      contractOptimizationProfile={contractOptimizationProfile}
      workspaceExplorerEnabled={workspaceExplorerEnabled}
      strategyAutoDraftEnabled={strategyAutoDraftEnabled}
      simpleFrontEnabled={simpleFrontEnabled}
    />
  );
}
