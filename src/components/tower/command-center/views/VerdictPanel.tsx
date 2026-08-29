"use client";

/**
 * The Verdict panel of the redesigned Tower Command Center.
 *
 * Transcribed from the approved design (`Tower Command Center.dc.html`). Two deliberate
 * departures from that file, both in the same direction:
 *
 * 1. **Every figure binds to the view model.** The design carries literals ($1.05B, $211.8M,
 *    $13.1M) as its sample values. Rendering those in the product would ship a page that reads
 *    correctly and means nothing, which is the failure this surface exists to prevent.
 * 2. **Absent values render as gaps, not zeros.** A null budget is "not loaded", never "$0".
 *
 * The design's own three rules govern the copy here and are stated on the panel itself: nothing is
 * claimable until Finance validates actuals; foundation rows carry no direct value; AI status comes
 * from classification, not a label.
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

const AMBER = "#ba7517";
const AMBER_LIGHT = "#e8c98f";
const TEAL = "#0f6e56";
const GREY = "#b4b2a9";

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

const TIP = {
  fontFamily: "var(--abarva-sans)",
  fontSize: 13,
  border: "1px solid var(--canon-border)",
  borderRadius: 0,
  background: "#fff",
} as const;

type BarDatum = {
  readonly name: string;
  readonly value: number;
  readonly label: string;
  readonly fill: string;
};

const M = (usd: number): number => usd / 1_000_000;

/** "$677.8M" / "$1.05B" — the design's own two money formats. */
function money(valueM: number): string {
  return `$${valueM.toFixed(1)}M`;
}

function bigMoney(usd: number | null): string {
  if (usd === null) return "Not loaded";
  const m = M(usd);
  return m >= 1000 ? `$${(m / 1000).toFixed(2)}B` : `$${m.toFixed(1)}M`;
}

function HBar({
  data,
  axisLabel,
  height,
  labelWidth,
  right = 62,
  axisFmt,
}: {
  data: readonly BarDatum[];
  axisLabel: string;
  height: number;
  labelWidth: number;
  right?: number;
  axisFmt: (value: number) => string;
}) {
  return (
    <div style={{ height: height + 26, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data as BarDatum[]}
          layout="vertical"
          margin={{ top: 4, right, left: 0, bottom: 26 }}
        >
          <CartesianGrid horizontal={false} stroke="rgba(10,10,11,0.10)" />
          <XAxis
            type="number"
            tick={MONO}
            axisLine={false}
            tickLine={false}
            tickFormatter={axisFmt}
            label={{
              value: axisLabel,
              position: "insideBottom",
              offset: -18,
              style: AXIS_TITLE,
            }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={labelWidth}
            tick={CAT}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(10,10,11,0.05)" }}
            contentStyle={TIP}
            labelStyle={{ fontWeight: 600 }}
            formatter={(v) => [axisFmt(Number(v)), ""] as [string, string]}
          />
          <Bar dataKey="value" isAnimationActive={false} barSize={16}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.fill} />
            ))}
            <LabelList dataKey="label" position="right" style={LABEL} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const CARD: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  outline: "1px solid var(--canon-border)",
  padding: "22px 24px",
};

const CAPTION: React.CSSProperties = {
  fontFamily: "var(--abarva-mono)",
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--canon-gray-500)",
  marginTop: 10,
};

const FIGURE: React.CSSProperties = {
  fontFamily: "var(--abarva-serif)",
  fontSize: 34,
  letterSpacing: "-0.024em",
  marginTop: 6,
};

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

function MetricCard({
  label,
  value,
  caption,
  accent,
  valueColor,
}: {
  label: string;
  value: string;
  caption: string;
  accent?: string;
  valueColor?: string;
}) {
  return (
    <div style={accent ? { ...CARD, borderTop: `3px solid ${accent}` } : CARD}>
      <div style={{ fontSize: 14, color: "var(--canon-gray-500)" }}>{label}</div>
      <div style={valueColor ? { ...FIGURE, color: valueColor } : FIGURE}>
        {value}
      </div>
      <div style={CAPTION}>{caption}</div>
    </div>
  );
}

const RULES: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Nothing is claimable until Finance validates actuals",
    body: "A sponsor claim and a CFO target are both projections. Only a validation event moves value into the board number.",
  },
  {
    title: "Foundation rows carry no direct value",
    body: "Their $0 is a recorded fact, not missing data. They earn value only through the funded cases they carry.",
  },
  {
    title: "AI status comes from classification, not a label",
    body: "A tool being AI-branded does not put its spend in this portfolio. The classification field does.",
  },
];

export function VerdictPanel({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;

  const asserted = M(s.promisedUsd);
  const claimable = M(s.claimableUsd);

  // Cases that have reached Finance validation, and the asserted value sitting on them. This is
  // not the same as `financeValidatedUsd`: the design's middle bar is how much *asserted* value is
  // attached to a validated case, which is a larger and more useful number than the validated
  // amount itself. Both come from `financeStatus`, so when no case carries one the bar is absent
  // rather than silently equal to the claimable figure below it.
  const cases = view.allInitiatives.filter((i) => i.financeStatus !== null);
  const validatedCases = cases.filter(
    (i) => i.financeStatus === "finance_validated_actual",
  );
  const assertedOnValidated =
    cases.length === 0
      ? null
      : M(validatedCases.reduce((sum, i) => sum + i.promisedUsd, 0));

  const gate: readonly BarDatum[] = [
    { name: "Asserted", value: asserted, label: money(asserted), fill: AMBER },
    {
      name: "On a validated case",
      value: assertedOnValidated ?? 0,
      label: assertedOnValidated === null ? "Not recorded" : money(assertedOnValidated),
      fill: assertedOnValidated === null ? GREY : AMBER_LIGHT,
    },
    {
      name: "Board claimable",
      value: claimable,
      label: money(claimable),
      fill: TEAL,
    },
  ];

  // Business cases only. `allInitiatives` also carries tool rollouts, and counting both conflates
  // two populations — 55 rows where the portfolio has 42 cases. Only a case has a finance status,
  // so filtering on it is also what separates them.
  const byStatus = new Map<string, number>();
  for (const item of cases) {
    const key = item.financeStatus ?? "not_submitted";
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }
  const statusData: readonly BarDatum[] = (
    [
      ["sponsor_claimed", "Sponsor claimed", AMBER],
      ["finance_challenged", "Challenged", "#a32d2d"],
      ["cfo_approved_target", "CFO target", AMBER],
      ["not_submitted", "Not submitted", "#5f5e5a"],
      ["finance_validated_actual", "Validated", TEAL],
    ] as const
  ).map(([key, name, fill]) => {
    const count = byStatus.get(key) ?? 0;
    return { name, value: count, label: String(count), fill };
  });

  const claimablePctOfAsserted =
    s.promisedUsd > 0 ? (s.claimableUsd / s.promisedUsd) * 100 : null;

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
        {s.claimableUsd > 0
          ? `${bigMoney(s.claimableUsd)} of ${bigMoney(s.promisedUsd)} asserted value clears the board.`
          : "No asserted value clears the board today."}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 1,
        }}
      >
        <MetricCard
          label="Total IT budget"
          value={bigMoney(s.budgetUsd)}
          caption="IT Finance · annual · sums"
        />
        <MetricCard
          label="AI-related investment"
          // One metric, declared. This read `aiAttributedInitiativeSpendUsd || aiTaggedUsd`,
          // carried over from the panel it replaces — but those are different measures, and the
          // `||` fires on a legitimate 0, hiding "no AI spend attributed" behind a tagged total.
          value={bigMoney(s.aiAttributedInitiativeSpendUsd)}
          caption="IT Finance · annual · by classification"
        />
        <MetricCard
          label="Asserted annual value"
          value={bigMoney(s.promisedUsd)}
          caption="Business sponsor · annual · sums"
          accent="var(--canon-amber)"
          valueColor="var(--canon-amber)"
        />
        <MetricCard
          label="Board claimable YTD"
          value={bigMoney(s.claimableUsd)}
          caption="Finance · additive by month only"
          accent="var(--canon-teal)"
          valueColor="var(--canon-teal-dark)"
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 520px" }}>
          <h3 style={{ margin: "0 0 22px", fontSize: 15, fontWeight: 600 }}>
            Asserted value, and what survives each gate
          </h3>
          <HBar
            data={gate}
            axisLabel="Annual value"
            height={190}
            labelWidth={168}
            axisFmt={money}
          />
          <p style={NOTE}>
            {claimablePctOfAsserted === null
              ? "No asserted value is recorded, so no share of it can be claimable."
              : `${claimablePctOfAsserted.toFixed(1)}% of asserted value is claimable. The portfolio ROI band is a projection, not a result.`}
          </p>
        </div>

        <div style={{ ...PANEL, flex: "1 1 340px" }}>
          <h3 style={{ margin: "0 0 22px", fontSize: 15, fontWeight: 600 }}>
            Where the {cases.length} cases stand
          </h3>
          <HBar
            data={statusData}
            axisLabel="Business cases"
            height={210}
            labelWidth={140}
            right={40}
            axisFmt={(v) => String(v)}
          />
          <p style={{ ...NOTE, margin: "14px 0 0" }}>
            {cases.length === 0
              ? "No case carries a finance status in this read, so there is nothing to place in the pipeline. This is a gap in the projection, not a portfolio without cases."
              : null}{" "}
            Validation and value are not the same gate: a case can be Finance
            validated and still assert nothing, because foundations carry no
            direct value.
          </p>
        </div>
      </div>

      <div style={PANEL}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>
          The three rules behind every number on this page
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 1,
          }}
        >
          {RULES.map((rule) => (
            <div
              key={rule.title}
              style={{
                background: "var(--canon-bg-surface)",
                outline: "1px solid var(--canon-border)",
                padding: "18px 20px",
              }}
            >
              <div
                style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}
              >
                {rule.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "var(--canon-gray-500)",
                }}
              >
                {rule.body}
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            margin: "18px 0 0",
            paddingTop: 16,
            borderTop: "1px solid var(--canon-border)",
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--canon-gray-500)",
          }}
        >
          Budgets and projected value are annual and sum. Claimed, reviewed,
          validated and claimable value are monthly and aggregate by month only
          — never across cadences. ROI multiples and readiness scores are
          ratios: they average, they never sum.
        </p>
      </div>
    </section>
  );
}
