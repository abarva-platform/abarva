// Tower — primary route.
//
// As of 2026-07-23 this always serves the **Command Center** (the rebuilt page
// against `docs/design/tower/command-center-2026-07-23/`). The previous Tower
// page is no longer a runtime fallback.

import { Suspense } from "react";

import { AppShell } from "@/components/shell/AppShell";
import { TowerCommandCenterAvaShell } from "@/components/tower/command-center/TowerCommandCenterAvaShell";
import {
  getActiveClientRow,
  hasLockedTenantSession,
} from "@/lib/active-client";
import { canonicalClientDisplayName } from "@/lib/client-config";
import { readTowerCommandCenter } from "@/lib/tower/readTowerCommandCenter";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";
import { buildTowerCanonicalReconciliation } from "@/lib/tower/canonical-reconciliation";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

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
