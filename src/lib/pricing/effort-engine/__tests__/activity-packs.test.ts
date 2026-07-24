import { resolveActivityPacksForArchetype, technicalPackCodes } from "../activity-packs";
import { loadRealEffortEnginePack } from "../__fixtures__/test-fixtures";

const pack = loadRealEffortEnginePack();

describe("resolveActivityPacksForArchetype — against the REAL committed PR4 pack", () => {
  it("resolves ARCH-05's required packs, excluding the two documented exclusions (AP-SHARED-06, AP-SHARED-11)", () => {
    const resolved = resolveActivityPacksForArchetype(pack, "ARCH-05");
    const codes = resolved.map((r) => r.pack.activity_pack_code);
    expect(codes).not.toContain("AP-SHARED-06");
    expect(codes).not.toContain("AP-SHARED-11");
    // All 4 of ARCH-05's own technical packs are present.
    expect(codes).toEqual(
      expect.arrayContaining(["AP-TECH-PROC-01", "AP-TECH-PROC-02", "AP-TECH-PROC-03", "AP-TECH-PROC-04"]),
    );
    // 10 of the 12 shared packs (12 - 2 exclusions).
    const sharedCount = resolved.filter((r) => r.pack.category === "shared_nontechnical").length;
    expect(sharedCount).toBe(10);
  });

  it("resolves ARCH-06's required packs INCLUDING AP-SHARED-11 (vendor governance is required for a sourcing transition)", () => {
    const resolved = resolveActivityPacksForArchetype(pack, "ARCH-06");
    const codes = resolved.map((r) => r.pack.activity_pack_code);
    expect(codes).toContain("AP-SHARED-11");
    expect(codes).toContain("AP-SHARED-06"); // hypercare applies to a managed-services transition
    const sharedCount = resolved.filter((r) => r.pack.category === "shared_nontechnical").length;
    expect(sharedCount).toBe(12);
  });

  it("every other archetype gets AP-SHARED-11 only when explicitly opted into (conditional, excluded by default)", () => {
    const resolvedDefault = resolveActivityPacksForArchetype(pack, "ARCH-01");
    expect(resolvedDefault.map((r) => r.pack.activity_pack_code)).not.toContain("AP-SHARED-11");

    const resolvedOptedIn = resolveActivityPacksForArchetype(pack, "ARCH-01", { includeConditionalPackCodes: ["AP-SHARED-11"] });
    expect(resolvedOptedIn.map((r) => r.pack.activity_pack_code)).toContain("AP-SHARED-11");
  });

  it("every resolved pack carries at least one parsed rule and its role mix", () => {
    for (const archetypeCode of pack.archetypes.map((a) => a.archetype_code)) {
      const resolved = resolveActivityPacksForArchetype(pack, archetypeCode);
      expect(resolved.length).toBeGreaterThan(0);
      for (const p of resolved) {
        expect(p.rules.length).toBeGreaterThan(0);
        expect(p.roleMix.length).toBeGreaterThan(0);
      }
    }
  });

  it("technicalPackCodes returns only the technical-category packs", () => {
    const resolved = resolveActivityPacksForArchetype(pack, "ARCH-01");
    const techCodes = technicalPackCodes(resolved);
    expect(techCodes.every((code) => code.startsWith("AP-TECH-"))).toBe(true);
    expect(techCodes.length).toBe(5); // ARCH-01 has 5 technical packs
  });
});
