"use client";

import type { CSSProperties, ReactNode } from "react";
import { buildSourceTransitionReadinessModel } from "@/lib/source/transition/readiness-scoring";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";
import { KtPlanTracker } from "./KtPlanTracker";
import { RiskRegister } from "./RiskRegister";
import { TransitionReadinessScorecard } from "./TransitionReadinessScorecard";

export function TransitionStageView({
  event,
  documentWorkspace,
}: {
  event: { id: string; name: string; currentStageKey?: SourceStageKey };
  documentWorkspace: ReactNode;
}) {
  const model = buildSourceTransitionReadinessModel();

  return (
    <div data-testid="source-transition-stage-view" style={WRAP}>
      <section style={NEXT_CARD}>
        <div>
          <div style={EYEBROW}>Stage 10 · Transition</div>
          <h2 style={TITLE}>Prove go-live readiness before cutover</h2>
          <p style={COPY}>
            Transition is not a parking lot after award. For {event.name},
            Source tracks the KT plan, readiness workstreams, APX-CDP-2026
            dependency, and named cutover sign-offs before value measurement
            can begin.
          </p>
        </div>
        <div style={ACTION_BOX}>
          <strong>{model.activeBlocker}</strong>
          <span>{model.apxDependency}</span>
        </div>
      </section>

      <div style={GRID}>
        <KtPlanTracker milestones={model.milestones} />
        <TransitionReadinessScorecard
          workstreams={model.workstreams}
          signers={model.signers}
          readinessPercent={model.readinessPercent}
          activeBlocker={model.activeBlocker}
        />
      </div>

      <RiskRegister risks={model.risks} />

      <section data-testid="source-transition-go-no-go" style={PROOF_CARD}>
        <div style={EYEBROW}>Go / no-go criteria</div>
        <h3 style={SMALL_TITLE}>
          {model.view.summary.goNoGoMetCount}/{model.view.summary.goNoGoTotalCount} criteria met
        </h3>
        <div style={CRITERIA_GRID}>
          {model.goNoGoCriteria.map((criterion) => (
            <div key={criterion.criterionId} style={CRITERION}>
              <span
                aria-hidden="true"
                style={{
                  ...CRITERION_DOT,
                  background: criterion.met ? CANVAS.ACTIVE : CANVAS.WAITING,
                }}
              />
              <span>
                <strong>{criterion.label}</strong>
                <br />
                <span style={MUTED}>Owner: {criterion.owner}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section data-testid="source-transition-governance" style={PROOF_CARD}>
        <div style={EYEBROW}>Governed handoff</div>
        <h3 style={SMALL_TITLE}>AbarVa tracks readiness; people approve cutover</h3>
        <p style={COPY}>
          No transition action is sent to a vendor from this screen. The stage
          produces the transition plan, go-live checklist, and KT log for
          named human review. External cutover remains a client decision.
        </p>
      </section>

      <div data-testid="source-transition-document-workspace">
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
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 390px)",
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
  fontWeight: 400,
};

const SMALL_TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const MUTED: CSSProperties = {
  color: CANVAS.INK_MUTED,
};

const ACTION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 12,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(330px, 0.95fr)",
  gap: 12,
};

const PROOF_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 14,
};

const CRITERIA_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  marginTop: 12,
};

const CRITERION: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "11px minmax(0, 1fr)",
  gap: 8,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const CRITERION_DOT: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  marginTop: 4,
};
