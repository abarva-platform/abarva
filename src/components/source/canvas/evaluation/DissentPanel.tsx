"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

export function DissentPanel() {
  return (
    <section data-testid="source-evaluation-dissent-panel" style={CARD}>
      <div style={EYEBROW}>Dissent captured</div>
      <h3 style={TITLE}>Minority view is first-class evidence</h3>
      <p style={COPY}>
        CTO Office reviewer challenges whether Vendor B&apos;s commercial
        advantage offsets its transition depth gap.
      </p>
      <div style={ATTACHMENT}>
        <strong>Attachment allowed</strong>
        <span>
          Dissent memo, reviewer worksheet, or meeting note can be attached
          before decision.
        </span>
      </div>
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 14,
  display: "grid",
  gap: 8,
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: CANVAS.WAITING,
  fontWeight: 800,
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
  color: CANVAS.INK_2,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const ATTACHMENT: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 8,
  display: "grid",
  gap: 2,
  color: CANVAS.INK,
  fontSize: 12,
};
