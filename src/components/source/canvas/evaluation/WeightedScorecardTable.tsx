"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

const CRITERIA = [
  {
    label: "Technical depth",
    weight: 30,
    northstar: 8.5,
    atlas: 7.8,
    arcvault: 6.5,
    rationale:
      "Northstar has the strongest AMS depth; Atlas leads commercially but needs transition proof.",
  },
  {
    label: "Commercial fit",
    weight: 25,
    northstar: 7.2,
    atlas: 8.8,
    arcvault: 7.0,
    rationale:
      "Atlas prices below median; Northstar needs BAFO pressure on run-rate transparency.",
  },
  {
    label: "Transition risk",
    weight: 20,
    northstar: 7.5,
    atlas: 6.8,
    arcvault: 7.5,
    rationale:
      "Northstar and ArcVault are credible; Atlas needs named cutover owners.",
  },
  {
    label: "Governance + SLA",
    weight: 15,
    northstar: 8.1,
    atlas: 7.1,
    arcvault: 6.9,
    rationale:
      "Northstar has clearer escalation paths and audit-friendly SLA cadence.",
  },
  {
    label: "Evidence quality",
    weight: 10,
    northstar: 8.4,
    atlas: 7.4,
    arcvault: 6.7,
    rationale:
      "Reviewer notes cite reference calls and uploaded response sections.",
  },
];

const VENDORS = [
  { key: "northstar", label: "Northstar" },
  { key: "atlas", label: "Atlas SI" },
  { key: "arcvault", label: "ArcVault" },
] as const;

function total(key: (typeof VENDORS)[number]["key"]) {
  return CRITERIA.reduce((sum, criterion) => {
    return sum + criterion[key] * (criterion.weight / 100);
  }, 0).toFixed(1);
}

export function WeightedScorecardTable() {
  return (
    <section data-testid="source-evaluation-weighted-scorecard" style={CARD}>
      <div style={EYEBROW}>Weighted scorecard</div>
      <h3 style={TITLE}>Score against locked criteria</h3>
      <p style={COPY}>
        Scores remain reviewable until the sourcing lead locks the evaluation.
        Every material score needs reviewer rationale and evidence.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: "left" }}>Criterion</th>
              <th style={TH}>Weight</th>
              {VENDORS.map((vendor) => (
                <th key={vendor.key} style={TH}>
                  {vendor.label}
                </th>
              ))}
              <th style={{ ...TH, textAlign: "left" }}>Reviewer rationale</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((criterion) => (
              <tr key={criterion.label}>
                <td style={TD_LABEL}>{criterion.label}</td>
                <td style={TD_CENTER}>{criterion.weight}%</td>
                {VENDORS.map((vendor) => (
                  <td key={vendor.key} style={TD_CENTER}>
                    <strong>{criterion[vendor.key]}</strong>
                  </td>
                ))}
                <td style={TD_RATIONALE}>{criterion.rationale}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...TD_LABEL, fontWeight: 800 }}>Weighted total</td>
              <td style={TD_CENTER}>100%</td>
              {VENDORS.map((vendor) => (
                <td key={vendor.key} style={TD_CENTER}>
                  <strong>{total(vendor.key)}</strong>
                </td>
              ))}
              <td style={TD_RATIONALE}>
                Northstar leads; Atlas remains the human-named BATNA.
              </td>
            </tr>
          </tbody>
        </table>
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
  fontSize: 22,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const TABLE: CSSProperties = {
  width: "100%",
  minWidth: 760,
  borderCollapse: "collapse",
};

const TH: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.RULE}`,
  padding: "8px 10px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  textAlign: "center",
};

const TD_LABEL: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 10px",
  color: CANVAS.INK,
};

const TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 10px",
  color: CANVAS.INK,
  textAlign: "center",
};

const TD_RATIONALE: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 10px",
  color: CANVAS.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.45,
};
