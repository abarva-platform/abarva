import {
  evidenceLede,
  relationshipLede,
  scopeLede,
  storyLede,
} from "../contract360Ledes";
import type {
  SourceContract360Row,
  SourceContractApplicationScopeRow,
  SourceContractEvidenceCoverageRow,
  SourceContractSpendMonthlyRow,
} from "@/lib/source/data-model/types";

/**
 * The design opens each surface with a finding — "Four declared workload
 * scopes, and 91% of consumption sits in two of them." The governed
 * intelligence records carry evidence summaries instead — "4 scoped application
 * or service rows are loaded" — which is true, and is the builder's sentence.
 *
 * These compute the finding from the rows the surface already renders. The
 * property that matters is that each returns null rather than a claim the rows
 * do not support, so the caller can fall back to the governed narrative.
 */

const scope = (
  overrides: Partial<SourceContractApplicationScopeRow> = {},
): SourceContractApplicationScopeRow =>
  ({
    contract_id: "C1",
    application_ref: `APP-${Math.random()}`,
    application_name: "Workload",
    business_function: "Analytics",
    criticality: "Important",
    hosting_model: "Vendor-hosted · AWS",
    annual_run_cost: null,
    ...overrides,
  }) as unknown as SourceContractApplicationScopeRow;

const spend = (
  amount: number,
  workload: string | null,
): SourceContractSpendMonthlyRow =>
  ({
    contract_id: "C1",
    observation_id: `OBS-${Math.random()}`,
    month: "2026-01",
    period_start: "2026-01-01",
    actual_spend: amount,
    business_unit: workload,
    service_id: null,
  }) as unknown as SourceContractSpendMonthlyRow;

describe("scopeLede", () => {
  it("states concentration when consumption spans more than one workload", () => {
    const lede = scopeLede(
      [scope(), scope(), scope(), scope()],
      [spend(60, "A"), spend(31, "B"), spend(9, "C")],
    );
    // 91 of 100 in the top two.
    expect(lede).toBe(
      "4 declared workload scopes, and 91% of consumption sits in 2 of them.",
    );
  });

  it("says so plainly when everything attributes to one workload", () => {
    // The live shape: every spend row carries the same workload label. The
    // design's concentration claim cannot be made, so it is not made.
    const lede = scopeLede([scope(), scope()], [spend(100, "A"), spend(50, "A")]);
    expect(lede).toContain("all attributed consumption sits in one of them");
    expect(lede).not.toContain("%");
  });

  it("does not claim attribution when no spend row carries a workload", () => {
    const lede = scopeLede([scope({ criticality: "Business critical" })], [
      spend(100, null),
    ]);
    expect(lede).toContain("business critical");
  });

  it("returns null with no scope rows so the caller can fall back", () => {
    expect(scopeLede([], [spend(100, "A")])).toBeNull();
  });
});

describe("storyLede", () => {
  const contract = { annual_value: 1_891_000 } as unknown as SourceContract360Row;

  it("leads with the gap between committed and drawn", () => {
    const coverage = {
      committed_spend_usd: 1_550_000,
      actual_spend_usd: 66_100,
    } as unknown as SourceContractEvidenceCoverageRow;

    const lede = storyLede(contract, coverage, "Cloud consumption commitment");
    expect(lede).toContain("Capacity bought ahead of use");
    expect(lede).toContain("4%");
  });

  it("does not call a well-used commitment over-bought", () => {
    const coverage = {
      committed_spend_usd: 1_000_000,
      actual_spend_usd: 900_000,
    } as unknown as SourceContractEvidenceCoverageRow;

    const lede = storyLede(contract, coverage, "Cloud consumption commitment");
    expect(lede).toContain("90%");
    expect(lede).not.toContain("ahead of use");
  });

  it("falls back to the annual figure when no commitment is recorded", () => {
    const lede = storyLede(contract, null, "Managed services agreement");
    expect(lede).toContain("managed services agreement");
  });

  it("returns null when there is no figure to state", () => {
    expect(
      storyLede({} as unknown as SourceContract360Row, null, null),
    ).toBeNull();
  });
});

describe("relationshipLede", () => {
  it("counts only declared rows and names a single hosting model", () => {
    const lede = relationshipLede([
      scope({ business_function: "Clinical" }),
      scope({ business_function: "Revenue Cycle" }),
    ]);
    expect(lede).toContain("One vendor, one agreement");
    expect(lede).toContain("2 declared business functions");
    expect(lede).toContain("all on Vendor-hosted · AWS");
  });

  it("omits hosting when the rows disagree about it", () => {
    const lede = relationshipLede([
      scope({ hosting_model: "AWS" }),
      scope({ hosting_model: "On-premise" }),
    ]);
    expect(lede).not.toContain("all on");
  });

  it("returns null with nothing declared", () => {
    expect(relationshipLede([])).toBeNull();
  });
});

describe("evidenceLede", () => {
  it("counts loaded lanes and reports not-required ones separately", () => {
    const coverage = {
      spend_rows: 12,
      scope_rows: 4,
      performance_rows: 0,
      document_page_text_rows: 6,
      change_order_rows: 0,
      opportunity_rows: 6,
    } as unknown as SourceContractEvidenceCoverageRow;

    const lede = evidenceLede(coverage, 1);
    expect(lede).toContain("28 governed rows across 4 evidence lanes");
    expect(lede).toContain("1 further lane is not required");
  });

  it("says nothing about not-required lanes when there are none", () => {
    const coverage = {
      spend_rows: 12,
    } as unknown as SourceContractEvidenceCoverageRow;

    expect(evidenceLede(coverage, 0)).not.toContain("not required");
  });

  it("returns null when no lane holds a row", () => {
    const coverage = {
      spend_rows: 0,
      scope_rows: 0,
    } as unknown as SourceContractEvidenceCoverageRow;

    expect(evidenceLede(coverage, 0)).toBeNull();
    expect(evidenceLede(null, 0)).toBeNull();
  });
});
