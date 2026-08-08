"use client";

// Tab 1 — Outcome Proof Cockpit.
//
// The Command Center now opens as a CFO operating room: verdict first, proof
// waterfall, labeled capital matrix, evidence-owner queue, and a tiny lineage
// rail. It remains a Layer 4 projection over the existing Tower mart view model.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type { ReactNode } from "react";
import type {
  TowerCommandCenterView,
  TowerEvidenceGapView,
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
import { Card, Chip, Dot, Unknown, cx } from "../primitives";
import styles from "../TowerCommandCenter.module.css";

interface BoardMetric {
  key: string;
  label: string;
  value: ReactNode;
  note: string;
  tone: "teal" | "amber" | "red" | "gray";
}

interface ProofStage {
  label: string;
  value: ReactNode;
  programs: ReactNode;
  note: string;
}

function uniqueProgramCount(gaps: readonly TowerEvidenceGapView[]): number {
  return new Set(
    gaps
      .map((gap) => gap.sourceProgramId)
      .filter((id): id is string => Boolean(id)),
  ).size;
}

function boardMetrics(view: TowerCommandCenterView): BoardMetric[] {
  const s = view.summary;
  const financeBlockedUsd = s.financeValidatedBlockedUsd;
  const blockedPrograms =
    s.blockedProgramCount ||
    view.programs.filter((p) => p.blockedUsd > 0).length;
  const programsMissingProof = Math.max(
    blockedPrograms,
    uniqueProgramCount(view.gaps),
  );
  const sourceConflictValue =
    s.conflictedProgramCount > 0 ? (
      formatCount(s.conflictedProgramCount)
    ) : view.evidenceFacts.some((fact) => fact.lineageState === "CONFLICT") ? (
      formatCount(
        view.evidenceFacts.filter((fact) => fact.lineageState === "CONFLICT")
          .length,
      )
    ) : (
      <Unknown label="Not loaded" />
    );

  return [
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
    {
      key: "missing-proof",
      label: "Programs missing proof",
      value: formatCount(programsMissingProof),
      note: "programs with blocked value or evidence gaps",
      tone: programsMissingProof > 0 ? "red" : "teal",
    },
    {
      key: "source-conflicts",
      label: "Material source conflicts",
      value: sourceConflictValue,
      note:
        s.conflictedProgramCount > 0
          ? "first-class lineage conflicts in the mart"
          : "requires lineage-status projection in the mart",
      tone: s.conflictedProgramCount > 0 ? "red" : "amber",
    },
  ];
}

function proofStages(view: TowerCommandCenterView): ProofStage[] {
  const programs = view.programs;
  const stageByKey = new Map(view.funnel.map((stage) => [stage.key, stage]));
  const funded = stageByKey.get("funded") ?? stageByKey.get("promised_value");
  const baseline = stageByKey.get("baseline_supported");
  const usage = stageByKey.get("usage_supported");
  const finance = stageByKey.get("finance_validated");
  const claimable =
    stageByKey.get("claimable") ?? stageByKey.get("realized_claimable");
  const usagePrograms =
    usage?.knownValueClaimCount ??
    programs.filter((p) => p.usageStatus !== "none").length;
  const financePrograms =
    finance?.knownValueClaimCount ??
    programs.filter((p) => p.financeStatus !== "none").length;
  const claimablePrograms =
    claimable?.knownValueClaimCount ??
    programs.filter((p) => p.claimableUsd > 0).length;

  return [
    {
      label: "Promised value",
      value: formatUsdM(funded?.knownValueAmount ?? view.summary.promisedUsd),
      programs: `${formatCount(funded?.claimCount ?? programs.length)} programs`,
      note: "business-case value in the mart",
    },
    {
      label: "Baseline supported",
      value: baseline ? (
        formatUsdM(baseline.knownValueAmount)
      ) : (
        <Unknown label="Not loaded" />
      ),
      programs: baseline ? (
        `${formatCount(baseline.knownValueClaimCount)} programs`
      ) : (
        <Unknown label="Not loaded" />
      ),
      note:
        baseline?.primaryBlocker ??
        "baseline-supported value is not yet a mart field",
    },
    {
      label: "Usage supported",
      value: formatUsdM(
        usage?.knownValueAmount ?? view.summary.usageSupportedUsd,
      ),
      programs: `${formatCount(usagePrograms)} programs`,
      note: "usage evidence, not outcome proof",
    },
    {
      label: "Finance validated",
      value: formatUsdM(
        finance?.knownValueAmount ?? view.summary.financeValidatedUsd,
      ),
      programs: `${formatCount(financePrograms)} programs`,
      note: "partial validation still may be unclaimable",
    },
    {
      label: "Claimable",
      value: formatUsdM(
        claimable?.knownValueAmount ?? view.summary.claimableUsd,
      ),
      programs: `${formatCount(claimablePrograms)} programs`,
      note: "cleared Tower claim gate",
    },
  ];
}

function evidenceOwnerQueue(
  gaps: readonly TowerEvidenceGapView[],
): TowerEvidenceGapView[] {
  return [...gaps]
    .sort((a, b) => {
      if (a.primaryBlockingGap !== b.primaryBlockingGap)
        return a.primaryBlockingGap ? -1 : 1;
      return (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0);
    })
    .slice(0, 6);
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
      status: "MART",
      tone: "teal" as const,
    },
    {
      label: "Promised value",
      value: formatUsdM(s.promisedUsd),
      status: conflicts > 0 ? "CONFLICT" : "LINEAGE NOT LOADED",
      tone: "amber" as const,
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
          ? "MART STATE"
          : "NOT IN MART",
      tone:
        s.conflictedProgramCount > 0 || conflicts > 0
          ? ("red" as const)
          : ("amber" as const),
    },
  ];
}

function cockpitVerdict(view: TowerCommandCenterView): string {
  if (view.summary.claimableUsd > 0) {
    return "Some value is claimable, but additional capital still depends on the proof gates below.";
  }
  if (view.summary.promisedUsd > 0) {
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
  const stages = proofStages(view);
  const queue = decisionQueue(view);
  const gaps = evidenceOwnerQueue(view.gaps);
  const waterfallRows = buildWaterfallRows(s);

  return (
    <div className={cx(styles.view, styles.cockpitView)}>
      <section
        className={styles.boardPosture}
        aria-labelledby="tcc-board-posture"
      >
        <div className={styles.boardVerdict}>
          <div className={styles.eyebrow2}>Board value posture</div>
          <h2 id="tcc-board-posture">{cockpitVerdict(view)}</h2>
          <p>
            Do not scale additional investment until the proof gates below are
            closed.
          </p>
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
        className={styles.proofStrip}
        aria-label="Money and program proof posture"
      >
        {stages.map((stage) => (
          <div key={stage.label} className={styles.proofStage}>
            <span className={styles.psLabel}>{stage.label}</span>
            <span className={styles.psValue}>{stage.value}</span>
            <span className={styles.psPrograms}>{stage.programs} programs</span>
            <span className={styles.psNote}>{stage.note}</span>
          </div>
        ))}
      </section>

      <div className={styles.cockpitCanvas}>
        <Card
          eyebrow="Where value gets stopped"
          right="Recharts · governed mart values"
          headId="tcc-outcome-waterfall"
          bodyClassName={styles.cockpitChartBody}
        >
          <div
            className={styles.cockpitWaterfall}
            aria-describedby="tcc-waterfall-alt"
          >
            <ValueWaterfallChart summary={s} />
          </div>
          <p id="tcc-waterfall-alt" className={styles.srOnly}>
            {waterfallRows
              .map(
                (row) =>
                  `${row.name.replace("|", " ")}: ${formatUsdM(row.usd)}`,
              )
              .join(". ")}
            .
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
          eyebrow="Capital decision matrix"
          right="Top exposure programs"
          headId="tcc-decision-matrix"
          bodyClassName={styles.cockpitChartBody}
        >
          {queue.length === 0 ? (
            <p className={styles.lhSub}>
              No program currently carries blocked value for this tenant.
            </p>
          ) : (
            <>
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

      <div className={styles.cockpitOps}>
        <Card
          title="Evidence-owner queue"
          right="Who needs to do what before capital moves"
          headId="tcc-evidence-owner-queue"
          bodyClassName={styles.scroll}
          bodyStyle={{ paddingTop: 8 }}
        >
          {gaps.length === 0 ? (
            <p className={styles.lhSub}>
              No business evidence gaps are currently recorded for this tenant.
            </p>
          ) : (
            <table className={styles.tbl}>
              <thead>
                <tr>
                  <th scope="col">Proof blocker</th>
                  <th scope="col" className={styles.num}>
                    Value exposed
                  </th>
                  <th scope="col">Owner</th>
                  <th scope="col">Evidence needed</th>
                  <th scope="col">Due</th>
                  <th scope="col">Decision blocked</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map((gap) => (
                  <tr
                    key={gap.id}
                    className={gap.sourceProgramId ? styles.click : undefined}
                    onClick={() => {
                      if (gap.sourceProgramId)
                        onOpenProgram(gap.sourceProgramId);
                    }}
                  >
                    <td>
                      <span className={styles.pname}>{gap.area}</span>
                      <div className={styles.psub}>{gap.linkedProgram}</div>
                    </td>
                    <td className={styles.num}>
                      <div className={cx(styles.bignum, styles.nRed)}>
                        {gap.valueAtStakeUsd === null ? (
                          <Unknown label="Unknown" />
                        ) : (
                          formatUsdM(gap.valueAtStakeUsd)
                        )}
                      </div>
                    </td>
                    <td>
                      <Chip tone={gap.owner ? "teal" : "red"} mono>
                        {gap.owner ?? "No owner"}
                      </Chip>
                    </td>
                    <td>
                      <div className={styles.gateCell}>
                        {gap.missing}
                        <div className={styles.subnum}>
                          Source: {gap.sourceTemplate ?? "Not recorded"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Unknown label="Not recorded" />
                    </td>
                    <td>
                      <span className={styles.gateCell}>
                        {gap.blockedDecision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card
          title="Source trust rail"
          right="Tiny, always visible"
          headId="tcc-source-trust"
          bodyClassName={styles.sourceTrustRail}
        >
          {sourceTrustRows(view).map((row) => (
            <div key={row.label} className={styles.trustMiniRow}>
              <span>
                <Dot tone={row.tone} />
                {row.label}
              </span>
              <b>{row.value}</b>
              <Chip tone={row.tone} mono>
                {row.status}
              </Chip>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same condition the verdict shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return view.summary.claimableUsd <= 0 && view.summary.promisedUsd > 0;
}
