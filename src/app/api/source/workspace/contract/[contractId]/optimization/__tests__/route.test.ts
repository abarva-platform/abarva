import { __test__ } from "../route";
import type { SourceEventRow } from "@/lib/source/queries";

function event(overrides: Partial<SourceEventRow>): SourceEventRow {
  return {
    id: "event-1",
    client_key: "client-a",
    event_code: "CLIE-AMS-SOURCING-2026-CTR090",
    event_name: "Client A AMS Sourcing Event",
    event_type: "managed_service",
    sourcing_motion: "contract_optimization",
    current_stage_key: "strategy",
    lifecycle_state: "waiting_on_client",
    linked_program_id: null,
    estimated_value_usd: null,
    trigger_description: null,
    scope_description: null,
    decision_owner: null,
    created_by_user_id: null,
    created_at: "2026-08-07T00:00:00.000Z",
    updated_at: "2026-08-07T00:00:00.000Z",
    ...overrides,
  };
}

const selectedContract = {
  contract_id: "CTR-090",
  contract_name: "Sales Platform Agreement 3",
  vendor_name: "Northstar Software",
};

describe("Source workspace contract optimization route helpers", () => {
  it("rejects a stale optimization event that only shares the contract id", () => {
    const staleEvent = event({
      event_name: "Client A AMS Sourcing Event",
      trigger_description: "Optimize Crestline managed services scope.",
      scope_description: "Contract ref: CTR-090.",
    });

    expect(
      __test__.optimizationEventMatchesContract(staleEvent, selectedContract),
    ).toBe(false);
  });

  it("accepts only a contract optimization event scoped to the selected vendor and contract", () => {
    const matchingEvent = event({
      event_code: "CLIE-NORTHSTAR-SALES-PLATFORM-2026-CTR090NO",
      event_name:
        "Northstar Software - Sales Platform Agreement 3 Contract Optimization",
      trigger_description:
        "Optimize incumbent contract CTR-090: Northstar Software - Sales Platform Agreement 3.",
      scope_description:
        "Contract ref: CTR-090. Use governed contract evidence.",
    });

    expect(
      __test__.optimizationEventMatchesContract(
        matchingEvent,
        selectedContract,
      ),
    ).toBe(true);
  });

  it("requires the selected opportunity identity when an opportunity is passed", () => {
    const matchingEvent = event({
      event_code: "CLIE-NORTHSTAR-SALES-PLATFORM-2026-CTR090NORATEVARI",
      event_name:
        "Northstar Software - Sales Platform Agreement 3 Rate variance Optimization",
      trigger_description:
        "Optimize incumbent contract CTR-090: Northstar Software - Sales Platform Agreement 3. Selected opportunity CTR-090:rate-variance: Invoice-line rate variance.",
      scope_description:
        "Contract ref: CTR-090. Opportunity ref: CTR-090:rate-variance. Calculation rule: source.contract_optimization.rate_variance.v1 1.0.0.",
    });
    const genericEvent = event({
      event_code: "CLIE-NORTHSTAR-SALES-PLATFORM-2026-CTR090NO",
      event_name:
        "Northstar Software - Sales Platform Agreement 3 Contract Optimization",
      trigger_description:
        "Optimize incumbent contract CTR-090: Northstar Software - Sales Platform Agreement 3.",
      scope_description:
        "Contract ref: CTR-090. Use governed contract evidence.",
    });

    expect(
      __test__.optimizationEventMatchesContract(
        matchingEvent,
        selectedContract,
        "CTR-090:rate-variance",
      ),
    ).toBe(true);
    expect(
      __test__.optimizationEventMatchesContract(
        genericEvent,
        selectedContract,
        "CTR-090:rate-variance",
      ),
    ).toBe(false);
  });

  it("keeps generated event identity specific to vendor and contract", () => {
    expect(
      __test__.optimizationEventName({
        contractId: "CTR-090",
        contractName: "Sales Platform Agreement 3",
        vendorName: "Northstar Software",
      }),
    ).toBe(
      "Northstar Software - Sales Platform Agreement 3 Contract Optimization",
    );
    expect(
      __test__.optimizationCreationRequestId({
        contractId: "CTR-090",
        vendorName: "Northstar Software",
      }),
    ).toBe("CTR090NO");
  });

  it("returns the visible optimization checkpoint when an existing event carries a skipped stage key", () => {
    const existingEvent = event({
      sourcing_motion: "contract_optimization",
      current_stage_key: "rfp",
    });

    expect(__test__.optimizationEventUrl(existingEvent)).toBe(
      "/source/events/event-1?stage=pricing",
    );
  });

  it("writes selected opportunity context into the optimization event brief fields", () => {
    const opportunity = {
      opportunityId: "CTR-090:rate-variance",
      label: "Invoice-line rate variance",
      shortLabel: "Rate variance",
      amountUsd: 364_554,
      stage: "validated" as const,
      evidenceGrade: "system_evidenced" as const,
      calculation: {
        ruleId: "source.contract_optimization.rate_variance.v1",
        ruleVersion: "1.0.0",
        includedLineCount: 4,
        pendingLineCount: 2,
        excludedLineCount: 42,
      },
      blockingGap: null,
      nextAction: "Review the included invoice lines.",
    };

    expect(
      __test__.optimizationEventName({
        contractId: "CTR-090",
        contractName: "Sales Platform Agreement 3",
        vendorName: "Northstar Software",
        selectedOpportunity: opportunity,
      }),
    ).toBe(
      "Northstar Software - Sales Platform Agreement 3 Rate variance Optimization",
    );
    expect(
      __test__.optimizationCreationRequestId({
        contractId: "CTR-090",
        vendorName: "Northstar Software",
        selectedOpportunity: opportunity,
      }),
    ).toBe("CTR090NOVARIANCE");
    expect(
      __test__.optimizationTriggerDescription({
        contractId: "CTR-090",
        contractName: "Sales Platform Agreement 3",
        vendorName: "Northstar Software",
        selectedOpportunity: opportunity,
      }),
    ).toContain("Selected opportunity CTR-090:rate-variance");
    expect(
      __test__.optimizationScopeDescription({
        contractId: "CTR-090",
        selectedOpportunity: opportunity,
        baselineHeadline: "Commercial baseline reconciles.",
        baselineDetail: "Pricing schedule ties to annual value.",
      }),
    ).toEqual(expect.stringContaining("included 4, pending 2, excluded 42"));
  });
});
