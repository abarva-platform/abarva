// /intelligence · aVa Intelligence advisor inside the maestro app shell.

import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { IntelligenceV2Surface } from "@/components/intelligence-v2/IntelligenceV2Surface";
import { getIntelligenceBindingPayload } from "@/lib/intelligence/binding/binding-payload";

export const metadata = {
  title: "Intelligence · Context & Corpus Explorer | AbarVa",
  description:
    "Explore tenant context, live facts, coverage, trust posture, and derived insights from the enterprise context layer.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface IntelligencePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function enterpriseContextTenantKey(
  value: string | null | undefined,
): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === "arcturus" || key === "firstcapital") return "first-capital";
  if (key === "meridian") return "meridian-health";
  if (key === "apexretail") return "apex-retail";
  return key;
}

export default async function IntelligencePage({
  searchParams,
}: IntelligencePageProps = {}) {
  const rawRequestedClient = firstSearchValue((await searchParams)?.client);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const client = await getActiveClientRow(requestedClient).catch(() => null);
  const contextTenantKey = enterpriseContextTenantKey(
    client?.key ?? requestedClient,
  );
  const tenantName =
    canonicalClientDisplayName({ key: client?.key, name: client?.name }) ??
    client?.name ??
    "AbarVa Client";
  const binding = getIntelligenceBindingPayload(contextTenantKey);
  if (!binding) {
    notFound();
  }

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: Boolean(client?.key),
        context: "Intelligence",
      }}
      hasTenantKey={Boolean(client?.key)}
    >
      <IntelligenceV2Surface payload={binding} tenantName={tenantName} />
    </AppShell>
  );
}
