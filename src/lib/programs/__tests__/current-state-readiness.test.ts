import {
  resolveCurrentStateReadiness,
  inferMoveProfile,
  emptyProfile,
  type MoveProfile,
} from "../current-state-readiness";
import {
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  getArchetype,
  DEFAULT_ARCHETYPE_ID,
} from "../archetypes/registry";
import type { TenancyCtx } from "@/lib/programs/types.db";

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

const AI_PDLC = AI_PRODUCT_DEVELOPMENT_LIFECYCLE;
const profile = (over: Partial<MoveProfile>): MoveProfile => ({
  ...emptyProfile(),
  ...over,
});

beforeEach(() => {
  for (const k of Object.keys(counts)) delete counts[k];
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

describe("resolveCurrentStateReadiness — archetype-driven", () => {
  it("requirements come from the archetype (AI-PDLC P1), not a hardcoded list", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      AI_PDLC,
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
      1,
    );
    expect(r.archetypeId).toBe("AI_PRODUCT_DEVELOPMENT_LIFECYCLE");
    expect(r.instruments.map((i) => i.key).sort()).toEqual(
      [
        "eng_performance_dora",
        "it_systems_landscape",
        "it_org_structure",
        "stakeholder_map",
        "product_platform_operating_model",
        "value_kpi_baseline",
      ].sort(),
    );
  });

  it("reports all missing + coverage 0 when no current-state is committed", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      AI_PDLC,
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

  it("flips a family to committed when its backing table has rows", async () => {
    counts["tower_dora_metrics"] = 42;
    const r = await resolveCurrentStateReadiness(
      ctx,
      AI_PDLC,
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

  it("estate axis prunes DORA for a mainframe estate (not in the report)", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      AI_PDLC,
      profile({ teamArchetypes: ["mainframe"] }),
      1,
    );
    expect(r.instruments.map((i) => i.key)).not.toContain(
      "eng_performance_dora",
    );
    expect(r.instruments.map((i) => i.key)).toContain("stakeholder_map");
  });

  it("each instrument carries its archetype+estate rationale", async () => {
    const r = await resolveCurrentStateReadiness(
      ctx,
      AI_PDLC,
      emptyProfile(),
      1,
    );
    expect(r.instruments.every((i) => i.rationale.length > 0)).toBe(true);
  });

  it("the default archetype resolves", () => {
    expect(getArchetype(DEFAULT_ARCHETYPE_ID)?.id).toBe(
      "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    );
  });
});
