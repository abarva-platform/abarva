import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppShell } from "@/components/shell/AppShell";
import { HomeEnterpriseLandscapeV2 } from "@/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  ACTIVE_CLIENT_COOKIE,
  resolveTenant,
} from "@/lib/tenant/resolveTenant";

export const metadata: Metadata = {
  title: "Enterprise Landscape | AbarVa",
  description:
    "AbarVa Home enterprise landscape with evidence-bound executive read, economics, posture, coherence, trajectory, watchlist, and provenance.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function MeridianHome({ tenantName }: { tenantName: string }) {
  const priorities = [
    [
      "Vendor 360",
      "Review managed-services exposure, contract families, renewal windows, and vendor responsibility overlap.",
    ],
    [
      "Service Performance",
      "Trace contract scope through services, applications, SLA posture, and service-credit evidence.",
    ],
    [
      "Moves Handoff",
      "Prepare BPO, rebadge, transition, retained-organization, and automation recommendations for governed decisioning.",
    ],
    [
      "Roadmap Linkage",
      "Connect AWS, Databricks, Epic, Workday, ServiceNow, and legacy-platform modernization to enterprise outcomes.",
    ],
  ];

  return (
    <AppShell
      surface="home"
      topBarProps={{
        tenantName,
        preserveTenantName: true,
        showLocked: true,
        context: "Healthcare command center",
      }}
      hasTenantKey
    >
      <main className="min-h-screen bg-[#f7f7f2] text-[#171717]">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-8 py-10">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase text-[#667085]">
              Healthcare Demo · Synthetic demonstration tenant
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-[#111827]">
              {tenantName} executive command center
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[#475467]">
              Governed healthcare projections are bound for vendor portfolio,
              contracts, services, applications, SLA performance, workforce
              economics, sourcing events, and decision handoff.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {priorities.map(([title, body]) => (
              <article
                key={title}
                className="rounded-md border border-[#d9ddd2] bg-white p-5 shadow-sm"
              >
                <h2 className="text-base font-semibold text-[#111827]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#475467]">{body}</p>
              </article>
            ))}
          </div>

          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-md border border-[#d9ddd2] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#111827]">
                Browser Gate Focus
              </h2>
              <div className="mt-5 grid gap-3 text-sm text-[#344054] sm:grid-cols-2">
                <span>Vendor 360 and contract family traversal</span>
                <span>Analytics and Epic managed-services contracts</span>
                <span>BPO opportunity and supplier comparison</span>
                <span>Rebadge, transition, and retained-organization risk</span>
                <span>Contractual versus aspirational automation</span>
                <span>Moves decision handoff and roadmap linkage</span>
              </div>
            </div>
            <div className="rounded-md border border-[#d9ddd2] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#111827]">
                Tenant Boundary
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#475467]">
                This signed-in surface is pinned to Meridian Health.
                Browser-supplied tenant keys must not override server-side
                authorization.
              </p>
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  );
}

export default async function HomePage() {
  const [client, tenant, cookieStore] = await Promise.all([
    getActiveClientRow().catch(() => null),
    resolveTenant().catch(() => null),
    cookies().catch(() => null),
  ]);
  const activeClientCookie = cookieStore?.get(ACTIVE_CLIENT_COOKIE)?.value;
  const cookieClientKey =
    activeClientCookie === "skyharbor" ? "skyharbor" : null;
  const clientKey = client?.key ?? tenant?.appClientKey ?? cookieClientKey;
  const tenantName =
    canonicalClientDisplayName({
      key: clientKey,
      name: client?.name ?? tenant?.displayName,
    }) ??
    tenant?.displayName ??
    "AbarVa Client";

  if (clientKey === "skyharbor") {
    return (
      <AppShell
        surface="home"
        topBarProps={{
          tenantName,
          preserveTenantName: true,
          showLocked: true,
          context: "Enterprise Landscape",
        }}
        hasTenantKey
      >
        <HomeEnterpriseLandscapeV2 />
      </AppShell>
    );
  }

  return <MeridianHome tenantName={tenantName} />;
}
