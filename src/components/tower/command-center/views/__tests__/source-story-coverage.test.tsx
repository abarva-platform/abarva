import { renderToStaticMarkup } from "react-dom/server";

import { designFixtureMart } from "@/lib/tower/command-center/__fixtures__/design-fixture";
import type { TowerAiView, TowerCommandCenterView } from "@/lib/tower/command-center/types";
import { buildTowerCommandCenterView } from "@/lib/tower/command-center/view-model";

import { BudgetDomainPanel, buildAffectedWorkAreaCoverage } from "../BudgetDomainPanel";
import { expectedBenefitKindRows } from "../InitiativesDistributionPanel";
import { InitiativesDistributionPanel } from "../InitiativesDistributionPanel";
import { InitiativesTablePanel } from "../InitiativesTablePanel";

function baseView(): TowerCommandCenterView {
  const view = buildTowerCommandCenterView(designFixtureMart(), { tenantName: "Fixture Tenant" });
  if (!view) throw new Error("Fixture Tower view did not build");
  return view;
}

describe("Tower source-field story", () => {
  it("shows the declared 28-of-38 work-area coverage without making a funding claim", () => {
    const original = baseView();
    const programs = Array.from({ length: 38 }, (_, index) => ({
      ...original.programs[0],
      id: `program-${index + 1}`,
      name: `Program ${index + 1}`,
      functionLabel: null,
      affectedFunctions: index < 28
        ? [{ functionId: index < 14 ? "area-a" : "area-b", functionName: index < 14 ? "Member services" : "Operations" }]
        : [],
    }));
    const view = { ...original, programs };
    const coverage = buildAffectedWorkAreaCoverage(view);
    const html = renderToStaticMarkup(<BudgetDomainPanel view={view} />);

    expect(coverage.linkedPrograms).toBe(28);
    expect(coverage.unlinkedPrograms).toHaveLength(10);
    expect(coverage.rows.map((row) => row.programCount)).toEqual([14, 14]);
    expect(html).toContain("28 of 38 loaded programs have an affected work area linked in the source");
    expect(html).toContain("10 programs need a work area link");
    expect(html).toContain("See the 10 programs without a work area link");
    expect(html).toContain("They do not identify a funding category or an approved budget");
    expect(html).not.toContain("reviewed program");
    expect(html).not.toContain("$9.0M");
  });

  it("counts a multi-area program once per distinct source function and once in total coverage", () => {
    const original = baseView();
    const view = {
      ...original,
      programs: [
        { ...original.programs[0], id: "p1", affectedFunctions: [
          { functionId: "a", functionName: "Operations" },
          { functionId: "a", functionName: "Operations" },
          { functionId: "b", functionName: "Member services" },
        ] },
        { ...original.programs[0], id: "p2", affectedFunctions: [{ functionId: "a", functionName: "Operations" }] },
        { ...original.programs[0], id: "p3", affectedFunctions: [] },
      ],
    };
    const coverage = buildAffectedWorkAreaCoverage(view);

    expect(coverage.totalPrograms).toBe(3);
    expect(coverage.linkedPrograms).toBe(2);
    expect(coverage.multiAreaPrograms).toBe(1);
    expect(coverage.unlinkedPrograms).toHaveLength(1);
    expect(coverage.rows.map((row) => [row.functionId, row.programCount])).toEqual([["a", 2], ["b", 1]]);
  });

  it("shows source expected benefit kinds in the AI table and distribution without treating them as results", () => {
    const original = baseView();
    const archetypes = [
      ...Array<string>(11).fill("yield_leakage_or_regulatory_exposure"),
      ...Array<string>(6).fill("revenue_uplift_or_experience"),
      "cost_productivity_or_cycle_time",
    ];
    const cases: TowerAiView[] = archetypes.map((expectedValueArchetype, index) => ({
      ...original.allInitiatives[0],
      id: `case-${index + 1}`,
      n: index + 1,
      name: `Case ${index + 1}`,
      populationKind: "ai_case",
      expectedValueArchetype,
      businessValueType: index === 0 ? "Cost reduction" : null,
      aiAmountBasis: "unknown",
      promisedBenefitLoaded: false,
      promisedUsd: 0,
      financeValidatedAmountLoaded: false,
    }));
    const view = { ...original, allInitiatives: cases };
    const table = renderToStaticMarkup(<InitiativesTablePanel view={view} />);
    const distribution = renderToStaticMarkup(<InitiativesDistributionPanel view={view} />);

    expect(expectedBenefitKindRows(cases).map((row) => row.count)).toEqual([11, 6, 1]);
    expect(table).toContain("Expected benefit kind (plan)");
    expect(table).toContain("Reduce lost value or compliance risk");
    expect(table).toContain("Recorded value category: <span>Cost reduction</span>");
    expect(table).toContain("It does not show an approved amount, a measured result, or a benefit cleared by Finance");
    expect(distribution).toContain("Expected benefit kind from intake");
    expect(distribution).toContain("Reduce lost value or compliance risk: 11 cases");
    expect(distribution).toContain("Increase revenue or improve people&#x27;s experience: 6 cases");
    expect(distribution).toContain("Save time, improve productivity, or shorten a process: 1 case");
    expect(distribution).toContain("money charts use the separate value category where it is loaded, not the expected benefit kind");
  });
});
