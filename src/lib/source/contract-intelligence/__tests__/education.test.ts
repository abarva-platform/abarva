import { buildContractEducation } from "../education";

const base = {
  vendorName: "Synthetic Vendor",
  contractName: "Synthetic agreement",
  scopeRows: 0,
  spendRows: 0,
  invoiceRows: 0,
  performanceRows: 0,
  documentRows: 0,
  opportunityRows: 0,
  changeOrderRows: 0,
  hasReviewedPurpose: false,
  hasBenchmarking: false,
};

describe("contract education guide", () => {
  it("selects the cloud commitment loop and names the next evidence move", () => {
    const view = buildContractEducation({
      ...base,
      archetype: "cloud_consumption",
      scopeRows: 3,
      spendRows: 12,
      opportunityRows: 5,
    });

    expect(view.archetypeLabel).toBe("Cloud consumption commitment");
    expect(view.headline).toMatch(/commitment/i);
    expect(view.steps.map((step) => step.title)).toEqual([
      "Track",
      "Load",
      "Observe",
    ]);
    expect(view.steps.find((step) => step.key === "track")?.state).toBe(
      "loaded",
    );
    expect(view.steps.find((step) => step.key === "load")?.state).toBe("next");
    expect(view.state).toBe("partial");
  });

  it("returns a ready managed-services guide when the operating evidence loop is present", () => {
    const view = buildContractEducation({
      ...base,
      archetype: "infra_service_desk_managed_services",
      scopeRows: 5,
      spendRows: 12,
      invoiceRows: 50,
      performanceRows: 12,
      documentRows: 12,
      opportunityRows: 3,
      changeOrderRows: 3,
      hasReviewedPurpose: true,
      hasBenchmarking: true,
    });

    expect(view.archetypeLabel).toBe("Managed services agreement");
    expect(view.state).toBe("ready");
    expect(view.steps.every((step) => step.state === "loaded")).toBe(true);
    expect(view.focus).toMatch(/service demand/i);
  });

  it("never leaves an unmapped archetype without an education path", () => {
    const view = buildContractEducation({ ...base, archetype: null });

    expect(view.archetypeKey).toBe("unmapped");
    expect(view.archetypeLabel).toBe("Contract governance");
    expect(view.steps).toHaveLength(3);
    expect(view.body).not.toHaveLength(0);
    expect(view.state).toBe("blocked");
  });
});
