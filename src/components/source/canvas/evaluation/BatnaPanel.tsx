"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

export function BatnaPanel() {
  return (
    <section data-testid="source-evaluation-batna-panel" style={CARD}>
      <div style={EYEBROW}>BATNA</div>
      <h3 style={TITLE}>Named by sourcing lead</h3>
      <p style={COPY}>
        Vendor B is the named BATNA, not auto-derived. Credibility is medium:
        commercial fit is strong, but transition evidence must close before
        BAFO.
      </p>
      <div style={OWNER}>
        Owner: Sourcing lead · Last reviewed before pricing gate
      </div>
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 8,
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
};

const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const OWNER: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 8,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_SOFT,
};
