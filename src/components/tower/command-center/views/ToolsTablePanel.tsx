"use client";

/**
 * Tools -> table.
 *
 * Tool rollouts are the AI rows with usage evidence. Licensed seats and adoption targets are not
 * first-class fields in `TowerAiView` yet, so those cells render as absent instead of borrowing
 * readiness or risk.
 */

import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount, formatPct } from "@/lib/tower/command-center/format";
import type React from "react";

type ToolRow = {
  readonly item: TowerAiView;
  readonly activeUsers: string;
  readonly adoptionPct: number | null;
  readonly linkedCases: number;
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.5fr) 82px minmax(0,1.8fr) minmax(0,1.5fr) 64px",
  gap: 14,
};

function usageMetric(item: TowerAiView) {
  return item.usageBars.find((bar) => bar.label !== "Adoption") ?? null;
}

function adoptionMetric(item: TowerAiView): number | null {
  const bar = item.usageBars.find((candidate) => candidate.label === "Adoption");
  return bar ? bar.pct : null;
}

function toolRows(view: TowerCommandCenterView): readonly ToolRow[] {
  return view.allInitiatives
    .filter((item) => item.usageHeadline !== null || item.usageBars.length > 0)
    .map((item) => {
      const usage = usageMetric(item);
      return {
        item,
        activeUsers: usage?.valueText ?? "Not loaded",
        adoptionPct: adoptionMetric(item),
        linkedCases: view.allInitiatives.filter(
          (other) =>
            other.id !== item.id &&
            other.promisedBenefitLoaded &&
            other.promisedUsd > 0 &&
            ((item.system && other.system === item.system) ||
              (item.vendor && other.vendor === item.vendor)),
        ).length,
      };
    })
    .sort((a, b) => (b.adoptionPct ?? -1) - (a.adoptionPct ?? -1));
}

export function ToolsTablePanel({ view }: { view: TowerCommandCenterView }) {
  const rows = toolRows(view);
  const loadedTargets = 0;
  const belowTarget = 0;

  if (rows.length === 0) {
    return (
      <section style={{ background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)", padding: "24px 26px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>Tool rollouts</h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No tool rollout carries usage evidence in this view. That is a tracking gap, not proof of
          no adoption.
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
        {loadedTargets > 0
          ? `${belowTarget} of ${loadedTargets} rollouts sit below their own adoption target.`
          : `${formatCount(rows.length)} tool rollouts have usage; adoption targets are not loaded.`}
      </h2>
      <div style={{ background: "var(--canon-bg-surface)", border: "1px solid var(--canon-border)" }}>
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
          <span>Tool</span>
          <span>Vendor</span>
          <span style={{ textAlign: "right" }}>Users</span>
          <span>Adoption vs target</span>
          <span>Control blocker</span>
          <span style={{ textAlign: "right" }}>Cases</span>
        </div>
        {rows.map(({ item, activeUsers, adoptionPct, linkedCases }) => (
          <div
            key={item.id}
            style={{
              ...GRID,
              alignItems: "center",
              padding: "13px 22px",
              borderBottom: "1px solid var(--canon-border)",
              color: "var(--canon-gray-900)",
            }}
          >
            <span style={{ fontSize: 15, lineHeight: 1.35 }}>{item.name}</span>
            <span style={{ fontSize: 14, color: "var(--canon-gray-500)", minWidth: 0 }}>
              {item.vendor ?? "Not loaded"}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 14, textAlign: "right" }}>
              {activeUsers}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <span style={{ position: "relative", height: 12, background: "var(--canon-gray-100)" }}>
                {adoptionPct === null ? null : (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: 12,
                      width: `${Math.max(0, Math.min(100, adoptionPct))}%`,
                      background: "var(--canon-amber)",
                    }}
                  />
                )}
              </span>
              <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 11, color: "var(--canon-gray-500)" }}>
                {adoptionPct === null ? "Not loaded" : formatPct(adoptionPct)} vs Not loaded
              </span>
            </span>
            <span style={{ fontSize: 14, color: item.controlBlocker ? "var(--canon-red)" : "var(--canon-gray-500)" }}>
              {item.controlBlocker ?? "Not loaded"}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 14, textAlign: "right", color: linkedCases > 0 ? "var(--canon-gray-900)" : "var(--canon-gray-500)" }}>
              {linkedCases > 0 ? formatCount(linkedCases) : "Not loaded"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
