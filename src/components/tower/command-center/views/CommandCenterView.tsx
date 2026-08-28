"use client";

// Tab 1 — Executive View.
//
// The attached design is the visual contract for this surface. This component
// keeps the same Layer 4 boundary as the previous Command Center: it only
// projects the governed Tower command-center view model.

import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import type {
  TowerCommandCenterView,
  TowerEvidenceGapView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import styles from "../TowerCommandCenter.module.css";
import {
  ChartTooltip,
  HEX,
  toM,
  twoLineTick,
  withSliver,
} from "../charts/chart-kit";
import { cx } from "../primitives";

interface ExecutiveMetric {
  label: string;
  badge?: string;
  value: string;
  note: string;
  tone: "teal" | "amber" | "red" | "gray";
}

interface ExecutiveDecision {
  order: string;
  kicker: string;
  title: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
  due: string;
  tone: "red" | "amber" | "gray";
  programId: string | null;
}

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function measuredUsd(view: TowerCommandCenterView): number {
  return Math.max(
    view.summary.financeValidatedUsd,
    view.summary.usageSupportedUsd,
    0,
  );
}

function conflictCount(view: TowerCommandCenterView): number {
  return Math.max(
    view.summary.conflictedProgramCount,
    view.evidenceFacts.filter((fact) => fact.lineageState === "CONFLICT")
      .length,
  );
}

function absentCount(view: TowerCommandCenterView): number {
  return view.unknownSlots.length + view.pipelineGaps.length;
}

function executiveHeadline(view: TowerCommandCenterView): string {
  const s = view.summary;
  const breakGate = s.usageSupportedUsd <= 0 ? 2 : s.financeValidatedUsd <= 0 ? 6 : 7;
  return `${formatUsdM(s.budgetUsd || s.promisedUsd)} approved. ${formatUsdM(
    s.claimableUsd,
  )} provable. The chain breaks at gate ${breakGate} of 7.`;
}

function executiveSummary(view: TowerCommandCenterView): string {
  const s = view.summary;
  if (s.executiveSummary) return s.executiveSummary;
  if (s.usageSupportedUsd <= 0) {
    return "No governed usage support is visible, so adoption evidence is empty and every gate downstream of it is unreachable. Instrument, measure, then attest, in that order.";
  }
  if (s.financeValidatedUsd <= 0) {
    return "Usage evidence exists, but the finance-validation gate has not released board-claimable value. Measure the outcomes, then staff validation.";
  }
  return "Tower shows measured value in the portfolio, but the claim gate still determines what can be represented as board-claimable.";
}

function metrics(view: TowerCommandCenterView): ExecutiveMetric[] {
  const s = view.summary;
  const claims =
    s.unknownValueClaimCount + s.claimableProgramCount + s.blockedProgramCount ||
    view.programs.length;
  const emitting = view.ai.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
  return [
    {
      label: "Approved investment",
      value: formatUsdM(s.budgetUsd || s.promisedUsd),
      note: `${formatCount(s.programCount || view.programs.length)} programs · approved capital only`,
      tone: "teal",
    },
    {
      label: "Asserted benefit",
      badge: s.claimableUsd > 0 ? "PARTIAL" : "UNPROVEN",
      value: formatUsdM(s.promisedUsd),
      note: `${formatCount(claims)} claims · planning values, not outcomes`,
      tone: "amber",
    },
    {
      label: "Board-claimable",
      badge: s.claimableUsd > 0 ? "OPEN" : "BLOCKED",
      value: formatUsdM(s.claimableUsd),
      note: `${formatCount(s.claimableProgramCount)} of ${formatCount(
        Math.max(claims, s.claimableProgramCount),
      )} claims attested by Finance`,
      tone: s.claimableUsd > 0 ? "teal" : "red",
    },
    {
      label: "AI & BI assets emitting usage",
      badge: emitting > 0 ? "VISIBLE" : "DARK",
      value: `${formatCount(emitting)} of ${formatCount(
        s.aiInitiativeCount || view.ai.length,
      )}`,
      note: `${formatUsdM(s.aiAttributedInitiativeSpendUsd || s.aiTaggedUsd)} attributed, ${
        emitting > 0 ? "partially instrumented" : "none instrumented"
      }`,
      tone: emitting > 0 ? "teal" : "red",
    },
  ];
}

function topBlockedProgram(view: TowerCommandCenterView): TowerProgramView | null {
  return (
    [...view.programs].sort((a, b) => b.blockedUsd - a.blockedUsd)[0] ?? null
  );
}

function decisions(view: TowerCommandCenterView): ExecutiveDecision[] {
  const s = view.summary;
  const claimsMissingActual = Math.max(
    s.unknownValueClaimCount,
    s.unmeasuredProgramCount,
  );
  const firstProgram = topBlockedProgram(view);
  const measured = measuredUsd(view);

  return [
    {
      order: "1",
      kicker: "Instrument · do this first",
      title: "Connect usage telemetry on the attributed domains",
      detail:
        "Gate 2 is empty, so downstream gates cannot be measured, validated or attested until the assets emit.",
      metricLabel: "Spend unmeasurable",
      metricValue: formatUsdM(s.aiAttributedInitiativeSpendUsd || s.aiTaggedUsd),
      due: "Next review",
      tone: "red",
      programId: firstProgram?.id ?? null,
    },
    {
      order: "2",
      kicker: "Measure · then this",
      title: `Backfill measured outcome on the ${formatCount(
        claimsMissingActual,
      )} claims that carry no actual`,
      detail:
        "Measured outcomes create something a validator can sign. Until then, planning value remains planning value.",
      metricLabel: "Claims short",
      metricValue: formatCount(claimsMissingActual),
      due: "Next month",
      tone: "amber",
      programId: firstProgram?.id ?? null,
    },
    {
      order: "3",
      kicker: "Assign · only then",
      title: "Name a finance validator so the claim gate has an owner",
      detail:
        "Worth doing now, but it releases nothing on its own. The current sign-off ceiling is the measured amount in the portfolio.",
      metricLabel: "Ceiling today",
      metricValue: formatUsdM(measured),
      due: "Following review",
      tone: "gray",
      programId: firstProgram?.id ?? null,
    },
  ];
}

function evidenceFooterCount(view: TowerCommandCenterView): number {
  return view.actions.length + view.gaps.length + view.pipelineGaps.length;
}

function evidenceQueue(gaps: readonly TowerEvidenceGapView[]) {
  return [...gaps]
    .sort((a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0))
    .slice(0, 5);
}

function executiveWaterfallRows(view: TowerCommandCenterView) {
  const s = view.summary;
  const approved = Math.max(s.budgetUsd, s.promisedUsd, s.aiTaggedUsd);
  const asserted = s.promisedUsd;
  const measured = measuredUsd(view);
  const claimable = s.claimableUsd;
  const noBenefit = Math.max(0, approved - asserted);
  const noMeasured = Math.max(0, asserted - measured);

  return [
    {
      name: "Approved|investment",
      baseUsd: 0,
      usd: approved,
      fill: HEX.tealDark,
      label: formatUsdM(approved),
    },
    {
      name: "No benefit|asserted",
      baseUsd: asserted,
      usd: noBenefit,
      fill: HEX.gray300,
      label: formatUsdM(noBenefit),
    },
    {
      name: "Asserted|benefit",
      baseUsd: 0,
      usd: asserted,
      fill: HEX.amber,
      label: formatUsdM(asserted),
    },
    {
      name: "No measured|amount",
      baseUsd: measured,
      usd: noMeasured,
      fill: "#cfcbc1",
      label: formatUsdM(noMeasured),
    },
    {
      name: "Measured|amount",
      baseUsd: 0,
      usd: measured,
      fill: HEX.red,
      label: formatUsdM(measured),
    },
    {
      name: "Board-|claimable",
      baseUsd: 0,
      usd: claimable,
      fill: HEX.red,
      label: formatUsdM(claimable),
    },
  ];
}

function ExecutiveWaterfallChart({ view }: { view: TowerCommandCenterView }) {
  const rows = executiveWaterfallRows(view);
  const axisMax = Math.max(...rows.map((row) => toM(row.baseUsd + row.usd)), 1);
  const data = rows.map((row) => ({
    ...row,
    base: toM(row.baseUsd),
    visible: withSliver(toM(row.usd), axisMax),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 28, right: 18, left: 6, bottom: 10 }}
        barCategoryGap="24%"
      >
        <CartesianGrid vertical={false} stroke={HEX.border} />
        <XAxis
          dataKey="name"
          interval={0}
          tickLine={false}
          axisLine={{ stroke: HEX.borderStrong }}
          height={48}
          tick={twoLineTick}
        />
        <YAxis
          tickFormatter={(value: number) => `$${Math.round(value)}M`}
          tick={{
            fontSize: 10,
            fill: HEX.gray500,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <ChartTooltip formatter={(value) => `$${Number(value).toFixed(1)}M`} />
        <Bar dataKey="base" stackId="value" fill="transparent" isAnimationActive={false} />
        <Bar
          dataKey="visible"
          stackId="value"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        >
          {data.map((row) => (
            <Cell key={row.name} fill={row.fill} />
          ))}
          <LabelList
            dataKey="label"
            position="top"
            style={{
              fontFamily: "var(--abarva-mono)",
              fontSize: 11,
              fontWeight: 700,
              fill: HEX.gray700,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
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
  const measured = measuredUsd(view);
  const unmeasured = Math.max(0, s.promisedUsd - measured);
  const unmeasuredPct = percent(unmeasured, s.promisedUsd);
  const executiveMetrics = metrics(view);
  const executiveDecisions = decisions(view);

  return (
    <div className={styles.executiveView}>
      <header className={styles.executiveHero}>
        <div className={styles.executiveEyebrow}>
          IT Investment Tower · FY26 · Today&apos;s verdict
        </div>
        <h1>{executiveHeadline(view)}</h1>
        <div className={styles.executiveSummaryGrid}>
          <p>{executiveSummary(view)}</p>
          <aside className={styles.executiveAudit}>
            <div>
              As of {s.martVersion || "current mart"} · {s.sourceStandard}
            </div>
            <div>{s.sourceFiles.slice(0, 4).join(" · ") || "No source files"}</div>
            <div className={styles.auditBadges}>
              <span className={styles.auditRed}>
                {formatCount(conflictCount(view))} conflict
              </span>
              <span className={styles.auditAmber}>
                {formatCount(absentCount(view))} absent
              </span>
              <span>No build time</span>
            </div>
          </aside>
        </div>

        <section className={styles.executiveMetrics}>
          {executiveMetrics.map((metric) => (
            <article
              key={metric.label}
              className={cx(styles.executiveMetric, styles[`metric${metric.tone}`])}
            >
              <div className={styles.metricLabel}>
                {metric.label}
                {metric.badge ? <span>{metric.badge}</span> : null}
              </div>
              <div className={styles.metricValue}>{metric.value}</div>
              <div className={styles.metricNote}>{metric.note}</div>
            </article>
          ))}
        </section>
      </header>

      <section className={styles.reviewDecisions}>
        <div className={styles.sectionTitle}>
          <h2>Decisions for this review</h2>
          <span>{executiveDecisions.length}</span>
          <p>Each is a precondition for the next</p>
        </div>
        <div className={styles.decisionStack}>
          {executiveDecisions.map((decision) => (
            <article
              key={decision.order}
              className={cx(
                styles.executiveDecision,
                styles[`decision${decision.tone}`],
              )}
            >
              <div className={styles.decisionOrder}>{decision.order}</div>
              <div className={styles.decisionMain}>
                <div className={styles.decisionKicker}>{decision.kicker}</div>
                <h3>{decision.title}</h3>
                <p>{decision.detail}</p>
              </div>
              <div className={styles.decisionMeta}>
                <div>
                  <span>{decision.metricLabel}</span>
                  <strong>{decision.metricValue}</strong>
                </div>
                <div>
                  <span>Due</span>
                  <strong>{decision.due}</strong>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    decision.programId
                      ? onOpenProgram(decision.programId)
                      : onGoToFunnel()
                  }
                >
                  Review →
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.valueLoss}>
        <div className={styles.sectionTitle}>
          <h2>Where the value is lost</h2>
          <p>Double-click for the records behind any figure</p>
        </div>
        <div className={styles.valueChartCard}>
          <div className={styles.executiveWaterfall}>
            <ExecutiveWaterfallChart view={view} />
          </div>
          <div className={styles.valueChartLegend}>
            Each drop is a gate, not a loss. Of the {formatUsdM(s.promisedUsd)} asserted,
            only {formatUsdM(measured)} has a measured amount behind it — and only{" "}
            {formatUsdM(s.claimableUsd)} is claimable.
          </div>
        </div>
      </section>

      <section className={styles.executiveFindings}>
        <article className={styles.findingRed}>
          <div className={styles.findingKicker}>The drop is the finding</div>
          <strong>{unmeasuredPct}</strong>
          <p>
            of asserted benefit has no measured amount in the governed Tower
            read. Nothing here is promoted to claimable value until evidence
            clears.
          </p>
        </article>
        <article className={styles.findingTeal}>
          <div className={styles.findingKicker}>Ceiling on any sign-off today</div>
          <strong>{formatUsdM(measured)}</strong>
          <p>
            {formatUsdM(measured)} is the measured amount currently visible in
            the portfolio. No attestation can release more than that without new
            measured evidence.
          </p>
        </article>
      </section>

      <section className={styles.executiveLinks}>
        <span>Detail lives where it belongs:</span>
        <button type="button" onClick={onGoToFunnel}>
          {formatCount(view.programs.length)} value cases and the gate that holds them →
        </button>
        <button type="button">
          {formatCount(s.aiInitiativeCount || view.ai.length)} AI and BI assets by cost,
          risk and adoption →
        </button>
        <button type="button">
          {formatCount(evidenceFooterCount(view))} open tasks in evidence queues →
        </button>
      </section>

      {evidenceQueue(view.gaps).length > 0 ? (
        <section className={styles.executiveEvidenceTail} aria-label="Top evidence queue">
          {evidenceQueue(view.gaps).map((gap) => (
            <button
              key={gap.id}
              type="button"
              onClick={() => gap.sourceProgramId && onOpenProgram(gap.sourceProgramId)}
            >
              <span>{gap.missing}</span>
              <strong>
                {gap.valueAtStakeUsd === null
                  ? "Unknown"
                  : formatUsdM(gap.valueAtStakeUsd)}
              </strong>
              <small>{gap.owner ?? "No owner"}</small>
            </button>
          ))}
        </section>
      ) : null}

      <footer className={styles.executiveFoot}>
        {view.summary.tenantName} · adoption, finance validation and claimable
        value are separate gates
      </footer>
    </div>
  );
}

/** Re-exported so the tab bar can badge the same condition the verdict shows. */
export function commandCenterAttention(view: TowerCommandCenterView): boolean {
  return view.summary.claimableUsd <= 0 && view.summary.promisedUsd > 0;
}
