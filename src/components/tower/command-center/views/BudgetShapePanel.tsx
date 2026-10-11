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
        The IT budget shape needs source reconciliation before it can be presented.
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Run and change</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>
            {hasProjectedBudget ? "Source status not verified" : "Not loaded"}
          </p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            The Tower projection has budget fields, but this page does not carry their source
            reconciliation status. Run/change amounts and shares are withheld until the budget
            source and counting basis are verified.
          </p>
        </div>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Capex and opex</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>Not loaded</p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            The capital and operating split is absent from this view. It requires governed
            classification and lineage before the budget can be divided.
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        AI-attributed investment is a separate portfolio measure. It is not a third budget
        category or a proven share of change spend.
      </p>
    </section>
  );
}
