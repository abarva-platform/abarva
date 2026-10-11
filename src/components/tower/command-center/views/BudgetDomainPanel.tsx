"use client";

/**
 * Reviewed programs -> domain table.
 *
 * Counts Tower-reviewed programs by their loaded function label. Funding figures stay withheld
 * until the projection exposes their reconciliation state.
 */

import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount } from "@/lib/tower/command-center/format";
import type React from "react";

type DomainRow = {
  readonly domain: string;
  readonly reviewedCount: number;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
};

const HEAD: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2fr) 180px 150px",
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

export function buildBudgetDomainRows(
  view: TowerCommandCenterView,
): readonly DomainRow[] {
  const rows = new Map<string, DomainRow>();
  for (const program of view.programs) {
    const domain = program.functionLabel ?? "Domain not loaded";
    const current = rows.get(domain) ?? {
      domain,
      reviewedCount: 0,
    };
    rows.set(domain, {
      domain,
      reviewedCount: current.reviewedCount + 1,
    });
  }
  return [...rows.values()].sort((a, b) => b.reviewedCount - a.reviewedCount);
}

export function BudgetDomainPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildBudgetDomainRows(view);

  if (rows.length === 0) {
    return (
      <section style={{ ...PANEL, padding: "24px 26px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Reviewed program funding by domain
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No reviewed program rows are loaded. Domain funding and the full IT budget split are
          unknown in this view.
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
        {rows.reduce((sum, row) => sum + row.reviewedCount, 0)} reviewed programs are grouped by their loaded domain.
      </h2>
      <div style={PANEL}>
        <div style={HEAD}>
          <span>Program domain</span>
          <span style={{ textAlign: "right" }}>Funding</span>
          <span style={{ textAlign: "right" }}>Programs</span>
        </div>
        {rows.map((row) => {
          return (
            <div key={row.domain} style={ROW}>
              <span>{row.domain}</span>
              <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
                Source status pending
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
        The domain labels and program counts are available. Funding amounts are withheld until
        source reconciliation is exposed on this view. A domain-level run/change/transform split
        is not loaded.
      </p>
    </section>
  );
}
