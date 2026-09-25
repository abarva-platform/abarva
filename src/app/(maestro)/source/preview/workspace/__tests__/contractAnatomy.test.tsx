/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { ContractAnatomy } from "../ContractAnatomy";
import type { SourceContractEvidenceCoverageRow } from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * The facet column is the claim on this surface. Each of the seven questions
 * must read as answered only when the contract's own lane holds rows, as
 * not-applicable only when the archetype says so, and as open otherwise —
 * never one collapsed into another.
 *
 * Item U-521 added the Optimize cases below. What they pin is a property of
 * THIS component: the Optimize facet and the feeds row read the evidence
 * coverage row it is given, not `vm.opportunityView` — the product's computed
 * opportunity set. Reading the computed set made the card answer one of its own
 * seven questions with the recommendation that question is about.
 *
 * The cases are written in both directions deliberately: a single case would be
 * satisfied by a signal that is merely always-open or always-answered.
 *
 * They deliberately do NOT assert that the lane and the computed set are
 * different populations, because measurement says that is not reliably true.
 * `opportunity_rows` is count(*) over `source.contract_action_candidate_v1` in
 * the migration-owned projection and count(*) over deduped
 * `source.optimization_opportunity` in the live portfolio adapter, and a third
 * writer overwrites it with the computed count. That is item D-500. These cases
 * hold regardless of how D-500 is settled, which is why they are phrased against
 * the component's props rather than against the population.
 */

const coverage = (
  overrides: Partial<SourceContractEvidenceCoverageRow> = {},
): SourceContractEvidenceCoverageRow =>
  ({
    contract_id: "C1",
    spend_rows: 12,
    performance_rows: 0,
    document_page_text_rows: 6,
    ...overrides,
  }) as unknown as SourceContractEvidenceCoverageRow;

const vmWith = (opts: {
  performanceRequired: boolean;
  archetypeKey?: string;
  opportunities?: number;
}) =>
  ({
    contractEducation: {
      archetypeKey: opts.archetypeKey ?? "cloud_consumption_commit",
      facetRequirements: {
        Story: { state: "required", reason: "" },
        Scope: { state: "required", reason: "" },
        Economics: { state: "required", reason: "" },
        Performance: {
          state: opts.performanceRequired ? "required" : "not_required",
          reason: "",
        },
        Relationship: { state: "required", reason: "" },
        Evidence: { state: "required", reason: "" },
        Optimize: { state: "required", reason: "" },
      },
    },
    opportunityView: {
      opportunities: Array.from({ length: opts.opportunities ?? 6 }, (_, i) => ({
        id: `o${i}`,
      })),
    },
  }) as unknown as SourceWorkspaceVM;

const facet = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll(".sw-c3-facet")].find((node) =>
    node.querySelector(".sw-c3-facet-name")?.textContent === name,
  );

describe("ContractAnatomy", () => {
  it("marks a facet not-applicable rather than open when the archetype excludes it", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ performance_rows: 0 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    const performance = facet(container, "Performance");
    expect(performance?.className).toContain("sw-c3-facet-not_required");
    expect(performance?.textContent).toContain("n/a");
    // It must not be counted as an open question.
    expect(screen.getByText(/not a gap, a state/)).toBeTruthy();
  });

  it("marks the same facet open when the archetype does require it", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ performance_rows: 0 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true })}
      />,
    );

    const performance = facet(container, "Performance");
    expect(performance?.className).toContain("sw-c3-facet-open");
    expect(performance?.textContent).toContain("—");
  });

  /**
   * U-521, direction 1. Loaded lanes, no opportunity evidence, and a non-empty
   * computed opportunity set. This is the case that separates the two readings:
   * the product has produced levers, and the contract still carries no evidence
   * that the leverage question was answered from its own rows.
   */
  it("does not answer Optimize from the product's own opportunity set", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ opportunity_rows: 0 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true, opportunities: 6 })}
      />,
    );

    const optimize = facet(container, "Optimize");
    expect(optimize?.className).toContain("sw-c3-facet-open");
    expect(optimize?.textContent).toContain("—");
  });

  /**
   * U-521, direction 2. Opportunity evidence loaded and the computed set empty.
   * Without this case, a signal pinned to "open" would pass direction 1.
   */
  it("answers Optimize when opportunity evidence rows are loaded", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ opportunity_rows: 4 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true, opportunities: 0 })}
      />,
    );

    const optimize = facet(container, "Optimize");
    expect(optimize?.className).toContain("sw-c3-facet-answered");
    expect(optimize?.textContent).toContain("✓");
  });

  /**
   * U-521. A contract with nothing loaded and three computed levers must not
   * report a feed or an answered question on the strength of them.
   */
  it("claims nothing for a contract with no loaded rows and a computed lever set", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({
          spend_rows: 0,
          document_page_text_rows: 0,
          opportunity_rows: 0,
        })}
        scopeRowCount={0}
        vm={vmWith({ performanceRequired: true, opportunities: 3 })}
      />,
    );

    expect(facet(container, "Optimize")?.className).toContain(
      "sw-c3-facet-open",
    );
    // Only Story is answered, from the archetype.
    expect(
      screen.getByText(/This contract answers 1 of 7 decision questions\./),
    ).toBeTruthy();
  });

  /**
   * U-521, site (i). The "What feeds it" block enumerates inputs. Asserted on
   * the rendered text rather than the array, so relabelling the row without
   * changing its source cannot satisfy it.
   */
  it("does not present computed levers as something that feeds the contract", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ opportunity_rows: 0 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true, opportunities: 6 })}
      />,
    );

    const feeds = container.querySelector(".sw-c3-anatomy-col");
    expect(feeds?.textContent).not.toContain("governed lever");
    expect(feeds?.textContent).not.toContain("6 governed");
    // The loaded lane is what may appear, and it says which population it is.
    expect(feeds?.textContent).toContain("opportunity evidence row");
  });

  it("reports loaded opportunity evidence in the feeds block", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ opportunity_rows: 4 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true, opportunities: 0 })}
      />,
    );

    const feeds = container.querySelector(".sw-c3-anatomy-col");
    expect(feeds?.textContent).toContain("4 opportunity evidence rows");
  });

  /**
   * Amended deliberately by U-521, from "6 of 7" to "5 of 7". The previous
   * number counted Optimize as answered from the computed opportunity set,
   * which is the defect the pair of Optimize cases above now pins. The count
   * moved because one facet's signal changed, not because two facets moved in
   * opposite directions; the pair above fails if the signal is ever swapped
   * back, so this number cannot quietly return to 6.
   */
  it("counts answered questions from the contract's own lanes", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    // Story, Scope, Economics, Relationship, Evidence answered; Performance
    // not required; Optimize open — no opportunity evidence is loaded.
    expect(
      screen.getByText(/This contract answers 5 of 7 decision questions\./),
    ).toBeTruthy();
  });

  it("does not claim Story is answered on an unmapped archetype", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={0}
        vm={vmWith({ performanceRequired: true, archetypeKey: "unmapped" })}
      />,
    );

    expect(facet(container, "Story")?.className).toContain("sw-c3-facet-open");
  });

  it("says why named upstream systems are not drawn", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    // The deck draws seven integrated systems. The data records only the
    // loader, so the surface says so rather than implying an integration.
    expect(
      screen.getByText(/no integration with a named system exists to display/),
    ).toBeTruthy();
  });
});
