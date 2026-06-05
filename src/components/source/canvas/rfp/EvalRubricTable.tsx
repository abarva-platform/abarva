"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

export type EvalRubricRow = {
  criterion: string;
  weight: number;
  scale: string;
  evidence: string;
};

const DEFAULT_RUBRIC: EvalRubricRow[] = [
  {
    criterion: "Run stability and SLA model",
    weight: 30,
    scale: "1-5",
    evidence: "Incident history, proposed governance, service credits",
  },
  {
    criterion: "Transition plan and retained-org fit",
    weight: 25,
    scale: "1-5",
    evidence: "Mobilization plan, role split, knowledge-transfer proof",
  },
  {
    criterion: "Commercial model and cost transparency",
    weight: 25,
    scale: "1-5",
    evidence: "Pricing workbook, assumptions, excluded scope",
  },
  {
    criterion: "Retail operating experience",
    weight: 20,
    scale: "1-5",
    evidence: "Comparable references, peak-season support evidence",
  },
];

export function EvalRubricTable({
  rows = DEFAULT_RUBRIC,
}: {
  rows?: EvalRubricRow[];
}) {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);

  return (
    <div data-testid="source-rfp-eval-rubric" style={WRAP_STYLE}>
      <div style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Evaluation rubric</div>
          <h3 style={TITLE_STYLE}>Scoring basis</h3>
        </div>
        <span
          style={{
            ...WEIGHT_BADGE_STYLE,
            borderColor: totalWeight === 100 ? "rgba(46,125,50,0.28)" : "rgba(180,111,31,0.34)",
            color: totalWeight === 100 ? "#2E7D32" : "#9A5A12",
            background: totalWeight === 100 ? "rgba(46,125,50,0.08)" : "rgba(180,111,31,0.08)",
          }}
        >
          {totalWeight}% total
        </span>
      </div>
      {totalWeight !== 100 ? (
        <p data-testid="source-rfp-rubric-soft-warning" style={WARNING_STYLE}>
          Weights do not total 100. You can keep drafting, but sponsor sign-off
          will require a clean weighting basis.
        </p>
      ) : null}
      <table style={TABLE_STYLE}>
        <thead>
          <tr>
            {["Criterion", "Weight", "Scale", "Evidence required"].map((heading) => (
              <th key={heading} style={TH_STYLE}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.criterion}>
              <td style={TD_STRONG_STYLE}>{row.criterion}</td>
              <td style={TD_STYLE}>{row.weight}%</td>
              <td style={TD_STYLE}>{row.scale}</td>
              <td style={TD_STYLE}>{row.evidence}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  fontWeight: 400,
  color: CANVAS.INK,
};

const WEIGHT_BADGE_STYLE: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "5px 9px",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const WARNING_STYLE: CSSProperties = {
  margin: 0,
  border: "1px solid rgba(180,111,31,0.28)",
  borderRadius: 8,
  padding: "9px 10px",
  background: "rgba(180,111,31,0.06)",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#8A4B0A",
};

const TABLE_STYLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const TH_STYLE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "8px 10px",
  textAlign: "left",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TD_STYLE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  verticalAlign: "top",
};

const TD_STRONG_STYLE: CSSProperties = {
  ...TD_STYLE,
  color: CANVAS.INK,
  fontWeight: 700,
};
