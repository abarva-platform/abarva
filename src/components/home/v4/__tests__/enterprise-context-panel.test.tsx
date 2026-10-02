import assert from "node:assert/strict";
import { test } from "@jest/globals";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { HomeEnterpriseContext } from "@/lib/home/preview/ecl-enterprise-context";
import { EnterpriseContextPanel } from "../EnterpriseContextPanel";

const fact = (rowKey: string, title: string) => ({
  rowKey,
  title,
  sourceRefs: [`source-${rowKey}`],
  asOf: "2026-09-30",
});

const context: HomeEnterpriseContext = {
  profile: {
    ...fact("ENT-1", "Reference enterprise"),
    businessModel: "Integrated payer and care delivery",
    annualRevenueUsd: null,
  },
  segmentSpine: {
    segments: [
      {
        segmentKey: "SEG-1",
        segmentName: "Health plan",
        revenueSharePct: 60,
        revenueUsd: 0,
        pnlOwnerRole: "Plan CEO",
        domains: {
          applications: { count: 12 },
          programs: { count: 3 },
          risks: { count: 4 },
        },
      },
    ],
    unattributed: { applications: 2, programs: 1, risks: 0 },
    unresolvedByDomain: {},
    shareVsRevenue: [],
  },
  segmentFacts: { "SEG-1": fact("SEG-1", "Health plan") },
  functions: [
    {
      ...fact("FUNC-1", "Claims"),
      segmentKey: "SEG-1",
      executiveOwner: "COO",
      applicationCount: 12,
      programCount: 3,
      riskCount: 4,
    },
  ],
  priorities: [
    {
      ...fact("PRI-1", "Claims modernization"),
      segmentKey: "SEG-1",
      ownerRole: "COO",
      targetOutcome: "Faster claims",
      programCount: 3,
      atRiskProgramCount: 1,
      metricCount: 2,
    },
  ],
  sharedFunctionIds: ["FUNC-2"],
  unlinkedPrograms: [fact("PROG-4", "Unlinked program")],
  excludedUncitedRows: 0,
  evidenceClass: "synthetic_reference",
};

test("executive context is concise and flags the unresolved work", () => {
  const html = renderToStaticMarkup(
    createElement(EnterpriseContextPanel, {
      chapterId: "executive_brief",
      context,
      onOpenRows: () => undefined,
    }),
  );
  assert.match(html, /Integrated payer and care delivery/);
  assert.match(html, /At-risk linked programs/);
  assert.match(html, /1 program has no declared priority/);
  assert.match(html, /Changes over time are not established/);
  assert.doesNotMatch(html, /serving\.home_|source_record_id/);
});

test("business, strategy, and operating views answer different questions", () => {
  const render = (
    chapterId: "our_business" | "strategy_value_creation" | "how_we_operate",
  ) =>
    renderToStaticMarkup(
      createElement(EnterpriseContextPanel, {
        chapterId,
        context,
        onOpenRows: () => undefined,
      }),
    );
  const business = render("our_business");
  const strategy = render("strategy_value_creation");
  const operating = render("how_we_operate");
  assert.match(business, /Revenue share/);
  assert.match(business, /Plan CEO/);
  assert.match(strategy, /Claims modernization/);
  assert.match(strategy, /Faster claims/);
  assert.match(strategy, /Targets and KPIs are not proof of realized value/);
  assert.match(operating, /Claims/);
  assert.match(operating, /Executive owner/);
  assert.match(operating, /shared functions are deliberately not allocated/);
  const withUncited = renderToStaticMarkup(
    createElement(EnterpriseContextPanel, {
      chapterId: "our_business",
      context: { ...context, excludedUncitedRows: 2 },
      onOpenRows: () => undefined,
    }),
  );
  assert.match(withUncited, /2 source rows were excluded/);
});
