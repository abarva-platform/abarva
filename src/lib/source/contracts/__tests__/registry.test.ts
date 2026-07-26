import { SOURCE_ARTIFACT_SPECS } from "@/lib/source/canonical-specs/artifact-specs";
import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from "@/lib/source/constants";
import {
  contractsForStage,
  getSourceArtifactContract,
  isArtifactEligibleAtStage,
  listSourceArtifactContracts,
  missingRequiredUpstream,
  requireSourceArtifactContract,
  SourceArtifactContractSchema,
} from "../registry";

describe("SourceArtifactContract registry", () => {
  it("has exactly one contract entry per canonical-specs/artifact-specs.ts code — no missing, no duplicate", () => {
    const contracts = listSourceArtifactContracts();
    expect(contracts).toHaveLength(SOURCE_ARTIFACT_SPECS.length);
    const specCodes = SOURCE_ARTIFACT_SPECS.map((s) => s.code).sort();
    const contractCodes = contracts.map((c) => c.code).sort();
    expect(contractCodes).toEqual(specCodes);
  });

  it("every contract entry passes the runtime schema", () => {
    for (const contract of listSourceArtifactContracts()) {
      const result = SourceArtifactContractSchema.safeParse(contract);
      if (!result.success) {
        throw new Error(
          `${contract.code} failed schema validation: ${result.error.message}`,
        );
      }
    }
  });

  it("every required/optional upstream reference is a real, registered artifact code", () => {
    const knownCodes = new Set(listSourceArtifactContracts().map((c) => c.code));
    for (const contract of listSourceArtifactContracts()) {
      for (const upstream of [
        ...contract.requiredUpstreamArtifacts,
        ...contract.optionalUpstreamArtifacts,
      ]) {
        expect(knownCodes.has(upstream)).toBe(true);
      }
    }
  });

  it("no artifact declares itself as its own upstream requirement", () => {
    for (const contract of listSourceArtifactContracts()) {
      expect(contract.requiredUpstreamArtifacts).not.toContain(contract.code);
      expect(contract.optionalUpstreamArtifacts).not.toContain(contract.code);
    }
  });

  it("the required-upstream dependency graph has no cycles", () => {
    const byCode = new Map(
      listSourceArtifactContracts().map((c) => [c.code, c]),
    );
    function hasCycle(
      code: string,
      visiting: Set<string>,
      visited: Set<string>,
    ): boolean {
      if (visited.has(code)) return false;
      if (visiting.has(code)) return true;
      visiting.add(code);
      const contract = byCode.get(code);
      for (const upstream of contract?.requiredUpstreamArtifacts ?? []) {
        if (hasCycle(upstream, visiting, visited)) return true;
      }
      visiting.delete(code);
      visited.add(code);
      return false;
    }
    const visited = new Set<string>();
    for (const code of byCode.keys()) {
      expect(hasCycle(code, new Set(), visited)).toBe(false);
    }
  });

  it("allowedGenerationStages always starts at the artifact's own stage and runs to the end of SOURCE_STAGE_ORDER", () => {
    for (const contract of listSourceArtifactContracts()) {
      const ownIndex = SOURCE_STAGE_ORDER.indexOf(contract.sourcingStage);
      expect(contract.allowedGenerationStages).toEqual(
        SOURCE_STAGE_ORDER.slice(ownIndex),
      );
    }
  });

  it("getSourceArtifactContract returns null, requireSourceArtifactContract throws, for an unknown code", () => {
    expect(getSourceArtifactContract("d99_does_not_exist")).toBeNull();
    expect(() =>
      requireSourceArtifactContract("d99_does_not_exist"),
    ).toThrow(/no contract registered/);
  });

  it("contractsForStage returns only artifacts declared at that stage", () => {
    const scopeContracts = contractsForStage("scope");
    expect(scopeContracts.length).toBeGreaterThan(0);
    for (const c of scopeContracts) {
      expect(c.sourcingStage).toBe("scope");
    }
  });

  it("isArtifactEligibleAtStage: d24_decision_brief (stage=executive_decision) is not eligible at scope, but is eligible at executive_decision and every later stage", () => {
    expect(isArtifactEligibleAtStage("d24_decision_brief", "scope")).toBe(
      false,
    );
    expect(isArtifactEligibleAtStage("d24_decision_brief", "rfp")).toBe(
      false,
    );
    expect(
      isArtifactEligibleAtStage("d24_decision_brief", "executive_decision"),
    ).toBe(true);
    expect(isArtifactEligibleAtStage("d24_decision_brief", "selection")).toBe(
      true,
    );
    expect(isArtifactEligibleAtStage("d24_decision_brief", "value")).toBe(
      true,
    );
  });

  it("isArtifactEligibleAtStage returns false for an unknown code rather than throwing", () => {
    expect(isArtifactEligibleAtStage("d99_does_not_exist", "strategy")).toBe(
      false,
    );
  });

  it("missingRequiredUpstream reports exactly the gap for d09_rfp_pack (requires d01, d05)", () => {
    expect(
      missingRequiredUpstream("d09_rfp_pack", new Set()),
    ).toEqual(["d01_strategy_memo", "d05_scope_memo"]);
    expect(
      missingRequiredUpstream(
        "d09_rfp_pack",
        new Set(["d01_strategy_memo"]),
      ),
    ).toEqual(["d05_scope_memo"]);
    expect(
      missingRequiredUpstream(
        "d09_rfp_pack",
        new Set(["d01_strategy_memo", "d05_scope_memo"]),
      ),
    ).toEqual([]);
  });

  it("d01_strategy_memo has no required upstream — it is the entry point", () => {
    const contract = requireSourceArtifactContract("d01_strategy_memo");
    expect(contract.requiredUpstreamArtifacts).toEqual([]);
    expect(contract.sourcingStage).toBe("strategy");
  });

  it("consulting-grade gate codes (d01/d05/d09/d24/d27) get consulting_grade_review_required and consulting_grade quality bar", () => {
    for (const code of [
      "d01_strategy_memo",
      "d05_scope_memo",
      "d09_rfp_pack",
      "d24_decision_brief",
      "d27_selection_memo",
    ]) {
      const contract = requireSourceArtifactContract(code);
      expect(contract.reviewRequirement).toBe(
        "consulting_grade_review_required",
      );
      expect(contract.qualityBarProfile).toBe("consulting_grade");
    }
  });

  it("decision-stage artifacts (d24, d27) require the steward sign-off (d26) as a finality precondition", () => {
    expect(
      requireSourceArtifactContract("d24_decision_brief")
        .finalityConditions?.requiresSiblingArtifactsAccepted,
    ).toEqual(["d26_steward_signoff"]);
    expect(
      requireSourceArtifactContract("d27_selection_memo")
        .finalityConditions?.requiresSiblingArtifactsAccepted,
    ).toEqual(["d26_steward_signoff"]);
  });

  it("strategy/scope-stage artifacts have no finality conditions — finality is a decision/selection-stage concept only", () => {
    expect(
      requireSourceArtifactContract("d01_strategy_memo").finalityConditions,
    ).toBeNull();
    expect(
      requireSourceArtifactContract("d05_scope_memo").finalityConditions,
    ).toBeNull();
  });

  it("requiresVendorEventContext is false before rfp and true from rfp onward", () => {
    expect(
      requireSourceArtifactContract("d01_strategy_memo")
        .requiresVendorEventContext,
    ).toBe(false);
    expect(
      requireSourceArtifactContract("d05_scope_memo")
        .requiresVendorEventContext,
    ).toBe(false);
    expect(
      requireSourceArtifactContract("d09_rfp_pack").requiresVendorEventContext,
    ).toBe(true);
    expect(
      requireSourceArtifactContract("d32_value_ledger")
        .requiresVendorEventContext,
    ).toBe(true);
  });

  it("no contract claims RLS-enforced tenant isolation — that posture belongs only to VendorProposalFact, which is not a d-code artifact in this registry", () => {
    for (const contract of listSourceArtifactContracts()) {
      expect(contract.tenantIsolationPosture).toBe(
        "standard_application_layer_tenant_scoping",
      );
    }
  });

  it("historical legacy stage aliases normalize to a stage every contract actually uses", () => {
    const legacyToCanonical: Record<string, string> = {
      intake: "strategy",
      sourcing_strategy: "strategy",
      rfp_rfi_package: "rfp",
      vendor_responses: "responses",
      orals_bafo: "bafo",
      contract_mobilization: "transition",
      value_realization: "value",
    };
    for (const [legacy, expectedCanonical] of Object.entries(
      legacyToCanonical,
    )) {
      const normalized = normalizeSourceStageKey(legacy);
      expect(normalized).toBe(expectedCanonical);
      // and that canonical stage has at least one real contract at it —
      // confirms the alias actually resolves to a stage this registry knows.
      expect(contractsForStage(normalized as never).length).toBeGreaterThan(
        0,
      );
    }
  });
});
