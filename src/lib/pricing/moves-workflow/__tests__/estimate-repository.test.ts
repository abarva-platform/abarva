import {
  createDraftEstimate,
  getEstimate,
  listEstimateInputs,
  listLineItems,
  replaceLineItems,
  updateEstimateHeader,
  upsertEstimateInputs,
  type EstimateWorkflowStorePort,
} from "../estimate-repository";
import type { PricingEstimateInputRow, PricingEstimateLineItemRow, PricingEstimateRow } from "../../types";

/** A fully in-memory fake of the store port — proves the service functions' CONTRACT without a live database. */
function createFakeStore(): EstimateWorkflowStorePort & { estimates: Map<string, PricingEstimateRow>; inputs: Map<string, PricingEstimateInputRow[]>; lineItems: Map<string, PricingEstimateLineItemRow[]> } {
  const estimates = new Map<string, PricingEstimateRow>();
  const inputs = new Map<string, PricingEstimateInputRow[]>();
  const lineItems = new Map<string, PricingEstimateLineItemRow[]>();

  return {
    estimates,
    inputs,
    lineItems,
    async insertEstimate(row) {
      estimates.set(row.id, row);
    },
    async getEstimateById(estimateId) {
      return estimates.get(estimateId) ?? null;
    },
    async updateEstimateHeader(estimateId, patch) {
      const existing = estimates.get(estimateId);
      if (!existing) return;
      const camel: Record<string, unknown> = {};
      for (const [col, value] of Object.entries(patch)) {
        camel[col] = value;
      }
      estimates.set(estimateId, { ...existing, ...(camel as Partial<PricingEstimateRow>), updated_at: new Date().toISOString() });
    },
    async listEstimateInputs(estimateId) {
      return inputs.get(estimateId) ?? [];
    },
    async upsertEstimateInputs(estimateId, rows) {
      const existing = inputs.get(estimateId) ?? [];
      const byKey = new Map(existing.map((r) => [r.input_key, r]));
      for (const row of rows) byKey.set(row.input_key, row);
      inputs.set(estimateId, Array.from(byKey.values()));
    },
    async listLineItems(estimateId) {
      return lineItems.get(estimateId) ?? [];
    },
    async replaceLineItems(estimateId, rows, runId, ranAt) {
      lineItems.set(estimateId, rows);
      const estimate = estimates.get(estimateId);
      if (estimate) estimates.set(estimateId, { ...estimate, last_run_id: runId, last_run_at: ranAt });
    },
  };
}

const baseInput = {
  tenantKey: "apex-retail",
  moveId: "11111111-1111-1111-1111-111111111111",
  scenarioName: "Traditional",
  archetypeCode: "ARCH-01",
  modelVersion: 1,
};

describe("createDraftEstimate / getEstimate", () => {
  it("creates a draft row with status 'draft' and a fresh scenario_group_id when none is supplied", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    expect(estimate.status).toBe("draft");
    expect(estimate.scenario_group_id).toBeTruthy();
    expect(await getEstimate(estimate.id, store)).toEqual(estimate);
  });

  it("reuses a supplied scenario_group_id (adding a scenario variant to an existing costing exercise)", async () => {
    const store = createFakeStore();
    const groupId = "22222222-2222-2222-2222-222222222222";
    const estimate = await createDraftEstimate({ ...baseInput, scenarioGroupId: groupId, scenarioName: "AI-accelerated" }, store);
    expect(estimate.scenario_group_id).toBe(groupId);
  });
});

describe("updateEstimateHeader", () => {
  it("updates only the patched columns", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await updateEstimateHeader(estimate.id, { currency: "EUR", targetDurationWeeks: 16 }, store);
    const updated = await getEstimate(estimate.id, store);
    expect(updated?.currency).toBe("EUR");
    expect(updated?.target_duration_weeks).toBe(16);
    expect(updated?.scenario_name).toBe("Traditional"); // untouched
  });
});

describe("upsertEstimateInputs — save-after-each-step", () => {
  it("inserts a new input row for a new key", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await upsertEstimateInputs(estimate.id, [{ inputKey: "integration_count", value: 4, sourceType: "client_input" }], store);
    const inputs = await listEstimateInputs(estimate.id, store);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].value).toBe(4);
    expect(inputs[0].confirmed_by).toBeNull();
  });

  it("upserts the SAME row (same id) when saving the same key again — never a duplicate", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await upsertEstimateInputs(estimate.id, [{ inputKey: "integration_count", value: 4, sourceType: "client_input" }], store);
    const [first] = await listEstimateInputs(estimate.id, store);
    await upsertEstimateInputs(estimate.id, [{ inputKey: "integration_count", value: 7, sourceType: "client_input" }], store);
    const inputs = await listEstimateInputs(estimate.id, store);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].id).toBe(first.id);
    expect(inputs[0].value).toBe(7);
  });

  it("never auto-confirms a saved value — confirmedBy must be explicitly passed", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await upsertEstimateInputs(estimate.id, [{ inputKey: "integration_count", value: 4, sourceType: "client_input" }], store);
    const [row] = await listEstimateInputs(estimate.id, store);
    expect(row.confirmed_by).toBeNull();
    expect(row.confirmed_at).toBeNull();
  });

  it("marks confirmed_at when confirmedBy is explicitly passed", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await upsertEstimateInputs(estimate.id, [{ inputKey: "integration_count", value: 4, sourceType: "client_input", confirmedBy: "person-1" }], store);
    const [row] = await listEstimateInputs(estimate.id, store);
    expect(row.confirmed_by).toBe("person-1");
    expect(row.confirmed_at).not.toBeNull();
  });
});

function fakeLineItemInsert(overrides: Partial<PricingEstimateLineItemRow> = {}): Omit<PricingEstimateLineItemRow, "id" | "estimate_id" | "tenant_key" | "run_id" | "created_at"> {
  return {
    archetype_code: "ARCH-01",
    activity_pack_code: "AP-TECH-AI-02",
    activity_pack_name: "GenAI Build",
    category: "technical",
    rule_code: "R1",
    operation: "per_unit_hours",
    driver_code: "integration_count",
    driver_quantity: 4,
    model_version: 1,
    scenario_key: "traditional",
    classification: "initiative_specific",
    shared_cost_ref: null,
    role_code: "ROL-001",
    allocation_pct: 100,
    raw_hours: 40,
    complexity_factor: 1,
    novelty_factor: 1,
    assurance_factor: 1,
    scenario_factor: 1,
    expected_hours: 40,
    role_hours: 40,
    rate_resolved_from_scope: "client",
    rate_hourly_cents: 20000,
    rate_currency: "USD",
    rate_card_version_id: null,
    labor_cost_cents: 800000,
    manual_cost_cents: null,
    gap_reason: null,
    override_rationale: null,
    formula_trace: "trace",
    ...overrides,
  };
}

describe("replaceLineItems — replace-on-rerun", () => {
  it("persists a fresh run's line items", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    const { runId } = await replaceLineItems(estimate.id, "apex-retail", [fakeLineItemInsert()], store);
    const lines = await listLineItems(estimate.id, store);
    expect(lines).toHaveLength(1);
    expect(lines[0].run_id).toBe(runId);
  });

  it("running the estimate AGAIN replaces the prior line items — no duplicate/stale rows survive", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);

    const firstRun = await replaceLineItems(estimate.id, "apex-retail", [fakeLineItemInsert({ rule_code: "R1", labor_cost_cents: 800000 })], store);
    const afterFirst = await listLineItems(estimate.id, store);
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0].run_id).toBe(firstRun.runId);

    // Second run with a DIFFERENT line-item set (e.g. the user changed a
    // scope-driver quantity and re-ran) — the prior run's row must be gone,
    // not accumulated alongside the new one.
    const secondRun = await replaceLineItems(
      estimate.id,
      "apex-retail",
      [
        fakeLineItemInsert({ rule_code: "R1", labor_cost_cents: 900000 }),
        fakeLineItemInsert({ rule_code: "R2", activity_pack_code: "AP-TECH-AI-01", labor_cost_cents: 100000 }),
      ],
      store,
    );
    const afterSecond = await listLineItems(estimate.id, store);

    expect(afterSecond).toHaveLength(2); // not 3 — the first run's single row did not survive
    expect(afterSecond.every((row) => row.run_id === secondRun.runId)).toBe(true);
    expect(afterSecond.some((row) => row.labor_cost_cents === 800000)).toBe(false); // stale first-run value is gone
    expect(secondRun.runId).not.toBe(firstRun.runId);

    const updatedEstimate = await getEstimate(estimate.id, store);
    expect(updatedEstimate?.last_run_id).toBe(secondRun.runId);
  });

  it("running with an EMPTY line-item set still clears any prior run's rows", async () => {
    const store = createFakeStore();
    const estimate = await createDraftEstimate(baseInput, store);
    await replaceLineItems(estimate.id, "apex-retail", [fakeLineItemInsert()], store);
    await replaceLineItems(estimate.id, "apex-retail", [], store);
    expect(await listLineItems(estimate.id, store)).toHaveLength(0);
  });
});
