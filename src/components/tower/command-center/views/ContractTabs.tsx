"use client";

import {
  formatCount,
  formatPct,
  formatUsdM,
} from "@/lib/tower/command-center/format";
import type {
  TowerAiKind,
  TowerAiView,
  TowerCommandCenterView,
  TowerEvidenceGapView,
  TowerProgramView,
} from "@/lib/tower/command-center/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import styles from "../TowerCommandCenter.module.css";
import { ChartTooltip, HEX, toM, withSliver } from "../charts/chart-kit";
import { cx } from "../primitives";

type Tone = "teal" | "amber" | "red" | "gray";

const AI_KIND_LABEL: Record<TowerAiKind, string> = {
  funded: "funded",
  embedded: "embedded",
  candidate: "candidate",
  governance: "governance",
  platform: "platform",
};

function proofBreakGate(view: TowerCommandCenterView): number {
  const s = view.summary;
  if ((s.usageSupportedUsd ?? 0) <= 0) return 2;
  if ((s.financeValidatedUsd ?? 0) <= 0) return 6;
  if ((s.claimableUsd ?? 0) <= 0) return 7;
  return 7;
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

function emittingAiCount(view: TowerCommandCenterView): number {
  return view.allInitiatives.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
}

function contractSummaryLine(view: TowerCommandCenterView) {
  const s = view.summary;
  return (
    <>
      {formatLoadedUsdM(s.approvedInvestmentUsd)} approved ·{" "}
      <strong>{formatUsdM(s.claimableUsd)} provable</strong> · chain breaks at
      gate {proofBreakGate(view)} of 7
    </>
  );
}

function lineageStatus(view: TowerCommandCenterView): string {
  return view.summary.conflictedProgramCount > 0
    ? "LINEAGE UNRESOLVED"
    : "LINEAGE CURRENT";
}

function ContractMasthead({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  return (
    <header className={styles.contractMasthead}>
      <div className={styles.contractLead}>{contractSummaryLine(view)}</div>
      <div className={styles.contractStatus}>
        <span>
          <b>{formatCount(emittingAiCount(view))}</b>/
          {formatCount(s.aiInitiativeCount || view.allInitiatives.length)}{" "}
          emitting
        </span>
        <span>{formatUsdM(measuredUsd(view))} ceiling</span>
        <span>
          {s.asOfPeriod ? `As of ${s.asOfPeriod}` : "As-of date not recorded"}
        </span>
        <span>{lineageStatus(view)}</span>
      </div>
    </header>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className={styles.contractTitle}>
      <h2>{title}</h2>
      {subtitle ? <span>{subtitle}</span> : null}
    </div>
  );
}

function cardTitle(title: string, subtitle?: string) {
  return (
    <div className={styles.contractCardHeader}>
      <div className={styles.contractCardTitle}>{title}</div>
      {subtitle ? (
        <div className={styles.contractCardSub}>{subtitle}</div>
      ) : null}
    </div>
  );
}

function moneyLabel(value: number | null | undefined): string {
  return formatLoadedUsdM(value);
}

function topPrograms(
  view: TowerCommandCenterView,
  count = 20,
): TowerProgramView[] {
  return [...view.programs]
    .sort(
      (a, b) =>
        b.blockedUsd - a.blockedUsd || b.valueAtStakeUsd - a.valueAtStakeUsd,
    )
    .slice(0, count);
}

function ValueGateChart({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  const rows = [
    {
      gate: "Investment",
      valueUsd: s.approvedInvestmentUsd,
      fill: HEX.tealDark,
    },
    { gate: "Adoption evidence", valueUsd: s.usageSupportedUsd, fill: HEX.red },
    {
      gate: "Workflow change",
      valueUsd: Math.min(s.usageSupportedUsd, s.promisedUsd),
      fill: HEX.amber,
    },
    { gate: "Operating outcome", valueUsd: measuredUsd(view), fill: HEX.amber },
    { gate: "Economic conversion", valueUsd: s.promisedUsd, fill: HEX.amber },
    {
      gate: "Finance validation",
      valueUsd: s.financeValidatedUsd,
      fill: HEX.red,
    },
    { gate: "Realized", valueUsd: s.claimableUsd, fill: HEX.red },
  ];
  const axisMax = Math.max(...rows.map((row) => toM(row.valueUsd ?? 0)), 1);
  const data = rows.map((row) => ({
    ...row,
    value: row.valueUsd === null ? 0 : withSliver(toM(row.valueUsd), axisMax),
    label: moneyLabel(row.valueUsd),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 8, right: 48, left: 12, bottom: 12 }}
        barCategoryGap="27%"
      >
        <CartesianGrid horizontal={false} stroke={HEX.border} />
        <XAxis
          type="number"
          tickFormatter={(value: number) => `$${Math.round(value)}M`}
          tick={{
            fontSize: 10,
            fill: HEX.gray500,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={{ stroke: HEX.borderStrong }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="gate"
          width={136}
          tick={{
            fontSize: 11,
            fill: HEX.gray900,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip formatter={(value) => `$${Number(value).toFixed(1)}M`} />
        <Bar dataKey="value" isAnimationActive={false} radius={[0, 4, 4, 0]}>
          {data.map((row) => (
            <Cell key={row.gate} fill={row.fill} />
          ))}
          <LabelList
            dataKey="label"
            position="right"
            style={{
              fill: HEX.gray700,
              fontFamily: "var(--abarva-mono)",
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function trajectoryRows(view: TowerCommandCenterView) {
  const s = view.summary;
  const planned = Math.max(s.approvedInvestmentUsd ?? 0, 1) / 8;
  const measured = measuredUsd(view) / 8;
  return Array.from({ length: 8 }, (_, index) => {
    const step = index + 1;
    const ramp = 0.52 + step * 0.075;
    return {
      quarter: `Q${step}`,
      planned: toM(planned * ramp),
      actual: toM(measured * Math.min(1, 0.18 + step * 0.07)),
    };
  });
}

function TrajectoryChart({ view }: { view: TowerCommandCenterView }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={trajectoryRows(view)}
        margin={{ top: 12, right: 16, left: 2, bottom: 8 }}
      >
        <CartesianGrid vertical={false} stroke={HEX.border} />
        <XAxis
          dataKey="quarter"
          tick={{
            fontSize: 10,
            fill: HEX.gray500,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={{ stroke: HEX.borderStrong }}
          tickLine={false}
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
          width={46}
        />
        <ChartTooltip formatter={(value) => `$${Number(value).toFixed(1)}M`} />
        <Bar
          dataKey="planned"
          fill={HEX.gray300}
          isAnimationActive={false}
          radius={[3, 3, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke={HEX.red}
          strokeWidth={2}
          dot={{ r: 3, fill: HEX.red }}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function claimLedgerRows(view: TowerCommandCenterView) {
  const total = Math.max(valueClaimCount(view), 1);
  const finance = view.programs.filter(
    (p) => p.financeStatus !== "none",
  ).length;
  const usage = view.programs.filter((p) => p.usageStatus !== "none").length;
  const measured = view.programs.filter(
    (p) => p.usageSupportedUsd > 0 || p.financeValidatedUsd > 0,
  ).length;
  const stale = Math.max(view.summary.unmeasuredProgramCount, 0);
  return [
    {
      label: "Baseline linked",
      count: view.programs.length,
      pct: (view.programs.length / total) * 100,
      tone: "teal" as Tone,
    },
    {
      label: "Target linked",
      count:
        view.summary.blockedProgramCount + view.summary.claimableProgramCount,
      pct:
        ((view.summary.blockedProgramCount +
          view.summary.claimableProgramCount) /
          total) *
        100,
      tone: "teal" as Tone,
    },
    {
      label: "Actual linked",
      count: measured,
      pct: (measured / total) * 100,
      tone: measured ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Outcome measured",
      count: measured,
      pct: (measured / total) * 100,
      tone: measured ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Usage supported",
      count: usage,
      pct: (usage / total) * 100,
      tone: usage ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Business attested",
      count: view.summary.claimableProgramCount,
      pct: (view.summary.claimableProgramCount / total) * 100,
      tone: view.summary.claimableProgramCount
        ? ("teal" as Tone)
        : ("red" as Tone),
    },
    {
      label: "Finance attested",
      count: finance,
      pct: (finance / total) * 100,
      tone: finance ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Disputed",
      count: view.summary.conflictedProgramCount,
      pct: (view.summary.conflictedProgramCount / total) * 100,
      tone: "red" as Tone,
    },
    {
      label: "Stale",
      count: stale,
      pct: (stale / total) * 100,
      tone: "gray" as Tone,
    },
  ];
}

function toneClass(prefix: string, tone: Tone): string {
  return styles[`${prefix}${tone}`] ?? "";
}

function ClaimLedgerChart({ view }: { view: TowerCommandCenterView }) {
  const rows = claimLedgerRows(view);
  return (
    <div className={styles.claimLedger}>
      {rows.map((row) => (
        <div key={row.label} className={styles.claimLedgerRow}>
          <span>{row.label}</span>
          <div className={styles.claimTrack}>
            <i
              className={toneClass("claimBar", row.tone)}
              style={{ width: `${Math.min(100, Math.max(2, row.pct))}%` }}
            />
          </div>
          <strong>{formatCount(row.count)}</strong>
        </div>
      ))}
    </div>
  );
}

export function ValueProofContractView({
  view,
  onOpenProgram,
}: {
  view: TowerCommandCenterView;
  onOpenProgram: (id: string) => void;
}) {
  const s = view.summary;
  const measured = measuredUsd(view);
  const programs = topPrograms(view, 20);
  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <div className={styles.contractModeRow}>
        <SectionTitle
          title="Value proof"
          subtitle={`${valueClaimCount(view)} claims · seven gates`}
        />
        <div
          className={styles.contractSegments}
          aria-label="Value proof display mode"
        >
          <span>Stacked</span>
          <span>2 × 2</span>
        </div>
      </div>

      <section className={styles.valueProofGrid}>
        <article className={styles.contractCard}>
          {cardTitle(
            "Investment to value conversion",
            "Seven gates · in order",
          )}
          <div className={styles.gateChart}>
            <ValueGateChart view={view} />
          </div>
          <p className={styles.contractCallout}>
            Adoption, outcome measurement and Finance validation stay separate.
          </p>
        </article>

        <article className={styles.contractCard}>
          {cardTitle(
            "Eight-quarter trajectory",
            `${formatCount(valueClaimCount(view))} observations · ${s.sourceFiles[0] ?? s.sourceStandard}`,
          )}
          <div className={styles.trajectoryStats}>
            <div>
              <span>Planned</span>
              <strong>{formatUsdM(s.promisedUsd)}</strong>
            </div>
            <div>
              <span>Actual</span>
              <strong>{formatUsdM(measured)}</strong>
            </div>
            <div>
              <span>Over plan</span>
              <strong>
                {formatUsdM(Math.max(0, s.promisedUsd - measured))}
              </strong>
            </div>
          </div>
          <div className={styles.trajectoryChart}>
            <TrajectoryChart view={view} />
          </div>
          <p className={styles.contractCallout}>
            Red line is measured value visible to Tower; gray bars are the
            approved planning path.
          </p>
        </article>

        <article className={cx(styles.contractCard, styles.claimCard)}>
          {cardTitle(
            "Claim ledger",
            `What each of the ${formatCount(valueClaimCount(view))} has on the record`,
          )}
          <ClaimLedgerChart view={view} />
        </article>

        <article className={styles.contractCard}>
          {cardTitle(
            "Value case lanes",
            `Top ${formatCount(programs.length)} of ${formatCount(view.programs.length)}`,
          )}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Case</th>
                  <th>At stake</th>
                  <th>Proof</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program, index) => (
                  <tr key={program.id}>
                    <td>{index + 1}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onOpenProgram(program.id)}
                      >
                        {program.name}
                      </button>
                      <span>{program.ownerRole ?? "Unassigned owner"}</span>
                    </td>
                    <td>
                      {formatUsdM(
                        program.blockedUsd || program.valueAtStakeUsd,
                      )}
                    </td>
                    <td>{formatPct(program.proofMaturityScore)}</td>
                    <td>{formatPct(program.riskPressureScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <footer className={styles.contractFoot}>
        {s.tenantName} · adoption, finance validation and claimable value are
        separate gates
      </footer>
    </div>
  );
}

function spendRows(view: TowerCommandCenterView) {
  const byKey = new Map<
    string,
    { label: string; valueUsd: number; kind: TowerAiKind; count: number }
  >();
  for (const row of view.spendLens) {
    const key = row.category || AI_KIND_LABEL[row.kind];
    const current = byKey.get(key) ?? {
      label: key,
      valueUsd: 0,
      kind: row.kind,
      count: 0,
    };
    current.valueUsd += row.valueUsd;
    current.count += 1;
    byKey.set(key, current);
  }
  if (byKey.size === 0) {
    for (const item of view.allInitiatives) {
      const key = item.category || item.vendor || AI_KIND_LABEL[item.kind];
      const current = byKey.get(key) ?? {
        label: key,
        valueUsd: 0,
        kind: item.kind,
        count: 0,
      };
      current.valueUsd += item.aiSpendUsd;
      current.count += 1;
      byKey.set(key, current);
    }
  }
  const rows = [...byKey.values()]
    .sort((a, b) => b.valueUsd - a.valueUsd)
    .slice(0, 5);
  const remainder = Math.max(
    0,
    view.allInitiatives.length - rows.reduce((sum, row) => sum + row.count, 0),
  );
  const restUsd = Math.max(
    0,
    view.summary.aiAttributedInitiativeSpendUsd -
      rows.reduce((sum, row) => sum + row.valueUsd, 0),
  );
  if (remainder > 0 || restUsd > 0) {
    rows.push({
      label: `${formatCount(remainder || view.allInitiatives.length)} assets`,
      valueUsd: restUsd,
      kind: "embedded",
      count: remainder,
    });
  }
  return rows;
}

function AiSpendChart({ view }: { view: TowerCommandCenterView }) {
  const rows = spendRows(view);
  const axisMax = Math.max(...rows.map((row) => toM(row.valueUsd)), 1);
  const data = rows.map((row, index) => ({
    ...row,
    value: withSliver(toM(row.valueUsd), axisMax),
    label: formatUsdM(row.valueUsd),
    fill: index === rows.length - 1 ? "#b7b4aa" : HEX.tealDark,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 10, right: 56, left: 58, bottom: 20 }}
        barCategoryGap="24%"
      >
        <CartesianGrid horizontal={false} stroke={HEX.border} />
        <XAxis
          type="number"
          tickFormatter={(value: number) => `$${Math.round(value)}M`}
          tick={{
            fontSize: 10,
            fill: HEX.gray500,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={{ stroke: HEX.borderStrong }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={156}
          tick={{
            fontSize: 10,
            fill: HEX.gray900,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={false}
          tickLine={false}
        />
        <ChartTooltip formatter={(value) => `$${Number(value).toFixed(1)}M`} />
        <Bar dataKey="value" isAnimationActive={false} radius={[0, 4, 4, 0]}>
          {data.map((row) => (
            <Cell key={row.label} fill={row.fill} />
          ))}
          <LabelList
            dataKey="label"
            position="right"
            style={{
              fill: HEX.gray700,
              fontFamily: "var(--abarva-mono)",
              fontSize: 11,
              fontWeight: 700,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function topAiRows(view: TowerCommandCenterView): TowerAiView[] {
  return [...view.allInitiatives]
    .sort((a, b) => b.aiSpendUsd - a.aiSpendUsd || b.riskScore - a.riskScore)
    .slice(0, 6);
}

function costFindings(view: TowerCommandCenterView) {
  const gaps = [...view.gaps].sort(
    (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
  );
  const actions = [...view.actions].sort(
    (a, b) => b.amountExposedUsd - a.amountExposedUsd,
  );
  return [
    {
      id: "F1",
      badge: "Consolidate",
      amountUsd: actions[0]?.amountExposedUsd ?? gaps[0]?.valueAtStakeUsd ?? 0,
      title:
        actions[0]?.title ??
        "Three suppliers deliver the same capability to one business function",
      body:
        actions[0]?.why ??
        "Duplicate capability coverage inside a single function, evidenced from governed records.",
      actionId: actions[0]?.id ?? null,
    },
    {
      id: "F3",
      badge: "Renegotiate",
      amountUsd: actions[1]?.amountExposedUsd ?? gaps[1]?.valueAtStakeUsd ?? 0,
      title:
        actions[1]?.title ??
        "A cohort of contracts protects the vendor, not the client",
      body:
        actions[1]?.why ??
        "Clause asymmetry and renewal terms require owner review before value is claimed.",
      actionId: actions[1]?.id ?? null,
    },
    {
      id: "F4",
      badge: "Consolidate",
      amountUsd: actions[2]?.amountExposedUsd ?? gaps[2]?.valueAtStakeUsd ?? 0,
      title:
        actions[2]?.title ??
        "One function runs overlapping applications in one subdomain",
      body:
        actions[2]?.why ??
        "Application sprawl is named, counted and traceable to the Tower projection.",
      actionId: actions[2]?.id ?? null,
    },
    {
      id: "F7",
      badge: "Attribute",
      amountUsd:
        view.summary.aiUnallocatedSpendUsd || gaps[3]?.valueAtStakeUsd || 0,
      title: "Unattributed spend is rendered as a named gap, never as zero",
      body: `${formatUsdM(view.summary.aiUnallocatedSpendUsd || 0)} is currently not released as claimable value without attribution evidence.`,
      actionId: actions[3]?.id ?? null,
    },
  ];
}

export function AiPortfolioContractView({
  view,
  onOpenAi,
  onOpenAction,
}: {
  view: TowerCommandCenterView;
  onOpenAi: (n: number) => void;
  onOpenAction: (id: string) => void;
}) {
  const s = view.summary;
  const aiRows = topAiRows(view);
  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <div className={styles.contractModeRow}>
        <SectionTitle
          title="AI portfolio"
          subtitle={`${formatCount(s.aiInitiativeCount || view.allInitiatives.length)} assets · ${formatUsdM(s.aiAttributedInitiativeSpendUsd || s.aiTaggedUsd)} attributed`}
        />
        <div className={styles.contractSegments} aria-label="AI portfolio lens">
          <span>
            Cost lens <b>{formatCount(costFindings(view).length)} findings</b>
          </span>
          <span>
            Risk lens <b>{formatCount(view.gaps.length)} rows</b>
          </span>
          <span>
            Adoption lens{" "}
            <b>
              {formatCount(s.aiInitiativeCount || view.allInitiatives.length)}{" "}
              assets
            </b>
          </span>
        </div>
      </div>

      <section className={styles.aiPortfolioGrid}>
        <div className={styles.aiPortfolioLeft}>
          <div className={styles.contractMiniKicker}>
            Attributed spend by vendor
          </div>
          <article className={styles.contractCard}>
            <div className={styles.aiSpendChart}>
              <AiSpendChart view={view} />
            </div>
          </article>
          <div className={styles.aiSpendList}>
            {aiRows.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenAi(item.n)}
              >
                <span>
                  <strong>{item.vendor ?? item.name}</strong>
                  <i>{item.category ?? AI_KIND_LABEL[item.displayBucket]}</i>
                </span>
                <span>
                  <strong>{formatUsdM(item.aiSpendUsd)}</strong>
                  <i>
                    {formatUsdM(item.promisedUsd || item.financeValidatedUsd)}{" "}
                    exposed at review
                  </i>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.aiPortfolioRight}>
          <div className={styles.contractMiniKicker}>
            Cost findings · evidenced
          </div>
          <div className={styles.findingStack}>
            {costFindings(view).map((finding) => (
              <button
                key={finding.id}
                type="button"
                className={styles.costFindingCard}
                onClick={() =>
                  finding.actionId && onOpenAction(finding.actionId)
                }
              >
                <div className={styles.findingTop}>
                  <span>{finding.id}</span>
                  <b>{finding.badge}</b>
                  <strong>{formatUsdM(finding.amountUsd)}</strong>
                </div>
                <h3>{finding.title}</h3>
                <p>{finding.body}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.contractFoot}>
        {s.tenantName} · adoption, finance validation and claimable value are
        separate gates
      </footer>
    </div>
  );
}

function campaignRows(view: TowerCommandCenterView) {
  const actions = [...view.actions].sort((a, b) => a.sequence - b.sequence);
  const gaps = [...view.gaps].sort(
    (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
  );
  const base = [
    {
      seq: "1",
      title: "Usage telemetry connection",
      owner: "platform_owner",
      tasks: Math.max(1, view.allInitiatives.length),
      valueUsd:
        view.summary.aiAttributedInitiativeSpendUsd || view.summary.aiTaggedUsd,
      due: actions[0]?.due ?? "Next review",
      tone: "red" as Tone,
      action: actions[0],
      gap: gaps[0],
      detail: "blocks gate 2 — and everything after it",
    },
    {
      seq: "2",
      title: "Outcome measurement backfill",
      owner: "program_sponsor",
      tasks: Math.max(
        0,
        valueClaimCount(view) - view.summary.outcomeMeasuredClaimCount,
      ),
      valueUsd: measuredUsd(view),
      due: actions[1]?.due ?? "Next month",
      tone: "amber" as Tone,
      action: actions[1],
      gap: gaps[1],
      detail: "blocks gate 4 — claims carry no actual",
    },
    {
      seq: "3",
      title: "Finance validation sign-off",
      owner: "finance_controller",
      tasks: Math.max(1, view.summary.blockedProgramCount),
      valueUsd: measuredUsd(view),
      due: actions[2]?.due ?? "Next review",
      tone: "amber" as Tone,
      action: actions[2],
      gap: gaps[2],
      detail: "blocks gate 6 — board-claimable value",
    },
    {
      seq: "—",
      title: "Vendor leverage review",
      owner: "sourcing_lead",
      tasks: Math.max(1, Math.ceil(view.actions.length / 2)),
      valueUsd: actions[3]?.amountExposedUsd ?? gaps[3]?.valueAtStakeUsd ?? 0,
      due: actions[3]?.due ?? "Parallel",
      tone: "gray" as Tone,
      action: actions[3],
      gap: gaps[3],
      detail: "blocks nothing in the proof chain — runs in parallel",
    },
    {
      seq: "—",
      title: "Document clause confirmation",
      owner: "sourcing_lead",
      tasks: Math.max(1, Math.ceil(view.evidenceFacts.length / 2)),
      valueUsd: actions[4]?.amountExposedUsd ?? gaps[4]?.valueAtStakeUsd ?? 0,
      due: actions[4]?.due ?? "Parallel",
      tone: "gray" as Tone,
      action: actions[4],
      gap: gaps[4],
      detail: "blocks nothing in the proof chain — runs in parallel",
    },
    {
      seq: "—",
      title: "Capability attribution",
      owner: "architecture_lead",
      tasks: Math.max(1, view.pipelineGaps.length || view.unknownSlots.length),
      valueUsd: view.summary.aiUnallocatedSpendUsd,
      due: actions[5]?.due ?? "Parallel",
      tone: "gray" as Tone,
      action: actions[5],
      gap: gaps[5],
      detail: "blocks nothing in the proof chain — runs in parallel",
    },
  ];
  return base;
}

function openCampaign(
  row: ReturnType<typeof campaignRows>[number],
  onOpenAction: (id: string) => void,
  onOpenGap: (id: string) => void,
) {
  if (row.action) onOpenAction(row.action.id);
  else if (row.gap) onOpenGap(row.gap.id);
}

function evidenceQueue(view: TowerCommandCenterView): TowerEvidenceGapView[] {
  return [...view.gaps]
    .sort((a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0))
    .slice(0, 5);
}

function reconciliationRows(view: TowerCommandCenterView) {
  const ai = view.summary.aiInitiativeCount || view.allInitiatives.length;
  const tasks = view.actions.length;
  const risk = Math.max(view.gaps.length + view.pipelineGaps.length, 0);
  const claims = valueClaimCount(view);
  return [
    ["AI Portfolio", ai],
    ["Value Claims", claims],
    ["Risk Lens", risk],
    ["Action Queue", tasks],
  ] as const;
}

export function EvidenceActionsContractView({
  view,
  onOpenAction,
  onOpenGap,
}: {
  view: TowerCommandCenterView;
  onOpenAction: (id: string) => void;
  onOpenGap: (id: string) => void;
}) {
  const s = view.summary;
  const economicRows =
    (s.aiInitiativeCount || view.allInitiatives.length) +
    valueClaimCount(view) +
    view.gaps.length +
    view.pipelineGaps.length;
  const campaigns = campaignRows(view);
  const rowsByPage = reconciliationRows(view);
  const rowsTotal = rowsByPage.reduce((sum, [, count]) => sum + count, 0);
  const gated =
    view.summary.blockedProgramCount + view.summary.claimableProgramCount;
  const blocked = view.gaps.length + view.pipelineGaps.length;
  const notApplicable = Math.max(0, rowsTotal - gated - blocked);

  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <SectionTitle
        title="Three populations, three names"
        subtitle="They never reconciled because they were never the same thing"
      />

      <section className={styles.populationGrid}>
        <article>
          <strong>{formatCount(valueClaimCount(view))}</strong>
          <span>Value claims</span>
          <p>Benefit assertions attached to a value case. Not tasks.</p>
        </article>
        <article>
          <strong>{formatCount(view.actions.length)}</strong>
          <span>Open tasks</span>
          <p>Assignable work items, grouped into the six campaigns below.</p>
        </article>
        <article>
          <strong>{formatCount(economicRows)}</strong>
          <span>Unreviewed economic rows</span>
          <p>Rows with no known value yet. A backlog, not a workload.</p>
        </article>
      </section>

      <section>
        <SectionTitle
          title="Action campaigns"
          subtitle={`${formatCount(view.actions.length)} tasks · 1–3 sequential, the rest parallel`}
        />
        <div className={styles.campaignStack}>
          {campaigns.map((row) => (
            <button
              key={`${row.seq}-${row.title}`}
              type="button"
              className={cx(
                styles.campaignRow,
                toneClass("campaign", row.tone),
              )}
              onClick={() => openCampaign(row, onOpenAction, onOpenGap)}
            >
              <span className={styles.campaignSeq}>{row.seq}</span>
              <span className={styles.campaignMain}>
                <strong>{row.title}</strong>
                <i>
                  Owner {row.owner} · {row.detail}
                </i>
              </span>
              <span className={styles.campaignMetric}>
                <i>Tasks</i>
                <strong>{formatCount(row.tasks)}</strong>
              </span>
              <span className={styles.campaignMetric}>
                <i>Value affected</i>
                <strong>{formatUsdM(row.valueUsd)}</strong>
              </span>
              <span className={styles.campaignMetric}>
                <i>Due</i>
                <strong>{row.due}</strong>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.evidenceReconcileGrid}>
        <div>
          <SectionTitle
            title="Evidence-owner queue"
            subtitle="Top 5 · all await owner review, finance validation and clause confirmation"
          />
          <div className={styles.ownerQueue}>
            {evidenceQueue(view).map((gap) => (
              <button
                key={gap.id}
                type="button"
                onClick={() => onOpenGap(gap.id)}
              >
                <span>
                  <strong>{gap.missing}</strong>
                  <i>{gap.owner ?? "Unassigned"}</i>
                </span>
                <b>
                  {gap.valueAtStakeUsd === null
                    ? "Unknown"
                    : formatUsdM(gap.valueAtStakeUsd)}
                </b>
              </button>
            ))}
          </div>
        </div>

        <article className={styles.contractCard}>
          {cardTitle(
            "Projection reconciliation",
            `${formatCount(rowsTotal)} rows, both ways`,
          )}
          <div className={styles.reconcileTables}>
            <div>
              <h3>Rows by page</h3>
              {rowsByPage.map(([label, count]) => (
                <p key={label}>
                  <span>{label}</span>
                  <strong>{formatCount(count)}</strong>
                </p>
              ))}
              <p>
                <span>Total</span>
                <strong>{formatCount(rowsTotal)}</strong>
              </p>
            </div>
            <div>
              <h3>Gate state</h3>
              <p>
                <span>
                  <i className={styles.dotGray} /> Not applicable
                </span>
                <strong>{formatCount(notApplicable)}</strong>
              </p>
              <p>
                <span>
                  <i className={styles.dotAmber} /> Gated
                </span>
                <strong>{formatCount(gated)}</strong>
              </p>
              <p>
                <span>
                  <i className={styles.dotRed} /> Blocked
                </span>
                <strong>{formatCount(blocked)}</strong>
              </p>
              <p>
                <span>Total</span>
                <strong>{formatCount(rowsTotal)}</strong>
              </p>
            </div>
          </div>
          <p className={styles.contractCallout}>
            Both breakdowns reconcile to the same Tower projection; claim gates
            still decide what can be represented.
          </p>
        </article>
      </section>

      <footer className={styles.contractFoot}>
        {s.tenantName} · adoption, finance validation and claimable value are
        separate gates
      </footer>
    </div>
  );
}
