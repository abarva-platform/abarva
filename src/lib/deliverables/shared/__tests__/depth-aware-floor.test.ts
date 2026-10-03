import {
  depthAwareFloors,
  DEPTH_SCALED_DELIVERABLES,
} from "@/lib/deliverables/shared/depth-aware-floor";

describe("depthAwareFloors", () => {
  const ARCH = "target_state_architecture";
  const ARCH_BASE_WORDS = 9_000;
  const ARCH_BASE_SLIDES = 10;

  it("leaves a type that is not depth-scaled exactly at its calibrated base", () => {
    // business_case is not in the depth-scaled set; even a tiny confirmed
    // scope must not lower its floor.
    const floors = depthAwareFloors({
      deliverableType: "business_case",
      baseMinWords: 3_000,
      baseSlideMin: 10,
      confirmedEvidenceCount: 1,
      complexityTier: "straightforward",
    });
    expect(floors.minBodyWords).toBe(3_000);
    expect(floors.slideMin).toBeUndefined();
    expect(floors.depthFactor).toBe(1);
    expect(floors.basis).toBe("not depth-scaled");
  });

  it("keeps the full calibrated floor for a complex-tier Move", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      baseSlideMin: ARCH_BASE_SLIDES,
      complexityTier: "complex",
    });
    expect(floors.minBodyWords).toBe(9_000);
    // No slide override surfaced: the full band min still holds.
    expect(floors.slideMin).toBeUndefined();
    expect(floors.depthFactor).toBe(1);
    expect(floors.basis).toBe("tier:complex");
  });

  it("scales the floor DOWN for a standard-tier Move", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      baseSlideMin: ARCH_BASE_SLIDES,
      complexityTier: "standard",
    });
    expect(floors.minBodyWords).toBe(6_750); // 9000 * 0.75
    expect(floors.slideMin).toBe(8); // round(10 * 0.75)
    expect(floors.minBodyWords).toBeLessThan(ARCH_BASE_WORDS);
  });

  it("never falls below half the calibrated floor, even for straightforward", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      baseSlideMin: ARCH_BASE_SLIDES,
      complexityTier: "straightforward",
    });
    // 0.5 is the published floor fraction — still a substantial document,
    // well above golden-bar's own 2,500 realistic minimum.
    expect(floors.minBodyWords).toBe(4_500);
    expect(floors.minBodyWords).toBeGreaterThan(2_500);
    // Slides contract more gently (0.6 floor), and a deck stays an argument.
    expect(floors.slideMin).toBe(6);
  });

  it("prefers the complexity tier over evidence volume when both are present", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      complexityTier: "complex",
      confirmedEvidenceCount: 2, // would be 0.5 on its own
    });
    expect(floors.minBodyWords).toBe(9_000); // tier wins
    expect(floors.basis).toBe("tier:complex");
  });

  it("falls back to confirmed-evidence volume when no tier is available", () => {
    const thin = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      confirmedEvidenceCount: 4,
    });
    const rich = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      confirmedEvidenceCount: 40,
    });
    expect(thin.minBodyWords).toBe(4_500); // ≤6 → 0.5
    expect(thin.basis).toBe("evidence:4");
    expect(rich.minBodyWords).toBe(9_000); // >20 → 1.0
    // More confirmed evidence → a higher floor. The floor tracks grounded
    // material, it is not a target to pad toward.
    expect(rich.minBodyWords).toBeGreaterThan(thin.minBodyWords);
  });

  it("is monotonic in confirmed-evidence volume (more evidence never lowers the floor)", () => {
    let prev = 0;
    for (const count of [0, 3, 6, 7, 12, 13, 20, 21, 100]) {
      const { minBodyWords } = depthAwareFloors({
        deliverableType: ARCH,
        baseMinWords: ARCH_BASE_WORDS,
        confirmedEvidenceCount: count,
      });
      expect(minBodyWords).toBeGreaterThanOrEqual(prev);
      prev = minBodyWords;
    }
  });

  it("returns the base unchanged when there is no depth signal at all", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      baseSlideMin: ARCH_BASE_SLIDES,
    });
    expect(floors.minBodyWords).toBe(9_000);
    // No reduction → no slide override; the fixed band stays in place.
    expect(floors.slideMin).toBeUndefined();
    expect(floors.depthFactor).toBe(1);
  });

  it("omits slideMin when no base slide floor is given (a document, not a deck)", () => {
    const floors = depthAwareFloors({
      deliverableType: ARCH,
      baseMinWords: ARCH_BASE_WORDS,
      complexityTier: "standard",
    });
    expect(floors.slideMin).toBeUndefined();
  });

  it("only ever lowers, never raises, the calibrated floor", () => {
    for (const tier of ["straightforward", "standard", "complex"] as const) {
      const { minBodyWords, slideMin } = depthAwareFloors({
        deliverableType: ARCH,
        baseMinWords: ARCH_BASE_WORDS,
        baseSlideMin: ARCH_BASE_SLIDES,
        complexityTier: tier,
      });
      expect(minBodyWords).toBeLessThanOrEqual(ARCH_BASE_WORDS);
      expect(slideMin ?? 0).toBeLessThanOrEqual(ARCH_BASE_SLIDES);
    }
  });

  it("names target_state_architecture as the depth-scaled type", () => {
    expect(DEPTH_SCALED_DELIVERABLES.has("target_state_architecture")).toBe(
      true,
    );
    // roadmap stays on its fixed floor until proven to force padding.
    expect(DEPTH_SCALED_DELIVERABLES.has("roadmap")).toBe(false);
  });
});
