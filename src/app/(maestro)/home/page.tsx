import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  foundationKnowledgePath,
  resolveFoundationTenantKeyFromSessionInput,
} from "@/lib/auth/foundation-route-access";
import {
  type FoundationTenantKey,
  isFoundationTenantKey,
} from "@/lib/tenant/foundation-tenants";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/tenant/resolveTenant";

export const metadata: Metadata = {
  title: "Knowledge | AbarVa",
  description: "Governed Knowledge baseline and enterprise context.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type HomePageProps = {
  searchParams?: Promise<{
    client?: string | string[];
    tenant?: string | string[];
  }>;
};

function firstSearchParam(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function foundationTenantFromLegacyHint(
  value: string | null | undefined,
): FoundationTenantKey | null {
  const normalized = value?.trim().toLowerCase().replace(/_/g, "-") ?? "";
  if (!normalized) return null;
  if (isFoundationTenantKey(normalized)) return normalized;
  if (
    normalized === "airline-demo" ||
    normalized === "airline demo" ||
    normalized === "skyharbor" ||
    normalized === "skyharbor-air" ||
    normalized.includes("airline") ||
    normalized.includes("skyharbor")
  ) {
    return "airline-demo-new";
  }
  if (
    normalized === "healthcare-demo" ||
    normalized === "healthcare demo" ||
    normalized === "meridian" ||
    normalized === "meridian-health" ||
    normalized.includes("healthcare") ||
    normalized.includes("meridian")
  ) {
    return "healthcare-demo-new";
  }
  return null;
}

/**
 * Archived Home entry point.
 *
 * The old Home/V2/V4 renderer is intentionally no longer reachable from
 * `/home`. The governed Knowledge baseline is served through `/knowledge-preview`
 * until the final non-preview Knowledge route is promoted.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, clerkUser, cookieStore] = await Promise.all([
    searchParams,
    currentUser().catch(() => null),
    cookies().catch(() => null),
  ]);
  const requestedTenant =
    firstSearchParam(params?.tenant) ?? firstSearchParam(params?.client);
  const cookieTenant = cookieStore?.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const metadata = clerkUser?.publicMetadata ?? {};
  const foundationTenantKey =
    resolveFoundationTenantKeyFromSessionInput({
      foundationTenantKey: metadata.foundationTenantKey as string | undefined,
      tenantKey: metadata.tenantKey as string | undefined,
      clientId: metadata.clientId as string | undefined,
      defaultClientId: metadata.defaultClientId as string | undefined,
    }) ??
    foundationTenantFromLegacyHint(requestedTenant) ??
    foundationTenantFromLegacyHint(cookieTenant) ??
    foundationTenantFromLegacyHint(metadata.tenantKey as string | undefined) ??
    foundationTenantFromLegacyHint(metadata.clientId as string | undefined) ??
    foundationTenantFromLegacyHint(
      metadata.defaultClientId as string | undefined,
    ) ??
    "airline-demo-new";

  redirect(foundationKnowledgePath(foundationTenantKey));
}
