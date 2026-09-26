import {
  assessSourceReadModelContract,
  classifySourceReadModelDeclaration,
  SOURCE_READ_MODEL_INVENTORY,
  SOURCE_READ_MODEL_STALE_BEHAVIORS,
  type SourceReadModelContractField,
  type SourceReadModelDefinition,
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

/**
 * A declaration that satisfies the contract, used as the base every case below
 * mutates ONE field of. Built from a live inventory row so the shape cannot
 * drift away from the type without this file noticing.
 */
const contracted: SourceReadModelDefinition = {
  ...SOURCE_READ_MODEL_INVENTORY[0],
  canonicalInputs: ["canonical.source_event"],
  keys: ["tenant_key", "event_id"],
  asOf: "accepted_source_version",
  reconciliationEquation: "accepted_count = output_count + rejected_count",
  denominator: "accepted_count",
  tenantFence: "tenant_key = current_setting('app.tenant_key')",
  oppositeTenantQuery: "requested tenant != row tenant_key -> zero rows",
  freshnessSla: "1 hour",
  owner: "Source data-plane owner",
  projectionTrigger: "accepted source version",
  staleBehavior: "block",
  fieldAuthority: "accepted canonical facts",
  buildJob: "governed ACA data-build job",
};

describe("Source read-model build inventory", () => {
  it("enumerates the proposed set without calling a proposal deployed", () => {
    expect(SOURCE_READ_MODEL_INVENTORY.map((model) => model.id).sort()).toEqual(expectedModels);
    expect(SOURCE_READ_MODEL_INVENTORY.every((model) => model.state === "proposed")).toBe(true);
    expect(SOURCE_READ_MODEL_INVENTORY.every((model) => model.grain && model.consumingSurface)).toBe(true);
  });

  it("requires every field before metadata can be considered complete", () => {
    expect(assessSourceReadModelContract(contracted)).toEqual({
      metadataComplete: true,
      missing: [],
      invalid: [],
    });
    for (const field of [
      "tenantFence",
      "oppositeTenantQuery",
      "reconciliationEquation",
      "freshnessSla",
    ] as const) {
      const assessment = assessSourceReadModelContract({ ...contracted, [field]: "" });
      expect(assessment.missing).toContain(field);
      expect(assessment.metadataComplete).toBe(false);
    }
  });

  it("reports an undeclared model as incomplete and names what it owes", () => {
    // A synthetic bare row, NOT a live inventory id: the case this replaces
    // asserted that `event_queue_v1` specifically was incomplete, which would
    // have inverted to red the day somebody completed that declaration.
    const bare: SourceReadModelDefinition = {
      id: "synthetic_bare_v1",
      state: "proposed",
      grain: "tenant + event",
      consumingSurface: "test only",
    };
    const assessment = assessSourceReadModelContract(bare);
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.missing).toEqual(
      expect.arrayContaining([
        "canonicalInputs",
        "reconciliationEquation",
        "tenantFence",
        "oppositeTenantQuery",
        "buildJob",
        "owner",
        "freshnessSla",
      ]),
    );
    expect(classifySourceReadModelDeclaration(bare).state).toBe("undeclared");
  });

  // ── The contract is over VALUES, not presence (item D-031) ─────────────────
  // Every case below declares all 13 fields, so the presence check this
  // replaced passed each one with `{ metadataComplete: true, missing: [] }`.

  it("rejects a stale behaviour that is not fail-closed", () => {
    for (const declared of [
      "serve stale silently",
      "serve last known good",
      "stale ok",
      "best effort",
    ]) {
      const assessment = assessSourceReadModelContract({
        ...contracted,
        staleBehavior: declared,
      });
      expect(assessment.metadataComplete).toBe(false);
      expect(assessment.invalid.map((violation) => violation.field)).toContain("staleBehavior");
    }
    for (const declared of SOURCE_READ_MODEL_STALE_BEHAVIORS) {
      expect(
        assessSourceReadModelContract({ ...contracted, staleBehavior: declared })
          .metadataComplete,
      ).toBe(true);
    }
  });

  it("rejects a tenant fence that does not name the tenant key", () => {
    const assessment = assessSourceReadModelContract({
      ...contracted,
      tenantFence: "none — any tenant may read any row",
    });
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.invalid.map((violation) => violation.field)).toContain("tenantFence");
  });

  it("rejects an opposite-tenant query that does not state denial", () => {
    const assessment = assessSourceReadModelContract({
      ...contracted,
      oppositeTenantQuery: "returns the other tenant's rows",
    });
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.invalid.map((violation) => violation.field)).toContain(
      "oppositeTenantQuery",
    );
  });

  it("rejects a grain whose keys are not tenant-scoped", () => {
    const assessment = assessSourceReadModelContract({
      ...contracted,
      keys: ["event_id"],
    });
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.invalid.map((violation) => violation.field)).toContain("keys");
  });

  it("rejects a freshness SLA that states no duration a read can exceed", () => {
    const assessment = assessSourceReadModelContract({
      ...contracted,
      freshnessSla: "as fresh as possible",
    });
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.invalid.map((violation) => violation.field)).toContain("freshnessSla");
  });

  it("rejects an as-of that names no field to preserve", () => {
    const assessment = assessSourceReadModelContract({
      ...contracted,
      asOf: "whenever the job last ran",
    });
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.invalid.map((violation) => violation.field)).toContain("asOf");
  });

  it("rejects a placeholder in any required field", () => {
    const placeholderFields: readonly SourceReadModelContractField[] = [
      "owner",
      "buildJob",
      "projectionTrigger",
      "fieldAuthority",
      "denominator",
      "reconciliationEquation",
    ];
    for (const field of placeholderFields) {
      for (const placeholder of ["TBD", "n/a", "none", "-", "?"]) {
        const assessment = assessSourceReadModelContract({
          ...contracted,
          [field]: placeholder,
        });
        expect(assessment.metadataComplete).toBe(false);
        expect(assessment.invalid.map((violation) => violation.field)).toContain(field);
      }
    }
    // Arrays are checked entry by entry, not by length.
    expect(
      assessSourceReadModelContract({ ...contracted, canonicalInputs: ["tbd"] })
        .invalid.map((violation) => violation.field),
    ).toContain("canonicalInputs");
  });

  it("certifies nothing when a declaration states the opposite of every invariant", () => {
    // The exact declaration that returned `{ metadataComplete: true, missing: [] }`
    // from the presence check, measured on origin/main 1526110e7 before D-031.
    const hostile: SourceReadModelDefinition = {
      ...contracted,
      keys: ["event_id"],
      asOf: "-",
      tenantFence: "none — any tenant may read any row",
      oppositeTenantQuery: "returns the other tenant's rows",
      freshnessSla: "whenever",
      owner: "TBD",
      staleBehavior: "serve stale silently",
      buildJob: "none",
    };
    const assessment = assessSourceReadModelContract(hostile);
    expect(assessment.metadataComplete).toBe(false);
    expect(assessment.missing).toEqual([]);
    expect(assessment.invalid.map((violation) => violation.field).sort()).toEqual([
      "asOf",
      "buildJob",
      "freshnessSla",
      "keys",
      "oppositeTenantQuery",
      "owner",
      "staleBehavior",
      "tenantFence",
    ]);
    // Each violation says why, not just that.
    for (const violation of assessment.invalid) {
      expect(violation.reason.length).toBeGreaterThan(20);
    }
  });

  // ── The live-inventory assertion that cannot invert ────────────────────────

  it("holds no half-declared model — a partial declaration reads as documented and is not", () => {
    const states = SOURCE_READ_MODEL_INVENTORY.map((model) => ({
      id: model.id,
      state: classifySourceReadModelDeclaration(model).state,
    }));
    expect(states.filter((entry) => entry.state === "partial")).toEqual([]);
    // Today every model is `undeclared`; this case stays green when one becomes
    // `contracted` and fails when one is half-filled. It is asserted over the
    // live inventory, so the next line proves it is not vacuous: the same rule
    // applied to a half-declared model fails.
    expect(
      classifySourceReadModelDeclaration({
        ...contracted,
        buildJob: undefined,
        owner: undefined,
      }).state,
    ).toBe("partial");
    expect(classifySourceReadModelDeclaration(contracted).state).toBe("contracted");
  });

  it("counts declared fields from the declaration, not from the inventory's age", () => {
    expect(classifySourceReadModelDeclaration(contracted).declaredFieldCount).toBe(13);
    expect(
      classifySourceReadModelDeclaration(SOURCE_READ_MODEL_INVENTORY[0]).declaredFieldCount,
    ).toBe(0);
    expect(
      classifySourceReadModelDeclaration({ ...contracted, asOf: undefined })
        .declaredFieldCount,
    ).toBe(12);
  });
});
