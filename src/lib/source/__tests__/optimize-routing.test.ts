import { buildSourceOptimizeContractHref } from "@/lib/source/optimize-routing";

describe("buildSourceOptimizeContractHref", () => {
  it("routes direct optimize entry to the contract picker", () => {
    expect(buildSourceOptimizeContractHref()).toBe("/source/optimize");
    expect(
      buildSourceOptimizeContractHref({ contractId: "   " }),
    ).toBe("/source/optimize");
  });

  it("routes selected contracts into the Optimize Contract module", () => {
    expect(
      buildSourceOptimizeContractHref({ contractId: " CTR-090 " }),
    ).toBe("/source/optimize?contractId=CTR-090");
  });

  it("preserves a selected opportunity without resurrecting the New Event intake", () => {
    expect(
      buildSourceOptimizeContractHref({
        contractId: "CTR-090",
        opportunityId: "opp-rate-card",
      }),
    ).toBe(
      "/source/optimize?contractId=CTR-090&opportunityId=opp-rate-card",
    );
  });
});
