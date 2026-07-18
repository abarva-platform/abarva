"use client";

import type { CSSProperties } from "react";
import {
  buildContractOptimizationStoryPack,
  computeContractOptimizationExposureRollup,
  type ContractOptimizationMveProfile,
} from "@/lib/source/contract-optimization";
import { CANVAS } from "../canvas-tokens";

export function ContractOptimizationProfilePanel({
  profile,
}: {
  profile?: ContractOptimizationMveProfile | null;
}) {
  if (!profile) return null;
  const topFindings = profile.findings.slice(0, 6);
  const topLevers = profile.levers.slice(0, 6);
  const exposure = computeContractOptimizationExposureRollup(profile);
  const storyPack = buildContractOptimizationStoryPack(profile);
  const exposureBars = profile.visualInsights.exposureByDriver
    .filter((driver) => driver.annualImpactHighUsd)
    .slice(0, 4);
  const maxExposure = Math.max(
    1,
    ...exposureBars.map((driver) => driver.annualImpactHighUsd ?? 0),
  );
  const invoiceTrend = profile.visualInsights.invoiceVarianceTrend;
  const latestInvoiceVariance = invoiceTrend.at(-1)?.varianceUsd ?? 0;
  const operationalPressure = profile.visualInsights.operationalPressure;

  return (
    <section
      data-testid="source-contract-optimization-profile"
      style={CARD}
      aria-label="Contract optimization profile with contract baseline, optimization findings, negotiation levers, recommended path, and evidence caveats"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Contract Baseline</div>
          <h3 style={TITLE}>Commercial opportunity map</h3>
          <p style={COPY}>
            Source turns the existing AMS evidence into an executive story:
            what is leaking, why it is happening, what to do now, and what
            happens if Airline Demo renews without a cure gate.
          </p>
          <a
            style={EXPORT_LINK}
            href={`/api/v1/source/${encodeURIComponent(profile.sourceEventId)}/contract-optimization/brief?format=docx`}
          >
            Export DOCX brief
          </a>
          <a
            style={{ ...EXPORT_LINK, marginLeft: 8 }}
            href={`/api/v1/source/${encodeURIComponent(profile.sourceEventId)}/contract-optimization/brief?format=pdf`}
          >
            Export PDF brief
          </a>
        </div>
        <div style={METRICS}>
          <Metric label="Run rate" value={money(profile.contractBaseline.currentAnnualRunRateUsd)} />
          <Metric label="Identified exposure" value={exposure.label.replace(/^approximately\s+/i, "")} />
          <Metric label="Readiness" value={profile.readyForOptimization} />
        </div>
      </div>

      <div style={EXEC_MESSAGE} aria-label="Executive message">
        <div style={EYEBROW}>Executive Message</div>
        <ol style={EXEC_LIST}>
          {storyPack.executiveMessage.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ol>
        <p style={DECISION_ASK}>{storyPack.decisionAsk}</p>
      </div>

      <div style={PATH}>
        <div>
          <div style={EYEBROW}>Recommended Path</div>
          <p style={PATH_LINE}>
            <strong>Immediate:</strong> {profile.recommendedPath.immediateAction}
          </p>
          <p style={PATH_LINE}>
            <strong>Primary:</strong> {profile.recommendedPath.primaryPath}
          </p>
          <p style={PATH_LINE}>
            <strong>Fallback:</strong> {profile.recommendedPath.fallbackPath}
          </p>
          <p style={WARNING_LINE}>
            <strong>Do not:</strong> {profile.recommendedPath.doNotDo}
          </p>
        </div>
      </div>

      <div style={INSIGHT_GRID} aria-label="Executive visual insights">
        <div style={INSIGHT_CARD}>
          <div style={EYEBROW}>Opportunity Map</div>
          <h4 style={INSIGHT_TITLE}>Four ways to turn evidence into value</h4>
          <div style={QUADRANT_GRID}>
            {storyPack.opportunityMap.map((quadrant) => (
              <div key={quadrant.quadrant} style={QUADRANT}>
                <strong>{quadrant.quadrant}</strong>
                <span>{quadrant.items[0]?.title}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={INSIGHT_CARD}>
          <div style={EYEBROW}>Exposure Drivers</div>
          <h4 style={INSIGHT_TITLE}>Where value is leaking</h4>
          <div style={BAR_LIST}>
            {exposureBars.map((driver) => (
              <div key={driver.driver} style={BAR_ROW}>
                <div style={BAR_LABEL}>{shorten(driver.driver)}</div>
                <div style={BAR_TRACK}>
                  <span
                    style={{
                      ...BAR_FILL,
                      width: `${Math.max(8, ((driver.annualImpactHighUsd ?? 0) / maxExposure) * 100)}%`,
                    }}
                  />
                </div>
                <strong style={BAR_VALUE}>{money(driver.annualImpactHighUsd ?? 0)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={INSIGHT_CARD}>
          <div style={EYEBROW}>Invoice Trend</div>
          <h4 style={INSIGHT_TITLE}>Variance is not a one-month anomaly</h4>
          <div style={TREND_ROW}>
            {invoiceTrend.map((row) => (
              <div key={row.month} style={TREND_POINT}>
                <span
                  title={`${row.month}: ${money(row.varianceUsd)} variance`}
                  style={{
                    ...TREND_BAR,
                    height: `${Math.max(12, Math.min(54, row.variancePct * 8))}px`,
                  }}
                />
                <span>{row.month.slice(5)}</span>
              </div>
            ))}
          </div>
          <p style={MINI_COPY}>Latest sampled variance: {money(latestInvoiceVariance)}</p>
        </div>

        <div style={INSIGHT_CARD}>
          <div style={EYEBROW}>Operational Pressure</div>
          <h4 style={INSIGHT_TITLE}>Demand and quality signals are above baseline</h4>
          <table style={MINI_TABLE}>
            <tbody>
              {operationalPressure.map((metric) => (
                <tr key={metric.metric}>
                  <td>{metric.metric}</td>
                  <td>{metric.current.toLocaleString("en-US", { maximumFractionDigits: 1 })}</td>
                  <td style={{ color: CANVAS.BLOCKED, fontWeight: 800 }}>
                    +{metric.deltaPct.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={STORY_GRID} aria-label="Advisory story pack">
        <div style={PANEL}>
          <div style={EYEBROW}>Why It Is Happening</div>
          <p style={ROW_TEXT}>{storyPack.whyItIsHappening}</p>
        </div>
        <div style={PANEL}>
          <div style={EYEBROW}>If We Do Nothing</div>
          <p style={ROW_TEXT}>{storyPack.scenarios[0]?.commercialEffect}</p>
          <p style={ROW_TEXT}>{storyPack.scenarios[0]?.riskEffect}</p>
        </div>
      </div>

      <div style={PANEL}>
        <div style={PANEL_HEAD}>
          <div style={EYEBROW}>Decision Timeline</div>
          <p style={MINI_COPY}>Executives need a clock, not just findings.</p>
        </div>
        <div style={TIMELINE}>
          {storyPack.actionTimeline.map((step) => (
            <div key={step.label} style={TIMELINE_STEP}>
              <strong>{step.label}</strong>
              <span>{step.timing}</span>
              <p>{step.decision}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={GRID}>
        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <div style={EYEBROW}>Optimization Findings</div>
            <p style={MINI_COPY}>Evidence-backed issues to cure before renewal.</p>
          </div>
          <div style={ROW_LIST}>
            {topFindings.map((finding) => (
              <article key={finding.findingId} style={ROW}>
                <div style={ROW_TOP}>
                  <strong style={ROW_TITLE}>{finding.title}</strong>
                  <span style={{ ...PILL, ...severityTone(finding.severity) }}>
                    {finding.severity}
                  </span>
                </div>
                <p style={ROW_TEXT}>{finding.currentState}</p>
                <p style={ROW_TEXT}>{finding.sourcingImplication}</p>
              </article>
            ))}
          </div>
        </div>

        <div style={PANEL}>
          <div style={PANEL_HEAD}>
            <div style={EYEBROW}>Negotiation Levers</div>
            <p style={MINI_COPY}>Buyer asks tied directly to the findings.</p>
          </div>
          <div style={ROW_LIST}>
            {topLevers.map((lever) => (
              <article key={lever.leverId} style={ROW}>
                <div style={ROW_TOP}>
                  <strong style={ROW_TITLE}>{lever.buyerAsk}</strong>
                  <span style={LEVER_TYPE}>{urgencyLabel(lever.priority)}</span>
                </div>
                <p style={ROW_TEXT}>{lever.negotiationLanguage}</p>
                <p style={ROW_META}>
                  {lever.valueBasis.replaceAll("_", " ")}
                  {lever.annualImpactHighUsd
                    ? ` · up to ${money(lever.annualImpactHighUsd)}`
                    : " · value to test"}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div style={FOOTER}>
        <div>
          <div style={EYEBROW}>Evidence Caveats</div>
          <p style={MINI_COPY}>
            {profile.contractBaseline.evidenceCount} evidence item(s) bound.
            {profile.syntheticDemo ? " Synthetic demo evidence is clearly labelled." : null}
          </p>
        </div>
        <ul style={GAP_LIST}>
          {(profile.clientToComplete.length
            ? profile.clientToComplete
            : ["No minimum evidence gaps detected for a draft optimization workshop."]
          ).map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function money(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(value / 1_000)}K`;
}

function shorten(value: string): string {
  return value
    .replace(/^Recover or credit unsupported\s+/i, "Recover ")
    .replace(/^True up underfilled\s+/i, "True up ")
    .replace(/^Convert approved recurring\s+/i, "Catalog ")
    .replace(/^Increase\s+/i, "Increase ");
}

function urgencyLabel(
  priority: ContractOptimizationMveProfile["levers"][number]["priority"],
): string {
  if (priority === "P0") return "Immediate";
  if (priority === "P1") return "Before renewal notice";
  return "Post-cure governance";
}

function severityTone(
  severity: ContractOptimizationMveProfile["findings"][number]["severity"],
): CSSProperties {
  if (severity === "high") return BAD;
  if (severity === "medium") return WARN;
  return GOOD;
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
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 16,
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
  lineHeight: 1.12,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 820,
};

const EXPORT_LINK: CSSProperties = {
  display: "inline-flex",
  marginTop: 10,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: "7px 10px",
  color: CANVAS.INK,
  textDecoration: "none",
  fontSize: CANVAS.T_BODY_SMALL,
  fontWeight: 700,
};

const METRICS: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  justifyContent: "flex-end",
};

const METRIC: CSSProperties = {
  minWidth: 96,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 8,
  padding: "7px 10px",
  display: "grid",
  gap: 2,
  textAlign: "right",
  color: CANVAS.INK,
};

const PATH: CSSProperties = {
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(29,158,117,0.06)",
  padding: 12,
};

const EXEC_MESSAGE: CSSProperties = {
  border: `1px solid rgba(11,31,68,0.16)`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "linear-gradient(135deg, rgba(11,31,68,0.04), rgba(29,158,117,0.07))",
  padding: 13,
  display: "grid",
  gap: 8,
};

const EXEC_LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  color: CANVAS.INK,
  fontSize: 14,
  lineHeight: 1.48,
};

const DECISION_ASK: CSSProperties = {
  margin: 0,
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 8,
  color: CANVAS.INK,
  fontWeight: 800,
  fontSize: CANVAS.T_BODY_SMALL,
};

const PATH_LINE: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const WARNING_LINE: CSSProperties = {
  ...PATH_LINE,
  color: CANVAS.BLOCKED,
};

const INSIGHT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 10,
};

const INSIGHT_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 12,
  background: "rgba(255,255,255,0.72)",
  display: "grid",
  gap: 8,
  alignContent: "start",
};

const QUADRANT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const QUADRANT: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: 9,
  display: "grid",
  gap: 4,
  minHeight: 72,
  color: CANVAS.INK,
  fontSize: 12,
  lineHeight: 1.25,
};

const INSIGHT_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 18,
  lineHeight: 1.16,
  color: CANVAS.INK,
};

const BAR_LIST: CSSProperties = {
  display: "grid",
  gap: 8,
};

const BAR_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(100px, 1.1fr) minmax(80px, 1fr) 52px",
  gap: 8,
  alignItems: "center",
};

const BAR_LABEL: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.2,
  color: CANVAS.INK,
};

const BAR_TRACK: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "rgba(11,31,68,0.08)",
  overflow: "hidden",
};

const BAR_FILL: CSSProperties = {
  display: "block",
  height: "100%",
  borderRadius: 999,
  background: CANVAS.ACTIVE,
};

const BAR_VALUE: CSSProperties = {
  textAlign: "right",
  fontSize: 12,
  color: CANVAS.INK,
};

const TREND_ROW: CSSProperties = {
  minHeight: 64,
  display: "flex",
  alignItems: "end",
  gap: 7,
};

const TREND_POINT: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 4,
  fontSize: 10,
  color: CANVAS.INK_MUTED,
};

const TREND_BAR: CSSProperties = {
  width: 13,
  borderRadius: "8px 8px 2px 2px",
  background: CANVAS.ACTIVE,
};

const MINI_TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
  color: CANVAS.INK,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 12,
};

const STORY_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(255,255,255,0.5)",
  padding: 12,
  display: "grid",
  gap: 11,
};

const PANEL_HEAD: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  paddingBottom: 9,
};

const TIMELINE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 9,
};

const TIMELINE_STEP: CSSProperties = {
  borderLeft: `3px solid ${CANVAS.ACTIVE}`,
  background: "rgba(29,158,117,0.05)",
  borderRadius: 8,
  padding: 9,
  display: "grid",
  gap: 4,
  color: CANVAS.INK,
  fontSize: 12,
  lineHeight: 1.35,
};

const MINI_COPY: CSSProperties = {
  margin: "5px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const ROW_LIST: CSSProperties = {
  display: "grid",
  gap: 9,
};

const ROW: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: CANVAS.CARD,
  padding: 10,
  display: "grid",
  gap: 7,
};

const ROW_TOP: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 8,
  alignItems: "start",
};

const ROW_TITLE: CSSProperties = {
  color: CANVAS.INK,
  fontSize: 13,
  lineHeight: 1.25,
};

const ROW_TEXT: CSSProperties = {
  margin: 0,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const ROW_META: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const LEVER_TYPE: CSSProperties = {
  ...PILL,
  borderColor: "rgba(29,158,117,0.35)",
  background: "rgba(29,158,117,0.09)",
  color: CANVAS.ACTIVE,
};

const GOOD: CSSProperties = {
  borderColor: "rgba(29,158,117,0.35)",
  background: "rgba(29,158,117,0.09)",
  color: CANVAS.ACTIVE,
};

const WARN: CSSProperties = {
  borderColor: "rgba(186,117,23,0.35)",
  background: "rgba(186,117,23,0.09)",
  color: CANVAS.WAITING,
};

const BAD: CSSProperties = {
  borderColor: "rgba(176,61,61,0.35)",
  background: "rgba(176,61,61,0.08)",
  color: CANVAS.BLOCKED,
};

const FOOTER: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 11,
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 420px)",
  gap: 12,
};

const GAP_LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};
