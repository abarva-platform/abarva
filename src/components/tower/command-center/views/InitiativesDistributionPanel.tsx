"use client";

/**
 * Initiatives -> distribution.
 *
 * Groups spend and sponsor-stated value by fields the view model actually carries. If value type or
 * domain is absent, the row is named as not loaded rather than folded into a confident finding.
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

type GroupRow = {
  readonly name: string;
  readonly investmentUsd: number;
  readonly valueUsd: number | null;
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
      missingValueCount: 0,
    };
    map.set(name, {
      name,
      investmentUsd: current.investmentUsd + item.aiSpendUsd,
      valueUsd: item.promisedBenefitLoaded
        ? (current.valueUsd ?? 0) + item.promisedUsd
        : current.valueUsd,
      missingValueCount: current.missingValueCount + (item.promisedBenefitLoaded ? 0 : 1),
    });
  }
  return [...map.values()]
    .map((row) => ({
      ...row,
      valueUsd: row.missingValueCount > 0 && row.valueUsd === 0 ? null : row.valueUsd,
    }))
    .sort((a, b) => b.investmentUsd - a.investmentUsd);
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
    .filter((row) => metric === "investmentUsd" || row.valueUsd !== null)
    .map((row) => ({
      name: row.name,
      value: toM((row[metric] ?? 0) as number),
      label: formatUsdM((row[metric] ?? 0) as number),
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
  const byType = groupBy(view, (item) => item.businessValueType);
  const byDomain = groupBy(view, (item) => item.category);
  const missingTypes = view.allInitiatives.filter((item) => !item.businessValueType).length;
  const missingDomains = view.allInitiatives.filter((item) => !item.category).length;
  const topType = byType.find((row) => row.name !== "Not loaded");
  const topDomain = byDomain.find((row) => row.name !== "Not loaded");

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
        {topType && topDomain
          ? `${topType.name} leads value type; ${topDomain.name} leads spend.`
          : "Initiative distribution is only partially loaded."}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            By value type — investment
          </h3>
          <HBar rows={byType} metric="investmentUsd" fill="#0f6e56" />
        </div>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            By value type — sponsor-stated value
          </h3>
          <HBar rows={byType} metric="valueUsd" fill="#ba7517" />
        </div>
      </div>
      <div style={PANEL}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
          By domain — investment
        </h3>
        <HBar rows={byDomain} metric="investmentUsd" fill="#b4b2a9" />
      </div>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-500)" }}>
        {missingTypes === 0 && missingDomains === 0
          ? "Every initiative has both a value type and a domain in this view."
          : `${missingTypes} rows have no value type and ${missingDomains} rows have no domain, so the distribution names those gaps instead of allocating them by assumption.`}
      </p>
    </section>
  );
}
