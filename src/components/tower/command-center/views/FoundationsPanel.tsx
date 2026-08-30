"use client";

/**
 * Foundations.
 *
 * Foundation rows are identified from governed portfolio fields. The panel only says they carry no
 * direct value when the loaded rows actually support that statement.
 */

import type React from "react";

import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import {
  BLOCKER_TONE,
  controlBlockerCell,
  formatCount,
  formatPct,
  formatUsdM,
} from "@/lib/tower/command-center/format";

type FoundationRow = {
  readonly item: TowerAiView;
  readonly valueLabel: string;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2.4fr) minmax(0,1.4fr) 112px 132px minmax(0,1.6fr)",
  gap: 14,
};

function isFoundation(item: TowerAiView): boolean {
  const text = `${item.kind} ${item.displayBucket} ${item.category ?? ""} ${item.name}`;
  return item.kind === "platform" || item.kind === "governance" || /foundation|platform|governance/i.test(text);
}

function totalAiSpend(view: TowerCommandCenterView): number {
  return view.allInitiatives.reduce((sum, item) => sum + item.aiSpendUsd, 0);
}

function foundationRows(view: TowerCommandCenterView): readonly FoundationRow[] {
  return view.allInitiatives
    .filter(isFoundation)
    .map((item) => ({
      item,
      valueLabel: item.promisedBenefitLoaded ? formatUsdM(item.promisedUsd) : "Not loaded",
    }))
    .sort((a, b) => b.item.aiSpendUsd - a.item.aiSpendUsd);
}

function costRange(item: TowerAiView): string {
  if (item.costToBuildLowUsd === null && item.costToBuildHighUsd === null) return "Not loaded";
  if (item.costToBuildLowUsd !== null && item.costToBuildHighUsd !== null) {
    if (item.costToBuildLowUsd === item.costToBuildHighUsd) return formatUsdM(item.costToBuildLowUsd);
    return `${formatUsdM(item.costToBuildLowUsd)}–${formatUsdM(item.costToBuildHighUsd)}`;
  }
  // Exactly one bound is known. Rendering it bare made an upper bound indistinguishable from a
  // point estimate: "$20.2M" reads as what the build costs, when it means at most that. Naming
  // the bound keeps the one thing the source actually recorded.
  if (item.costToBuildLowUsd !== null) {
    return `from ${formatUsdM(item.costToBuildLowUsd)}`;
  }
  return `up to ${formatUsdM(item.costToBuildHighUsd as number)}`;
}

export function FoundationsPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = foundationRows(view);
  const spendUsd = rows.reduce((sum, row) => sum + row.item.aiSpendUsd, 0);
  const loadedValueRows = rows.filter((row) => row.item.promisedBenefitLoaded);
  const promisedUsd = loadedValueRows.reduce((sum, row) => sum + row.item.promisedUsd, 0);
  const missingValueRows = rows.length - loadedValueRows.length;
  const share = totalAiSpend(view) > 0 ? Math.round((spendUsd / totalAiSpend(view)) * 100) : null;
  const allLoadedValuesAreZero = loadedValueRows.length > 0 && missingValueRows === 0 && promisedUsd === 0;
  const noRows = rows.length === 0;

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
        {noRows
          ? "No foundation rows are loaded in the AI portfolio."
          : allLoadedValuesAreZero
            ? `${formatUsdM(spendUsd)} of foundation investment carries no sponsor-stated value.`
            : missingValueRows > 0
              ? `${formatCount(missingValueRows)} foundation rows have no sponsor-stated value loaded.`
              : `${formatUsdM(spendUsd)} of foundation investment carries ${formatUsdM(promisedUsd)} sponsor-stated value.`}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 1 }}>
        {[
          ["Foundation rows", noRows ? "Not loaded" : formatCount(rows.length)],
          ["Investment", noRows ? "Not loaded" : formatUsdM(spendUsd)],
          ["AI spend share", share === null ? "Not loaded" : formatPct(share)],
          ["Sponsor-stated value", loadedValueRows.length === 0 ? "Not loaded" : formatUsdM(promisedUsd)],
        ].map(([label, value]) => (
          <div key={label} style={{ ...PANEL, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, color: "var(--canon-gray-500)" }}>{label}</div>
            <div
              style={{
                marginTop: 7,
                fontFamily: "var(--abarva-serif)",
                fontSize: 30,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={PANEL}>
        <div
          style={{
            ...GRID,
            padding: "12px 22px",
            borderBottom: "1px solid var(--canon-border-strong)",
            fontFamily: "var(--abarva-mono)",
            fontSize: 10,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--canon-gray-500)",
          }}
        >
          <span>Foundation</span>
          <span>Type</span>
          <span style={{ textAlign: "right" }}>Investment</span>
          <span style={{ textAlign: "right" }}>Cost to build</span>
          <span>Control blocker</span>
        </div>
        {rows.length === 0 ? (
          <p style={{ margin: 0, padding: "18px 22px", fontSize: 15, color: "var(--canon-gray-700)" }}>
            No rows match platform, governance, or foundation classification.
          </p>
        ) : (
          rows.map(({ item, valueLabel }) => (
            <div
              key={item.id}
              style={{
                ...GRID,
                alignItems: "center",
                padding: "14px 22px",
                borderBottom: "1px solid var(--canon-border)",
                color: "var(--canon-gray-900)",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 16, lineHeight: 1.35 }}>{item.name}</span>
                <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--canon-gray-500)" }}>
                  {item.id} · value {valueLabel}
                </span>
              </span>
              <span style={{ color: "var(--canon-gray-500)" }}>{item.category ?? item.kind}</span>
              <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
                {formatUsdM(item.aiSpendUsd)}
              </span>
              <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
                {costRange(item)}
              </span>
              <span style={{ color: BLOCKER_TONE[controlBlockerCell(item).tone] }}>
                {controlBlockerCell(item).text}
              </span>
            </div>
          ))
        )}
      </div>

      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        {allLoadedValuesAreZero
          ? "These rows are loaded as foundations, not direct value claims. Their value depends on linked use cases proving outcomes later."
          : "Some foundation rows carry sponsor-stated value or missing value fields, so this panel does not call the foundation portfolio no-value by default."}
      </p>
    </section>
  );
}
