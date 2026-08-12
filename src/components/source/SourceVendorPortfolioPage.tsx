"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Vendor & Contract Portfolio — first slice of the new cross-domain Source
// data model (source.contract_vendor_360, tenant-scoped). Section 2 of the
// recommended 8-section Source workspace restructure.
//
// Honesty: every number renders from buildVendorPortfolioView, which is a
// pure function over rows this component received as props. No number here
// is invented or estimated in the component itself — if the read returned
// zero rows (schema not migrated in this environment yet, or tenant has no
// data), the empty state renders honestly rather than a fabricated stat.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { SourceSubNav } from "@/components/source/SourceSubNav";
import { ANALYTICS } from "@/components/source/canvas/analytics/analytics-tokens";
import {
  buildVendorPortfolioView,
  formatPct,
  formatUsdCompact,
} from "@/lib/source/data-model/vendor-portfolio-view";
import type { SourceContractVendor360Row } from "@/lib/source/data-model/types";

interface SourceVendorPortfolioPageProps {
  rows: readonly SourceContractVendor360Row[];
  tenantName: string;
  asOfDateIso: string;
}

export function SourceVendorPortfolioPage({
  rows,
  tenantName,
  asOfDateIso,
}: SourceVendorPortfolioPageProps) {
  const view = useMemo(
    () => buildVendorPortfolioView(rows, asOfDateIso),
    [rows, asOfDateIso],
  );

  return (
    <AppShell
      surface="source"
      agentName="Ava"
      surfaceContext={{
        sourceVendorPortfolioMode: true,
        contractCount: view.rowCount,
      }}
      topBarProps={{
        tenantName,
        showLocked: true,
        context: `Source · Vendor & Contract Portfolio`,
      }}
      subNav={<SourceSubNav />}
    >
      <main data-testid="source-vendor-portfolio" style={MAIN_STYLE}>
        <div style={CONTAINER_STYLE}>
          <Header tenantName={tenantName} asOfDateIso={asOfDateIso} />
          {view.isEmpty ? (
            <EmptyState />
          ) : (
            <>
              <StatCardRow cards={view.statCards} />
              <BodyGrid view={view} />
              <ContractsTable contracts={view.contracts} />
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}

function Header({
  tenantName,
  asOfDateIso,
}: {
  tenantName: string;
  asOfDateIso: string;
}) {
  const asOfDisplay = new Date(asOfDateIso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <header style={HEADER_STYLE}>
      <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
        <div style={EYEBROW_STYLE}>
          Source · Vendor &amp; Contract Portfolio
        </div>
        <h1 style={H1_STYLE}>
          Where are concentration, renewal, and lock-in risks?
        </h1>
        <p style={SUBLINE_STYLE}>
          Across {tenantName}&rsquo;s reconciled vendor register, as of{" "}
          {asOfDisplay}.
        </p>
      </div>
      <Link
        href="/source/sourcing-opportunities"
        style={{
          fontFamily: ANALYTICS.SANS,
          fontSize: 13,
          color: ANALYTICS.MUTED,
          whiteSpace: "nowrap",
        }}
      >
        Sourcing opportunities &rarr;
      </Link>
    </header>
  );
}

function EmptyState() {
  return (
    <div style={EMPTY_STYLE} data-testid="source-vendor-portfolio-empty">
      <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
        No vendor/contract rows are available for this tenant yet — either the
        <code style={CODE_STYLE}> source.contract_vendor_360</code> read model
        hasn&rsquo;t been populated for this tenant, or it isn&rsquo;t reachable
        from this environment. Nothing is estimated in its place.
      </p>
    </div>
  );
}

function StatCardRow({
  cards,
}: {
  cards: readonly { key: string; label: string; value: string; sub: string }[];
}) {
  return (
    <section aria-label="Portfolio headline metrics" style={STAT_ROW_STYLE}>
      {cards.map((card) => (
        <div key={card.key} style={STAT_CARD_STYLE}>
          <div style={STAT_LABEL_STYLE}>{card.label}</div>
          <div style={STAT_VALUE_STYLE}>{card.value}</div>
          <div style={{ ...STAT_SUB_STYLE, color: ANALYTICS.MUTED }}>
            {card.sub}
          </div>
        </div>
      ))}
    </section>
  );
}

function BodyGrid({
  view,
}: {
  view: ReturnType<typeof buildVendorPortfolioView>;
}) {
  return (
    <div style={BODY_GRID_STYLE}>
      <ConcentrationTable rows={view.concentration.slice(0, 10)} />
      <div style={{ display: "grid", gap: 20 }}>
        <RenewalPanel view={view} />
        <LeveragePanel entries={view.highPriorityLeverage} />
      </div>
    </div>
  );
}

function ConcentrationTable({
  rows,
}: {
  rows: ReturnType<typeof buildVendorPortfolioView>["concentration"];
}) {
  return (
    <section style={PANEL_STYLE} aria-label="Vendor concentration">
      <div style={SECTION_HEAD_STYLE}>Top 10 vendors by annual value</div>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Vendor</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Annual value</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Share</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.vendorRef}
              style={i % 2 === 1 ? { background: ANALYTICS.SOFT } : undefined}
            >
              <td style={TD_STYLE}>{row.vendorName}</td>
              <td
                style={{
                  ...TD_STYLE,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatUsdCompact(row.annualValue)}
              </td>
              <td
                style={{
                  ...TD_STYLE,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatPct(row.shareOfTotal)}
              </td>
              <td
                style={{
                  ...TD_STYLE,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  color: ANALYTICS.MUTED,
                }}
              >
                {formatPct(row.cumulativeShare)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function RenewalPanel({
  view,
}: {
  view: ReturnType<typeof buildVendorPortfolioView>;
}) {
  const { renewal } = view;
  return (
    <section style={PANEL_STYLE} aria-label="Renewal exposure">
      <div style={SECTION_HEAD_STYLE}>Renewal posture</div>
      <p style={{ ...SUBLINE_STYLE, margin: 0 }}>
        {renewal.expiringWithinWindow.length} contracts (
        {formatUsdCompact(renewal.expiringWithinWindowAnnualValue)} annually)
        expire within 180 days of the as-of date.
      </p>
      {renewal.noticeDeadlinePassed.length > 0 ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.RUST }}>
          {renewal.noticeDeadlinePassed.length} still-active contracts (
          {formatUsdCompact(renewal.noticeDeadlinePassedAnnualValue)}) already
          passed their contractual notice deadline —{" "}
          {renewal.noticeDeadlinePassedAutoRenew.length} of those are auto-renew
          ({formatUsdCompact(renewal.noticeDeadlinePassedAutoRenewAnnualValue)}
          ). Commercial optionality may already be lost on these.
        </p>
      ) : null}
    </section>
  );
}

function LeveragePanel({
  entries,
}: {
  entries: ReturnType<typeof buildVendorPortfolioView>["highPriorityLeverage"];
}) {
  return (
    <section
      style={PANEL_STYLE}
      aria-label="High-priority sourcing interventions"
    >
      <div style={SECTION_HEAD_STYLE}>High-priority sourcing interventions</div>
      <p style={{ ...SUBLINE_STYLE, margin: "0 0 12px" }}>
        High spend, plus two or more weak-leverage signals (no/limited
        benchmarking, limited alternatives, specialized-skill or regional
        dependency).
      </p>
      {entries.length === 0 ? (
        <p style={{ ...SUBLINE_STYLE, margin: 0, color: ANALYTICS.MUTED }}>
          None flagged.
        </p>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "grid",
            gap: 8,
          }}
        >
          {entries.slice(0, 8).map((entry) => (
            <li key={entry.contractId} style={LEVERAGE_ROW_STYLE}>
              <span>{entry.vendorName}</span>
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  color: ANALYTICS.MUTED,
                }}
              >
                {formatUsdCompact(entry.annualValue)} · {entry.weakSignalCount}{" "}
                weak signals
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ContractsTable({
  contracts,
}: {
  contracts: ReturnType<typeof buildVendorPortfolioView>["contracts"];
}) {
  return (
    <section style={PANEL_STYLE} aria-label="All contracts">
      <div style={SECTION_HEAD_STYLE}>All contracts ({contracts.length})</div>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            <th style={TH_STYLE}>Contract</th>
            <th style={TH_STYLE}>Vendor</th>
            <th style={{ ...TH_STYLE, textAlign: "right" }}>Annual value</th>
            <th style={TH_STYLE}>End date</th>
            <th style={TH_STYLE}>Auto-renew</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c, i) => (
            <tr
              key={c.contractId}
              style={i % 2 === 1 ? { background: ANALYTICS.SOFT } : undefined}
            >
              <td style={TD_STYLE}>
                <Link
                  href={`/source/preview/workspace?contractId=${encodeURIComponent(c.contractId)}`}
                  style={{ color: ANALYTICS.INK, textDecoration: "underline" }}
                >
                  {c.contractName}
                </Link>
              </td>
              <td style={TD_STYLE}>{c.vendorName}</td>
              <td
                style={{
                  ...TD_STYLE,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatUsdCompact(c.annualValue)}
              </td>
              <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                {c.endDate
                  ? new Date(c.endDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
              <td style={{ ...TD_STYLE, color: ANALYTICS.MUTED }}>
                {c.autoRenew ? "Yes" : "No"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const MAIN_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  background: ANALYTICS.PAGE_BG,
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  padding: "28px 32px 64px",
  display: "grid",
  gap: 28,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 24,
  flexWrap: "wrap",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
};

const H1_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 34,
  fontWeight: 400,
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  color: ANALYTICS.INK,
  margin: 0,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: ANALYTICS.SANS,
  fontSize: 14,
  lineHeight: 1.5,
  color: ANALYTICS.MUTED,
  maxWidth: 720,
};

const STAT_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const STAT_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "16px 18px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  minWidth: 0,
};

const STAT_LABEL_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 10,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  fontWeight: 700,
};

const STAT_VALUE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 30,
  fontWeight: 400,
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  fontVariantNumeric: "tabular-nums",
  color: ANALYTICS.INK,
};

const STAT_SUB_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
};

const BODY_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 340px",
  gap: 28,
  alignItems: "start",
};

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  padding: "18px 20px",
  border: `1px solid ${ANALYTICS.LINE}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
  boxShadow: ANALYTICS.SHADOW_SM,
  minWidth: 0,
};

const SECTION_HEAD_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.SERIF,
  fontSize: 17,
  fontWeight: 500,
  color: ANALYTICS.INK,
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontFamily: ANALYTICS.SANS,
  fontSize: 13,
};

const TH_STYLE: CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: ANALYTICS.FAINT,
  borderBottom: `1px solid ${ANALYTICS.LINE_STRONG}`,
};

const TD_STYLE: CSSProperties = {
  padding: "7px 8px",
  color: ANALYTICS.INK,
  borderBottom: `1px solid ${ANALYTICS.LINE}`,
};

const LEVERAGE_ROW_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontSize: 13,
  fontFamily: ANALYTICS.SANS,
  padding: "4px 0",
};

const EMPTY_STYLE: CSSProperties = {
  padding: "24px 20px",
  border: `1px dashed ${ANALYTICS.LINE_STRONG}`,
  borderRadius: ANALYTICS.RADIUS,
  background: ANALYTICS.CARD,
};

const CODE_STYLE: CSSProperties = {
  fontFamily: ANALYTICS.MONO,
  fontSize: 12,
  background: ANALYTICS.SOFT,
  padding: "1px 5px",
  borderRadius: 4,
};
