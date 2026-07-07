"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

const QUESTIONS = [
  {
    id: "Q-014",
    section: "Security",
    status: "Distributed to all bidders",
    detail:
      "Clarified incident-notification SLA and evidence required for SOC 2 bridge letters.",
  },
  {
    id: "Q-017",
    section: "Pricing",
    status: "Awaiting collation",
    detail:
      "All vendors must restate transition fees in the locked pricing workbook, not a side letter.",
  },
  {
    id: "Q-021",
    section: "Transition",
    status: "Published",
    detail:
      "Knowledge-transfer staffing answer sent to all bidders to preserve symmetry.",
  },
];

export function QnaSymmetryLog() {
  return (
    <section data-testid="source-responses-qna-symmetry-log" style={CARD}>
      <div style={EYEBROW}>Q&amp;A symmetry log</div>
      <h3 style={TITLE}>Questions go to everyone</h3>
      <p style={COPY}>
        Source drafts and tracks communications, but external sending stays in
        the procurement channel unless configured and approved.
      </p>
      <div style={LIST}>
        {QUESTIONS.map((q) => (
          <div key={q.id} style={ROW}>
            <div style={ID}>{q.id}</div>
            <div>
              <strong>{q.section}</strong>
              <p style={DETAIL}>{q.detail}</p>
            </div>
            <span style={STATUS}>{q.status}</span>
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

const LIST: CSSProperties = {
  display: "grid",
  gap: 8,
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "54px minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 9,
};

const ID: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  color: "#1d4ed8",
  fontWeight: 700,
};

const DETAIL: CSSProperties = {
  margin: "3px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.45,
};

const STATUS: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_SOFT,
  background: CANVAS.SURFACE_HOVER,
};
