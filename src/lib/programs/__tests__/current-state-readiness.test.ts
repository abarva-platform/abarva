import {
  deriveCurrentStateRequirements,
  resolveCurrentStateReadiness,
  inferMoveProfile,
  emptyProfile,
  INSTRUMENT_LIBRARY,
  type MoveProfile,
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

function profile(over: Partial<MoveProfile>): MoveProfile {
  return { ...emptyProfile(), ...over };
}

const keysAt = (p: MoveProfile, phase: number) =>
  deriveCurrentStateRequirements(p, phase).map((r) => r.instrument.key);

beforeEach(() => {
  for (const k of Object.keys(counts)) delete counts[k];
});

describe("deriveCurrentStateRequirements — non-linearity by estate", () => {
  it("universal estate instruments derive for any profile at P1", () => {
    const keys = keysAt(emptyProfile(), 1);
    expect(keys).toEqual(
      expect.arrayContaining([
        "it_systems_landscape",
        "it_org_structure",
        "stakeholder_map",
      ]),
    );
  });

  it("full-stack/cloud estate derives DORA, NOT mainframe/ETL instruments", () => {
    const keys = keysAt(
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
      2,
    );
    expect(keys).toContain("eng_performance_dora");
    expect(keys).not.toContain("mainframe_change_cadence");
    expect(keys).not.toContain("etl_job_inventory");
  });

  it("mainframe estate derives mainframe instruments and NOT DORA", () => {
    const keys = keysAt(profile({ teamArchetypes: ["mainframe"] }), 2);
    expect(keys).toEqual(
      expect.arrayContaining([
        "mainframe_change_cadence",
        "mainframe_modernization_candidates",
      ]),
    );
    expect(keys).not.toContain("eng_performance_dora");
  });

  it("legacy data-analytics estate derives ETL + lineage instruments", () => {
    const keys = keysAt(
      profile({ teamArchetypes: ["legacy_data_analytics"] }),
      2,
    );
    expect(keys).toEqual(
      expect.arrayContaining(["etl_job_inventory", "data_lineage"]),
    );
    expect(keys).not.toContain("mainframe_change_cadence");
  });

  it("cold-start (unknown archetypes) includes DORA to be pruned once estate is known", () => {
    expect(keysAt(emptyProfile(), 1)).toContain("eng_performance_dora");
  });

  it("DORA severity is hard for continuous delivery, soft for a known waterfall team", () => {
    const cont = deriveCurrentStateRequirements(
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
      1,
    ).find((r) => r.instrument.key === "eng_performance_dora");
    const wf = deriveCurrentStateRequirements(
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "waterfall",
      }),
      1,
    ).find((r) => r.instrument.key === "eng_performance_dora");
    expect(cont?.severity).toBe("hard");
    expect(wf?.severity).toBe("soft");
  });

  it("every library instrument has the required predicate fields", () => {
    for (const i of INSTRUMENT_LIBRARY) {
      expect(typeof i.appliesWhen).toBe("function");
      expect(typeof i.severityFor).toBe("function");
      expect(i.phase).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("inferMoveProfile — estate discovery from context layer", () => {
  it("infers a full-stack/cloud team + scrum cadence when DORA data exists", async () => {
    counts["tower_dora_metrics"] = 30;
    const p = await inferMoveProfile(ctx);
    expect(p.teamArchetypes).toContain("full_stack_cloud");
    expect(p.deliveryMaturity).toBe("scrum");
    expect(p.provenance.teamArchetypes).toBe("context_layer");
  });

  it("cold start (no context data) yields an explicit unknown profile", async () => {
    const p = await inferMoveProfile(ctx);
    expect(p.teamArchetypes).toEqual([]);
    expect(p.deliveryMaturity).toBe("unknown");
  });

  it("declared signals override inferred dimensions and are marked declared", async () => {
    counts["tower_dora_metrics"] = 30;
    const p = await inferMoveProfile(ctx, { teamArchetypes: ["mainframe"] });
    expect(p.teamArchetypes).toEqual(["mainframe"]);
    expect(p.provenance.teamArchetypes).toBe("declared");
  });
});

describe("resolveCurrentStateReadiness — committed vs missing over derived set", () => {
  it("reports all missing + coverage 0 when no current-state is committed", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
      1,
    );
    expect(r.coverageScore).toBe(0);
    expect(r.instruments.every((i) => i.status === "missing")).toBe(true);
    expect(r.hardGaps).toContain("eng_performance_dora");
  });

  it("flips an instrument to committed when its backing table has rows", async () => {
    counts["tower_dora_metrics"] = 42;
    const r = await resolveCurrentStateReadiness(
      ctx,
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
      1,
    );
    const dora = r.instruments.find((i) => i.key === "eng_performance_dora");
    expect(dora?.status).toBe("committed");
    expect(dora?.committedRows).toBe(42);
    expect(r.hardGaps).not.toContain("eng_performance_dora");
    expect(r.coverageScore).toBeGreaterThan(0);
  });

  it("qualitative instruments (no backing table) stay missing in v1", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      profile({ teamArchetypes: ["full_stack_cloud"] }),
      1,
    );
    const sm = r.instruments.find((i) => i.key === "stakeholder_map");
    expect(sm?.status).toBe("missing");
    expect(sm?.backingTable).toBeNull();
  });
});
