/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's "Move facts appear as
 * suggestions not auto-confirmations."
 *
 * PR5's own honest finding (`move-context-suggestions.ts`'s file header,
 * confirmed again by this PR7 pass) is that the real Move/engagement schema
 * exposes NO structured scope-driver fields today — every scope-driver
 * suggestion is an honest `value: null` gap unless a client pricing-profile
 * assumption happens to match. That makes "Move facts auto-confirming
 * themselves" LARGELY MOOT against real data (there is no real Move fact to
 * wrongly auto-confirm yet) — but the CONTRACT that a suggestion, once ONE
 * genuinely resolves (client-profile match is real and does resolve today),
 * can never silently count as user confirmation is fully testable right
 * now, with real functions, not fabricated Move data:
 *
 *   1. `resolveScopeDriverSuggestions` (real) resolves a genuine value from
 *      a hand-built `pricing_client_profile_values` fixture (a REAL, already
 *      -wired suggestion source — not invented for this test).
 *   2. That suggestion is threaded through `upsertEstimateInputs` (real)
 *      EXACTLY as the wizard would — without an explicit `confirmedBy`,
 *      matching that function's own documented contract ("Omit to leave a
 *      proposed/unconfirmed suggestion untouched").
 *   3. `validateEstimateReadiness` (real, the pure validation gate) is
 *      asserted to STILL BLOCK on that input — a resolved suggestion is not
 *      a settled input — proving the confirmation gate itself enforces the
 *      brief's rule, not merely that the suggestion resolver happens to
 *      leave `confirmed_by` null (which could be true by accident without
 *      the GATE actually caring).
 *   4. Only once the SAME input is re-upserted WITH an explicit
 *      `confirmedBy` (the user's real "accept this" action) does the gate
 *      pass — proving the contract works end-to-end, not just structurally.
 */
import { resolveScopeDriverSuggestions } from "../move-context-suggestions";
import { isInputSettled, validateEstimateReadiness } from "../validation-gate";
import type { EffortEnginePack } from "../../effort-engine/types";
import type { PricingClientProfileValueRow } from "../../types";
import { createEstimateFixtureStore } from "../../__fixtures__/pr7-e2e-harness";

const PACK: EffortEnginePack = {
  modelVersion: 1,
  archetypes: [{ model_version: 1, archetype_code: "ARCH-TEST", archetype_name: "Test", description: null, status: "active" }],
  activityPacks: [
    { model_version: 1, activity_pack_code: "AP-TEST", activity_pack_name: "Test pack", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
  ],
  effortDrivers: [
    { model_version: 1, driver_code: "integration_count", driver_name: "Integration count", unit_label: "integration", description: null, status: "active" },
  ],
  effortRules: [
    { model_version: 1, activity_pack_code: "AP-TEST", rule_code: "R1", operation: "per_unit_hours", driver_code: "integration_count", parameters: { unitHours: 20 }, classification: "initiative_specific", sequence: 1, status: "active" },
  ],
  roleMix: [{ model_version: 1, activity_pack_code: "AP-TEST", role_code: "ROL-001", allocation_pct: 100, level_hint: null, status: "active" }],
  archetypeActivityMap: [{ model_version: 1, archetype_code: "ARCH-TEST", activity_pack_code: "AP-TEST", applicability: "required", notes: null, status: "active" }],
  rangePolicies: [],
  agentCosts: [],
};

const CLIENT_PROFILE_VALUE: PricingClientProfileValueRow = {
  id: "profile-value-1",
  profile_id: "profile-1",
  tenant_key: "tenant-1",
  profile_version: 1,
  assumption_key: "integration_count",
  assumption_value: 12,
  content_hash: "hash",
  created_at: "2026-01-01T00:00:00.000Z",
};

describe("PR7 — suggestion-confirmation-gate contract (a resolved suggestion is never auto-confirmed)", () => {
  it("a genuinely resolved suggestion (client-profile match) still blocks the run until the user explicitly confirms it", async () => {
    const suggestions = resolveScopeDriverSuggestions(PACK, "ARCH-TEST", [CLIENT_PROFILE_VALUE]);
    const integrationSuggestion = suggestions.find((s) => s.inputKey === "integration_count");
    expect(integrationSuggestion).toBeDefined();
    expect(integrationSuggestion!.value).toBe(12); // a REAL resolved value, not a gap.
    expect(integrationSuggestion!.sourceType).toBe("client_profile");

    // The suggestion shape itself carries no "confirmed" concept at all
    // (EstimateInputSuggestion has no confirmedBy/confirmedAt field) —
    // confirmation is a separate, later, explicit user action.
    expect(integrationSuggestion).not.toHaveProperty("confirmedBy");
    expect(integrationSuggestion).not.toHaveProperty("confirmedAt");

    const store = createEstimateFixtureStore();
    const estimate = await store.createDraftEstimate({
      tenantKey: "tenant-1",
      moveId: "move-1",
      scenarioName: "Test",
      archetypeCode: "ARCH-TEST",
      modelVersion: 1,
    });

    // The wizard threads a resolved suggestion straight into
    // upsertEstimateInputs WITHOUT confirmedBy — exactly matching that
    // function's own documented contract ("Omit to leave a proposed/
    // unconfirmed suggestion untouched").
    await store.upsertEstimateInputs(estimate.id, [
      {
        inputKey: integrationSuggestion!.inputKey,
        value: integrationSuggestion!.value,
        unit: integrationSuggestion!.unit,
        required: integrationSuggestion!.required,
        sourceType: integrationSuggestion!.sourceType,
        sourceRef: integrationSuggestion!.sourceRef,
        confidence: integrationSuggestion!.confidence,
        // confirmedBy deliberately omitted.
      },
    ]);

    const inputsAfterSuggestion = await store.listEstimateInputs(estimate.id);
    const row = inputsAfterSuggestion.find((r) => r.input_key === "integration_count")!;
    expect(row.value).toBe(12);
    expect(row.confirmed_by).toBeNull();
    expect(row.confirmed_at).toBeNull();
    expect(isInputSettled({ inputKey: row.input_key, value: row.value, confirmedAt: row.confirmed_at, overrideReason: row.override_reason, confidence: row.confidence })).toBe(false);

    // The GATE ITSELF (not just the suggestion resolver) blocks a run on
    // this input — a real value existing is not the same as the user having
    // accepted it.
    const gateBeforeConfirm = validateEstimateReadiness(
      ["integration_count"],
      inputsAfterSuggestion.map((r) => ({ inputKey: r.input_key, value: r.value, confirmedAt: r.confirmed_at, overrideReason: r.override_reason, confidence: r.confidence })),
    );
    expect(gateBeforeConfirm.ready).toBe(false);
    expect(gateBeforeConfirm.blockingReasons).toEqual([
      expect.objectContaining({ inputKey: "integration_count" }),
    ]);

    // Only once the user explicitly confirms (the SAME input, now WITH
    // confirmedBy) does the gate pass.
    await store.upsertEstimateInputs(estimate.id, [
      {
        inputKey: "integration_count",
        value: 12,
        sourceType: "client_profile",
        confirmedBy: "user-1",
      },
    ]);
    const inputsAfterConfirm = await store.listEstimateInputs(estimate.id);
    const gateAfterConfirm = validateEstimateReadiness(
      ["integration_count"],
      inputsAfterConfirm.map((r) => ({ inputKey: r.input_key, value: r.value, confirmedAt: r.confirmed_at, overrideReason: r.override_reason, confidence: r.confidence })),
    );
    expect(gateAfterConfirm.ready).toBe(true);
  });
});
