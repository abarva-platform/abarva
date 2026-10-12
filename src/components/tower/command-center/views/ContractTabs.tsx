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
import { approvedAiCaseFunding, isBusinessCase } from "./portfolio-kind";
import { byEvidencePriority, evidenceGapAmount } from "./evidence-gap-amount";

type Tone = "teal" | "amber" | "red" | "gray";
type AiLens = "cost" | "risk" | "adoption" | "table";
type CostFinding = {
  id: string;
  badge: string;
  amountUsd: number | null;
  amountLabel: string;
  amountText: string;
  title: string;
  body: string;
  actionId: string | null;
  gapId: string | null;
};
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
type CampaignRow = {
  seq: string;
  title: string;
  owner: string;
  tasks: number;
  unit: string;
  valueUsd: number | null;
  valueLabel: string;
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
  unknown: "unknown",
};

function formatLoadedUsdM(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "not verified"
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
      {s.approvedInvestmentUsd === null
        ? "Approved FY26 project funding is not verified"
        : `${formatUsdM(s.approvedInvestmentUsd)} in approved FY26 project funding`} ·{" "}
      <strong>{s.claimableAmountLoaded === false ? "Cleared amount not verified" : s.claimableAmountLoaded === true || s.claimableClaimCount > 0 ? `${formatUsdM(s.claimableUsd)} cleared for reporting in loaded months` : "No benefit amount cleared for reporting"}</strong> ·{" "}
      {claimCount > 0
        ? `${formatCount(openClaimCount(view))} of ${formatCount(claimCount)} benefit claims do not show a cleared amount`
        : "Benefit claims not loaded"}
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
              <b>{formatCount(s.usageSupportedClaimCount)}</b> benefit claims with usage evidence
            </>
          ) : (
            "Usage support not loaded"
          )}
        </span>
        <span>{formatCount(s.outcomeMeasuredClaimCount)}/{formatCount(s.valueClaimCount)} benefit claims outcome-measured</span>
        {(s.valueProofOutcomeRecordCount ?? 0) > 0 ? (
          <span>{formatCount(s.valueProofOutcomeRecordCount ?? 0)} separate outcome-measure records</span>
        ) : null}
        <span>{formatCount(emittingAiCount(view))} asset rows with usage metrics · {formatCount(view.usageObservations.length)} separate adoption-source rows</span>
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
        (b.promisedBenefitLoaded ? b.promisedUsd : -1) -
          (a.promisedBenefitLoaded ? a.promisedUsd : -1) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, count);
}

function ValueGateChart({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
  const groups = [
    {
      title: "Approved funding",
      note: "AI funding is part of the project total. Neither amount shows money already spent or benefits earned.",
      rows: [
        ["Approved FY26 project funding", formatLoadedUsdM(s.approvedInvestmentUsd)],
        ["Approved FY26 AI case funding within it", caseFunding === null ? "Not verified" : formatUsdM(caseFunding)],
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
      note: "Finance review and permission to report are separate steps. Only the cleared amount can be presented as an achieved benefit.",
      rows: [
        ["Finance validated", s.financeValidatedAmountLoaded === false ? "Not verified" : s.financeValidatedAmountLoaded === true || s.financeAttestedClaimCount > 0 ? formatUsdM(s.financeValidatedUsd) : "No amount recorded"],
        ["Cleared for reporting", s.claimableAmountLoaded === false ? "Not verified" : s.claimableAmountLoaded === true || s.claimableClaimCount > 0 ? formatUsdM(s.claimableUsd) : "No amount cleared"],
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
        title="Results and proof"
        subtitle={`${formatCount(valueClaimCount(view))} benefit claims${(s.valueProofOutcomeRecordCount ?? 0) > 0 ? ` + ${formatCount(s.valueProofOutcomeRecordCount ?? 0)} separate outcome-measure records` : ""} · evidence requirements differ by record type`}
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
            "Quarterly plan and recorded results",
            hasTrajectory
              ? `${formatCount(view.valueTrajectory.length)} quarter${view.valueTrajectory.length === 1 ? "" : "s"} loaded from the quarterly trajectory`
              : "Quarterly trajectory not loaded",
          )}
          <div className={styles.trajectoryStats}>
            <div>
              <span>Projected yearly benefit</span>
              <strong>{s.promisedBenefitLoaded ? formatUsdM(s.promisedUsd) : "Not loaded"}</strong>
            </div>
            <div>
              <span>Recorded financial result in loaded quarters</span>
              <strong>{formatLoadedUsdM(recordedPAndL)}</strong>
            </div>
            <div>
              <span>Benefit claims with measured results</span>
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
            {!hasTrajectory
              ? "No quarterly plan or actual-result rows are loaded, so there is no quarter-by-quarter comparison to assess."
              : recordedPAndL === null
                ? "The loaded quarters have no recorded financial result. Gray bars show any plan amounts recorded for those quarters."
                : "The red line shows actual financial results for the loaded quarters; gray bars show the plan. This is a complete eight-quarter view only when all eight quarters are loaded."}
          </p>
        </article>

        <article className={cx(styles.contractCard, styles.claimCard)}>
          {cardTitle(
            "Evidence recorded for each value claim",
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
            "Program decision rows",
            `Top ${formatCount(programs.length)} of ${formatCount(view.programs.length)} reviewed program rows`,
          )}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Program</th>
                  <th>Projected yearly benefit</th>
                  <th>Proof progress</th>
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
                      {program.promisedBenefitLoaded ? formatUsdM(program.promisedUsd) : "Not loaded"}
                    </td>
                    <td>{formatPct(program.proofMaturityScore)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.contractCallout}>
            These are program-level planning amounts where recorded, not benefits already earned.
            Their relationship to the portfolio estimate is not reconciled here; do not add them to it.
          </p>
        </article>
      </section>

      <footer className={styles.contractFoot}>
        {s.tenantName} · tool use, Finance review, and permission to report a benefit are separate steps
      </footer>
    </div>
  );
}

function spendRows(view: TowerCommandCenterView) {
  const byKey = new Map<
    string,
    { label: string; valueUsd: number; kind: TowerAiKind; count: number }
  >();
  // A tool's annualized license cost is not approved project funding.
  const casesWithFunding = view.allInitiatives.filter(
    (item) => isBusinessCase(item) && item.aiAmountBasis === "approved_funding",
  );
  for (const item of casesWithFunding) {
    const key = item.category || "Type not recorded";
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
  const sorted = [...byKey.values()].sort((a, b) => b.valueUsd - a.valueUsd);
  const rows = sorted.slice(0, 5);
  const remaining = sorted.slice(5);
  if (remaining.length > 0) {
    rows.push({
      label: `${formatCount(remaining.reduce((sum, row) => sum + row.count, 0))} more cases`,
      valueUsd: remaining.reduce((sum, row) => sum + row.valueUsd, 0),
      kind: "embedded",
      count: remaining.reduce((sum, row) => sum + row.count, 0),
    });
  }
  return rows;
}

function AiSpendChart({ view }: { view: TowerCommandCenterView }) {
  const rows = spendRows(view);
  if (rows.length === 0) {
    return <div className={styles.emptyPanel}>Approved AI case funding is not loaded.</div>;
  }
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
  return view.allInitiatives.filter((item) => isBusinessCase(item) && item.aiAmountBasis === "approved_funding")
    .sort((a, b) => b.aiSpendUsd - a.aiSpendUsd || a.name.localeCompare(b.name))
    .slice(0, 6);
}

function aiAmountLabel(item: TowerAiView): string {
  if (item.aiAmountBasis === "approved_funding") return `${formatUsdM(item.aiSpendUsd)} approved funding`;
  if (item.aiAmountBasis === "annualized_tool_cost") return `${formatUsdM(item.aiSpendUsd)} yearly tool cost`;
  return "Amount basis not verified";
}

function aiBenefitLabel(item: TowerAiView): string {
  if (!item.promisedBenefitLoaded) {
    return item.populationKind === "tool_rollout"
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
  return "Usage metric not loaded";
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
  const gaps = [...view.gaps].sort(byEvidencePriority);
  const actions = [...view.actions].sort((a, b) => a.sequence - b.sequence);
  const rows: CostFinding[] = actions.slice(0, 4).map((action, index) => ({
    id: `A${action.sequence || index + 1}`,
    badge: action.lane === "unclassified" ? "Evidence task" : action.lane,
    amountUsd: action.amountExposedUsd,
    amountLabel: action.moduleHandoff?.toLowerCase() === "source" ? "Potential annual saving" : "Projected yearly benefit affected",
    amountText: formatOptionalUsdM(action.amountExposedUsd),
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
      amountLabel: evidenceGapAmount(gap).label,
      amountText: evidenceGapAmount(gap).value,
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
      amountUsd: null,
      amountLabel: "Amount",
      amountText: "Not loaded",
      title: "AI amount needs a source check",
      body: "The summary and the asset rows do not reconcile on the same basis. Check which amounts are approved funding and which are yearly tool costs before showing a difference.",
      actionId: null,
      gapId: null,
    });
  }

  return rows;
}

function riskRows(view: TowerCommandCenterView): TowerEvidenceGapView[] {
  return [...view.gaps]
    .sort(byEvidencePriority)
    .slice(0, 20);
}

function isToolRolloutRow(item: TowerAiView): boolean {
  return item.populationKind === "tool_rollout";
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
    (a, b) => a.name.localeCompare(b.name),
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
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);
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
      label: "Funding and cost",
      detail: view.costLens
        ? `${formatCount(view.costLens.categories.length)} spend categories`
        : `${formatCount(costLensFindings.length)} findings`,
    },
    {
      key: "risk" as const,
      label: "Risk lens",
      detail: `${formatCount(view.gaps.length)} total · top ${formatCount(riskRows(view).length)} shown`,
    },
    {
      key: "adoption" as const,
      label: "Adoption lens",
      detail: `${formatCount(adoptionLensRows.length)} tool rollouts · ${formatCount(view.usageObservations.length)} adoption-source rows`,
    },
  ];
  return (
    <div className={styles.contractView}>
      <ContractMasthead view={view} />
      <div className={styles.contractModeRow}>
        <SectionTitle
          title="AI initiatives and tool rollouts"
          subtitle={`${formatCount(view.allInitiatives.filter(isBusinessCase).length)} AI use cases + ${formatCount(view.allInitiatives.filter(isToolRolloutRow).length)} tool rollouts · ${formatCount(view.usageObservations.length)} separate adoption-source rows · ${caseFunding === null ? "Approved FY26 AI case funding not verified" : `${formatUsdM(caseFunding)} approved FY26 AI case funding`}`}
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
        <>
        {view.costLens ? (
          <section className={styles.costStory} aria-label="Annual IT spend and contract exposure">
            <article className={cx(styles.contractCard, styles.costStorySummary)}>
              <div className={styles.contractMiniKicker}>Annual IT spend from source rows</div>
              <strong className={styles.costStoryTotal}>{usd.format(view.costLens.modeledAnnualSpendUsd)}</strong>
              <p>One-source planning estimate from {formatCount(view.costLens.categories.length)} spend categories. The source does not name a fiscal year. This is not an approved budget or verified savings.</p>
              <p><b>Approved FY budget:</b> {s.budgetUsd === null ? "Unknown" : usd.format(s.budgetUsd)}</p>
              {view.costLens.sourceNarrativeDifferenceUsd !== null && view.costLens.sourceNarrativeDifferenceUsd !== 0 ? (
                <p>The source summary and category rows differ by {usd.format(Math.abs(view.costLens.sourceNarrativeDifferenceUsd))}. This total uses the category rows.</p>
              ) : null}
            </article>
            <details className={cx(styles.contractCard, styles.costStoryDetails)}>
              <summary>See all {formatCount(view.costLens.categories.length)} spend categories</summary>
              <p>These rows make up the annual IT spend total above. Do not add them to that total again. Category business IDs are not available.</p>
              <div className={styles.costStoryTableWrap}>
                <table className={styles.costStoryTable}>
                  <thead><tr><th scope="col">Spend category</th><th scope="col">Annual amount</th><th scope="col">Source row</th></tr></thead>
                  <tbody>{view.costLens.categories.map((row) => (
                    <tr key={row.id}><th scope="row">{row.label}</th><td>{usd.format(row.amountUsd)}</td><td>{row.sourceFile} · row {row.sourceRow}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
            <details className={cx(styles.contractCard, styles.costStoryDetails)}>
              <summary>See {formatCount(view.costLens.contractExposure.length)} vendor contract {view.costLens.contractExposure.length === 1 ? "amount" : "amounts"}</summary>
              <p>Contract amounts are a separate exposure. Their overlap with the IT spend categories is unknown, so they are not included in the total above.</p>
              <div className={styles.costStoryTableWrap}>
                <table className={styles.costStoryTable}>
                  <thead><tr><th scope="col">Vendor</th><th scope="col">Annual contract amount</th><th scope="col">Source row</th></tr></thead>
                  <tbody>{view.costLens.contractExposure.map((row) => (
                    <tr key={row.id}><th scope="row">{row.label}</th><td>{usd.format(row.amountUsd)}</td><td>{row.sourceFile} · row {row.sourceRow}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
          </section>
        ) : null}
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
              This chart shows approved funding for classified AI business cases only. Missing
              case amounts are excluded. Tool costs, when loaded, are yearly costs shown
              separately in rollout details and the full table.
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
                    <strong>{aiAmountLabel(item)}</strong>
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
                      <strong>{finding.amountText}</strong>
                      <small>{finding.amountLabel}</small>
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
        </>
      ) : null}

      {lens === "risk" ? (
        <article className={cx(styles.contractCard, styles.contractFullCard)}>
          {cardTitle("Risk lens", `Top ${formatCount(riskRows(view).length)} of ${formatCount(view.gaps.length)} evidence gaps by priority`)}
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Gap</th>
                  <th>Owner</th>
                  <th>Amount linked to gap</th>
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
                      {evidenceGapAmount(gap).value === "Not loaded"
                        ? "Amount not loaded"
                        : evidenceGapAmount(gap).value}
                      {evidenceGapAmount(gap).value === "Not loaded" ? null : (
                        <small> {evidenceGapAmount(gap).label}</small>
                      )}
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
          <p>{formatCount(view.usageObservations.length)} separate adoption-source rows are loaded; {formatCount(view.usageObservations.filter((item) => item.usageHeadline || item.usageBars.length > 0).length)} carry a displayable usage metric. These rows do not establish tool rollout targets or vendor exposure.</p>
          <div className={styles.decisionLaneTableWrap}>
            <table className={styles.contractTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Initiative / tool</th>
                  <th>Usage metric</th>
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
          {view.usageObservations.length > 0 ? (
            <div className={styles.decisionLaneTableWrap}>
              <table className={styles.contractTable}>
                <thead><tr><th>Adoption-source row</th><th>Usage metric</th></tr></thead>
                <tbody>{view.usageObservations.map((item) => (
                  <tr key={item.id}><td>{item.name}</td><td>{aiUsageLabel(item)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          ) : null}
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
                  <th>Funding or yearly tool cost</th>
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
                      <td>{item.vendor ?? "Not loaded"}</td>
                      <td>
                        {humanizeLabel(
                          item.businessValueType ??
                            item.category ??
                            AI_KIND_LABEL[item.displayBucket],
                        )}
                      </td>
                      <td>{aiAmountLabel(item)}</td>
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
        {s.tenantName} · tool use, Finance review, and permission to report a benefit are separate steps
      </footer>
    </div>
  );
}

function campaignRows(view: TowerCommandCenterView): CampaignRow[] {
  const actions = [...view.actions].sort((a, b) => a.sequence - b.sequence);
  const gaps = [...view.gaps].sort(byEvidencePriority);
  const rows: CampaignRow[] = actions.map((action) => ({
    seq: String(action.sequence),
    title: action.title.replace(/^FIX PROOF:\s*/i, ""),
    owner: action.ownerRole,
    tasks: 1,
    unit: "Recommendation",
    valueUsd: action.amountExposedUsd,
    valueLabel: action.moduleHandoff?.toLowerCase() === "source" ? "Potential annual saving" : "Projected yearly benefit affected",
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
      valueLabel: evidenceGapAmount(gap).label,
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
    .sort(byEvidencePriority)
    .slice(0, 5);
}

function sourceContractActions(view: TowerCommandCenterView) {
  return view.actions
    .filter((action) => action.moduleHandoff?.toLowerCase() === "source")
    .sort(
      (a, b) =>
        (b.amountExposedUsd ?? -1) - (a.amountExposedUsd ?? -1) || a.title.localeCompare(b.title),
    )
    .slice(0, 5);
}

function reconciliationRows(view: TowerCommandCenterView) {
  const ai = view.summary.aiInitiativeCount;
  const recommendations = view.actions.length;
  const claims = valueClaimCount(view);
  return [
    ["AI portfolio assets", ai],
    ["Benefit claims", claims],
    ["AI risk lens evidence gaps", view.gaps.length],
    ["Pipeline field gaps (ops)", view.pipelineGaps.length],
    ["Source recommendations", recommendations],
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
        subtitle="Assets, benefit claims, evidence gaps, pipeline gaps and recommendations have different counting bases"
      />

      <section className={styles.populationGrid}>
        <article>
          <strong>{formatCount(valueClaimCount(view))}</strong>
          <span>Benefit claims</span>
          <p>Benefit assertions attached to a value case. Not follow-up records.</p>
        </article>
        <article>
          <strong>{formatCount(view.actions.length)}</strong>
          <span>Source recommendations</span>
          <p>Suggested follow-ups from the projection. Task-system assignment, status, and due date are not loaded.</p>
        </article>
        <article>
          <strong>{formatCount(economicRows)}</strong>
          <span>Unreviewed economic rows</span>
          <p>Rows with no known value yet. A backlog, not a workload.</p>
        </article>
      </section>

      <p className={styles.contractCallout}>
        The same case may appear in several recommendations or evidence gaps. Each dollar amount
        shows the value affected by that item; do not add those amounts together.
      </p>

      <section>
        <SectionTitle
          title="Review follow-ups"
          subtitle={`Up to ${formatCount(campaigns.length)} source recommendations and evidence gaps shown · task-system status not loaded`}
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
                  <i>{row.valueLabel}</i>
                  <strong>{row.gap ? evidenceGapAmount(row.gap).value : formatOptionalUsdM(row.valueUsd)}</strong>
                </span>
                <span className={styles.campaignMetric}>
                  <i>Next step</i>
                  <strong>{row.due}</strong>
                </span>
              </button>
            ))
          ) : (
            <div className={styles.contractEmpty}>
              No source recommendations or evidence-gap follow-ups are loaded for this review.
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
                <b>{action.amountExposedUsd === null ? "Amount not loaded" : `${formatUsdM(action.amountExposedUsd)} / year potential`}</b>
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
                    {evidenceGapAmount(gap).value === "Not loaded"
                      ? "Amount not loaded"
                      : evidenceGapAmount(gap).value}
                    {evidenceGapAmount(gap).value === "Not loaded" ? null : (
                      <small> {evidenceGapAmount(gap).label}</small>
                    )}
                  </b>
                </button>
              ))
            ) : (
              <div className={styles.contractEmpty}>
                No evidence-owner queue rows are loaded. An empty queue does not mean every claim has proof.
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
        {s.tenantName} · tool use, Finance review, and permission to report a benefit are separate steps
      </footer>
    </div>
  );
}
