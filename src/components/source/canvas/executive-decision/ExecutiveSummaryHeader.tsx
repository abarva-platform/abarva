"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

export interface ExecutiveSummaryHeaderProps {
  recommendation: {
    vendor: string;
    tco: string;
    decidingAxis: string;
    runnerUp?: string;
    delta?: string;
    whyNot?: string;
  };
  savings: {
    npv3yr: string;
    baselineLabel: string;
  };
  tradeoff: {
    gaveUp: string;
    gained: string;
  };
  dissent: Array<{
    reviewerName: string;
    reviewerRole: string;
    oneLine: string;
  }>;
  approval: {
    requiredSignoffs: Array<{
      name: string;
      role: string;
      status: "pending" | "signed" | "overridden";
    }>;
  };
  riskCount: number;
  eventName: string;
}

export function ExecutiveSummaryHeader({
  recommendation,
  savings,
  tradeoff,
  dissent,
  approval,
  riskCount,
  eventName,
}: ExecutiveSummaryHeaderProps) {
  const primaryDissent = dissent[0] ?? null;
  const primarySignoff = approval.requiredSignoffs[0] ?? {
    name: "Decision owner",
    role: "Executive sponsor",
    status: "pending" as const,
  };

  return (
    <section data-testid="source-executive-summary-header" style={WRAP}>
      <div style={RECOMMENDATION_CELL}>
        <div style={EYEBROW}>Executive Decision · {eventName}</div>
        <h2 style={RECOMMENDATION_TITLE}>
          Recommend <span style={VENDOR}>{recommendation.vendor}</span>
          <br />
          at <span style={TCO}>{recommendation.tco}</span>
        </h2>
        <p style={AXIS}>
          Deciding axis: <strong>{recommendation.decidingAxis}</strong>.
          {recommendation.runnerUp && recommendation.delta && recommendation.whyNot
            ? ` ${recommendation.runnerUp} is ${recommendation.delta} cheaper but ${recommendation.whyNot}.`
            : null}
        </p>
      </div>

      <div style={SUPPORT_GRID}>
        <div style={SUPPORT_CARD}>
          <div style={SUPPORT_LABEL}>Savings</div>
          <div style={SUPPORT_BIG}>{savings.npv3yr}</div>
          <div style={SUPPORT_SUB}>{savings.baselineLabel}</div>
        </div>

        <div style={SUPPORT_CARD}>
          <div style={SUPPORT_LABEL}>Trade-off</div>
          <div style={SUPPORT_MED}>Gave up {tradeoff.gaveUp}</div>
          <div style={SUPPORT_SUB}>Gained {tradeoff.gained}</div>
        </div>

        <div style={SUPPORT_CARD}>
          {primaryDissent ? (
            <>
              <div style={SUPPORT_LABEL}>Dissent</div>
              <div style={SUPPORT_MED}>
                {dissent.length} reviewer · {primaryDissent.reviewerName}
              </div>
              <div style={SUPPORT_SUB}>
                &ldquo;{primaryDissent.oneLine}&rdquo;
              </div>
              <a href="#dissent" style={INLINE_LINK}>
                Open dissent panel ↓
              </a>
            </>
          ) : (
            <>
              <div style={SUPPORT_LABEL}>Risks</div>
              <div style={SUPPORT_MED}>{riskCount} open</div>
              <div style={SUPPORT_SUB}>
                No dissent recorded in the event log.
              </div>
            </>
          )}
        </div>
      </div>

      <div style={APPROVAL_STRIP}>
        <div style={APPROVAL_LEFT}>
          <span style={APPROVAL_LABEL}>Approval</span>
          {approval.requiredSignoffs.map((signoff) => (
            <span key={`${signoff.name}-${signoff.role}`} style={SIGNER}>
              <span
                aria-hidden="true"
                style={{
                  ...SIGNER_DOT,
                  background:
                    signoff.status === "signed"
                      ? CANVAS.ACTIVE
                      : signoff.status === "overridden"
                        ? CANVAS.WAITING
                        : CANVAS.GRAY_DK,
                }}
              />
              <span style={SIGNER_NAME}>{signoff.name}</span>
              <span style={SIGNER_ROLE}>{signoff.role}</span>
            </span>
          ))}
        </div>
        <div style={ACTIONS}>
          <button type="button" style={MORE_BUTTON}>
            Other decisions ▾
          </button>
          <button type="button" style={SECONDARY_BUTTON}>
            Send to co-approver
          </button>
          <button type="button" style={PRIMARY_BUTTON}>
            Approve recommendation
          </button>
        </div>
        <span style={APPROVAL_NOTE}>
          Primary signer: {primarySignoff.name} · status {primarySignoff.status}
        </span>
      </div>
    </section>
  );
}

const WRAP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.45fr) minmax(260px, 0.75fr)",
  gap: 14,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "#1f2937",
  color: "#f8fafc",
  padding: 18,
};

const RECOMMENDATION_CELL: CSSProperties = {
  minWidth: 0,
};

const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(248,250,252,0.72)",
  fontWeight: 700,
};

const RECOMMENDATION_TITLE: CSSProperties = {
  margin: "9px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 36,
  lineHeight: 1.02,
  color: "#ffffff",
  fontWeight: 400,
};

const VENDOR: CSSProperties = {
  color: "#bfdbfe",
};

const TCO: CSSProperties = {
  color: "#ffffff",
};

const AXIS: CSSProperties = {
  margin: "12px 0 0",
  maxWidth: 720,
  color: "rgba(248,250,252,0.78)",
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.55,
};

const SUPPORT_GRID: CSSProperties = {
  display: "grid",
  gap: 10,
};

const SUPPORT_CARD: CSSProperties = {
  border: "1px solid rgba(248,250,252,0.16)",
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(248,250,252,0.08)",
  padding: 12,
};

const SUPPORT_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "rgba(248,250,252,0.62)",
  fontWeight: 700,
};

const SUPPORT_BIG: CSSProperties = {
  marginTop: 5,
  fontFamily: CANVAS.SERIF,
  fontSize: 30,
  lineHeight: 1,
  color: "#ffffff",
};

const SUPPORT_MED: CSSProperties = {
  marginTop: 5,
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  lineHeight: 1.25,
  color: "#ffffff",
};

const SUPPORT_SUB: CSSProperties = {
  marginTop: 4,
  color: "rgba(248,250,252,0.72)",
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
};

const INLINE_LINK: CSSProperties = {
  display: "inline-block",
  marginTop: 6,
  color: "#bfdbfe",
  fontSize: CANVAS.T_BODY_SMALL,
  fontWeight: 700,
  textDecoration: "none",
};

const APPROVAL_STRIP: CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  borderTop: "1px solid rgba(248,250,252,0.15)",
  paddingTop: 14,
};

const APPROVAL_LEFT: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const APPROVAL_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  color: "rgba(248,250,252,0.64)",
  fontWeight: 700,
};

const SIGNER: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  border: "1px solid rgba(248,250,252,0.18)",
  borderRadius: 999,
  padding: "6px 9px",
  color: "#ffffff",
  fontSize: CANVAS.T_MICRO,
};

const SIGNER_DOT: CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: 999,
};

const SIGNER_NAME: CSSProperties = {
  fontWeight: 700,
};

const SIGNER_ROLE: CSSProperties = {
  color: "rgba(248,250,252,0.66)",
};

const ACTIONS: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const BUTTON_BASE: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "9px 12px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 800,
  cursor: "default",
};

const PRIMARY_BUTTON: CSSProperties = {
  ...BUTTON_BASE,
  border: "1px solid #ffffff",
  background: "#ffffff",
  color: "#111827",
};

const SECONDARY_BUTTON: CSSProperties = {
  ...BUTTON_BASE,
  border: "1px solid rgba(248,250,252,0.34)",
  background: "transparent",
  color: "#ffffff",
};

const MORE_BUTTON: CSSProperties = {
  ...BUTTON_BASE,
  border: "1px solid transparent",
  background: "transparent",
  color: "rgba(248,250,252,0.76)",
};

const APPROVAL_NOTE: CSSProperties = {
  width: "100%",
  color: "rgba(248,250,252,0.56)",
  fontSize: CANVAS.T_MICRO,
};
