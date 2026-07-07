"use client";

import type { CSSProperties } from "react";
import type { SourcePricingVendorSnapshot } from "@/lib/source/pricing-normalization-types";
import { CANVAS } from "../canvas-tokens";

function money(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function TcoIcebergViz({
  snapshot,
}: {
  snapshot?: SourcePricingVendorSnapshot;
}) {
  const visible = snapshot?.costInputs.annualRunCostUsd ?? 0;
  const hidden =
    (snapshot?.costInputs.transitionCostUsd ?? 0) +
    (snapshot?.costInputs.oneTimeSetupCostUsd ?? 0) +
    (snapshot?.costInputs.optionalServicesUsd ?? 0) +
    (snapshot?.costInputs.excludedServicesUsd ?? 0) +
    (snapshot?.costInputs.changeOrderExposureUsd ?? 0);
  const total = Math.max(visible + hidden, 1);
  const visiblePct = Math.round((visible / total) * 100);
  const hiddenPct = 100 - visiblePct;

  return (
    <section data-testid="source-pricing-tco-iceberg" style={CARD}>
      <div style={EYEBROW}>Visible vs hidden cost</div>
      <h3 style={TITLE}>TCO is never one number</h3>
      <p style={COPY}>
        Stacked bars show quote price versus transition, setup, optional,
        exclusion, and change-order exposure. This is buyer-side analysis, not a
        vendor-facing claim.
      </p>
      <div style={BAR} aria-label="TCO stacked bar">
        <div style={{ ...VISIBLE, width: `${visiblePct}%` }}>
          Visible {visiblePct}%
        </div>
        <div style={{ ...HIDDEN, width: `${hiddenPct}%` }}>
          Hidden {hiddenPct}%
        </div>
      </div>
      <div style={METRICS}>
        <span><strong>{money(visible)}</strong> quoted run cost</span>
        <span><strong>{money(hidden)}</strong> hidden/at-risk layers</span>
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
  gap: 10,
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
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const BAR: CSSProperties = {
  display: "flex",
  width: "100%",
  minHeight: 44,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  overflow: "hidden",
  background: CANVAS.PAGE_BG,
};

const VISIBLE: CSSProperties = {
  display: "grid",
  placeItems: "center",
  minWidth: 72,
  background: CANVAS.INK,
  color: "#fff",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const HIDDEN: CSSProperties = {
  ...VISIBLE,
  background: "rgba(186,117,23,0.14)",
  color: CANVAS.WAITING,
};

const METRICS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
};
