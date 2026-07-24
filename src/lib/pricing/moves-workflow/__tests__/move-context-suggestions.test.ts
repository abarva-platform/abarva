import {
  listRequiredDriverCodesForArchetype,
  resolveClientProfileReferenceSuggestions,
  resolveScopeDriverSuggestions,
  resolveSetupSuggestions,
} from "../move-context-suggestions";
import type { EffortEnginePack } from "../../effort-engine/types";
import type { PricingClientProfileValueRow } from "../../types";

function buildPack(overrides: Partial<EffortEnginePack> = {}): EffortEnginePack {
  return {
    modelVersion: 1,
    archetypes: [{ model_version: 1, archetype_code: "ARCH-01", archetype_name: "AI use case", description: null, status: "active" }],
    activityPacks: [
      { model_version: 1, activity_pack_code: "AP-TECH-AI-02", activity_pack_name: "GenAI Build", category: "technical", tower_code: null, capability_code: null, description: null, status: "active" },
    ],
    effortDrivers: [
      { model_version: 1, driver_code: "integration_count", driver_name: "Integration Count", unit_label: "integration", description: null, status: "active" },
      { model_version: 1, driver_code: "ai_use_case_count", driver_name: "AI Use Case Count", unit_label: "AI use case", description: null, status: "active" },
    ],
    effortRules: [
      {
        model_version: 1,
        activity_pack_code: "AP-TECH-AI-02",
        rule_code: "R1",
        operation: "per_unit_hours",
        driver_code: "integration_count",
        parameters: { unitHours: 10 },
        classification: "initiative_specific",
        sequence: 1,
        status: "active",
      },
      {
        model_version: 1,
        activity_pack_code: "AP-TECH-AI-02",
        rule_code: "R2",
        operation: "per_unit_hours",
        driver_code: "ai_use_case_count",
        parameters: { unitHours: 40 },
        classification: "initiative_specific",
        sequence: 2,
        status: "active",
      },
      {
        model_version: 1,
        activity_pack_code: "AP-TECH-AI-02",
        rule_code: "R3",
        operation: "fixed_hours",
        driver_code: null,
        parameters: { hours: 20 },
        classification: "initiative_specific",
        sequence: 3,
        status: "active",
      },
    ],
    roleMix: [{ model_version: 1, activity_pack_code: "AP-TECH-AI-02", role_code: "ROL-001", allocation_pct: 100, level_hint: null, status: "active" }],
    archetypeActivityMap: [
      { model_version: 1, archetype_code: "ARCH-01", activity_pack_code: "AP-TECH-AI-02", applicability: "required", notes: null, status: "active" },
    ],
    rangePolicies: [],
    agentCosts: [],
    ...overrides,
  };
}

describe("listRequiredDriverCodesForArchetype", () => {
  it("derives the driver list from the REAL archetype→activity-pack→rule mapping, sorted, deduped", () => {
    const pack = buildPack();
    expect(listRequiredDriverCodesForArchetype(pack, "ARCH-01")).toEqual(["ai_use_case_count", "integration_count"]);
  });

  it("never includes drivers for percentage_of_selected_labor / manual_cost_line / fixed_hours rules (no driver_code)", () => {
    const pack = buildPack();
    const codes = listRequiredDriverCodesForArchetype(pack, "ARCH-01");
    expect(codes).not.toContain(null);
    expect(codes).toHaveLength(2); // fixed_hours (R3) contributes nothing
  });
});

describe("resolveScopeDriverSuggestions — honest Move-context gap", () => {
  it("returns value: null with an explicit gapReason when no client-profile value resolves the driver (the real-world case today)", () => {
    const pack = buildPack();
    const suggestions = resolveScopeDriverSuggestions(pack, "ARCH-01");
    expect(suggestions).toHaveLength(2);
    for (const s of suggestions) {
      expect(s.value).toBeNull();
      expect(s.sourceType).toBe("client_input");
      expect(s.confidence).toBeNull();
      expect(s.gapReason).toMatch(/does not carry this scope-driver quantity/);
    }
  });

  it("uses a client-profile value when one matches the driver code exactly", () => {
    const pack = buildPack();
    const profileValues: PricingClientProfileValueRow[] = [
      {
        id: "profile-value-1",
        profile_id: "profile-1",
        tenant_key: "apex-retail",
        profile_version: 1,
        assumption_key: "integration_count",
        assumption_value: 6,
        content_hash: "hash",
        created_at: "2026-07-24T00:00:00Z",
      },
    ];
    const suggestions = resolveScopeDriverSuggestions(pack, "ARCH-01", profileValues);
    const integrationSuggestion = suggestions.find((s) => s.inputKey === "integration_count");
    expect(integrationSuggestion?.value).toBe(6);
    expect(integrationSuggestion?.sourceType).toBe("client_profile");
    expect(integrationSuggestion?.gapReason).toBeNull();
  });
});

describe("resolveSetupSuggestions", () => {
  it("suggests currency from the Move's own value-at-stake when present (From Move)", () => {
    const suggestions = resolveSetupSuggestions({ moveId: "move-1", valueAtStakeCurrency: "EUR" });
    const currency = suggestions.find((s) => s.inputKey === "currency");
    expect(currency?.value).toBe("EUR");
    expect(currency?.sourceType).toBe("move_context");
    expect(currency?.confidence).toBe("high");
  });

  it("falls back to a disclosed AbarVa default when the Move has no recorded currency", () => {
    const suggestions = resolveSetupSuggestions({ moveId: "move-1", valueAtStakeCurrency: null });
    const currency = suggestions.find((s) => s.inputKey === "currency");
    expect(currency?.value).toBe("USD");
    expect(currency?.sourceType).toBe("global_default");
    expect(currency?.confidence).toBe("low");
  });

  it("target_start_date and target_duration_weeks have no real Move source — honest gap, never fabricated", () => {
    const suggestions = resolveSetupSuggestions({ moveId: "move-1", valueAtStakeCurrency: "USD" });
    const startDate = suggestions.find((s) => s.inputKey === "target_start_date");
    const duration = suggestions.find((s) => s.inputKey === "target_duration_weeks");
    expect(startDate?.value).toBeNull();
    expect(startDate?.gapReason).toMatch(/no structured target-start-date/i);
    expect(duration?.value).toBeNull();
  });
});

describe("resolveClientProfileReferenceSuggestions", () => {
  it("surfaces client-profile assumptions not already consumed as scope-driver suggestions, disclosed as reference-only", () => {
    const values: PricingClientProfileValueRow[] = [
      { id: "v1", profile_id: "p1", tenant_key: "apex-retail", profile_version: 1, assumption_key: "offshore_ratio_default", assumption_value: 0.4, content_hash: "h", created_at: "now" },
      { id: "v2", profile_id: "p1", tenant_key: "apex-retail", profile_version: 1, assumption_key: "integration_count", assumption_value: 6, content_hash: "h", created_at: "now" },
    ];
    const suggestions = resolveClientProfileReferenceSuggestions(values, new Set(["integration_count"]));
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].inputKey).toBe("offshore_ratio_default");
    expect(suggestions[0].sourceType).toBe("client_profile");
    expect(suggestions[0].required).toBe(false);
  });
});
