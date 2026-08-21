import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  canonicalClientDisplayName,
  getClientOption,
} from "@/lib/client-config";
import { SourceOriginatePage } from "@/components/source/SourceOriginatePage";
import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const metadata: Metadata = { title: "New IT Sourcing Intake · AbarVa" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    intent?: string;
    contractId?: string;
    opportunityId?: string;
  }>;
}) {
  const tenant = await resolveTenant().catch(() => null);
  const params = await searchParams;
  if (params.intent === "contract-optimization") {
    redirect(buildSourceOptimizeContractHref(params));
  }
  const clientKey = tenant?.appClientKey ?? null;
  const clientOption = getClientOption(clientKey);
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: clientKey,
      name: tenant?.displayName,
    }) ?? clientOption.name;

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
    />
  );
}
