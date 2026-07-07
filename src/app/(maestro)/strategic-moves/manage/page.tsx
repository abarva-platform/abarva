import { redirect } from "next/navigation";
import { requireProductModule } from "@/lib/auth/server-module-access";
import { getStrategicMovePortfolio } from "@/lib/programs/queries";
import { getStrategicMovesTenancy } from "@/lib/programs/strategic-moves-context";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { ManageMovesClient } from "@/components/strategic-moves/ManageMovesClient";
import { AppShell } from "@/components/shell/AppShell";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manage Moves · AbarVa",
};

export default async function ManageMovesPage() {
  await requireProductModule("programs");
  const ctx = await getStrategicMovesTenancy();
  if (!ctx) {
    redirect("/sign-in");
  }

  const accessPolicy = await loadUserProgramAccessPolicy(ctx);
  // Fetch active + archived so the Archived filter chip works client-side.
  const portfolio = await getStrategicMovePortfolio(ctx, {
    limit: 200,
    includeArchived: true,
  });

  return (
    <AppShell surface="programs">
      <ManageMovesClient
        portfolio={portfolio}
        canManage={accessPolicy.canApproveGates}
      />
    </AppShell>
  );
}
