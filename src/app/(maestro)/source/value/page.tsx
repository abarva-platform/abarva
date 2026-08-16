import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { SentinelAgentColumn } from "@/components/source/SentinelAgentColumn";
import { SourceWorkingPane } from "@/components/source/SourceWorkingPane";
import { SourceValueLedger } from "@/components/source/SourceValueLedger";
import { getSourceValueLedger } from "@/lib/source/queries";
import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy } from "@/lib/auth/tenancy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { redactSourceFinancialText } from "@/lib/source/financial-display";
import { canonicalClientDisplayName } from "@/lib/client-config";
import type { SourceValueLedgerSnapshot } from "@/lib/source/types";
import {
  loadSourceV4WorkspaceSnapshot,
  type SourceV4WorkspaceSnapshot,
} from "@/lib/source/data-model/source-v4-workspace-snapshot";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

function emptySourceValueLedgerSnapshot(): SourceValueLedgerSnapshot {
  return {
    updatedAt: "temporarily unavailable",
    projected: [],
    realized: [],
  };
}

async function loadSourceValueLedgerSnapshot(): Promise<{
  snapshot: SourceValueLedgerSnapshot;
  isDegraded: boolean;
}> {
  return getSourceValueLedger()
    .then((snapshot) => ({ snapshot, isDegraded: false }))
    .catch(() => ({
      snapshot: emptySourceValueLedgerSnapshot(),
      isDegraded: true,
    }));
}

export default async function SourceValuePage() {
  const [ledger, activeClient, tenancy] = await Promise.all([
    loadSourceValueLedgerSnapshot(),
    getActiveClientRow().catch(() => null),
    requireTenancy().catch(() => null),
  ]);
  const governedSnapshot = activeClient?.key
    ? await loadSourceV4WorkspaceSnapshot(activeClient.key).catch(() => null)
    : null;
  const sourceAccessPolicy =
    activeClient && tenancy
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
        }).catch(() => null)
      : null;
  const canViewFinancialValues =
    sourceAccessPolicy?.canViewFinancialData === true;
  const activeClientDisplayName =
    canonicalClientDisplayName({
      key: activeClient?.key,
      name: activeClient?.name,
    }) ?? "AbarVa Client";
  const quote = redactSourceFinancialText(
    governedSnapshot && governedSnapshot.contextCoverage.contracts > 0
      ? `Governed Source L4 annual contract base: ${formatCompactUsd(governedSnapshot.contextCoverage.annualValue)} across ${governedSnapshot.contextCoverage.contracts} contracts and ${governedSnapshot.contextCoverage.vendors} vendors. Seeded value ledger remains separate.`
      : "$2.1M sourcing-attributed value confirmed · $890K asserted by vendors, pending audit. AMS contributes $1.4M of confirmed total.",
    canViewFinancialValues,
  );

  return (
    <AppShell
      surface="source"
      topBarProps={{
        tenantName: activeClientDisplayName,
        showLocked: true,
        context: "Source · Value ledger",
      }}
      subNav={<SourceSubNav />}
    >
      <main
        data-testid="source-value-layout"
        style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}
      >
        <SentinelAgentColumn
          quote={quote}
          agentContext={`Value ledger review · ${activeClientDisplayName}`}
          actions={[
            {
              letter: "A",
              text: "Show assumptions",
              detail: "Value projections and their evidence basis",
            },
            {
              letter: "B",
              text: "Show evidence gaps",
              detail: "Value claims missing audit confirmation",
            },
            {
              letter: "C",
              text: "Explain value confidence",
              detail: "Confidence breakdown by source and tier",
            },
          ]}
        />
        <SourceWorkingPane>
          {governedSnapshot ? (
            <GovernedSourceValueSummary
              snapshot={governedSnapshot}
              canViewFinancialValues={canViewFinancialValues}
            />
          ) : null}
          <SourceValueLedger
            snapshot={ledger.snapshot}
            canViewFinancialValues={canViewFinancialValues}
            isDegraded={ledger.isDegraded}
          />
        </SourceWorkingPane>
      </main>
    </AppShell>
  );
}

function formatCompactUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "$0";
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(1)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${Math.round(usd / 1_000)}k`;
  return `$${usd}`;
}

function GovernedSourceValueSummary({
  snapshot,
  canViewFinancialValues,
}: {
  snapshot: SourceV4WorkspaceSnapshot;
  canViewFinancialValues: boolean;
}) {
  const annualValue = canViewFinancialValues
    ? formatCompactUsd(snapshot.contextCoverage.annualValue)
    : "Restricted";
  return (
    <section
      aria-label="Governed Source L4 value basis"
      style={L4_SUMMARY_CARD}
    >
      <div style={L4_EYEBROW}>Governed Source L4 / cube basis</div>
      <div style={L4_GRID}>
        <L4Metric label="Annual contract base" value={annualValue} />
        <L4Metric
          label="Contracts"
          value={String(snapshot.contextCoverage.contracts)}
        />
        <L4Metric
          label="Vendors"
          value={String(snapshot.contextCoverage.vendors)}
        />
        <L4Metric
          label="Application scope"
          value={String(snapshot.contextCoverage.scopeRows)}
        />
      </div>
      <p style={L4_NOTE}>
        This panel reads governed Source projections. The value ledger below is
        event-scoped and remains labelled as seeded until realized value rows
        are loaded into the governed layer. Load run:{" "}
        {snapshot.activeLoadRunId ?? "not established"}.
      </p>
    </section>
  );
}

function L4Metric({ label, value }: { label: string; value: string }) {
  return (
    <article style={L4_METRIC}>
      <div style={L4_LABEL}>{label}</div>
      <div style={L4_VALUE}>{value}</div>
    </article>
  );
}

const L4_SUMMARY_CARD: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E6E1",
  borderRadius: 10,
  padding: "16px 18px",
  display: "grid",
  gap: 14,
};

const L4_EYEBROW: CSSProperties = {
  fontFamily:
    "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#576074",
};

const L4_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const L4_METRIC: CSSProperties = {
  border: "1px solid #ECE9E2",
  borderRadius: 8,
  background: "#FAF9F5",
  padding: "12px 14px",
  display: "grid",
  gap: 6,
};

const L4_LABEL: CSSProperties = {
  fontFamily:
    "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#576074",
};

const L4_VALUE: CSSProperties = {
  fontFamily: "var(--font-serif), Georgia, serif",
  fontSize: 26,
  lineHeight: 1,
  color: "#121B2D",
};

const L4_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--font-sans), Inter, system-ui, sans-serif",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#576074",
};
