"use client";

// The value waterfall — Value Proof tab.
// Transcribed from `chart_waterfall()` in the design file (line ~1253).
//
// Floating bars are faked with two `<Bar>` on one `stackId`, the first
// transparent. Verified still honoured on Recharts 3.8.1.

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { formatUsdM } from "@/lib/tower/command-center/format";
import type { TowerCommandSummary } from "@/lib/tower/command-center/types";

import { HEX, toM, twoLineTick, withSliver } from "./chart-kit";

/**
 * Bars are capped rather than filling their band. Seven steps across a wide card
 * produced ~50px slabs, which read as heavy blocks rather than as a measured
 * figure; the leftover band width becomes air.
 */
const WATERFALL_MAX_BAR = 26;

/**
 * The seven waterfall bars — four levels and the three drops between them.
 *
 * Every figure is a subtraction of two governed totals; nothing here is a new
 * measurement. The drops are exactly:
 *   promised − usageSupported     (never usage-supported)
 *   usageSupported − financeValidated (usage, but no Finance sign-off)
 *   financeValidated − claimable  (validated, but the claim gate has not cleared)
 */
export function buildWaterfallRows(summary: TowerCommandSummary) {
  const promised = summary.promisedUsd;
  const usage = Math.min(summary.usageSupportedUsd, promised);
  const finance = Math.min(summary.financeValidatedUsd, usage);
  const claimable = Math.min(summary.claimableUsd, finance);

  const noUsage = Math.max(0, promised - usage);
  const noFinance = Math.max(0, usage - finance);
  const notAttested = Math.max(0, finance - claimable);

  return [
    {
      name: "Promised",
      baseUsd: 0,
      usd: promised,
      fill: HEX.gray700,
      drop: false,
    },
    {
      name: "No|usage",
      baseUsd: usage,
      usd: noUsage,
      fill: HEX.red,
      drop: true,
    },
    {
      name: "Usage|supported",
      baseUsd: 0,
      usd: usage,
      fill: HEX.teal,
      drop: false,
    },
    {
      name: "No finance|sign-off",
      baseUsd: finance,
      usd: noFinance,
      fill: HEX.red,
      drop: true,
    },
    {
      name: "Finance|validated",
      baseUsd: 0,
      usd: finance,
      fill: HEX.tealDark,
      drop: false,
    },
    {
      name: "Not|attested",
      baseUsd: claimable,
      usd: notAttested,
      fill: HEX.red,
      drop: true,
    },
    {
      name: "Claimable",
      baseUsd: 0,
      usd: claimable,
      fill: HEX.gray300,
      drop: false,
    },
  ];
}

export function ValueWaterfallChart({
  summary,
}: {
  summary: TowerCommandSummary;
}) {
  const rows = buildWaterfallRows(summary);
  const axisMax = Math.max(toM(summary.promisedUsd), 0.0001);

  const data = rows.map((row) => ({
    name: row.name,
    base: toM(row.baseUsd),
    v: withSliver(toM(row.usd), axisMax),
    lab:
      row.drop && row.usd > 0 ? `−${formatUsdM(row.usd)}` : formatUsdM(row.usd),
    fill: row.fill,
  }));

  /**
   * Waterfall connectors — the affordance that makes this a waterfall rather
   * than a bar chart with some bars mysteriously floating.
   *
   * Each connector sits at the value level that two neighbouring steps share:
   * the top of "Promised" is the top of the "No usage" drop; the bottom of that
   * drop is the top of "Usage supported"; and so on down the chain. Without
   * them a floating bar reads as a rendering error.
   *
   * They are declared BEFORE the <Bar> elements so Recharts paints them first.
   * The opaque bars then cover the middle of each segment, leaving exactly the
   * inter-bar gap visible — edge-to-edge connectors for free, with no dependency
   * on Recharts' internal bar geometry.
   */
  const levels = [
    toM(summary.promisedUsd),
    toM(rows[2]?.usd ?? 0),
    toM(rows[2]?.usd ?? 0),
    toM(rows[4]?.usd ?? 0),
    toM(rows[4]?.usd ?? 0),
    toM(rows[6]?.usd ?? 0),
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 26, right: 6, left: 4, bottom: 6 }}
        barCategoryGap="18%"
      >
        <CartesianGrid vertical={false} stroke={HEX.border} />
        {levels.map((y, i) =>
          data[i] && data[i + 1] ? (
            <ReferenceLine
              key={`connector-${i}`}
              segment={[
                { x: data[i].name, y },
                { x: data[i + 1].name, y },
              ]}
              stroke={HEX.gray300}
              strokeWidth={1}
              ifOverflow="visible"
            />
          ) : null,
        )}
        <XAxis
          dataKey="name"
          interval={0}
          tickLine={false}
          axisLine={{ stroke: HEX.borderStrong }}
          height={40}
          tick={twoLineTick}
        />
        <YAxis
          tickFormatter={(v: number) => `$${v}`}
          tick={{
            fontSize: 10,
            fill: HEX.gray300,
            fontFamily: "var(--abarva-mono)",
          }}
          axisLine={false}
          tickLine={false}
          width={34}
        />
        {/* Transparent riser — floats the visible segment above the axis. */}
        <Bar
          dataKey="base"
          stackId="a"
          fill="transparent"
          isAnimationActive={false}
          maxBarSize={WATERFALL_MAX_BAR}
        />
        <Bar
          maxBarSize={WATERFALL_MAX_BAR}
          dataKey="v"
          stackId="a"
          radius={[3, 3, 0, 0]}
          isAnimationActive={false}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.fill} />
          ))}
          <LabelList
            dataKey="lab"
            position="top"
            style={{
              fontFamily: "var(--abarva-serif)",
              fontSize: 12.5,
              fontWeight: 500,
              fill: HEX.gray900,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
