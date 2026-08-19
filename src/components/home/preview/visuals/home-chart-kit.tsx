"use client";

// Home preview — shared chart plumbing, styled to the locked AbarVa design system (white
// surface, Fraunces display, Inter body, navy #1B2B5C primary — see src/app/globals.css), not
// Tower's separate teal/cream canon. Recharts cannot resolve CSS custom properties inside SVG
// paint attributes, so every chart colour here is a literal hex kept in sync with those tokens by
// hand (same constraint chart-kit.tsx documents for Tower's own charts).

import type { ReactNode } from "react";
import { Tooltip } from "recharts";

/** Literal hex mirrors of the design tokens in src/app/globals.css. */
export const HOME_HEX = {
  navy: "#1B2B5C",
  navyDim: "rgba(27, 43, 92, 0.12)",
  teal: "#0E8A65",
  tealDim: "rgba(14, 138, 101, 0.12)",
  amber: "#f59e0b",
  red: "#ef4444",
  indigo: "#818cf8",
  textPrimary: "#0A0C12",
  textSecondary: "#1F2433",
  textMuted: "#3D4454",
  textDisabled: "#9CA3AF",
  border: "#E5E7EB",
} as const;

/** A short qualitative series for multi-category charts (donut segments, grouped bars) --
 * ordered so the first, most-visually-dominant slot is the navy primary. */
export const HOME_SERIES = [HOME_HEX.navy, HOME_HEX.teal, HOME_HEX.amber, HOME_HEX.indigo, HOME_HEX.red] as const;

export function formatCompactUsd(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

/** Shared tooltip styling, matching the app's body/mono font stack. */
export function HomeChartTooltip({ formatter }: { formatter?: (value: number, name: string) => [string, string] }) {
  return (
    <Tooltip
      cursor={{ fill: HOME_HEX.navyDim }}
      formatter={formatter as never}
      contentStyle={{
        background: "#FFFFFF",
        border: `1px solid ${HOME_HEX.border}`,
        borderRadius: 8,
        boxShadow: "0 4px 16px rgba(10, 12, 18, 0.08)",
        fontFamily: "var(--font-body-sans)",
        fontSize: 12.5,
        padding: "8px 12px",
      }}
      labelStyle={{ color: HOME_HEX.textPrimary, fontWeight: 600, marginBottom: 4 }}
      itemStyle={{ color: HOME_HEX.textSecondary }}
    />
  );
}

/** A visual card frame every chart renders inside -- title, purpose, and the chart itself, with
 * priority nudging the border toward the primary accent so a "high" exhibit reads as the featured
 * one without needing a second visual language for emphasis. */
export function VisualCard({
  title,
  purpose,
  priority,
  children,
}: {
  title: string;
  purpose: string;
  priority: "high" | "medium" | "low";
  children: ReactNode;
}) {
  return (
    <figure
      style={{
        margin: 0,
        padding: "18px 20px 16px",
        borderRadius: 10,
        border: `1px solid ${priority === "high" ? HOME_HEX.navy : HOME_HEX.border}`,
        background: "#FFFFFF",
      }}
    >
      <figcaption style={{ marginBottom: 14 }}>
        <div
          style={{
            fontFamily: "var(--font-body-serif)",
            fontSize: 15,
            fontWeight: 600,
            color: HOME_HEX.textPrimary,
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div style={{ fontFamily: "var(--font-body-sans)", fontSize: 12.5, color: HOME_HEX.textMuted, marginTop: 3 }}>
          {purpose}
        </div>
      </figcaption>
      {children}
    </figure>
  );
}
