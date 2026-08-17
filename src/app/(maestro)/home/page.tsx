import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AppShell } from "@/components/shell/AppShell";
import { HomeEnterpriseLandscapeV2 } from "@/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2";
import {
  SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
  type HomeEnterpriseLandscapeV2Model,
} from "@/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model";
import { getActiveClientRow } from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import {
  listContract360,
  listContractApplicationScope,
  listVendorContractPortfolio,
} from "@/lib/source/data-model/read-adapter";
import { loadSourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";
import {
  loadHomeLandscape,
  type HomeLandscape,
} from "@/lib/home/landscape-read-adapter";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
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

interface HomeSourceRuntimeSummary {
  readonly contractCount: number;
  readonly vendorCount: number;
  readonly applicationScopeRows: number;
  readonly annualValue: number;
  readonly totalCommittedValue: number;
  readonly cubeContracts: number;
  readonly cubeVendors: number;
  readonly activeLoadRunId: string | null;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

async function loadHomeSourceRuntimeSummary(
  tenantKey: string | null | undefined,
): Promise<HomeSourceRuntimeSummary | null> {
  if (!tenantKey) return null;
  try {
    const [contracts, vendors, scope, cube] = await Promise.all([
      listContract360(tenantKey).catch(() => []),
      listVendorContractPortfolio(tenantKey).catch(() => []),
      listContractApplicationScope(tenantKey).catch(() => []),
      loadSourceV4WorkspaceSnapshot(tenantKey).catch(() => null),
    ]);
    const vendorRefs = new Set(
      contracts.map((contract) => contract.vendor_ref),
    );
    return {
      contractCount: contracts.length,
      vendorCount: vendors.length || vendorRefs.size,
      applicationScopeRows: scope.length,
      annualValue: contracts.reduce(
        (sum, contract) => sum + Number(contract.annual_value ?? 0),
        0,
      ),
      totalCommittedValue: contracts.reduce(
        (sum, contract) =>
          sum +
          Number(contract.total_committed_value ?? contract.annual_value ?? 0),
        0,
      ),
      cubeContracts: cube?.executivePortfolio.contractCount ?? 0,
      cubeVendors: cube?.contextCoverage.vendors ?? 0,
      activeLoadRunId: cube?.activeLoadRunId ?? null,
    };
  } catch {
    return null;
  }
}

function SourceRuntimeSummaryPanel({
  summary,
}: {
  summary: HomeSourceRuntimeSummary | null;
}) {
  if (!summary || summary.contractCount === 0) return null;
  const items = [
    [
      "Contracts",
      summary.contractCount.toLocaleString(),
      "source.contract_360",
    ],
    [
      "Vendors",
      summary.vendorCount.toLocaleString(),
      "source.vendor_contract_portfolio",
    ],
    [
      "Application Scope",
      summary.applicationScopeRows.toLocaleString(),
      "source.contract_application_scope",
    ],
    [
      "Annual Value",
      money(summary.annualValue),
      "consumption.sourcing_contract_v1",
    ],
  ];
  return (
    <section className="rounded-md border border-[#d9ddd2] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase text-[#667085]">
          Refreshed Source L4 / Cube
        </p>
        <h2 className="text-xl font-semibold text-[#111827]">
          Vendor and contract projection
        </h2>
        <p className="text-sm leading-6 text-[#475467]">
          Home is reading governed Source projections and cube coverage, with
          canary data used only when governed rows are not yet present.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value, source]) => (
          <div key={label} className="rounded-md border border-[#e5e7eb] p-4">
            <div className="text-xs font-semibold uppercase text-[#667085]">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#111827]">
              {value}
            </div>
            <div className="mt-2 text-xs text-[#667085]">{source}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-[#667085]">
        Cube coverage: {summary.cubeContracts.toLocaleString()} contracts /{" "}
        {summary.cubeVendors.toLocaleString()} vendors
        {summary.activeLoadRunId ? ` · ${summary.activeLoadRunId}` : ""}
      </p>
    </section>
  );
}

/**
 * Replace authored headline economics with canonical figures — where canonical can support the
 * claim, and only there.
 *
 * The model's anchors were string literals: a technology budget of $2.35B and a prior-year actual of
 * $2.18B with no data path behind either. Replacing them with a sum of `spend_value_fact` looked
 * obvious and is wrong, because the two tenants' spend sheets do not share a grain. One lists
 * technology spend by category and totals $663M. The other lists *enterprise* spend by business
 * function — facilities, HR, behavioural health — and totals $5.4B, of which the IT line is $103M.
 * Summing the second and calling it a technology budget overstates it more than fiftyfold.
 *
 * The intake declares no scope for that sheet, so neither total can be labelled. The honest anchor
 * is therefore not a smaller number; it is the absence of one. Contract value is different: an
 * annual contract value means the same thing on both sheets, so it is quoted.
 */
function withCanonicalEconomics(
  model: HomeEnterpriseLandscapeV2Model,
  landscape: HomeLandscape | null,
): HomeEnterpriseLandscapeV2Model {
  if (!landscape) return model;
  const vendors = landscape.byKey("vendors");
  const spend = landscape.byKey("spend");
  const anchors = model.anchors.map((anchor) => {
    // Not established, and deliberately so. The spend sheet has no declared scope, so a total from
    // it cannot be called a technology budget without asserting something the client never said.
    if (anchor.label === "Technology budget") {
      return {
        ...anchor,
        value: "Not established",
        detail: spend?.money
          ? `${spend.money.contributing} spend categories declared, scope not stated in intake`
          : "No declared spend supplied",
      };
    }
    // Nothing canonical carries an observed prior-year actual. Every fact in the model is declared,
    // so there is no measured figure here and inventing continuity would be worse than a gap.
    if (anchor.label === "Prior-year actual") {
      return {
        ...anchor,
        value: "Not established",
        detail: "No observed prior-year figure in the canonical model",
      };
    }
    // Annual contract value means the same thing on every intake, so it is safe to quote.
    if (anchor.label === "Committed base" && vendors?.money) {
      return {
        ...anchor,
        value: money(vendors.money.total),
        detail: `Annual contract value across ${vendors.money.contributing} contracts · build ${landscape.buildVersion}`,
      };
    }
    if (anchor.label === "Contract register" && vendors) {
      return {
        ...anchor,
        value: vendors.distinctNameCount.toLocaleString(),
        detail: `Distinct vendors · ${vendors.recordCount.toLocaleString()} contract records`,
      };
    }
    return anchor;
  });
  return { ...model, anchors };
}

function withSourceSummaryAnchors(
  model: HomeEnterpriseLandscapeV2Model,
  summary: HomeSourceRuntimeSummary | null,
  tenantName: string,
): HomeEnterpriseLandscapeV2Model {
  if (!summary || summary.contractCount === 0) return { ...model, tenantName };
  return {
    ...model,
    tenantName,
    status: "Planning-grade | Governed Source L4 / cube projection refreshed",
    anchors: model.anchors.map((anchor) => {
      if (anchor.label === "Committed base") {
        return {
          ...anchor,
          value: money(summary.annualValue),
          detail: "Annual contract value from Source L4",
        };
      }
      if (anchor.label === "Contract register") {
        return {
          ...anchor,
          value: summary.contractCount.toLocaleString(),
          detail: "source.contract_360 rows",
        };
      }
      return anchor;
    }),
    evidence: [
      {
        label: "Source L4 / Cube",
        value: `${summary.contractCount.toLocaleString()} contracts · ${summary.vendorCount.toLocaleString()} vendors`,
        detail:
          "source.contract_360, source.vendor_contract_portfolio, consumption.sourcing_contract_v1",
        tone: "teal",
      },
      ...model.evidence,
    ],
  };
}

function EnterpriseLandscapePanel({
  landscape,
}: {
  landscape: HomeLandscape | null;
}) {
  if (!landscape) {
    return (
      <section className="rounded-md border border-[#d9ddd2] bg-white p-6">
        <h2 className="text-xl font-semibold text-[#111827]">
          Enterprise landscape
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#475467]">
          Not available. The landscape projection has not run for this client, so there is
          nothing to show. This panel stays empty rather than displaying another product&rsquo;s
          figures.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-md border border-[#d9ddd2] bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-[#111827]">
          Enterprise landscape
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#667085]">
          {landscape.totalEntities.toLocaleString()} entities · build{" "}
          {landscape.buildVersion}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {landscape.dimensions.map((dimension) => (
          <div
            key={dimension.dimensionKey}
            className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-4"
          >
            <p className="text-sm font-semibold text-[#111827]">
              {dimension.displayName}
            </p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-[#111827]">
              {dimension.recordCount.toLocaleString()}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[#667085]">
              {dimension.confidenceStatus === "not_available"
                ? "not supplied"
                : `${dimension.evidenceCount.toLocaleString()} evidence`}
            </p>
            {dimension.sampleEntities.length > 0 ? (
              <p className="mt-2 text-[11px] leading-4 text-[#667085]">
                {dimension.sampleEntities.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {landscape.gaps.length > 0 ? (
        <p className="mt-4 text-sm leading-6 text-[#b54708]">
          Not supplied by this client: {landscape.gaps.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}

function MeridianHome({
  tenantName,
  sourceSummary,
  landscape,
}: {
  tenantName: string;
  sourceSummary: HomeSourceRuntimeSummary | null;
  landscape: HomeLandscape | null;
}) {
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

          <EnterpriseLandscapePanel landscape={landscape} />

          <SourceRuntimeSummaryPanel summary={sourceSummary} />

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
  // The landscape is keyed by canonical tenant key ("skyharbor-air"), while the rest of this page
  // works in app client keys ("skyharbor"). Passing the app key here looks up a tenant that does
  // not exist and renders "not available" over data that is present — the failure is silent
  // because a missing pack is a legitimate state.
  const [sourceSummary, landscape] = await Promise.all([
    loadHomeSourceRuntimeSummary(clientKey),
    loadHomeLandscape(canonicalTenantKey(clientKey)),
  ]);

  if (clientKey === "skyharbor") {
    // Source first, then canonical. Canonical wins where both have a figure: Source projects the
    // contract register, canonical carries what the client declared about their whole estate.
    const model = withCanonicalEconomics(
      withSourceSummaryAnchors(
        SKYHARBOR_HOME_ENTERPRISE_LANDSCAPE_V2,
        sourceSummary,
        tenantName,
      ),
      landscape,
    );
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
        <div className="space-y-6">
          <EnterpriseLandscapePanel landscape={landscape} />
          <HomeEnterpriseLandscapeV2 model={model} />
        </div>
      </AppShell>
    );
  }

  return (
    <MeridianHome
      tenantName={tenantName}
      sourceSummary={sourceSummary}
      landscape={landscape}
    />
  );
}
