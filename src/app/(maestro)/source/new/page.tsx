import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveClientRow } from "@/lib/active-client";
import {
  canonicalClientDisplayName,
  getClientOption,
} from "@/lib/client-config";
import { SourceOriginatePage } from "@/components/source/SourceOriginatePage";
import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";

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
  const activeClient = await getActiveClientRow().catch(() => null);
  const params = await searchParams;
  if (params.intent === "contract-optimization") {
    redirect(buildSourceOptimizeContractHref(params));
  }
  const clientOption = getClientOption(activeClient?.key);
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? clientOption.name;

  return (
    <SourceOriginatePage
      clientName={activeClientDisplayName}
      clientShortName={clientOption.shortName}
      clientKey={clientOption.id}
    />
  );
}
