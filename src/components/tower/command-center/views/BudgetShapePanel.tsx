"use client";

import type React from "react";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

export function BudgetShapePanel({ view }: { view: TowerCommandCenterView }) {
  const hasProjectedBudget = view.summary.budgetUsd !== null ||
    view.summary.runUsd !== null || view.summary.changeUsd !== null;

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
        We cannot show how the IT budget is split until its total is verified from the source files.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Keeping things running vs new work</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>
            {hasProjectedBudget ? "Needs a source check" : "Not loaded"}
          </p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            Budget fields are present, but they have not been matched to the current source files.
            The split stays hidden until the totals and what they include are confirmed.
          </p>
        </div>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Upfront purchases vs ongoing costs</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>Not loaded</p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            This split is not loaded. Each amount needs a clear source and a consistent
            accounting category before it can be shown.
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        Approved AI case funding belongs within approved project funding. It is not an
        extra budget category, and this view cannot calculate its share of the total IT budget.
      </p>
    </section>
  );
}
