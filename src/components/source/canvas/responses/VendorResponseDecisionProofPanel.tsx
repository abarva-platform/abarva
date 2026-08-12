"use client";

import type { CSSProperties } from "react";
import {
  buildSourceBafoLeverageOptimizer,
  buildSourceExecutiveDecisionPack,
  buildSourceFirstPassScorecard,
  buildSourceValueRealizationProofPlan,
  type VendorResponseParseReport,
} from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

export function VendorResponseDecisionProofPanel({
  parseReports,
}: {
  parseReports?: VendorResponseParseReport[];
}) {
  if (!parseReports || parseReports.length === 0) return null;

  const scorecard = buildSourceFirstPassScorecard(parseReports);
  const optimizer = buildSourceBafoLeverageOptimizer(parseReports);
  const decisionPack = buildSourceExecutiveDecisionPack(scorecard, optimizer);
  const valuePlan = buildSourceValueRealizationProofPlan(optimizer);

  return (
    <section
      data-testid="source-vendor-response-decision-proof"
      style={CARD}
      aria-label="Responses decision and value proof"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Decision proof</div>
          <h3 style={TITLE}>What this unlocks after response parsing</h3>
          <p style={COPY}>
            Parsed packages now feed the scoring gate, BAFO pressure, CXO
            decision conditions, and value proof plan without turning AI
            suggestions into final scores or unproven leverage into booked
            savings.
          </p>
        </div>
        <div style={SUMMARY_GRID}>
          <Metric
            label="Ready vendors"
            value={`${scorecard.readyVendorCount}/${scorecard.totalVendorCount}`}
            tone={
              scorecard.readyVendorCount === scorecard.totalVendorCount
                ? "good"
                : "warn"
            }
          />
          <Metric
            label="BAFO asks"
            value={String(optimizer.levers.length)}
            tone={optimizer.levers.length > 0 ? "good" : "neutral"}
          />
          <Metric
            label="Value state"
            value={valuePlan.proofState.replaceAll("_", " ")}
            tone={valuePlan.proofState === "ready_to_track" ? "good" : "warn"}
          />
        </div>
      </div>

      <div style={GRID}>
        <ProofCard
          title="First-pass scoring"
          badge={`${scorecard.holdbacks.length} holdback${scorecard.holdbacks.length === 1 ? "" : "s"}`}
          body={scorecard.nextAction}
          items={scorecard.holdbacks
            .slice(0, 3)
            .map(
              (holdback) =>
                `${holdback.vendorName}: ${holdback.requiredEvidence}`,
            )}
        />
        <ProofCard
          title="BAFO leverage"
          badge={
            optimizer.evidencedValueLowUsd !== null &&
            optimizer.evidencedValueHighUsd !== null
              ? `${formatUsd(optimizer.evidencedValueLowUsd)}-${formatUsd(optimizer.evidencedValueHighUsd)} evidenced`
              : `${optimizer.opportunityToTestCount} to test`
          }
          body={optimizer.guardrail}
          items={optimizer.levers
            .slice(0, 3)
            .map((lever) => `${lever.vendorName}: ${lever.negotiationAsk}`)}
        />
        <ProofCard
          title="CXO decision pack"
          badge={decisionPack.posture.replaceAll("_", " ")}
          body={decisionPack.recommendation}
          items={decisionPack.decisionConditions.slice(0, 3)}
        />
        <ProofCard
          title="Value realization"
          badge={`${valuePlan.trackedLevers.length} lever${valuePlan.trackedLevers.length === 1 ? "" : "s"}`}
          body={valuePlan.guardrail}
          items={
            valuePlan.missingProof.length > 0
              ? valuePlan.missingProof.slice(0, 3)
              : valuePlan.trackedLevers
                  .slice(0, 3)
                  .map((lever) => `${lever.vendorName}: ${lever.proofRequired}`)
          }
        />
      </div>
    </section>
  );
}

function ProofCard({
  title,
  badge,
  body,
  items,
}: {
  title: string;
  badge: string;
  body: string;
  items: string[];
}) {
  return (
    <div style={PROOF_CARD}>
      <div style={PROOF_TOP}>
        <strong>{title}</strong>
        <span style={BADGE}>{badge}</span>
      </div>
      <p style={PROOF_BODY}>{body}</p>
      <ul style={LIST}>
        {items.length > 0 ? (
          items.map((item) => <li key={item}>{item}</li>)
        ) : (
          <li>No open item in this proof slice.</li>
        )}
      </ul>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  return (
    <div style={{ ...METRIC, ...TONE[tone] }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: value >= 1_000_000 ? "compact" : "standard",
  }).format(value);
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
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 380px)",
  gap: 14,
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
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "6px 0 0",
  fontSize: CANVAS.T_BODY,
  lineHeight: 1.5,
  color: CANVAS.INK_MUTED,
};

const SUMMARY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
};

const METRIC: CSSProperties = {
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid ${CANVAS.RULE}`,
  padding: 10,
  display: "grid",
  gap: 4,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  fontFamily: CANVAS.MONO,
  color: CANVAS.INK_MUTED,
};

const TONE = {
  good: { background: "#ECFDF3", borderColor: "#A7F3D0" },
  warn: { background: "#FFF7ED", borderColor: "#FED7AA" },
  neutral: { background: "#F8F7F4", borderColor: CANVAS.RULE },
} satisfies Record<string, CSSProperties>;

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const PROOF_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 12,
  background: "#F8F7F4",
  display: "grid",
  gap: 8,
};

const PROOF_TOP: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "center",
  fontSize: CANVAS.T_BODY,
};

const BADGE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE_STRONG}`,
  borderRadius: 999,
  padding: "3px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
};

const PROOF_BODY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};
