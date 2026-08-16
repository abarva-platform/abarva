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

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Strategic Moves · AbarVa",
};

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

  return (
    <AppShell surface="programs">
      <StrategicMovesHomeClient
        initialListView={prefs.listView}
        initialSort={prefs.sort}
        portfolio={portfolio}
        tenantName={tenantName}
      />
    </AppShell>
  );
}
