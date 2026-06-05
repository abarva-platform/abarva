"use client";

import type { CSSProperties } from "react";
import { CANVAS } from "../canvas-tokens";

type ShortlistVendor = {
  name: string;
  status: "Candidate" | "Invited" | "Declined";
  rationale: string;
};

const DEFAULT_VENDORS: ShortlistVendor[] = [
  {
    name: "Incumbent AMS provider",
    status: "Candidate",
    rationale: "Baseline economics and transition risk comparator.",
  },
  {
    name: "Retail AMS challenger",
    status: "Candidate",
    rationale: "Comparable scale and retail application operations proof.",
  },
  {
    name: "Specialist integration partner",
    status: "Candidate",
    rationale: "Tests whether a narrower partner model reduces risk.",
  },
];

export function VendorShortlistPanel({
  vendors = DEFAULT_VENDORS,
}: {
  vendors?: ShortlistVendor[];
}) {
  return (
    <div data-testid="source-rfp-vendor-shortlist" style={WRAP_STYLE}>
      <div style={EYEBROW_STYLE}>Vendor shortlist</div>
      <h3 style={TITLE_STYLE}>Invite list draft</h3>
      <p style={COPY_STYLE}>
        Candidate status is internal. AbarVa drafts invite and Q&amp;A language;
        the procurement system remains the system of record for external release.
      </p>
      <div style={LIST_STYLE}>
        {vendors.map((vendor) => (
          <article key={vendor.name} style={ROW_STYLE}>
            <div>
              <div style={NAME_STYLE}>{vendor.name}</div>
              <div style={RATIONALE_STYLE}>{vendor.rationale}</div>
            </div>
            <span style={STATUS_STYLE}>{vendor.status}</span>
          </article>
        ))}
      </div>
      <div style={FOOTER_STYLE}>
        <span>Q&amp;A protocol: one shared window, symmetric responses, no side-channel answers.</span>
      </div>
    </div>
  );
}

const WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: "-4px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  fontWeight: 400,
  color: CANVAS.INK,
};

const COPY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
};

const ROW_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  padding: 12,
};

const NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 800,
  color: CANVAS.INK,
};

const RATIONALE_STYLE: CSSProperties = {
  marginTop: 4,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: CANVAS.INK_SOFT,
};

const STATUS_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "4px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  whiteSpace: "nowrap",
};

const FOOTER_STYLE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 10,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};
