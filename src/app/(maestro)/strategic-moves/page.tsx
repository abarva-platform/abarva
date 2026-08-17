import { redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMovePortfolio } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import {
  DEFAULT_STRATEGIC_MOVES_PREFERENCES,
  getStrategicMovesPreferences,
} from "@/lib/programs/strategic-moves-preferences";
import { StrategicMovesHomeClient } from "@/components/strategic-moves/StrategicMovesHomeClient";
import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientRow } from "@/lib/active-client";
import { buildPortfolioReconciliation } from "@/lib/programs/canonical-portfolio-reconciliation";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Strategic Moves · AbarVa",
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Declared portfolio against tracked portfolio.
 *
 * A declared-only programme is usually a gap in onboarding. A tracked-only one is usually legitimate
 * — work that began after intake — but it is also how a portfolio quietly drifts from what the
 * client believes they authorised, so both are shown rather than reconciled away.
 */
function PortfolioReconciliationPanel({
  reconciliation,
}: {
  reconciliation: Awaited<ReturnType<typeof buildPortfolioReconciliation>>;
}) {
  if (!reconciliation) return null;
  const { declaredCount, trackedCount, declaredBudgetUsd, declaredValueUsd } = reconciliation;
  return (
    <section className="mb-5 rounded-md border border-[#d9ddd2] bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#111827]">Declared vs tracked portfolio</h2>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#667085]">
          canonical build {reconciliation.buildVersion}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-3">
          <p className="text-xs font-semibold uppercase text-[#667085]">Declared by client</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-[#111827]">{declaredCount}</p>
          <p className="mt-1 text-[11px] text-[#667085]">canonical programme inventory</p>
        </div>
        <div className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-3">
          <p className="text-xs font-semibold uppercase text-[#667085]">Tracked in Moves</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-[#111827]">{trackedCount}</p>
          <p className="mt-1 text-[11px] text-[#667085]">operational records</p>
        </div>
        <div className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-3">
          <p className="text-xs font-semibold uppercase text-[#667085]">Declared budget</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-[#111827]">
            {declaredBudgetUsd === null ? "not declared" : money(declaredBudgetUsd)}
          </p>
        </div>
        <div className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-3">
          <p className="text-xs font-semibold uppercase text-[#667085]">Declared value</p>
          <p className="mt-1 font-mono text-2xl tabular-nums text-[#111827]">
            {declaredValueUsd === null ? "not declared" : money(declaredValueUsd)}
          </p>
        </div>
      </div>
      {reconciliation.declaredOnly.length > 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#b54708]">
          Declared but not tracked: {reconciliation.declaredOnly.slice(0, 5).join(" · ")}
          {reconciliation.declaredOnly.length > 5
            ? ` and ${reconciliation.declaredOnly.length - 5} more`
            : ""}
          .
        </p>
      ) : null}
      <p className="mt-2 text-[11px] leading-4 text-[#667085]">
        Reconciled, not merged. Work items, milestones and approvals are created here and are never
        overwritten from canonical.
      </p>
    </section>
  );
}

export default async function StrategicMovesPage() {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect("/sign-in");
  }

  // Include archived rows so the landing can power the Archived chip and an
  // accurate active/archived split client-side. The list view shows the full
  // portfolio, so the prior limit of 8 is raised.
  const [portfolio, prefs] = await Promise.all([
    getStrategicMovePortfolio(ctx, { limit: 100, includeArchived: true }),
    getStrategicMovesPreferences(ctx).catch(
      () => DEFAULT_STRATEGIC_MOVES_PREFERENCES,
    ),
  ]);
  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantName = activeClient?.name ?? "Active tenant";

  // Canonical holds what the client declared they are running. Moves holds what is being tracked.
  // These are reconciled and shown, never merged: overwriting live operational rows from a
  // projection would destroy work done in the product, and the first time it happened nobody would
  // trust the surface again.
  const reconciliation = await buildPortfolioReconciliation(
    canonicalTenantKey(activeClient?.key ?? null),
    portfolio.moves.map((m) => m.name),
  ).catch(() => null);

  return (
    <AppShell surface="programs">
      <PortfolioReconciliationPanel reconciliation={reconciliation} />
      <StrategicMovesHomeClient
        initialListView={prefs.listView}
        initialSort={prefs.sort}
        portfolio={portfolio}
        tenantName={tenantName}
      />
    </AppShell>
  );
}
