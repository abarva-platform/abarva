"use client";

// Tab 1 — Outcome Proof Cockpit.
//
// The Command Center now opens as a CFO operating room: verdict first, a compact
// scope read, and two decision visuals. Detail inspection lives in the other
// Tower tabs so the cockpit does not become a report appendix.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { ReactNode } from "react";
import type {
  TowerActionView,
  TowerCommandCenterView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";

import { EightQuarterTrajectoryChart } from "../charts/EightQuarterTrajectoryChart";
import {
  OutcomeDecisionMatrixChart,
  decisionMatrixTextAlternative,
} from "../charts/OutcomeDecisionMatrixChart";
import { ValueConversionBridgeChart } from "../charts/ValueConversionBridgeChart";
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
      note: `${formatCount(s.boardScopeProgramCount)} board-scope value cases`,
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
    return `${formatUsdM(s.approvedInvestmentUsd)} of approved investment is visible across ${formatCount(s.boardScopeProgramCount)} board-scope value cases, but explicit promised benefit is absent. Keep benefit totals null until source-backed value cases are loaded and classified.`;
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
  const laneRank = {
    stop: 0,
    freeze: 1,
    fix: 2,
    watch: 3,
    fund: 4,
  } satisfies Record<TowerProgramView["lane"], number>;
  return [...view.programs]
    .filter(
      (p) => p.valueAtStakeUsd > 0 || p.nextGate !== null || p.lane !== "fund",
    )
    .sort((a, b) => {
      const laneDelta = laneRank[a.lane] - laneRank[b.lane];
      if (laneDelta !== 0) return laneDelta;
      return b.valueAtStakeUsd - a.valueAtStakeUsd;
    })
    .slice(0, 6);
}

function ownerQueue(view: TowerCommandCenterView): TowerActionView[] {
  return [...view.actions]
    .filter((action) => (action.actionState ?? "open") === "open")
    .sort((a, b) => {
      const amountDelta = b.amountExposedUsd - a.amountExposedUsd;
      if (amountDelta !== 0) return amountDelta;
      return a.sequence - b.sequence;
    })
    .slice(0, 5);
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
  const owners = ownerQueue(view);
  const trustRows = sourceTrustRows(view);
  const openGapCount = view.gaps.length;
  const groupedCampaignCount = view.evidenceMaturity.interventions.length;

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
            {formatCount(s.totalProgramSubjectCount)} tracked program subjects
          </span>
          <span>
            {formatCount(s.boardScopeProgramCount)} board-scope value cases
          </span>
          <span>
            {formatCount(s.aiInitiativeCount)} AI tools, agents and linked
            capabilities
          </span>
          <span>{formatCount(view.actions.length)} total evidence actions</span>
          <span>{formatCount(openGapCount)} current priority actions</span>
          <span>
            {formatCount(groupedCampaignCount)} grouped action campaigns
          </span>
          <span>
            {formatCount(s.economicReviewQueueCount)} economic reviews
          </span>
          <span>benefit source: {trustRows[2]?.status ?? "ABSENT"}</span>
        </div>
      </section>

      <div className={styles.cockpitCanvas}>
        <Card
          eyebrow="Investment to value conversion"
          right="evidence gates · governed values"
          headId="tcc-conversion-bridge"
          bodyClassName={styles.cockpitChartBody}
        >
          <p className={styles.chartTruthNote}>
            AI investment becomes economic value only when adoption, workflow
            change, operating outcomes, conversion evidence, and Finance
            attestation are all explicit.
          </p>
          <div
            className={styles.cockpitBridge}
            aria-describedby="tcc-conversion-alt"
          >
            <ValueConversionBridgeChart stages={view.conversionBridge} />
          </div>
          <p id="tcc-conversion-alt" className={styles.srOnly}>
            {view.conversionBridge
              .map(
                (stage) =>
                  `${stage.label}: ${formatUsdM(stage.valueUsd)}, ${formatCount(stage.count)} records, ${stage.note}`,
              )
              .join(". ")}
          </p>
        </Card>

        <Card
          eyebrow="Eight-quarter value trajectory"
          right="forecast schedule · consumption view"
          headId="tcc-value-trajectory"
          bodyClassName={styles.cockpitChartBody}
        >
          <p className={styles.chartTruthNote}>
            Planned investment, spend, forecast, Finance run-rate, and
            conversion are read from the governed eight-quarter schedule.
          </p>
          {view.valueTrajectory.length === 0 ? (
            <div className={styles.emptyPanel}>
              <h2>Trajectory is not loaded</h2>
              <p>
                The Tower Value OS did not return quarter-level trajectory rows
                for this tenant, so this cockpit leaves the forward path blank.
              </p>
            </div>
          ) : (
            <div className={styles.cockpitTrajectory}>
              <EightQuarterTrajectoryChart points={view.valueTrajectory} />
            </div>
          )}
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
                Each bubble is a material board-scope value case: X is proof
                maturity, Y is risk pressure, and size is capital exposure.
                Benefit remains a separate proof gate.
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

        <Card
          eyebrow="Proof operations"
          right="evidence owners · source trust"
          headId="tcc-proof-operations"
          bodyClassName={styles.cockpitOpsBody}
        >
          <div className={styles.opsSplit}>
            <section aria-label="Evidence-owner queue">
              <div className={styles.opsHead}>
                <span>Evidence-owner queue</span>
                <b>{formatCount(owners.length)}</b>
              </div>
              {owners.length === 0 ? (
                <p className={styles.lhSub}>
                  No open owner actions are available in the governed queue.
                </p>
              ) : (
                <div className={styles.opsQueue}>
                  {owners.map((action) => (
                    <article key={action.id} className={styles.opsAction}>
                      <span className={styles.opsActionK}>
                        {action.ownerRole}
                      </span>
                      <b>{action.title}</b>
                      <small>
                        {action.evidenceRequirement ??
                          action.evidence ??
                          "Evidence package required"}
                      </small>
                      <em>
                        {formatUsdM(action.amountExposedUsd)} exposed ·{" "}
                        {action.due ?? "due not loaded"}
                      </em>
                    </article>
                  ))}
                </div>
              )}
              <button
                type="button"
                className={styles.cockpitCta}
                onClick={onGoToFunnel}
              >
                Inspect proof gates
              </button>
            </section>

            <section aria-label="Source trust rail">
              <div className={styles.opsHead}>
                <span>Source trust rail</span>
                <b>{trustRows[2]?.status ?? "ABSENT"}</b>
              </div>
              <div className={styles.sourceTrustRail}>
                {trustRows.map((row) => (
                  <div key={row.label} className={styles.trustMiniRow}>
                    <span>
                      <i
                        className={cx(styles.dot, styles[row.tone])}
                        aria-hidden="true"
                      />
                      {row.label}
                    </span>
                    <b>{row.value}</b>
                    <span
                      className={cx(
                        styles.chip,
                        styles.cMono,
                        row.tone === "teal"
                          ? styles.cTeal
                          : row.tone === "red"
                            ? styles.cRed
                            : styles.cAmber,
                      )}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
