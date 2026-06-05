"use client";

import type { CSSProperties } from "react";
import type { SourceCommercialTrap } from "@/lib/source/pricing-normalization-types";
import { CANVAS } from "../canvas-tokens";

export function TrapLog({ traps }: { traps: SourceCommercialTrap[] }) {
  const topTraps = traps.slice(0, 5);
  return (
    <section data-testid="source-pricing-trap-log" style={CARD}>
      <div>
        <div style={EYEBROW}>Trap log</div>
        <h3 style={TITLE}>Commercial traps feed BAFO</h3>
      </div>
      <div style={LIST}>
        {topTraps.length === 0 ? (
          <p style={COPY}>No commercial traps are bound to this pricing model.</p>
        ) : (
          topTraps.map((trap) => (
            <div key={`${trap.vendorId}-${trap.category}-${trap.signal}`} style={TRAP}>
              <span style={severityStyle(trap.severity)}>{trap.severity}</span>
              <strong>{trap.vendorName} · {trap.category}</strong>
              <p>{trap.signal}</p>
              <small>{trap.recommendation}</small>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function severityStyle(severity: SourceCommercialTrap["severity"]): CSSProperties {
  if (severity === "high") return BAD_TAG;
  if (severity === "medium") return WARN_TAG;
  return GOOD_TAG;
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

const LIST: CSSProperties = {
  display: "grid",
  gap: 8,
};

const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const TRAP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: "4px 8px",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 10,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const TAG_BASE: CSSProperties = {
  alignSelf: "start",
  border: "1px solid",
  borderRadius: 999,
  padding: "2px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const GOOD_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const WARN_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const BAD_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
};
