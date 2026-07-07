import { notFound, redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import {
  StrategicMoveDetailView,
  type LinkedSourceEvent,
} from "@/components/strategic-moves/StrategicMoveDetailView";
import { AppShell } from "@/components/shell/AppShell";
import { runMoveToSourceHandoff } from "@/lib/programs/source-trigger/move-to-source-handoff";
import { getActiveClientRow } from "@/lib/active-client";
import { selectSourceEventsReadAdapter } from "@/lib/data-plane/read-adapters/sourceEventsReadAdapter";
import type { MoveToSourceHandoffResult } from "@/lib/programs/source-trigger/move-to-source-handoff";
import type { StrategicMove } from "@/lib/programs/types.ui";
import { ensureThreadForMove } from "@/lib/decisions/auto-linker";
import { getAskSessionForMove } from "@/lib/intelligence/ask/session-memory";
import { isStrategicMoveRouteId } from "@/lib/programs/strategic-move-route-params";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";

export const dynamic = "force-dynamic";

type Tab = "overview" | "explorer" | "documents" | "sessions" | "cabinet" | "activity";

interface Props {
  params: Promise<{ moveId: string }>;
  searchParams: Promise<{ tab?: string; demo?: string; presentation?: string }>;
}

function resolveTab(raw: string | undefined): Tab {
  if (
    raw === "explorer" ||
    raw === "documents" ||
    raw === "activity" ||
    raw === "cabinet" ||
    raw === "sessions"
  )
    return raw;
  return "overview";
}

function isPresentationMode(sp: {
  demo?: string;
  presentation?: string;
}): boolean {
  return (
    sp.demo === "1" ||
    sp.demo === "true" ||
    sp.presentation === "1" ||
    sp.presentation === "true"
  );
}

/** True when the Move carries a P3 sourcing-strategy deliverable. */
function hasSourcingDeliverable(move: StrategicMove): boolean {
  return move.deliverables.some((d) => d.typeKey === "sourcing_strategy");
}

/**
 * Resolve the Move→Source hand-off and any Source event already linked back
 * to this Move. The hand-off is computed only when the Move carries a
 * sourcing-strategy deliverable — that is the deliverable the loop scenario
 * says "triggers the hand-off to Source" (GAP-2). The linked-event lookup
 * scopes Source events to the active tenant and degrades to `null` when the
 * Source substrate is absent.
 */
async function resolveHandoff(move: StrategicMove): Promise<{
  handoff: MoveToSourceHandoffResult | null;
  linkedSourceEvent: LinkedSourceEvent | null;
}> {
  if (!hasSourcingDeliverable(move)) {
    return { handoff: null, linkedSourceEvent: null };
  }

  const handoff = runMoveToSourceHandoff(move);

  let linkedSourceEvent: LinkedSourceEvent | null = null;
  const activeClient = await getActiveClientRow().catch(() => null);
  if (activeClient?.key) {
    const adapter = selectSourceEventsReadAdapter();
    const events = await adapter
      .getActiveEventsForClient(activeClient.key)
      .catch(() => []);
    const linked = events.find((row) => row.linked_program_id === move.id);
    if (linked) {
      linkedSourceEvent = {
        id: linked.id,
        code: linked.event_code,
        name: linked.event_name,
      };
    }
  }

  return { handoff, linkedSourceEvent };
}

export default async function StrategicMoveDetailPage({
  params,
  searchParams,
}: Props) {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) redirect("/sign-in");

  const [{ moveId }, sp] = await Promise.all([params, searchParams]);
  const activeTab = resolveTab(sp.tab);
  const presentationMode = isPresentationMode(sp);

  if (!isStrategicMoveRouteId(moveId)) {
    notFound();
  }

  const move = await getStrategicMoveById(ctx, moveId);
  if (!move) notFound();

  const { handoff, linkedSourceEvent } = await resolveHandoff(move);
  const activeClient = await getActiveClientRow().catch(() => null);
  const discoveryIntakeEnabled = isFeatureEnabled(
    { clientKey: activeClient?.key ?? null },
    "discovery_intake_v2",
  );
  const workspaceExplorerEnabled = isFeatureEnabled(
    {
      clientKey: activeClient?.key ?? ctx.clientKey ?? null,
      clientId: activeClient?.id ?? ctx.clientId ?? null,
    },
    "workspace_explorer_moves",
  );
  const originatingAskSession = await getAskSessionForMove({
    tenantId: ctx.clientId,
    moveId: move.id,
  }).catch((error) => {
    console.error(
      "[StrategicMoveDetailPage] originating Intelligence ask session lookup failed",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  });
  const decisionThread = await ensureThreadForMove({
    clientId: activeClient?.key ?? move.tenant.id,
    moveId: move.id,
    title: move.name,
    ownerRole: move.sponsor?.role ?? "CIO",
    linkedBy: ctx.userId,
  }).catch((error) => {
    console.error(
      "[StrategicMoveDetailPage] decision dossier auto-link failed",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  });

  return (
    <AppShell
      surface="programs-detail"
      topBarProps={
        presentationMode ? { tenantName: "Retail Demo Workspace" } : undefined
      }
    >
      <StrategicMoveDetailView
        move={move}
        activeTab={activeTab}
        presentationMode={presentationMode}
        handoff={handoff}
        linkedSourceEvent={linkedSourceEvent}
        decisionThreadId={decisionThread?.id ?? null}
        originatingIntelligenceSessionId={
          originatingAskSession?.sessionId ?? null
        }
        discoveryIntakeEnabled={discoveryIntakeEnabled}
        workspaceExplorerEnabled={workspaceExplorerEnabled}
      />
    </AppShell>
  );
}
