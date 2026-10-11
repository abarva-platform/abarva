"use client";

import { useState } from "react";

import {
  BLOCKER_TONE,
  controlBlockerExplanation,
  controlBlockerCell,
  formatCount,
  formatPct,
  formatUsdM,
  gatingConstraintExplanation,
} from "@/lib/tower/command-center/format";
import type {
  TowerAiKind,
  TowerAiView,
  TowerActionView,
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
type AiLens = "cost" | "risk" | "adoption" | "table";
type CostFinding = {
  id: string;
  badge: string;
  amountUsd: number | null;
  title: string;
  body: string;
  actionId: string | null;
  gapId: string | null;
};
type CampaignRow = {
  seq: string;
  title: string;
  owner: string;
  tasks: number;
  unit: string;
  valueUsd: number | null;
  due: string;
  tone: Tone;
  action: TowerActionView | null;
  gap: TowerEvidenceGapView | null;
  detail: string;
};

const AI_KIND_LABEL: Record<TowerAiKind, string> = {
  funded: "funded",
  embedded: "embedded",
  candidate: "candidate",
  governance: "governance",
  platform: "platform",
};

function formatLoadedUsdM(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "not loaded"
    : formatUsdM(value);
}

function formatOptionalUsdM(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? formatUsdM(value)
    : "Not loaded";
}

function usageValueLabel(summary: TowerCommandCenterView["summary"]): string {
  if (summary.usageSupportedValueCoverage === "none") return "Not measured";
  const value = formatUsdM(summary.usageSupportedUsd);
  return summary.usageSupportedValueCoverage === "partial" ? `${value} (partial)` : value;
}

function humanizeLabel(value: string | null | undefined): string {
  if (!value) return "Not loaded";
  return value.replace(/_/g, " ");
}

function nextStepLabel(value: string | null): string {
  const normalized = value?.replace(/_/g, " ").trim().toLowerCase();
  if (!normalized) return "Not loaded";
  if (normalized.includes("link") && normalized.includes("value")) {
    return "Link cases";
  }
  if (normalized.includes("measured outcome")) {
    return "Capture actuals";
  }
  if (normalized.includes("finance")) {
    return "Finance review";
  }
  if (normalized.includes("usage")) {
    return "Map usage";
  }
  return humanizeLabel(value);
}

function valueClaimCount(view: TowerCommandCenterView): number {
  return view.summary.valueClaimCount;
}

function openClaimCount(view: TowerCommandCenterView): number {
  const s = view.summary;
  return Math.max(0, valueClaimCount(view) - s.claimableClaimCount);
}

function emittingAiCount(view: TowerCommandCenterView): number {
  return view.allInitiatives.filter(
    (item) => item.usageHeadline || item.usageBars.some((bar) => bar.pct > 0),
  ).length;
}

function contractSummaryLine(view: TowerCommandCenterView) {
  const s = view.summary;
  const claimCount = valueClaimCount(view);
  return (
    <>
      {formatLoadedUsdM(s.approvedInvestmentUsd)} in approved project funding ·{" "}
      <strong>{claimCount > 0 ? formatUsdM(s.claimableUsd) : "Not loaded"} cleared for reporting in loaded months</strong> ·{" "}
      {claimCount > 0
        ? `${formatCount(openClaimCount(view))} of ${formatCount(claimCount)} claims not cleared for reporting`
        : "Value claims not loaded"}
    </>
  );
}

function lineageStatus(view: TowerCommandCenterView): string {
  return view.summary.conflictedProgramCount > 0
    ? "PROGRAM CONFLICTS IN TOWER PROJECTION"
    : "NO PROGRAM CONFLICTS IN TOWER PROJECTION";
}

function ContractMasthead({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  return (
    <header className={styles.contractMasthead}>
      <div className={styles.contractLead}>{contractSummaryLine(view)}</div>
      <div className={styles.contractStatus}>
        <span>
          {valueClaimCount(view) > 0 ? (
            <>
              <b>{formatCount(s.usageSupportedClaimCount)}</b> claims with usage evidence
            </>
          ) : (
            "Usage support not loaded"
          )}
        </span>
        <span>{formatCount(s.outcomeMeasuredClaimCount)}/{formatCount(s.valueClaimCount)} claims outcome-measured</span>
        <span>{formatCount(emittingAiCount(view))} tracked assets emitting</span>
        <span>
          {s.asOfPeriod ? `As of ${s.asOfPeriod}` : "As-of date not recorded"}
        </span>
        <span>{lineageStatus(view)}</span>
        <span>INTAKE LINEAGE STATUS NOT LOADED · VERIFY BEFORE QUOTING</span>
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
  const groups = [
    {
      title: "Approved funding",
      note: "AI funding is part of the project total. Neither amount shows money already spent or benefits earned.",
      rows: [
        ["Approved project funding", formatLoadedUsdM(s.approvedInvestmentUsd)],
        ["Approved AI funding within it", formatUsdM(s.aiAttributedInitiativeSpendUsd)],
      ],
    },
    {
      title: "Benefit and adoption",
      note: s.usageSupportedValueCoverage === "partial"
        ? "The yearly estimate is a plan. The usage-linked amount covers measured rows only; other claims have no measured dollar amount."
        : "The yearly estimate is a plan. A usage-linked dollar amount is shown only when it has an independent measurement.",
      rows: [
        ["Projected yearly benefit", s.promisedBenefitLoaded ? formatUsdM(s.promisedUsd) : "Not loaded"],
        ["Usage-linked claim value", s.valueClaimCount > 0 ? usageValueLabel(s) : "Not loaded"],
      ],
    },
    {
      title: "Finance review · loaded months",
      note: "Validated value may still be blocked; only the claimable amount has cleared the board gate.",
      rows: [
        ["Finance validated", s.valueClaimCount > 0 ? formatUsdM(s.financeValidatedUsd) : "Not loaded"],
        ["Cleared for reporting", s.valueClaimCount > 0 ? formatUsdM(s.claimableUsd) : "Not loaded"],
      ],
    },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, height: "100%", overflowY: "auto" }}>
      {groups.map((group) => (
        <div key={group.title} style={{ border: "1px solid var(--canon-border)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <strong>{group.title}</strong>
          {group.rows.map(([label, value]) => (
            <div key={label} style={{ borderTop: "1px solid var(--canon-border)", paddingTop: 10 }}>
              <span style={{ display: "block", fontSize: 12 }}>{label}</span>
              <b style={{ display: "block", fontSize: 20 }}>{value}</b>
            </div>
          ))}
          <small style={{ marginTop: "auto", lineHeight: 1.5 }}>{group.note}</small>
        </div>
      ))}
    </div>
  );
}

function trajectoryRows(view: TowerCommandCenterView) {
  return view.valueTrajectory.map((point) => ({
    quarter: point.fiscalQuarter,
    planned: toMOrNull(point.businessCaseBenefitUsd),
    actual: toMOrNull(point.realizedPAndLUsd),
  }));
}

function toMOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? toM(value)
    : null;
}

function sumLoadedUsd(values: readonly (number | null | undefined)[]): number | null {
  let total = 0;
  let sawValue = false;
  for (const value of values) {
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    total += value;
    sawValue = true;
  }
  return sawValue ? total : null;
}

function trajectoryRecordedPAndLUsd(view: TowerCommandCenterView): number | null {
  return sumLoadedUsd(view.valueTrajectory.map((point) => point.realizedPAndLUsd));
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
  const s = view.summary;
  return [
    {
      label: "Baseline linked",
      count: s.baselineLinkedClaimCount,
      pct: (s.baselineLinkedClaimCount / total) * 100,
      tone: "teal" as Tone,
    },
    {
      label: "Target linked",
      count: s.targetLinkedClaimCount,
      pct: (s.targetLinkedClaimCount / total) * 100,
      tone: "teal" as Tone,
    },
    {
      label: "Actual linked",
      count: s.actualLinkedClaimCount,
      pct: (s.actualLinkedClaimCount / total) * 100,
      tone: s.actualLinkedClaimCount ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Outcome measured",
      count: s.outcomeMeasuredClaimCount,
      pct: (s.outcomeMeasuredClaimCount / total) * 100,
      tone: s.outcomeMeasuredClaimCount ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Usage evidence recorded",
      count: s.usageSupportedClaimCount,
      pct: (s.usageSupportedClaimCount / total) * 100,
      tone: s.usageSupportedClaimCount ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Business attested",
      count: s.businessAttestedClaimCount,
      pct: (s.businessAttestedClaimCount / total) * 100,
      tone: s.businessAttestedClaimCount ? ("teal" as Tone) : ("red" as Tone),
    },
    {
      label: "Finance attested",
      count: s.financeAttestedClaimCount,
      pct: (s.financeAttestedClaimCount / total) * 100,
      tone: s.financeAttestedClaimCount ? ("amber" as Tone) : ("red" as Tone),
    },
    {
      label: "Disputed",
      count: s.disputedClaimCount,
      pct: (s.disputedClaimCount / total) * 100,
      tone: "red" as Tone,
    },
    {
      label: "Stale",
      count: s.staleClaimCount,
      pct: (s.staleClaimCount / total) * 100,
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
  const recordedPAndL = trajectoryRecordedPAndLUsd(view);
  const programs = topPrograms(view, 20);
  const hasTrajectory = view.valueTrajectory.length > 0;
  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <SectionTitle
        title="Value proof"
        subtitle={`${valueClaimCount(view)} claims · evidence on record; requirements differ by claim type`}
      />

      <section className={styles.valueProofGrid}>
        <article className={styles.contractCard}>
          {cardTitle(
            "Portfolio amounts by measure",
            "Approved funding, yearly plans and loaded-month results are different measures",
          )}
          <div className={styles.gateChart}>
            <ValueGateChart view={view} />
          </div>
          <p className={styles.contractCallout}>
            A case can have usage evidence without a measured dollar benefit.
            Approved funding and yearly plans cannot be divided by the value
            cleared in the loaded months to show a success rate.
          </p>
        </article>

        <article className={styles.contractCard}>
          {cardTitle(
            "Loaded quarterly trajectory",
            `${formatCount(view.valueTrajectory.length)} quarter${view.valueTrajectory.length === 1 ? "" : "s"} loaded · ${s.sourceFiles[0] ?? s.sourceStandard}`,
          )}
          <div className={styles.trajectoryStats}>
            <div>
              <span>Asserted annual plan</span>
              <strong>{formatUsdM(s.promisedUsd)}</strong>
            </div>
            <div>
              <span>Recorded P&amp;L in loaded quarters</span>
              <strong>{formatLoadedUsdM(recordedPAndL)}</strong>
            </div>
            <div>
              <span>Outcome-measured claims</span>
              <strong>{formatCount(s.outcomeMeasuredClaimCount)} / {formatCount(s.valueClaimCount)}</strong>
            </div>
          </div>
          {hasTrajectory ? (
            <div className={styles.trajectoryChart}>
              <TrajectoryChart view={view} />
            </div>
          ) : (
            <div className={styles.contractEmpty}>
              No quarterly trajectory rows are loaded for this tenant.
            </div>
          )}
          <p className={styles.contractCallout}>
            {recordedPAndL === null
              ? "No P&L actual is recorded in the loaded quarters. Gray bars show only the loaded planning path."
              : "Red line shows recorded P&L only for the loaded quarters; gray bars show their planning path. This is not a complete eight-quarter trend unless eight quarters are present."}
          </p>
        </article>

        <article className={cx(styles.contractCard, styles.claimCard)}>
          {cardTitle(
            "Claim ledger",
            `What each of the ${formatCount(valueClaimCount(view))} has on the record`,
          )}
          <ClaimLedgerChart view={view} />
          <p className={styles.contractCallout}>
            These counts show what is recorded across all claims. An AI benefit,
            a sourcing opportunity, and a foundation investment need different
            proof; a missing usage record is not automatically a gap for every claim.
          </p>
        </article>

        {/*
          Readiness only. The adjacent "Risk" column was `risk_pressure_score`, which Layer 4
          writes as `100 - readiness_score` — so the two always summed to 100 and the second
          carried no information the first did not. Side by side under separate headings they read
          as two independent assessments of a case. They were one number, printed twice.

          The AI portfolio table below renders the named control blocker instead of a derived
          risk score, so readiness is not printed twice under different labels.
        */}
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
                  <th>Readiness</th>
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
                      {formatUsdM(program.blockedUsd)}
                    </td>
                    <td>{formatPct(program.proofMaturityScore)}</td>
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
    .sort((a, b) => b.aiSpendUsd - a.aiSpendUsd || a.name.localeCompare(b.name))
    .slice(0, 6);
}

function aiBenefitLabel(item: TowerAiView): string {
  if (!item.promisedBenefitLoaded) {
    return item.financeStatus === null
      ? "No tool-level benefit claim loaded"
      : "No case-level benefit claim loaded";
  }
  if (item.promisedUsd > 0) {
    return `${formatUsdM(item.promisedUsd)} sponsor-stated benefit`;
  }
  return "No sponsor-stated benefit";
}

function aiUsageLabel(item: TowerAiView): string {
  if (item.usageHeadline) return item.usageHeadline;
  if (item.usageBars.length > 0) return "usage evidence recorded";
  return "no usage evidence";
}

function aiUsageScore(item: TowerAiView): number | null {
  const scoredBars = item.usageBars
    .map((bar) => bar.pct)
    .filter((pct) => Number.isFinite(pct));
  if (scoredBars.length > 0) return Math.max(...scoredBars);
  return null;
}

function controlOrGateCell(item: TowerAiView): {
  text: string;
  title: string;
  color: string;
} {
  const blocker = controlBlockerCell(item);
  if (blocker.tone !== "absent") {
    return {
      text: blocker.text,
      title: controlBlockerExplanation(item),
      color: BLOCKER_TONE[blocker.tone],
    };
  }
  if (item.gatingConstraint) {
    return {
      text: humanizeLabel(item.gatingConstraint),
      title: gatingConstraintExplanation(item.gatingConstraint),
      color: "var(--canon-gray-700)",
    };
  }
  return {
    text: blocker.text,
    title: controlBlockerExplanation(item),
    color: BLOCKER_TONE[blocker.tone],
  };
}

function costFindings(view: TowerCommandCenterView): CostFinding[] {
  const gaps = [...view.gaps].sort(
    (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
  );
  const actions = [...view.actions].sort(
    (a, b) => b.amountExposedUsd - a.amountExposedUsd,
  );
  const rows: CostFinding[] = actions.slice(0, 4).map((action, index) => ({
    id: `A${action.sequence || index + 1}`,
    badge: action.lane,
    amountUsd: action.amountExposedUsd,
    title: action.title,
    body: action.why,
    actionId: action.id,
    gapId: null as string | null,
  }));

  for (const gap of gaps) {
    if (rows.length >= 4) break;
    rows.push({
      id: `G${rows.length + 1}`,
      badge: gap.priority,
      amountUsd: gap.valueAtStakeUsd,
      title: gap.blockedDecision || gap.missing,
      body: gap.why,
      actionId: null,
      gapId: gap.id,
    });
  }

  if (view.summary.aiUnallocatedSpendUsd > 0 && rows.length < 4) {
    rows.push({
      id: `G${rows.length + 1}`,
      badge: "attribute",
      amountUsd: view.summary.aiUnallocatedSpendUsd,
      title: "AI funding without a linked asset",
      body: "The loaded portfolio has approved AI funding that is not yet linked to an initiative or tool row.",
      actionId: null,
      gapId: null,
    });
  }

  return rows;
}

function riskRows(view: TowerCommandCenterView): TowerEvidenceGapView[] {
  return [...view.gaps]
    .sort((a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0))
    .slice(0, 20);
}

function isToolRolloutRow(item: TowerAiView): boolean {
  return item.sourceFile === "23_ai_tool_rollout.csv";
}

function adoptionRows(view: TowerCommandCenterView): TowerAiView[] {
  return [...view.allInitiatives]
    .filter(
      (item) =>
        isToolRolloutRow(item) &&
        (item.usageBars.length > 0 || item.usageHeadline !== null),
    )
    .sort(
      (a, b) =>
        (aiUsageScore(b) ?? -1) - (aiUsageScore(a) ?? -1) ||
        b.aiSpendUsd - a.aiSpendUsd ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 20);
}

function allAiRows(view: TowerCommandCenterView): TowerAiView[] {
  return [...view.allInitiatives].sort(
    (a, b) =>
      b.aiSpendUsd - a.aiSpendUsd ||
      (aiUsageScore(b) ?? -1) - (aiUsageScore(a) ?? -1) ||
      a.name.localeCompare(b.name),
  );
}

export function AiPortfolioContractView({
  view,
  onOpenAi,
  onOpenAction,
  onOpenGap,
}: {
  view: TowerCommandCenterView;
  onOpenAi: (n: number) => void;
  onOpenAction: (id: string) => void;
  onOpenGap: (id: string) => void;
}) {
  const s = view.summary;
  const aiRows = topAiRows(view);
  const costLensFindings = costFindings(view);
  const adoptionLensRows = adoptionRows(view);
  const [lens, setLens] = useState<AiLens>("table");
  const lensOptions = [
    {
      key: "table" as const,
      label: "All initiatives/tools",
      detail: `${formatCount(view.allInitiatives.length)} rows`,
    },
    {
      key: "cost" as const,
      label: "Cost lens",
      detail: `${formatCount(costLensFindings.length)} findings`,
    },
    {
      key: "risk" as const,
      label: "Risk lens",
      detail: `${formatCount(view.gaps.length)} total · top ${formatCount(riskRows(view).length)} shown`,
    },
    {
      key: "adoption" as const,
      label: "Adoption lens",
      detail: `${formatCount(adoptionLensRows.length)} tool rollouts`,
    },
  ];
  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <div className={styles.contractModeRow}>
        <SectionTitle
          title="AI initiatives and tool rollouts"
          subtitle={`${formatCount(s.aiInitiativeCount)} assets · ${formatUsdM(s.aiAttributedInitiativeSpendUsd)} approved AI funding`}
        />
        <div
          className={styles.contractSegments}
          role="tablist"
          aria-label="AI portfolio lens"
        >
          {lensOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              role="tab"
              aria-selected={lens === option.key}
              className={lens === option.key ? styles.segmentOn : undefined}
              onClick={() => setLens(option.key)}
            >
              {option.label} <b>{option.detail}</b>
            </button>
          ))}
        </div>
      </div>

      {lens === "cost" ? (
        <section className={styles.aiPortfolioGrid}>
          <div className={styles.aiPortfolioLeft}>
            <div className={styles.contractMiniKicker}>
              Approved AI funding by recorded type
            </div>
            <article className={styles.contractCard}>
              <div className={styles.aiSpendChart}>
                <AiSpendChart view={view} />
              </div>
            </article>
            <p className={styles.contractCallout}>
              This chart shows approved AI funding recorded on portfolio rows. It does not show
              actual spending; tool costs without a loaded amount are unknown.
            </p>
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
                    <strong>{item.aiSpendLoaded ? formatUsdM(item.aiSpendUsd) : "Not loaded"}</strong>
                    <i>{aiBenefitLabel(item)}</i>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.aiPortfolioRight}>
            <div className={styles.contractMiniKicker}>
              Funding and evidence gaps
            </div>
            <div className={styles.findingStack}>
              {costLensFindings.length > 0 ? (
                costLensFindings.map((finding) => (
                  <button
                    key={finding.id}
                    type="button"
                    className={styles.costFindingCard}
                    onClick={() => {
                      if (finding.actionId) onOpenAction(finding.actionId);
                      else if (finding.gapId) onOpenGap(finding.gapId);
                    }}
                  >
                    <div className={styles.findingTop}>
                      <span>{finding.id}</span>
                      <b>{finding.badge}</b>
                      <strong>{formatOptionalUsdM(finding.amountUsd)}</strong>
                    </div>
                    <h3>{finding.title}</h3>
                    <p>{finding.body}</p>
                  </button>
                ))
              ) : (
                <div className={styles.contractEmpty}>
                  No cost findings are loaded for this portfolio.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {lens === "risk" ? (
        <article className={cx(styles.contractCard, styles.contractFullCard)}>
          {cardTitle("Risk lens", `Top ${formatCount(riskRows(view).length)} of ${formatCount(view.gaps.length)} value evidence gaps by amount at stake`)}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gap</th>
                  <th>Owner</th>
                  <th>At stake</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {riskRows(view).map((gap, index) => (
                  <tr key={gap.id}>
                    <td>{index + 1}</td>
                    <td>
                      <button type="button" onClick={() => onOpenGap(gap.id)}>
                        {gap.missing}
                      </button>
                      <span>{gap.blockedDecision}</span>
                    </td>
                    <td>{gap.owner ?? "Unassigned"}</td>
                    <td>
                      {gap.valueAtStakeUsd === null
                        ? "Unknown"
                        : formatUsdM(gap.valueAtStakeUsd)}
                    </td>
                    <td>{gap.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {lens === "adoption" ? (
        <article className={cx(styles.contractCard, styles.contractFullCard)}>
          {cardTitle(
            "Adoption lens",
            "Tool rollouts ranked by recorded usage evidence",
          )}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Initiative / tool</th>
                  <th>Usage</th>
                  <th>Adoption</th>
                  <th>Benefit</th>
                </tr>
              </thead>
              <tbody>
                {adoptionLensRows.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <button type="button" onClick={() => onOpenAi(item.n)}>
                        {item.name}
                      </button>
                      <span>
                        {item.vendor ?? item.system ?? "No vendor loaded"}
                      </span>
                    </td>
                    <td>{aiUsageLabel(item)}</td>
                    <td>
                      {aiUsageScore(item) === null
                        ? "Unknown"
                        : formatPct(aiUsageScore(item) ?? 0)}
                    </td>
                    <td>{aiBenefitLabel(item)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      {lens === "table" ? (
        <article className={cx(styles.contractCard, styles.contractFullCard)}>
          {cardTitle(
            "All AI initiatives and tools",
            `${formatCount(view.allInitiatives.length)} governed rows`,
          )}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Initiative / tool</th>
                  <th>Vendor</th>
                  <th>Value type</th>
                  <th>Approved AI funding</th>
                  <th>Benefit</th>
                  <th>Readiness</th>
                  <th>Control / gate</th>
                </tr>
              </thead>
              <tbody>
                {allAiRows(view).map((item, index) => {
                  const gate = controlOrGateCell(item);
                  return (
                    <tr key={item.id} onDoubleClick={() => onOpenAi(item.n)}>
                      <td>{index + 1}</td>
                      <td>
                        <button type="button" onClick={() => onOpenAi(item.n)}>
                          {item.name}
                        </button>
                        <span>{aiUsageLabel(item)}</span>
                      </td>
                      <td>{item.vendor ?? "Unassigned"}</td>
                      <td>
                        {humanizeLabel(
                          item.businessValueType ??
                            item.category ??
                            AI_KIND_LABEL[item.displayBucket],
                        )}
                      </td>
                      <td>
                        {item.aiSpendLoaded
                          ? formatUsdM(item.aiSpendUsd)
                          : "Not loaded"}
                      </td>
                      <td>{aiBenefitLabel(item)}</td>
                      <td>
                        {item.readinessScoreLoaded
                          ? formatPct(item.readinessScore)
                          : "Not scored"}
                      </td>
                      <td>
                        <span title={gate.title} style={{ color: gate.color }}>
                          {gate.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      ) : null}

      <footer className={styles.contractFoot}>
        {s.tenantName} · adoption, finance validation and claimable value are
        separate gates
      </footer>
    </div>
  );
}

function campaignRows(view: TowerCommandCenterView): CampaignRow[] {
  const actions = [...view.actions].sort((a, b) => a.sequence - b.sequence);
  const gaps = [...view.gaps].sort(
    (a, b) => (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0),
  );
  const rows: CampaignRow[] = actions.map((action) => ({
    seq: String(action.sequence),
    title: action.title.replace(/^FIX PROOF:\s*/i, ""),
    owner: action.ownerRole,
    tasks: 1,
    unit: "Task",
    valueUsd: action.amountExposedUsd,
    due: nextStepLabel(action.due),
    tone:
      action.lane === "fix" || action.lane === "stop"
        ? ("red" as Tone)
        : ("amber" as Tone),
    action,
    gap: null as TowerEvidenceGapView | null,
    detail: action.why,
  }));

  for (const gap of gaps) {
    if (rows.length >= 6) break;
    rows.push({
      seq: "—",
      title: gap.blockedDecision || gap.missing,
      owner: gap.owner ?? "Owner not loaded",
      tasks: 1,
      unit: "Gap",
      valueUsd: gap.valueAtStakeUsd,
      due: "Not loaded",
      tone:
        gap.priority === "high"
          ? ("red" as Tone)
          : gap.priority === "medium"
            ? ("amber" as Tone)
            : ("gray" as Tone),
      action: null,
      gap,
      detail: gap.why,
    });
  }

  return rows.slice(0, 6);
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

function sourceContractActions(view: TowerCommandCenterView) {
  return view.actions
    .filter((action) => action.moduleHandoff?.toLowerCase() === "source")
    .sort(
      (a, b) =>
        b.amountExposedUsd - a.amountExposedUsd || a.title.localeCompare(b.title),
    )
    .slice(0, 5);
}

function reconciliationRows(view: TowerCommandCenterView) {
  const ai = view.summary.aiInitiativeCount;
  const tasks = view.actions.length;
  const claims = valueClaimCount(view);
  return [
    ["AI portfolio assets", ai],
    ["Value claims", claims],
    ["AI risk lens evidence gaps", view.gaps.length],
    ["Pipeline field gaps (ops)", view.pipelineGaps.length],
    ["Action queue tasks", tasks],
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
  // The review-queue count, and only that. This fell back to `gaps.length + pipelineGaps.length`
  // — the size of two unrelated collections — whenever the queue count was zero, so a label
  // reading "N in the economic review queue" could be counting something else entirely.
  const economicRows = s.economicReviewQueueCount;
  const campaigns = campaignRows(view);
  const sourceActions = sourceContractActions(view);
  const rowsByPage = reconciliationRows(view);

  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <SectionTitle
        title="Distinct review populations"
        subtitle="Assets, claims, evidence gaps, pipeline gaps and tasks have different counting bases"
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
          <p>Assignable work items. Campaigns show affected records.</p>
        </article>
        <article>
          <strong>{formatCount(economicRows)}</strong>
          <span>Unreviewed economic rows</span>
          <p>Rows with no known value yet. A backlog, not a workload.</p>
        </article>
      </section>

      <p className={styles.contractCallout}>
        The same case may appear in several tasks or evidence gaps. Each dollar amount
        shows the value affected by that item; do not add those amounts together.
      </p>

      <section>
        <SectionTitle
          title="Action campaigns"
          subtitle={`${formatCount(view.actions.length)} open tasks · campaigns show affected records`}
        />
        <div className={styles.campaignStack}>
          {campaigns.length > 0 ? (
            campaigns.map((row) => (
              <button
                key={row.action ? `action:${row.action.id}` : `gap:${row.gap?.id ?? row.title}`}
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
                  <i>{row.unit}</i>
                  <strong>{formatCount(row.tasks)}</strong>
                </span>
                <span className={styles.campaignMetric}>
                  <i>Value affected</i>
                  <strong>{formatOptionalUsdM(row.valueUsd)}</strong>
                </span>
                <span className={styles.campaignMetric}>
                  <i>Next step</i>
                  <strong>{row.due}</strong>
                </span>
              </button>
            ))
          ) : (
            <div className={styles.contractEmpty}>
              No action campaigns are loaded for this review.
            </div>
          )}
        </div>
      </section>

      {sourceActions.length > 0 ? (
        <section>
          <SectionTitle
            title="Source contract actions"
            subtitle={`${formatCount(sourceActions.length)} shown · potential savings need Finance confirmation`}
          />
          <p className={styles.contractCallout}>
            These are possible savings, not money already saved. They are not included
            in the cleared value above.
          </p>
          <div className={styles.ownerQueue}>
            {sourceActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onOpenAction(action.id)}
              >
                <span>
                  <strong>{action.title.replace(/^FIX PROOF:\s*/i, "")}</strong>
                  <i>{action.why}</i>
                </span>
                <b>{formatUsdM(action.amountExposedUsd)}</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.evidenceReconcileGrid}>
        <div>
          <SectionTitle
            title="Evidence-owner queue"
            subtitle={
              evidenceQueue(view).length > 0
                ? "Top 5 · loaded evidence gaps awaiting owner review"
                : "No loaded evidence gaps"
            }
          />
          <div className={styles.ownerQueue}>
            {evidenceQueue(view).length > 0 ? (
              evidenceQueue(view).map((gap) => (
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
              ))
            ) : (
              <div className={styles.contractEmpty}>
                No evidence-owner queue rows are loaded for this review.
              </div>
            )}
          </div>
        </div>

        <article className={styles.contractCard}>
          {cardTitle(
            "Projection population counts",
            "Separate, overlapping populations; do not add these rows",
          )}
          <div className={styles.reconcileTables}>
            <div>
              <h3>Rows by population</h3>
              {rowsByPage.map(([label, count]) => (
                <p key={label}>
                  <span>{label}</span>
                  <strong>{formatCount(count)}</strong>
                </p>
              ))}
            </div>
          </div>
          <p className={styles.contractCallout}>
            The AI risk lens lists business evidence gaps only. Pipeline field
            gaps are an operations backlog and do not appear in that lens.
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
