import { assembleMartFromFacts } from "../assemble-mart";
import { projectSourceContractDepthToFacts } from "../facts-from-source-contracts";
import {
  factSatisfiesValueInvariant,
  readCanonicalIdentity,
  SOURCE_PRIORITY,
  type CioTowerTenantIdentity,
} from "../facts-schema";

const IDENTITY: CioTowerTenantIdentity = {
  tenantKey: "meridian-health",
  clientId: "00000000-0000-0000-0000-000000000001",
  tenantName: "Healthcare Demo",
};

describe("projectSourceContractDepthToFacts", () => {
  it("turns Source contract opportunities into Tower facts without finance-validating them", () => {
    const facts = projectSourceContractDepthToFacts(
      {
        contracts: [
          {
            contract_id: "MER-TECH-AMS-001",
            contract_name: "Application Managed Services",
            vendor_name: "Cognizant",
            annual_contract_value: "8600000",
            actual_annual_spend: "8550000",
            authority_state: "accepted",
            quality_state: "reviewed",
            knowledge_baseline_ref: "load-run",
          },
        ],
        opportunities: [
          {
            opportunity_id: "OPT-AMS-CREDITS-001",
            contract_id: "MER-TECH-AMS-001",
            vendor_name: "Cognizant",
            title: "Unclaimed SLA credits",
            annual_value_exposed: "37000",
            readiness_state: "finance_confirmation_required",
            evidence_state: "present",
            recommended_action: "Prepare credit claim",
            accountable_role: "IT vendor management",
            knowledge_baseline_ref: "dataset:opportunity",
          },
        ],
        performance: [
          {
            contract_id: "MER-TECH-AMS-001",
            breached_periods: "3",
            credit_calculated: "37000",
            credit_claimed: "0",
            credit_recovered: "0",
            evidence_rows: "12",
            knowledge_baseline_ref: "load-run",
          },
        ],
      },
      IDENTITY,
    );

    expect(facts).toHaveLength(5);
    expect(facts.every(factSatisfiesValueInvariant)).toBe(true);
    expect(facts.every((fact) => fact.value_source === "synthetic")).toBe(true);
    expect(facts.every((fact) => fact.tenant_key === "meridian-health")).toBe(true);
    expect(facts.some((fact) => fact.measure.includes("opportunity value"))).toBe(true);
    expect(
      facts.some((fact) => fact.measure.includes("unclaimed service credits")),
    ).toBe(true);

    for (const fact of facts) {
      const canonical = readCanonicalIdentity(fact);
      expect(canonical?.canonical_program_key).toBe("contract::mer-tech-ams-001");
      expect(canonical?.source_priority).toBe(SOURCE_PRIORITY.synthetic);
      expect(JSON.parse(fact.attributes).synthetic_policy).toBe(
        "synthetic_demo_only_not_client_truth",
      );
    }

    expect(
      facts.some((fact) =>
        fact.attributes.includes('"finance_confirmation_state":"not_confirmed"'),
      ),
    ).toBe(true);
  });

  it("lets the Tower mart create Source handoff actions for contract opportunities", () => {
    const facts = projectSourceContractDepthToFacts(
      {
        contracts: [
          {
            contract_id: "MER-TECH-SFDC-001",
            contract_name: "Salesforce Enterprise Platform",
            vendor_name: "Salesforce",
            annual_contract_value: 7_800_000,
            actual_annual_spend: 7_760_000,
            authority_state: "accepted",
            quality_state: "reviewed",
            knowledge_baseline_ref: "load-run",
          },
        ],
        opportunities: [
          {
            opportunity_id: "OPT-SFDC-SHELFWARE-001",
            contract_id: "MER-TECH-SFDC-001",
            vendor_name: "Salesforce",
            title: "Shelfware reduction",
            annual_value_exposed: 1_350_000,
            readiness_state: "finance_confirmation_required",
            evidence_state: "present",
            recommended_action: "Run license reclamation",
            accountable_role: "Software asset management",
            knowledge_baseline_ref: "dataset:opportunity",
          },
        ],
      },
      IDENTITY,
    );

    const mart = assembleMartFromFacts(facts, {
      tenantKey: "meridian-health",
      tenantName: "Healthcare Demo",
      martVersion: "tower_command_mart_v1",
      formulaVersion: "unified_facts_v1",
      sourceStandard: "source-contract-depth-v1",
    });

    expect(mart.program_decision_lanes).toHaveLength(1);
    expect(mart.program_decision_lanes[0].decision_lane).toBe("fix");
    expect(mart.program_decision_lanes[0].tower_claim_allowed).toBe("no");
    expect(mart.program_decision_lanes[0].amount_blocked).toBe(1_350_000);
    expect(mart.program_decision_lanes[0].decision_rationale).toContain(
      "finance confirmation",
    );

    const sourceAction = mart.cxo_actions.find(
      (action) => action.program_id === "MER-TECH-SFDC-001",
    );
    expect(sourceAction?.module_handoff).toBe("Source");
    expect(sourceAction?.amount_exposed).toBe(1_350_000);
  });
});
