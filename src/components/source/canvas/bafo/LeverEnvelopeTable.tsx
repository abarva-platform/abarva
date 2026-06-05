"use client";

import type { CSSProperties } from "react";
import type { SourceBafoVendorNegotiationPlan } from "@/lib/source/bafo-negotiation-types";
import { CANVAS } from "../canvas-tokens";

export function LeverEnvelopeTable({
  plans,
}: {
  plans: SourceBafoVendorNegotiationPlan[];
}) {
  return (
    <section data-testid="source-bafo-lever-envelope" style={CARD}>
      <div>
        <div style={EYEBROW}>Lever envelope</div>
        <h3 style={TITLE}>Per-vendor negotiation cards</h3>
      </div>
      <div style={GRID}>
        {plans.length === 0 ? (
          <article style={VENDOR_CARD}>
            <div style={CARD_HEAD}>
              <strong>Awaiting BAFO vendor set</strong>
              <span style={WARN_TAG}>not ready</span>
            </div>
            <dl style={DETAILS}>
              <div>
                <dt>Opening</dt>
                <dd>Load finalist responses and pricing snapshots first.</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>Convert pricing traps into precise vendor asks.</dd>
              </div>
              <div>
                <dt>Walk-away</dt>
                <dd>Do not issue BAFO until a human names blockers.</dd>
              </div>
            </dl>
          </article>
        ) : plans.map((plan) => (
          <article key={plan.vendorId} style={VENDOR_CARD}>
            <div style={CARD_HEAD}>
              <strong>{plan.vendorName}</strong>
              <span style={readinessStyle(plan.readiness)}>
                {plan.readiness.replace("_", " ")}
              </span>
            </div>
            <dl style={DETAILS}>
              <div>
                <dt>Opening</dt>
                <dd>{plan.keyIssues[0] ?? "Current response position."}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{plan.recommendedAsks[0] ?? "No additional ask bound."}</dd>
              </div>
              <div>
                <dt>Walk-away</dt>
                <dd>{plan.blockers[0] ?? "No blocker; hold human review."}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function readinessStyle(
  readiness: SourceBafoVendorNegotiationPlan["readiness"],
): CSSProperties {
  if (readiness === "ready") return GOOD_TAG;
  if (readiness === "blocked" || readiness === "not_comparable") return BAD_TAG;
  return WARN_TAG;
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
  display: "grid",
  gap: 12,
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
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 10,
};

const VENDOR_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 12,
  display: "grid",
  gap: 10,
};

const CARD_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "start",
  color: CANVAS.INK,
};

const DETAILS: CSSProperties = {
  margin: 0,
  display: "grid",
  gap: 8,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const TAG_BASE: CSSProperties = {
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

const GOOD_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const WARN_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const BAD_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
};
