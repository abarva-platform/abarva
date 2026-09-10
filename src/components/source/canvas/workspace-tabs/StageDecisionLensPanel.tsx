import type { CSSProperties } from "react";
import type {
  VendorEvaluationDecisionView,
  VendorResponseProfile,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import { type SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

interface StageDecisionLensPanelProps {
  stage: SourceStageKey;
  profileSet?: VendorResponseProfileSet | null;
  decisionView?: VendorEvaluationDecisionView | null;
}

export function StageDecisionLensPanel({
  stage,
  profileSet,
  decisionView,
}: StageDecisionLensPanelProps) {
  if (stage === "pricing")
    return <PricingEvidenceLens profileSet={profileSet} />;
  if (stage === "executive_decision" || stage === "selection") {
    return <AwardEvidenceLens decisionView={decisionView} />;
  }
  if (stage === "transition") {
    return <TransitionEvidenceLens profileSet={profileSet} />;
  }
  return null;
}

function PricingEvidenceLens({
  profileSet,
}: {
  profileSet?: VendorResponseProfileSet | null;
}) {
  const profiles = profileSet?.profiles ?? [];
  const comparable = profiles.filter(hasComparablePricing).length;
  const conditionCount = profiles.reduce(
    (sum, profile) =>
      sum +
      profile.assumptionsExclusions.length +
      profile.commercialExceptions.length,
    0,
  );

  return (
    <section
      data-testid="source-stage-decision-lens"
      style={PANEL_STYLE}
      aria-label="Pricing evidence comparability"
    >
      <div style={EYEBROW_STYLE}>Pricing evidence</div>
      <h3 style={TITLE_STYLE}>Compare what vendors actually submitted</h3>
      <p style={BODY_STYLE}>
        Pricing is comparable only when the normalized response contains a
        numeric commercial basis and a cited pricing exhibit. Missing values
        stay visibly unestablished.
      </p>
      <div
        data-testid="source-pricing-completeness-summary"
        style={SUMMARY_BAR_STYLE}
      >
        <SummaryDatum
          label="Submitted vendors"
          value={String(profiles.length)}
        />
        <SummaryDatum
          label="Comparable pricing"
          value={`${comparable}/${profiles.length}`}
        />
        <SummaryDatum label="Open conditions" value={String(conditionCount)} />
      </div>
      {profiles.length === 0 ? (
        <FailClosedMessage>
          No normalized vendor response profiles are available for this event.
          Pricing comparison is withheld; sample vendors and fixture bids are
          never substituted.
        </FailClosedMessage>
      ) : (
        <div style={DRILLDOWN_GRID_STYLE}>
          {profiles.map((profile) => (
            <PricingVendorCard key={profile.vendorId} profile={profile} />
          ))}
        </div>
      )}
      <p style={DISCLAIMER_STYLE}>
        Governed event evidence only. No sample vendors, modeled bid medians, or
        savings amounts are introduced when the response package does not
        establish them.
      </p>
    </section>
  );
}

function PricingVendorCard({ profile }: { profile: VendorResponseProfile }) {
  const pricingCards = profile.extractionCards.filter(
    (card) => card.type === "pricing",
  );
  const conditions = [
    ...profile.assumptionsExclusions,
    ...profile.commercialExceptions,
  ];
  return (
    <article
      data-testid={`source-pricing-vendor-${profile.vendorId}`}
      style={CARD_STYLE}
    >
      <div style={CARD_HEADER_STYLE}>
        <div>
          <div style={CARD_TITLE_STYLE}>{profile.vendorName}</div>
          <div style={META_STYLE}>
            Response v{profile.responseVersion} · {profile.readyForEvaluation}
          </div>
        </div>
        <span
          style={{
            ...SEVERITY_PILL_STYLE,
            ...(hasComparablePricing(profile)
              ? SEVERITY_GOOD_STYLE
              : SEVERITY_RISK_STYLE),
          }}
        >
          {hasComparablePricing(profile) ? "numeric basis" : "not comparable"}
        </span>
      </div>
      <div style={PRICE_GRID_STYLE}>
        <SummaryDatum
          label="Year-one run"
          value={formatMoney(profile.pricingSummary.yearOneRunCostUsd)}
        />
        <SummaryDatum
          label="Transition"
          value={formatMoney(profile.pricingSummary.transitionCostUsd)}
        />
        <SummaryDatum
          label="Five-year TCO"
          value={formatMoney(profile.pricingSummary.fiveYearTcoUsd)}
        />
      </div>
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Pricing basis and evidence</div>
        <p style={BODY_STYLE}>
          {profile.pricingSummary.pricingBasis || "Not established"}
        </p>
        {pricingCards.length > 0 ? (
          <ul style={COMPACT_LIST_STYLE}>
            {pricingCards.slice(0, 4).map((card) => (
              <li key={card.cardId}>
                <strong>{card.title}:</strong> {card.extractedValue} ·{" "}
                {card.evidenceReference ?? "citation missing"}
              </li>
            ))}
          </ul>
        ) : (
          <p style={BODY_STYLE}>No cited pricing extraction is loaded.</p>
        )}
      </div>
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>Conditions before comparison</div>
        <CompactList
          items={conditions.slice(0, 5)}
          emptyLabel="No assumptions or commercial exceptions were extracted."
        />
      </div>
    </article>
  );
}

function AwardEvidenceLens({
  decisionView,
}: {
  decisionView?: VendorEvaluationDecisionView | null;
}) {
  const summaries = decisionView?.vendorSummaries ?? [];
  const ready = summaries.filter((summary) =>
    decisionView?.recommendedAdvanceVendorIds.includes(summary.vendorId),
  );
  return (
    <section
      data-testid="source-stage-decision-lens"
      style={PANEL_STYLE}
      aria-label="Award decision evidence"
    >
      <div style={EYEBROW_STYLE}>Award decision</div>
      <h3 style={TITLE_STYLE}>
        {ready.length > 0
          ? `${ready.length} vendor${ready.length === 1 ? " is" : "s are"} eligible to advance`
          : "No vendor is decision-ready for award"}
      </h3>
      <p style={BODY_STYLE}>
        {decisionView?.finalistRecommendation ??
          "Normalized response evidence is unavailable, so Source withholds ranking and award guidance."}
      </p>
      {summaries.length === 0 ? (
        <FailClosedMessage>
          No event-specific evaluation record is available. A sample award
          recommendation is never shown in its place.
        </FailClosedMessage>
      ) : (
        <div style={GRID_STYLE}>
          {summaries.map((vendor) => (
            <article key={vendor.vendorId} style={CARD_STYLE}>
              <div style={CARD_HEADER_STYLE}>
                <div>
                  <div style={CARD_TITLE_STYLE}>{vendor.vendorName}</div>
                  <div style={META_STYLE}>
                    Provisional score {vendor.weightedScore.toFixed(1)}/10
                  </div>
                </div>
                <span
                  style={{
                    ...SEVERITY_PILL_STYLE,
                    ...(vendor.recommendation === "hold_until_clarified"
                      ? SEVERITY_RISK_STYLE
                      : SEVERITY_GOOD_STYLE),
                  }}
                >
                  {labelize(vendor.recommendation)}
                </span>
              </div>
              <p style={BODY_STYLE}>{vendor.decisionRationale}</p>
              <div style={SECTION_STYLE}>
                <div style={SECTION_TITLE_STYLE}>Conditions</div>
                <CompactList
                  items={vendor.conditions.slice(0, 4)}
                  emptyLabel="No unresolved conditions recorded."
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function TransitionEvidenceLens({
  profileSet,
}: {
  profileSet?: VendorResponseProfileSet | null;
}) {
  const profiles = profileSet?.profiles ?? [];
  return (
    <section
      data-testid="source-stage-decision-lens"
      style={PANEL_STYLE}
      aria-label="Transition evidence"
    >
      <div style={EYEBROW_STYLE}>Transition evidence</div>
      <h3 style={TITLE_STYLE}>
        Proposal commitments are not execution readiness
      </h3>
      <p style={BODY_STYLE}>
        These commitments come from normalized vendor responses and do not, by
        themselves, establish go-live readiness. Use the accepted transition
        packet and approval record below as the controlling evidence for named
        owners, dates, dependencies, and entry/exit criteria.
      </p>
      {profiles.length === 0 ? (
        <FailClosedMessage>
          No normalized proposal commitments are available for this event.
        </FailClosedMessage>
      ) : (
        <div style={GRID_STYLE}>
          {profiles.map((profile) => (
            <article key={profile.vendorId} style={CARD_STYLE}>
              <div style={CARD_TITLE_STYLE}>{profile.vendorName}</div>
              <p style={BODY_STYLE}>
                {profile.transitionCommitments || "Not established"}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function hasComparablePricing(profile: VendorResponseProfile): boolean {
  return [
    profile.pricingSummary.yearOneRunCostUsd,
    profile.pricingSummary.transitionCostUsd,
    profile.pricingSummary.fiveYearTcoUsd,
  ].some((value) => typeof value === "number" && Number.isFinite(value));
}

function formatMoney(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "Not established";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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

function CompactList({
  items,
  emptyLabel,
}: {
  items: readonly string[];
  emptyLabel: string;
}) {
  if (items.length === 0) return <p style={BODY_STYLE}>{emptyLabel}</p>;
  return (
    <ul style={COMPACT_LIST_STYLE}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function FailClosedMessage({ children }: { children: string }) {
  return (
    <div data-testid="source-stage-decision-lens-empty" style={EMPTY_STYLE}>
      {children}
    </div>
  );
}

const PANEL_STYLE: CSSProperties = {
  background: CANVAS.CARD,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  display: "grid",
  gap: 14,
  padding: 16,
};
const EYEBROW_STYLE: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};
const TITLE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1.15,
  margin: 0,
};
const BODY_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  margin: 0,
};
const SUMMARY_BAR_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};
const SUMMARY_DATUM_STYLE: CSSProperties = {
  borderRight: `1px solid ${CANVAS.RULE}`,
  display: "grid",
  gap: 4,
  minWidth: 0,
  padding: 12,
};
const SUMMARY_VALUE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 19,
  fontWeight: 800,
};
const DRILLDOWN_GRID_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
};
const GRID_STYLE: CSSProperties = DRILLDOWN_GRID_STYLE;
const CARD_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  display: "grid",
  gap: 12,
  padding: 14,
};
const CARD_HEADER_STYLE: CSSProperties = {
  alignItems: "start",
  display: "flex",
  gap: 10,
  justifyContent: "space-between",
};
const CARD_TITLE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 15,
  fontWeight: 800,
};
const META_STYLE: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
};
const PRICE_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
};
const SECTION_STYLE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  display: "grid",
  gap: 6,
  paddingTop: 10,
};
const SECTION_TITLE_STYLE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 12,
  fontWeight: 800,
};
const COMPACT_LIST_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
  display: "grid",
  fontSize: CANVAS.T_BODY_SMALL,
  gap: 6,
  lineHeight: 1.45,
  margin: 0,
  paddingLeft: 18,
};
const SEVERITY_PILL_STYLE: CSSProperties = {
  border: "1px solid currentColor",
  borderRadius: 999,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  fontWeight: 800,
  padding: "4px 7px",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};
const SEVERITY_GOOD_STYLE: CSSProperties = {
  background: "#eaf8f3",
  color: "#08715e",
};
const SEVERITY_RISK_STYLE: CSSProperties = {
  background: "#fff4e5",
  color: "#9a5d00",
};
const EMPTY_STYLE: CSSProperties = {
  background: "#fff8e8",
  border: "1px solid #d8a344",
  color: "#6d4b12",
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  padding: 12,
};
const DISCLAIMER_STYLE: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  lineHeight: 1.45,
  margin: 0,
};
