import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ProductMarketingPage } from "@/components/product/ProductMarketingPage";
import { getActiveClientKey, getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName, getClientOption } from "@/lib/client-config";

export const metadata = { title: "Product - AbarVa" };
export const dynamic = "force-dynamic";

export default async function ProductRoutePage() {
  const user = await currentUser().catch(() => null);
  if (!user) redirect("/sign-in");

  const activeClientKey = await getActiveClientKey().catch(() => null);
  const activeClient = activeClientKey
    ? await getActiveClientRow(activeClientKey).catch(() => null)
    : null;
  const fallbackClient = activeClientKey ? getClientOption(activeClientKey) : null;
  const clientName =
    canonicalClientDisplayName({
      key: activeClient?.key ?? activeClientKey,
      name: activeClient?.name ?? fallbackClient?.name,
    }) ?? "AbarVa Client";
  const clientShortName = fallbackClient?.shortName ?? clientName;

  return (
    <AppShell
      surface="product"
      topBarProps={{ context: "Product", tenantName: clientName }}
      hasTenantKey={Boolean(activeClientKey)}
      agentName="Atlas coach"
    >
      <ProductMarketingPage
        spotlight={{
          clientName,
          clientShortName,
        }}
      />
    </AppShell>
  );
}
