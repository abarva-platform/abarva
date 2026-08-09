import type { ContractOptimizationOpportunity } from "@/lib/source/data-model/contract-optimization-opportunity";
import { withGovernedOpportunityFinding } from "@/lib/source/door1/governed-opportunity-diagnosis";
import type { SourceOptimization } from "@/lib/source/door1/types";

function emptyOptimization(): SourceOptimization {
  return {
    eventId: "event-1",
    archetypeId: "software",
    baseline: {
      eventId: "event-1",
      archetypeId: "software",
      factCount: 0,
      presentFactKeys: [],
    },
    diagnosis: {
      eventId: "event-1",
      archetypeId: "software",
      findings: [],
      needsEvidence: [],
      unlockFactKeys: [],
    },
    bridge: {
      eventId: "event-1",
      bands: [],
      recoverableLow: 0,
      recoverableHigh: 0,
      protectedLow: 0,
      protectedHigh: 0,
      confidence: "low",
      unit: "usd",
    },
    play: {
      kind: "renegotiate",
      rationale: "No quantified findings.",
      asks: [],
      handoff: null,
    },
  };
}

function opportunity(
  overrides: Partial<ContractOptimizationOpportunity> = {},
): ContractOptimizationOpportunity {
  return {
    opportunityId: "CTR-090:rate-variance",
    contractId: "CTR-090",
    label: "Invoice billing-rate variance",
    shortLabel: "Billing-rate variance",
    valueType: "recoverable_leakage",
    amountUsd: 364_554,
    amountState: "exact",
    stage: "quantified",
    evidenceGrade: "system_evidenced",
    confidence: 0.91,
    deadline: "2031-02-28",
    owner: "Procurement owner",
    blockingGap: null,
    nextAction: "Prepare supplier recovery claim from included invoice lines.",
    sourceSystems: ["AP / ERP"],
    evidenceRefs: [
      {
        sourceSystem: "AP / ERP",
        tableName: "source.golden_contract_invoice_lines",
        sourceRecordId: "INV-1-A",
        sourceFileReport: "invoice_lines.csv",
        pageSpan: null,
        reviewState: "system_evidenced",
      },
    ],
    calculation: null,
    overlapTreatment: "Included once.",
    approvalState: "requires_amendment_exception_review",
    narrative: "Invoice lines exceed operative contract rates.",
    ...overrides,
  };
}

describe("withGovernedOpportunityFinding", () => {
  it("turns a selected quantified governed opportunity into a Door 1 finding and recoverable range", () => {
    const result = withGovernedOpportunityFinding({
      optimization: emptyOptimization(),
      opportunity: opportunity(),
    });

    expect(result.diagnosis.findings).toHaveLength(1);
    expect(result.diagnosis.findings[0]).toMatchObject({
      ruleKey: "CTR-090:rate-variance",
      low: 364_554,
      high: 364_554,
      status: "computed",
      recoveryBucket: "risk_adjusted",
    });
    expect(result.bridge.recoverableLow).toBe(364_554);
    expect(result.bridge.recoverableHigh).toBe(364_554);
    expect(result.play.asks[0]).toMatchObject({
      ruleKey: "CTR-090:rate-variance",
      low: 364_554,
      high: 364_554,
    });
  });

  it("does not bridge conflicted opportunities into recoverable value", () => {
    const result = withGovernedOpportunityFinding({
      optimization: emptyOptimization(),
      opportunity: opportunity({
        amountUsd: null,
        amountState: "not_sized",
        stage: "baseline_conflict",
      }),
    });

    expect(result.diagnosis.findings).toHaveLength(0);
    expect(result.bridge.recoverableLow).toBe(0);
    expect(result.bridge.recoverableHigh).toBe(0);
  });
});
