"use client";

/**
 * Initiatives -> distribution.
 *
 * Groups approved AI funding and projected benefit by the case value type. The loaded AI spend
 * category repeats that same source field, so showing it as another breakdown would be misleading.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type React from "react";

import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatCount, formatUsdM } from "@/lib/tower/command-center/format";
import { expectedBenefitKindLabel } from "./expected-benefit-kind";
import { isBusinessCase } from "./portfolio-kind";

type GroupRow = {
  readonly name: string;
  readonly investmentUsd: number | null;
  readonly valueUsd: number | null;
  readonly missingInvestmentCount: number;
  readonly missingValueCount: number;
};

export function expectedBenefitKindRows(cases: readonly TowerAiView[]) {
  const counts = new Map<string, number>();
  for (const item of cases) {
    const code = item.expectedValueArchetype?.trim();
    if (!code) continue;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([sourceCode, count]) => ({ sourceCode, label: expectedBenefitKindLabel(sourceCode) ?? sourceCode, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

const MONO = {
  fontFamily: "var(--abarva-mono)",
  fontSize: 11,
  fill: "#5f5e5a",
} as const;

const CAT = {
  fontFamily: "var(--abarva-sans)",
  fontSize: 13,
  fill: "#2c2c2a",
} as const;

function toM(usd: number): number {
  return usd / 1_000_000;
}

function groupBy(
  view: TowerCommandCenterView,
  keyFor: (item: (typeof view.allInitiatives)[number]) => string | null,
): readonly GroupRow[] {
  const map = new Map<string, GroupRow>();
  for (const item of view.allInitiatives) {
    const name = keyFor(item) ?? "Not loaded";
    const current = map.get(name) ?? {
      name,
      investmentUsd: 0,
      valueUsd: 0,
      missingInvestmentCount: 0,
      missingValueCount: 0,
    };
    map.set(name, {
      name,
      investmentUsd: item.aiAmountBasis === "approved_funding"
        ? (current.investmentUsd ?? 0) + item.aiSpendUsd
        : current.investmentUsd,
      valueUsd: item.promisedBenefitLoaded
        ? (current.valueUsd ?? 0) + item.promisedUsd
        : current.valueUsd,
      missingInvestmentCount: current.missingInvestmentCount + (item.aiAmountBasis === "approved_funding" ? 0 : 1),
      missingValueCount: current.missingValueCount + (item.promisedBenefitLoaded ? 0 : 1),
    });
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      investmentUsd: row.missingInvestmentCount > 0 && row.investmentUsd === 0 ? null : row.investmentUsd,
      valueUsd: row.missingValueCount > 0 && row.valueUsd === 0 ? null : row.valueUsd,
    }))
    .sort((a, b) => (b.investmentUsd ?? -1) - (a.investmentUsd ?? -1));
}

function HBar({
  rows,
  metric,
  fill,
}: {
  rows: readonly GroupRow[];
  metric: "investmentUsd" | "valueUsd";
  fill: string;
}) {
  const data = rows
    .filter((row) => row[metric] !== null)
    .map((row) => ({
      name: row.name,
      value: toM((row[metric] ?? 0) as number),
      label: `${formatUsdM((row[metric] ?? 0) as number)}${(metric === "investmentUsd" ? row.missingInvestmentCount : row.missingValueCount) > 0 ? " partial" : ""}`,
      fill,
    }));

  if (data.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
        Not loaded
      </p>
    );
  }

  return (
    <div style={{ height: 300, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 76, left: 0, bottom: 18 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(10,10,11,0.10)" />
          <XAxis type="number" tick={MONO} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(Number(v))}M`} />
          <YAxis type="category" dataKey="name" width={160} tick={CAT} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(10,10,11,0.05)" }}
            contentStyle={{ fontFamily: "var(--abarva-sans)", fontSize: 13, border: "1px solid var(--canon-border)", borderRadius: 0, background: "#fff" }}
            formatter={(v) => [`$${Number(v).toFixed(1)}M`, ""] as [string, string]}
          />
          <Bar dataKey="value" isAnimationActive={false} barSize={16}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
            <LabelList dataKey="label" position="right" style={{ fontFamily: "var(--abarva-mono)", fontSize: 11, fill: "#2c2c2a" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InitiativesDistributionPanel({ view }: { view: TowerCommandCenterView }) {
  const cases = view.allInitiatives.filter(isBusinessCase);
  const caseView = { ...view, allInitiatives: cases };
  const byType = groupBy(caseView, (item) => item.businessValueType);
  const expectedKinds = expectedBenefitKindRows(cases);
  const expectedKindCount = expectedKinds.reduce((total, row) => total + row.count, 0);
  const missingTypes = cases.filter((item) => !item.businessValueType).length;
  const topType = byType.find((row) => row.name !== "Not loaded" && row.investmentUsd !== null);
  const missingFunding = cases.filter((item) => item.aiAmountBasis !== "approved_funding").length;
  const missingBenefits = cases.filter((item) => !item.promisedBenefitLoaded).length;
  const sourcePlanCases = cases.filter((item) => item.sourcePlan != null);
  if (sourcePlanCases.length > 0) {
    const counts = [...new Set(cases.map((item) => item.businessValueType ?? "Unclassified"))]
      .map((name) => ({ name, count: cases.filter((item) => (item.businessValueType ?? "Unclassified") === name).length }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    const maxCount = counts[0]?.count ?? 0;
    const withFunding = sourcePlanCases.filter((item) => item.sourcePlan?.fundingUsd != null).length;
    const withBenefit = sourcePlanCases.filter((item) => item.sourcePlan?.yearlyBenefitLowUsd != null).length;
    const withRoi = sourcePlanCases.filter((item) => item.sourcePlan?.roiLowMultiple != null).length;
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
          The synthetic AI plan spans {counts.length} value areas. Funding and return estimates are available case by case, while achieved value needs separate proof.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}>
          {[
            ["Cases with a funding plan", withFunding],
            ["Cases with a yearly benefit plan", withBenefit],
            ["Cases with a projected ROI", withRoi],
          ].map(([label, count]) => (
            <div key={label} style={PANEL}>
              <div style={{ fontSize: 14, color: "var(--canon-gray-500)" }}>{label}</div>
              <strong style={{ display: "block", marginTop: 6, fontFamily: "var(--abarva-serif)", fontSize: 30 }}>{count} of {cases.length}</strong>
            </div>
          ))}
        </div>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Where the AI cases aim to create value</h3>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--canon-gray-700)" }}>
            Each case appears once under its source value category. Bars count cases; they do not add disputed funding or benefit amounts.
          </p>
          {counts.map((row) => (
            <div key={row.name} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) minmax(160px, 2fr) 35px", gap: 14, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--canon-border)" }}>
              <span>{row.name}</span>
              <span style={{ height: 12, background: "var(--canon-gray-100)" }}>
                <span style={{ display: "block", width: `${maxCount > 0 ? (row.count / maxCount) * 100 : 0}%`, height: 12, background: "var(--canon-amber)" }} />
              </span>
              <strong style={{ textAlign: "right" }}>{row.count}</strong>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--canon-gray-700)" }}>
          Open Business cases for each source-stated funding amount, yearly benefit estimate, and projected ROI. Finance review stage, measured outcomes, and tool use must be assessed before deciding whether to scale, fix, or stop a case.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--abarva-serif)",
          fontWeight: 500,
          fontSize: 26,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
        }}
      >
        {topType
          ? `${topType.name} has the most approved AI funding in these business cases.`
          : expectedKindCount > 0
            ? `The source describes what ${formatCount(expectedKindCount)} of ${formatCount(cases.length)} AI cases hope to improve. Dollar amounts still need separate proof.`
            : "Expected benefit kinds and the financial breakdown are not loaded."}
      </h2>
      <div style={PANEL}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Expected benefit kind from intake
        </h3>
        <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.5, color: "var(--canon-gray-700)" }}>
          This describes the plan for each AI case. It is not a measured result or a benefit cleared by Finance. Each case counts once under its source description.
        </p>
        {expectedKinds.length === 0 ? (
          <p style={{ margin: 0, fontSize: 15 }}>Not recorded in intake</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.7 }}>
            {expectedKinds.map((row) => (
              <li key={row.sourceCode}>{row.label}: {formatCount(row.count)} {row.count === 1 ? "case" : "cases"}</li>
            ))}
          </ul>
        )}
        {expectedKindCount < cases.length ? (
          <p style={{ margin: "12px 0 0", fontSize: 14 }}>
            {formatCount(cases.length - expectedKindCount)} {cases.length - expectedKindCount === 1 ? "case has" : "cases have"} no expected benefit kind recorded.
          </p>
        ) : null}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Approved AI funding by recorded value category
          </h3>
          <HBar rows={byType} metric="investmentUsd" fill="#0f6e56" />
        </div>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Projected yearly benefit by recorded value category
          </h3>
          <HBar rows={byType} metric="valueUsd" fill="#ba7517" />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        {`${missingTypes} cases have no recorded value category; ${missingFunding} have no approved funding amount; ${missingBenefits} have no projected yearly benefit amount.`} These money charts use the separate value category where it is loaded, not the expected benefit kind above. Bars marked partial omit unknown amounts rather than treating them as zero. Neither chart shows benefits actually delivered or cleared by Finance.
      </p>
    </section>
  );
}
