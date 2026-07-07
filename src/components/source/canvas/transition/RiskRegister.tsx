"use client";

import type { CSSProperties } from "react";
import type { TransitionRiskItem } from "@/lib/source/transition-readiness-view";
import { CANVAS } from "../canvas-tokens";

export function RiskRegister({ risks }: { risks: TransitionRiskItem[] }) {
  return (
    <section data-testid="source-transition-risk-register" style={CARD}>
      <div style={EYEBROW}>Risk register</div>
      <h3 style={TITLE}>Transition risks are owned before cutover</h3>
      <div style={STACK}>
        {risks.map((risk) => (
          <article key={risk.riskId} style={ROW}>
            <div style={ROW_HEAD}>
              <span
                style={{
                  ...SEVERITY,
                  borderColor: colorFor(risk.severity),
                  color: colorFor(risk.severity),
                }}
              >
                {risk.severity}
              </span>
              <strong>{risk.label}</strong>
            </div>
            <p style={COPY}>{risk.narrative}</p>
            <p style={MITIGATION}>
              <strong>Mitigation:</strong> {risk.mitigationNote}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function colorFor(severity: TransitionRiskItem["severity"]): string {
  if (severity === "high") return CANVAS.BLOCKED;
  if (severity === "medium") return CANVAS.WAITING;
  return CANVAS.ACTIVE;
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 14,
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
  margin: "5px 0 12px",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: 10,
};

const ROW: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 11,
};

const ROW_HEAD: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
};

const SEVERITY: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const MITIGATION: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};
