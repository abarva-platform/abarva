import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { HomeEnterpriseBriefApp } from "@/components/home/HomeEnterpriseBriefApp";
import { HomeV4ExplorerShell } from "@/components/home/v4/HomeV4ExplorerShell";
import { AppShell } from "@/components/shell/AppShell";
import { getActiveClientRow } from "@/lib/active-client";
import {
  canonicalClientDisplayName,
  getClientOption,
  inferClientKeyFromEmail,
} from "@/lib/client-config";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/tenant/resolveTenant";
import {
  readHomeKnowledgeDesignContractForTenant,
  readHomeKnowledgeDesignContractForTenantFromPostgres,
} from "@/lib/home/home-knowledge-design-contract";
import { readHomeKnowledgeV4PackForTenantFromPostgres } from "@/lib/home/home-knowledge-v4-pack";
import { deriveHomeRelationshipEdges } from "@/lib/home/derive-relationship-edges";
import { readDerivedRelationshipGraphEdges } from "@/lib/home/read-derived-relationship-graph";
import {
  foundationKnowledgePath,
  resolveFoundationTenantKeyFromSessionInput,
} from "@/lib/auth/foundation-route-access";
import { isFoundationTenantKey } from "@/lib/tenant/foundation-tenants";

export const metadata: Metadata = {
  title: "Knowledge · Enterprise Context | AbarVa",
  description:
    "Browse governed enterprise context, source-backed evidence, gaps, relationships, and module readiness.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOME_OPTIONAL_DATA_TIMEOUT_MS = 3_000;

type HomePageProps = {
  searchParams?: Promise<{
    client?: string | string[];
    dimension?: string | string[];
  }>;
};

function firstSearchParam(
  value: string | string[] | null | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function bindingTenantKey(value: string | null | undefined): string | null {
  const key = value?.trim().toLowerCase();
  if (!key) return null;
  if (key === "airline-demo-new" || key === "airline demo new") {
    return "airline-demo-new";
  }
  if (key === "healthcare-demo-new" || key === "healthcare demo new") {
    return "healthcare-demo-new";
  }
  if (key === "arcturus" || key === "firstcapital") return "first-capital";
  if (key === "meridian") return "meridian-health";
  if (key === "apexretail") return "apex-retail";
  if (key === "skyharbor") return "skyharbor-air";
  if (key === "lakeshore") return "lakeshore-holdings";
  if (key === "airline-demo" || key === "airline demo") {
    return "airline-demo-new";
  }
  if (key === "healthcare-demo" || key === "healthcare demo") {
    return "meridian-health";
  }
  if (key === "retail-demo" || key === "retail demo") return "apex-retail";
  if (key === "financial-services-demo" || key === "financial services demo") {
    return "first-capital";
  }
  if (key.includes("skyharbor") || key.includes("airline")) {
    if (!key.includes("skyharbor")) return "airline-demo-new";
    return "skyharbor-air";
  }
  if (key.includes("meridian") || key.includes("healthcare")) {
    return "meridian-health";
  }
  if (key.includes("apex") || key.includes("retail")) {
    return "apex-retail";
  }
  if (
    key.includes("arcturus") ||
    key.includes("first-capital") ||
    key.includes("first capital") ||
    key.includes("financial")
  ) {
    return "first-capital";
  }
  if (key.includes("lakeshore")) return "lakeshore-holdings";
  return key;
}

async function withHomePageTimeout<T>(
  label: string,
  promise: Promise<T>,
  fallback: T,
  timeoutMs = HOME_OPTIONAL_DATA_TIMEOUT_MS,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          console.warn(
            `[home] ${label} exceeded ${timeoutMs}ms; rendering Knowledge fallback.`,
          );
          resolve(fallback);
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    console.warn(
      `[home] ${label} failed; rendering Knowledge fallback.`,
      error,
    );
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const requestedClient = firstSearchParam(params?.client);
  const requestedDimension = firstSearchParam(params?.dimension);
  const [activeClient, clerkUser, cookieStore] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    currentUser().catch(() => null),
    cookies().catch(() => null),
  ]);
  const cookieClientKey = cookieStore?.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const clerkEmail =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    null;
  const metadataClientKey =
    (clerkUser?.publicMetadata?.clientId as string | undefined) ??
    (clerkUser?.publicMetadata?.defaultClientId as string | undefined) ??
    null;
  const foundationTenantKey = resolveFoundationTenantKeyFromSessionInput({
    foundationTenantKey: clerkUser?.publicMetadata?.foundationTenantKey as
      | string
      | undefined,
    tenantKey: clerkUser?.publicMetadata?.tenantKey as string | undefined,
    clientId: metadataClientKey,
    defaultClientId: clerkUser?.publicMetadata?.defaultClientId as
      | string
      | undefined,
  });
  const inferredClientKey =
    foundationTenantKey ??
    metadataClientKey ??
    inferClientKeyFromEmail(clerkEmail);
  const homeTenantKey =
    foundationTenantKey ??
    bindingTenantKey(requestedClient) ??
    bindingTenantKey(cookieClientKey) ??
    bindingTenantKey(inferredClientKey) ??
    bindingTenantKey(activeClient?.key) ??
    bindingTenantKey(activeClient?.name);
  if (isFoundationTenantKey(homeTenantKey)) {
    redirect(foundationKnowledgePath(homeTenantKey));
  }
  const displayClientKey =
    cookieClientKey ??
    inferredClientKey ??
    activeClient?.key ??
    homeTenantKey ??
    requestedClient;
  const activeTenantName =
    canonicalClientDisplayName({
      key: displayClientKey,
      name: activeClient?.name,
    }) ??
    activeClient?.name ??
    "Your workspace";

  const clientOption = displayClientKey
    ? getClientOption(displayClientKey)
    : null;

  // Book-mode V4 takes precedence over V2 when an approved pack exists for
  // this tenant -- same homeTenantKey, same proxy-enforced scoping, no
  // separate query param or admin gate (that pattern belongs to
  // /home/v4-preview's candidate-review use case, not live serving). Every
  // tenant without an approved V4 pack (the default, until explicitly
  // approved per tenant) falls through to the unchanged V2 read below.
  const v4Pack = await withHomePageTimeout(
    "Home Knowledge Pack v4 (book mode)",
    readHomeKnowledgeV4PackForTenantFromPostgres(homeTenantKey),
    null,
  );
  if (v4Pack) {
    return (
      <AppShell
        surface="home"
        topBarProps={{
          tenantName: activeTenantName,
          showLocked: Boolean(activeClient?.key),
          context: clientOption?.vertical
            ? `Knowledge · ${clientOption.vertical}`
            : "Knowledge",
        }}
        hasTenantKey={Boolean(activeClient?.key)}
      >
        <HomeV4ExplorerShell candidate={v4Pack} />
      </AppShell>
    );
  }

  const fileDesignContract =
    readHomeKnowledgeDesignContractForTenant(homeTenantKey);
  const postgresDesignContract = await withHomePageTimeout(
    "Home Knowledge Pack v2",
    readHomeKnowledgeDesignContractForTenantFromPostgres(homeTenantKey),
    null,
    1_800,
  );
  const designContract = postgresDesignContract?.pack
    ? postgresDesignContract
    : fileDesignContract;
  if (designContract.pack) {
    const derivedRelationshipEdges =
      readDerivedRelationshipGraphEdges(homeTenantKey);
    const relationshipEdges = derivedRelationshipEdges.length
      ? derivedRelationshipEdges
      : deriveHomeRelationshipEdges(designContract.pack.design_slots.DATA);

    return (
      <AppShell
        surface="home"
        topBarProps={{
          tenantName: activeTenantName,
          showLocked: Boolean(activeClient?.key),
          context: clientOption?.vertical
            ? `Knowledge · ${clientOption.vertical}`
            : "Knowledge",
        }}
        hasTenantKey={Boolean(activeClient?.key)}
      >
        <main
          className="home-executive-page"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            background: "#f5f1eb",
          }}
        >
          <HomeEnterpriseBriefApp
            pack={designContract.pack}
            relationshipEdges={relationshipEdges}
            selectedDimension={requestedDimension}
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName: activeTenantName,
        showLocked: Boolean(activeClient?.key),
        context: clientOption?.vertical
          ? `Knowledge · ${clientOption.vertical}`
          : "Knowledge",
      }}
      hasTenantKey={Boolean(activeClient?.key)}
    >
      <main
        className="home-executive-page home-executive-page--empty"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          background: "#f5f1eb",
          display: "grid",
          placeItems: "center",
          padding: 48,
        }}
      >
        <section
          style={{
            maxWidth: 620,
            border: "1px solid #ddd3c6",
            borderRadius: 14,
            background: "#fffdf8",
            padding: 32,
          }}
        >
          <span>Knowledge pack unavailable</span>
          <h1>{activeTenantName}</h1>
          <p>
            This tenant does not have an approved Home knowledge pack available
            yet. Generate and approve the governed pack before this surface is
            shown to client users.
          </p>
        </section>
      </main>
    </AppShell>
  );
}
