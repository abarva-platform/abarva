import {
  requiredFamiliesForPhase,
  manifestForPhase,
  resolveCurrentStateReadiness,
  CURRENT_STATE_FAMILIES,
} from "../current-state-readiness";
import type { TenancyCtx } from "@/lib/programs/types.db";

// Per-table committed-row counts the mocked read client returns.
const counts: Record<string, number> = {};

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: () => ({
    from(table: string) {
      const builder: Record<string, unknown> = {};
      builder.select = () => builder;
      builder.eq = () => builder;
      // PromiseLike terminal: resolve to { data, count, error }.
      builder.then = (resolve: (v: unknown) => unknown) =>
        resolve({ data: null, count: counts[table] ?? 0, error: null });
      return builder;
    },
  }),
}));

const ctx: TenancyCtx = {
  clientId: "00000000-0000-4000-8000-0000000000aa",
  clientKey: "skyharbor-air",
  userId: "11111111-1111-4111-8111-111111111111",
  role: "maestro",
  email: "anand.sundaram+skyharbor@thesundaram.com",
} as TenancyCtx;

beforeEach(() => {
  for (const k of Object.keys(counts)) delete counts[k];
});

describe("requiredFamiliesForPhase", () => {
  it("P0 Originate requires nothing (manifest preview only)", () => {
    expect(requiredFamiliesForPhase(0)).toEqual([]);
  });

  it("P1 Charter requires DORA, IT org, stakeholder map, and IT-systems as hard", () => {
    const hard = requiredFamiliesForPhase(1)
      .filter((f) => f.severity === "hard")
      .map((f) => f.key)
      .sort();
    expect(hard).toEqual(
      [
        "eng_performance_dora",
        "it_org_structure",
        "stakeholder_map",
        "it_systems_landscape",
      ].sort(),
    );
  });

  it("P0 manifest previews P1's required families", () => {
    expect(manifestForPhase(0)).toEqual(
      requiredFamiliesForPhase(1).map((f) => f.key),
    );
  });

  it("every required family has a registry spec", () => {
    for (const phase of [1, 2]) {
      for (const rf of requiredFamiliesForPhase(phase)) {
        expect(CURRENT_STATE_FAMILIES[rf.key]).toBeDefined();
      }
    }
  });
});

describe("resolveCurrentStateReadiness", () => {
  it("reports all hard families missing when no current-state data is committed", async () => {
    const r = await resolveCurrentStateReadiness(ctx, 1);
    expect(r.coverageScore).toBe(0);
    expect(r.hardGaps.sort()).toEqual(
      [
        "eng_performance_dora",
        "it_org_structure",
        "stakeholder_map",
        "it_systems_landscape",
      ].sort(),
    );
    expect(r.families.every((f) => f.status === "missing")).toBe(true);
  });

  it("flips a family to committed when its backing table has rows for the tenant", async () => {
    counts["tower_dora_metrics"] = 42;
    const r = await resolveCurrentStateReadiness(ctx, 1);
    const dora = r.families.find((f) => f.key === "eng_performance_dora");
    expect(dora?.status).toBe("committed");
    expect(dora?.committedRows).toBe(42);
    expect(r.hardGaps).not.toContain("eng_performance_dora");
    expect(r.coverageScore).toBeGreaterThan(0);
  });

  it("weights hard families 2x in the coverage score", async () => {
    // P1: all four families hard => weights 2 each => total 8.
    // Commit only DORA (weight 2) => 2/8 = 25.
    counts["tower_dora_metrics"] = 5;
    const r = await resolveCurrentStateReadiness(ctx, 1);
    expect(r.coverageScore).toBe(Math.round((2 / 8) * 100));
    expect(r.hardGaps).not.toContain("eng_performance_dora");
  });

  it("queries the tenant_key column for tower_itsm_records (P2 soft family)", async () => {
    counts["tower_itsm_records"] = 9;
    const r = await resolveCurrentStateReadiness(ctx, 2);
    const itsm = r.families.find((f) => f.key === "delivery_quality_itsm");
    expect(itsm?.status).toBe("committed");
    expect(itsm?.committedRows).toBe(9);
  });

  it("stakeholder_map (no backing table) stays missing in v1", async () => {
    counts["tower_dora_metrics"] = 1;
    const r = await resolveCurrentStateReadiness(ctx, 1);
    const sm = r.families.find((f) => f.key === "stakeholder_map");
    expect(sm?.status).toBe("missing");
    expect(sm?.backingTable).toBeNull();
  });
});
