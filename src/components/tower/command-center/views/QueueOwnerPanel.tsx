"use client";

/**
 * Decisions -> owner.
 *
 * Groups business cases by loaded sponsor role. Open proof items are derived from finance status
 * and value-loading state, not from the design's static counts.
 *
 * Cases only. A tool rollout carries a business owner too, but it has no investment, no
 * sponsor-stated value, and no finance status — so under a column headed CASES it added a row
 * that contributed nothing but the count, and `hasOpenProof` returned true for every one of them
 * because a rollout never carries a benefit claim. Thirteen rollouts turned a 42-case portfolio
 * into 55 and a 34-item queue into 47.
 *
 * `financeStatus` is written on case payloads only, so its presence is what separates the two
 * populations.
 */

import type React from "react";

import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";

type OwnerRow = {
  readonly owner: string;
  readonly count: number;
  readonly investmentUsd: number;
  readonly valueUsd: number;
  readonly valueLoadedCount: number;
  readonly openProofItems: number;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
};

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2.2fr) 86px 116px 132px 132px",
  gap: 14,
};

function hasOpenProof(item: TowerAiView): boolean {
  if (!item.promisedBenefitLoaded) return true;
  if (item.promisedUsd > 0 && item.financeValidatedUsd <= 0) return true;
  return item.financeStatus !== "finance_validated_actual";
}

export function buildQueueOwnerRows(view: TowerCommandCenterView): readonly OwnerRow[] {
  const rows = new Map<string, OwnerRow>();
  for (const item of view.allInitiatives) {
    if (item.financeStatus === null) continue;
    const owner = item.sponsorRole ?? "Sponsor not loaded";
    const current = rows.get(owner) ?? {
      owner,
      count: 0,
      investmentUsd: 0,
      valueUsd: 0,
      valueLoadedCount: 0,
      openProofItems: 0,
    };
    rows.set(owner, {
      owner,
      count: current.count + 1,
      investmentUsd: current.investmentUsd + item.aiSpendUsd,
      valueUsd: current.valueUsd + (item.promisedBenefitLoaded ? item.promisedUsd : 0),
      valueLoadedCount: current.valueLoadedCount + (item.promisedBenefitLoaded ? 1 : 0),
      openProofItems: current.openProofItems + (hasOpenProof(item) ? 1 : 0),
    });
  }
  return [...rows.values()].sort((a, b) => b.openProofItems - a.openProofItems || b.investmentUsd - a.investmentUsd);
}

function valueLabel(row: OwnerRow): string {
  return row.valueLoadedCount === 0 ? "Not loaded" : formatUsdM(row.valueUsd);
}

export function QueueOwnerPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildQueueOwnerRows(view);
  // The denominator has to be the same population the rows are built from.
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const missingOwners = rows.find((row) => row.owner === "Sponsor not loaded")?.count ?? 0;
  const top = rows[0];
  const totalOpen = rows.reduce((sum, row) => sum + row.openProofItems, 0);

  if (rows.length === 0) {
    return (
      <section style={{ ...PANEL, padding: "24px 26px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Decisions by owner
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No business cases are loaded, so Tower cannot assign a decision queue.
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
        {missingOwners > 0
          ? `${formatCount(missingOwners)} of ${formatCount(total)} cases have no sponsor loaded.`
          : totalOpen > 0
            ? `${top.owner} owns the largest open proof queue.`
            : "No open proof queue is derived from the loaded owner view."}
      </h2>
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
          <span>Sponsor</span>
          <span style={{ textAlign: "right" }}>Cases</span>
          <span style={{ textAlign: "right" }}>Investment</span>
          <span style={{ textAlign: "right" }}>Sponsor-stated</span>
          <span style={{ textAlign: "right" }}>Open proof items</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.owner}
            style={{
              ...GRID,
              alignItems: "center",
              padding: "14px 22px",
              borderBottom: "1px solid var(--canon-border)",
              color: "var(--canon-gray-900)",
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1.35 }}>{row.owner}</span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
              {formatCount(row.count)}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
              {formatUsdM(row.investmentUsd)}
            </span>
            <span style={{ fontFamily: "var(--abarva-mono)", textAlign: "right" }}>
              {valueLabel(row)}
            </span>
            <span
              style={{
                fontFamily: "var(--abarva-mono)",
                textAlign: "right",
                color: row.openProofItems > 0 ? "var(--canon-red)" : "var(--canon-teal-dark)",
              }}
            >
              {formatCount(row.openProofItems)}
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        Open proof items are derived from loaded finance status and sponsor-stated value fields.
        They are not a task-system backlog unless the source sends that field.
      </p>
    </section>
  );
}
