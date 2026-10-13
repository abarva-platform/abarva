"use client";

import type React from "react";
import type { TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { sourceSpendDate, syntheticProjectSpendYtd } from "./synthetic-project-spend";

const PANEL: React.CSSProperties = {
  background: "var(--canon-bg-surface)",
  border: "1px solid var(--canon-border)",
  padding: "24px 26px",
};

export function BudgetShapePanel({ view }: { view: TowerCommandCenterView }) {
  const hasProjectedBudget = view.summary.budgetUsd !== null ||
    view.summary.runUsd !== null || view.summary.changeUsd !== null;
  const hasDemoBudget = view.summary.syntheticDemoBudgetUsd !== null &&
    view.summary.syntheticDemoBudgetUsd !== undefined;
  const demoRun = view.summary.syntheticDemoRunUsd ?? null;
  const demoChange = view.summary.syntheticDemoChangeUsd ?? null;
  const hasDemoSplit = hasDemoBudget && demoRun !== null && demoChange !== null &&
    demoRun + demoChange === view.summary.syntheticDemoBudgetUsd;
  const money = (value: number) => new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
  const sourcePlanCases = view.allInitiatives
    .filter((item) => item.populationKind === "ai_case" && item.sourcePlan?.fundingUsd != null)
    .sort((a, b) => (b.sourcePlan?.fundingUsd ?? 0) - (a.sourcePlan?.fundingUsd ?? 0));

  if (sourcePlanCases.length > 0) {
    const projectSpend = syntheticProjectSpendYtd(view);
    const largest = sourcePlanCases.slice(0, 6);
    const maxFunding = largest[0]?.sourcePlan?.fundingUsd ?? 0;
    return (
      <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
          The synthetic AI plan shows where funding was proposed. These are case estimates, not approved spending or tool bills.
        </h2>
        {projectSpend ? (
          <div style={PANEL}>
            <span style={{ fontSize: 14, color: "var(--canon-gray-500)" }}>AI project spending in the FY26 synthetic source</span>
            <strong style={{ display: "block", marginTop: 8, fontFamily: "var(--abarva-serif)", fontSize: 34 }}>{money(projectSpend.amountUsd)}</strong>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
              Synthetic project portfolio records for {projectSpend.projectCount} distinct FY26 projects through {sourceSpendDate(projectSpend.asOfDate)}. This is spending reported by one source, separate from proposed funding, tool subscriptions, and Finance-cleared benefit.
            </p>
          </div>
        ) : null}
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Largest planned AI cases</h3>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--canon-gray-700)" }}>
            Compare the proposed funding with each case&apos;s expected benefit and proof before making a funding decision.
          </p>
          {largest.map((item) => {
            const funding = item.sourcePlan?.fundingUsd ?? 0;
            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(200px, 1fr) minmax(180px, 2fr) 110px", gap: 14, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--canon-border)" }}>
                <span style={{ fontSize: 14, display: "grid", gap: 3 }}>
                  <strong>{item.name}</strong>
                  <small style={{ color: "var(--canon-gray-500)" }}>
                    {item.vendor ? `Source partner: ${item.vendor} · ` : ""}
                    {item.projectName && item.actualSpendYtdUsd !== null
                      ? `Project spend through ${sourceSpendDate(item.projectSpendAsOfDate)} ${money(item.actualSpendYtdUsd)}`
                      : "Project spending not recorded"}
                  </small>
                </span>
                <span style={{ height: 12, background: "var(--canon-gray-100)" }}>
                  <span style={{ display: "block", width: `${maxFunding > 0 ? (funding / maxFunding) * 100 : 0}%`, height: 12, background: "var(--canon-teal-dark)" }} />
                </span>
                <strong style={{ textAlign: "right", fontFamily: "var(--abarva-mono)" }}>{money(funding)}</strong>
              </div>
            );
          })}
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-700)" }}>
          {projectSpend
            ? "Project spending comes from a synthetic portfolio source and may repeat across linked cases. It is not a tool subscription bill; case figures should not be added again to the distinct-project total above."
            : "Project spending comes from synthetic portfolio records and may repeat across linked cases. It is not a tool subscription bill; Tower withholds a total until project IDs, fiscal year, source, and as-of dates reconcile."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
          <div style={PANEL}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Overall IT budget</h3>
            <p style={{ margin: 0, lineHeight: 1.55 }}>The synthetic source states an overall budget and separate case plans. Tower shows an AI share only after the total and the case funding are reconciled on the same basis.</p>
          </div>
          <div style={PANEL}>
            <h3 style={{ margin: "0 0 8px", fontSize: 15 }}>Tool and partner costs</h3>
            <p style={{ margin: 0, lineHeight: 1.55 }}>Rollout and vendor records show which tools are in use. Subscription and partner charges need a linked Finance amount before they enter a spend total.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--abarva-serif)", fontWeight: 500, fontSize: 26 }}>
        {hasDemoSplit ? "The FY26 synthetic demo budget shows existing operations and new work." :
          hasDemoBudget ? "The FY26 synthetic demo budget is selected. Its split between existing operations and new work is not reconciled." :
          "We cannot show how the IT budget is split until its total is verified from the source files."}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Keeping things running vs new work</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>
            {hasDemoSplit ? `${money(demoRun)} running · ${money(demoChange)} new work` :
              hasProjectedBudget || hasDemoBudget ? "Needs a source check" : "Not loaded"}
          </p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            {hasDemoSplit
              ? "The selected synthetic Finance file marks 31 budget lines for existing operations and 39 for new work. They add to the demo total; independent Finance sign-off is not recorded."
              : hasDemoBudget
              ? "The selected synthetic demo total is source-backed, but its split is not reconciled. Independent Finance sign-off is still absent."
              : hasProjectedBudget
              ? "Budget fields are present, but they have not been matched to the current source files. The split stays hidden until the totals and what they include are confirmed."
              : "No budget split is loaded. Tower needs a source-approved total and matching running-cost and new-work amounts before it can show this split."}
          </p>
        </div>
        <div style={PANEL}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15 }}>Upfront purchases vs ongoing costs</h3>
          <p style={{ margin: 0, fontSize: 22, fontFamily: "var(--abarva-serif)" }}>Not loaded</p>
          <p style={{ margin: "16px 0 0", lineHeight: 1.6 }}>
            This split is not loaded. Each amount needs a clear source and a consistent
            accounting category before it can be shown.
          </p>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--canon-gray-500)" }}>
        Approved AI case funding belongs within approved project funding. It is not an
        extra budget category, and this view cannot calculate its share of the total IT budget.
      </p>
    </section>
  );
}
