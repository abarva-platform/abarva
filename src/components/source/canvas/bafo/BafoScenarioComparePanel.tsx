"use client";

import type { CSSProperties } from "react";
import type {
  BafoScenarioRisk,
  BafoScenarioType,
  BafoVendorScenario,
  BafoVendorScenarioSet,
} from "@/lib/source/bafo-scenario-compare-view";
import { CANVAS } from "../canvas-tokens";

export function BafoScenarioComparePanel({
  view,
}: {
  view: {
    headline: string;
    contextLine: string;
    vendorSets: BafoVendorScenarioSet[];
    compareActionLabel: string;
    compareActionDisabledReason: string;
    honestDisclaimer: string;
  };
}) {
  const quantifiedBaseUpside = view.vendorSets.reduce((sum, vendor) => {
    const base = vendor.scenarios.find(
      (scenario) => scenario.scenarioType === "base",
    );
    return sum + (base?.totalEstimatedSavingUsd ?? 0);
  }, 0);
  const blockedVendors = view.vendorSets.filter(
    (vendor) => vendor.hasActiveBlocker,
  ).length;

  return (
    <section
      data-testid="source-bafo-scenario-compare"
      style={CARD}
      aria-label="BAFO scenario compare"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>BAFO scenario compare</div>
          <h3 style={TITLE}>{view.headline}</h3>
          <p style={COPY}>{view.contextLine}</p>
        </div>
        <button
          type="button"
          disabled
          title={view.compareActionDisabledReason}
          style={DISABLED_ACTION}
        >
          {view.compareActionLabel}
        </button>
      </div>

      <div style={SUMMARY_STRIP}>
        <SummaryMetric
          label="Base-case upside to test"
          value={formatUsd(quantifiedBaseUpside)}
          helper="Directional annualized levers only"
        />
        <SummaryMetric
          label="Vendors with blockers"
          value={`${blockedVendors}/${view.vendorSets.length}`}
          helper="Resolve before using price leverage"
        />
        <SummaryMetric
          label="Next move"
          value="Clarify"
          helper="Turn gaps into vendor-specific BAFO asks"
        />
      </div>

      <div style={VENDOR_LIST}>
        {view.vendorSets.map((vendor) => (
          <VendorScenarioRow key={vendor.vendorId} vendor={vendor} />
        ))}
      </div>

      <div style={DISCLAIMER}>{view.honestDisclaimer}</div>
    </section>
  );
}

function VendorScenarioRow({ vendor }: { vendor: BafoVendorScenarioSet }) {
  const strongestScenario = vendor.scenarios.reduce((best, scenario) =>
    scenario.totalEstimatedSavingUsd > best.totalEstimatedSavingUsd
      ? scenario
      : best,
  );

  return (
    <article style={VENDOR_ROW}>
      <div style={VENDOR_HEAD}>
        <div>
          <div style={VENDOR_NAME}>{vendor.vendorName}</div>
          <div style={SMALL_COPY}>
            Current YR2+ run cost: {formatUsd(vendor.currentAnnualRunCostUsd)}
          </div>
        </div>
        <span style={vendor.hasActiveBlocker ? BLOCKED_TAG : READY_TAG}>
          {vendor.hasActiveBlocker ? "blocked" : "usable"}
        </span>
      </div>

      <div style={VENDOR_BODY}>
        <div style={LEFT_RAIL}>
          <div style={RAIL_LABEL}>Best useful ask</div>
          <strong style={RAIL_VALUE}>{strongestScenario.label}</strong>
          <p style={SMALL_COPY}>{strongestScenario.nextAction}</p>
          {vendor.blockerNote ? (
            <div style={BLOCKER_BOX}>
              <strong>Blocked</strong>
              <span>{vendor.blockerNote}</span>
            </div>
          ) : (
            <div style={READY_BOX}>
              <strong>Known</strong>
              <span>No active blocker in the deterministic scenario set.</span>
            </div>
          )}
        </div>
        <div style={SCENARIO_GRID}>
          {vendor.scenarios.map((scenario) => (
            <ScenarioCard
              key={`${vendor.vendorId}-${scenario.scenarioType}`}
              scenario={scenario}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function ScenarioCard({ scenario }: { scenario: BafoVendorScenario }) {
  const quantifiedLevers = scenario.levers.filter(
    (lever) => lever.savingQuantified,
  );
  const leadLever = scenario.levers[0];

  return (
    <div style={SCENARIO_CARD}>
      <div style={SCENARIO_HEAD}>
        <span style={scenarioTagStyle(scenario.scenarioType)}>
          {scenario.label}
        </span>
        <span style={riskTagStyle(scenario.riskLevel)}>
          {scenario.riskLevel}
        </span>
      </div>
      <div style={SCENARIO_VALUE}>
        {formatUsd(scenario.totalEstimatedSavingUsd)}
      </div>
      <div style={SMALL_COPY}>{scenario.probabilityLabel}</div>
      <dl style={ASK_LIST}>
        <div>
          <dt>Ask</dt>
          <dd>{leadLever?.label ?? "No BAFO ask available."}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>
            {quantifiedLevers.length > 0
              ? `${quantifiedLevers.length} quantified lever${
                  quantifiedLevers.length === 1 ? "" : "s"
                }`
              : "Not quantified yet"}
          </dd>
        </div>
        <div>
          <dt>Caveat</dt>
          <dd>{scenario.caveat}</dd>
        </div>
      </dl>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={SUMMARY_METRIC}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function formatUsd(value: number): string {
  if (value <= 0) return "Not quantified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function scenarioTagStyle(type: BafoScenarioType): CSSProperties {
  if (type === "conservative") return CONSERVATIVE_TAG;
  if (type === "stretch") return STRETCH_TAG;
  return BASE_TAG;
}

function riskTagStyle(risk: BafoScenarioRisk): CSSProperties {
  if (risk === "low") return READY_TAG;
  if (risk === "high") return BLOCKED_TAG;
  return REVIEW_TAG;
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
  display: "grid",
  gap: 14,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
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
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  lineHeight: 1.08,
  color: CANVAS.INK,
  fontWeight: 400,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const SMALL_COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const DISABLED_ACTION: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.INK,
  color: CANVAS.CARD,
  padding: "10px 13px",
  fontSize: CANVAS.T_BODY_SMALL,
  fontWeight: 700,
  opacity: 0.42,
  cursor: "not-allowed",
  whiteSpace: "nowrap",
};

const SUMMARY_STRIP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  overflow: "hidden",
};

const SUMMARY_METRIC: CSSProperties = {
  display: "grid",
  gap: 3,
  padding: 12,
  borderLeft: `1px solid ${CANVAS.RULE}`,
  background: CANVAS.PAGE_BG,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
};

const VENDOR_LIST: CSSProperties = {
  display: "grid",
  gap: 10,
};

const VENDOR_ROW: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  overflow: "hidden",
};

const VENDOR_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "start",
  padding: "12px 14px",
  borderBottom: `1px solid ${CANVAS.RULE}`,
};

const VENDOR_NAME: CSSProperties = {
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY,
  fontWeight: 800,
};

const VENDOR_BODY: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 0,
};

const LEFT_RAIL: CSSProperties = {
  borderRight: `1px solid ${CANVAS.RULE}`,
  padding: 14,
  display: "grid",
  gap: 9,
  alignContent: "start",
};

const RAIL_LABEL: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};

const RAIL_VALUE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 18,
};

const SCENARIO_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
};

const SCENARIO_CARD: CSSProperties = {
  padding: 12,
  borderLeft: `1px solid ${CANVAS.RULE}`,
  display: "grid",
  gap: 9,
  alignContent: "start",
};

const SCENARIO_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  alignItems: "start",
};

const SCENARIO_VALUE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 23,
  lineHeight: 1,
  color: CANVAS.INK,
};

const ASK_LIST: CSSProperties = {
  margin: 0,
  display: "grid",
  gap: 8,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.38,
};

const BOX_BASE: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 10,
  display: "grid",
  gap: 3,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
};

const READY_BOX: CSSProperties = {
  ...BOX_BASE,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const BLOCKER_BOX: CSSProperties = {
  ...BOX_BASE,
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
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

const READY_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const REVIEW_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const BLOCKED_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.BLOCKED,
  borderColor: CANVAS.BLOCKED,
  background: "rgba(163,45,45,0.06)",
};

const CONSERVATIVE_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.INK_SOFT,
  borderColor: CANVAS.RULE,
  background: CANVAS.CARD,
};

const BASE_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.ACTIVE,
  borderColor: CANVAS.ACTIVE,
  background: "rgba(29,158,117,0.06)",
};

const STRETCH_TAG: CSSProperties = {
  ...TAG_BASE,
  color: CANVAS.WAITING,
  borderColor: CANVAS.WAITING,
  background: "rgba(186,117,23,0.06)",
};

const DISCLAIMER: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 11,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};
