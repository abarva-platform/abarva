/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";

import { ContractAnatomy } from "../ContractAnatomy";
import {
  ContractEvidenceContextStack,
  ContractEvidenceDocuments,
  contractTabNarrative,
} from "../WorkspaceExecutiveShell";
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
      opportunities: Array.from(
        { length: opts.opportunities ?? 6 },
        (_, i) => ({
          id: `o${i}`,
        }),
      ),
    },
  }) as unknown as SourceWorkspaceVM;

const facet = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll(".sw-c3-facet")].find(
    (node) => node.querySelector(".sw-c3-facet-name")?.textContent === name,
  );

describe("ContractAnatomy", () => {
  it("does not call row presence reconciliation, citable proof or optimization readiness", () => {
    const { container } = render(
      <ContractEvidenceContextStack
        coverage={coverage({
          spend_rows: 1,
          scope_rows: 0,
          document_page_text_rows: 0,
          performance_rows: 0,
          opportunity_rows: 0,
        })}
      />,
    );
    expect(container.textContent).not.toMatch(
      /Reconciled records|Citable contract passages|Optimization can render/,
    );
    expect(
      screen.getByText("Review inputs before recommending action"),
    ).toBeTruthy();
  });

  it("does not recommend optimization or scope conclusions from a spend-only row", () => {
    const narrative = contractTabNarrative(
      "Evidence",
      vmWith({ performanceRequired: true }),
      { contract_id: "C1" } as never,
      coverage({
        spend_rows: 1,
        scope_rows: 0,
        document_page_text_rows: 0,
        performance_rows: 0,
        opportunity_rows: 0,
      }),
      [],
      undefined,
    );
    expect(narrative.body).not.toContain(
      "support this contract across spend, scope, performance, and opportunity",
    );
    expect(narrative.blocker).not.toContain(
      "Use the structured rows for optimization and scope",
    );
    expect(narrative.blocker).toContain("Contract manager / Legal ops");
  });

  it("does not claim other evidence lanes or optimization when no documents are attached", () => {
    const { container } = render(
      <ContractEvidenceDocuments
        files={[]}
        extractions={[]}
        coverage={coverage({
          spend_rows: 0,
          scope_rows: 0,
          performance_rows: 0,
          opportunity_rows: 0,
        })}
      />,
    );
    expect(container.textContent).not.toContain(
      "Source can still optimize this contract",
    );
    expect(container.textContent).not.toContain(
      "scope, performance, and opportunity rows are loaded",
    );
    expect(
      screen.getByText(
        /No contract-linked document passages are available in this view/,
      ),
    ).toBeTruthy();
  });
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
    expect(
      optimize?.querySelector('[aria-label="Evidence present"]'),
    ).toBeTruthy();
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
    expect(screen.getByText(/View coverage: 1 of 7\./)).toBeTruthy();
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
    expect(feeds?.textContent).toContain("Cited opportunity inputs needed");
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
    expect(feeds?.textContent).toContain("4 opportunity records");
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
    expect(screen.getByText(/View coverage: 5 of 7\./)).toBeTruthy();
  });

  it("labels the view signals as availability rather than validated owners or citations", () => {
    const { container } = render(
      <ContractAnatomy
        coverage={coverage({ opportunity_rows: 4 })}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true })}
      />,
    );
    expect(facet(container, "Story")?.textContent).toContain(
      "Contract type mapped",
    );
    expect(facet(container, "Relationship")?.textContent).toContain(
      "owners not validated",
    );
    expect(facet(container, "Evidence")?.textContent).not.toContain(
      "always cited",
    );
    expect(facet(container, "Optimize")?.textContent).toContain(
      "calculation proof separate",
    );
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

  it("labels requested systems as examples rather than verified connections", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: false })}
      />,
    );

    // The deck draws seven integrated systems. The data records only the
    // loader, so the surface says so rather than implying an integration.
    expect(screen.getByText(/Examples, not verified connections/)).toBeTruthy();
  });

  it("draws the extract-to-record path without claiming example systems are connected", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true })}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Contract evidence path" }),
    ).toBeTruthy();
    expect(screen.getByText("Source systems")).toBeTruthy();
    expect(screen.getByText("Extracts & workbooks")).toBeTruthy();
    expect(screen.getByText("Canonical contract")).toBeTruthy();
    expect(screen.getByText(/Examples, not verified connections/)).toBeTruthy();
    expect(screen.queryByText(/This contract answers/)).toBeNull();
    expect(screen.queryByText(/Every question.*evidence behind it/)).toBeNull();
  });

  it("turns a missing input into an owner and precise next action", () => {
    render(
      <ContractAnatomy
        coverage={coverage({ document_page_text_rows: 0 })}
        scopeRowCount={0}
        vm={vmWith({ performanceRequired: true })}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Agreements & terms/ }));
    const detail = screen.getByRole("region", {
      name: "Agreements & terms input detail",
    });
    expect(
      within(detail).getByText("Contract manager / Legal ops"),
    ).toBeTruthy();
    expect(
      within(detail).getByText(/executed agreement.*SOW.*notice.*pricing/),
    ).toBeTruthy();
    expect(within(detail).getByText(/same canonical contract ID/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: /Invoices & payments/ }),
    );
    expect(
      screen.getByText(/invoice IDs.*PO.*paid amount.*period/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Spend rows do not prove invoice reconciliation or measured usage/,
      ),
    ).toBeTruthy();
  });

  it("shows a declared synthetic origin as synthetic, not as a live connector", () => {
    const vm = vmWith({ performanceRequired: true });
    Object.assign(vm, {
      detail: {
        contract: { contract_id: "C1", tenant_key: "t1" },
        documentFiles: [
          {
            file_id: "F1",
            tenant_key: "t1",
            contract_ref: "C1",
            document_type: "master_services_agreement",
            file_name: "agreement.txt",
            content_authenticity: "synthetic",
            metadata_json: { source_system: "SharePoint" },
          },
        ],
      },
    });
    render(<ContractAnatomy coverage={coverage()} scopeRowCount={4} vm={vm} />);
    fireEvent.click(screen.getByRole("button", { name: /Agreements & terms/ }));
    expect(screen.getByText("Synthetic origin: SharePoint")).toBeTruthy();
    expect(screen.getByText("agreement.txt")).toBeTruthy();
    expect(screen.queryByText(/SharePoint connected/)).toBeNull();
  });

  it("does not describe contract-wide passages as agreement completeness", () => {
    render(
      <ContractAnatomy
        coverage={coverage()}
        scopeRowCount={4}
        vm={vmWith({ performanceRequired: true })}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Agreements & terms/ }).textContent,
    ).toContain("Contract-wide: 6 document passages");
  });

  it("does not relabel the internal package loader as an upstream connector", () => {
    const vm = vmWith({ performanceRequired: true });
    Object.assign(vm, {
      detail: {
        contract: { contract_id: "C1", tenant_key: "t1" },
        documentFiles: [
          {
            file_id: "F1",
            tenant_key: "t1",
            contract_ref: "C1",
            document_type: "contract",
            metadata_json: {
              source_system: "source_contract_depth_package_loader",
            },
          },
        ],
      },
    });
    render(<ContractAnatomy coverage={coverage()} scopeRowCount={4} vm={vm} />);
    expect(screen.getByText("Upstream origin not declared")).toBeTruthy();
    expect(
      screen.queryByText(
        /Recorded origin: source_contract_depth_package_loader/,
      ),
    ).toBeNull();
  });

  it("shows requested extracts rather than a zero-heavy missing evidence grid", () => {
    const { container } = render(
      <ContractAnatomy
        scopeRowCount={0}
        coverage={coverage({
          spend_rows: 0,
          document_page_text_rows: 0,
          performance_rows: 0,
          change_order_rows: 0,
          opportunity_rows: 0,
        })}
        vm={vmWith({ performanceRequired: true })}
      />,
    );
    const inputs = container.querySelector(".sw-c3-flow-inputs");
    expect(inputs?.textContent).not.toMatch(
      /0 document|0 spend|0 declared|0 performance|0 change-order|0 opportunity/,
    );
    expect(
      screen.getByText("Executed agreement and terms needed"),
    ).toBeTruthy();
    expect(screen.getByText("Invoice and payment extract needed")).toBeTruthy();
    expect(screen.getByText("Scope extract needed")).toBeTruthy();
    expect(screen.getByText("SLA history needed")).toBeTruthy();
    expect(screen.getByText("Approved change ledger needed")).toBeTruthy();
    expect(screen.getByText("Cited opportunity inputs needed")).toBeTruthy();
  });

  it("scopes structured source rows to the same tenant and contract", () => {
    const vm = vmWith({ performanceRequired: true });
    Object.assign(vm, {
      detail: {
        contract: { contract_id: "C1", tenant_key: "t1" },
        spendMonths: [
          {
            tenant_key: "t1",
            contract_id: "C1",
            source_system: "ERP extract",
            source_record_id: "invoice-1",
          },
          {
            tenant_key: "t2",
            contract_id: "C1",
            source_system: "WRONG-TENANT",
          },
          {
            tenant_key: "t1",
            contract_id: "C2",
            source_system: "WRONG-CONTRACT",
          },
        ],
        performancePeriods: [
          {
            tenant_key: "t1",
            contract_id: "C1",
            source_system: "ITSM extract",
            source_record_id: "incident-1",
          },
          {
            tenant_key: "t2",
            contract_id: "C1",
            source_system: "WRONG-TENANT",
          },
          {
            tenant_key: "t1",
            contract_id: "C2",
            source_system: "WRONG-CONTRACT",
          },
        ],
      },
    });
    render(<ContractAnatomy coverage={coverage()} scopeRowCount={4} vm={vm} />);
    fireEvent.click(
      screen.getByRole("button", { name: /Invoices & payments/ }),
    );
    const spend = screen.getByRole("region", {
      name: "Invoices & payments input detail",
    });
    expect(
      within(spend).getByText("Recorded origin: ERP extract"),
    ).toBeTruthy();
    expect(within(spend).getByText("invoice-1")).toBeTruthy();
    expect(spend.textContent).not.toMatch(/WRONG-TENANT|WRONG-CONTRACT/);
    fireEvent.click(
      screen.getByRole("button", { name: /Service performance/ }),
    );
    const perf = screen.getByRole("region", {
      name: "Service performance input detail",
    });
    expect(
      within(perf).getByText("Recorded origin: ITSM extract"),
    ).toBeTruthy();
    expect(within(perf).getByText("incident-1")).toBeTruthy();
    expect(perf.textContent).not.toMatch(/WRONG-TENANT|WRONG-CONTRACT/);
  });

  it("does not use vendor documents, another contract or another tenant as contract provenance", () => {
    const vm = vmWith({ performanceRequired: true });
    Object.assign(vm, {
      detail: {
        contract: { contract_id: "C1", tenant_key: "t1" },
        documentFiles: [
          {
            file_id: "F2",
            tenant_key: "t1",
            contract_ref: "C2",
            document_type: "contract",
            metadata_json: { source_system: "WRONG-CONTRACT" },
          },
          {
            file_id: "F3",
            tenant_key: "t2",
            contract_ref: "C1",
            document_type: "contract",
            metadata_json: { source_system: "WRONG-TENANT" },
          },
          {
            file_id: "F4",
            tenant_key: "t1",
            contract_ref: null,
            document_type: "contract",
            metadata_json: { source_system: "VENDOR-ONLY" },
          },
        ],
      },
    });
    const { container } = render(
      <ContractAnatomy coverage={coverage()} scopeRowCount={4} vm={vm} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Agreements & terms/ }));
    expect(container.textContent).not.toMatch(
      /WRONG-CONTRACT|WRONG-TENANT|VENDOR-ONLY/,
    );
    expect(screen.getByText("Upstream origin not declared")).toBeTruthy();
  });
});
