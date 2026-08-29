"use client";

/**
 * Initiatives → constraint. The panel the attribute widening existed for.
 *
 * The design's finding is that gating constraint and finance status are the same field twice:
 * every case blocked on one constraint reaches exactly one status, so every bar is a single
 * colour, and the constraint does not predict the outcome — it *is* the outcome, relabelled.
 *
 * That is a claim about the data, so this panel **derives** it rather than asserting it. The
 * design hardcodes a constraint→status map; here each constraint's statuses are computed, and the
 * narrative only makes the strong claim when every constraint really does resolve to one status.
 * If a constraint spans several, the panel says that instead — a finding that stops being true is
 * worse than one that was never claimed.
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

import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";

const STATUS_LABEL: Record<string, string> = {
  sponsor_claimed: "Sponsor claimed",
  finance_challenged: "Challenged",
  cfo_approved_target: "CFO target",
  not_submitted: "Not submitted",
  finance_validated_actual: "Validated",
};

const STATUS_FILL: Record<string, string> = {
  sponsor_claimed: "#ba7517",
  finance_challenged: "#a32d2d",
  cfo_approved_target: "#ba7517",
  not_submitted: "#5f5e5a",
  finance_validated_actual: "#0f6e56",
};

const MIXED_FILL = "#b4b2a9";

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

const AXIS_TITLE = {
  fontFamily: "var(--abarva-mono)",
  fontSize: 10,
  letterSpacing: "0.1em",
  fill: "#5f5e5a",
  textTransform: "uppercase",
} as const;

const LABEL = {
  fontFamily: "var(--abarva-mono)",
  fontSize: 11,
  fill: "#2c2c2a",
} as const;

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

const NOTE: React.CSSProperties = {
  margin: "22px 0 0",
  paddingTop: 16,
  borderTop: "1px solid var(--canon-border)",
  fontSize: 15,
  lineHeight: 1.6,
  color: "var(--canon-gray-700)",
};

type ConstraintRow = {
  readonly name: string;
  readonly value: number;
  readonly label: string;
  readonly fill: string;
  /** Distinct finance statuses the cases under this constraint reached. */
  readonly statuses: readonly string[];
};

function statusName(key: string): string {
  return STATUS_LABEL[key] ?? key.replace(/_/g, " ");
}

export function buildConstraintRows(
  view: TowerCommandCenterView,
): readonly ConstraintRow[] {
  const byConstraint = new Map<string, string[]>();
  for (const item of view.allInitiatives) {
    const constraint = item.gatingConstraint;
    if (!constraint) continue;
    const list = byConstraint.get(constraint) ?? [];
    list.push(item.financeStatus ?? "not_submitted");
    byConstraint.set(constraint, list);
  }

  return [...byConstraint.entries()]
    .map(([name, statuses]) => {
      const distinct = [...new Set(statuses)].sort();
      const single = distinct.length === 1 ? distinct[0] : null;
      return {
        name,
        value: statuses.length,
        label: single
          ? `${statuses.length} → ${statusName(single)}`
          : `${statuses.length} → ${distinct.length} outcomes`,
        fill: single ? (STATUS_FILL[single] ?? MIXED_FILL) : MIXED_FILL,
        statuses: distinct,
      };
    })
    .sort((a, b) => b.value - a.value);
}

export function ConstraintPanel({ view }: { view: TowerCommandCenterView }) {
  const rows = buildConstraintRows(view);

  if (rows.length === 0) {
    return (
      <section style={PANEL}>
        <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600 }}>
          Cases by gating constraint
        </h3>
        <p style={{ margin: 0, fontSize: 15, color: "var(--canon-gray-700)" }}>
          No case carries a gating constraint in this read, so there is nothing
          to group. This is a gap in the projection, not a portfolio without
          blockers.
        </p>
      </section>
    );
  }

  const total = rows.reduce((sum, r) => sum + r.value, 0);
  const everyConstraintIsOneOutcome = rows.every(
    (r) => r.statuses.length === 1,
  );
  const validated = rows.filter(
    (r) => r.statuses.length === 1 && r.statuses[0] === "finance_validated_actual",
  );

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
          color: "var(--abarva-ink-black)",
        }}
      >
        {total} cases sit behind {rows.length}{" "}
        {rows.length === 1 ? "constraint" : "constraints"}.
      </h2>

      <div style={PANEL}>
        <h3 style={{ margin: "0 0 22px", fontSize: 15, fontWeight: 600 }}>
          Cases by gating constraint, and where each one ends up
        </h3>

        <div style={{ height: 286, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows as ConstraintRow[]}
              layout="vertical"
              margin={{ top: 4, right: 190, left: 0, bottom: 26 }}
            >
              <CartesianGrid horizontal={false} stroke="rgba(10,10,11,0.10)" />
              <XAxis
                type="number"
                tick={MONO}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => String(v)}
                label={{
                  value: "Business cases",
                  position: "insideBottom",
                  offset: -18,
                  style: AXIS_TITLE,
                }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={210}
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
                labelStyle={{ fontWeight: 600 }}
                formatter={(v) => [String(v), "cases"] as [string, string]}
              />
              <Bar dataKey="value" isAnimationActive={false} barSize={16}>
                {rows.map((r) => (
                  <Cell key={r.name} fill={r.fill} />
                ))}
                <LabelList
                  dataKey="label"
                  position="right"
                  style={LABEL}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p style={NOTE}>
          Each bar is a constraint. The colour is the finance status those cases
          reached.{" "}
          {everyConstraintIsOneOutcome ? (
            <>
              Every bar is a single colour, and that is the finding: gating
              constraint and finance status are the same field twice. The
              constraint does not predict the outcome — it is the outcome,
              relabelled.
            </>
          ) : (
            <>
              {rows.filter((r) => r.statuses.length > 1).length} of{" "}
              {rows.length} constraints span more than one outcome, so the
              constraint carries information the status does not. Read them as
              two fields, not one.
            </>
          )}
        </p>
      </div>

      {validated.length > 0 ? (
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600 }}>
            Which answers the real question
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              lineHeight: 1.6,
              color: "var(--canon-gray-700)",
            }}
          >
            Every validated case sits behind{" "}
            {validated.length === 1 ? (
              <>
                one constraint: <strong>{validated[0].name}</strong>
              </>
            ) : (
              <>
                {validated.length} constraints:{" "}
                <strong>{validated.map((r) => r.name).join(", ")}</strong>
              </>
            )}
            . They did not clear a harder bar than the rest of the portfolio.
            Theirs was the one the reviewer controlled.
          </p>
        </div>
      ) : null}
    </section>
  );
}
