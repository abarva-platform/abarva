"use client";

import type { CSSProperties } from "react";
import type { SourcePricingVendorSnapshot } from "@/lib/source/pricing-normalization-types";
import { CANVAS } from "../canvas-tokens";

const SCENARIOS = [
  { label: "Volume +20%", factor: 0.2, basis: "ticket demand" },
  { label: "Scope +10%", factor: 0.1, basis: "application scope" },
  { label: "FX +5%", factor: 0.05, basis: "rate card exposure" },
] as const;

function money(value: number): string {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

export function SensitivityRibbon({
  snapshot,
}: {
  snapshot?: SourcePricingVendorSnapshot;
}) {
  const base =
    (snapshot?.costByYear.year1 ?? 0) +
    (snapshot?.costByYear.year2 ?? 0) +
    (snapshot?.costByYear.year3 ?? 0);

  return (
    <section data-testid="source-pricing-sensitivity-ribbon" style={CARD}>
      <div>
        <div style={EYEBROW}>Sensitivity ribbon</div>
        <h3 style={TITLE}>Pre-rendered pressure tests</h3>
      </div>
      <div style={GRID}>
        {SCENARIOS.map((scenario) => (
          <div key={scenario.label} style={SCENARIO}>
            <span style={SCENARIO_LABEL}>{scenario.label}</span>
            <strong>{money(base * scenario.factor)}</strong>
            <small>Potential 3-year swing from {scenario.basis}</small>
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

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const SCENARIO: CSSProperties = {
  display: "grid",
  gap: 5,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 12,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
};

const SCENARIO_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};
