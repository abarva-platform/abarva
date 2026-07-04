import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceWorkingPane } from "@/components/source/SourceWorkingPane";
import { EventApprovalCard } from "@/components/source/approval/EventApprovalCard";
import type { IntakeFact } from "@/components/source/approval/IntakeFactsReview";
import type { IntakeChatTurn } from "@/components/source/approval/IntakeChatTrail";
import { getActiveClientRow } from "@/lib/active-client";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { formatSourceFinancialValue } from "@/lib/source/financial-display";
import { parseSourceScopeDescription } from "@/lib/source/intake-summary";
import { getSourcingEvent, type SourceEventRow } from "@/lib/source/queries";

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

  if (row.lifecycle_state === "active") {
    redirect(`/source/events/${event.id}?stage=${event.currentStageKey}`);
  }
  if (!APPROVAL_STATES.has(row.lifecycle_state)) {
    redirect("/source/queue");
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

  return (
    <AppShell
      surface="source-detail"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: "Source · Event approval",
      }}
      subNav={<SourceSubNav />}
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
          capturedFacts={buildCapturedFacts(row)}
          intakeChatTurns={buildIntakeTrail(row)}
          sponsor={{
            displayName: row.decision_owner ?? event.owner,
            role: "Decision owner",
          }}
          coApprover={null}
          pilotMode={true}
          currentUserId={tenancy.userId}
          currentUserCanApprove={currentUserCanApprove}
          currentStageHref={`/source/events/${event.id}?stage=${event.currentStageKey}`}
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
      value:
        scopeSummary.scopeBoundary ?? "Scope boundary not captured yet.",
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
