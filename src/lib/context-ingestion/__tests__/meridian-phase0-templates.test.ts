import {
  buildMeridianPhase0TemplatePreflight,
  getMeridianPhase0Template,
  getRequiredMeridianPhase0TemplateIds,
  MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS,
} from "../meridian-phase0-templates";

describe("Meridian phase 0 loader templates", () => {
  it("defines one required template for every manifest object family", () => {
    expect(getRequiredMeridianPhase0TemplateIds()).toEqual([
      "meridian-evidence-register",
      "meridian-uploaded-artifacts",
      "meridian-workload-inventory",
      "meridian-rate-card",
      "meridian-gate-criteria",
      "meridian-approval-records",
    ]);
    expect(
      MERIDIAN_PHASE0_TEMPLATE_DEFINITIONS.map(
        (template) => template.objectType,
      ),
    ).toEqual([
      "evidence_item",
      "uploaded_artifact",
      "workload_record",
      "rate_card_row",
      "gate_criterion",
      "approval_record",
    ]);
  });

  it("preflights a valid workload inventory header row", () => {
    const template = getMeridianPhase0Template("meridian-workload-inventory");
    expect(template?.ownerRole).toBe("CIO delegate");

    const result = buildMeridianPhase0TemplatePreflight({
      templateId: "meridian-workload-inventory",
      headers: [
        "workload_id",
        "workload_name",
        "domain",
        "current_platform",
        "data_sources",
        "phi_level",
        "owner",
        "business_criticality",
        "modernization_disposition",
        "effort_size",
        "risk",
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.missingRequiredFields).toEqual([]);
    expect(result.unknownColumns).toEqual([]);
  });

  it("blocks missing citation keys in the evidence register template", () => {
    const result = buildMeridianPhase0TemplatePreflight({
      templateId: "meridian-evidence-register",
      headers: [
        "title",
        "source_type",
        "owner",
        "evidence_date",
        "sensitivity",
        "confidence",
        "summary",
        "usable_by_surface",
        "random_column",
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.missingRequiredFields).toEqual(["citation_key"]);
    expect(result.unknownColumns).toEqual(["random_column"]);
  });
});
