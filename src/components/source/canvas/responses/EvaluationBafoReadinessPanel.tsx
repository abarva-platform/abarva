"use client";

import type { CSSProperties } from "react";
import type { EvaluationBafoReadinessView } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

function stateLabel(state: EvaluationBafoReadinessView["state"]): string {
  if (state === "ready_for_evaluator_review") return "Evaluator review";
  if (state === "clarify_before_bafo") return "Conditional";
  if (state === "blocked") return "Blocked";
  return "No records";
}

function stateStyle(state: EvaluationBafoReadinessView["state"]): CSSProperties {
  if (state === "ready_for_evaluator_review") return GOOD;
  if (state === "blocked" || state === "no_records") return BAD;
  return WARN;
}

function comparabilityStyle(
  state: EvaluationBafoReadinessView["comparable"][number]["comparability"],
): CSSProperties {
  if (state === "comparable") return GOOD;
  if (state === "blocked") return BAD;
  return WARN;
}

function packageLabel(
  status: EvaluationBafoReadinessView["received"][number]["packageStatus"],
): string {
  if (status === "received") return "Received";
  if (status === "received_with_gaps") return "Received with gaps";
  return "Not score ready";
}

export function EvaluationBafoReadinessPanel({
  view,
}: {
  view?: EvaluationBafoReadinessView | null;
}) {
  if (!view) return null;
  const visibleBlockers = view.blockers.slice(0, 5);

  return (
    <section
      data-testid="source-evaluation-bafo-readiness"
      style={CARD}
      aria-label="Evaluation and BAFO readiness"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Stage 07 decision support</div>
          <h3 style={TITLE}>{view.headline}</h3>
          <p style={COPY}>{view.contextLine}</p>
          <p style={SUBTLE_COPY}>{view.archetypeLine}</p>
        </div>
        <div style={STATUS_WRAP}>
          <span style={{ ...PILL, ...stateStyle(view.state) }}>
            {stateLabel(view.state)}
          </span>
          <strong style={ACTION_LABEL}>Next action</strong>
          <span style={ACTION_TEXT}>{view.singleNextAction}</span>
        </div>
      </div>

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Received</span>
            <strong>{view.received.length} package set</strong>
          </div>
          <div style={STACK}>
            {view.received.length > 0 ? (
              view.received.map((row) => (
                <div key={row.vendorId} style={ROW}>
                  <div>
                    <strong>{row.vendorName}</strong>
                    <span style={ROW_NOTE}>
                      {row.sectionsAnswered}/{row.sectionsTotal} sections ·{" "}
                      {row.exhibitCount} exhibits · {row.extractionCardCount}{" "}
                      extraction cards
                    </span>
                  </div>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...(row.packageStatus === "received"
                        ? GOOD
                        : row.packageStatus === "received_with_gaps"
                          ? WARN
                          : BAD),
                    }}
                  >
                    {packageLabel(row.packageStatus)}
                  </span>
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No governed response profiles loaded.</p>
            )}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <span style={EYEBROW}>Comparable</span>
            <strong>{view.comparable.length} vendor read</strong>
          </div>
          <div style={STACK}>
            {view.comparable.length > 0 ? (
              view.comparable.map((row) => (
                <div key={row.vendorId} style={COMPARABLE_ROW}>
                  <div style={COMPARABLE_HEAD}>
                    <strong>{row.vendorName}</strong>
                    <span
                      style={{
                        ...PILL_SMALL,
                        ...comparabilityStyle(row.comparability),
                      }}
                    >
                      {row.comparability}
                    </span>
                  </div>
                  <span style={ROW_NOTE}>{row.scorePosture}</span>
                  <span style={ROW_NOTE}>{row.rationale}</span>
                  {row.evidenceBasis.length > 0 ? (
                    <span style={EVIDENCE_NOTE}>
                      Evidence: {row.evidenceBasis.join("; ")}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <p style={EMPTY_COPY}>No scorecard or response evidence to compare.</p>
            )}
          </div>
        </div>
      </div>

      <div style={PRICING_PANEL}>
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>Pricing comparability</span>
          <strong>{view.pricing.length} vendor TCO read</strong>
        </div>
        <div style={PRICING_GRID}>
          {view.pricing.length > 0 ? (
            view.pricing.map((row) => (
              <article key={row.vendorId} style={PRICING_CARD}>
                <div style={COMPARABLE_HEAD}>
                  <strong>{row.vendorName}</strong>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...comparabilityStyle(row.comparability),
                    }}
                  >
                    {row.comparability}
                  </span>
                </div>
                <div style={METRIC_GRID}>
                  <span>
                    <strong>{row.fiveYearTcoLabel}</strong>
                    <small>Five-year TCO</small>
                  </span>
                  <span>
                    <strong>{row.yearOneRunCostLabel}</strong>
                    <small>Year-one run</small>
                  </span>
                  <span>
                    <strong>{row.transitionCostLabel}</strong>
                    <small>Transition</small>
                  </span>
                  <span>
                    <strong>{row.oneTimeCostLabel}</strong>
                    <small>One-time</small>
                  </span>
                </div>
                <p style={ROW_NOTE}>{row.pricingBasis}</p>
                <p style={NEXT_ACTION}>{row.rationale}</p>
              </article>
            ))
          ) : (
            <p style={EMPTY_COPY}>No pricing records available for comparison.</p>
          )}
        </div>
      </div>

      <div style={BLOCKER_PANEL}>
        <div style={PANEL_HEAD}>
          <span style={EYEBROW}>Blockers and evidence gaps</span>
          <strong>{view.blockers.length} open item</strong>
        </div>
        {visibleBlockers.length > 0 ? (
          <div style={BLOCKER_GRID}>
            {visibleBlockers.map((blocker) => (
              <article key={blocker.blockerId} style={BLOCKER_CARD}>
                <div style={COMPARABLE_HEAD}>
                  <strong>{blocker.vendorName}</strong>
                  <span
                    style={{
                      ...PILL_SMALL,
                      ...(blocker.severity === "blocker" ? BAD : WARN),
                    }}
                  >
                    {blocker.severity}
                  </span>
                </div>
                <span style={BLOCKER_LABEL}>{blocker.label}</span>
                <p style={ROW_NOTE}>{blocker.detail}</p>
                <p style={NEXT_ACTION}>{blocker.nextAction}</p>
              </article>
            ))}
          </div>
        ) : (
          <p style={EMPTY_COPY}>
            No deterministic blocker is recorded. Named evaluators still own the
            final scoring decision.
          </p>
        )}
      </div>

      <div style={GUARDRAIL}>{view.guardrail}</div>
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FFFFFF",
  boxShadow: "0 18px 50px rgba(15, 23, 42, 0.08)",
  padding: 18,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)",
  gap: 18,
  alignItems: "start",
};

const EYEBROW: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: "uppercase",
};

const TITLE: CSSProperties = {
  margin: "4px 0 0",
  color: CANVAS.INK,
  fontSize: 20,
  lineHeight: 1.2,
  letterSpacing: 0,
};

const COPY: CSSProperties = {
  margin: "8px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: 13,
  lineHeight: 1.5,
};

const SUBTLE_COPY: CSSProperties = {
  ...COPY,
  color: CANVAS.INK_MUTED,
};

const STATUS_WRAP: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#F8FAFC",
  padding: 12,
  display: "grid",
  gap: 8,
};

const ACTION_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
};

const ACTION_TEXT: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: 13,
  lineHeight: 1.4,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)",
  gap: 14,
  marginTop: 16,
};

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: 14,
  minWidth: 0,
};

const PRICING_PANEL: CSSProperties = {
  ...PANEL,
  marginTop: 14,
};

const PANEL_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: CANVAS.INK,
  fontSize: 13,
};

const STACK: CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};

const ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 12,
  alignItems: "start",
  color: CANVAS.INK,
  fontSize: 13,
};

const COMPARABLE_ROW: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 10,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: 13,
};

const PRICING_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const PRICING_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FBFCFE",
  padding: 12,
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const METRIC_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const COMPARABLE_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const ROW_NOTE: CSSProperties = {
  display: "block",
  color: CANVAS.INK_SOFT,
  fontSize: 12,
  lineHeight: 1.4,
};

const EVIDENCE_NOTE: CSSProperties = {
  display: "block",
  color: CANVAS.INK_MUTED,
  fontSize: 11,
  lineHeight: 1.35,
};

const BLOCKER_PANEL: CSSProperties = {
  ...PANEL,
  marginTop: 14,
};

const BLOCKER_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const BLOCKER_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  background: "#FBFCFE",
  padding: 12,
  display: "grid",
  gap: 6,
};

const BLOCKER_LABEL: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
  fontWeight: 800,
  textTransform: "capitalize",
};

const NEXT_ACTION: CSSProperties = {
  margin: 0,
  color: "#7C2D12",
  fontSize: 12,
  lineHeight: 1.4,
  fontWeight: 700,
};

const GUARDRAIL: CSSProperties = {
  marginTop: 14,
  borderRadius: 8,
  background: "#F8FAFC",
  color: CANVAS.INK_MUTED,
  fontSize: 12,
  lineHeight: 1.45,
  padding: 12,
};

const EMPTY_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_MUTED,
  fontSize: 13,
  lineHeight: 1.4,
};

const PILL: CSSProperties = {
  justifySelf: "start",
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
};

const PILL_SMALL: CSSProperties = {
  borderRadius: 999,
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 800,
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const GOOD: CSSProperties = {
  background: "#DCFCE7",
  color: "#166534",
};

const WARN: CSSProperties = {
  background: "#FEF3C7",
  color: "#92400E",
};

const BAD: CSSProperties = {
  background: "#FEE2E2",
  color: "#991B1B",
};
