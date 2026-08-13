"use client";

import type { CSSProperties } from "react";
import type {
  SourceVendorResponseCompleteness,
  SourceVendorResponseCompletenessRecord,
} from "@/lib/source/vendor-response-types";
import { CANVAS } from "../canvas-tokens";

const SECTIONS = [
  "Scope",
  "Pricing",
  "Assumptions",
  "Transition",
  "Security",
  "Automation",
  "References",
] as const;

function cellState(
  record: SourceVendorResponseCompletenessRecord,
  section: (typeof SECTIONS)[number],
): "complete" | "clarify" | "missing" {
  const missing = record.missingSections.join(" ").toLowerCase();
  const sectionKey = section.toLowerCase();
  if (
    (sectionKey === "pricing" && record.pricingTemplateStatus !== "complete") ||
    (sectionKey === "transition" &&
      record.transitionPlanStatus !== "complete") ||
    (sectionKey === "security" &&
      record.securityResponseStatus !== "complete") ||
    missing.includes(sectionKey)
  ) {
    return "missing";
  }
  if (
    record.comparabilityStatus === "partially_comparable" ||
    record.evidenceStatus === "Low Confidence"
  ) {
    return "clarify";
  }
  return "complete";
}

function labelFor(state: "complete" | "clarify" | "missing") {
  if (state === "complete") return "Complete";
  if (state === "clarify") return "Clarify";
  return "Missing";
}

export function CompletenessMatrix({
  readiness,
}: {
  readiness?: SourceVendorResponseCompleteness;
}) {
  const records = readiness?.records ?? [];
  return (
    <section data-testid="source-responses-completeness-matrix" style={CARD}>
      <div style={EYEBROW}>Completeness matrix</div>
      <h3 style={TITLE}>Vendor response completeness</h3>
      <p style={COPY}>
        Per vendor by RFP section. Green means complete, amber means
        clarification required, red means missing or non-comparable.
      </p>
      {records.length === 0 ? (
        <div style={EMPTY}>
          <strong>No vendor responses are bound yet.</strong>
          <span>
            Upload received response packs on the Vendor Response Pack artifact;
            Source will parse, list, and track them before evaluation.
          </span>
        </div>
      ) : (
        <div style={SCROLL_WRAP}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Vendor</th>
                {SECTIONS.map((section) => (
                  <th key={section} style={TH}>
                    {section}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.vendorId}>
                  <td style={TD_VENDOR}>
                    <strong>{record.vendorName}</strong>
                    <span>
                      {record.completenessStatus.replaceAll("_", " ")}
                    </span>
                  </td>
                  {SECTIONS.map((section) => {
                    const state = cellState(record, section);
                    return (
                      <td key={section} style={TD_CENTER}>
                        <span style={{ ...PILL, ...STATE[state] }}>
                          {labelFor(state)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 8,
  minWidth: 0,
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
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const EMPTY: CSSProperties = {
  border: `1px dashed ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.SURFACE_HOVER,
  padding: 12,
  display: "grid",
  gap: 4,
  color: CANVAS.INK,
};

// The table is wider than this card's column, so it must scroll inside the
// card. A grid item defaults to min-width:auto, which lets it grow to its
// content instead of scrolling — without minWidth:0 the table pushed its
// badges out over the panel beside it.
const SCROLL_WRAP: CSSProperties = {
  overflowX: "auto",
  minWidth: 0,
};

const TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 720,
};

const TH: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.RULE}`,
  padding: "8px 10px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  textAlign: "center",
};

const TD_VENDOR: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px",
  color: CANVAS.INK,
  display: "grid",
  gap: 2,
};

const TD_CENTER: CSSProperties = {
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  padding: "10px",
  textAlign: "center",
};

const PILL: CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  border: "1px solid",
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const STATE: Record<"complete" | "clarify" | "missing", CSSProperties> = {
  complete: {
    color: CANVAS.ACTIVE,
    borderColor: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
  },
  clarify: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  missing: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
};
