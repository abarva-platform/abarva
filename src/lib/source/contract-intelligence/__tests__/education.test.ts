import { buildContractEducation, contractEducationFromRecord } from "../education";

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
    expect(view.facetRequirements.Performance.state).toBe("not_required");
    expect(view.facetRequirements.Performance.reason).toMatch(/SLA/i);
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
    expect(view.facetRequirements.Performance.state).toBe("required");
  });

  it("never leaves an unmapped archetype without an education path", () => {
    const view = buildContractEducation({ ...base, archetype: null });

    expect(view.archetypeKey).toBe("unmapped");
    expect(view.archetypeLabel).toBe("Contract governance");
    expect(view.steps).toHaveLength(3);
    expect(view.body).not.toHaveLength(0);
    expect(view.state).toBe("blocked");
  });

  it("prefers the persisted load-time education record when it is available", () => {
    const view = contractEducationFromRecord({
      contract: {
        title: "Synthetic cloud agreement",
        vendor_name: "Synthetic Cloud Vendor",
        archetype_key: "cloud_consumption",
        archetype_label: "Cloud consumption commitment",
      },
      education: {
        archetype_key: "cloud_consumption",
        archetype_label: "Cloud consumption commitment",
        headline: "Manage the commitment against real workload demand.",
        body: "Track the commitment against governed workload evidence.",
        track: {
          question: "Are workloads using what the contract commits?",
          guidance: "Track committed and actual spend by month.",
          state: "loaded",
        },
        load: {
          question: "What makes the consumption number defensible?",
          guidance: "Load the executed paper and billing export.",
          state: "loaded",
        },
        observe: {
          question: "What should change before renewal?",
          guidance: "Watch utilization and the notice window.",
          state: "next",
        },
      },
      review: { status: "partial" },
    });

    expect(view).not.toBeNull();
    expect(view?.headline).toContain("real workload demand");
    expect(view?.steps.map((step) => step.state)).toEqual([
      "loaded",
      "loaded",
      "next",
    ]);
    expect(view?.basis.join(" ")).toContain("load-time governed playbook");
    expect(view?.facetRequirements.Performance.state).toBe("not_required");
  });
});
