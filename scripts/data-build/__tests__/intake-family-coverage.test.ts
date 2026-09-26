import {
  declaredIntakeFamilies,
  evaluateIntakeFamilyCoverage,
  isNonEmpty,
  reserveOnePerFamily,
  type CoveragePacket,
  type TemplateManifest,
} from "../intake-family-coverage";

const MANIFEST: TemplateManifest = {
  templates: [
    { file: "00_enterprise_profile.csv", required: true },
    { file: "04_applications_systems.csv", required: true },
    { file: "16_expert_lenses.csv", required: false },
  ],
};

function summary(file: string, domain: string, recordCount = 10) {
  return { sourcePath: `datasets/tenant-inputs/active/meridian-health/current/${file}`, domain, recordCount };
}

/** A packet where the profile's structured fields carry content and applications are evidenced by
 * a signal declaring the same domain the profile's summary declares. */
function healthyPacket(): CoveragePacket {
  return {
    enterpriseIdentity: { industry: "Healthcare", businessModel: "Vertically integrated delivery system", revenue: 25_000_000_000, employeeCount: 68_000 },
    businessEconomics: { operatingSegments: ["Provider"], customerSegments: ["Medicare Advantage"] },
    strategicPriorities: ["Margin recovery"],
    sourceSummaries: [summary("00_enterprise_profile.csv", "enterprise_profile", 1), summary("04_applications_systems.csv", "technology_estate", 750)],
    signals: [{ domains: ["technology_estate"] }],
    contextItems: [],
  };
}

describe("declared families", () => {
  it("reads the family list from the manifest rather than a hand-typed list", () => {
    expect(declaredIntakeFamilies(MANIFEST).map((f) => f.index)).toEqual(["00", "04", "16"]);
  });

  it("refuses a manifest entry with no family index", () => {
    expect(() => declaredIntakeFamilies({ templates: [{ file: "notes.csv" }] })).toThrow(/family index/);
  });

  // Matching is by index, so a tenant naming its own file differently is still the same family.
  it("matches a family whose tenant filename differs from the manifest name", () => {
    const packet = healthyPacket();
    packet.sourceSummaries = [summary("00_enterprise_profile.csv", "enterprise_profile", 1), summary("04_apps_and_systems.csv", "technology_estate", 750)];
    const report = evaluateIntakeFamilyCoverage(MANIFEST, packet);
    expect(report.families.find((f) => f.index === "04")?.factsPresent).toBe(true);
  });
});

describe("present-but-empty", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", "   "],
    ["zero", 0],
    ["empty array", []],
    ["array of empties", [null, "", []]],
    ["object of nulls", { businessModel: null, industry: null }],
  ])("treats %s as absent", (_label, value) => {
    expect(isNonEmpty(value)).toBe(false);
  });

  it("treats real content as present", () => {
    expect(isNonEmpty({ businessModel: null, industry: "Healthcare" })).toBe(true);
  });
});

describe("coverage evaluation", () => {
  it("passes when every family contributes citable facts", () => {
    const report = evaluateIntakeFamilyCoverage(MANIFEST, {
      ...healthyPacket(),
      sourceSummaries: [
        summary("00_enterprise_profile.csv", "enterprise_profile", 1),
        summary("04_applications_systems.csv", "technology_estate", 750),
        summary("16_expert_lenses.csv", "expert_lens", 40),
      ],
      signals: [{ domains: ["technology_estate", "expert_lens"] }],
    });

    expect(report.failures).toEqual([]);
    expect(report.contributing).toBe(3);
  });

  // The planted failure, and the exact defect this module exists for: the profile is read,
  // summarized, and visible in the packet -- while every fact inside it is null.
  it("fails a family that is summarized but whose facts were nulled before the prompt", () => {
    const packet = healthyPacket();
    packet.enterpriseIdentity = { businessModel: null, industry: null, revenue: null, employeeCount: null };
    packet.businessEconomics = { operatingSegments: [], customerSegments: [], technologyBudget: 0 };
    packet.strategicPriorities = [];

    const report = evaluateIntakeFamilyCoverage(MANIFEST, packet);
    const profile = report.families.find((f) => f.index === "00");

    expect(profile?.summarized).toBe(true);
    expect(profile?.factsPresent).toBe(false);
    expect(profile?.state).toBe("summarized_only");
    expect(report.failures).toContain("00_enterprise_profile.csv");
    expect(report.summarizedOnly).toContain("00_enterprise_profile.csv");
  });

  it("fails a required family that never reached the packet at all", () => {
    const packet = healthyPacket();
    packet.sourceSummaries = [summary("00_enterprise_profile.csv", "enterprise_profile", 1)];
    packet.signals = [];

    const report = evaluateIntakeFamilyCoverage(MANIFEST, packet);
    expect(report.absent).toContain("04_applications_systems.csv");
    expect(report.failures).toContain("04_applications_systems.csv");
  });

  it("accepts an absence that someone signed for", () => {
    const packet = healthyPacket();
    packet.sourceSummaries = [summary("00_enterprise_profile.csv", "enterprise_profile", 1)];
    packet.signals = [];

    const report = evaluateIntakeFamilyCoverage(MANIFEST, packet, [
      { family: "04_applications_systems.csv", reason: "CMDB extract not yet delivered by the client", owner: "intake lead" },
    ]);

    expect(report.failures).toEqual([]);
    expect(report.declaredAbsent).toContain("04_applications_systems.csv");
  });

  // A stale exception hides a fix: the family started contributing and nobody removed the waiver.
  it("fails an exception whose family has started contributing", () => {
    const report = evaluateIntakeFamilyCoverage(MANIFEST, healthyPacket(), [
      { family: "00_enterprise_profile.csv", reason: "profile not wired yet", owner: "intake lead" },
    ]);

    expect(report.staleAbsences).toContain("00_enterprise_profile.csv");
  });

  it("does not fail a family the manifest marks optional", () => {
    const report = evaluateIntakeFamilyCoverage(MANIFEST, healthyPacket());
    expect(report.failures).not.toContain("16_expert_lenses.csv");
    expect(report.absent).toContain("16_expert_lenses.csv");
  });
});

describe("reserved summary slots", () => {
  // The identity file is one row, so volume ordering puts it last and a tighter cap evicts it.
  it("keeps one slot per family when the cap would drop the smallest file", () => {
    const summaries = [
      summary("04_applications_systems.csv", "technology_estate", 750),
      summary("16_expert_lenses.csv", "expert_lens", 40),
      summary("00_enterprise_profile.csv", "enterprise_profile", 1),
    ];

    const kept = reserveOnePerFamily(summaries, MANIFEST, 2);
    expect(kept.map((s) => s.sourcePath.split("/").pop())).toContain("00_enterprise_profile.csv");
  });

  it("leaves the list alone when it already fits", () => {
    const summaries = [summary("00_enterprise_profile.csv", "enterprise_profile", 1)];
    expect(reserveOnePerFamily(summaries, MANIFEST, 180)).toBe(summaries);
  });
});
