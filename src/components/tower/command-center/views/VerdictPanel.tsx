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
import { approvedAiCaseFunding, isBusinessCase } from "./portfolio-kind";
import { sourceSpendDate, syntheticProjectSpendYtd } from "./synthetic-project-spend";

const AMBER = "#ba7517";
const AMBER_LIGHT = "#e8c98f";
const TEAL = "#0f6e56";

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
    title: "Report a benefit only after Finance checks the result",
    body: "A sponsor estimate and a CFO target are plans. Finance must check a recorded result before it can be reported as an achieved benefit.",
  },
  {
    title: "Foundations need a linked value case",
    body: "Do not count an enabler as a direct benefit. Where its value is not loaded, keep it unknown rather than treating it as $0.",
  },
  {
    title: "AI status comes from classification, not a label",
    body: "A tool's name alone does not make its funding part of the AI total. It must be recorded as AI funding.",
  },
];

export function VerdictPanel({ view }: { view: TowerCommandCenterView }) {
  const s = view.summary;
  const caseFunding = approvedAiCaseFunding(view.allInitiatives);

  const hasAssertion = s.promisedBenefitLoaded;
  const asserted = M(s.promisedUsd);

  // Cases that have reached Finance validation, and the asserted value sitting on them. This is
  // not the same as `financeValidatedUsd`: the design's middle bar is how much *asserted* value is
  // attached to a validated case, which is a larger and more useful number than the validated
  // amount itself. Both come from `financeStatus`, so when no case carries one the bar is absent
  // rather than silently equal to the claimable figure below it.
  // Case population comes from declared page and canonical object identity. Finance status may
  // still be absent; a missing status is its own unknown bucket, never a submitted/not-submitted inference.
  const cases = view.allInitiatives.filter(isBusinessCase);
  const casesMissingFinanceStatus = cases.filter((item) => item.financeStatus === null).length;
  const clearedValueStory = s.claimableAmountLoaded === true
    ? `${bigMoney(s.claimableUsd)} is cleared for reporting across loaded benefit claims.`
    : "A cleared value amount is not verified for the loaded months.";
  const verdictStory = casesMissingFinanceStatus > 0
    ? `Review Finance status for ${casesMissingFinanceStatus} of ${cases.length} AI use cases before reporting case benefits; their status is not loaded. ${caseFunding === null ? "Approved AI case funding is not verified." : `${bigMoney(caseFunding)} in approved AI case funding is recorded.`} ${hasAssertion ? `The loaded benefit claims project ${bigMoney(s.promisedUsd)} a year; their relationship to the AI cases is not reconciled here.` : "No yearly benefit estimate is loaded."} ${clearedValueStory}`
    : hasAssertion
      ? `The loaded claims project ${bigMoney(s.promisedUsd)} a year. ${s.claimableAmountLoaded === true ? `${bigMoney(s.claimableUsd)} has cleared the reporting gate in the loaded months.` : "A cleared amount is not verified for the loaded months."}`
      : "No yearly benefit estimate is loaded, so its value remains unknown.";
  const validatedCases = cases.filter(
    (i) => i.financeStatus === "finance_validated_actual",
  );
  const validatedCasesWithPositiveAmount = validatedCases.filter(
    (i) => i.financeValidatedUsd > 0,
  ).length;
  const validatedCasesWithEstimate = validatedCases.filter((i) => i.promisedBenefitLoaded);
  const assertedOnValidated =
    validatedCases.length === 0 || validatedCasesWithEstimate.length !== validatedCases.length
      ? null
      : M(validatedCases.reduce((sum, i) => sum + i.promisedUsd, 0));

  const gate: readonly BarDatum[] = [
    { name: "Yearly estimate", value: asserted, label: money(asserted), fill: AMBER },
    ...(assertedOnValidated === null ? [] : [{
      name: "Estimate on Finance-reviewed cases",
      value: assertedOnValidated,
      label: money(assertedOnValidated),
      fill: AMBER_LIGHT,
    }]),
  ];

  // Keep the case denominator even when Finance status was not loaded.
  const byStatus = new Map<string, number>();
  for (const item of cases) {
    const key = item.financeStatus ?? "not_recorded";
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }
  const statusData: readonly BarDatum[] = (
    [
      ["sponsor_claimed", "Sponsor claimed", AMBER],
      ["finance_challenged", "Challenged", "#a32d2d"],
      ["cfo_approved_target", "CFO target", AMBER],
      ["not_submitted", "Not submitted", "#5f5e5a"],
      ["not_recorded", "Status not loaded", "#898780"],
      ["finance_validated_actual", "Validated", TEAL],
    ] as const
  ).map(([key, name, fill]) => {
    const count = byStatus.get(key) ?? 0;
    return { name, value: count, label: String(count), fill };
  });

  const sourcePlanCases = cases.filter((item) => item.sourcePlan !== null && item.sourcePlan !== undefined);
  if (sourcePlanCases.length > 0) {
    const projectSpend = syntheticProjectSpendYtd(view);
    const toolCount = view.allInitiatives.filter((item) => item.populationKind === "tool_rollout").length;
    const fundingPlans = sourcePlanCases.filter((item) => item.sourcePlan?.fundingUsd !== null).length;
    const benefitPlans = sourcePlanCases.filter((item) => item.sourcePlan?.yearlyBenefitLowUsd !== null).length;
    const roiPlans = sourcePlanCases.filter((item) => item.sourcePlan?.roiLowMultiple !== null).length;
    const leadingPlans = sourcePlanCases
      .filter((item) => (item.sourcePlan?.fundingUsd ?? 0) > 0)
      .sort((a, b) => (b.sourcePlan?.fundingUsd ?? 0) - (a.sourcePlan?.fundingUsd ?? 0))
      .slice(0, 5);
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26, lineHeight: 1.25 }}>
          Follow the AI plan from funding to use to results. This synthetic assessment maps {cases.length} AI cases and {toolCount} tool rollouts; the planned return still needs measured outcomes and Finance review.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1 }}>
          <MetricCard label="AI business cases" value={String(cases.length)} caption="Each case has a named plan and owner" />
          <MetricCard label="AI tool rollouts" value={String(toolCount)} caption="Usage and adoption are checked separately from case value" />
          <MetricCard label="Cases with a funding plan" value={`${fundingPlans} of ${cases.length}`} caption="Source-stated synthetic plans; approved funding is not established" accent="var(--canon-amber)" />
          <MetricCard label="Cases with an ROI estimate" value={`${roiPlans} of ${cases.length}`} caption="Projected return, not savings earned" accent="var(--canon-teal)" />
          {projectSpend ? <MetricCard label="AI project spending in FY26 source" value={bigMoney(projectSpend.amountUsd)} caption={`Synthetic project portfolio source · through ${sourceSpendDate(projectSpend.asOfDate)} · ${projectSpend.projectCount} distinct projects; not tool bills or cleared value`} accent="var(--canon-teal)" /> : null}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          <div style={{ ...PANEL, flex: "1 1 560px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Five largest case funding plans</h3>
            <p style={{ margin: "0 0 18px", fontSize: 14, lineHeight: 1.5, color: "var(--canon-gray-700)" }}>
              Each amount belongs to one synthetic business case. These rows are not an approved portfolio total or money already spent.
            </p>
            {leadingPlans.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, padding: "12px 0", borderTop: "1px solid var(--canon-border)" }}>
                <div>
                  <strong style={{ fontSize: 15 }}>{item.name}</strong>
                  <div style={{ marginTop: 4, fontSize: 13, color: "var(--canon-gray-500)" }}>
                    {item.sourcePlan?.yearlyBenefitLowUsd === null
                      ? "Yearly benefit estimate not stated"
                      : `Yearly benefit plan ${bigMoney(item.sourcePlan?.yearlyBenefitLowUsd ?? null)}`}
                    {item.sourcePlan?.roiLowMultiple !== null && item.sourcePlan?.roiLowMultiple !== undefined
                      ? ` · projected ROI ${item.sourcePlan.roiLowMultiple.toFixed(1)}x${item.sourcePlan.roiHighMultiple !== null ? `–${item.sourcePlan.roiHighMultiple.toFixed(1)}x` : ""}`
                      : ""}
                  </div>
                </div>
                <strong style={{ fontFamily: "var(--abarva-mono)", whiteSpace: "nowrap" }}>{bigMoney(item.sourcePlan?.fundingUsd ?? null)}</strong>
              </div>
            ))}
          </div>
          <div style={{ ...PANEL, flex: "1 1 340px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Finance stage stated in the synthetic source</h3>
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--canon-gray-700)" }}>
              The status describes a demo case&apos;s review stage. It is not independent CFO sign-off or a cleared dollar result.
            </p>
            <HBar data={statusData} axisLabel="AI use cases" height={210} labelWidth={140} right={40} axisFmt={(v) => String(v)} />
          </div>
        </div>
        <p style={{ ...NOTE, margin: 0 }}>
          {benefitPlans} cases carry a yearly benefit plan. Compare each plan with tool use, an outcome reading, and Finance-reviewed results before deciding to scale, fix, or stop it. No combined benefit or achieved ROI is quoted here.
        </p>
      </section>
    );
  }

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
        {verdictStory}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 1,
        }}
      >
        <MetricCard
          label={s.budgetUsd !== null ? "Approved FY26 IT budget" :
            s.syntheticDemoBudgetUsd !== null && s.syntheticDemoBudgetUsd !== undefined ? "FY26 synthetic demo budget" : "Approved FY26 IT budget"}
          value={s.budgetUsd !== null ? bigMoney(s.budgetUsd) :
            s.syntheticDemoBudgetUsd !== null && s.syntheticDemoBudgetUsd !== undefined ? bigMoney(s.syntheticDemoBudgetUsd) : "Not verified"}
          caption={s.budgetUsd !== null ? "Approved FY26 amount; modeled annual spend is separate" :
            s.syntheticDemoBudgetUsd !== null && s.syntheticDemoBudgetUsd !== undefined ?
            "Selected synthetic Finance source; independent Finance sign-off is not recorded. The annual spend scenario is separate." :
            "A source-approved FY26 budget is not recorded"}
        />
        <MetricCard
          label="Approved FY26 AI project funding"
          value={caseFunding === null ? "Not verified" : bigMoney(caseFunding)}
          caption="Requires a source-approved FY26 amount for every case; tool costs are separate"
        />
        <MetricCard
          label="Projected yearly benefit"
          value={hasAssertion ? bigMoney(s.promisedUsd) : "Not loaded"}
          caption="Planning estimates, not proven savings; source files still need checking"
          accent="var(--canon-amber)"
          valueColor="var(--canon-amber)"
        />
        <MetricCard
          label="Cleared value in loaded months"
          value={s.claimableAmountLoaded === true ? bigMoney(s.claimableUsd) : "Not verified"}
          caption="Requires Finance validation and approved evidence for the loaded period"
          accent="var(--canon-teal)"
          valueColor="var(--canon-teal-dark)"
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        <div style={{ ...PANEL, flex: "1 1 520px" }}>
          <h3 style={{ margin: "0 0 22px", fontSize: 15, fontWeight: 600 }}>
            Yearly estimates in benefit claims and Finance-reviewed AI cases
          </h3>
          {hasAssertion ? (
            <>
              <HBar
                data={gate}
                axisLabel="Projected yearly benefit"
                height={190}
                labelWidth={168}
                axisFmt={money}
              />
              {assertedOnValidated === null ? (
                <p>No complete yearly estimate is loaded for Finance-validated AI cases, so that comparison is withheld.</p>
              ) : null}
            </>
          ) : (
            <p>No yearly case-benefit amounts are loaded for this comparison. Separate outcome-measure records may still be present in Tower.</p>
          )}
          <p style={NOTE}>
            {hasAssertion
              ? `The first bar covers loaded benefit claims. ${assertedOnValidated === null ? "The Finance-validated case comparison is not available." : "The second bar covers AI cases with a Finance validation status."} Their crosswalk is not established here. The cleared amount covers loaded months, so it cannot be divided by yearly estimates to show a success rate.`
              : "No yearly benefit estimate is loaded, so there is no estimate to compare with Finance review."}
          </p>
          {validatedCases.length > 0 ? (
            <p style={{ ...NOTE, marginTop: 12, paddingTop: 12 }}>
              {validatedCases.length} cases are marked Finance validated, but only {validatedCasesWithPositiveAmount} show a positive Finance-validated amount here. The bars above still show yearly estimates, not those validated dollars.
            </p>
          ) : null}
        </div>

        <div style={{ ...PANEL, flex: "1 1 340px" }}>
          <h3 style={{ margin: "0 0 22px", fontSize: 15, fontWeight: 600 }}>
            Where {cases.length} AI use case{cases.length === 1 ? "" : "s"} {cases.length === 1 ? "stands" : "stand"}
          </h3>
          <HBar
            data={statusData}
            axisLabel="AI use cases"
            height={210}
            labelWidth={140}
            right={40}
            axisFmt={(v) => String(v)}
          />
          <p style={{ ...NOTE, margin: "14px 0 0" }}>
            {cases.length === 0
              ? "No classified AI use cases are loaded for this pipeline."
              : `${casesMissingFinanceStatus} of ${cases.length} AI use case${cases.length === 1 ? "" : "s"} ${cases.length === 1 ? "has" : "have"} no Finance status loaded.`}{" "}
            Validation and value are not the same gate: a case can be Finance
            validated and still assert no direct benefit. An enabler with no
            loaded value remains unknown.
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
          Funding covers the fiscal year. Benefit estimates describe a year,
          while Finance results cover only the months loaded here. Do not add
          these different amounts or divide one by another to claim a success
          rate. Readiness scores describe progress, not dollars.
        </p>
      </div>
    </section>
  );
}
