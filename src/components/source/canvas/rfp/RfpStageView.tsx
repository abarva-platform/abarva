"use client";

import type { CSSProperties, ReactNode } from "react";
import { CANVAS } from "../canvas-tokens";
import { EvalRubricTable } from "./EvalRubricTable";
import { VendorShortlistPanel } from "./VendorShortlistPanel";

export function RfpStageView({
  documentWorkspace,
}: {
  documentWorkspace: ReactNode;
}) {
  return (
    <div data-testid="source-rfp-stage-view" style={WRAP_STYLE}>
      <section aria-labelledby="source-rfp-title" style={SECTION_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>What this stage produces</div>
          <h2 id="source-rfp-title" style={TITLE_STYLE}>
            RFP release package
          </h2>
        </div>
        <div style={GRID_STYLE}>
          <EvalRubricTable />
          <VendorShortlistPanel />
        </div>
      </section>
      <ReleaseGovernancePanel />
      <section
        data-testid="source-rfp-document-workspace"
        aria-label="RFP document workspace"
        style={DOCUMENT_STYLE}
      >
        {documentWorkspace}
      </section>
    </div>
  );
}

function ReleaseGovernancePanel() {
  return (
    <section data-testid="source-rfp-release-governance" style={GOVERNANCE_STYLE}>
      <div>
        <div style={EYEBROW_STYLE}>Sponsor sign-off</div>
        <h3 style={CARD_TITLE_STYLE}>Release is governed</h3>
      </div>
      <p style={COPY_STYLE}>
        Release RFP stays unavailable until sponsor sign-off is recorded and an
        external channel is configured. AbarVa can prepare internal drafts, but
        it does not send vendor communications from this screen.
      </p>
      <button type="button" disabled style={DISABLED_BUTTON_STYLE}>
        Release RFP unavailable
      </button>
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
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(300px, 0.9fr)",
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

const GOVERNANCE_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, auto)",
  gap: 14,
  alignItems: "center",
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

const DISABLED_BUTTON_STYLE: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 6,
  padding: "9px 12px",
  background: "#F5F1EA",
  color: CANVAS.INK_MUTED,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 700,
  cursor: "not-allowed",
};

const DOCUMENT_STYLE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 16,
};
