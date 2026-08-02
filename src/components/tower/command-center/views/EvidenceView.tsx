"use client";

// Tab 5 — Evidence, as a business posture.
// Transcribed from `viewEvidence()` (design line ~997): a four-button segmented
// control, one answer set shown at a time, in a two-column grid of large
// evidence rows with a right-aligned metric + unit + tag.
//
// The four questions are answered from `mart_evidence_lineage` and
// `mart_required_field_gaps`. Question 3 ("who owns it") and question 4 ("what
// decision is blocked") are re-groupings of the same gap rows — no new facts
// are introduced by either.

import { formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerEvidenceGapView,
} from "@/lib/tower/command-center/types";

import { Card, Dot, Unknown, ViewHead, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

export type EvidenceQuestion = "exists" | "missing" | "owner" | "blocked";

export const EVIDENCE_QUESTIONS: ReadonlyArray<
  readonly [EvidenceQuestion, string]
> = [
  ["exists", "What evidence exists?"],
  ["missing", "What is missing?"],
  ["owner", "Who owns the missing proof?"],
  ["blocked", "What decision is blocked until it arrives?"],
];

type Tone = "teal" | "amber" | "red";

interface AnswerItem {
  id: string;
  name: string;
  detail: string;
  metric: string;
  unit: string;
  tone: Tone;
  tag: string;
  /** Set when the row opens the evidence-gap drawer. */
  gapId?: string;
}

const TONE_CLASS: Record<Tone, string> = {
  teal: "mTeal",
  amber: "mAmber",
  red: "mRed",
};

function gapTone(gap: TowerEvidenceGapView): Tone {
  if (gap.priority === "high") return "red";
  if (gap.priority === "medium") return "amber";
  return "teal";
}

/** Group gaps by their owner, so question 3 resolves every gap to one name. */
function ownerAnswers(gaps: readonly TowerEvidenceGapView[]): AnswerItem[] {
  const byOwner = new Map<string, TowerEvidenceGapView[]>();
  for (const gap of gaps) {
    const owner = gap.owner ?? "Unassigned";
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), gap]);
  }
  return [...byOwner.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([owner, items]) => {
      const high = items.filter((g) => g.priority === "high").length;
      const knownValue = items.reduce(
        (sum, g) => sum + (g.valueAtStakeUsd ?? 0),
        0,
      );
      const valueUnknown =
        knownValue === 0 && items.some((g) => g.valueAtStakeUsd === null);
      return {
        id: `owner:${owner}`,
        name: owner,
        detail: items.map((g) => g.missing).join(" · "),
        metric: valueUnknown ? "Unknown" : formatUsdM(knownValue),
        unit:
          items.length === 1
            ? "1 gap to close"
            : `${items.length} gaps to close`,
        tone: (owner === "Unassigned"
          ? "red"
          : high > 0
            ? "amber"
            : "teal") as Tone,
        tag:
          owner === "Unassigned"
            ? "No owner recorded"
            : `${items.length} gap${items.length === 1 ? "" : "s"}${high > 0 ? ` · ${high} high` : ""}`,
      };
    });
}

function buildAnswers(
  question: EvidenceQuestion,
  view: TowerCommandCenterView,
): { meta: string; items: AnswerItem[] } {
  const gaps = view.gaps;

  if (question === "exists") {
    const facts = view.evidenceFacts;
    return {
      meta: `${facts.length} traced fact${facts.length === 1 ? "" : "s"} carry a governed source row`,
      items: facts.map((f) => ({
        id: f.id,
        name: f.name,
        detail: f.sourceFile
          ? `${f.detail} Source: ${f.sourceFile}.`
          : f.detail,
        metric: f.metricText,
        unit: f.unit,
        tone: f.tone,
        tag: f.tag,
      })),
    };
  }

  if (question === "missing") {
    const atStake = gaps.reduce((sum, g) => sum + (g.valueAtStakeUsd ?? 0), 0);
    return {
      meta:
        `${gaps.length} gap${gaps.length === 1 ? "" : "s"} stand between promised value and a claim` +
        (atStake > 0 ? ` · ${formatUsdM(atStake)} at stake` : ""),
      items: gaps.map((g) => ({
        id: g.id,
        gapId: g.id,
        name: g.missing,
        detail: g.why,
        // The dollar the gap holds up — the reason a CXO cares which gap to close first.
        metric:
          g.valueAtStakeUsd === null ? "Unknown" : formatUsdM(g.valueAtStakeUsd),
        unit: "blocked",
        tone: gapTone(g),
        tag: g.owner ? `Owner · ${g.owner}` : "No owner recorded",
      })),
    };
  }

  if (question === "owner") {
    const items = ownerAnswers(gaps);
    return {
      meta: "Every gap resolves to one named owner, or is flagged unassigned",
      items,
    };
  }

  const blocking = gaps.filter((g) => g.blocking);
  return {
    meta: `${blocking.length} decision${blocking.length === 1 ? "" : "s"} held until proof arrives`,
    items: blocking.map((g) => ({
      id: `blocked:${g.id}`,
      gapId: g.id,
      name: g.blockedDecision,
      detail: g.why,
      metric:
        g.valueAtStakeUsd === null ? "Unknown" : formatUsdM(g.valueAtStakeUsd),
      unit: g.linkedProgram ?? "no linked program",
      tone: gapTone(g),
      tag: g.owner ? `Blocked · ${g.owner}` : "Blocked · no owner",
    })),
  };
}

export function EvidenceView({
  view,
  question,
  onQuestion,
  onOpenGap,
}: {
  view: TowerCommandCenterView;
  question: EvidenceQuestion;
  onQuestion: (next: EvidenceQuestion) => void;
  onOpenGap: (gapId: string) => void;
}) {
  const activeIndex = EVIDENCE_QUESTIONS.findIndex(([id]) => id === question);
  const index = activeIndex >= 0 ? activeIndex : 0;
  const [activeId, activeLabel] = EVIDENCE_QUESTIONS[index];
  const { meta, items } = buildAnswers(activeId, view);

  const headTone =
    activeId === "exists"
      ? "var(--canon-teal-dark)"
      : activeId === "owner"
        ? "var(--canon-amber)"
        : "var(--canon-red)";

  return (
    <div className={styles.view}>
      <ViewHead
        title="Evidence, as a business posture"
        hint="Answers, not a trace log — click a gap for its audit trail"
      />

      <div
        className={styles.evseg}
        role="radiogroup"
        aria-label="Evidence question"
      >
        {EVIDENCE_QUESTIONS.map(([id, label], i) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={id === activeId}
            className={cx(styles.evbtn, id === activeId && styles.on)}
            onClick={() => onQuestion(id)}
          >
            <span className={styles.evn}>{i + 1}</span>
            {label}
          </button>
        ))}
      </div>

      <Card
        eyebrow={
          <span style={{ color: headTone }}>Question {index + 1} of 4</span>
        }
        title={activeLabel}
        right={meta}
        headId="tcc-evidence-head"
        style={{ flex: 1, minHeight: 0 }}
        bodyClassName={styles.scroll}
      >
        {items.length === 0 ? (
          <p className={styles.lhSub}>
            No governed rows answer this question for this tenant yet.
          </p>
        ) : (
          <div className={styles.ebigGrid}>
            {items.map((item) =>
              item.gapId ? (
                <button
                  key={item.id}
                  type="button"
                  className={cx(styles.ebig, styles.clickable)}
                  onClick={() => onOpenGap(item.gapId as string)}
                >
                  <EvidenceRowBody item={item} withLink />
                </button>
              ) : (
                <div key={item.id} className={styles.ebig}>
                  <EvidenceRowBody item={item} />
                </div>
              ),
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function EvidenceRowBody({
  item,
  withLink,
}: {
  item: AnswerItem;
  withLink?: boolean;
}) {
  return (
    <>
      <Dot tone={item.tone} style={{ marginTop: 6 }} />
      <span className={styles.ebigMain}>
        <span className={styles.ebigNm}>{item.name}</span>
        <span className={styles.ebigSub}>{item.detail}</span>
        {withLink ? (
          <span className={styles.ebigLink}>View audit trace →</span>
        ) : null}
      </span>
      <span className={styles.ebigRight}>
        <span className={cx(styles.ebigMetric, styles[TONE_CLASS[item.tone]])}>
          {item.metric === "Unknown" ? <Unknown label="Unknown" /> : item.metric}
        </span>
        <span className={styles.ebigUnit}>{item.unit}</span>
        <span className={styles.ebigTag}>{item.tag}</span>
      </span>
    </>
  );
}
