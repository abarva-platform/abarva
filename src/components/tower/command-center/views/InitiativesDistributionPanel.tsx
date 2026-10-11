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

import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { formatUsdM } from "@/lib/tower/command-center/format";
import { isBusinessCase } from "./portfolio-kind";

type GroupRow = {
  readonly name: string;
  readonly investmentUsd: number | null;
  readonly valueUsd: number | null;
  readonly missingInvestmentCount: number;
  readonly missingValueCount: number;
};

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
  const missingTypes = cases.filter((item) => !item.businessValueType).length;
  const topType = byType.find((row) => row.name !== "Not loaded" && row.investmentUsd !== null);
  const missingFunding = cases.filter((item) => item.aiAmountBasis !== "approved_funding").length;
  const missingBenefits = cases.filter((item) => !item.promisedBenefitLoaded).length;

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
          : "Initiative distribution is only partially loaded."}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Approved AI funding by benefit type
          </h3>
          <HBar rows={byType} metric="investmentUsd" fill="#0f6e56" />
        </div>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Projected yearly benefit by benefit type
          </h3>
          <HBar rows={byType} metric="valueUsd" fill="#ba7517" />
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        {missingTypes} cases have no benefit type; {missingFunding} have no funding amount;
        {missingBenefits} have no projected benefit amount. Bars marked partial omit unknown
        amounts rather than treating them as zero. The loaded funding category repeats this
        same grouping, so there is no second category chart. A reliable business-area
        breakdown needs each case linked to its business area.
      </p>
    </section>
  );
}
