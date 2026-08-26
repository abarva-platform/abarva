// Tower — primary route.
//
// As of 2026-07-23 this always serves the **Command Center** (the rebuilt page
// against `docs/design/tower/command-center-2026-07-23/`). The previous Tower
// page is no longer a runtime fallback.

import { Suspense } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { EclDemoFindingsPanel } from "@/components/ecl/EclDemoFindingsPanel";
import { EclServingSurfaceCoverage } from "@/components/ecl/EclServingSurfaceCoverage";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { buildTowerCanonicalReconciliation } from "@/lib/tower/canonical-reconciliation";
import {
  readTowerEclProjectionPreview,
  type TowerEclProjectionPreview,
} from "@/lib/tower/eclProjectionPreview";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";

export const metadata = { title: "Tower · AbarVa" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Keep the mart read bounded so sparse/private data states still render. */
const TOWER_READ_TIMEOUT_MS = 8_000;

interface TowerPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstSearchValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function withTowerReadTimeout<T>(
  read: Promise<T>,
  fallback: T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      read,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), TOWER_READ_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function shortNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function label(value: string | null | undefined): string {
  if (!value) return "not established";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function TowerEclProjectionPanel({
  preview,
}: {
  preview: TowerEclProjectionPreview | null;
}) {
  if (!preview) return null;
  return (
    <section className="mb-5 rounded-md border border-[#b7d7c8] bg-[#f8fffb] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#057a55]">
            ECL projection read
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#111827]">
            Tower command center projection is loaded
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475467]">
            This route reads the governed ECL Tower serving view for the dense
            assessment. It proves the projection exists and carries gate
            reasons on the default Tower path.
          </p>
        </div>
        <div className="rounded border border-[#d6eadf] bg-white px-4 py-3 text-right">
          <p className="font-mono text-2xl text-[#111827]">
            {preview.rowCount.toLocaleString()}
          </p>
          <p className="text-xs uppercase tracking-wide text-[#667085]">
            projection rows
          </p>
        </div>
      </div>

      <div className="mt-5">
        <EclServingSurfaceCoverage product="tower" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="border border-[#d6eadf] bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-[#667085]">
            Funded
          </p>
          <p className="mt-1 font-mono text-lg text-[#111827]">
            {money(preview.totals.fundedUsd)}
          </p>
        </div>
        <div className="border border-[#d6eadf] bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-[#667085]">
            Promised
          </p>
          <p className="mt-1 font-mono text-lg text-[#111827]">
            {money(preview.totals.promisedUsd)}
          </p>
        </div>
        <div className="border border-[#d6eadf] bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-[#667085]">
            Claimable
          </p>
          <p className="mt-1 font-mono text-lg text-[#111827]">
            {money(preview.totals.claimableUsd)}
          </p>
        </div>
        <div className="border border-[#d6eadf] bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-[#667085]">
            Blocked
          </p>
          <p className="mt-1 font-mono text-lg text-[#111827]">
            {money(preview.totals.blockedUsd)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Rows by page
            </h3>
            <div className="mt-2 space-y-2">
              {preview.pageCounts.map((row) => (
                <div
                  key={row.pageKey}
                  className="flex items-center justify-between border-b border-[#e7efe9] pb-1 text-sm"
                >
                  <span className="text-[#344054]">{label(row.pageKey)}</span>
                  <span className="font-mono text-[#111827]">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Gate state
            </h3>
            <div className="mt-2 space-y-2">
              {preview.gateCounts.map((row) => (
                <div
                  key={row.gateStatus}
                  className="flex items-center justify-between border-b border-[#e7efe9] pb-1 text-sm"
                >
                  <span className="text-[#344054]">
                    {label(row.gateStatus)}
                  </span>
                  <span className="font-mono text-[#111827]">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#111827]">
            Highest blocked rows
          </h3>
          <div className="mt-2 overflow-x-auto border border-[#d6eadf] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f2faf5] text-xs uppercase tracking-wide text-[#667085]">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Gate</th>
                  <th className="px-3 py-2">Blocked</th>
                  <th className="px-3 py-2">Proof</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {preview.priorityRows.map((row) => (
                  <tr key={row.rowKey} className="border-t border-[#eef2ef]">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#111827]">{row.title}</p>
                      <p className="text-xs text-[#667085]">
                        {label(row.pageKey)} · {label(row.rowType)}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-[#344054]">
                      {label(row.gateStatus)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[#111827]">
                      {shortNumber(row.blockedUsd)}
                    </td>
                    <td className="px-3 py-2 font-mono text-[#111827]">
                      {row.proofMaturityScore ?? "n/a"}
                    </td>
                    <td className="px-3 py-2 text-[#475467]">
                      {row.gateReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Declared against observed.
 *
 * Rendered above the command centre rather than woven into it, because these are a different kind of
 * fact from everything below: the mart's figures are metered, these are what the client told us. Two
 * numbers with different provenance shown in one row invite a reader to treat them as one measure.
 */
function TowerCanonicalPanel({
  canonical,
}: {
  canonical: Awaited<ReturnType<typeof buildTowerCanonicalReconciliation>>;
}) {
  if (!canonical) return null;
  const quotable = canonical.facts.filter((f) => f.status !== "absent");
  if (quotable.length === 0) return null;
  return (
    <section className="mb-5 rounded-md border border-[#d9ddd2] bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#111827]">
          Declared vs observed
        </h2>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#667085]">
          canonical build {canonical.buildVersion}
        </p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#475467]">
        The left column is what this client declared in their intake. The right is what Tower
        metered. A gap between them is a finding, not an error &mdash; different bases, not two
        sources disagreeing.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quotable.map((f) => (
          <div key={f.label} className="rounded border border-[#e4e7ec] bg-[#fbfcfd] p-4">
            <p className="text-sm font-semibold text-[#111827]">{f.label}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-lg tabular-nums text-[#111827]">
                {f.declaredUsd === null ? "not declared" : money(f.declaredUsd)}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#667085]">
                declared
              </span>
              <span className="font-mono text-lg tabular-nums text-[#111827]">
                {f.observedUsd === null ? "not metered" : money(f.observedUsd)}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#667085]">
                observed
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-[#667085]">
              {f.variancePct === null
                ? f.declaredBasis
                : `Variance ${f.variancePct > 0 ? "+" : ""}${f.variancePct.toFixed(1)}% \u00b7 ${f.declaredBasis}`}
            </p>
          </div>
        ))}
      </div>
      {canonical.estate.length > 0 ? (
        <p className="mt-4 text-xs text-[#667085]">
          Canonical estate:{" "}
          {canonical.estate
            .map((e) => `${e.count.toLocaleString()} ${e.label.toLowerCase()}`)
            .join(" \u00b7 ")}
        </p>
      ) : null}
    </section>
  );
}

export default async function TowerPage({ searchParams }: TowerPageProps = {}) {
  const resolved = await searchParams;
  const rawRequestedClient = firstSearchValue(resolved?.client);
  const requestedProvider = firstSearchValue(resolved?.provider);
  const productProvider = resolveEclProductProvider(requestedProvider);
  const requestedClient = (await hasLockedTenantSession())
    ? rawRequestedClient
    : null;
  const [client, tenant] = await Promise.all([
    getActiveClientRow(requestedClient).catch(() => null),
    resolveTenant({ requestedClient }).catch(() => null),
  ]);
  const effectiveClientKey = client?.key ?? tenant?.appClientKey ?? null;

  const tenantName =
    canonicalClientDisplayName({
      key: effectiveClientKey,
      name: client?.name ?? tenant?.displayName,
    }) ??
    client?.name ??
    tenant?.displayName ??
    "AbarVa Client";

  const towerView = await withTowerReadTimeout(
    readTowerCommandCenter({
      tenantKeyCandidates: [
        effectiveClientKey,
        requestedClient,
        client?.id,
        tenant?.canonicalKey,
        tenant?.brokerKey,
      ],
    }),
    null,
  );
  const commandCenterView = buildTowerCommandCenterView(towerView, {
    tenantName,
  });

  // Canonical alongside the mart, not instead of it. The mart knows what was metered; canonical
  // knows what the client declared. Neither is the whole answer and the gap between them is the
  // finding — VARIANCE under the fact-authority rules, not CONFLICT, because they are different
  // bases rather than two sources disagreeing about the same one.
  // The mart read is allowed to come back null on a timeout or a sparse tenant. Canonical is still
  // worth showing then: "the client declared this and nothing has been metered against it" is a
  // legitimate and useful state, and suppressing it would hide the declared side whenever the
  // observed side is missing — exactly when it matters most.
  const canonical = await buildTowerCanonicalReconciliation(
    canonicalTenantKey(effectiveClientKey),
    {
      budgetUsd: commandCenterView?.summary.budgetUsd ?? null,
      approvedInvestmentUsd: commandCenterView?.summary.approvedInvestmentUsd ?? null,
      promisedBenefitUsd: commandCenterView?.summary.promisedBenefitUsd ?? null,
      programCount: commandCenterView?.summary.programCount ?? null,
    },
  ).catch(() => null);
  const towerChatClientId =
    client?.id ?? effectiveClientKey ?? requestedClient ?? null;
  const towerEclPreview =
    isEclProductProvider(productProvider)
      ? await readTowerEclProjectionPreview(canonicalTenantKey(effectiveClientKey))
      : null;

  return (
    <AppShell
      surface="tower"
      topBarProps={{
        tenantName,
        preserveTenantName: true,
        showLocked: true,
        context: `Command Center · ${tenantName}`,
      }}
    >
      <Suspense fallback={null}>
        <TowerEclProjectionPanel preview={towerEclPreview} />
        {towerEclPreview ? <EclDemoFindingsPanel product="tower" /> : null}
        <TowerCanonicalPanel canonical={canonical} />
        <TowerCommandCenterAvaShell
          view={commandCenterView}
          tenantName={tenantName}
          clientId={towerChatClientId}
          refreshedOn={new Date().toISOString().slice(0, 10)}
        />
      </Suspense>
    </AppShell>
  );
}
