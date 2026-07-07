"use client";

import type { CSSProperties, ReactNode } from "react";
import { CANVAS } from "../canvas-tokens";
import { ApplicationInventoryTable } from "./ApplicationInventoryTable";

export function ScopeStageView({
  documentWorkspace,
}: {
  documentWorkspace: ReactNode;
}) {
  return (
    <div data-testid="source-scope-stage-view" style={WRAP_STYLE}>
      <section aria-labelledby="source-scope-title" style={SECTION_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>What this stage settles</div>
          <h2 id="source-scope-title" style={TITLE_STYLE}>
            Scope readiness
          </h2>
        </div>
        <div style={GRID_STYLE}>
          <ApplicationInventoryTable />
          <ScopeDependencyPanel />
        </div>
      </section>
      <RetainedOrgPanel />
      <section
        data-testid="source-scope-document-workspace"
        aria-label="Scope document workspace"
        style={DOCUMENT_STYLE}
      >
        {documentWorkspace}
      </section>
    </div>
  );
}

function ScopeDependencyPanel() {
  return (
    <div data-testid="source-scope-dependency-list" style={CARD_STYLE}>
      <div style={EYEBROW_STYLE}>Dependency list</div>
      <h3 style={CARD_TITLE_STYLE}>Review before RFP</h3>
      <p style={COPY_STYLE}>
        V1 uses a plain dependency list instead of a graph so the sourcing lead
        can verify provenance before vendor release.
      </p>
      <details open>
        <summary style={SUMMARY_STYLE}>Application dependencies</summary>
        <ul style={LIST_STYLE}>
          <li>SAP ECC support depends on Basis, integrations, and batch operations.</li>
          <li>Sterling OMS integrations depend on retail order APIs and peak-season freeze windows.</li>
          <li>NCR POS support depends on store-hours coverage and field escalation paths.</li>
        </ul>
      </details>
    </div>
  );
}

function RetainedOrgPanel() {
  return (
    <section data-testid="source-scope-retained-org" style={CARD_STYLE}>
      <div style={EYEBROW_STYLE}>Retained organization</div>
      <h3 style={CARD_TITLE_STYLE}>Assumptions to confirm</h3>
      <div style={ASSUMPTION_GRID_STYLE}>
        {[
          ["CIO Office", "Owns final scope boundary and application exclusions."],
          ["Enterprise Architecture", "Confirms upstream/downstream dependency list."],
          ["Finance", "Owns baseline spend, run-rate, and savings target."],
        ].map(([owner, note]) => (
          <div key={owner} style={ASSUMPTION_STYLE}>
            <strong>{owner}</strong>
            <span>{note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 18,
};

const SECTION_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
};

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
  gap: 12,
};

const EYEBROW_STYLE: CSSProperties = {
  marginBottom: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.16,
  fontWeight: 400,
  color: CANVAS.INK,
};

const CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 16,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "#fff",
};

const CARD_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
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

const SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: CANVAS.INK,
};

const LIST_STYLE: CSSProperties = {
  margin: "8px 0 0",
  paddingLeft: 18,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: CANVAS.INK_SOFT,
};

const ASSUMPTION_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const ASSUMPTION_STYLE: CSSProperties = {
  display: "grid",
  gap: 5,
  padding: 12,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.4,
  color: CANVAS.INK_SOFT,
};

const DOCUMENT_STYLE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 16,
};
