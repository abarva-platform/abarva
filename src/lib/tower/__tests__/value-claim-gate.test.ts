import {
  evaluateTowerValueClaimGate,
  TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE,
} from "../value-claim-gate";

describe("Tower value claim gate", () => {
  it("blocks realized-value language when measured evidence is not v3-reconciled", () => {
    const claim = evaluateTowerValueClaimGate({
      claimId: "claim-1",
      claimKind: "realized_value",
      label: "Measured value YTD",
      value: 12_000_000,
      valueType: "currency",
      sourceFactIds: ["bridge-fact-1"],
      evidenceIds: ["bridge-evidence-1"],
      evidenceAuthorities: ["derived"],
      v3Reconciled: false,
    });

    expect(claim.gateStatus).toBe("blocked");
    expect(claim.realizedValueLanguageAllowed).toBe(false);
    expect(claim.reason).toBe(TOWER_REALIZED_VALUE_REQUIRES_MEASURED_EVIDENCE);
    expect(claim.requiredEvidence).toContain("v3 canonical fact reconciliation");
  });

  it("allows measured-value language only when reconciled evidence exists", () => {
    const claim = evaluateTowerValueClaimGate({
      claimId: "claim-2",
      claimKind: "measured_value",
      label: "Finance-attested savings",
      value: 8_500_000,
      valueType: "currency",
      sourceFactIds: ["v3-fact-1"],
      evidenceIds: ["evidence-1"],
      evidenceAuthorities: ["authoritative"],
      v3Reconciled: true,
    });

    expect(claim.gateStatus).toBe("allowed");
    expect(claim.realizedValueLanguageAllowed).toBe(true);
  });

  it("keeps planned and promised value caveated instead of realized", () => {
    const claim = evaluateTowerValueClaimGate({
      claimId: "claim-3",
      claimKind: "promised_value",
      label: "Committed business-case value",
      value: 25_000_000,
      valueType: "currency",
      sourceFactIds: ["v3-fact-2"],
      evidenceIds: ["evidence-2"],
      evidenceAuthorities: ["supporting"],
      v3Reconciled: true,
    });

    expect(claim.gateStatus).toBe("caveated");
    expect(claim.realizedValueLanguageAllowed).toBe(false);
    expect(claim.reason).toMatch(/planned, promised, or forecast value/i);
  });
});
