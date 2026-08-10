import { notFound } from "next/navigation";
import { SourceAnalyticsCanvas } from "@/components/source/canvas/analytics";
import { getSourcingEvent, isUuid } from "@/lib/source/queries";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { listSourceArtifactsForSourceEventIdWithContent } from "@/lib/source/artifact-registry";
import { listArtifactStatesForEvent } from "@/lib/source/canvas-substrate";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";
import { normalizeSourceStageKey } from "@/lib/source/constants";
import {
  adaptStageViewToSourceJourney,
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  nextSourceStageForJourney,
  sourceJourneyLabelForStage,
  type SourceJourneyDefinition,
} from "@/lib/source/sourcing-motion-journeys";
import { confirmationKeysForStage } from "@/lib/source/stage-gate-confirmations";
import type { SourceStageKey } from "@/lib/source/types";
import {
  readEventFacts,
  readRfpClausePresentLeverKeys,
  readCommittedValueLevers,
  readBafoConcessionLevers,
  readRealizedValueLevers,
  readVendorLeverResponses,
  readVendorBids,
} from "@/lib/source/facts/event-facts-reader";
import { buildLiveStageView } from "@/lib/source/facts/view/stage-analytics-builder";
import { buildStepInsight } from "@/lib/source/facts/view/step-insight-builder";
import { hydrateTaskEvidenceState } from "@/lib/source/facts/view/task-evidence-hydration";
import { loadApprovalsInbox } from "@/lib/source/approvals-inbox";
import { loadApprovalLedger } from "@/lib/source/approval-ledger";
import {
  buildStrategyStageView,
  deriveStrategyIntakeFacts,
} from "@/lib/source/facts/view/strategy-stage-builder";
import {
  mergeSourceShellArtifactsWithArtifactStateBodies,
  type SourceShellWorkspace,
} from "@/lib/source/source-event-shell-v2";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import { getSourceStageGuidebook } from "@/lib/source/stage-guidebooks/repository";
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
  const workspaceParam = typeof sp.workspace === "string" ? sp.workspace : null;
  const initialWorkspace = normalizeSourceShellWorkspace(workspaceParam);

  // ── Source event shell v2 · archived legacy event-canvas fallback ──────────
  // Every tenant uses the redesigned analytics canvas. The retired event shell is
  // intentionally not mounted from this route anymore; rollback is a code revert,
  // not a quiet tenant/flag fallback to the old shell.
  {
    const analyticsTenantName =
      canonicalClientDisplayName({
        key: activeClient?.key,
        name: activeClient?.name,
      }) ?? event.accountName;

    // Persisted contract-optimization profile (findings, levers, recommended
    // path) for this exact event, if one was loaded for it. The render gate is
    // row presence for this tenant and event, not tenant identity or keywords.
    const normalizedClientKey = activeClient?.key?.trim().toLowerCase();
    const contractOptimizationProfile = normalizedClientKey
      ? await getContractOptimizationProfile(
          normalizedClientKey,
          event.id,
        ).catch((error) => {
          console.error(
            "[SourceEventDetailPage] contract optimization profile read failed",
            error instanceof Error ? error.message : String(error),
          );
          return null;
        })
      : null;
    const sourceJourney = getSourceJourneyForEvent({
      event,
      hasContractOptimizationProfile: Boolean(contractOptimizationProfile),
    });
    const viewStage: SourceStageKey = coerceStageToSourceJourney(
      sourceJourney,
      normalizedView ?? (isLakeshoreDemoCaseStudy ? "responses" : null),
      event.currentStageKey,
    );
    const effectiveCurrentStageKey = coerceStageToSourceJourney(
      sourceJourney,
      event.currentStageKey,
      event.currentStageKey,
    );

    // Build the stage view. The STRATEGY (P0) stage is the mandate-confirmation
    // stage and its gate IS the P0 approval — build it from the event's captured
    // intake and, when the event is genuinely awaiting approval in the strategy
    // stage and the user can approve, fold the live approve action into its gate.
    // Every OTHER stage uses the value-waterfall builder as before.
    let liveStageView: StageAnalyticsView | undefined = undefined;
    // The per-step killer insight (value pool / value bridge / should-cost) for
    // the viewing stage. Built from the same facts the stage view reads, so it
    // rides live when facts exist and a clearly-marked sample/model otherwise.
    let stepInsight: StepInsightView | undefined = undefined;
    // The event's committed facts (factKey → value), captured so the task
    // checklist's done-state can be re-derived from persisted evidence on load
    // (a reload / tab switch must reflect uploaded facts, not reset to empty).
    let hydrationFactInputs: Record<string, number> = {};
    const analyticsRegistryArtifacts =
      await listSourceArtifactsForSourceEventIdWithContent(event.id).catch(
        (error) => {
          console.error(
            "[SourceEventDetailPage] source_artifacts registry read failed for analytics shell",
            error instanceof Error ? error.message : String(error),
          );
          return [];
        },
      );
    const analyticsArtifactStates = await listArtifactStatesForEvent(
      event.id,
    ).catch((error) => {
      console.error(
        "[SourceEventDetailPage] source artifact states read failed for analytics shell",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    });
    const analyticsArtifacts = mergeSourceShellArtifactsWithArtifactStateBodies(
      analyticsRegistryArtifacts,
      analyticsArtifactStates,
    );
    const analyticsHydrationArtifacts = analyticsArtifacts.flatMap(
      (artifact) =>
        artifact.stageKey ? [{ stageKey: artifact.stageKey }] : [],
    );
    // SOURCE-SHELL-004: real artifact ids only — synthetic pseudo-artifact
    // ids (e.g. `artifact-state:<uuid>`, used for authored bodies with no
    // registry row yet) can never have an acceptance record and would fail
    // a UUID-typed `.in()` query.
    const analyticsArtifactIds = analyticsArtifacts
      .map((artifact) => artifact.id)
      .filter((id): id is string => isUuid(id));
    const analyticsLatestAcceptances = analyticsArtifactIds.length
      ? Array.from(
          (
            await getLatestArtifactAcceptancesByArtifactIds(
              analyticsArtifactIds,
            ).catch((error) => {
              console.error(
                "[SourceEventDetailPage] artifact acceptances read failed for analytics shell",
                error instanceof Error ? error.message : String(error),
              );
              return new Map();
            })
          ).values(),
        )
      : [];
    const analyticsApprovalItems = activeClient?.key
      ? (
          await loadApprovalsInbox(activeClient.key).catch((error) => {
            console.error(
              "[SourceEventDetailPage] approvals inbox read failed for analytics shell",
              error instanceof Error ? error.message : String(error),
            );
            return { items: [], intakeCount: 0, gateReadyCount: 0 };
          })
        ).items
      : [];
    const analyticsGuidebook = activeClient?.key
      ? await getSourceStageGuidebook(viewStage, activeClient.key).catch(
          (error) => {
            console.error(
              "[SourceEventDetailPage] stage guidebook read failed for analytics shell",
              error instanceof Error ? error.message : String(error),
            );
            return null;
          },
        )
      : null;
    const analyticsApprovalLedger = await loadApprovalLedger(
      event.id,
      effectiveCurrentStageKey,
      sourceJourney.stages,
    ).catch((error) => {
      console.error(
        "[SourceEventDetailPage] approval ledger read failed for analytics shell",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    });

    if (activeClient?.key) {
      try {
        const { inputs, citations } = await readEventFacts({
          eventId: event.id,
          clientKey: activeClient.key,
        });
        hydrationFactInputs = inputs;
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
        // Value realization reads a per-lever realized-to-date signal (one
        // realized_value_usd fact per lever, keyed by lever key in entity_ref) the
        // collapsed event-facts read cannot express. Only fetch it on the Value
        // stage. `undefined` (no signal) keeps the insight an honest MODEL; a map
        // (even empty) flips it LIVE. This is a realized-to-date snapshot, not a
        // per-period series (see the downstream-insight fact-model design doc).
        let realizedValueByLeverKey: ReadonlyMap<string, number> | undefined =
          undefined;
        if (viewStage === "value") {
          const { signalPresent, realizedByLeverKey } =
            await readRealizedValueLevers({
              eventId: event.id,
              clientKey: activeClient.key,
            });
          realizedValueByLeverKey = signalPresent
            ? realizedByLeverKey
            : undefined;
        }
        // Responses coverage reads a per-vendor / per-lever response signal (one
        // response_addressed fact per vendor×lever, keyed by the composite
        // <vendorId>::<leverKey> in entity_ref) the collapsed event-facts read
        // cannot express. Only fetch it on the Responses stage. `undefined` (no
        // signal) keeps the insight an honest MODEL; a signal (even empty) flips
        // it LIVE.
        let vendorResponses:
          | {
              statusByVendorLever: ReadonlyMap<
                string,
                ReadonlyMap<string, "addressed" | "partial" | "dodged">
              >;
              vendors: readonly string[];
            }
          | undefined = undefined;
        if (viewStage === "responses") {
          const { signalPresent, statusByVendorLever, vendors } =
            await readVendorLeverResponses({
              eventId: event.id,
              clientKey: activeClient.key,
            });
          vendorResponses = signalPresent
            ? { statusByVendorLever, vendors }
            : undefined;
        }
        // Evaluation should-cost reads a per-vendor bid signal (one row per vendor:
        // vendor_headline_bid / vendor_retained_fte_delta / vendor_sla_credit_cap_pct
        // vendor-kind facts, each keyed by the vendor id in entity_ref) the collapsed
        // event-facts read cannot express. Only fetch it on the Evaluation stage.
        // `undefined` (no signal) keeps the insight an honest MODEL (illustrative
        // vendors); a signal (even empty) flips it LIVE.
        let vendorBids:
          | {
              bids: readonly {
                vendorId: string;
                headlineBid?: number;
                retainedFteDelta?: number;
                slaCreditCapPct?: number;
              }[];
              vendors: readonly string[];
            }
          | undefined = undefined;
        if (viewStage === "evaluation") {
          const { signalPresent, bidsByVendor, vendors } = await readVendorBids(
            {
              eventId: event.id,
              clientKey: activeClient.key,
            },
          );
          vendorBids = signalPresent
            ? { bids: [...bidsByVendor.values()], vendors }
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
            realizedValueByLeverKey,
            vendorResponses,
            vendorBids,
          }) ?? undefined;

        if (viewStage !== "strategy") {
          liveStageView =
            buildLiveStageView({
              inputs,
              citations,
              baselineLabel: "Value at stake (event estimate)",
              baselineAmount: event.valueAtStakeUsd ?? 0,
              stageKey: viewStage,
              stageName: sourceJourneyLabelForStage(sourceJourney, viewStage),
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
              effectiveCurrentStageKey,
              sourceJourney,
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
          effectiveCurrentStageKey,
          sourceJourney,
        );
      }
    }

    // Re-derive each upload task's done-state from ALREADY-PERSISTED evidence so a
    // reloaded / tab-switched page reflects real uploaded facts/artifacts — the
    // checklist's client state starts empty on every mount, which is why the
    // "N of M complete" counter reset even though the facts (and the ✦ Intelligence
    // insight they drive) persisted. Facts are already in hand (`hydrationFactInputs`);
    // template-less `provide` tasks (e.g. the signed sponsor letter) derive from the
    // artifact registry. Honest: a task is stamped complete ONLY because its evidence
    // reached a usable, persisted state — never a fabricated done. Never fatal.
    if (liveStageView) {
      try {
        const journeyStageView = adaptStageViewToSourceJourney(
          liveStageView,
          sourceJourney,
        );
        liveStageView = {
          ...journeyStageView,
          tasks: hydrateTaskEvidenceState({
            tasks: journeyStageView.tasks,
            factInputs: hydrationFactInputs,
            artifacts: analyticsHydrationArtifacts,
            stageKey: journeyStageView.stageKey,
          }),
        };
      } catch (error) {
        console.error(
          "[SourceEventDetailPage] task evidence hydration failed; leaving in-session behavior",
          error instanceof Error ? error.message : String(error),
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
        artifacts={analyticsArtifacts}
        approvalItems={analyticsApprovalItems}
        approvalLedger={analyticsApprovalLedger}
        guidebook={analyticsGuidebook}
        latestArtifactAcceptances={analyticsLatestAcceptances}
        initialWorkspace={initialWorkspace}
        contractOptimizationProfile={contractOptimizationProfile}
        journey={sourceJourney}
      />
    );
  }
}

function normalizeSourceShellWorkspace(
  value: string | null,
): SourceShellWorkspace | undefined {
  switch (value) {
    case "steps":
    case "files":
    case "intelligence":
    case "approvals":
    case "guidebook":
      return value;
    default:
      return undefined;
  }
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
  journey: SourceJourneyDefinition,
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

  const nextStage = nextSourceStageForJourney(viewStage, journey);
  const stageLabel = sourceJourneyLabelForStage(journey, viewStage);
  const rationale = nextStage
    ? `${stageLabel} gate confirmed on the unified canvas — evidence complete, inputs reviewed, ${stageLabel} final. Advancing to ${sourceJourneyLabelForStage(journey, nextStage)}.`
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
  journey: SourceJourneyDefinition,
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

    return adaptStageViewToSourceJourney(
      buildStrategyStageView({
        facts,
        provenance: "live",
        approve: canApprove
          ? {
              eventId,
              redirectStageKey: nextSourceStageForJourney("strategy", journey),
            }
          : null,
      }),
      journey,
    );
  } catch (error) {
    console.error(
      "[SourceEventDetailPage] strategy stage build failed; falling back to sample",
      error instanceof Error ? error.message : String(error),
    );
    return undefined;
  }
}
