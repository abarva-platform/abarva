"use client";

// Tower Command Center v2 — shared chart plumbing.
//
// Recharts notes for this build (design targets 2.12.7; repo ships 3.8.1):
//
//  · `<Scatter onClick>` no longer hands back the datum with its own fields
//    spread onto the argument. On v3 the click argument is a `ScatterPointItem`
//    (cx/cy/x/y/size/node/payload) and the datum lives under `.payload`.
//    `scatterDatum()` below reads either shape so the handler cannot silently
//    receive `undefined` — the exact regression the design's
//    `onClick:(pt)=>this.progDrawer(pt.id)` would have produced.
//  · `tick` still accepts a render function ((props) => ReactNode), so the
//    design's two-line axis tick ports directly.
//  · `<LabelList>` nested inside `<Scatter>` still renders, so the bubble
//    numerals stay inside their circles.
//  · A transparent first segment on a shared `stackId` still floats the second
//    segment, so the waterfall keeps its floating bars.
//
// Recharts cannot resolve CSS custom properties inside SVG paint attributes, so
// every chart colour here is a literal hex that matches the canon token it
// stands for. Keep the two in sync.

import type { ReactNode } from "react";
import { Tooltip } from "recharts";
import type { XAxisTickContentProps } from "recharts";

/** Canon token values, duplicated as literals for SVG paint. */
export const HEX = {
  teal: "#1d9e75",
  tealDark: "#0f6e56",
  amber: "#ba7517",
  red: "#a32d2d",
  gray900: "#2c2c2a",
  gray700: "#444441",
  gray500: "#5f5e5a",
  gray300: "#b4b2a9",
  border: "rgba(10, 10, 11, 0.12)",
  borderStrong: "rgba(10, 10, 11, 0.24)",
  signalBlue: "#0066CC",
} as const;

/**
 * Read the original datum out of a Recharts v3 scatter click argument.
 *
 * v3 passes `{ ...pointGeometry, payload: datum }`; v2 spread the datum itself.
 * Accept both so a future Recharts bump cannot quietly break drawer opening.
 */
export function scatterDatum<T>(arg: unknown): T | null {
  if (!arg || typeof arg !== "object") return null;
  const withPayload = arg as { payload?: unknown };
  if (withPayload.payload && typeof withPayload.payload === "object") {
    return withPayload.payload as T;
  }
  return arg as T;
}

/**
 * The design's two-line axis tick: a `<text>` whose label splits on `|` into
 * stacked `<tspan>`s. Used by the waterfall so "No finance|sign-off" wraps
 * without an ellipsis.
 */
export function twoLineTick(props: XAxisTickContentProps): ReactNode {
  const { x, y, payload } = props;
  // v3 types x/y as `number | string`; the renderer always passes numbers.
  const px = typeof x === "number" ? x : Number(x) || 0;
  const py = typeof y === "number" ? y : Number(y) || 0;
  const parts = String(payload?.value ?? "").split("|");
  return (
    <text
      x={px}
      y={py + 11}
      textAnchor="middle"
      fontFamily="var(--abarva-mono)"
      fontSize={9.5}
      fill={HEX.gray500}
    >
      {parts.map((part, i) => (
        <tspan key={i} x={px} dy={i === 0 ? 0 : 11}>
          {part}
        </tspan>
      ))}
    </text>
  );
}

/** The design's shared tooltip styling. */
export function ChartTooltip({
  formatter,
}: {
  formatter?: (value: number | string) => string;
}) {
  return (
    <Tooltip
      cursor={{ fill: "rgba(0,0,0,0.03)" }}
      formatter={formatter as never}
      contentStyle={{
        fontFamily: "var(--abarva-sans)",
        fontSize: 12,
        border: `1px solid ${HEX.borderStrong}`,
        borderRadius: 8,
        boxShadow: "var(--shadow-pop)",
        padding: "8px 11px",
      }}
      labelStyle={{
        fontFamily: "var(--abarva-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        color: HEX.gray500,
        marginBottom: 4,
      }}
    />
  );
}

/**
 * Minimum visible bar height, as a fraction of the axis maximum.
 *
 * The design deliberately renders a hairline for a genuinely-zero stage (its
 * `claimable` bar is coded `v:0.06` against a 35.5 domain) so the row does not
 * vanish from the chart entirely. The *label* on that bar always shows the true
 * formatted value — "$0" reads as "$0". Keep both halves of that: the sliver is
 * a layout affordance, never a claim.
 */
export const ZERO_SLIVER_FRACTION = 0.0017;

export function withSliver(value: number, axisMax: number): number {
  if (value > 0) return value;
  if (axisMax <= 0) return 0;
  return axisMax * ZERO_SLIVER_FRACTION;
}

/** USD → the millions number the charts plot on. */
export function toM(usd: number): number {
  return Number.isFinite(usd) ? usd / 1_000_000 : 0;
}
