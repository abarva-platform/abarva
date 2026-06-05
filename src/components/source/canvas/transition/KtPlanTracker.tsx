"use client";

import type { CSSProperties } from "react";
import type { SourceTransitionMilestone } from "@/lib/source/transition/readiness-scoring";
import { CANVAS } from "../canvas-tokens";

const SOURCE_ACCENT = "#1d4ed8";

export function KtPlanTracker({
  milestones,
}: {
  milestones: SourceTransitionMilestone[];
}) {
  return (
    <section data-testid="source-transition-kt-plan" style={CARD}>
      <div style={EYEBROW}>KT plan · 5 phases</div>
      <h3 style={TITLE}>8-week onboarding control window is active</h3>
      <div style={STACK}>
        {milestones.map((milestone) => (
          <div key={milestone.id} style={ROW}>
            <span
              aria-hidden="true"
              style={{
                ...DOT,
                background: colorFor(milestone.status),
              }}
            />
            <div>
              <div style={ROW_HEAD}>
                <strong>{milestone.phase}</strong>
                <span>{milestone.window}</span>
              </div>
              <p style={COPY}>
                {milestone.evidence} <strong>Owner:</strong> {milestone.owner}
              </p>
              <p style={NEXT}>{milestone.nextAction}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function colorFor(status: SourceTransitionMilestone["status"]): string {
  switch (status) {
    case "complete":
      return CANVAS.ACTIVE;
    case "active":
      return SOURCE_ACCENT;
    case "at_risk":
      return CANVAS.WAITING;
    case "blocked":
      return CANVAS.BLOCKED;
    case "next":
      return CANVAS.RULE_STRONG;
  }
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
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
  gap: 9,
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "14px minmax(0, 1fr)",
  gap: 9,
  alignItems: "start",
  padding: "10px 0",
  borderTop: `1px solid ${CANVAS.RULE}`,
};

const DOT: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 4,
};

const ROW_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
};

const COPY: CSSProperties = {
  margin: "4px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const NEXT: CSSProperties = {
  margin: "5px 0 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};
