import type { CSSProperties } from "react";
import type {
  PricingCompletenessGap,
  PricingGapSeverity,
  PricingVendorCompleteness,
} from "@/lib/source/pricing-completeness-view";
import { buildPricingCompletenessView } from "@/lib/source/pricing-completeness-view";
import { buildAwardDecisionView } from "@/lib/source/award-decision-view";
import { buildTransitionReadinessView } from "@/lib/source/transition-readiness-view";
import { type SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

interface StageDecisionLensPanelProps {
  stage: SourceStageKey;
}

export function StageDecisionLensPanel({ stage }: StageDecisionLensPanelProps) {
  if (stage === "pricing") {
    const view = buildPricingCompletenessView();
    return (
      <section
        data-testid="source-stage-decision-lens"
        style={PANEL_STYLE}
        aria-label="Pricing comparability"
      >
        <div style={EYEBROW_STYLE}>Pricing comparability</div>
        <h3 style={TITLE_STYLE}>{view.headline}</h3>
        <p style={BODY_STYLE}>{view.summary.overallReason}</p>
        <div
          data-testid="source-pricing-completeness-summary"
          style={SUMMARY_BAR_STYLE}
        >
          <SummaryDatum
            label="Comparable vendors"
            value={`${view.summary.comparableVendorCount}/${view.summary.totalVendorCount}`}
          />
          <SummaryDatum
            label="Cross-vendor gaps"
            value={String(view.summary.crossVendorGaps.length)}
          />
          <SummaryDatum
            label="State"
            value={labelize(view.summary.overallComparability)}
          />
        </div>
        <div style={DRILLDOWN_GRID_STYLE}>
          {view.vendors.map((vendor) => (
            <PricingVendorCard key={vendor.vendorId} vendor={vendor} />
          ))}
        </div>
        <div
          data-testid="source-pricing-cross-vendor-gaps"
          style={SECTION_STYLE}
        >
          <div style={SECTION_TITLE_STYLE}>Cross-vendor gaps</div>
          <div style={GAP_LIST_STYLE}>
            {view.summary.crossVendorGaps.map((gap) => (
              <PricingGapRow key={gap.gapId} gap={gap} />
            ))}
          </div>
        </div>
        <button type="button" disabled style={DISABLED_ACTION_STYLE}>
          {view.clarificationLabel}
        </button>
        <p style={DISCLAIMER_STYLE}>{view.clarificationDisabledReason}</p>
        <p style={DISCLAIMER_STYLE}>{view.honestDisclaimer}</p>
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
          {view.summary.goNoGoMetCount}/{view.summary.goNoGoTotalCount} go/no-go
          checks met
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

function SummaryDatum({ label, value }: { label: string; value: string }) {
  return (
    <div style={SUMMARY_DATUM_STYLE}>
      <div style={META_STYLE}>{label}</div>
      <div style={SUMMARY_VALUE_STYLE}>{value}</div>
    </div>
  );
}

function PricingVendorCard({ vendor }: { vendor: PricingVendorCompleteness }) {
  const topGap = vendor.gaps[0];

  return (
    <article
      data-testid={`source-pricing-vendor-${vendor.vendorId}`}
      style={CARD_STYLE}
    >
      <div style={CARD_HEADER_STYLE}>
        <div>
          <div style={CARD_TITLE_STYLE}>{vendor.vendorName}</div>
          <div style={META_STYLE}>{labelize(vendor.comparabilityStatus)}</div>
        </div>
        <SeverityPill
          severity={
            vendor.blockerCount > 0
              ? "blocker"
              : vendor.riskCount > 0
                ? "risk"
                : "advisory"
          }
          label={
            vendor.blockerCount > 0
              ? `${vendor.blockerCount} blocker${vendor.blockerCount === 1 ? "" : "s"}`
              : `${vendor.riskCount} risk${vendor.riskCount === 1 ? "" : "s"}`
          }
        />
      </div>
      <p style={BODY_STYLE}>{vendor.comparabilityReason}</p>
      <div style={PRICE_GRID_STYLE}>
        <SummaryDatum
          label="YR2+ run"
          value={formatMoney(vendor.annualRunCostUsd)}
        />
        <SummaryDatum
          label="Transition"
          value={formatMoney(vendor.transitionCostUsd)}
        />
      </div>
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Assumptions</div>
        <CompactList
          items={vendor.assumptions}
          emptyLabel="No assumptions listed."
        />
      </div>
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Exclusions</div>
        <CompactList
          items={vendor.exclusions}
          emptyLabel="No exclusions listed."
        />
      </div>
      {topGap ? (
        <div style={GAP_LIST_STYLE}>
          <PricingGapRow gap={topGap} />
        </div>
      ) : null}
    </article>
  );
}

function PricingGapRow({ gap }: { gap: PricingCompletenessGap }) {
  return (
    <div style={GAP_ROW_STYLE}>
      <div style={{ minWidth: 0 }}>
        <div style={GAP_TITLE_STYLE}>
          <SeverityPill
            severity={gap.severity}
            label={labelize(gap.severity)}
          />
          <span>{gap.label}</span>
        </div>
        <p style={BODY_STYLE}>{gap.detail}</p>
      </div>
      <div style={NEXT_ACTION_STYLE}>
        <div style={META_STYLE}>Next action</div>
        <div>{gap.nextAction}</div>
      </div>
    </div>
  );
}

function SeverityPill({
  severity,
  label,
}: {
  severity: PricingGapSeverity;
  label: string;
}) {
  const tone =
    severity === "blocker"
      ? SEVERITY_BLOCKER_STYLE
      : severity === "risk"
        ? SEVERITY_RISK_STYLE
        : SEVERITY_ADVISORY_STYLE;

  return <span style={{ ...SEVERITY_PILL_STYLE, ...tone }}>{label}</span>;
}

function CompactList({
  items,
  emptyLabel,
}: {
  items: readonly string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p style={BODY_STYLE}>{emptyLabel}</p>;
  }

  return (
    <ul style={COMPACT_LIST_STYLE}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
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

const DRILLDOWN_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 10,
};

const CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: "12px 14px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.PAGE_BG,
};

const CARD_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
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

const SUMMARY_BAR_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 0,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  overflow: "hidden",
};

const SUMMARY_DATUM_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  padding: "10px 12px",
  borderRight: `1px solid ${CANVAS.HAIRLINE}`,
  background: "#fff",
};

const SUMMARY_VALUE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 19,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const PRICE_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const SECTION_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const SECTION_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 800,
  color: CANVAS.INK,
};

const COMPACT_LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const GAP_LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
};

const GAP_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(180px, 0.45fr)",
  gap: 12,
  padding: "10px 12px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const GAP_TITLE_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 7,
  alignItems: "center",
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  fontWeight: 800,
  color: CANVAS.INK,
};

const NEXT_ACTION_STYLE: CSSProperties = {
  display: "grid",
  alignContent: "start",
  gap: 4,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.35,
  color: CANVAS.INK,
};

const SEVERITY_PILL_STYLE: CSSProperties = {
  borderRadius: 999,
  display: "inline-flex",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 800,
  lineHeight: 1,
  padding: "4px 6px",
  textTransform: "uppercase",
};

const SEVERITY_BLOCKER_STYLE: CSSProperties = {
  background: "#fbe9ea",
  color: "#9f2f37",
};

const SEVERITY_RISK_STYLE: CSSProperties = {
  background: "#fff1df",
  color: "#8a4d11",
};

const SEVERITY_ADVISORY_STYLE: CSSProperties = {
  background: "#e9f5ef",
  color: "#1f6a4f",
};

const DISABLED_ACTION_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#e8e0d4",
  color: "#81786a",
  cursor: "not-allowed",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 800,
  justifySelf: "start",
  minHeight: 38,
  padding: "0 14px",
};

const DISCLAIMER_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: CANVAS.GRAY_DK,
};
