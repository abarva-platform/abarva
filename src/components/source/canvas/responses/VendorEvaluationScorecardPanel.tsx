"use client";

import type { CSSProperties } from "react";
import type { VendorEvaluationDecisionView } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

function moneyDisplay(value: string): string {
  return value;
}

function recommendationLabel(
  recommendation: VendorEvaluationDecisionView["vendorSummaries"][number]["recommendation"],
): string {
  return recommendation.replaceAll("_", " ");
}

function postureStyle(
  posture: VendorEvaluationDecisionView["comparisonRows"][number]["values"][number]["posture"],
): CSSProperties {
  if (posture === "strength") return GOOD;
  if (posture === "risk") return BAD;
  return WARN;
}

function recommendationStyle(
  recommendation: VendorEvaluationDecisionView["vendorSummaries"][number]["recommendation"],
): CSSProperties {
  if (recommendation === "advance_to_bafo") return GOOD;
  if (recommendation === "hold_until_clarified") return BAD;
  return WARN;
}

export function VendorEvaluationScorecardPanel({
  decisionView,
}: {
  decisionView?: VendorEvaluationDecisionView | null;
}) {
  if (!decisionView || decisionView.vendorSummaries.length === 0) return null;
  const vendors = decisionView.vendorSummaries;

  return (
    <section
      data-testid="source-vendor-evaluation-scorecard"
      style={CARD}
      aria-label="Normalized Vendor Comparison and Evaluation Scorecard"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Evaluation decision view</div>
          <h3 style={TITLE}>Normalized Vendor Comparison + Scorecard</h3>
          <p style={COPY}>{decisionView.scoreBasis}</p>
        </div>
        <div style={COUNT_WRAP}>
          <Count label="Vendors" value={decisionView.vendorCount} />
          <Count label="Criteria" value={decisionView.scorecardRows.length} />
        </div>
      </div>

      <div style={SUMMARY_GRID}>
        {vendors.map((summary) => (
          <article key={summary.vendorId} style={SUMMARY_CARD}>
            <div style={SUMMARY_HEAD}>
              <div>
                <div style={RANK}>Rank {summary.rank}</div>
                <strong style={VENDOR_NAME}>{summary.vendorName}</strong>
              </div>
              <span
                style={{
                  ...PILL,
                  ...recommendationStyle(summary.recommendation),
                }}
              >
                {recommendationLabel(summary.recommendation)}
              </span>
            </div>
            <div style={SCORE_LINE}>
              <span>Weighted score</span>
              <strong>{summary.weightedScore.toFixed(1)}/10</strong>
            </div>
            <p style={MINI_COPY}>{summary.decisionRationale}</p>
            <ul style={BULLET_LIST}>
              {summary.tradeoffs.slice(0, 2).map((tradeoff) => (
                <li key={tradeoff}>{tradeoff}</li>
              ))}
            </ul>
            {summary.conditions.length > 0 ? (
              <div style={CONDITION_BOX}>
                <div style={EYEBROW}>Conditions before final scoring</div>
                <ul style={BULLET_LIST}>
                  {summary.conditions.slice(0, 2).map((condition) => (
                    <li key={condition}>{condition}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div style={TABLE_SECTION}>
        <div>
          <div style={EYEBROW}>Normalized Vendor Comparison</div>
          <p style={MINI_COPY}>
            Side-by-side sourcing-critical fields; narrative claims stay
            conditional unless backed by exhibits and pricing.
          </p>
        </div>
        <div style={TABLE_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Dimension</th>
                {vendors.map((vendor) => (
                  <th key={vendor.vendorId} style={TH}>
                    {vendor.vendorName.replace(/\s+—\s+.*/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisionView.comparisonRows.map((row) => (
                <tr key={row.comparisonId}>
                  <td style={TD_LABEL}>
                    <strong>{row.label}</strong>
                    <span>{row.decisionUse}</span>
                  </td>
                  {vendors.map((vendor) => {
                    const value = row.values.find(
                      (candidate) => candidate.vendorId === vendor.vendorId,
                    );
                    return (
                      <td key={vendor.vendorId} style={TD}>
                        <span
                          style={{
                            ...PILL_SMALL,
                            ...postureStyle(value?.posture ?? "watch"),
                          }}
                        >
                          {value?.posture ?? "watch"}
                        </span>
                        <strong>{moneyDisplay(value?.value ?? "Not provided")}</strong>
                        <span>{value?.caveat ?? "No caveat recorded."}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={TABLE_SECTION}>
        <div>
          <div style={EYEBROW}>Evaluation Scorecard</div>
          <p style={MINI_COPY}>
            Default weights support evaluation readiness; named client
            reviewers still own final scores and award decisions.
          </p>
        </div>
        <div style={TABLE_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Criterion</th>
                <th style={TH}>Wt%</th>
                {vendors.map((vendor) => (
                  <th key={vendor.vendorId} style={TH}>
                    {vendor.vendorName.replace(/\s+—\s+.*/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {decisionView.scorecardRows.map((row) => (
                <tr key={row.criterionId}>
                  <td style={TD_LABEL}>
                    <strong>{row.label}</strong>
                    <span>{row.guidance}</span>
                  </td>
                  <td style={TD_CENTER}>{row.weight}%</td>
                  {vendors.map((vendor) => {
                    const score = row.scores.find(
                      (candidate) => candidate.vendorId === vendor.vendorId,
                    );
                    return (
                      <td key={vendor.vendorId} style={TD_SCORE}>
                        <strong>{score?.score.toFixed(1) ?? "—"}</strong>
                        <span>{score?.rationale ?? "No rationale loaded."}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td style={{ ...TD_LABEL, fontWeight: 800 }}>
                  Weighted total
                </td>
                <td style={TD_CENTER}>100%</td>
                {vendors.map((vendor) => (
                  <td key={vendor.vendorId} style={TD_CENTER}>
                    <strong>{vendor.weightedScore.toFixed(1)}</strong>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={TRADEOFF_BOX}>
        <div style={EYEBROW}>Executive Tradeoff Summary</div>
        <ul style={BULLET_LIST}>
          {decisionView.executiveTradeoffs.map((tradeoff) => (
            <li key={tradeoff}>{tradeoff}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div style={COUNT}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 14,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
  alignItems: "start",
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
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1.12,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 900,
};

const MINI_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const COUNT_WRAP: CSSProperties = {
  display: "flex",
  gap: 8,
};

const COUNT: CSSProperties = {
  minWidth: 86,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: "7px 10px",
  display: "grid",
  gap: 2,
  textAlign: "right",
  color: CANVAS.INK,
};

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const SUMMARY_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.55)",
  padding: 12,
  display: "grid",
  gap: 10,
};

const SUMMARY_HEAD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "start",
};

const RANK: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const VENDOR_NAME: CSSProperties = {
  display: "block",
  marginTop: 3,
  color: CANVAS.INK,
  fontSize: 14,
  lineHeight: 1.25,
};

const SCORE_LINE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "8px 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
};

const CONDITION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: 8,
  background: "rgba(186,117,23,0.06)",
  padding: 9,
};

const BULLET_LIST: CSSProperties = {
  margin: "6px 0 0",
  paddingLeft: 18,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const TABLE_SECTION: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.5)",
  padding: 12,
  display: "grid",
  gap: 10,
};

const TABLE_WRAP: CSSProperties = {
  overflowX: "auto",
};

const TABLE: CSSProperties = {
  width: "100%",
  minWidth: 860,
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
  verticalAlign: "top",
  width: 230,
};

const TD: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 10px",
  color: CANVAS.INK,
  verticalAlign: "top",
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const TD_SCORE: CSSProperties = {
  ...TD,
  textAlign: "left",
};

const TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "9px 10px",
  color: CANVAS.INK,
  textAlign: "center",
  verticalAlign: "top",
};

const PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const PILL_SMALL: CSSProperties = {
  ...PILL,
  display: "inline-block",
  marginBottom: 5,
};

const TRADEOFF_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(29,158,117,0.06)",
  padding: 12,
};

const GOOD: CSSProperties = {
  color: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
  borderColor: CANVAS.ACTIVE,
};

const WARN: CSSProperties = {
  color: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
  borderColor: CANVAS.WAITING,
};

const BAD: CSSProperties = {
  color: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
  borderColor: CANVAS.BLOCKED,
};
