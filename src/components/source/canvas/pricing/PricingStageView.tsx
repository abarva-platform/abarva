"use client";

import type { CSSProperties, ReactNode } from "react";
import { buildSourcePricingNormalization } from "@/lib/source/pricing-normalization";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";
import { SensitivityRibbon } from "./SensitivityRibbon";
import { TcoBridge } from "./TcoBridge";
import { TcoIcebergViz } from "./TcoIcebergViz";
import { TrapLog } from "./TrapLog";

export function PricingStageView({
  event,
  documentWorkspace,
}: {
  event: { id: string; name: string; currentStageKey?: SourceStageKey };
  documentWorkspace: ReactNode;
}) {
  const pricing = buildSourcePricingNormalization({
    event: {
      id: event.id,
      name: event.name,
      currentStageKey: event.currentStageKey ?? "pricing",
    },
  });
  const topRank = pricing.comparison.find((rank) => rank.comparable) ?? pricing.comparison[0];
  const topSnapshot = pricing.snapshots.find(
    (snapshot) => snapshot.vendorId === topRank?.vendorId,
  );

  return (
    <div data-testid="source-pricing-stage-view" style={WRAP}>
      <section style={NEXT_CARD}>
        <div>
          <div style={EYEBROW}>Stage 6 · Pricing</div>
          <h2 style={TITLE}>Normalize current pricing</h2>
          <p style={COPY}>
            Compare only like-for-like vendor economics, expose hidden TCO
            layers, and turn traps into BAFO questions before anyone sees a
            recommendation.
          </p>
        </div>
        <div style={ACTION_BOX}>
          <strong>{pricing.recommendedNextAction}</strong>
          <span>
            The d19 pricing workbook upload, vendor-submission list, and
            comparison XLSX download are bound to real submitted rows.
          </span>
        </div>
      </section>

      <TcoBridge pricing={pricing} />

      <div style={GRID}>
        <TcoIcebergViz snapshot={topSnapshot} />
        <SensitivityRibbon snapshot={topSnapshot} />
      </div>

      <TrapLog traps={pricing.topCommercialTraps} />

      <section data-testid="source-pricing-upload-proof" style={PROOF_CARD}>
        <div style={EYEBROW}>Data binding proof</div>
        <h3 style={SMALL_TITLE}>Upload/download stays in the artifact workspace</h3>
        <p style={COPY}>
          Use the Pricing Workbook document below to download the governed
          template, upload vendor submissions, and download the comparison
          workbook. Unsupported artifact uploads fail closed instead of parsing
          into the wrong document type.
        </p>
      </section>

      <div data-testid="source-pricing-document-workspace">
        {documentWorkspace}
      </div>
    </div>
  );
}

const WRAP: CSSProperties = {
  display: "grid",
  gap: 12,
};

const NEXT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(250px, 370px)",
  gap: 14,
  alignItems: "stretch",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 16,
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
  fontSize: 28,
  lineHeight: 1.05,
  color: CANVAS.INK,
  fontWeight: 400,
};

const SMALL_TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
  fontWeight: 400,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const ACTION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.ACTIVE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(29,158,117,0.06)",
  padding: 12,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const PROOF_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.PAGE_BG,
  padding: 14,
};
