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
  SOURCE_STAGE_LABELS,
  normalizeSourceStageKey,
  nextSourceStage,
} from "@/lib/source/constants";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
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
import {
  readEventFacts,
  readRfpClausePresentLeverKeys,
  readCommittedValueLevers,
  readBafoConcessionLevers,
} from "@/lib/source/facts/event-facts-reader";
import { buildLiveStageView } from "@/lib/source/facts/view/stage-analytics-builder";
import { buildStepInsight } from "@/lib/source/facts/view/step-insight-builder";
import {
  buildStrategyStageView,
  deriveStrategyIntakeFacts,
} from "@/lib/source/facts/view/strategy-stage-builder";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { SourceEventRow } from "@/lib/source/queries";
import type {
  StageAnalyticsView,
  StageGateActionView,
  StepInsightView,
} from "@/components/source/canvas/analytics";

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

    // Build the stage view. The STRATEGY (P0) stage is the mandate-confirmation
    // stage and its gate IS the P0 approval — build it from the event's captured
    // intake and, when the event is genuinely awaiting approval in the strategy
    // stage and the user can approve, fold the live approve action into its gate.
    // Every OTHER stage uses the value-waterfall builder as before. Never break
    // the flag-off path — this whole branch is gated by source_analytics.
    let liveStageView: StageAnalyticsView | undefined = undefined;
    // The per-step killer insight (value pool / value bridge / should-cost) for
    // the viewing stage. Built from the same facts the stage view reads, so it
    // rides live when facts exist and a clearly-marked sample/model otherwise.
    let stepInsight: StepInsightView | undefined = undefined;

    if (activeClient?.key) {
      try {
        const { inputs, citations } = await readEventFacts({
          eventId: event.id,
          clientKey: activeClient.key,
        });
        // RFP clause coverage reads a per-lever presence signal (one
        // rfp_clause_present fact per lever, keyed by lever key in entity_ref)
        // that the collapsed event-facts read cannot express. Only fetch it on the
        // RFP stage. `undefined` (no signal) keeps the insight an honest MODEL;
        // a set (even empty) flips it LIVE.
        let rfpClausePresentLeverKeys: ReadonlySet<string> | undefined =
          undefined;
        if (viewStage === "rfp") {
          const { signalPresent, presentLeverKeys } =
            await readRfpClausePresentLeverKeys({
              eventId: event.id,
              clientKey: activeClient.key,
            });
          rfpClausePresentLeverKeys = signalPresent
            ? presentLeverKeys
            : undefined;
        }
        // Committed value reads a per-lever award signal (one committed_value_usd
        // fact per lever, keyed by lever key in entity_ref) the collapsed
        // event-facts read cannot express. Only fetch it on the Selection stage.
        // `undefined` (no signal) keeps the insight an honest MODEL; a map (even
        // empty) flips it LIVE.
        let committedValueByLeverKey: ReadonlyMap<string, number> | undefined =
          undefined;
        if (viewStage === "selection") {
          const { signalPresent, committedByLeverKey } =
            await readCommittedValueLevers({
              eventId: event.id,
              clientKey: activeClient.key,
            });
          committedValueByLeverKey = signalPresent
            ? committedByLeverKey
            : undefined;
        }
        // BAFO progress reads a per-lever concession signal (one
        // bafo_concession_captured_usd fact per lever, keyed by lever key in
        // entity_ref) the collapsed event-facts read cannot express. Only fetch it
        // on the BAFO stage. `undefined` (no signal) keeps the insight an honest
        // MODEL; a map (even empty) flips it LIVE.
        let bafoConcessionByLeverKey: ReadonlyMap<string, number> | undefined =
          undefined;
        if (viewStage === "bafo") {
          const { signalPresent, capturedByLeverKey } =
            await readBafoConcessionLevers({
              eventId: event.id,
              clientKey: activeClient.key,
            });
          bafoConcessionByLeverKey = signalPresent
            ? capturedByLeverKey
            : undefined;
        }
        // eventType is not on the summary; leave it unset so the builder
        // resolves the value archetype the same way buildLiveStageView does
        // (the first archetype carrying value-lever rules — today AMS).
        stepInsight =
          buildStepInsight({
            stageKey: viewStage,
            inputs,
            citations,
            baselineLabel: "Value at stake (event estimate)",
            baselineAmount: event.valueAtStakeUsd ?? 0,
            rfpClausePresentLeverKeys,
            committedValueByLeverKey,
            bafoConcessionByLeverKey,
          }) ?? undefined;

        if (viewStage !== "strategy") {
          liveStageView =
            buildLiveStageView({
              inputs,
              citations,
              baselineLabel: "Value at stake (event estimate)",
              baselineAmount: event.valueAtStakeUsd ?? 0,
              stageKey: viewStage,
            }) ?? undefined;

          // Arm the LIVE approve action on the gate ONLY when the event actually
          // SITS on the stage being viewed (viewStage === current stage) and the
          // user can approve. A future stage the event has not reached stays
          // presentational (no action). Strategy is handled on its own path below.
          if (liveStageView) {
            const approveAction = await resolveStageGateAction(
              event.id,
              activeClient.key,
              viewStage,
              event.currentStageKey,
            );
            if (approveAction) {
              liveStageView = {
                ...liveStageView,
                gate: { ...liveStageView.gate, action: approveAction },
              };
            }
          }
        }
      } catch (error) {
        console.error(
          "[SourceEventDetailPage] live analytics build failed; falling back to sample",
          error instanceof Error ? error.message : String(error),
        );
        liveStageView = undefined;
        stepInsight = undefined;
      }

      if (viewStage === "strategy") {
        liveStageView = await buildStrategyStageForRoute(
          event.id,
          activeClient.key,
          event.currentStageKey,
        );
      }
    }

    return (
      <SourceAnalyticsCanvas
        event={event}
        viewStage={viewStage}
        tenantName={analyticsTenantName}
        stageView={liveStageView}
        stepInsight={stepInsight}
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

// Lifecycle states where the P0 approval is still pending — the same set the
// standalone /approval page treats as approvable.
const STRATEGY_APPROVAL_STATES = new Set([
  "waiting_on_client",
  "waiting_on_co_approver",
  "draft_revision",
]);

/**
 * Build the fact-driven STRATEGY (P0) stage view for the analytics canvas.
 *
 * Reads the persisted event row (the SAME intake fields the standalone approval
 * page reads) to fill the Sponsor / Mandate / Value-thesis confirm table, and —
 * when the event is genuinely awaiting the P0 approval in the strategy stage and
 * the current user can approve — folds the LIVE approve action into the gate so
 * approving in-canvas reuses the existing approve backend. When the row can't be
 * read, returns undefined so the canvas shows the honestly-marked sample view.
 */
/**
 * Resolve the LIVE approve action for a WORKED (non-strategy) stage's gate, or
 * null when it should stay presentational. The action is armed only when:
 *   1. the event genuinely SITS on the stage being viewed (`viewStage ===
 *      currentStageKey`) — a future stage the event has not reached is never
 *      armed, and a past stage is not re-approvable; and
 *   2. the current user can approve Source stages.
 * Strategy is excluded — it has its own P0 path (`buildStrategyStageForRoute`).
 * The approve route re-checks access + the stage's confirmations server-side; this
 * just avoids arming a gate the route would reject.
 */
async function resolveStageGateAction(
  eventId: string,
  clientKey: string,
  viewStage: SourceStageKey,
  currentStageKey: SourceStageKey,
): Promise<StageGateActionView | null> {
  if (viewStage === "strategy") return null;
  if (viewStage !== currentStageKey) return null;

  const tenancy = await requireTenancy().catch(() => null);
  if (!tenancy) return null;
  const policy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: clientKey,
    sourceEventId: eventId,
  }).catch(() => null);
  if (policy?.canApproveSourceStages !== true) return null;

  const nextStage = nextSourceStage(viewStage);
  const stageLabel = SOURCE_STAGE_LABELS[viewStage] ?? viewStage;
  const rationale = nextStage
    ? `${stageLabel} gate confirmed on the unified canvas — evidence complete, inputs reviewed, ${stageLabel} final. Advancing to ${SOURCE_STAGE_LABELS[nextStage] ?? nextStage}.`
    : `${stageLabel} gate confirmed on the unified canvas — the final value record is accepted; closing the event.`;

  return {
    eventId,
    rationale,
    confirmationKeys: [...confirmationKeysForStage(viewStage)],
    redirectStageKey: nextStage,
  };
}

async function buildStrategyStageForRoute(
  eventId: string,
  clientKey: string,
  currentStageKey: string,
): Promise<StageAnalyticsView | undefined> {
  try {
    const { data } = await getAzureReadFluentClient()
      .from("source_events")
      .select(
        "id, client_key, event_code, event_name, event_type, current_stage_key, lifecycle_state, linked_program_id, estimated_value_usd, trigger_description, scope_description, decision_owner, created_by_user_id, created_at, updated_at",
      )
      .eq("id", eventId)
      .eq("client_key", clientKey)
      .single();
    if (!data) return undefined;

    const row = data as SourceEventRow;
    const facts = deriveStrategyIntakeFacts(row);

    // Only offer the live approve action when the event is genuinely awaiting the
    // P0 approval in the strategy stage AND the user can approve. The approve
    // route re-checks access + confirmations server-side regardless; this just
    // avoids arming a gate that would be rejected.
    let canApprove = false;
    const awaitingApproval =
      currentStageKey === "strategy" &&
      STRATEGY_APPROVAL_STATES.has(row.lifecycle_state);
    if (awaitingApproval) {
      const tenancy = await requireTenancy().catch(() => null);
      if (tenancy) {
        const policy = await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: clientKey,
          sourceEventId: eventId,
        }).catch(() => null);
        canApprove = policy?.canApproveSourceStages === true;
      }
    }

    return buildStrategyStageView({
      facts,
      provenance: "live",
      approve: canApprove ? { eventId, redirectStageKey: "scope" } : null,
    });
  } catch (error) {
    console.error(
      "[SourceEventDetailPage] strategy stage build failed; falling back to sample",
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
}
