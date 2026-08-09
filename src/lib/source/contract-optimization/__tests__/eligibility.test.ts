import { isContractOptimizationEvent } from "../eligibility";

describe("isContractOptimizationEvent", () => {
  it("classifies contract optimization by motion language, not tenant identity", () => {
    expect(
      isContractOptimizationEvent({
        activeClientKey: "skyharbor",
        eventCode: "SRC-001",
        eventName: "Optimize incumbent contract before renewal",
      }),
    ).toBe(true);
    expect(
      isContractOptimizationEvent({
        activeClientKey: "tenant-b",
        eventCode: "MRD-CLM-014",
        eventName: "Renegotiate clinical SaaS agreement and rate card",
      }),
    ).toBe(true);
  });

  it("does not classify unrelated competitive sourcing work as optimization", () => {
    expect(
      isContractOptimizationEvent({
        activeClientKey: "tenant-b",
        eventCode: "MRD-RFP-001",
        eventName: "New analytics platform RFP",
      }),
    ).toBe(false);
  });
});
