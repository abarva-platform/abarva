import type { CSSProperties } from "react";
import { buildPricingCompletenessView } from "@/lib/source/pricing-completeness-view";
import { buildAwardDecisionView } from "@/lib/source/award-decision-view";
import { buildTransitionReadinessView } from "@/lib/source/transition-readiness-view";
import { type SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

interface StageDecisionLensPanelProps {
  stage: SourceStageKey;
}

export function StageDecisionLensPanel({
  stage,
}: StageDecisionLensPanelProps) {
  if (stage === "pricing") {
    const view = buildPricingCompletenessView();
    return (
      <section
        data-testid="source-stage-decision-lens"
        style={PANEL_STYLE}
        aria-label="Pricing comparability"
      >
        <div style={EYEBROW_STYLE}>Pricing comparability</div>
        <h3 style={TITLE_STYLE}>{view.summary.overallReason}</h3>
        <p style={BODY_STYLE}>
          {view.summary.comparableVendorCount} of {view.summary.totalVendorCount} vendors are fully comparable today.
        </p>
        <div style={GRID_STYLE}>
          {view.vendors.map((vendor) => (
            <div key={vendor.vendorId} style={CARD_STYLE}>
              <div style={CARD_TITLE_STYLE}>{vendor.vendorName}</div>
              <div style={META_STYLE}>{labelize(vendor.comparabilityStatus)}</div>
              <div style={BODY_STYLE}>
                {vendor.blockerCount} blocker{vendor.blockerCount === 1 ? "" : "s"} ·{" "}
                {vendor.riskCount} risk{vendor.riskCount === 1 ? "" : "s"}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (stage === "executive_decision" || stage === "selection") {
    const view = buildAwardDecisionView();
    return (
      <section
        data-testid="source-stage-decision-lens"
        style={PANEL_STYLE}
        aria-label="Award recommendation"
      >
        <div style={EYEBROW_STYLE}>Award recommendation</div>
        <h3 style={TITLE_STYLE}>
          Recommend {view.summary.recommendedVendorName}
        </h3>
        <p style={BODY_STYLE}>{view.summary.rationale}</p>
        <div style={GRID_STYLE}>
          {view.vendors.map((vendor) => (
            <div key={vendor.vendorId} style={CARD_STYLE}>
              <div style={CARD_TITLE_STYLE}>
                {vendor.rank}. {vendor.vendorName}
              </div>
              <div style={META_STYLE}>
                {labelize(vendor.status)} · Overall {vendor.scores.overall}
              </div>
              <div style={BODY_STYLE}>{vendor.decisionNote}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (stage === "transition") {
    const view = buildTransitionReadinessView();
    return (
      <section
        data-testid="source-stage-decision-lens"
        style={PANEL_STYLE}
        aria-label="Transition readiness"
      >
        <div style={EYEBROW_STYLE}>Transition readiness</div>
        <h3 style={TITLE_STYLE}>
          {view.summary.goNoGoMetCount}/{view.summary.goNoGoTotalCount} go/no-go checks met
        </h3>
        <p style={BODY_STYLE}>{view.atlasGuidance}</p>
        <div style={GRID_STYLE}>
          {view.vendors.map((vendor) => (
            <div key={vendor.vendorId} style={CARD_STYLE}>
              <div style={CARD_TITLE_STYLE}>{vendor.vendorLabel}</div>
              <div style={META_STYLE}>{labelize(vendor.overallStatus)}</div>
              <div style={BODY_STYLE}>
                {vendor.blockerSummary ?? "No blocker summary recorded."}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return null;
}

function labelize(value: string): string {
  return value.replaceAll("_", " ");
}

const PANEL_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 16,
  padding: "16px 18px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  color: CANVAS.INK,
  lineHeight: 1.2,
};

const BODY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
  padding: "12px 14px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.PAGE_BG,
};

const CARD_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: CANVAS.INK,
};

const META_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
};
