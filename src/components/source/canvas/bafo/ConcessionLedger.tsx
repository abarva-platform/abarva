"use client";

import type { CSSProperties } from "react";
import type { SourceBafoNegotiationPlan } from "@/lib/source/bafo-negotiation-types";
import { CANVAS } from "../canvas-tokens";

export function ConcessionLedger({
  plan,
}: {
  plan: SourceBafoNegotiationPlan;
}) {
  const rows = plan.vendorNegotiationPlans.slice(0, 3).map((vendor, index) => ({
    id: vendor.vendorId,
    round: `Round ${index + 1}`,
    ask: vendor.recommendedAsks[0] ?? "Validate commercial position.",
    gave: vendor.requiredClarifications[0] ?? "Awaiting vendor response.",
    offered:
      vendor.counterClauses[0]?.clauseKey ??
      "Requires named human approval before offer",
    swing: vendor.expectedValueImpact,
  }));

  return (
    <section data-testid="source-bafo-concession-ledger" style={CARD}>
      <div>
        <div style={EYEBROW}>Concession ledger</div>
        <h3 style={TITLE}>Every trade is attributable</h3>
      </div>
      <div style={TABLE}>
        <div style={{ ...ROW, ...HEADER }}>
          <span>Round</span>
          <span>We asked</span>
          <span>Vendor gave</span>
          <span>Net swing</span>
        </div>
        {rows.length === 0 ? (
          <div style={ROW}>
            <span>Not started</span>
            <span>Record the first BAFO ask after finalist responses bind.</span>
            <span>Awaiting vendor reply.</span>
            <span>Human-owned</span>
          </div>
        ) : rows.map((row) => (
            <div key={row.id} style={ROW}>
              <span>{row.round}</span>
              <span>{row.ask}</span>
              <span>{row.gave}</span>
              <span>{row.swing}</span>
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

const TABLE: CSSProperties = {
  display: "grid",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  overflow: "hidden",
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "90px minmax(0, 1.2fr) minmax(0, 1fr) minmax(120px, 0.6fr)",
  gap: 10,
  alignItems: "start",
  padding: "10px 12px",
  borderTop: `1px solid ${CANVAS.RULE}`,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
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
