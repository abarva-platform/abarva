import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceExecutionRoomPage } from "@/components/source/SourceExecutionRoomPage";
import { SourceWorkingPane } from "@/components/source/SourceWorkingPane";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { SHELL } from "@/lib/shell/shell-tokens";
import { loadRenewalCockpitWithEvidence } from "@/lib/source/decision-queue/load";
import { loadExecutionRoom } from "@/lib/source/execution-room/load";

export const metadata = { title: "Source · Execution Room · AbarVa" };
export const dynamic = "force-dynamic";

/**
 * Source Execution Room — the operating surface for one sourcing decision.
 *
 * The Renewal Cockpit remains the diagnostic page; this page turns the same
 * grounded cockpit into a critical path, action workplan, negotiation room,
 * approval map, evidence pack, and outcome target.
 */
export default async function SourceExecutionRoomRoute({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientKey = activeClient?.key ?? "apexretail";
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";
  const { cockpit, evidenceContext } = await loadRenewalCockpitWithEvidence(
    clientKey,
    decodeURIComponent(contractId),
  );

  // Build the Execution Room and reconcile it against the persisted
  // `sourcing_work_items` rows — owner, SLA and status come from the durable
  // work-item layer, not just the deterministic composer baseline.
  const room = cockpit ? await loadExecutionRoom(cockpit) : null;

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: "Source · Execution Room",
      }}
      subNav={<SourceSubNav />}
    >
      <SourceWorkingPane>
        {room ? (
          <SourceExecutionRoomPage
            room={room}
            evidenceContext={evidenceContext}
          />
        ) : (
          <div
            style={{
              maxWidth: 640,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <h1
              style={{
                fontFamily: SHELL.SERIF,
                fontWeight: "normal",
                fontSize: 24,
                color: SHELL.INK,
                margin: 0,
              }}
            >
              Contract not found
            </h1>
            <p
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 14,
                color: SHELL.INK_SOFT,
                margin: 0,
              }}
            >
              No vendor contract matches this id in the loaded tenant data. The
              Execution Room only renders for a real contract — it never
              fabricates a sourcing decision.
            </p>
            <Link
              href="/source/workspace"
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 13,
                color: SHELL.INK_MID,
              }}
            >
              Back to the sourcing book
            </Link>
          </div>
        )}
      </SourceWorkingPane>
    </AppShell>
  );
}
