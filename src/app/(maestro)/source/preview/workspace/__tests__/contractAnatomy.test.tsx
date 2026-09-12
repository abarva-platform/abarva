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

describe("ContractAnatomy", () => {
  it("marks a facet not-applicable rather than open when the archetype excludes it", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ performance_rows: 0 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    const performance = [...container.querySelectorAll(".sw-c3-facet")].find(
      (node) => node.textContent?.includes("Performance"),
    );
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

    const performance = [...container.querySelectorAll(".sw-c3-facet")].find(
      (node) => node.textContent?.includes("Performance"),
    );
    expect(performance?.className).toContain("sw-c3-facet-open");
    expect(performance?.textContent).toContain("—");
  });

  it("counts answered questions from the contract's own lanes", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    // Story, Scope, Economics, Relationship, Evidence, Optimize answered;
    // Performance not required.
    expect(
      screen.getByText(/A contract is seven questions. This one answers 6\./),
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

    const story = [...container.querySelectorAll(".sw-c3-facet")].find((node) =>
      node.textContent?.startsWith("1Story"),
    );
    expect(story?.className).toContain("sw-c3-facet-open");
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
