import {
  assessSourceReadModelContract,
  SOURCE_READ_MODEL_INVENTORY,
} from "@/lib/source/data-model/read-model-inventory";

const expectedModels = [
  "ava_event_context_v1",
  "bafo_movement_v1",
  "decision_packet_v1",
  "evaluation_compare_v1",
  "event_artifact_index_v1",
  "event_gate_v1",
  "event_queue_v1",
  "event_value_v1",
  "industry_context_v1",
  "pricing_compare_v1",
  "response_coverage_v1",
  "supplier_readiness_v1",
  "transition_readiness_v1",
];

describe("Source read-model build inventory", () => {
  it("enumerates the proposed set without calling a proposal deployed", () => {
    expect(SOURCE_READ_MODEL_INVENTORY.map((model) => model.id).sort()).toEqual(expectedModels);
    expect(SOURCE_READ_MODEL_INVENTORY.every((model) => model.state === "proposed")).toBe(true);
    expect(SOURCE_READ_MODEL_INVENTORY.every((model) => model.grain && model.consumingSurface)).toBe(true);
  });

  it("blocks a build when authority, reconciliation, or tenant proof is absent", () => {
    const model = SOURCE_READ_MODEL_INVENTORY.find((item) => item.id === "event_queue_v1");
    expect(model).toBeDefined();
    const result = assessSourceReadModelContract(model!);
    expect(result.metadataComplete).toBe(false);
    expect(result.missing).toEqual(expect.arrayContaining([
      "canonicalInputs", "reconciliationEquation", "tenantFence",
      "oppositeTenantQuery", "buildJob", "owner", "freshnessSla",
    ]));
  });

  it("requires every field before metadata can be considered complete", () => {
    const base = SOURCE_READ_MODEL_INVENTORY[0];
    const complete = {
      ...base,
      canonicalInputs: ["canonical.event"],
      keys: ["tenant_key", "event_id"],
      asOf: "source_version",
      reconciliationEquation: "accepted_count = output_count + rejected_count",
      denominator: "accepted_count",
      tenantFence: "tenant_key = requested_tenant",
      oppositeTenantQuery: "requested_tenant != row.tenant_key -> zero rows",
      freshnessSla: "1 hour",
      owner: "named owner",
      projectionTrigger: "accepted source version",
      staleBehavior: "block",
      fieldAuthority: "accepted canonical facts",
      buildJob: "governed ACA job",
    };
    expect(assessSourceReadModelContract(complete)).toEqual({ metadataComplete: true, missing: [] });
    for (const field of ["tenantFence", "oppositeTenantQuery", "reconciliationEquation", "freshnessSla"] as const) {
      expect(assessSourceReadModelContract({ ...complete, [field]: "" }).missing).toContain(field);
    }
  });
});
