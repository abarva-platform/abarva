"use client";

// Tab 1 — Outcome Proof Cockpit.
//
// The Command Center now opens as a CFO operating room: verdict first, a compact
// scope read, and two decision visuals. Detail inspection lives in the other
// Tower tabs so the cockpit does not become a report appendix.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { ReactNode } from "react";
import type {
  TowerCommandCenterView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";

import {
  OutcomeDecisionMatrixChart,
  decisionMatrixTextAlternative,
} from "../charts/OutcomeDecisionMatrixChart";
import {
  ValueWaterfallChart,
  buildWaterfallRows,
} from "../charts/ValueWaterfallChart";
import { Card, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

interface BoardMetric {
  key: string;
  label: string;
  value: ReactNode;
  note: string;
  tone: "teal" | "amber" | "red" | "gray";
}

function boardMetrics(view: TowerCommandCenterView): BoardMetric[] {
  const s = view.summary;
  const financeBlockedUsd = s.financeValidatedBlockedUsd;

  return [
    {
      key: "investment",
      label: "Approved investment",
      value: formatUsdM(s.approvedInvestmentUsd),
      note: `${formatCount(s.boardScopeProgramCount)} board portfolio programs`,
      tone: (s.approvedInvestmentUsd ?? 0) > 0 ? "gray" : "amber",
    },
    {
      key: "explicit-benefit",
      label: "Explicit promised benefit",
      value:
        s.promisedBenefitUsd === null
          ? "Not loaded"
          : formatUsdM(s.promisedBenefitUsd),
      note: "only source-backed benefit assertions",
      tone: s.promisedBenefitUsd === null ? "amber" : "teal",
    },
    {
      key: "claimable",
      label: "Claimable today",
      value: formatUsdM(s.claimableUsd),
      note: "board-bookable value",
      tone: s.claimableUsd > 0 ? "teal" : "red",
    },
    {
      key: "finance-blocked",
      label: "Finance validated but blocked",
      value: formatUsdM(financeBlockedUsd),
      note: "validated value still held by the claim gate",
      tone: financeBlockedUsd > 0 ? "amber" : "gray",
    },
  ];
}

function sourceTrustRows(view: TowerCommandCenterView) {
  const s = view.summary;
  const conflicts = view.evidenceFacts.filter(
    (fact) => fact.lineageState === "CONFLICT",
  ).length;
  return [
    {
      label: "Claimable value",
      value: formatUsdM(s.claimableUsd),
      status: "VALUE OS",
      tone: "teal" as const,
    },
    {
      label: "Approved investment",
      value: formatUsdM(s.approvedInvestmentUsd),
      status: "INVESTMENT",
      tone: "teal" as const,
    },
    {
      label: "Promised benefit",
      value:
        s.promisedBenefitUsd === null
          ? "Not loaded"
          : formatUsdM(s.promisedBenefitUsd),
      status:
        s.promisedBenefitUsd === null
          ? "ABSENT"
          : conflicts > 0
            ? "CONFLICT"
            : "SOURCE BACKED",
      tone:
        s.promisedBenefitUsd === null || conflicts > 0
          ? ("amber" as const)
          : ("teal" as const),
    },
    {
      label: "AI spend grain",
      value: formatUsdM(s.aiTaggedUsd),
      status: s.aiSpendUnattributed ? "PORTFOLIO ONLY" : "ITEM ATTRIBUTED",
      tone: s.aiSpendUnattributed ? ("amber" as const) : ("teal" as const),
    },
    {
      label: "Conflict count",
      value:
        s.conflictedProgramCount > 0
          ? formatCount(s.conflictedProgramCount)
          : conflicts > 0
            ? formatCount(conflicts)
            : "—",
      status:
        s.conflictedProgramCount > 0 || conflicts > 0
          ? "VALUE OS STATE"
          : "NOT IN VALUE OS",
      tone:
        s.conflictedProgramCount > 0 || conflicts > 0
          ? ("red" as const)
          : ("amber" as const),
    },
  ];
}

function cockpitRead(view: TowerCommandCenterView): string {
  const s = view.summary;
  const hasSourceConflict = view.evidenceFacts.some(
    (fact) => fact.lineageState === "CONFLICT",
  );
  const blockedPrograms =
    s.blockedProgramCount ||
    view.programs.filter((program) => program.blockedUsd > 0).length;
  if (s.claimableUsd > 0) {
    return `${formatUsdM(s.claimableUsd)} is claimable today. Keep the remaining capital in proof-gated lanes until owners close usage, Finance, and attestation gaps.`;
  }
  if (!s.promisedBenefitLoaded) {
    return `${formatUsdM(s.approvedInvestmentUsd)} of approved investment is visible across ${formatCount(s.boardScopeProgramCount)} board portfolio programs, but explicit promised benefit is absent. Keep benefit totals null until source-backed value cases are loaded and classified.`;
  }
  if (
    s.promisedBenefitUsd !== null &&
    s.promisedBenefitUsd > 0 &&
    hasSourceConflict
  ) {
    return `${formatUsdM(s.promisedBenefitUsd)} is visible as promised benefit, but source authority is unresolved. ${formatCount(blockedPrograms)} programs remain blocked until evidence owners reconcile the proof chain.`;
  }
  if (s.promisedBenefitUsd !== null && s.promisedBenefitUsd > 0) {
    return `${formatUsdM(s.promisedBenefitUsd)} is visible as promised benefit, but ${formatCount(blockedPrograms)} programs still fail the board-claimable proof chain. Hold scale decisions until the evidence queue clears.`;
  }
  return "Tower can see the operating surface, but no governed value case is loaded yet. Start with source-backed value cases before making capital calls.";
}

function cockpitVerdict(view: TowerCommandCenterView): string {
  const hasSourceConflict = view.evidenceFacts.some(
    (fact) => fact.lineageState === "CONFLICT",
  );
  if (view.summary.claimableUsd > 0) {
    return "Some value is claimable, but additional capital still depends on the proof gates below.";
  }
  if (!view.summary.promisedBenefitLoaded) {
    return "Investment is visible. Explicit benefit proof is not loaded.";
  }
  if (
    view.summary.promisedBenefitUsd !== null &&
    view.summary.promisedBenefitUsd > 0 &&
    hasSourceConflict
  ) {
    return "Investment and benefit assertions are visible. Source authority is not board-certified.";
  }
  if (
    view.summary.promisedBenefitUsd !== null &&
    view.summary.promisedBenefitUsd > 0
  ) {
    return "Investment is visible. Outcome proof is not yet board-claimable.";
  }
  return "Tower has spend posture in view, but no governed value case is loaded yet.";
}

/**
 * The decision queue: programs with blocked value, worst first. This supports
 * the evidence-owner table and program drawer without inventing action fields
 * the mart does not yet carry.
 */
function decisionQueue(view: TowerCommandCenterView): TowerProgramView[] {
  return [...view.programs]
    .filter((p) => p.blockedUsd > 0)
    .sort((a, b) => b.blockedUsd - a.blockedUsd)
    .slice(0, 6);
}

export function CommandCenterView({
  view,
  onOpenProgram,
  onGoToFunnel,
}: {
  view: TowerCommandCenterView;
  onOpenProgram: (id: string) => void;
  onGoToFunnel: () => void;
}) {
  const s = view.summary;
  const metrics = boardMetrics(view);
  const queue = decisionQueue(view);
  const waterfallRows = buildWaterfallRows(s);
  const trustRows = sourceTrustRows(view);
  const openGapCount = view.gaps.length;

  return (
    <div className={cx(styles.view, styles.cockpitView)}>
      <section
        className={styles.boardPosture}
        aria-labelledby="tcc-board-posture"
      >
        <div className={styles.boardVerdict}>
          <div className={styles.eyebrow2}>Board value posture</div>
          <h2 id="tcc-board-posture">{cockpitVerdict(view)}</h2>
          <p>{cockpitRead(view)}</p>
        </div>
        <div className={styles.boardMetrics}>
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className={cx(styles.boardMetric, styles[`m${metric.tone}`])}
            >
              <span className={styles.bmLabel}>{metric.label}</span>
              <span className={styles.bmValue}>{metric.value}</span>
              <span className={styles.bmNote}>{metric.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        className={styles.scopeStrip}
        aria-label="Tower read model scope"
      >
        <div className={styles.scopeNarrative}>
          <span className={styles.eyebrow2}>Read model scope</span>
          <p>
            This view is a governed Tower value-model projection. Adoption,
            finance validation, and claimable value are separate gates; usage
            does not become board-bookable value until outcome and attestation
            evidence clear.
          </p>
        </div>
        <div className={styles.scopeFacts}>
          <span>
            {formatCount(s.totalProgramSubjectCount)} tracked subjects
          </span>
          <span>{formatCount(s.boardScopeProgramCount)} board programs</span>
          <span>{formatCount(s.aiInitiativeCount)} AI initiatives</span>
          <span>{formatCount(openGapCount)} open proof actions</span>
          <span>
            {formatCount(s.economicReviewQueueCount)} economic reviews
          </span>
          <span>benefit source: {trustRows[2]?.status ?? "ABSENT"}</span>
        </div>
      </section>

      <div className={styles.cockpitCanvas}>
        <Card
          eyebrow="Where value gets stopped"
          right="proof waterfall · governed value-model values"
          headId="tcc-outcome-waterfall"
          bodyClassName={styles.cockpitChartBody}
        >
          <p className={styles.chartTruthNote}>
            Benefit moves left to right only when baseline, usage, Finance, and
            attestation evidence clear the claim gate. Approved investment is
            not treated as promised benefit.
          </p>
          {s.promisedBenefitLoaded ? (
            <div
              className={styles.cockpitWaterfall}
              aria-describedby="tcc-waterfall-alt"
            >
              <ValueWaterfallChart summary={s} />
            </div>
          ) : (
            <div
              className={styles.emptyPanel}
              aria-describedby="tcc-waterfall-alt"
            >
              <h2>Explicit benefit is not loaded</h2>
              <p>
                Tower can see approved investment, adoption signals, and proof
                actions, but it will not draw a benefit waterfall until a
                source-backed benefit assertion exists.
              </p>
            </div>
          )}
          <p id="tcc-waterfall-alt" className={styles.srOnly}>
            {s.promisedBenefitLoaded
              ? `${waterfallRows
                  .map(
                    (row) =>
                      `${row.name.replace("|", " ")}: ${formatUsdM(row.usd)}`,
                  )
                  .join(". ")}.`
              : `Explicit promised benefit is not loaded. Approved investment is ${formatUsdM(s.approvedInvestmentUsd)}.`}
          </p>
          <button
            type="button"
            className={styles.cockpitCta}
            onClick={onGoToFunnel}
          >
            Inspect proof gates
          </button>
        </Card>

        <Card
          eyebrow="Portfolio decision matrix"
          right="risk pressure × proof maturity × exposure"
          headId="tcc-decision-matrix"
          bodyClassName={styles.cockpitChartBody}
        >
          {queue.length === 0 ? (
            <p className={styles.lhSub}>
              No program currently carries blocked value for this tenant.
            </p>
          ) : (
            <>
              <p className={styles.chartTruthNote}>
                Each bubble is a top blocked program: X is proof maturity, Y is
                risk pressure, and size is promised exposure.
              </p>
              <div
                className={styles.cockpitMatrix}
                aria-describedby="tcc-matrix-alt"
              >
                <OutcomeDecisionMatrixChart
                  programs={queue}
                  onSelect={onOpenProgram}
                />
              </div>
              <p id="tcc-matrix-alt" className={styles.srOnly}>
                {decisionMatrixTextAlternative(queue)}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same condition the verdict shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return (
    view.summary.claimableUsd <= 0 &&
    ((view.summary.approvedInvestmentUsd ?? 0) > 0 ||
      view.summary.promisedBenefitLoaded ||
      view.summary.economicReviewQueueCount > 0)
  );
}
