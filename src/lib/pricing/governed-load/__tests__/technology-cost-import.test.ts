import { describe, expect, it } from "@jest/globals";
import { computeContentHash } from "../../versioning";
import { computeTechnologyCostDiff, commitClientTechnologyCostImport } from "../technology-cost-import";
import type { NewTechnologyCostInput, TechnologyCostStorePort } from "../technology-cost-import";

describe("computeTechnologyCostDiff", () => {
  it("classifies added/changed/unchanged", () => {
    const current = [{ cost_key: "ai_platform_license_annual_usd", cost_value: 150000, unit: "usd_per_year" }];
    const incoming = [
      { costKey: "ai_platform_license_annual_usd", costValue: 180000, unit: "usd_per_year" }, // changed
      { costKey: "gpu_hour_rate_usd", costValue: 2.5, unit: "usd_per_hour" }, // added
    ];
    const diff = computeTechnologyCostDiff(current, incoming);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]).toEqual({
      before: { costKey: "ai_platform_license_annual_usd", costValue: 150000, unit: "usd_per_year" },
      after: { costKey: "ai_platform_license_annual_usd", costValue: 180000, unit: "usd_per_year" },
    });
    expect(diff.added).toEqual([{ costKey: "gpu_hour_rate_usd", costValue: 2.5, unit: "usd_per_hour" }]);
    expect(diff.unchanged).toEqual([]);
  });
});

describe("commitClientTechnologyCostImport — idempotency contract", () => {
  // Mirrors the real `defaultTechnologyCostStore`: no dedicated "whole
  // version" row exists for this table, so `getCurrentVersion` recomputes
  // the hash from the stored rows (snake_case shape) every time — exactly
  // like the production implementation must, to avoid the camelCase/
  // snake_case hash-shape mismatch documented at `toHashRow` in
  // `../technology-cost-import.ts`.
  function fakeStore(): TechnologyCostStorePort & { insertCalls: number } {
    const state: {
      current: { version: number; values: NewTechnologyCostInput[] } | null;
      insertCalls: number;
    } = { current: null, insertCalls: 0 };
    return {
      get insertCalls() {
        return state.insertCalls;
      },
      async getCurrentVersion() {
        if (!state.current) return null;
        const sorted = [...state.current.values].sort((a, b) => (a.costKey < b.costKey ? -1 : a.costKey > b.costKey ? 1 : 0));
        const contentHash = computeContentHash(
          sorted.map((v) => ({ cost_key: v.costKey, cost_value: v.costValue, unit: v.unit })),
        );
        return { version: state.current.version, contentHash };
      },
      async insertNewVersion(input) {
        state.insertCalls += 1;
        state.current = {
          version: input.version,
          values: input.values.map((v) => ({ costKey: v.costKey, costValue: v.costValue, unit: v.unit })),
        };
      },
    };
  }

  const values = [{ costKey: "ai_platform_license_annual_usd", costValue: 180000, unit: "usd_per_year" }];

  it("creates version 1 with no current set", async () => {
    const store = fakeStore();
    const result = await commitClientTechnologyCostImport({ tenantKey: "apex-retail", values }, store);
    expect(result).toMatchObject({ action: "new_version", version: 1, previousVersion: null });
    expect(store.insertCalls).toBe(1);
  });

  it("re-committing identical values is a no-op", async () => {
    const store = fakeStore();
    await commitClientTechnologyCostImport({ tenantKey: "apex-retail", values }, store);
    const second = await commitClientTechnologyCostImport({ tenantKey: "apex-retail", values }, store);
    expect(second.action).toBe("noop");
    expect(store.insertCalls).toBe(1);
  });

  it("a changed cost_value produces version 2 (proves the write/read hash shapes actually agree)", async () => {
    const store = fakeStore();
    await commitClientTechnologyCostImport({ tenantKey: "apex-retail", values }, store);
    const changed = [{ ...values[0], costValue: 200000 }];
    const result = await commitClientTechnologyCostImport({ tenantKey: "apex-retail", values: changed }, store);
    expect(result).toMatchObject({ action: "new_version", version: 2, previousVersion: 1 });
    expect(store.insertCalls).toBe(2);
  });
});
