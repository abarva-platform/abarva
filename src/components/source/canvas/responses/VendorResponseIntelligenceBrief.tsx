"use client";

import type { CSSProperties } from "react";
import type {
  VendorBafoInstructionPack,
  VendorChallengeIntelligence,
  VendorEvaluationDecisionView,
  VendorResponseParseReport,
  VendorResponseProfileSet,
} from "@/lib/source/proposal-intelligence";
import {
  buildResponseDecisionAgenda,
  type DecisionAgenda,
  type DecisionAgendaItem,
} from "@/lib/source/vendor-response-decision-agenda";
import { CANVAS } from "../canvas-tokens";

interface BriefItem {
  label: string;
  value: string;
  detail: string;
  tone: "good" | "warn" | "bad" | "neutral";
}

interface CappedList {
  items: string[];
  total: number;
}

/** How many agenda rows to show before pointing at the full log below. */
const AGENDA_VISIBLE_LIMIT = 6;
/** How many supporting list entries to show before reporting the remainder. */
const LIST_VISIBLE_LIMIT = 6;

export function VendorResponseIntelligenceBrief({
  profileSet,
  challengeIntelligence,
  bafoInstructionPack,
  evaluationDecisionView,
  parseReports,
}: {
  profileSet?: VendorResponseProfileSet | null;
  challengeIntelligence?: VendorChallengeIntelligence | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  evaluationDecisionView?: VendorEvaluationDecisionView | null;
  parseReports?: VendorResponseParseReport[];
}) {
  const profiles = profileSet?.profiles ?? [];
  if (
    profiles.length === 0 &&
    (!parseReports || parseReports.length === 0) &&
    !challengeIntelligence &&
    !bafoInstructionPack &&
    !evaluationDecisionView
  ) {
    return null;
  }

  const agenda = buildResponseDecisionAgenda(
    challengeIntelligence,
    bafoInstructionPack,
  );
  const insights = buildInsightItems(profileSet, agenda, parseReports);
  const evidenceUsed = collectEvidenceUsed(
    profileSet,
    challengeIntelligence,
    parseReports,
  );
  const missingInputs = collectMissingInputs(
    profileSet,
    bafoInstructionPack,
    parseReports,
  );
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
            Open items are ranked by what they block, not by when they were
            found. Each one carries what review found, its impact signal, how it
            affects scoring, the ask to put to the vendor, and the evidence
            behind it. Impact signals are qualitative until a vendor prices
            them, so an unevidenced one is marked as a test, not a saving.
          </p>
        </div>
        <div style={SUMMARY}>
          <strong>
            {parseReports?.length ||
              profiles.length ||
              bafoInstructionPack?.vendorCount ||
              0}
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

      <DecisionAgendaTable agenda={agenda} />

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
        {parseReports && parseReports.length > 0
          ? "Parsed reports are vendor-isolated by event, tenant, vendor, and response version. Scoring still stays human-owned."
          : demoOnly
            ? "Demo profiles show the intended reasoning shape. Client scoring still requires parsed, vendor-isolated files with cited evidence."
            : "Only cited vendor-package evidence should support scoring, BAFO pressure, or executive recommendation."}
      </div>
    </section>
  );
}

function buildInsightItems(
  profileSet: VendorResponseProfileSet | null | undefined,
  agenda: DecisionAgenda,
  parseReports?: VendorResponseParseReport[],
): BriefItem[] {
  const profileCount =
    profileSet?.profileCount ?? profileSet?.profiles.length ?? 0;
  const parsedReportCount = parseReports?.length ?? 0;
  const parsedWithCitations =
    parseReports?.filter(
      (report) =>
        report.status !== "not_parseable" &&
        report.status !== "isolation_blocked" &&
        report.citationCount > 0,
    ).length ?? 0;
  const readyCount =
    profileSet?.profiles.filter(
      (profile) => profile.readyForEvaluation === "yes",
    ).length ?? 0;
  const parseReadyCount =
    parseReports?.filter((report) => report.scoreReadiness === "ready_to_score")
      .length ?? 0;

  // These are decision counts, not activity counts. "How many challenges did
  // we generate" does not tell a buyer what to do next; "how many of them stop
  // a score" and "how much of our leverage is evidence-backed" do.
  return [
    {
      label: "Blocks a score",
      value: String(agenda.blocksScoringCount),
      detail:
        agenda.blocksScoringCount > 0
          ? "Must be resolved with the vendor before a score can be given."
          : "Nothing open is holding back a score.",
      tone: agenda.blocksScoringCount > 0 ? "bad" : "good",
    },
    {
      label: "Leverage only",
      value: String(agenda.leverageOnlyCount),
      detail: "Does not block scoring; strengthens the buyer position at BAFO.",
      tone: agenda.leverageOnlyCount > 0 ? "warn" : "neutral",
    },
    {
      label: "Evidenced impact",
      value: `${agenda.evidencedImpactCount}/${
        agenda.evidencedImpactCount + agenda.testOnlyImpactCount
      }`,
      detail:
        "Commercial impact backed by cited evidence. The rest is worth testing, not booking.",
      tone: agenda.evidencedImpactCount > 0 ? "good" : "neutral",
    },
    {
      label: "Ready to score",
      value:
        parsedReportCount > 0
          ? `${parseReadyCount}/${parsedReportCount}`
          : `${readyCount}/${profileCount || 0}`,
      detail: "Scoring is still human-owned; AI suggestions are never final.",
      tone:
        (parsedReportCount > 0 && parseReadyCount === parsedReportCount) ||
        (profileCount > 0 && readyCount === profileCount)
          ? "good"
          : "warn",
    },
    {
      label: parsedReportCount > 0 ? "Cited packages" : "Response profiles",
      value:
        parsedReportCount > 0
          ? `${parsedWithCitations}/${parsedReportCount}`
          : String(profileCount),
      detail:
        parsedReportCount > 0
          ? "Vendor packages parsed with citations and a missing-input ledger."
          : "Vendor packages reduced to scope, price, claims, evidence, exceptions, and readiness.",
      tone: parsedWithCitations > 0 || profileCount > 0 ? "good" : "warn",
    },
  ];
}

function DecisionAgendaTable({ agenda }: { agenda: DecisionAgenda }) {
  if (agenda.items.length === 0) return null;
  const shown = agenda.items.slice(0, AGENDA_VISIBLE_LIMIT);
  const hidden = agenda.totalCount - shown.length;

  return (
    <div style={AGENDA_PANEL}>
      <div style={LIST_HEAD}>
        <span style={EYEBROW}>What changes the decision</span>
        <span style={AGENDA_NOTE}>
          {hidden > 0
            ? `Top ${shown.length} of ${agenda.totalCount}; the full log is in the challenge and BAFO panels below.`
            : `All ${agenda.totalCount} open items.`}
        </span>
      </div>
      <div style={TABLE_WRAP}>
        <table style={TABLE}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: "left" }}>Vendor</th>
              <th style={{ ...TH, textAlign: "left" }}>What review found</th>
              <th style={TH}>Need</th>
              <th style={{ ...TH, textAlign: "left" }}>Impact signal</th>
              <th style={{ ...TH, textAlign: "left" }}>Scoring disposition</th>
              <th style={{ ...TH, textAlign: "left" }}>Ask before BAFO</th>
              <th style={{ ...TH, textAlign: "left" }}>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((item) => (
              <AgendaRow key={item.key} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AgendaRow({ item }: { item: DecisionAgendaItem }) {
  return (
    <tr>
      <td style={TD_VENDOR}>
        <strong>{item.vendorName}</strong>
      </td>
      <td style={TD_TEXT}>{item.finding}</td>
      <td style={TD_CENTER}>
        <span
          style={{
            ...BADGE,
            ...TONE[item.blocksScoring ? "bad" : "warn"],
          }}
        >
          {item.blocksScoring ? "Blocks score" : "Leverage"}
        </span>
      </td>
      <td style={TD_TEXT}>
        {item.worth ? (
          <>
            {item.worth}
            {item.impactConfidence ? (
              <span style={CONFIDENCE}>
                {item.impactConfidence === "high"
                  ? "Evidenced"
                  : "Test, do not book"}
              </span>
            ) : null}
          </>
        ) : (
          <span style={UNQUANTIFIED}>No impact signal</span>
        )}
      </td>
      <td style={TD_TEXT}>{item.blocks}</td>
      <td style={TD_TEXT}>{item.ask}</td>
      <td style={TD_TEXT}>
        {item.evidence ?? <span style={UNQUANTIFIED}>No cite</span>}
      </td>
    </tr>
  );
}

function collectEvidenceUsed(
  profileSet?: VendorResponseProfileSet | null,
  challengeIntelligence?: VendorChallengeIntelligence | null,
  parseReports?: VendorResponseParseReport[],
): CappedList {
  const parsedEvidence =
    parseReports?.flatMap((report) =>
      report.citations
        .slice(0, 3)
        .map(
          (citation) =>
            `${report.vendorName}: ${citation.locator} - ${citation.section}`,
        ),
    ) ?? [];
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
    ...parsedEvidence,
    ...profileEvidence,
    ...(challengeIntelligence?.challengeLog.map(
      (challenge) => challenge.evidenceLabel,
    ) ?? []),
  ];
  return capped(unique(values));
}

function collectMissingInputs(
  profileSet?: VendorResponseProfileSet | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
  parseReports?: VendorResponseParseReport[],
): CappedList {
  const values = [
    ...(parseReports?.flatMap((report) =>
      report.missingInputs.map(
        (missing) =>
          `${report.vendorName}: ${missing.request} (${missing.ownerRole})`,
      ),
    ) ?? []),
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
  return capped(unique(values));
}

function collectLeveragePath(
  challengeIntelligence?: VendorChallengeIntelligence | null,
  bafoInstructionPack?: VendorBafoInstructionPack | null,
  evaluationDecisionView?: VendorEvaluationDecisionView | null,
): CappedList {
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
  return capped(unique(values));
}

/**
 * Cap the display list but keep the true total, so a panel never reports the
 * capped length as if it were the whole set.
 */
function capped(values: string[]): CappedList {
  return {
    items: values.slice(0, LIST_VISIBLE_LIMIT),
    total: values.length,
  };
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
  items: CappedList;
  empty: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  const hidden = items.total - items.items.length;
  return (
    <div style={LIST_PANEL}>
      <div style={LIST_HEAD}>
        <span style={EYEBROW}>{title}</span>
        <strong style={{ ...COUNT_PILL, ...TONE[tone] }}>{items.total}</strong>
      </div>
      {items.items.length > 0 ? (
        <>
          <ul style={LIST}>
            {items.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {hidden > 0 ? (
            <p style={EMPTY}>{`${hidden} more not shown here.`}</p>
          ) : null}
        </>
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

const AGENDA_PANEL: CSSProperties = {
  borderTop: `1px solid ${CANVAS.RULE}`,
  paddingTop: 10,
  display: "grid",
  gap: 8,
};

const AGENDA_NOTE: CSSProperties = {
  color: CANVAS.INK_MUTED,
  fontSize: CANVAS.T_BODY_SMALL,
  lineHeight: 1.4,
  textAlign: "right",
};

const TABLE_WRAP: CSSProperties = {
  overflowX: "auto",
};

const TABLE: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: CANVAS.T_BODY_SMALL,
  color: CANVAS.INK,
};

const TH: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
  fontWeight: 700,
  textAlign: "center",
  padding: "6px 8px",
  borderBottom: `1px solid ${CANVAS.RULE}`,
  whiteSpace: "nowrap",
};

const TD_BASE: CSSProperties = {
  padding: "8px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  verticalAlign: "top",
  lineHeight: 1.4,
};

const TD_VENDOR: CSSProperties = {
  ...TD_BASE,
  minWidth: 130,
};

const TD_TEXT: CSSProperties = {
  ...TD_BASE,
  minWidth: 150,
};

const TD_CENTER: CSSProperties = {
  ...TD_BASE,
  textAlign: "center",
  whiteSpace: "nowrap",
};

const CONFIDENCE: CSSProperties = {
  display: "block",
  marginTop: 3,
  fontFamily: CANVAS.MONO,
  fontSize: CANVAS.T_MICRO_SMALL,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const UNQUANTIFIED: CSSProperties = {
  color: CANVAS.INK_MUTED,
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
