"use client";

import type { CSSProperties } from "react";
import type { SourcePricingNormalization } from "@/lib/source/pricing-normalization-types";
import { CANVAS } from "../canvas-tokens";

function money(value: number): string {
  if (!Number.isFinite(value)) return "$0.0M";
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function TcoBridge({
  pricing,
}: {
  pricing: SourcePricingNormalization;
}) {
  const rows = pricing.comparison.slice(0, 4).map((rank) => {
    const snapshot = pricing.snapshots.find(
      (candidate) => candidate.vendorId === rank.vendorId,
    );
    const year1 = snapshot?.costByYear.year1 ?? 0;
    const year3 =
      (snapshot?.costByYear.year1 ?? 0) +
      (snapshot?.costByYear.year2 ?? 0) +
      (snapshot?.costByYear.year3 ?? 0);
    const confidence =
      snapshot?.readinessStatus === "strong"
        ? "High"
        : snapshot?.readinessStatus === "risk_adjusted"
          ? "Medium"
          : "Low";
    return {
      rank: rank.rank,
      vendorName: rank.vendorName,
      comparable: rank.comparable,
      reason: rank.reason,
      year1,
      year3,
      confidence,
    };
  });

  return (
    <section data-testid="source-pricing-tco-bridge" style={CARD}>
      <div style={HEAD}>
        <div>
          <div style={EYEBROW}>TCO bridge</div>
          <h3 style={TITLE}>Normalize before negotiating</h3>
        </div>
        <div style={SUMMARY}>
          {pricing.comparableVendors} comparable · {pricing.notComparableVendors} blocked
        </div>
      </div>
      <div style={TABLE} role="table" aria-label="Normalized vendor TCO bridge">
        <div style={{ ...ROW, ...HEADER }} role="row">
          <span>Vendor</span>
          <span>Year 1</span>
          <span>3-year TCO</span>
          <span>Confidence</span>
        </div>
        {rows.map((row) => (
          <div key={row.vendorName} style={ROW} role="row">
            <span>
              <strong>{row.rank}. {row.vendorName}</strong>
              <small>{row.reason}</small>
            </span>
            <span>{money(row.year1)}</span>
            <span>{money(row.year3)}</span>
            <span style={row.comparable ? GOOD_TAG : WARN_TAG}>
              {row.confidence}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
  display: "grid",
  gap: 12,
};

const HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const SUMMARY: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "5px 9px",
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
};

const TABLE: CSSProperties = {
  display: "grid",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  overflow: "hidden",
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(180px, 1.5fr) repeat(3, minmax(92px, 0.65fr))",
  gap: 10,
  alignItems: "center",
  padding: "10px 12px",
  borderTop: `1px solid ${CANVAS.RULE}`,
  fontSize: CANVAS.T_BODY_SMALL,
  color: CANVAS.INK,
};

const HEADER: CSSProperties = {
  borderTop: "none",
  background: CANVAS.PAGE_BG,
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 700,
};

const GOOD_TAG: CSSProperties = {
  justifySelf: "start",
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: 999,
  padding: "3px 8px",
  color: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const WARN_TAG: CSSProperties = {
  ...GOOD_TAG,
  borderColor: CANVAS.WAITING,
  color: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};
