"use client";

/**
 * IT budget -> shape.
 *
 * Run/change is loaded on the command summary. Capex/opex is not present in the current view model,
 * so the second half of the design renders a gap instead of inventing a split from unrelated spend.
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

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

type ShapeRow = {
  readonly name: string;
  readonly value: number;
  readonly label: string;
  readonly fill: string;
};

function toM(usd: number): number {
  return usd / 1_000_000;
}

function pct(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function HBar({ data }: { data: readonly ShapeRow[] }) {
  return (
    <div style={{ height: 236, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data as ShapeRow[]}
          layout="vertical"
          margin={{ top: 4, right: 72, left: 0, bottom: 26 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(10,10,11,0.10)" />
          <XAxis
            type="number"
            tick={MONO}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${Math.round(Number(v))}M`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={CAT}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(10,10,11,0.05)" }}
            contentStyle={{
              fontFamily: "var(--abarva-sans)",
              fontSize: 13,
              border: "1px solid var(--canon-border)",
              borderRadius: 0,
              background: "#fff",
            }}
            formatter={(v) => [`$${Math.round(Number(v))}M`, ""] as [string, string]}
          />
          <Bar dataKey="value" isAnimationActive={false} barSize={18}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              style={{
                fontFamily: "var(--abarva-mono)",
                fontSize: 11,
                fill: "#2c2c2a",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetShapePanel({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  const runPct = pct(s.runUsd, s.budgetUsd);
  const changePct = pct(s.changeUsd, s.budgetUsd);
  const aiInvestmentUsd =
    s.aiAttributedInitiativeSpendUsd > 0 ? s.aiAttributedInitiativeSpendUsd : null;
  const aiPctOfChange = pct(aiInvestmentUsd, s.changeUsd);
  const rows: ShapeRow[] = [
    s.runUsd === null
      ? null
      : {
          name: "Run",
          value: toM(s.runUsd),
          label: formatUsdM(s.runUsd),
          fill: "#b4b2a9",
        },
    s.changeUsd === null
      ? null
      : {
          name: "Change",
          value: toM(s.changeUsd),
          label: formatUsdM(s.changeUsd),
          fill: "#ba7517",
        },
    aiInvestmentUsd === null
      ? null
      : {
          name: "AI-related",
          value: toM(aiInvestmentUsd),
          label: formatUsdM(aiInvestmentUsd),
          fill: "#0f6e56",
        },
  ].filter(Boolean) as ShapeRow[];

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
        {runPct === null
          ? "The run/change budget shape is not fully loaded."
          : `${runPct}% of loaded IT budget is run/operate.`}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 460px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Run, change, AI-related
          </h3>
          {rows.length > 0 ? <HBar data={rows} /> : <p>Not loaded</p>}
          <p style={{ margin: "18px 0 0", paddingTop: 16, borderTop: "1px solid var(--canon-border)", fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-700)" }}>
            {aiPctOfChange === null
              ? "AI share of change cannot be computed because attributed AI investment or change budget is not loaded."
              : `${aiPctOfChange}% of loaded change budget is attributed to AI initiatives or tool rollouts.`}
          </p>
        </div>
        <div style={{ ...PANEL, flex: "1 1 360px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Capex and opex
          </h3>
          <div style={{ display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr" }}>
            {["Capex", "Opex"].map((label) => (
              <div
                key={label}
                style={{
                  background: "var(--canon-bg-surface)",
                  outline: "1px solid var(--canon-border)",
                  padding: "22px 24px",
                }}
              >
                <div style={{ fontSize: 14, color: "var(--canon-gray-500)" }}>{label}</div>
                <div
                  style={{
                    fontFamily: "var(--abarva-serif)",
                    fontSize: 34,
                    letterSpacing: "-0.024em",
                    marginTop: 6,
                    color: "var(--canon-gray-500)",
                  }}
                >
                  Not loaded
                </div>
              </div>
            ))}
          </div>
          <p style={{ margin: "20px 0 0", paddingTop: 16, borderTop: "1px solid var(--canon-border)", fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-700)" }}>
            The capital and operating split is not loaded. It has to arrive as a governed field
            before this panel can divide the budget.
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        Budget loaded: {formatUsdM(s.budgetUsd)} · run {runPct ?? "Not loaded"}
        {runPct === null ? "" : "%"} · change {changePct ?? "Not loaded"}
        {changePct === null ? "" : "%"}
      </p>
    </section>
  );
}
