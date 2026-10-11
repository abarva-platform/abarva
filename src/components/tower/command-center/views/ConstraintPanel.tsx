"use client";

import type React from "react";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { isBusinessCase, unclassifiedPortfolioCount } from "./portfolio-kind";

type ConstraintRow = {
  readonly name: string;
  readonly value: number;
  readonly label: string;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

export function buildConstraintRows(view: TowerCommandCenterView): readonly ConstraintRow[] {
  const counts = new Map<string, number>();
  for (const item of view.allInitiatives) {
    if (!isBusinessCase(item) || !item.gatingConstraint) continue;
    counts.set(item.gatingConstraint, (counts.get(item.gatingConstraint) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value, label: `${value} ${value === 1 ? "case" : "cases"}` }))
    .sort((a, b) => b.value - a.value);
}

export function ConstraintPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildConstraintRows(view);
  const caseCount = view.allInitiatives.filter(isBusinessCase).length;
  const recordedCount = rows.reduce((sum, row) => sum + row.value, 0);
  const missingCount = caseCount - recordedCount;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
        {recordedCount} of {caseCount} business cases have a recorded gating constraint.
      </h2>
      <div style={PANEL}>
        <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 600 }}>What is holding them back</h3>
        {rows.length === 0 ? (
          <p style={{ margin: 0 }}>No case carries a gating constraint in this read. This is a gap in the projection, not a portfolio without blockers.</p>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {rows.map((row) => (
              <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(120px, 2fr) 90px", alignItems: "center", gap: 12 }}>
                <span>{row.name}</span>
                <span style={{ height: 12, background: "var(--canon-gray-100)" }}>
                  <span style={{ display: "block", width: `${(row.value / Math.max(recordedCount, 1)) * 100}%`, height: "100%", background: "var(--canon-amber)" }} />
                </span>
                <span style={{ textAlign: "right", fontFamily: "var(--abarva-mono)" }}>{row.label}</span>
              </div>
            ))}
          </div>
        )}
        <p style={{ margin: "20px 0 0", paddingTop: 16, borderTop: "1px solid var(--canon-border)", lineHeight: 1.6 }}>
          {missingCount} cases have no constraint recorded. These labels come from the case review; they do not independently establish a cause of delayed value. Use the evidence and Finance review for each case before assigning a blocker or owner.
          {" "}{unclassifiedPortfolioCount(view.allInitiatives)} portfolio rows have no recognized case or rollout source-template marker and are excluded from this count.
        </p>
      </div>
    </section>
  );
}
