"use client";

/**
 * Tools -> table.
 *
 * Tool rollouts are the AI rows with usage evidence. The adoption target and the supported-case
 * count are both asserted on the source row (`adoption_target_pct`, `linked_business_case_count`);
 * this panel reads them directly. Neither is inferred, and a row that asserts neither renders as
 * absent rather than borrowing readiness, risk, or a shared vendor name.
 */

import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import {
  BLOCKER_TONE,
  controlBlockerExplanation,
  controlBlockerCell,
  formatCount,
  formatPct,
} from "@/lib/tower/command-center/format";
import type React from "react";

import styles from "../TowerCommandCenter.module.css";

type ToolRow = {
  readonly item: TowerAiView;
  readonly activeUsers: string;
  readonly adoptionPct: number | null;
  readonly targetPct: number | null;
  readonly linkedCases: number | null;
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2.2fr) minmax(0,1.5fr) 82px minmax(0,1.8fr) minmax(0,1.5fr) 64px 86px",
  gap: 14,
};

function clampPct(pct: number): number {
  return Math.max(0, Math.min(100, pct));
}

function usageMetric(item: TowerAiView) {
  return item.usageBars.find((bar) => bar.label !== "Adoption") ?? null;
}

function adoptionMetric(item: TowerAiView): number | null {
  const bar = item.usageBars.find((candidate) => candidate.label === "Adoption");
  return bar ? bar.pct : null;
}

function isToolRolloutRow(item: TowerAiView): boolean {
  return item.sourceFile === "23_ai_tool_rollout.csv";
}

function toolRows(view: TowerCommandCenterView): readonly ToolRow[] {
  return view.allInitiatives
    .filter(
      (item) =>
        isToolRolloutRow(item) &&
        (item.usageHeadline !== null || item.usageBars.length > 0),
    )
    .map((item) => {
      const usage = usageMetric(item);
      return {
        item,
        activeUsers: usage?.valueText ?? "Not loaded",
        adoptionPct: adoptionMetric(item),
        targetPct: item.adoptionTargetPct,
        linkedCases: item.linkedBusinessCaseCount,
      };
    })
    .sort((a, b) => shortfall(b) - shortfall(a));
}

/**
 * Sort by how far a rollout sits below its own target, worst first — the column's actual
 * question. A rollout with no target cannot be short of one, so it sorts below every row that
 * can be, ahead of rows carrying no adoption reading at all.
 */
function shortfall(row: ToolRow): number {
  if (row.adoptionPct === null) return -2;
  if (row.targetPct === null) return -1;
  return row.targetPct - row.adoptionPct;
}

export function ToolsTablePanel({
  view,
  onOpenAi,
}: {
  view: TowerCommandCenterView;
  onOpenAi?: (n: number) => void;
}) {
  const rows = toolRows(view);
  const withTarget = rows.filter(
    (row) => row.targetPct !== null && row.adoptionPct !== null,
  );
  const belowTarget = withTarget.filter(
    (row) => (row.adoptionPct as number) < (row.targetPct as number),
  ).length;

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
        {withTarget.length === 0
          ? `${formatCount(rows.length)} tool rollouts have usage; adoption targets are not loaded.`
          : `${formatCount(belowTarget)} of ${formatCount(withTarget.length)} rollouts sit below their own adoption target.`}
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
          <span style={{ textAlign: "right" }}>Detail</span>
        </div>
        {rows.map(({ item, activeUsers, adoptionPct, targetPct, linkedCases }) => (
          <div
            key={item.id}
            onDoubleClick={() => onOpenAi?.(item.n)}
            style={{
              ...GRID,
              alignItems: "center",
              padding: "13px 22px",
              borderBottom: "1px solid var(--canon-border)",
              color: "var(--canon-gray-900)",
            }}
            title="Double-click to open tool details"
          >
            <button
              type="button"
              className={styles.rowOpen}
              onClick={() => onOpenAi?.(item.n)}
              disabled={!onOpenAi}
              style={{ fontSize: 15, lineHeight: 1.35 }}
            >
              {item.name}
            </button>
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
                      width: `${clampPct(adoptionPct)}%`,
                      background:
                        targetPct !== null && adoptionPct >= targetPct
                          ? "var(--canon-teal-dark)"
                          : "var(--canon-amber)",
                    }}
                  />
                )}
                {targetPct === null ? null : (
                  // The target sits where it actually falls, so the gap is the thing you read.
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: `${clampPct(targetPct)}%`,
                      top: -2,
                      height: 16,
                      width: 2,
                      background: "var(--canon-gray-900)",
                    }}
                  />
                )}
              </span>
              <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 11, color: "var(--canon-gray-500)" }}>
                {adoptionPct === null ? "Not loaded" : formatPct(adoptionPct)}
                {targetPct === null ? " · no target set" : ` vs ${formatPct(targetPct)} target`}
              </span>
            </span>
            <span
              className={styles.fieldWithHelp}
              style={{ fontSize: 14, color: BLOCKER_TONE[controlBlockerCell(item).tone] }}
              title={controlBlockerExplanation(item)}
            >
              {controlBlockerCell(item).text}
              <span
                className={styles.helpBadge}
                aria-label={`Control blocker help: ${controlBlockerExplanation(item)}`}
              />
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", fontSize: 14, textAlign: "right", color: linkedCases === null ? "var(--canon-gray-500)" : "var(--canon-gray-900)" }}>
              {linkedCases === null ? "Not loaded" : formatCount(linkedCases)}
            </span>
            <span style={{ textAlign: "right" }}>
              <button
                type="button"
                className={styles.detailLink}
                onClick={() => onOpenAi?.(item.n)}
                disabled={!onOpenAi}
                aria-label={`Open detail for ${item.name}`}
              >
                Open
              </button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
