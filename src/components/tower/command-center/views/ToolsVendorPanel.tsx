"use client";

/**
 * Tools -> vendor.
 *
 * The approved design says "licensed users by vendor"; this view carries active usage, not license
 * entitlements, so the panel groups loaded active-user evidence and says so in the reader's own
 * words rather than naming an internal type.
 *
 * `none` is a value the source asserts for `control_blocker`, so a truthy check counted a cleared
 * rollout as blocked. The count now asks whether a blocker was actually named.
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
import { formatCount } from "@/lib/tower/command-center/format";

type VendorRow = {
  readonly vendor: string;
  readonly activeUsers: number | null;
  readonly blockerCount: number;
  readonly toolCount: number;
};

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

function activeUsers(item: TowerAiView): number | null {
  const usage = item.usageBars.find((bar) => bar.label !== "Adoption");
  if (!usage) return null;
  const parsed = Number(usage.valueText.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildToolVendorRows(view: TowerCommandCenterView): readonly VendorRow[] {
  const map = new Map<string, VendorRow>();
  for (const item of view.allInitiatives) {
    if (item.usageHeadline === null && item.usageBars.length === 0) continue;
    const vendor = item.vendor ?? "Vendor not loaded";
    const current = map.get(vendor) ?? {
      vendor,
      activeUsers: null,
      blockerCount: 0,
      toolCount: 0,
    };
    const users = activeUsers(item);
    map.set(vendor, {
      vendor,
      activeUsers: users === null ? current.activeUsers : (current.activeUsers ?? 0) + users,
      blockerCount: current.blockerCount + (item.controlBlocker !== null ? 1 : 0),
      toolCount: current.toolCount + 1,
    });
  }
  return [...map.values()].sort((a, b) => (b.activeUsers ?? -1) - (a.activeUsers ?? -1));
}

function VendorChart({ rows }: { rows: readonly VendorRow[] }) {
  const data = rows
    .filter((row) => row.activeUsers !== null)
    .map((row) => ({
      name: row.vendor,
      value: row.activeUsers ?? 0,
      label: formatCount(row.activeUsers),
      fill: "#b4b2a9",
    }));
  if (data.length === 0) return <p style={{ margin: 0 }}>Not loaded</p>;
  // Recharts drops colliding category ticks by default, which left the largest vendor's bar with
  // no label at all. Every tick renders, and the frame grows with the row count to fit them.
  const height = Math.max(300, data.length * 34 + 40);
  return (
    <div style={{ height, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 78, left: 0, bottom: 18 }}>
          <CartesianGrid horizontal={false} stroke="rgba(10,10,11,0.10)" />
          <XAxis type="number" tick={{ fontFamily: "var(--abarva-mono)", fontSize: 11, fill: "#5f5e5a" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={168} interval={0} tick={{ fontFamily: "var(--abarva-sans)", fontSize: 12, fill: "#2c2c2a" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(10,10,11,0.05)" }}
            contentStyle={{ fontFamily: "var(--abarva-sans)", fontSize: 13, border: "1px solid var(--canon-border)", borderRadius: 0, background: "#fff" }}
            formatter={(v) => [formatCount(Number(v)), "active users"] as [string, string]}
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

export function ToolsVendorPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildToolVendorRows(view);
  const blockers = rows.filter((row) => row.blockerCount > 0);
  const totalTools = rows.reduce((sum, row) => sum + row.toolCount, 0);
  const blockedTools = rows.reduce((sum, row) => sum + row.blockerCount, 0);

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
        {rows.length === 0
          ? "No vendor usage is loaded for tool rollouts."
          : `Active tool usage is grouped across ${formatCount(rows.length)} vendors.`}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 440px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            Active users by vendor
          </h3>
          <VendorChart rows={rows} />
        </div>
        <div style={{ ...PANEL, flex: "1 1 400px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>
            What is blocking control
          </h3>
          {blockers.length === 0 ? (
            <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
              No named control blockers are loaded. That does not mean the tools are clear.
            </p>
          ) : (
            blockers.map((row) => (
              <div key={row.vendor} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 5 }}>
                  <span style={{ color: "var(--canon-gray-700)" }}>{row.vendor}</span>
                  <span style={{ fontFamily: "var(--abarva-mono)" }}>{formatCount(row.blockerCount)}</span>
                </div>
                <div style={{ height: 12, background: "var(--canon-gray-100)" }}>
                  <div
                    style={{
                      display: "block",
                      height: 12,
                      width: `${Math.max(4, (row.blockerCount / Math.max(blockedTools, 1)) * 100)}%`,
                      background: "var(--canon-red)",
                    }}
                  />
                </div>
              </div>
            ))
          )}
          <p style={{ margin: "16px 0 0", paddingTop: 16, borderTop: "1px solid var(--canon-border)", fontSize: 15, lineHeight: 1.6, color: "var(--canon-gray-700)" }}>
            {blockedTools > 0
              ? `${formatCount(blockedTools)} of ${formatCount(totalTools)} rollouts carry a named control blocker.`
              : "Control blockers are not loaded for the vendor usage rows."}
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        Seats purchased are not loaded, so this counts people actually using each vendor&rsquo;s tools
        — not what the contract entitles you to.
      </p>
    </section>
  );
}
