"use client";

import type { CSSProperties } from "react";
import type { SourceVendorResponseCompleteness } from "@/lib/source/vendor-response-types";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

type GateState = "complete" | "pending" | "blocked";

interface GateCheck {
  label: string;
  state: GateState;
  detail: string;
}

export function VendorResponseForwardGate({
  readiness,
  profileSet,
  challengeIntelligence,
  bafoInstructionPack,
  evaluationDecisionView,
}: {
  readiness?: SourceVendorResponseCompleteness;
  profileSet?: VendorResponseProfileSet | null;
  challengeIntelligence?: VendorChallengeIntelligence | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  evaluationDecisionView?: VendorEvaluationDecisionView | null;
}) {
  const checks = buildGateChecks(
    readiness,
    profileSet,
    challengeIntelligence,
    bafoInstructionPack,
    evaluationDecisionView,
  );
  const openBlockers = checks.filter((check) => check.state !== "complete");
  const canContinue = openBlockers.length === 0;
  const nextWorkingAction = bafoInstructionPack
    ? "Use the BAFO clarification pack to close score holdbacks."
    : "Load vendor response packages, then produce response intelligence.";

  return (
    <section
      data-testid="source-vendor-response-forward-gate"
      style={CARD}
      aria-label="Responses forward gate"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Forward gate</div>
          <h3 style={TITLE}>Can we move from Responses to Evaluation?</h3>
          <p style={COPY}>
            Continue lights up only when the response package, parsed evidence,
            intelligence, BAFO holdbacks, and human scoring view are ready.
          </p>
        </div>
        <div style={ACTION_STACK}>
          <button
            type="button"
            disabled={!canContinue}
            style={{
              ...PRIMARY_ACTION,
              ...(canContinue ? PRIMARY_READY : PRIMARY_DISABLED),
            }}
            aria-disabled={!canContinue}
          >
            Continue to Evaluation
          </button>
          <span>
            {canContinue ? "All gate checks complete." : nextWorkingAction}
          </span>
        </div>
      </div>

      <div style={CHECK_GRID}>
        {checks.map((check) => (
          <div key={check.label} style={CHECK_ROW}>
            <span style={{ ...DOT, ...STATE_TONE[check.state] }} />
            <div style={CHECK_TEXT}>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {openBlockers.length > 0 ? (
        <div style={BLOCKER_STRIP}>
          <strong>{openBlockers.length} gate check still open</strong>
          <span>
            Do not move to Evaluation until the open items above are resolved or
            explicitly accepted as scoring caveats.
          </span>
        </div>
      ) : null}
    </section>
  );
}

function buildGateChecks(
  readiness?: SourceVendorResponseCompleteness,
  profileSet?: VendorResponseProfileSet | null,
  challengeIntelligence?: VendorChallengeIntelligence | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
  evaluationDecisionView?: VendorEvaluationDecisionView | null,
): GateCheck[] {
  const records = readiness?.records ?? [];
  const profiles = profileSet?.profiles ?? [];
  const packageLoaded = records.length > 0;
  const requiredGaps = records.flatMap((record) => [
    ...record.blockers,
    ...record.missingSections.map(
      (section) => `${record.vendorName}: missing ${section}`,
    ),
    ...(record.pricingTemplateStatus === "complete"
      ? []
      : [
          `${record.vendorName}: pricing template ${record.pricingTemplateStatus}`,
        ]),
  ]);
  const parsedCount = records.filter(
    (record) => record.evidenceStatus === "Parsed",
  ).length;
  const citedProfiles = profiles.filter((profile) =>
    profile.extractionCards.some((card) => Boolean(card.evidenceReference)),
  ).length;
  const holdbackCount = bafoInstructionPack?.scoringHoldbacks.length ?? 0;
  const notReadyProfiles = profiles.filter(
    (profile) => profile.readyForEvaluation !== "yes",
  );

  return [
    {
      label: "Vendor packages loaded",
      state: packageLoaded ? "complete" : "pending",
      detail: packageLoaded
        ? `${records.length} vendor package${records.length === 1 ? "" : "s"} in review.`
        : "Upload each vendor response package before scoring.",
    },
    {
      label: "Required package gaps closed",
      state:
        !packageLoaded || requiredGaps.length > 0
          ? packageLoaded
            ? "blocked"
            : "pending"
          : "complete",
      detail:
        requiredGaps.length > 0
          ? requiredGaps.slice(0, 2).join("; ")
          : packageLoaded
            ? "No required package gap is blocking the stage."
            : "Waiting on vendor packages.",
    },
    {
      label: "Evidence parsed and cited",
      state:
        packageLoaded && parsedCount === records.length && citedProfiles > 0
          ? "complete"
          : packageLoaded
            ? "blocked"
            : "pending",
      detail:
        packageLoaded && parsedCount === records.length && citedProfiles > 0
          ? `${parsedCount}/${records.length} packages parsed with cited extraction cards.`
          : `${parsedCount}/${records.length || 0} packages parsed; ${citedProfiles} cited profile${citedProfiles === 1 ? "" : "s"}.`,
    },
    {
      label: "Intelligence produced",
      state:
        profiles.length > 0 && challengeIntelligence && bafoInstructionPack
          ? "complete"
          : "pending",
      detail:
        profiles.length > 0 && challengeIntelligence && bafoInstructionPack
          ? `${profiles.length} profiles, ${challengeIntelligence.challengeCount} challenges, ${bafoInstructionPack.questionCount} BAFO asks.`
          : "Produce profiles, challenges, and BAFO asks before continuing.",
    },
    {
      label: "Score holdbacks resolved",
      state:
        holdbackCount === 0 &&
        notReadyProfiles.length === 0 &&
        profiles.length > 0
          ? "complete"
          : profiles.length > 0
            ? "blocked"
            : "pending",
      detail:
        holdbackCount === 0 &&
        notReadyProfiles.length === 0 &&
        profiles.length > 0
          ? "No BAFO holdback remains before scoring."
          : `${holdbackCount} BAFO holdback${holdbackCount === 1 ? "" : "s"}; ${notReadyProfiles.length} vendor profile${notReadyProfiles.length === 1 ? "" : "s"} not fully ready.`,
    },
    {
      label: "Human scoring view prepared",
      state: evaluationDecisionView ? "complete" : "pending",
      detail: evaluationDecisionView
        ? `${evaluationDecisionView.scorecardRows.length} weighted criteria ready for named evaluator review.`
        : "Prepare weighted criteria and evaluator-owned scoring view.",
    },
  ];
}

const CARD: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.CARD,
  padding: 14,
  display: "grid",
  gap: 12,
};

const HEADER: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 300px)",
  gap: 14,
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
  lineHeight: 1.1,
  color: CANVAS.INK,
};

const COPY: CSSProperties = {
  margin: "7px 0 0",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.5,
  maxWidth: 760,
};

const ACTION_STACK: CSSProperties = {
  display: "grid",
  gap: 7,
  justifyItems: "stretch",
  color: CANVAS.INK_SOFT,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const PRIMARY_ACTION: CSSProperties = {
  border: "1px solid",
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "10px 12px",
  fontFamily: CANVAS.SANS,
  fontSize: CANVAS.T_BODY_SMALL,
  fontWeight: 800,
};

const PRIMARY_READY: CSSProperties = {
  background: CANVAS.INK,
  borderColor: CANVAS.INK,
  color: CANVAS.CARD,
  cursor: "pointer",
};

const PRIMARY_DISABLED: CSSProperties = {
  background: CANVAS.SURFACE_HOVER,
  borderColor: CANVAS.RULE,
  color: CANVAS.INK_MUTED,
  cursor: "not-allowed",
};

const CHECK_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const CHECK_ROW: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 9,
  display: "grid",
  gridTemplateColumns: "14px minmax(0, 1fr)",
  gap: 8,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};

const CHECK_TEXT: CSSProperties = {
  display: "grid",
  gap: 2,
};

const DOT: CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: 999,
  marginTop: 4,
  background: "currentColor",
};

const STATE_TONE: Record<GateState, CSSProperties> = {
  complete: {
    color: CANVAS.ACTIVE,
  },
  pending: {
    color: CANVAS.INK_MUTED,
  },
  blocked: {
    color: CANVAS.BLOCKED,
  },
};

const BLOCKER_STRIP: CSSProperties = {
  border: `1px solid ${CANVAS.BLOCKED}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "rgba(163,45,45,0.06)",
  color: CANVAS.INK,
  padding: "9px 10px",
  display: "grid",
  gap: 3,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
};
