import Link from "next/link";
import { redirect } from "next/navigation";
import { isSourceIaV2 } from "@/lib/source/source-ia-v2";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SourceEventsAgentDockView } from "@/components/source/SourceEventsAgentDockView";
import { SourceWorkingPane } from "@/components/source/SourceWorkingPane";
import { SourceEventsPortfolio } from "@/components/source/SourceEventsPortfolio";
import { SourceEmptyState } from "@/components/source/SourceEmptyState";
import { AdminSourceEventApprovalQueue } from "@/components/source/AdminSourceEventApprovalQueue";
import { SHELL } from "@/lib/shell/shell-tokens";
import { buildLinkedProgramBadgeView } from "@/lib/source/linked-program-badge-view";
import {
  listSourcingEvents,
  getPendingSourceEvents,
} from "@/lib/source/queries";
import type { SourcingEventSummary } from "@/lib/source/types";
import {
  computeSourcePortfolioMetrics,
  type SourcePortfolioMetrics,
} from "@/lib/source/portfolio-metrics";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { formatSourceFinancialValue } from "@/lib/source/financial-display";
import { canonicalClientDisplayName } from "@/lib/client-config";

export const dynamic = "force-dynamic";

export default async function SourceEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; status?: string }>;
}) {
  // IA v2 (audit Tier 1): the Events surface folds into Portfolio — its event
  // table and scorecard are the canonical analyze-mode view. Reversible via
  // NEXT_PUBLIC_SOURCE_IA_V2=0, which restores this standalone surface.
  if (isSourceIaV2()) redirect("/source/portfolio");

  const { stage, status } = await searchParams;
  const events = await listSourcingEvents();
  // Canonical Source portfolio computation — ONE filtering + counting rule,
  // shared with the Portfolio and Decision Queue surfaces so the headline
  // numbers can never disagree (audit 2026-06-03, Tier 0).
  const { visibleEvents, metrics } = computeSourcePortfolioMetrics(events);

  const [activeClient, tenancy] = await Promise.all([
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const sourceAccessPolicy =
    activeClient && tenancy
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
        }).catch(() => null)
      : null;
  const pendingEvents =
    sourceAccessPolicy?.canApproveSourceStages && activeClient
      ? await getPendingSourceEvents(activeClient.key)
      : [];
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: "Source · Events portfolio",
      }}
      subNav={<SourceSubNav />}
    >
      {visibleEvents.length === 0 ? (
        <SourceEmptyState tenantName={activeClientDisplayName} />
      ) : (
        <SourceEventsAgentDockView
          filterStage={stage ?? null}
          filterStatus={status ?? null}
          workspace={
            <SourceWorkingPane>
              {pendingEvents.length > 0 && (
                <AdminSourceEventApprovalQueue
                  events={pendingEvents}
                  currentUserId={tenancy?.userId ?? null}
                />
              )}
              <SourceEventsEntryHeader
                events={visibleEvents}
                metrics={metrics}
                canViewFinancialValues={
                  sourceAccessPolicy?.canViewFinancialData === true
                }
              />
              <SourceEventsPortfolio
                events={visibleEvents}
                activeStage={stage ?? null}
                activeStatus={status ?? null}
                canViewFinancialValues={
                  sourceAccessPolicy?.canViewFinancialData === true
                }
              />
            </SourceWorkingPane>
          }
        />
      )}
    </AppShell>
  );
}

function SourceEventsEntryHeader({
  events,
  metrics,
  canViewFinancialValues = true,
}: {
  events: SourcingEventSummary[];
  metrics: SourcePortfolioMetrics;
  canViewFinancialValues?: boolean;
}) {
  // Counts and value come from the canonical metrics — never recomputed here —
  // so this surface always agrees with Portfolio and the Decision Queue.
  const linkedEvents = events.filter((event) =>
    buildLinkedProgramBadgeView(event.id),
  ).length;

  return (
    <section
      aria-label="Source events portfolio command surface"
      data-testid="source-events-entry-header"
      style={{
        display: "grid",
        gap: 14,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          gap: 16,
          alignItems: "end",
        }}
      >
        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: SHELL.INK_MUTED,
              fontWeight: 800,
            }}
          >
            Source events portfolio
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: SHELL.SERIF,
              fontSize: 28,
              lineHeight: 1.12,
              color: SHELL.INK,
              fontWeight: 800,
            }}
          >
            IT sourcing operating queue
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 780,
              fontFamily: SHELL.SANS,
              fontSize: 13.2,
              lineHeight: 1.48,
              color: SHELL.INK_SOFT,
            }}
          >
            aVa leads the IT sourcing queue by naming the next sourcing move,
            the evidence behind it, and the gate that could block it. The table
            is supporting evidence: lifecycle, owner, linked program, value
            exposure, blocker, aging, and next action.
          </p>
        </div>
        <Link
          href="/source/new"
          data-testid="source-events-start-it-sourcing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: SHELL.INK,
            color: SHELL.PAPER,
            padding: "10px 15px",
            fontFamily: SHELL.MONO,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Start IT sourcing event
        </Link>
      </div>

      <div
        aria-label="Source events portfolio summary"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        <PortfolioMetric
          label="Events"
          value={String(metrics.total)}
          detail={`${metrics.active} active`}
        />
        <PortfolioMetric
          label="Waiting"
          value={String(metrics.waiting)}
          detail="client, vendor, or owner hold"
        />
        <PortfolioMetric
          label="Blocked"
          value={String(metrics.attentionCount)}
          detail="gate or evidence pressure visible"
        />
        <PortfolioMetric
          label="Linked programs"
          value={String(linkedEvents)}
          detail="deterministic program hints"
        />
        <PortfolioMetric
          label="Value at stake"
          value={formatSourceFinancialValue(
            metrics.openValueUsd,
            canViewFinancialValues,
          )}
          detail="system-projected"
        />
      </div>
    </section>
  );
}

function PortfolioMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: 12,
        background: SHELL.CARD_WHITE,
        padding: "11px 13px",
        display: "grid",
        gap: 5,
      }}
    >
      <div
        style={{
          fontFamily: SHELL.MONO,
          fontSize: 8.5,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: SHELL.INK_MUTED,
          fontWeight: 800,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SHELL.SERIF,
          fontSize: 23,
          color: SHELL.INK,
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 12,
          color: SHELL.INK_MUTED,
          lineHeight: 1.35,
        }}
      >
        {detail}
      </div>
    </div>
  );
}
