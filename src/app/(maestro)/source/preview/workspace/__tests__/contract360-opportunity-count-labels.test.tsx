/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import {
  ContractRelationshipBriefing,
  ContractStoryBriefing,
} from "../Contract360Surfaces";
import { ContractCanvas } from "../canvases/ContractCanvas";
import type {
  SourceContract360Row,
  SourceContractEvidenceCoverageRow,
} from "@/lib/source/data-model/types";
import type { SourceWorkspaceVM } from "../buildViewModel";

/**
 * Item U-518. One contract page counted "opportunities" twice, from two reads
 * that measure different populations, and printed both under the same word.
 *
 *  - The Story evidence lane reads the persisted `opportunity_rows` coverage
 *    column, which is `count(*)` over `source.contract_action_candidate_v1`
 *    (supabase/migrations/20260910203000_source_contract_tab_intelligence.sql).
 *    It counts governed action-candidate rows LOADED AS EVIDENCE.
 *  - Every other count on the page reads `vm.opportunityView.opportunities`,
 *    which is the contract's governed optimization opportunity SET, read from
 *    `source.optimization_opportunity` or derived from `source.golden_contract_*`
 *    when no persisted set exists.
 *
 * Neither is the authoritative count of the other, so they are labelled apart
 * rather than made to agree. These tests assert that from rendered output, and
 * a fixture where the two already agree is the negative control.
 */

const contract = {
  contract_id: "MER-TEST-001",
  contract_name: "Test Enterprise Agreement",
  vendor_name: "Test Vendor, Inc.",
  vendor_ref: "VEN-TEST",
  annual_value: 1_000_000,
  end_date: "2030-10-14",
} as unknown as SourceContract360Row;

const coverageWith = (opportunityRows: number) =>
  ({
    contract_id: "MER-TEST-001",
    scope_rows: 4,
    spend_rows: 12,
    actual_spend_usd: 950_000,
    committed_spend_usd: 1_000_000,
    performance_rows: 6,
    document_page_text_rows: 88,
    opportunity_rows: opportunityRows,
  }) as unknown as SourceContractEvidenceCoverageRow;

function opportunity(index: number) {
  return {
    id: `MER-TEST-001:lever-${index}`,
    shortLabel: `Lever ${index}`,
    label: `Lever ${index}`,
    valueType: "Negotiable Improvement",
    amount: "$100K",
    stage: "Quantified",
    stageRaw: "quantified",
    grade: "System Evidenced",
    tone: "#1d9e75",
    selected: index === 1,
    blockingGap: null,
    nextAction: `Work lever ${index}.`,
  };
}

const vmWithOpportunitySet = (count: number) =>
  ({
    detail: { contractTabIntelligence: [] },
    contractEducation: {
      archetypeLabel: "Cloud consumption commitment",
      facetRequirements: { Performance: { state: "required" } },
    },
    optWorkflow: null,
    opportunityView: {
      contractId: "MER-TEST-001",
      opportunities: Array.from({ length: count }, (_, i) => opportunity(i + 1)),
    },
  }) as unknown as SourceWorkspaceVM;

/** The evidence-lane chips as a reader sees them: "<label> · <count>". */
function evidenceLaneLabels(container: HTMLElement): string[] {
  return [...container.querySelectorAll(".sw-c3-evidence-state-name")].map(
    (node) => node.textContent ?? "",
  );
}

describe("U-518 — two opportunity counts, two labels", () => {
  it("does not print the evidence-row count under the bare word the opportunity set owns", () => {
    // The disagreeing fixture: nothing loaded into the evidence lane, three
    // opportunities in the governed set. This is the live A7 symptom.
    const { container } = render(
      <>
        <ContractStoryBriefing
          contract={contract}
          coverage={coverageWith(0)}
          scopeRows={[]}
          vm={vmWithOpportunitySet(3)}
        />
        <ContractRelationshipBriefing
          contract={contract}
          scopeRows={[]}
          vm={vmWithOpportunitySet(3)}
        />
      </>,
    );

    const lanes = evidenceLaneLabels(container);
    expect(lanes.length).toBeGreaterThan(0);

    // Before the fix this lane read "Opportunities · 0" beside "3 opportunities".
    expect(lanes).not.toContain("Opportunities · 0");
    expect(lanes).toContain("Opportunity evidence rows · 0");

    // The opportunity set keeps the plain word, and its own number.
    expect(screen.getByText(/3 opportunities/)).toBeTruthy();
  });

  it("names the read each count comes from, so a reader can tell them apart", () => {
    const { container } = render(
      <ContractStoryBriefing
        contract={contract}
        coverage={coverageWith(0)}
        scopeRows={[]}
        vm={vmWithOpportunitySet(3)}
      />,
    );

    // No evidence lane may carry the unqualified word: it is the opportunity
    // set's, and two numbers under one word is the defect.
    for (const label of evidenceLaneLabels(container)) {
      expect(label.startsWith("Opportunities")).toBe(false);
    }
  });

  it("negative control — an agreeing fixture still prints the same number on both reads", () => {
    // Coverage 3, set 3. This case must be green before and after the change:
    // the fix is a labelling change, not a recount.
    const { container } = render(
      <>
        <ContractStoryBriefing
          contract={contract}
          coverage={coverageWith(3)}
          scopeRows={[]}
          vm={vmWithOpportunitySet(3)}
        />
        <ContractRelationshipBriefing
          contract={contract}
          scopeRows={[]}
          vm={vmWithOpportunitySet(3)}
        />
      </>,
    );

    expect(
      evidenceLaneLabels(container).some((label) => /opportunit/i.test(label) && label.endsWith("· 3")),
    ).toBe(true);
    expect(screen.getByText(/3 opportunities/)).toBeTruthy();
  });
});

describe("U-518 — the opportunity queue's five-row cap", () => {
  /**
   * Reachability, settled before the assertion was written. Every
   * `optimization_opportunities.csv` under `datasets/source/contract-depth/`
   * and `datasets/source/cloud-consumption/`, grouped by `contract_id`: the
   * densest single contract carries SIX rows. The truncation branch is
   * therefore reached rather than theoretical, and the suite beside this one
   * already renders a six-lever view model.
   */
  const canvasVm = (count: number) =>
    ({
      ...(vmWithOpportunitySet(count) as unknown as Record<string, unknown>),
      c: {
        vendor: "Test Vendor, Inc.",
        ref: "MER-TEST-001",
        acv: "$1.0M",
        spend: "$950.0K",
        notice: "30 Sep 2027",
        expiry: "28 Jan 2028",
        noticePassed: false,
      },
      cOverview: true,
      detailState: "ready",
      optSpine: {
        selected: {
          rank: "#1",
          band: "Prime optimization candidate",
          score: 86,
          annualValue: "$1.0M",
          reasons: [],
        },
      },
      termRows: [],
      goActions: () => undefined,
      opportunityView: {
        contractId: "MER-TEST-001",
        recommendation: "Act now.",
        recommendationDetail: "Governed opportunities are ready for review.",
        baseline: {
          status: "ready",
          headline: "Commercial baseline reconciled",
          detail: "Annual value reconciles to the pricing schedule.",
          annualValue: "$1.0M",
          pricingScheduleValue: "$1.0M",
          actualSpend: "$950.0K",
          committedValue: "$1.0M",
          conflictAmount: null,
        },
        potential: {
          recoverable: "$200K",
          avoidable: "$100K",
          negotiable: "$100K",
          total: "$400K",
        },
        financeConfirmed: "Not established",
        selectedOpportunity: { nextAction: "Work lever 1." },
        opportunities: Array.from({ length: count }, (_, i) =>
          opportunity(i + 1),
        ),
      },
    }) as unknown as SourceWorkspaceVM;

  it("discloses the cap when the set is denser than the queue shows", () => {
    render(<ContractCanvas vm={canvasVm(6)} />);

    // Six identified, five rendered, and before this change the page said
    // nothing about the difference.
    expect(screen.getByText("Lever 5")).toBeTruthy();
    expect(screen.queryByText("Lever 6")).toBeNull();
    expect(screen.getAllByText(/Showing 5 of 6/).length).toBeGreaterThan(0);
  });

  it("negative control — no cap disclosure when every opportunity is shown", () => {
    render(<ContractCanvas vm={canvasVm(4)} />);

    expect(screen.getByText("Lever 4")).toBeTruthy();
    expect(screen.queryByText(/Showing \d+ of \d+/)).toBeNull();
  });

  const relationshipVm = (count: number) =>
    ({
      ...(canvasVm(count) as unknown as Record<string, unknown>),
      cOverview: false,
      cRelationship: true,
      contractRow: { contract_id: "MER-TEST-001" },
    }) as unknown as SourceWorkspaceVM;

  it("discloses the same cap on the relationship graphic, which plots five of them", () => {
    render(<ContractCanvas vm={relationshipVm(6)} />);

    expect(screen.getAllByText("Lever 5").length).toBeGreaterThan(0);
    expect(screen.queryByText("Lever 6")).toBeNull();
    expect(screen.getAllByText(/Showing 5 of 6/).length).toBeGreaterThan(0);
  });

  it("negative control — the relationship graphic stays unqualified when it plots them all", () => {
    render(<ContractCanvas vm={relationshipVm(4)} />);

    expect(screen.getAllByText("Lever 4").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Showing \d+ of \d+/)).toBeNull();
  });
});
