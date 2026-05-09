import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { ProductMarketingPage } from "@/components/product/ProductMarketingPage";
import { getActiveClientRow } from "@/lib/active-client";

export const metadata = { title: "Product - AbarVa" };
export const dynamic = "force-dynamic";

export default async function ProductRoutePage() {
  const user = await currentUser().catch(() => null);
  if (!user) redirect("/sign-in");

  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantName = activeClient?.name ?? 'Meridian';

  return (
    <AppShell
      surface="product"
      topBarProps={{ context: "Product" }}
      agentName="Atlas coach"
    >
      <ProductMarketingPage tenantName={tenantName} />
    </AppShell>
  );
}
