"use client";

import type { CSSProperties } from "react";
import type { ContractOptimizationMveProfile } from "@/lib/source/contract-optimization";
import { CANVAS } from "../canvas-tokens";

export function ContractOptimizationProfilePanel({
  profile,
}: {
  profile?: ContractOptimizationMveProfile | null;
}) {
  if (!profile) return null;
  const topFindings = profile.findings.slice(0, 6);
  const topLevers = profile.levers.slice(0, 6);
  const evidencedImpact = profile.levers.reduce(
    (sum, lever) => sum + (lever.annualImpactHighUsd ?? 0),
    0,
  );

  return (
    <section
      data-testid="source-contract-optimization-profile"
      style={CARD}
      aria-label="Contract optimization profile with contract baseline, optimization findings, negotiation levers, recommended path, and evidence caveats"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Contract Baseline</div>
          <h3 style={TITLE}>Incumbent contract optimization record</h3>
          <p style={COPY}>
            Source extracts only the sourcing-critical evidence needed to decide
            whether to renegotiate, renew with cure conditions, or prepare a
            competitive event.
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
          <Metric label="Evidenced exposure" value={money(evidencedImpact)} />
          <Metric label="Readiness" value={profile.readyForOptimization} />
        </div>
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

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
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
