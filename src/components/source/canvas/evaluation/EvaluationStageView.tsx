"use client";

import type { CSSProperties, ReactNode } from "react";
import type { VendorEvaluationDecisionView } from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";
import { BatnaPanel } from "./BatnaPanel";
import { DissentPanel } from "./DissentPanel";
import { WeightedScorecardTable } from "./WeightedScorecardTable";
import { VendorEvaluationScorecardPanel } from "../responses/VendorEvaluationScorecardPanel";

export function EvaluationStageView({
  evaluationDecisionView,
  decisionBriefDocxHref,
  decisionBriefPdfHref,
  eventDisplayName,
  documentWorkspace,
}: {
  evaluationDecisionView?: VendorEvaluationDecisionView | null;
  decisionBriefDocxHref?: string;
  decisionBriefPdfHref?: string;
  eventDisplayName?: string;
  documentWorkspace: ReactNode;
}) {
  return (
    <div data-testid="source-evaluation-stage-view" style={WRAP}>
      <section style={NEXT_CARD}>
        <div>
          <div style={EYEBROW}>Stage 5 · Evaluation</div>
          <h2 style={TITLE}>Complete scoring before pricing</h2>
          <p style={COPY}>
            Score against locked criteria, capture reviewer rationale, record
            dissent, and name the BATNA before the event advances.
          </p>
        </div>
        <div style={ACTION_BOX}>
          <strong>One next move: continue scoring.</strong>
          <span>
            AbarVa does not pick a winner silently. Human reviewers own scores,
            dissent, BATNA, and final approval.
          </span>
        </div>
      </section>

      {evaluationDecisionView ? (
        <VendorEvaluationScorecardPanel
          decisionView={evaluationDecisionView}
          decisionBriefDocxHref={decisionBriefDocxHref}
          decisionBriefPdfHref={decisionBriefPdfHref}
          eventDisplayName={eventDisplayName}
        />
      ) : (
        <WeightedScorecardTable />
      )}

      {!evaluationDecisionView ? (
        <div style={GRID}>
          <DissentPanel />
          <BatnaPanel />
        </div>
      ) : null}

      <div data-testid="source-evaluation-document-workspace">
        {documentWorkspace}
      </div>
    </div>
  );
}

const WRAP: CSSProperties = {
  display: "grid",
  gap: 12,
};

const NEXT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 360px)",
  gap: 14,
  alignItems: "stretch",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
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
  fontSize: 28,
  lineHeight: 1.05,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const ACTION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(29,158,117,0.06)",
  padding: 12,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};
