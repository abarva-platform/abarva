"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONO, PAGE_X, SANS, V4, eyebrow } from "./tokens";

/**
 * Contract term ends on a time axis.
 *
 * This is the one place on these surfaces where a chart beats the table it sits beside. The table
 * already reports how many contracts end in each year; what it cannot show is the shape — that the
 * decisions arrive in a wall rather than evenly, and that a stretch of them is already behind us.
 * Clustering is a property of the axis, not of the rows.
 *
 * Recharts cannot resolve CSS custom properties inside SVG paint attributes, so the colours here
 * are literal hex mirrors of `tokens.ts`. They are the v4 values deliberately: the Home preview
 * chart kit carries a different navy from a separate design lineage, and mixing the two on one page
 * would read as two products.
 */
/** Fixed drawing size; CSS scales the emitted SVG to the column it sits in. */
const CHART_WIDTH = 900;
const CHART_HEIGHT = 220;

const HEX = {
  navy: "#0c1a3a",
  stone: "#888780",
  amber: "#ba7517",
  red: "#a32d2d",
  rule: "rgba(136,135,128,0.28)",
  slate: "#5F5E5A",
} as const;

export interface RenewalYear {
  year: string;
  /** Renews without a decision unless notice is served inside its window. */
  autoRenewing: number;
  /** Requires an active decision to continue. */
  requiresDecision: number;
  /** Term end already behind the record's own as-of date. */
  past: boolean;
}

/**
 * Buckets contracts by the year their term ends, split by whether renewal needs a decision.
 *
 * `asOf` comes from the record rather than the clock, so "already passed" means passed relative to
 * what the record knew — reproducible, and it cannot change meaning because the page was opened on
 * a different day.
 */
export function buildRenewalYears(
  contracts: Array<Record<string, unknown>>,
  asOf?: string,
): RenewalYear[] {
  const byYear = new Map<
    string,
    { autoRenewing: number; requiresDecision: number }
  >();
  for (const contract of contracts) {
    const termEnd = String(contract.termEnd ?? "").trim();
    const year = /^(\d{4})-/.exec(termEnd)?.[1];
    if (!year) continue;
    const entry = byYear.get(year) ?? { autoRenewing: 0, requiresDecision: 0 };
    if (/^(yes|true|y)$/i.test(String(contract.autoRenewFlag ?? "").trim()))
      entry.autoRenewing += 1;
    else entry.requiresDecision += 1;
    byYear.set(year, entry);
  }
  const cutoff = asOf?.slice(0, 4);
  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, counts]) => ({
      year,
      ...counts,
      past: Boolean(cutoff && year < cutoff),
    }));
}

export function RenewalTimeline({
  contracts,
  asOf,
}: {
  contracts: Array<Record<string, unknown>>;
  asOf?: string;
}) {
  const years = buildRenewalYears(contracts, asOf);
  // Two years is a list, not a shape. Below that the table beside this says it better.
  if (years.length < 3) return null;
  const past = years
    .filter((y) => y.past)
    .reduce((n, y) => n + y.autoRenewing + y.requiresDecision, 0);
  const peak = years.reduce((worst, y) =>
    y.autoRenewing + y.requiresDecision >
    worst.autoRenewing + worst.requiresDecision
      ? y
      : worst,
  );

  return (
    <section
      data-home-renewal-timeline={years.length}
      style={{
        padding: `28px ${PAGE_X}px 0`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={eyebrow(V4.slate)}>When the decisions arrive</span>
        {past > 0 ? (
          <span
            style={{ ...eyebrow(V4.red), fontSize: 10 }}
            data-home-renewal-past={past}
          >
            {past} already behind the record
          </span>
        ) : null}
      </div>

      <div
        style={{
          background: V4.surface,
          border: `1px solid ${V4.rule}`,
          padding: "20px 22px 12px",
        }}
      >
        {/*
          Drawn at a fixed size and scaled by CSS rather than measured at runtime.

          ResponsiveContainer measures its parent in the browser and renders nothing without a
          layout pass, which means no test and no static render can ever see this chart -- it would
          ship having never been observed drawing anything. A fixed viewBox scaled with CSS gives up
          per-breakpoint tick density and buys a chart that can be rendered, screenshotted and
          asserted on, which is the trade worth making on a governed surface.
        */}
        <div
          data-home-renewal-chart
          style={{ width: "100%", overflow: "hidden", lineHeight: 0 }}
        >
          <div style={{ width: "100%" }}>
            <BarChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              data={years}
              margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
              barCategoryGap="26%"
              style={{ width: "100%", height: "auto" }}
            >
              <CartesianGrid stroke={HEX.rule} vertical={false} />
              <XAxis
                dataKey="year"
                tick={{ fill: HEX.slate, fontSize: 11, fontFamily: MONO }}
                axisLine={{ stroke: HEX.rule }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: HEX.slate, fontSize: 11, fontFamily: MONO }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "rgba(12,26,58,0.05)" }}
                contentStyle={{
                  background: "#ffffff",
                  border: `1px solid ${HEX.rule}`,
                  borderRadius: 4,
                  fontFamily: SANS,
                  fontSize: 12,
                }}
                formatter={(value, name) => [
                  String(value ?? ""),
                  name === "autoRenewing"
                    ? "Renews automatically"
                    : "Requires a decision",
                ]}
              />
              {/* A term end behind the record reads red: it renewed with nobody deciding, or the
                  record is stale, and either way it is not a future decision. */}
              {/* Animation off: bars that grow in are decoration on a page read for decisions, and an
                  animated mount is why a static render draws axes with nothing in them. */}
              <Bar
                dataKey="autoRenewing"
                stackId="a"
                fill={HEX.navy}
                isAnimationActive={false}
              >
                {years.map((y) => (
                  <Cell
                    key={`auto-${y.year}`}
                    fill={y.past ? HEX.red : HEX.navy}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="requiresDecision"
                stackId="a"
                fill={HEX.stone}
                isAnimationActive={false}
              >
                {years.map((y) => (
                  <Cell
                    key={`req-${y.year}`}
                    fill={y.past ? HEX.amber : HEX.stone}
                  />
                ))}
              </Bar>
            </BarChart>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            paddingTop: 10,
            borderTop: `1px solid ${V4.ruleSoft}`,
          }}
        >
          {[
            { swatch: HEX.navy, text: "Renews automatically" },
            { swatch: HEX.stone, text: "Requires a decision" },
            { swatch: HEX.red, text: "Term end already behind the record" },
          ].map((key) => (
            <span
              key={key.text}
              style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  background: key.swatch,
                  display: "inline-block",
                }}
              />
              <span style={{ fontFamily: SANS, fontSize: 12, color: V4.slate }}>
                {key.text}
              </span>
            </span>
          ))}
        </div>

        <p
          style={{
            margin: "11px 0 0",
            fontFamily: SANS,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: V4.slate,
            maxWidth: "82ch",
          }}
        >
          {peak.autoRenewing + peak.requiresDecision} contracts reach their term
          end in {peak.year}, the largest cluster. Notice periods are declared
          per contract and are short, so the work on a year starts before its
          earliest notice window closes.
        </p>
      </div>
    </section>
  );
}
