"use client";

import type { CSSProperties, ReactNode } from "react";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import type { ContractOptimizationMveProfile } from "@/lib/source/contract-optimization";
import { CANVAS } from "../canvas-tokens";
import { CompletenessMatrix } from "./CompletenessMatrix";
import { QnaSymmetryLog } from "./QnaSymmetryLog";
import { ContractOptimizationProfilePanel } from "../contract-optimization/ContractOptimizationProfilePanel";
import { VendorBafoInstructionPackPanel } from "./VendorBafoInstructionPackPanel";
import { VendorChallengeLeveragePanel } from "./VendorChallengeLeveragePanel";
import { VendorEvaluationScorecardPanel } from "./VendorEvaluationScorecardPanel";
import { VendorResponsePackageCockpit } from "./VendorResponsePackageCockpit";
import { VendorResponseProfilesPanel } from "./VendorResponseProfilesPanel";

export function ResponsesStageView({
  readiness,
  profileSet,
  challengeIntelligence,
  bafoInstructionPack,
  evaluationDecisionView,
  contractOptimizationProfile,
  decisionBriefDocxHref,
  decisionBriefPdfHref,
  eventDisplayName,
  documentWorkspace,
}: {
  readiness?: SourceVendorResponseCompleteness;
  profileSet?: VendorResponseProfileSet | null;
  challengeIntelligence?: VendorChallengeIntelligence | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  evaluationDecisionView?: VendorEvaluationDecisionView | null;
  contractOptimizationProfile?: ContractOptimizationMveProfile | null;
  decisionBriefDocxHref?: string;
  decisionBriefPdfHref?: string;
  eventDisplayName?: string;
  documentWorkspace: ReactNode;
}) {
  const records = readiness?.records ?? [];
  const blocker = readiness?.blockers[0];
  const isContractOptimization = Boolean(contractOptimizationProfile);
  return (
    <div data-testid="source-responses-stage-view" style={WRAP}>
      <section style={NEXT_CARD}>
        <div>
          <div style={EYEBROW}>Stage 4 · Responses</div>
          <h2 style={TITLE}>
            {isContractOptimization
              ? "Review incumbent contract optimization"
              : "Review vendor response completeness"}
          </h2>
          <p style={COPY}>
            {isContractOptimization
              ? "Use the contract baseline, optimization findings, negotiation levers, recommended path, and evidence caveats before renewal action."
              : "Confirm every received response is complete, comparable, and fairly handled before scoring begins."}
          </p>
        </div>
        <div style={ACTION_BOX}>
          <strong>
            {isContractOptimization
              ? "Contract optimization is evidence-bound."
              : (blocker ?? "No response blocker is currently bound.")}
          </strong>
          <span>
            {isContractOptimization
              ? "Only sourcing-critical contract facts are shown here; raw files stay in the governed evidence record."
              : "Uploads stay tenant-scoped. External vendor communication stays in the procurement system unless explicitly configured."}
          </span>
        </div>
      </section>

      {!isContractOptimization ? (
        <>
          <div style={STATUS_ROW}>
            {records.length === 0 ? (
              <StatusCard
                vendor="Awaiting response uploads"
                status="Upload on Vendor Response Pack"
                tone="warn"
              />
            ) : (
              records.map((record) => (
                <StatusCard
                  key={record.vendorId}
                  vendor={record.vendorName}
                  status={record.completenessStatus.replaceAll("_", " ")}
                  tone={
                    record.completenessStatus === "complete"
                      ? "good"
                      : record.completenessStatus === "blocked" ||
                          record.completenessStatus === "not_comparable"
                        ? "bad"
                        : "warn"
                  }
                />
              ))
            )}
          </div>

          <div style={GRID}>
            <CompletenessMatrix readiness={readiness} />
            <QnaSymmetryLog />
          </div>
        </>
      ) : null}

      <ContractOptimizationProfilePanel profile={contractOptimizationProfile} />
      {!isContractOptimization ? (
        <>
          <VendorResponsePackageCockpit
            readiness={readiness}
            profileSet={profileSet}
          />
          <VendorResponseProfilesPanel profileSet={profileSet} />
          <VendorChallengeLeveragePanel intelligence={challengeIntelligence} />
          <VendorBafoInstructionPackPanel pack={bafoInstructionPack} />
          <VendorEvaluationScorecardPanel
            decisionView={evaluationDecisionView}
            decisionBriefDocxHref={decisionBriefDocxHref}
            decisionBriefPdfHref={decisionBriefPdfHref}
            eventDisplayName={eventDisplayName}
          />
        </>
      ) : null}

      <section
        data-testid="source-responses-disqualification-card"
        style={DECISION}
      >
        <div style={EYEBROW}>Decision point</div>
        <h3 style={SMALL_TITLE}>Disqualification requires rationale</h3>
        <p style={COPY}>
          If MSA non-compliance or missing critical sections block comparison,
          record the rationale and keep the excluded response visible in the
          audit trail.
        </p>
      </section>

      <div data-testid="source-responses-document-workspace">
        {documentWorkspace}
      </div>
    </div>
  );
}

function StatusCard({
  vendor,
  status,
  tone,
}: {
  vendor: string;
  status: string;
  tone: "good" | "warn" | "bad";
}) {
  return (
    <div style={STATUS_CARD}>
      <strong>{vendor}</strong>
      <span style={{ ...STATUS, ...STATUS_TONE[tone] }}>{status}</span>
    </div>
  );
}

const WRAP: CSSProperties = {
  display: "grid",
  gap: 12,
};

const NEXT_CARD: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 360px)",
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
};

const SMALL_TITLE: CSSProperties = {
  margin: "5px 0 0",
  fontFamily: CANVAS.SERIF,
  fontSize: 21,
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
};

const ACTION_BOX: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 12,
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const STATUS_ROW: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 8,
};

const STATUS_CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 12,
  display: "grid",
  gap: 7,
  minHeight: 78,
};

const STATUS: CSSProperties = {
  justifySelf: "start",
  border: "1px solid",
  borderRadius: 999,
  padding: "3px 8px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 700,
};

const STATUS_TONE: Record<"good" | "warn" | "bad", CSSProperties> = {
  good: {
    color: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
    borderColor: CANVAS.ACTIVE,
  },
  warn: {
    color: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
    borderColor: CANVAS.WAITING,
  },
  bad: {
    color: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
    borderColor: CANVAS.BLOCKED,
  },
};

const GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)",
  gap: 12,
};

const DECISION: CSSProperties = {
  border: `1px solid ${CANVAS.WAITING}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(186,117,23,0.06)",
  padding: 14,
};
