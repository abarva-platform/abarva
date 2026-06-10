import { resolveArchetypeRequirements } from "../resolver";
import {
  getArchetype,
  listArchetypes,
  AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
  IT_SOURCING_EVENT,
  ARCHETYPE_REGISTRY,
} from "../registry";
import { ANALYSIS_METHODS } from "../method-library";
import {
  emptyProfile,
  type MoveProfile,
} from "@/lib/programs/current-state-readiness";

const profile = (over: Partial<MoveProfile>): MoveProfile => ({
  ...emptyProfile(),
  ...over,
});
const keys = (reqs: { family: { key: string } }[]) =>
  reqs.map((r) => r.family.key);

describe("archetype registry", () => {
  it("resolves archetypes by id", () => {
    expect(getArchetype("AI_PRODUCT_DEVELOPMENT_LIFECYCLE")?.id).toBe(
      "AI_PRODUCT_DEVELOPMENT_LIFECYCLE",
    );
    expect(getArchetype("IT_SOURCING_EVENT")?.id).toBe("IT_SOURCING_EVENT");
    expect(getArchetype("nope")).toBeUndefined();
    expect(listArchetypes().length).toBeGreaterThanOrEqual(2);
  });

  it("every archetype method key resolves in the method library", () => {
    for (const a of Object.values(ARCHETYPE_REGISTRY)) {
      for (const m of a.analysisMethods) {
        expect(ANALYSIS_METHODS[m]).toBeDefined();
      }
    }
  });
});

describe("resolveArchetypeRequirements — requirements come from the archetype", () => {
  it("AI-PDLC P1 Charter requirements are the archetype's, not hardcoded Charter logic", () => {
    // Without an estate profile the resolver cannot prune estate-scoped families,
    // so both engineering-delivery baselines (DORA + mainframe) pass through —
    // honest: it doesn't yet know the estate.
    const reqs = resolveArchetypeRequirements(
      AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
      "charter",
    );
    expect(keys(reqs).sort()).toEqual(
      [
        "eng_performance_dora",
        "mainframe_change_cadence",
        "it_systems_landscape",
        "it_org_structure",
        "stakeholder_map",
        "product_platform_operating_model",
        "value_kpi_baseline",
      ].sort(),
    );
  });

  it("SWAP TEST: IT_SOURCING P1 yields entirely different requirements, zero Charter-code change", () => {
    const ai = keys(
      resolveArchetypeRequirements(AI_PRODUCT_DEVELOPMENT_LIFECYCLE, "charter"),
    );
    const sourcing = keys(
      resolveArchetypeRequirements(IT_SOURCING_EVENT, "charter"),
    );
    expect(sourcing).toEqual(
      expect.arrayContaining([
        "vendor_spend",
        "contract_inventory",
        "sla_baseline",
        "current_scope",
      ]),
    );
    // No overlap of domain evidence — generality proven.
    expect(sourcing.some((k) => ai.includes(k))).toBe(false);
    expect(sourcing).not.toContain("eng_performance_dora");
  });

  it("returns [] for a phase the archetype does not define", () => {
    expect(
      resolveArchetypeRequirements(IT_SOURCING_EVENT, "handoff_operate"),
    ).toEqual([]);
  });
});

describe("two-axis: estate refines the archetype requirement", () => {
  it("prunes DORA for a mainframe-only estate", () => {
    const reqs = resolveArchetypeRequirements(
      AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
      "charter",
      profile({ teamArchetypes: ["mainframe"] }),
    );
    expect(keys(reqs)).not.toContain("eng_performance_dora");
    // The non-estate-scoped families still required.
    expect(keys(reqs)).toContain("stakeholder_map");
  });

  it("keeps DORA hard for a continuous full-stack estate", () => {
    const reqs = resolveArchetypeRequirements(
      AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
      "charter",
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "continuous",
      }),
    );
    const dora = reqs.find((r) => r.family.key === "eng_performance_dora");
    expect(dora?.severity).toBe("hard");
    expect(dora?.estateResolved).toBe(true);
  });

  it("softens DORA for a waterfall full-stack estate (estate re-severity)", () => {
    const reqs = resolveArchetypeRequirements(
      AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
      "charter",
      profile({
        teamArchetypes: ["full_stack_cloud"],
        deliveryMaturity: "waterfall",
      }),
    );
    expect(
      reqs.find((r) => r.family.key === "eng_performance_dora")?.severity,
    ).toBe("soft");
  });

  it("without a profile, falls back to the archetype's declared severity", () => {
    const reqs = resolveArchetypeRequirements(
      AI_PRODUCT_DEVELOPMENT_LIFECYCLE,
      "charter",
    );
    expect(
      reqs.find((r) => r.family.key === "eng_performance_dora")?.severity,
    ).toBe("hard");
  });
});
