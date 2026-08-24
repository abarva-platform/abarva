// /intelligence · Advisory board surface.

import { AppShell } from "@/components/shell/AppShell";
import { AdvisoryIntelligencePage } from "@/components/intelligence-advisory/AdvisoryIntelligencePage";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { getEnterpriseLandscapeViewModel } from "@/lib/home/enterprise-landscape-view-model";
import { buildCanonicalLandscapeSections } from "@/lib/intelligence/canonical-landscape-sections";
import {
  readIntelligenceEclContextPackPreview,
  type IntelligenceEclContextPackPreview,
} from "@/lib/intelligence/eclContextPackPreview";
import { resolveIntelligenceViewModelClientKey } from "@/lib/intelligence/intelligence-view-model-client-key";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const metadata = {
  title: "Intelligence · Advisory Board | AbarVa",
  description:
    "A virtual advisory board that turns enterprise context and corpus knowledge into guidance, risks, benchmarks, and next actions.",
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
  const resolvedSearchParams = await searchParams;
  const rawRequestedClient = firstSearchValue(resolvedSearchParams?.client);
  const requestedProvider = firstSearchValue(resolvedSearchParams?.provider);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const [client, tenant] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    resolveTenant({ requestedClient }).catch(() => null),
  ]);
  const effectiveClientKey = client?.key ?? tenant?.appClientKey ?? null;
  const contextTenantKey = enterpriseContextTenantKey(
    effectiveClientKey ?? requestedClient,
  );
  const viewModelClientKey = resolveIntelligenceViewModelClientKey({
    clientKey: effectiveClientKey,
    requestedClient,
    contextTenantKey,
  });
  const tenantName =
    canonicalClientDisplayName({
      key: effectiveClientKey,
      name: client?.name ?? tenant?.displayName,
    }) ??
    client?.name ??
    tenant?.displayName ??
    "AbarVa Client";

  // Canonical first. The authored view model stays as a fallback for the case where the projector
  // has not yet run for a tenant, but it is a fallback and is labelled as one — the previous
  // behaviour was to render authored content under a "current state assessment" heading with
  // nothing distinguishing it from a client fact.
  // `enterpriseContextTenantKey` maps some app keys to canonical ones and passes the rest through
  // unchanged, so "skyharbor" never became "skyharbor-air" and the lookup silently missed. The
  // landscape is keyed canonically; resolve it as such rather than relying on that partial map.
  const canonical = await buildCanonicalLandscapeSections(
    canonicalTenantKey(contextTenantKey),
    tenantName,
  );
  const authored = getEnterpriseLandscapeViewModel({
    clientKey: viewModelClientKey,
    tenantName,
  });
  const viewModel = canonical
    ? { ...authored, sections: canonical.sections }
    : authored;
  const intelligenceEclPreview =
    requestedProvider === "ecl_projection_db"
      ? await readIntelligenceEclContextPackPreview(
          canonicalTenantKey(contextTenantKey),
        )
      : null;

  return (
    <AppShell
      surface="intelligence"
      topBarProps={{
        tenantName,
        showLocked: Boolean(effectiveClientKey),
        context: "Intelligence",
      }}
      hasTenantKey={Boolean(effectiveClientKey)}
    >
      {intelligenceEclPreview ? (
        <IntelligenceEclProjectionPanel preview={intelligenceEclPreview} />
      ) : null}
      <AdvisoryIntelligencePage viewModel={viewModel} />
    </AppShell>
  );
}

function IntelligenceEclProjectionPanel({
  preview,
}: {
  preview: IntelligenceEclContextPackPreview;
}) {
  return (
    <section className="border-b border-emerald-900/10 bg-emerald-50/45 px-6 py-6 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              ECL projection read
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Intelligence context pack projection is loaded
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              This non-default preview reads the governed ECL Intelligence
              serving views for the dense assessment. It proves the context
              pack has governed rows, retrieval states, access classes,
              citations and gaps; it does not repoint the default Intelligence
              advisory surface.
            </p>
          </div>
          <div className="border border-slate-200 bg-white px-6 py-4 text-right shadow-sm">
            <div className="text-3xl font-semibold tabular-nums">
              {preview.rowCount}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
              context rows
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <IntelligenceEclStat
            label="Permitted facts"
            value={preview.totals.permittedFacts}
          />
          <IntelligenceEclStat
            label="Blocked facts"
            value={preview.totals.blockedFacts}
          />
          <IntelligenceEclStat
            label="Citation refs"
            value={preview.totals.citations}
          />
          <IntelligenceEclStat label="Gap flags" value={preview.totals.gaps} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.4fr]">
          <div className="space-y-5">
            <IntelligenceEclCountList
              title="Retrieval state"
              rows={preview.retrievalCounts.map((row) => ({
                label: row.retrievalState,
                count: row.count,
              }))}
            />
            <IntelligenceEclCountList
              title="Access class"
              rows={preview.accessCounts.map((row) => ({
                label: row.accessClass,
                count: row.count,
              }))}
            />
            <IntelligenceEclCountList
              title="Quality state"
              rows={preview.qualityCounts.map((row) => ({
                label: row.qualityState,
                count: row.count,
              }))}
            />
          </div>

          <div className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.6fr] gap-4 border-b border-slate-100 bg-white/70 px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Context row</span>
              <span>Retrieval</span>
              <span>Access</span>
              <span>Refs</span>
            </div>
            <div className="divide-y divide-slate-100">
              {preview.contextRows.map((row) => (
                <div
                  key={`${row.surfaceKey}:${row.rowKey}`}
                  className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.6fr] gap-4 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-950">
                      {row.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">
                      {row.summary}
                    </div>
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                      {row.rowKey}
                    </div>
                  </div>
                  <div className="capitalize text-slate-700">
                    {row.retrievalState.replaceAll("_", " ")}
                  </div>
                  <div className="capitalize text-slate-700">
                    {row.accessClass.replaceAll("_", " ")}
                  </div>
                  <div className="font-mono text-xs text-slate-700">
                    {row.permittedFactCount} facts · {row.citationCount} cites
                    · {row.gapCount} gaps
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntelligenceEclStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function IntelligenceEclCountList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number }>;
}) {
  return (
    <div>
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h2>
      <div className="mt-2 divide-y divide-slate-100 border border-slate-200 bg-white shadow-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span className="capitalize text-slate-700">
              {row.label.replaceAll("_", " ")}
            </span>
            <span className="font-mono text-slate-950 tabular-nums">
              {row.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
