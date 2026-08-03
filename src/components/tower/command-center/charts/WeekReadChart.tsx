"use client";

// "This week's read" — the four-stage proof rail on the Command Center tab.
// This is intentionally CSS-native instead of Recharts: the card can become
// shallow in the live shell, and chart measurement warnings were producing
// cramped labels in exactly the executive first-read slot.

import type { CSSProperties } from "react";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerCommandSummary } from "@/lib/tower/command-center/types";

import styles from "../TowerCommandCenter.module.css";

export function WeekReadChart({ summary }: { summary: TowerCommandSummary }) {
  const maxUsd = Math.max(
    summary.promisedUsd,
    summary.usageSupportedUsd,
    summary.financeValidatedUsd,
    summary.claimableUsd,
    1,
  );

  const rows = [
    { name: "Promised", usd: summary.promisedUsd, tone: "muted" },
    { name: "Usage-supported", usd: summary.usageSupportedUsd, tone: "teal" },
    {
      name: "Finance-validated",
      usd: summary.financeValidatedUsd,
      tone: "tealDark",
    },
    { name: "Claimable", usd: summary.claimableUsd, tone: "red" },
  ];

  return (
    <div
      className={styles.weekProofRail}
      aria-label="This week's value proof progression"
    >
      {rows.map((row) => {
        const widthPct = row.usd > 0 ? Math.max((row.usd / maxUsd) * 100, 3) : 0;
        return (
          <div className={styles.weekProofRow} key={row.name}>
            <span className={styles.weekProofLabel}>{row.name}</span>
            <span className={styles.weekProofTrack}>
              <span
                className={`${styles.weekProofFill} ${styles[`weekProofFill_${row.tone}`]}`}
                style={
                  { "--week-proof-width": `${widthPct}%` } as CSSProperties
                }
              />
            </span>
            <span className={styles.weekProofValue}>{formatUsdM(row.usd)}</span>
          </div>
        );
      })}
    </div>
  );
}
