"use client";

import type { CSSProperties } from "react";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import { CANVAS } from "../canvas-tokens";

interface BriefItem {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

export function VendorResponseIntelligenceBrief({
  profileSet,
  challengeIntelligence,
  bafoInstructionPack,
  evaluationDecisionView,
}: {
  profileSet?: VendorResponseProfileSet | null;
  challengeIntelligence?: VendorChallengeIntelligence | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  evaluationDecisionView?: VendorEvaluationDecisionView | null;
}) {
  const profiles = profileSet?.profiles ?? [];
  if (
    profiles.length === 0 &&
    !challengeIntelligence &&
    !bafoInstructionPack &&
    !evaluationDecisionView
  ) {
    return null;
  }

  const insights = buildInsightItems(
    profileSet,
    challengeIntelligence,
    bafoInstructionPack,
    evaluationDecisionView,
  );
  const evidenceUsed = collectEvidenceUsed(profileSet, challengeIntelligence);
  const missingInputs = collectMissingInputs(profileSet, bafoInstructionPack);
  const leveragePath = collectLeveragePath(
    challengeIntelligence,
    bafoInstructionPack,
    evaluationDecisionView,
  );
  const demoOnly = profiles.some((profile) => profile.syntheticDemo);

  return (
    <section
      data-testid="source-vendor-response-intelligence-brief"
      style={CARD}
      aria-label="Proposal intelligence brief"
    >
      <div style={HEADER}>
        <div>
          <div style={EYEBROW}>Proposal intelligence brief</div>
          <h3 style={TITLE}>What Source learned before scoring</h3>
          <p style={COPY}>
            This is the bridge from vendor files to scoring discipline: produced
            insights, evidence used, missing inputs, and the leverage path to
            BAFO.
          </p>
        </div>
        <div style={SUMMARY}>
          <strong>
            {profiles.length || bafoInstructionPack?.vendorCount || 0}
          </strong>
          <span>vendors in review</span>
        </div>
      </div>

      <div style={INSIGHT_GRID}>
        {insights.map((item) => (
          <div key={item.label} style={INSIGHT}>
            <span style={{ ...BADGE, ...TONE[item.tone] }}>{item.value}</span>
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      <div style={DETAIL_GRID}>
        <BriefList
          title="Evidence used"
          empty="No vendor-isolated evidence has been summarized yet."
          items={evidenceUsed}
        />
        <BriefList
          title="Missing before score lock"
          empty="No missing inputs are currently flagged."
          items={missingInputs}
          tone="warn"
        />
        <BriefList
          title="Leverage path"
          empty="No BAFO leverage path has been generated yet."
          items={leveragePath}
          tone="good"
        />
      </div>

      <div style={FOOTNOTE}>
        {demoOnly
          ? "Demo profiles show the intended reasoning shape. Client scoring still requires parsed, vendor-isolated files with cited evidence."
          : "Only cited vendor-package evidence should support scoring, BAFO pressure, or executive recommendation."}
      </div>
    </section>
  );
}

function buildInsightItems(
  profileSet?: VendorResponseProfileSet | null,
  challengeIntelligence?: VendorChallengeIntelligence | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
  evaluationDecisionView?: VendorEvaluationDecisionView | null,
): BriefItem[] {
  const profileCount =
    profileSet?.profileCount ?? profileSet?.profiles.length ?? 0;
  const readyCount =
    profileSet?.profiles.filter(
      (profile) => profile.readyForEvaluation === "yes",
    ).length ?? 0;
  return [
    {
      label: "Response profiles",
      value: String(profileCount),
      detail:
        profileCount > 0
          ? "Vendor packages reduced to scope, price, claims, evidence, exceptions, and readiness."
          : "Awaiting parsed vendor packages.",
      tone: profileCount > 0 ? "good" : "warn",
    },
    {
      label: "Challenges found",
      value: String(challengeIntelligence?.challengeCount ?? 0),
      detail:
        "Issues to clarify before scores harden or vendors anchor weak positions.",
      tone:
        (challengeIntelligence?.challengeCount ?? 0) > 0 ? "warn" : "neutral",
    },
    {
      label: "BAFO asks",
      value: String(bafoInstructionPack?.questionCount ?? 0),
      detail:
        "Vendor-specific asks generated from evidence gaps and commercial risk.",
      tone: (bafoInstructionPack?.questionCount ?? 0) > 0 ? "good" : "warn",
    },
    {
      label: "Ready to score",
      value: `${readyCount}/${profileCount || 0}`,
      detail: "Scoring is still human-owned; AI suggestions are never final.",
      tone: profileCount > 0 && readyCount === profileCount ? "good" : "warn",
    },
    {
      label: "Decision view",
      value: evaluationDecisionView
        ? `${evaluationDecisionView.scorecardRows.length}`
        : "0",
      detail:
        "Weighted criteria, tradeoffs, and score-improvement scenarios prepared.",
      tone: evaluationDecisionView ? "good" : "neutral",
    },
  ];
}

function collectEvidenceUsed(
  profileSet?: VendorResponseProfileSet | null,
  challengeIntelligence?: VendorChallengeIntelligence | null,
): string[] {
  const profileEvidence =
    profileSet?.profiles.flatMap((profile) =>
      unique([
        ...profile.evidenceProvided,
        ...profile.exhibits
          .map((exhibit) => exhibit.evidenceReference)
          .filter((value): value is string => Boolean(value)),
        ...profile.extractionCards
          .map((card) => card.evidenceReference)
          .filter((value): value is string => Boolean(value)),
      ]).slice(0, 2),
    ) ?? [];
  const values = [
    ...profileEvidence,
    ...(challengeIntelligence?.challengeLog.map(
      (challenge) => challenge.evidenceLabel,
    ) ?? []),
  ];
  return unique(values).slice(0, 7);
}

function collectMissingInputs(
  profileSet?: VendorResponseProfileSet | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
): string[] {
  const values = [
    ...(profileSet?.profiles.flatMap((profile) =>
      [
        ...profile.responseCompleteness.missingSections.map(
          (section) => `${profile.vendorName}: missing ${section}`,
        ),
        ...profile.responseCompleteness.partialSections.map(
          (section) => `${profile.vendorName}: clarify ${section}`,
        ),
        ...profile.unsupportedClaims.map(
          (claim) => `${profile.vendorName}: unsupported claim - ${claim}`,
        ),
        ...profile.extractionCards.flatMap((card) =>
          card.missingFields.map(
            (field) => `${profile.vendorName}: ${card.title} needs ${field}`,
          ),
        ),
      ].slice(0, 2),
    ) ?? []),
    ...(bafoInstructionPack?.scoringHoldbacks ?? []),
  ];
  return unique(values).slice(0, 8);
}

function collectLeveragePath(
  challengeIntelligence?: VendorChallengeIntelligence | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
  evaluationDecisionView?: VendorEvaluationDecisionView | null,
): string[] {
  const values = [
    ...(challengeIntelligence?.leverageSeeds.map(
      (seed) => `${seed.vendorName}: ${seed.recommendedAsk}`,
    ) ?? []),
    ...(bafoInstructionPack?.vendorInstructions.flatMap((instruction) =>
      instruction.mustResolveBeforeScoring.map(
        (item) => `${instruction.vendorName}: ${item}`,
      ),
    ) ?? []),
    ...(evaluationDecisionView?.scoreImprovementScenarios.map(
      (scenario) =>
        `${scenario.vendorName}: ${scenario.bafoCure} (${scenario.requiredEvidence})`,
    ) ?? []),
  ];
  return unique(values).slice(0, 8);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      if (!value || seen.has(value)) return false;
      seen.add(value);
      return true;
    });
}

function BriefList({
  title,
  items,
  empty,
  tone = "neutral",
}: {
  title: string;
  items: string[];
  empty: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  return (
    <div style={LIST_PANEL}>
      <div style={LIST_HEAD}>
        <span style={EYEBROW}>{title}</span>
        <strong style={{ ...COUNT_PILL, ...TONE[tone] }}>{items.length}</strong>
      </div>
      {items.length > 0 ? (
        <ul style={LIST}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={EMPTY}>{empty}</p>
      )}
    </div>
  );
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
  gridTemplateColumns: "minmax(0, 1fr) auto",
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
  maxWidth: 780,
};

const SUMMARY: CSSProperties = {
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "8px 10px",
  display: "grid",
  minWidth: 120,
  color: CANVAS.INK,
  textAlign: "right",
};

const INSIGHT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(132px, 1fr))",
  gap: 8,
};

const INSIGHT: CSSProperties = {
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: CANVAS.SURFACE_HOVER,
  padding: "9px 10px",
  display: "grid",
  gap: 5,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.35,
};

const BADGE: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "2px 7px",
  width: "fit-content",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const DETAIL_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
};

const LIST_PANEL: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 10,
  display: "grid",
  alignContent: "start",
  gap: 8,
};

const LIST_HEAD: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "center",
};

const COUNT_PILL: CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "2px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 17,
  color: CANVAS.INK,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const EMPTY: CSSProperties = {
  margin: 0,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const FOOTNOTE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 9,
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.45,
};

const TONE: Record<BriefItem["tone"], CSSProperties> = {
  good: {
    color: CANVAS.ACTIVE,
    borderColor: CANVAS.ACTIVE,
    background: "rgba(29,158,117,0.06)",
  },
  warn: {
    color: CANVAS.WAITING,
    borderColor: CANVAS.WAITING,
    background: "rgba(186,117,23,0.06)",
  },
  bad: {
    color: CANVAS.BLOCKED,
    borderColor: CANVAS.BLOCKED,
    background: "rgba(163,45,45,0.06)",
  },
  neutral: {
    color: CANVAS.INK_MUTED,
    borderColor: CANVAS.RULE,
    background: CANVAS.SURFACE_HOVER,
  },
};
