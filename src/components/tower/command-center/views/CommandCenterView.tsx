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
  reviewTarget: "funnel" | "ai" | "actions";
}

function percent(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function measuredUsd(view: TowerCommandCenterView): number {
  return Math.max(
    view.summary.financeValidatedUsd ?? 0,
    view.summary.usageSupportedUsd ?? 0,
    0,
  );
}

function formatLoadedUsdM(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "not loaded"
    : formatUsdM(value);
}

function valueClaimCount(view: TowerCommandCenterView): number {
  return view.summary.valueClaimCount;
}

function openClaimCount(view: TowerCommandCenterView): number {
  const s = view.summary;
  return Math.max(0, valueClaimCount(view) - s.claimableClaimCount);
}

function aiToolRolloutCount(view: TowerCommandCenterView): number {
  return Math.max(0, view.allInitiatives.length - view.programs.length);
}

function commandFreshnessLine(view: TowerCommandCenterView): string {
  const s = view.summary;
  const asOf = s.asOfPeriod
    ? `As of ${s.asOfPeriod}`
    : "As-of date not recorded";
  const built = s.refreshTimestamp
    ? `built ${s.refreshTimestamp.slice(0, 10)}`
    : "build date not recorded";
  return `${asOf} · ${built}`;
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
  return `${formatLoadedUsdM(s.approvedInvestmentUsd)} approved. ${formatUsdM(
    s.claimableUsd,
  )} board-claimable. ${formatCount(openClaimCount(view))} of ${formatCount(
    valueClaimCount(view),
  )} claims still need proof.`;
}

function executiveSummary(view: TowerCommandCenterView): string {
  const s = view.summary;
  const claims = valueClaimCount(view);
  return `${view.summary.tenantName} has ${formatLoadedUsdM(
    s.approvedInvestmentUsd,
  )} in the reviewed project portfolio, including ${formatUsdM(
    s.aiAttributedInitiativeSpendUsd,
  )} tied to AI initiatives and tool rollouts. Business cases project ${formatUsdM(
    s.promisedUsd,
  )} of annual value; ${formatUsdM(
    s.claimableUsd,
  )} is board-claimable today, and ${formatCount(
    Math.max(0, claims - s.claimableClaimCount),
  )} claims still need usage, outcome, or Finance proof.`;
}

function metrics(view: TowerCommandCenterView): ExecutiveMetric[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const emitting = view.ai.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
  return [
    {
      label: "Approved IT project portfolio",
      value: formatLoadedUsdM(s.approvedInvestmentUsd),
      note: `${formatCount(
        s.totalProgramSubjectCount || s.programCount || view.programs.length,
      )} projects · approved capital only`,
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
      note: `${formatCount(s.financeAttestedClaimCount)} of ${formatCount(
        claims,
      )} claims attested by Finance`,
      tone: s.claimableUsd > 0 ? "teal" : "red",
    },
    {
      label: "AI initiatives and tools tracked",
      badge: emitting > 0 ? "VISIBLE" : "DARK",
      value: `${formatCount(s.aiInitiativeCount)}`,
      note: `${formatCount(view.programs.length)} AI business cases + ${formatCount(
        aiToolRolloutCount(view),
      )} tool rollouts · ${formatUsdM(
        s.aiAttributedInitiativeSpendUsd,
      )} attributed`,
      tone: emitting > 0 ? "teal" : "red",
    },
    {
      label: "Usage evidence mapped",
      badge: s.usageSupportedClaimCount === claims ? "COMPLETE" : "PARTIAL",
      value: `${formatCount(s.usageSupportedClaimCount)} of ${formatCount(
        claims,
      )}`,
      note:
        s.usageSupportedClaimCount === claims
          ? "Every value claim has usage-to-value support"
          : `${formatCount(
              Math.max(0, claims - s.usageSupportedClaimCount),
            )} claims still need usage-to-value mapping`,
      tone: s.usageSupportedClaimCount > 0 ? "amber" : "red",
    },
  ];
}

function decisions(view: TowerCommandCenterView): ExecutiveDecision[] {
  const s = view.summary;
  const claims = valueClaimCount(view);
  const measured = measuredUsd(view);
  const claimsMissingUsage = Math.max(0, claims - s.usageSupportedClaimCount);
  const claimsMissingActual = Math.max(0, claims - s.outcomeMeasuredClaimCount);
  const claimsMissingFinance = Math.max(0, claims - s.financeAttestedClaimCount);

  return [
    {
      order: "1",
      kicker: "Map · do this first",
      title:
        claimsMissingUsage > 0
          ? `Close usage-to-value gaps on ${formatCount(claimsMissingUsage)} claims`
          : "Keep usage mapped as actuals refresh",
      detail:
        claimsMissingUsage > 0
          ? `${formatCount(s.usageSupportedClaimCount)} of ${formatCount(
              claims,
            )} claims have usage support. The remaining claims need tool, workflow, or adoption evidence before the value can advance.`
          : "Usage-to-value support is loaded for the current claim set. Keep it current as monthly actuals are refreshed.",
      metricLabel: "Usage-supported claims",
      metricValue: `${formatCount(s.usageSupportedClaimCount)}/${formatCount(
        claims,
      )}`,
      due: "Next review",
      tone: "red",
      reviewTarget: "ai",
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
      reviewTarget: "funnel",
    },
    {
      order: "3",
      kicker: "Assign · only then",
      title: `Finance-attest the ${formatCount(claimsMissingFinance)} claims still outside the board number`,
      detail: `${formatUsdM(
        measured,
      )} is the current evidence-backed ceiling. Only ${formatUsdM(
        s.claimableUsd,
      )} is board-claimable until Finance signs the method and amount.`,
      metricLabel: "Claimable / ceiling",
      metricValue: `${formatUsdM(s.claimableUsd)} / ${formatUsdM(measured)}`,
      due: "Following review",
      tone: "gray",
      reviewTarget: "actions",
    },
  ];
}

function evidenceFooterCount(view: TowerCommandCenterView): number {
  return view.actions.length;
}

function evidenceQueue(gaps: readonly TowerEvidenceGapView[]) {
  return [...gaps]
    .sort((a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0))
    .slice(0, 5);
}

function executiveWaterfallRows(view: TowerCommandCenterView) {
  const s = view.summary;
  const approved = s.approvedInvestmentUsd;
  const approvedValue = approved ?? 0;
  const asserted = s.promisedUsd ?? 0;
  const measured = measuredUsd(view);
  const claimable = s.claimableUsd ?? 0;
  const noBenefit = approved === null ? 0 : Math.max(0, approved - asserted);
  const noMeasured = Math.max(0, asserted - measured);

  return [
    {
      name: "Approved|investment",
      baseUsd: 0,
      usd: approvedValue,
      fill: HEX.tealDark,
      label: formatLoadedUsdM(approved),
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
        <Bar
          dataKey="base"
          stackId="value"
          fill="transparent"
          isAnimationActive={false}
        />
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
  onOpenGap,
  onGoToFunnel,
  onGoToAi,
  onGoToActions,
}: {
  view: TowerCommandCenterView;
  onOpenGap: (id: string) => void;
  onGoToFunnel: () => void;
  onGoToAi: () => void;
  onGoToActions: () => void;
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
            <div>{commandFreshnessLine(view)}</div>
            <div>{s.sourceStandard}</div>
            <div>
              {s.sourceFiles.slice(0, 4).join(" · ") || "No source files"}
            </div>
            <div className={styles.auditBadges}>
              <span className={styles.auditRed}>
                {formatCount(conflictCount(view))} conflict
              </span>
              <span className={styles.auditAmber}>
                {formatCount(absentCount(view))} absent
              </span>
              <span>
                {s.refreshTimestamp
                  ? "build recorded"
                  : "build date not recorded"}
              </span>
            </div>
          </aside>
        </div>

        <section className={styles.executiveMetrics}>
          {executiveMetrics.map((metric) => (
            <article
              key={metric.label}
              className={cx(
                styles.executiveMetric,
                styles[`metric${metric.tone}`],
              )}
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
                  onClick={() => {
                    if (decision.reviewTarget === "ai") onGoToAi();
                    else if (decision.reviewTarget === "actions")
                      onGoToActions();
                    else onGoToFunnel();
                  }}
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
            Each drop is a gate, not a loss. Of the {formatUsdM(s.promisedUsd)}{" "}
            asserted, only {formatUsdM(measured)} has a measured amount behind
            it — and only {formatUsdM(s.claimableUsd)} is claimable.
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
          <div className={styles.findingKicker}>
            Ceiling on any sign-off today
          </div>
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
          {formatCount(valueClaimCount(view))} value claims and the gate that
          holds them →
        </button>
        <button type="button" onClick={onGoToAi}>
          {formatCount(s.aiInitiativeCount)} AI initiatives
          and tool rollouts by cost, risk and adoption →
        </button>
        <button type="button" onClick={onGoToActions}>
          {formatCount(evidenceFooterCount(view))} open evidence actions →
        </button>
      </section>

      {evidenceQueue(view.gaps).length > 0 ? (
        <section
          className={styles.executiveEvidenceTail}
          aria-label="Top evidence queue"
        >
          {evidenceQueue(view.gaps).map((gap) => (
            <button
              key={gap.id}
              type="button"
              onClick={() => onOpenGap(gap.id)}
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
