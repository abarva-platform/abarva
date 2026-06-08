"use client";

import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";
import {
  LOADER_DIMENSIONS,
  classifyConfidence,
  type LoaderDimension,
  type MappingProposal,
  type StewardFinding,
} from "@/lib/context-ingestion/loader/contract";

/**
 * ReviewTable — the "Here's what I found" table.
 *
 * One row per uploaded file: the filename, a pre-filled dimension
 * dropdown (the loader's best guess, operator can correct), the count
 * of facts/field-mappings found, a confidence chip, inline Steward
 * finding flags, and a per-row action. Pure presentational: it renders
 * `MappingProposal[]` and emits dimension-change / action events.
 *
 * Locked design system: cream surface, near-black ink, hairline
 * borders, one accent (amber = needs attention). Confidence and
 * findings are calm pills, never decorative filled blocks.
 */

export const LOADER_DIMENSION_LABELS: Record<LoaderDimension, string> = {
  leadership_org: "Leadership & org",
  kpis: "KPIs",
  applications_systems: "Applications & systems",
  data_analytics_stack: "Data & analytics stack",
  integrations: "Integrations",
  vendors_contracts: "Vendors & contracts",
  business_units_geographies: "Business units & geographies",
  initiatives_roadmap: "Initiatives & roadmap",
  risks_controls: "Risks & controls",
  financial_baseline: "Financial baseline",
  processes_operating_model: "Processes & operating model",
  infrastructure_estate: "Infrastructure estate",
  business_capability: "Business capability",
  unknown: "Unknown",
};

export type ReviewRowAction = "commit" | "skip";

export interface ReviewTableProps {
  /** One proposal per uploaded file. */
  proposals: MappingProposal[];
  /** Steward findings keyed by source objectKey. */
  findingsByObjectKey?: Record<string, StewardFinding[]>;
  /** Operator corrected (or confirmed) a row's dimension. */
  onDimensionChange?: (objectKey: string, dimension: LoaderDimension) => void;
  /** Operator chose a per-row action (commit / skip). */
  onRowAction?: (objectKey: string, action: ReviewRowAction) => void;
  /** Object keys currently disabled (e.g. mid-commit). */
  busyObjectKeys?: string[];
  className?: string;
}

function confidenceTone(confidence: number): {
  label: string;
  color: string;
  background: string;
} {
  switch (classifyConfidence(confidence)) {
    case "auto":
      return { label: "High", color: COLORS.mintInk, background: COLORS.mintSoft };
    case "confirm":
      return { label: "Confirm", color: COLORS.amberInk, background: COLORS.amberSoft };
    case "ask":
    default:
      return { label: "Needs you", color: COLORS.coralInk, background: COLORS.coralSoft };
  }
}

function severityTone(severity: StewardFinding["severity"]): {
  color: string;
  background: string;
} {
  switch (severity) {
    case "block":
      return { color: COLORS.coralInk, background: COLORS.coralSoft };
    case "warn":
      return { color: COLORS.amberInk, background: COLORS.amberSoft };
    case "info":
    default:
      return { color: `${COLORS.ink}99`, background: COLORS.white };
  }
}

const cellStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: `1px solid ${COLORS.ink}12`,
  fontSize: 13,
  color: COLORS.ink,
  verticalAlign: "top",
};

const headStyle: React.CSSProperties = {
  ...cellStyle,
  borderBottom: `1px solid ${COLORS.ink}22`,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: `${COLORS.ink}99`,
  textAlign: "left",
};

export function ReviewTable({
  proposals,
  findingsByObjectKey = {},
  onDimensionChange,
  onRowAction,
  busyObjectKeys = [],
  className,
}: ReviewTableProps) {
  const busy = new Set(busyObjectKeys);

  if (proposals.length === 0) {
    return (
      <div
        className={className}
        style={{
          border: `1px solid ${COLORS.ink}1A`,
          borderRadius: RADIUS.lg,
          background: COLORS.cream,
          padding: "32px 24px",
          textAlign: "center",
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}99`,
        }}
      >
        Nothing to review yet. Add data above and I&rsquo;ll show what I find.
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        border: `1px solid ${COLORS.ink}1A`,
        borderRadius: RADIUS.lg,
        background: COLORS.white,
        overflow: "hidden",
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <caption
          style={{
            captionSide: "top",
            textAlign: "left",
            padding: "16px 14px 10px",
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
          }}
        >
          Here&rsquo;s what I found
        </caption>
        <thead>
          <tr>
            <th scope="col" style={headStyle}>File</th>
            <th scope="col" style={headStyle}>Dimension</th>
            <th scope="col" style={headStyle}>Facts</th>
            <th scope="col" style={headStyle}>Confidence</th>
            <th scope="col" style={headStyle}>Findings</th>
            <th scope="col" style={headStyle}>Action</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => {
            const objectKey = proposal.source.objectKey;
            const isBusy = busy.has(objectKey);
            const conf = confidenceTone(proposal.dimensionConfidence);
            const findings = findingsByObjectKey[objectKey] ?? [];
            const factCount = proposal.fieldMappings.length;
            return (
              <tr key={objectKey}>
                <td style={cellStyle}>
                  <div style={{ fontWeight: 500 }}>{proposal.source.filename}</div>
                  <div style={{ fontSize: 11, color: `${COLORS.ink}80`, marginTop: 2 }}>
                    {proposal.reviewRequired
                      ? "Review required — won't auto-commit"
                      : "Structured — eligible to commit"}
                  </div>
                </td>
                <td style={cellStyle}>
                  <label className="sr-only" htmlFor={`dim-${objectKey}`}>
                    Dimension for {proposal.source.filename}
                  </label>
                  <select
                    id={`dim-${objectKey}`}
                    value={proposal.dimension}
                    disabled={isBusy || !onDimensionChange}
                    onChange={(event) =>
                      onDimensionChange?.(
                        objectKey,
                        event.target.value as LoaderDimension,
                      )
                    }
                    style={{
                      border: `1px solid ${COLORS.ink}33`,
                      borderRadius: RADIUS.sm,
                      padding: "6px 8px",
                      background: COLORS.white,
                      color: COLORS.ink,
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      minWidth: 180,
                      cursor: isBusy ? "not-allowed" : "pointer",
                    }}
                  >
                    {LOADER_DIMENSIONS.map((dimension) => (
                      <option key={dimension} value={dimension}>
                        {LOADER_DIMENSION_LABELS[dimension]}
                      </option>
                    ))}
                    {proposal.dimension === "unknown" ? (
                      <option value="unknown">
                        {LOADER_DIMENSION_LABELS.unknown}
                      </option>
                    ) : null}
                  </select>
                </td>
                <td style={cellStyle}>
                  <span style={{ fontWeight: 500 }}>{factCount}</span>
                  <span style={{ color: `${COLORS.ink}80` }}>
                    {factCount === 1 ? " field" : " fields"}
                  </span>
                </td>
                <td style={cellStyle}>
                  <span
                    title={`${Math.round(proposal.dimensionConfidence * 100)}% confident`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: RADIUS.pill,
                      border: `1px solid ${conf.color}33`,
                      background: conf.background,
                      color: conf.color,
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    {conf.label}
                  </span>
                </td>
                <td style={cellStyle}>
                  {findings.length === 0 ? (
                    <span style={{ color: `${COLORS.ink}66`, fontSize: 12 }}>None</span>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {findings.map((finding, idx) => {
                        const tone = severityTone(finding.severity);
                        return (
                          <span
                            key={`${finding.kind}-${idx}`}
                            title={finding.suggestedAction ?? finding.kind}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "3px 8px",
                              borderRadius: RADIUS.sm,
                              border: `1px solid ${tone.color}33`,
                              background: tone.background,
                              color: tone.color,
                              fontSize: 12,
                              lineHeight: 1.3,
                            }}
                          >
                            <span
                              aria-hidden
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 0.3,
                                opacity: 0.8,
                              }}
                            >
                              {finding.severity}
                            </span>
                            {finding.message}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td style={cellStyle}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      disabled={isBusy || !onRowAction}
                      onClick={() => onRowAction?.(objectKey, "commit")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: RADIUS.sm,
                        border: "none",
                        background: COLORS.ink,
                        color: COLORS.white,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      {isBusy ? "Working…" : "Commit"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy || !onRowAction}
                      onClick={() => onRowAction?.(objectKey, "skip")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: RADIUS.sm,
                        border: `1px solid ${COLORS.ink}33`,
                        background: "transparent",
                        color: COLORS.ink,
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: isBusy ? "not-allowed" : "pointer",
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      Skip
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ReviewTable;
