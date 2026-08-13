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
  decisionBriefDocxHref,
  decisionBriefPdfHref,
  eventDisplayName = "this sourcing event",
}: {
  decisionView?: VendorEvaluationDecisionView | null;
  decisionBriefDocxHref?: string;
  decisionBriefPdfHref?: string;
  eventDisplayName?: string;
}) {
  if (!decisionView || decisionView.vendorSummaries.length === 0) return null;
  const vendors = decisionView.vendorSummaries;
  const hasDecisionBriefExports = Boolean(
    decisionBriefDocxHref || decisionBriefPdfHref,
  );

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
          <p style={RECOMMENDATION_COPY}>
            {decisionView.finalistRecommendation}
          </p>
        </div>
        <div style={HEADER_ACTIONS}>
          <div style={COUNT_WRAP}>
            <Count label="Vendors" value={decisionView.vendorCount} />
            <Count label="Criteria" value={decisionView.scorecardRows.length} />
          </div>
          {hasDecisionBriefExports ? (
            <div
              style={EXPORT_WRAP}
              aria-label="Evaluation decision brief exports"
            >
              <span style={EXPORT_LABEL}>Decision brief</span>
              <div style={EXPORT_LINKS}>
                {decisionBriefDocxHref ? (
                  <a
                    href={decisionBriefDocxHref}
                    download
                    style={EXPORT_LINK}
                    data-testid="source-evaluation-decision-brief-docx"
                  >
                    DOCX
                  </a>
                ) : null}
                {decisionBriefPdfHref ? (
                  <a
                    href={decisionBriefPdfHref}
                    download
                    style={EXPORT_LINK}
                    data-testid="source-evaluation-decision-brief-pdf"
                  >
                    PDF
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ExecutiveDecisionCockpit decisionView={decisionView} />

      <div style={TRANSPARENCY_BOX}>
        <div style={EYEBROW}>How the score is defended</div>
        <ul style={BULLET_LIST}>
          {decisionView.scoringTransparency.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
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
            <p style={POSTURE_COPY}>{summary.finalistPosture}</p>
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
                    <strong style={CELL_TITLE}>{row.label}</strong>
                    <span style={CELL_NOTE}>{row.decisionUse}</span>
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
                        <strong style={CELL_NOTE}>
                          {moneyDisplay(value?.value ?? "Not provided")}
                        </strong>
                        <span style={CELL_NOTE}>
                          {value?.caveat ?? "No caveat recorded."}
                        </span>
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
            Weighted category scores for {eventDisplayName}; named client
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
                    <strong style={CELL_TITLE}>{row.label}</strong>
                    <span style={CELL_NOTE}>{row.guidance}</span>
                  </td>
                  <td style={TD_CENTER}>{row.weight}%</td>
                  {vendors.map((vendor) => {
                    const score = row.scores.find(
                      (candidate) => candidate.vendorId === vendor.vendorId,
                    );
                    return (
                      <td key={vendor.vendorId} style={TD_SCORE}>
                        <strong style={CELL_TITLE}>
                          {score?.score.toFixed(1) ?? "—"}
                        </strong>
                        {score ? (
                          <em style={WEIGHTED_NOTE}>
                            {score.weightedContribution.toFixed(2)} weighted
                          </em>
                        ) : null}
                        <span style={CELL_NOTE}>
                          {score?.rationale ?? "No rationale loaded."}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td style={{ ...TD_LABEL, fontWeight: 800 }}>Weighted total</td>
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

      <div style={TABLE_SECTION}>
        <div>
          <div style={EYEBROW}>BAFO Improvement Scenario</div>
          <p style={MINI_COPY}>
            Shows which cures can move a score, what evidence is required, and
            how the recommendation changes.
          </p>
        </div>
        <div style={TABLE_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Vendor</th>
                <th style={TH}>Now</th>
                <th style={TH}>If cured</th>
                <th style={{ ...TH, textAlign: "left" }}>BAFO cure</th>
                <th style={{ ...TH, textAlign: "left" }}>Decision impact</th>
              </tr>
            </thead>
            <tbody>
              {decisionView.scoreImprovementScenarios.map((scenario) => (
                <tr key={scenario.vendorId}>
                  <td style={TD_LABEL}>
                    <strong style={CELL_TITLE}>
                      {scenario.vendorName.replace(/\s+—\s+.*/, "")}
                    </strong>
                    <span style={CELL_NOTE}>{scenario.requiredEvidence}</span>
                  </td>
                  <td style={TD_CENTER}>{scenario.currentScore.toFixed(1)}</td>
                  <td style={TD_CENTER}>
                    {scenario.potentialScore.toFixed(1)}
                    <span style={DELTA}>+{scenario.scoreDelta.toFixed(1)}</span>
                  </td>
                  <td style={TD}>{scenario.bafoCure}</td>
                  <td style={TD}>{scenario.decisionImpact}</td>
                </tr>
              ))}
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

function ExecutiveDecisionCockpit({
  decisionView,
}: {
  decisionView: VendorEvaluationDecisionView;
}) {
  const lead = summaryById(decisionView, decisionView.leadingVendorId);
  const cheapest = summaryById(decisionView, decisionView.cheapestVendorId);
  const transitionRisk = summaryById(
    decisionView,
    decisionView.highestTransitionRiskVendorId,
  );
  const topScenario = [...decisionView.scoreImprovementScenarios].sort(
    (a, b) => b.scoreDelta - a.scoreDelta,
  )[0];
  const openConditions = decisionView.vendorSummaries.flatMap((summary) =>
    summary.conditions.map(
      (condition) => `${shortVendor(summary.vendorName)}: ${condition}`,
    ),
  );

  return (
    <div style={EXEC_COCKPIT} aria-label="Executive decision cockpit">
      <div style={EXEC_HEAD}>
        <div>
          <div style={EYEBROW}>Executive decision cockpit</div>
          <p style={MINI_COPY}>
            The executive readout separates the risk-adjusted leader from the
            lowest-price benchmark and keeps award posture conditional until
            BAFO evidence closes the named gaps.
          </p>
        </div>
        <span style={{ ...PILL, ...WARN }}>Do not award yet</span>
      </div>
      <div style={EXEC_GRID}>
        <DecisionTile
          label="Risk-adjusted lead"
          value={shortVendor(lead?.vendorName)}
          detail={
            lead
              ? `${lead.weightedScore.toFixed(1)}/10 · ${recommendationLabel(lead.recommendation)}`
              : "No lead calculated."
          }
          tone="good"
        />
        <DecisionTile
          label="Price benchmark"
          value={shortVendor(cheapest?.vendorName)}
          detail={
            cheapest
              ? "Use to pressure commercials; do not confuse lowest price with lowest risk."
              : "No price benchmark calculated."
          }
          tone="warn"
        />
        <DecisionTile
          label="Highest transition risk"
          value={shortVendor(transitionRisk?.vendorName)}
          detail={
            transitionRisk
              ? "Needs explicit cure or executive acceptance before final award."
              : "No transition risk posture loaded."
          }
          tone="bad"
        />
        <DecisionTile
          label="BAFO upside to test"
          value={
            topScenario
              ? `+${topScenario.scoreDelta.toFixed(1)} pts`
              : "No scenario"
          }
          detail={
            topScenario
              ? `${shortVendor(topScenario.vendorName)}: ${topScenario.requiredEvidence}`
              : "No improvement scenario loaded."
          }
          tone="good"
        />
      </div>
      {openConditions.length > 0 ? (
        <div style={EXEC_CONDITIONS}>
          <div style={EYEBROW}>Open conditions before award</div>
          <ul style={BULLET_LIST}>
            {openConditions.slice(0, 4).map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DecisionTile({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "bad";
}) {
  return (
    <div style={{ ...DECISION_TILE, ...tileTone(tone) }}>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{detail}</em>
    </div>
  );
}

function summaryById(
  decisionView: VendorEvaluationDecisionView,
  vendorId: string,
): VendorEvaluationDecisionView["vendorSummaries"][number] | undefined {
  return decisionView.vendorSummaries.find(
    (summary) => summary.vendorId === vendorId,
  );
}

function shortVendor(value?: string): string {
  return value?.replace(/\s+—\s+.*/, "") ?? "Not loaded";
}

function tileTone(tone: "good" | "warn" | "bad"): CSSProperties {
  if (tone === "good") return GOOD;
  if (tone === "bad") return BAD;
  return WARN;
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

const RECOMMENDATION_COPY: CSSProperties = {
  margin: "10px 0 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 980,
  fontWeight: 700,
};

const MINI_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const POSTURE_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
  fontWeight: 700,
};

const COUNT_WRAP: CSSProperties = {
  display: "flex",
  gap: 8,
};

const HEADER_ACTIONS: CSSProperties = {
  display: "grid",
  gap: 8,
  justifyItems: "end",
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

const EXPORT_WRAP: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: "7px 9px",
  display: "grid",
  gap: 5,
  justifyItems: "end",
  background: "rgba(255,255,255,0.64)",
};

const EXPORT_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const EXPORT_LINKS: CSSProperties = {
  display: "inline-flex",
  gap: 6,
};

const EXPORT_LINK: CSSProperties = {
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: 999,
  color: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
  padding: "4px 8px",
  textDecoration: "none",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 12,
};

const EXEC_COCKPIT: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.58)",
  padding: 12,
  display: "grid",
  gap: 12,
};

const EXEC_HEAD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 12,
  alignItems: "start",
};

const EXEC_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 9,
};

const DECISION_TILE: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 10,
  display: "grid",
  gap: 5,
  minHeight: 112,
};

const EXEC_CONDITIONS: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 10,
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

const TRANSPARENCY_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(10, 48, 76, 0.04)",
  padding: 12,
  display: "grid",
  gap: 8,
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

// Cells stack a heading over supporting lines. The children were bare inline
// <strong>/<span> siblings with no separator, so a label and its description
// rendered as one run of text ("Normalized 5-year TCOShows cost position...").
// These make each part its own block. The <td> stays a table-cell so column
// alignment is unaffected.
const CELL_TITLE: CSSProperties = {
  display: "block",
};

const CELL_NOTE: CSSProperties = {
  display: "block",
  marginTop: 3,
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

const WEIGHTED_NOTE: CSSProperties = {
  display: "block",
  marginTop: 2,
  color: CANVAS.INK_MUTED,
  fontStyle: "normal",
  fontSize: CANVAS.T_MICRO,
  fontFamily: CANVAS.MONO,
};

const DELTA: CSSProperties = {
  display: "block",
  marginTop: 2,
  color: "#0b7a4b",
  fontSize: CANVAS.T_MICRO,
  fontFamily: CANVAS.MONO,
  fontWeight: 800,
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
