"use client";

// Tab 5 — Evidence, as a business posture.
// Transcribed from `viewEvidence()` (design line ~997): a four-button segmented
// control, one answer set shown at a time, in a two-column grid of large
// evidence rows with a right-aligned metric + unit + tag.
//
// The four questions are answered from governed evidence lineage plus derived
// business evidence gaps. Question 3 ("who owns it") and question 4 ("what
// decision is blocked") are re-groupings of the same gap rows — no new facts
// are introduced by either.

import { formatCount } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerEvidenceFactView,
  TowerEvidenceGapLedgerItem,
  TowerInterventionLane,
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

interface SourceAuthorityPlan {
  id: string;
  fact: string;
  currentAuthority: string;
  secondSourceNeeded: string;
  owner: string;
  decisionBlocked: string;
  status: string;
}

function ledgerTone(item: { tone: string }): Tone {
  if (item.tone === "teal") return "teal";
  if (item.tone === "amber") return "amber";
  return "red";
}

/** Group the compact gap ledger by accountable owner role. */
function ownerAnswers(
  ledger: readonly TowerEvidenceGapLedgerItem[],
): AnswerItem[] {
  const byOwner = new Map<string, TowerEvidenceGapLedgerItem[]>();
  for (const gap of ledger.filter((g) => g.count > 0)) {
    byOwner.set(gap.ownerRole, [...(byOwner.get(gap.ownerRole) ?? []), gap]);
  }

  return [...byOwner.entries()]
    .sort((a, b) => {
      const countDelta =
        b[1].reduce((sum, g) => sum + g.count, 0) -
        a[1].reduce((sum, g) => sum + g.count, 0);
      return countDelta || a[0].localeCompare(b[0]);
    })
    .map(([owner, items]) => {
      const total = items.reduce((sum, g) => sum + g.count, 0);
      const red = items.some((g) => g.tone === "red");
      const amber = items.some((g) => g.tone === "amber");
      return {
        id: `owner:${owner}`,
        name: owner,
        detail: items.map((g) => `${g.label}: ${g.nextAction}`).join(" · "),
        metric: formatCount(total),
        unit: total === 1 ? "claim-gate gap" : "claim-gate gaps",
        tone: red ? "red" : amber ? "amber" : "teal",
        tag: `${items.length} grouped gate${items.length === 1 ? "" : "s"}`,
      };
    });
}

function blockedDecisionAnswers(
  lanes: readonly TowerInterventionLane[],
): AnswerItem[] {
  return lanes
    .filter((lane) => lane.key !== "ready_for_decision" || lane.count > 0)
    .map((lane) => ({
      id: `decision:${lane.key}`,
      name: lane.label,
      detail: `${lane.description} ${lane.nextAction}`,
      metric: formatCount(lane.count),
      unit:
        lane.key === "ready_for_decision"
          ? lane.count === 1
            ? "claim ready"
            : "claims ready"
          : lane.count === 1
            ? "claim held"
            : "claims held",
      tone: ledgerTone(lane),
      tag:
        lane.key === "ready_for_decision"
          ? "Decision queue"
          : "Proof work before decision",
    }));
}

function currentAuthority(fact: TowerEvidenceFactView): string {
  return [fact.sourceSystem, fact.sourceFile, fact.sourceRow]
    .filter(Boolean)
    .join(" · ");
}

function boardFactLabel(name: string): string {
  return name.replace(/promised benefit/gi, "source-backed benefit");
}

function authorityPlanForFact(
  fact: TowerEvidenceFactView,
): SourceAuthorityPlan {
  const key = `${fact.name} ${fact.unit}`.toLowerCase();
  const owner = fact.resolutionOwnerRole ?? "Data / PMO";

  if (
    key.includes("finance") ||
    key.includes("validated") ||
    key.includes("calculated")
  ) {
    return {
      id: fact.id,
      fact: boardFactLabel(fact.name),
      currentAuthority: currentAuthority(fact) || "Tower claim calculation",
      secondSourceNeeded: "Finance attestation or actuals cross-check",
      owner: fact.resolutionOwnerRole ?? "Finance",
      decisionBlocked: "Board claim gate",
      status: fact.lineageState ?? "ONE_SOURCE",
    };
  }

  if (
    key.includes("budget") ||
    key.includes("investment") ||
    key.includes("approved")
  ) {
    return {
      id: fact.id,
      fact: boardFactLabel(fact.name),
      currentAuthority: currentAuthority(fact) || "Budget allocation",
      secondSourceNeeded: "Actual/project ledger or FP&A sign-off",
      owner: fact.resolutionOwnerRole ?? "FP&A",
      decisionBlocked: "Capital posture",
      status: fact.lineageState ?? "ONE_SOURCE",
    };
  }

  if (
    key.includes("benefit") ||
    key.includes("promised") ||
    key.includes("value")
  ) {
    return {
      id: fact.id,
      fact: boardFactLabel(fact.name),
      currentAuthority: currentAuthority(fact) || "Business-case source",
      secondSourceNeeded: "Operating owner confirmation",
      owner: fact.resolutionOwnerRole ?? "Business owner",
      decisionBlocked: "Benefit-case acceptance",
      status: fact.lineageState ?? "ONE_SOURCE",
    };
  }

  if (key.includes("ai") || key.includes("spend")) {
    return {
      id: fact.id,
      fact: boardFactLabel(fact.name),
      currentAuthority: currentAuthority(fact) || "AI spend ledger",
      secondSourceNeeded: "Tool-owner and cost-center mapping",
      owner: fact.resolutionOwnerRole ?? "IT Finance",
      decisionBlocked: "AI spend attribution",
      status: fact.lineageState ?? "ONE_SOURCE",
    };
  }

  return {
    id: fact.id,
    fact: boardFactLabel(fact.name),
    currentAuthority: currentAuthority(fact) || "Governed source row",
    secondSourceNeeded: "Independent source or owner attestation",
    owner,
    decisionBlocked: "Source authority",
    status: fact.lineageState ?? "ONE_SOURCE",
  };
}

function SourceAuthorityWorkplan({ view }: { view: TowerCommandCenterView }) {
  const oneSourceFacts = view.evidenceFacts.filter(
    (fact) =>
      fact.lineageState === "ONE_SOURCE" ||
      (fact.lineageState === null && fact.sourceCount === 1),
  );
  const rows = oneSourceFacts.map(authorityPlanForFact);

  return (
    <details
      className={styles.sourceAuthorityPlan}
      role="region"
      aria-label="One-source fact workplan"
    >
      <summary className={styles.sourceAuthoritySummary}>
        <div>
          <span className={styles.eyebrow2}>Source-authority workplan</span>
          <h3>One-source facts needing corroboration</h3>
        </div>
        <strong>
          {formatCount(rows.length)} ONE_SOURCE fact
          {rows.length === 1 ? "" : "s"}
        </strong>
      </summary>
      {rows.length === 0 ? (
        <p className={styles.lhSub}>
          No ONE_SOURCE board facts are exposed by the current governed lineage
          packet.
        </p>
      ) : (
        <div className={styles.trustPlanTable}>
          <div className={styles.trustPlanHead} role="row">
            <span>Board fact</span>
            <span>Current authority</span>
            <span>Needed to reach AGREE</span>
            <span>Owner</span>
            <span>Decision blocked</span>
          </div>
          {rows.map((row) => (
            <div key={row.id} className={styles.trustPlanRow} role="row">
              <b>{row.fact}</b>
              <span>{row.currentAuthority}</span>
              <span>{row.secondSourceNeeded}</span>
              <span>{row.owner}</span>
              <em>{row.decisionBlocked}</em>
            </div>
          ))}
        </div>
      )}
    </details>
  );
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
        tone: f.lineageState === "ONE_SOURCE" ? "amber" : f.tone,
        tag: f.lineageState ?? f.tag,
      })),
    };
  }

  if (question === "missing") {
    const ledger = view.evidenceMaturity.gapLedger.filter((g) => g.count > 0);
    const firstGapId = gaps[0]?.id;
    return {
      meta: `${ledger.length} evidence gap groups; claimable value at stake`,
      items: ledger.map((g) => ({
        id: g.key,
        gapId: firstGapId,
        name: g.label,
        detail: `${g.nextAction} Basis: ${g.evidenceBasis}.`,
        metric: formatCount(g.count),
        unit: g.count === 1 ? "claim" : "claims",
        tone: g.tone === "teal" ? "teal" : g.tone === "amber" ? "amber" : "red",
        tag: `Owner · ${g.ownerRole}`,
      })),
    };
  }

  if (question === "owner") {
    const items = ownerAnswers(view.evidenceMaturity.gapLedger);
    return {
      meta: `${items.length} accountable owner groups across open evidence gates`,
      items,
    };
  }

  const items = blockedDecisionAnswers(view.evidenceMaturity.interventionLanes);
  return {
    meta: "Scale, fund, freeze, and stop decisions wait on these proof gates",
    items,
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
      <ViewHead title="Evidence control room" />
      <p className={styles.srOnly}>
        Default question: what proof is missing, who owns it, and which decision
        remains blocked until it arrives.
      </p>

      <SourceAuthorityWorkplan view={view} />

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
          {item.metric === "Unknown" ? (
            <Unknown label="Unknown" />
          ) : (
            item.metric
          )}
        </span>
        <span className={styles.ebigUnit}>{item.unit}</span>
        <span className={styles.ebigTag}>{item.tag}</span>
      </span>
    </>
  );
}
