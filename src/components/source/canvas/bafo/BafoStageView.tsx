"use client";

import type { CSSProperties, ReactNode } from "react";
import { buildBafoScenarioCompareView } from "@/lib/source/bafo-scenario-compare-view";
import { buildSourceBafoNegotiationPlan } from "@/lib/source/bafo-negotiation";
import { buildSourcePricingNormalization } from "@/lib/source/pricing-normalization";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";
import { BafoScenarioComparePanel } from "./BafoScenarioComparePanel";
import { ConcessionLedger } from "./ConcessionLedger";
import { LeverEnvelopeTable } from "./LeverEnvelopeTable";

export function BafoStageView({
  event,
  documentWorkspace,
}: {
  event: { id: string; name: string; currentStageKey?: SourceStageKey };
  documentWorkspace: ReactNode;
}) {
  const pricing = buildSourcePricingNormalization({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey ?? "pricing",
    },
  });
  const plan = buildSourceBafoNegotiationPlan({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey ?? "bafo",
      pricingNormalizationSnapshots: pricing.snapshots,
    },
  });
  const scenarioCompare = buildBafoScenarioCompareView();

  return (
    <div data-testid="source-bafo-stage-view" style={WRAP}>
      <section style={NEXT_CARD}>
        <div>
          <div style={EYEBROW}>Stage 7 · BAFO</div>
          <h2 style={TITLE}>Prepare the BAFO question pack</h2>
          <p style={COPY}>
            Use pricing traps, scope exclusions, and weak evidence to draft a
            precise vendor-by-vendor ask list. AbarVa drafts the internal pack;
            procurement owns external distribution.
          </p>
        </div>
        <div style={ACTION_BOX}>
          <strong>{plan.nextAction}</strong>
          <span>
            Human approval is required before any BAFO request leaves Source.
            The pack below can be downloaded for review; it is not sent from
            this screen.
          </span>
        </div>
      </section>

      <BafoScenarioComparePanel view={scenarioCompare} />
      <LeverEnvelopeTable plans={plan.vendorNegotiationPlans} />
      <ConcessionLedger plan={plan} />

      <section
        data-testid="source-bafo-question-pack-governance"
        style={PROOF_CARD}
      >
        <div style={EYEBROW}>Question pack governance</div>
        <h3 style={SMALL_TITLE}>Anti-pattern flags come from the trap log</h3>
        <p style={COPY}>
          High-priority pricing, exclusion, transition, and evidence questions
          flow into d22. Export actions remain governed by artifact status and
          named human approval.
        </p>
      </section>

      <div data-testid="source-bafo-document-workspace">
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
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 370px)",
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

const PROOF_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 14,
};
