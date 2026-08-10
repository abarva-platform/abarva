import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceWorkingPane } from "@/components/source/SourceWorkingPane";
import {
  EventApprovalCard,
  type ApprovalArtifactAcceptance,
} from "@/components/source/approval/EventApprovalCard";
import type { IntakeFact } from "@/components/source/approval/IntakeFactsReview";
import type { IntakeChatTurn } from "@/components/source/approval/IntakeChatTrail";
import { getActiveClientRow } from "@/lib/active-client";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import { listSourceArtifactsForSourceEventId } from "@/lib/source/artifact-registry";
import { loadApprovalLedger } from "@/lib/source/approval-ledger";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";
import { formatSourceFinancialValue } from "@/lib/source/financial-display";
import { parseSourceScopeDescription } from "@/lib/source/intake-summary";
import {
  getSourcingEvent,
  isUuid,
  type SourceEventRow,
} from "@/lib/source/queries";
import {
  coerceStageToSourceJourney,
  getSourceJourneyForEvent,
  sourceJourneyStageHref,
} from "@/lib/source/sourcing-motion-journeys";

export const metadata = { title: "Source · Event Approval · AbarVa" };
export const dynamic = "force-dynamic";

const APPROVAL_STATES = new Set([
  "waiting_on_client",
  "waiting_on_co_approver",
  "draft_revision",
]);

export default async function SourceEventApprovalPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [event, activeClient, tenancy] = await Promise.all([
    getSourcingEvent(eventId),
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);

  if (!event || !activeClient || !tenancy) notFound();

  const row = await loadPersistedEventRow(event.id, activeClient.key);
  if (!row) notFound();

  const normalizedClientKey = activeClient.key.trim().toLowerCase();
  const contractOptimizationProfile = await getContractOptimizationProfile(
    normalizedClientKey,
    event.id,
  ).catch(() => null);
  const sourceJourney = getSourceJourneyForEvent({
    event,
    hasContractOptimizationProfile: Boolean(contractOptimizationProfile),
  });
  const effectiveCurrentStageKey = coerceStageToSourceJourney(
    sourceJourney,
    row.current_stage_key,
    row.current_stage_key,
  );
  const currentStageHref = sourceJourneyStageHref({
    eventId: event.id,
    journey: sourceJourney,
    stageKey: row.current_stage_key,
    fallbackStageKey: row.current_stage_key,
  });

  if (row.lifecycle_state === "active") {
    redirect(currentStageHref);
  }
  if (!APPROVAL_STATES.has(row.lifecycle_state)) {
    redirect("/source/portfolio");
  }

  const sourceAccessPolicy = await loadUserSourceAccessPolicy(tenancy, {
    activeClientKey: activeClient.key,
    sourceEventId: event.id,
  }).catch(() => null);
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient.key,
      name: activeClient.name,
    }) ?? event.accountName;
  const currentUserCanApprove =
    sourceAccessPolicy?.canApproveSourceStages === true;
  const [approvalLedger, artifactAcceptances] = await Promise.all([
    loadApprovalLedger(
      event.id,
      effectiveCurrentStageKey,
      sourceJourney.stages,
    ).catch((error) => {
      console.error(
        "[SourceEventApprovalPage] approval ledger read failed",
        error instanceof Error ? error.message : String(error),
      );
      return [];
    }),
    loadArtifactAcceptanceHistory(event.id),
  ]);

  return (
    <AppShell
      surface="source-detail"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: "Source · Event approval",
      }}
    >
      <SourceWorkingPane>
        <EventApprovalCard
          eventId={event.id}
          eventName={event.name}
          eventCode={event.code}
          lifecycleState={row.lifecycle_state}
          createdBy={{
            userId: row.created_by_user_id,
            displayName:
              row.created_by_user_id === tenancy.userId
                ? "You"
                : (row.created_by_user_id ?? "Recorded creator"),
            role: "Event creator",
          }}
          createdAt={row.created_at}
          evidenceUpdatedAt={row.updated_at}
          capturedFacts={buildCapturedFacts(row)}
          intakeChatTurns={buildIntakeTrail(row)}
          approvalLedger={approvalLedger}
          artifactAcceptances={artifactAcceptances}
          sponsor={{
            displayName: row.decision_owner ?? event.owner,
            role: "Decision owner",
          }}
          coApprover={null}
          pilotMode={true}
          currentUserId={tenancy.userId}
          currentUserCanApprove={currentUserCanApprove}
          currentStageHref={currentStageHref}
          generateMemoOnApprove={isFeatureEnabled(
            {
              clientKey: activeClient.key,
              clientId: activeClient.id ?? null,
            },
            "source_strategy_at_p0",
          )}
        />
      </SourceWorkingPane>
    </AppShell>
  );
}

async function loadPersistedEventRow(
  eventId: string,
  clientKey: string,
): Promise<SourceEventRow | null> {
  const { data, error } = await getAzureReadFluentClient()
    .from("source_events")
    .select(
      "id, client_key, event_code, event_name, event_type, current_stage_key, lifecycle_state, linked_program_id, estimated_value_usd, trigger_description, scope_description, decision_owner, created_by_user_id, created_at, updated_at",
    )
    .eq("id", eventId)
    .eq("client_key", clientKey)
    .single();
  if (error || !data) return null;
  return data as SourceEventRow;
}

async function loadArtifactAcceptanceHistory(
  sourceEventId: string,
): Promise<ApprovalArtifactAcceptance[]> {
  const artifacts = await listSourceArtifactsForSourceEventId(
    sourceEventId,
  ).catch((error) => {
    console.error(
      "[SourceEventApprovalPage] source artifacts read failed for acceptance history",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  });
  const artifactIds = artifacts
    .map((artifact) => artifact.id)
    .filter((id): id is string => isUuid(id));
  if (artifactIds.length === 0) return [];

  const latestByArtifactId = await getLatestArtifactAcceptancesByArtifactIds(
    artifactIds,
  ).catch((error) => {
    console.error(
      "[SourceEventApprovalPage] artifact acceptances read failed for approval history",
      error instanceof Error ? error.message : String(error),
    );
    return new Map();
  });
  const artifactNameById = new Map(
    artifacts.map((artifact) => [
      artifact.id,
      artifact.originalName || artifact.artifactKind || artifact.id,
    ]),
  );

  return Array.from(latestByArtifactId.values())
    .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
    .map((acceptance) => ({
      id: acceptance.id,
      artifactId: acceptance.artifactId,
      artifactName:
        artifactNameById.get(acceptance.artifactId) ?? acceptance.artifactId,
      stageKey: acceptance.stageKey,
      acceptedBy: acceptance.acceptedBy,
      acceptedAt: acceptance.acceptedAt,
      contentDriftStatus: acceptance.contentDriftStatus,
      gatePreconditionStatus: acceptance.gatePreconditionStatus,
      approvalRationale: acceptance.approvalRationale,
    }));
}

function buildCapturedFacts(row: SourceEventRow): IntakeFact[] {
  const scopeSummary = parseSourceScopeDescription(row.scope_description);
  const valueTarget =
    scopeSummary.valueTarget ??
    (row.estimated_value_usd && row.estimated_value_usd > 0
      ? formatSourceFinancialValue(row.estimated_value_usd, true)
      : "Value target pending.");
  return [
    {
      id: "trigger",
      label: "Why now / trigger",
      value: row.trigger_description ?? "Trigger not captured yet.",
    },
    {
      id: "decision-owner",
      label: "Decision owner",
      value: row.decision_owner ?? "Decision owner pending.",
    },
    {
      id: "scope-boundary",
      label: "Scope boundary",
      value: scopeSummary.scopeBoundary ?? "Scope boundary not captured yet.",
    },
    {
      id: "value-target",
      label: "Value or savings target",
      value: valueTarget,
    },
    {
      id: "baseline-owner",
      label: "Minimum data / baseline owner",
      value:
        scopeSummary.baselineOwner ??
        "Baseline owner pending. Confirm who owns the minimum evidence before external use.",
    },
  ];
}

function buildIntakeTrail(row: SourceEventRow): IntakeChatTurn[] {
  return [
    {
      id: "event-created",
      speaker: "Source intake",
      text: `${row.event_name} was opened as a ${row.event_type.replaceAll("_", " ")} event and is waiting for accountable human approval.`,
      timeLabel: new Date(row.created_at).toLocaleString(),
    },
  ];
}
