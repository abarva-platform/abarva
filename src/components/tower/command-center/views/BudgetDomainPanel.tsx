"use client";

/**
 * IT budget -> domain table.
 *
 * The design renders a domain budget table with run/change/transform bars. The product view model
 * does not expose the Layer 1 domain-budget extract directly, so this panel derives a Tower-reviewed
 * domain view from the governed program rows it does carry. The bars therefore describe the reviewed
 * portfolio: no-value lines are run, value lines without usage support are change, and value lines
 * with usage support are transform.
 */

import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type React from "react";

type DomainRow = {
  readonly domain: string;
  readonly budgetUsd: number;
  readonly runUsd: number;
  readonly changeUsd: number;
  readonly transformUsd: number;
  readonly reviewedCount: number;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
};

const HEAD: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2fr) 104px minmax(0,2.5fr) 118px",
  gap: 14,
  padding: "12px 22px",
  borderBottom: "1px solid var(--canon-border-strong)",
  fontFamily: "var(--abarva-mono)",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--canon-gray-500)",
};

const ROW: React.CSSProperties = {
  ...HEAD,
  alignItems: "center",
  borderBottom: "1px solid var(--canon-border)",
  color: "var(--canon-gray-900)",
  fontFamily: "var(--abarva-sans)",
  fontSize: 15,
  letterSpacing: 0,
  textTransform: "none",
};

function segment(width: number, color: string): React.CSSProperties {
  return {
    display: "block",
    width: `${Math.max(0, Math.min(100, width))}%`,
    background: color,
  };
}

export function buildBudgetDomainRows(
  view: TowerCommandCenterView,
): readonly DomainRow[] {
  const rows = new Map<string, DomainRow>();
  for (const program of view.programs) {
    const domain = program.functionLabel ?? "Domain not loaded";
    const budgetUsd = program.fundedAmountUsd || program.fundedUsd;
    const hasValue = program.promisedBenefitLoaded && program.promisedUsd > 0;
    const hasUsage = program.usageSupportedUsd > 0 || program.usageStatus !== "none";
    const current = rows.get(domain) ?? {
      domain,
      budgetUsd: 0,
      runUsd: 0,
      changeUsd: 0,
      transformUsd: 0,
      reviewedCount: 0,
    };
    rows.set(domain, {
      domain,
      budgetUsd: current.budgetUsd + budgetUsd,
      runUsd: current.runUsd + (!hasValue ? budgetUsd : 0),
      changeUsd: current.changeUsd + (hasValue && !hasUsage ? budgetUsd : 0),
      transformUsd: current.transformUsd + (hasValue && hasUsage ? budgetUsd : 0),
      reviewedCount: current.reviewedCount + 1,
    });
  }
  return [...rows.values()].sort((a, b) => b.budgetUsd - a.budgetUsd);
}

export function BudgetDomainPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildBudgetDomainRows(view);
  const total = rows.reduce((sum, row) => sum + row.budgetUsd, 0);
  const top = rows[0];
  const topShare = top && total > 0 ? Math.round((top.budgetUsd / total) * 100) : null;

  if (rows.length === 0) {
    return (
      <section style={{ ...PANEL, padding: "24px 26px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Budget by domain
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No reviewed program rows carry a domain, so the table cannot be grouped. This is a data
          gap, not evidence that domain spend is zero.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--abarva-serif)",
          fontWeight: 500,
          fontSize: 26,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        {topShare === null
          ? "Tower-reviewed budget is grouped by loaded domains."
          : `${top.domain} holds ${topShare}% of the Tower-reviewed budget.`}
      </h2>
      <div style={PANEL}>
        <div style={HEAD}>
          <span>Domain</span>
          <span style={{ textAlign: "right" }}>Budget</span>
          <span>Run · change · transform</span>
          <span style={{ textAlign: "right" }}>Tower reviewed</span>
        </div>
        {rows.map((row) => {
          const denom = row.budgetUsd || 1;
          return (
            <div key={row.domain} style={ROW}>
              <span>{row.domain}</span>
              <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
                {formatUsdM(row.budgetUsd)}
              </span>
              <span style={{ display: "flex", height: 14, background: "var(--canon-gray-100)" }}>
                <span style={segment((row.runUsd / denom) * 100, "var(--canon-gray-300)")} />
                <span style={segment((row.changeUsd / denom) * 100, "var(--canon-amber)")} />
                <span style={segment((row.transformUsd / denom) * 100, "var(--canon-teal-dark)")} />
              </span>
              <span
                style={{
                  fontFamily: "var(--abarva-mono)",
                  textAlign: "right",
                  color: "var(--canon-gray-500)",
                }}
              >
                {formatCount(row.reviewedCount)} rows
              </span>
            </div>
          );
        })}
      </div>
      <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-500)" }}>
        Bars are computed from the reviewed program rows: no sponsor-stated value, value without
        usage support, and value with usage support. Missing rows stay out of the denominator.
      </p>
    </section>
  );
}
