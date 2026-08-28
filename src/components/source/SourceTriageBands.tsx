import Link from "next/link";
import type { CSSProperties } from "react";
import { SHELL } from "@/lib/shell/shell-tokens";
import {
  TRIAGE_BAND_ORDER,
  type SourceTriageBand,
  type SourceTriageBandFilter,
  type SourceTriageBandSummary,
  type SourceTriageSort,
} from "@/lib/source/queue/triage-banding";

const BAND_ACCENT: Record<SourceTriageBand, string> = {
  overdue: SHELL.RUST_TEXT,
  due_this_quarter: SHELL.PEACH_TEXT,
  pipeline: SHELL.INK_MUTED,
};

function formatBandValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)
    return `$${Math.round(value / 1_000).toLocaleString("en-US")}K`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function bandHref(band: SourceTriageBand, sort: SourceTriageSort): string {
  return `/source/workspace?decisionBand=${band}&sort=${sort}`;
}

export function SourceTriageBands({
  summaries,
  activeBand,
  sort,
}: {
  summaries: SourceTriageBandSummary[];
  activeBand: SourceTriageBandFilter;
  sort: SourceTriageSort;
}) {
  const byBand = new Map(summaries.map((summary) => [summary.band, summary]));

  return (
    <section
      aria-label="Decision queue triage bands"
      data-testid="source-triage-bands"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 14,
      }}
    >
      {TRIAGE_BAND_ORDER.map((band) => {
        const summary = byBand.get(band);
        if (!summary) return null;
        const isActive = activeBand === band;
        const style: CSSProperties = {
          display: "flex",
          minHeight: 122,
          flexDirection: "column",
          gap: 9,
          borderRadius: 8,
          border: `1px solid ${isActive ? BAND_ACCENT[band] : SHELL.CARD_LINE}`,
          borderTop: `3px solid ${BAND_ACCENT[band]}`,
          background: isActive ? SHELL.PAPER_SOFT : SHELL.CARD_WHITE,
          padding: "16px 18px",
          textDecoration: "none",
          boxShadow: isActive ? "0 10px 24px rgba(15, 23, 42, 0.08)" : "none",
        };

        return (
          <Link
            key={band}
            href={bandHref(band, sort)}
            aria-current={isActive ? "true" : undefined}
            data-testid={`source-triage-band-${band}`}
            style={style}
          >
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.09em",
                fontWeight: 700,
                color: BAND_ACCENT[band],
              }}
            >
              {summary.label}
            </span>
            <span
              style={{
                fontFamily: SHELL.SERIF,
                fontSize: 30,
                lineHeight: 1,
                color: SHELL.INK,
              }}
            >
              {summary.count}
            </span>
            <span
              style={{
                fontFamily: SHELL.SANS,
                fontSize: 12,
                lineHeight: 1.45,
                color: SHELL.INK_SOFT,
              }}
            >
              {summary.context} · {formatBandValue(summary.aggregateValueUsd)}
              {band === "due_this_quarter" && summary.scopeClarityCount > 0
                ? ` · ${summary.scopeClarityCount} need scope clarity`
                : ""}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
