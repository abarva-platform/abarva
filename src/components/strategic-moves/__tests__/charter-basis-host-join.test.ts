import {
  charterBasisRollupSections,
  charterBasisSectionKeys,
  charterBasisSurfaceActive,
  charterBasisSurfaceForSection,
} from "@/lib/programs/charter-basis-host-join";
import type { PhaseCaptureSection } from "@/lib/programs/phase-capture-contract";

function section(
  key: string,
  label: string,
  evidenceFamily?: string,
): PhaseCaptureSection {
  return {
    key,
    label,
    description: `Describe ${label}.`,
    required: true,
    ...(evidenceFamily ? { evidenceFamily } : {}),
  };
}

const CHARTER_SECTIONS: PhaseCaptureSection[] = [
  section("sponsor_commitment", "Sponsor commitment", "charter_sponsor"),
  section("scope_boundary", "Scope boundary", "charter_scope"),
];

const MIXED_SECTIONS: PhaseCaptureSection[] = [
  CHARTER_SECTIONS[0],
  section("why_now", "Why now"),
  CHARTER_SECTIONS[1],
  section("diagnosis_facts", "What we found", "discovery_facts"),
];

describe("charterBasisSurfaceActive", () => {
  it("is on for P1 with the flag enabled", () => {
    expect(
      charterBasisSurfaceActive({ flagEnabled: true, phaseNumber: 1 }),
    ).toBe(true);
  });

  // Each half is pinned with the OTHER half satisfied, so removing either
  // conjunct fails a test. A both-wrong fixture would stay green against a
  // one-sided guard.
  it("is off with the flag disabled even on P1", () => {
    expect(
      charterBasisSurfaceActive({ flagEnabled: false, phaseNumber: 1 }),
    ).toBe(false);
  });

  it("is off on any phase but P1 even with the flag enabled", () => {
    for (const phaseNumber of [0, 2, 3, 4, 5]) {
      expect(charterBasisSurfaceActive({ flagEnabled: true, phaseNumber })).toBe(
        false,
      );
    }
  });
});

describe("charterBasisSectionKeys", () => {
  it("selects only the sections declaring a P1 charter evidence family", () => {
    const keys = charterBasisSectionKeys({
      active: true,
      sections: MIXED_SECTIONS,
    });
    expect([...keys].sort()).toEqual(["scope_boundary", "sponsor_commitment"]);
  });

  it("is empty when the surface is inactive, even if every section qualifies", () => {
    const keys = charterBasisSectionKeys({
      active: false,
      sections: CHARTER_SECTIONS,
    });
    expect(keys.size).toBe(0);
  });

  it("is empty when no section declares a charter family", () => {
    const keys = charterBasisSectionKeys({
      active: true,
      sections: [section("why_now", "Why now")],
    });
    expect(keys.size).toBe(0);
  });
});

describe("charterBasisSurfaceForSection", () => {
  it("admits a section in the resolved set and refuses one outside it", () => {
    const keys = charterBasisSectionKeys({
      active: true,
      sections: MIXED_SECTIONS,
    });
    expect(charterBasisSurfaceForSection("sponsor_commitment", keys)).toBe(true);
    expect(charterBasisSurfaceForSection("why_now", keys)).toBe(false);
  });

  it("refuses every section when the set is empty", () => {
    expect(
      charterBasisSurfaceForSection("sponsor_commitment", new Set<string>()),
    ).toBe(false);
  });
});

describe("charterBasisRollupSections", () => {
  it("returns null — not an empty fold — when there is no basis surface", () => {
    const rows = charterBasisRollupSections({
      sections: MIXED_SECTIONS,
      sectionKeys: new Set<string>(),
    });
    // null collapses the hand-off rollup AND the gate disclosure to nothing;
    // [] would be a real fold over zero rows and would render "0 of 0".
    expect(rows).toBeNull();
  });

  it("carries key and label for the charter sections, in section order", () => {
    const keys = charterBasisSectionKeys({
      active: true,
      sections: MIXED_SECTIONS,
    });
    expect(
      charterBasisRollupSections({ sections: MIXED_SECTIONS, sectionKeys: keys }),
    ).toEqual([
      { key: "sponsor_commitment", label: "Sponsor commitment" },
      { key: "scope_boundary", label: "Scope boundary" },
    ]);
  });

  it("drops a key with no matching section rather than inventing a row", () => {
    const rows = charterBasisRollupSections({
      sections: CHARTER_SECTIONS,
      sectionKeys: new Set(["sponsor_commitment", "retired_section"]),
    });
    expect(rows).toEqual([
      { key: "sponsor_commitment", label: "Sponsor commitment" },
    ]);
  });
});
