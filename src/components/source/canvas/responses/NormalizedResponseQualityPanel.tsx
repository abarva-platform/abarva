"use client";

import type { CSSProperties } from "react";

import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import { CANVAS } from "../canvas-tokens";

export function NormalizedResponseQualityPanel({
  packages,
}: {
  packages?: readonly NormalizedVendorResponsePackage[];
}) {
  if (!packages?.length) return null;

  return (
    <section
      data-testid="source-normalized-response-quality"
      style={PANEL}
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Normalized response control</div>
          <h3 style={TITLE}>Requirement-level comparability</h3>
        </div>
        <p style={COPY}>
          These scores test whether submitted answers are complete and traceable.
          They do not score vendor merit or infer savings.
        </p>
      </div>

      <div style={PACKAGE_LIST}>
        {packages.map((responsePackage) => {
          const a = responsePackage.analytics;
          return (
            <article key={responsePackage.artifactId} style={PACKAGE_CARD}>
              <div style={PACKAGE_HEADING}>
                <div>
                  <strong style={VENDOR}>{responsePackage.vendorName}</strong>
                  <div style={FILE}>{responsePackage.originalName}</div>
                </div>
                <span style={{ ...STATUS, ...STATUS_TONE[a.readyForEvaluation] }}>
                  {a.readyForEvaluation === "yes"
                    ? "Ready for evaluation"
                    : a.readyForEvaluation === "conditional"
                      ? "Conditional"
                      : "Not ready"}
                </span>
              </div>
              <div style={METRICS}>
                <Metric label="Requirements" value={String(a.requirementCount)} />
                <Metric label="Addressed" value={`${a.requirementCoverageScore}%`} />
                <Metric label="Mandatory" value={`${a.mandatoryCompletenessScore}%`} />
                <Metric label="Evidence" value={`${a.evidenceCoverageScore}%`} />
                <Metric label="Pricing links" value={`${a.pricingTraceabilityScore}%`} />
                <Metric label="SLA links" value={`${a.slaTraceabilityScore}%`} />
                <Metric label="Exceptions" value={`${a.exceptionDisclosureScore}%`} />
                <Metric label="Criteria" value={`${a.criterionLinkageScore}%`} />
              </div>
              {a.nonConformances.length ? (
                <div style={FINDING}>
                  <strong>{a.nonConformances.length} control issue(s)</strong>
                  <span>{a.nonConformances.slice(0, 3).join(" ")}</span>
                </div>
              ) : (
                <div style={{ ...FINDING, borderColor: CANVAS.ACTIVE }}>
                  <strong>No normalized-response control gaps detected.</strong>
                  <span>Commercial conclusions still require evaluation evidence.</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={METRIC}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const PANEL: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
  display: "grid",
  gap: 14,
};
const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  alignItems: "end",
};
const EYEBROW: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
};
const TITLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
};
const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};
const PACKAGE_LIST: CSSProperties = { display: "grid", gap: 10 };
const PACKAGE_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: 14,
  display: "grid",
  gap: 12,
};
const PACKAGE_HEADING: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
};
const VENDOR: CSSProperties = { fontSize: 15, color: CANVAS.INK };
const FILE: CSSProperties = {
  marginTop: 3,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_MICRO,
};
const STATUS: CSSProperties = {
  borderRadius: 999,
  padding: "5px 9px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};
const STATUS_TONE: Record<"yes" | "conditional" | "no", CSSProperties> = {
  yes: { background: "rgba(26,143,108,0.12)", color: CANVAS.ACTIVE },
  conditional: { background: "rgba(186,117,23,0.12)", color: CANVAS.WAITING },
  no: { background: "rgba(181,53,53,0.10)", color: CANVAS.BLOCKED },
};
const METRICS: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  border: `1px solid ${CANVAS.RULE}`,
};
const METRIC: CSSProperties = {
  minWidth: 0,
  padding: 10,
  borderRight: `1px solid ${CANVAS.RULE}`,
  display: "grid",
  gap: 3,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_MICRO,
};
const FINDING: CSSProperties = {
  borderLeft: `3px solid ${CANVAS.WAITING}`,
  background: CANVAS.PAGE_BG,
  padding: "9px 11px",
  display: "grid",
  gap: 3,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};
