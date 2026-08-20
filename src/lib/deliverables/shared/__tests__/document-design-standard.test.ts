import {
  brandProfileDisclosure,
  brandProfileIsClientFacing,
  DEFAULT_BRAND_PROFILE,
  DEFAULT_DOCUMENT_DESIGN,
  describeFlowEdge,
  DOCUMENT_DESIGN_STANDARD,
  documentDesignFor,
  estimatePages,
  isGenericApproachLabel,
  physicalArchitectureTriggered,
  requiresSolutionDepth,
  tableOfContentsRequired,
  UNVALIDATED_FLOW_LABEL,
  WORDS_PER_PAGE,
  type ArchitectureFlowEdge,
  type DocumentBrandProfile,
} from "../document-design-standard";

describe("estimatePages", () => {
  it("rounds up to whole pages at the stated density", () => {
    expect(estimatePages(WORDS_PER_PAGE)).toBe(1);
    expect(estimatePages(WORDS_PER_PAGE + 1)).toBe(2);
    expect(estimatePages(WORDS_PER_PAGE * 8)).toBe(8);
  });

  it("never returns less than one page, including for degenerate input", () => {
    expect(estimatePages(0)).toBe(1);
    expect(estimatePages(-500)).toBe(1);
    expect(estimatePages(Number.NaN)).toBe(1);
  });
});

describe("tableOfContentsRequired", () => {
  const base = {
    rule: "auto" as const,
    estimatedPages: 3,
    substantiveSectionCount: 4,
    hasAppendices: false,
  };

  it("honours an explicit required/none rule regardless of size", () => {
    expect(tableOfContentsRequired({ ...base, rule: "required" })).toBe(true);
    expect(
      tableOfContentsRequired({
        ...base,
        rule: "none",
        estimatedPages: 40,
        substantiveSectionCount: 20,
        hasAppendices: true,
      }),
    ).toBe(false);
  });

  it("stays off for a short, few-section document", () => {
    expect(tableOfContentsRequired(base)).toBe(false);
  });

  it("turns on at 8 pages", () => {
    expect(tableOfContentsRequired({ ...base, estimatedPages: 7 })).toBe(false);
    expect(tableOfContentsRequired({ ...base, estimatedPages: 8 })).toBe(true);
  });

  it("turns on at 7 substantive sections", () => {
    expect(
      tableOfContentsRequired({ ...base, substantiveSectionCount: 6 }),
    ).toBe(false);
    expect(
      tableOfContentsRequired({ ...base, substantiveSectionCount: 7 }),
    ).toBe(true);
  });

  it("turns on whenever there are appendices, however short", () => {
    expect(
      tableOfContentsRequired({
        ...base,
        estimatedPages: 2,
        hasAppendices: true,
      }),
    ).toBe(true);
  });
});

describe("isGenericApproachLabel", () => {
  it("rejects degree-of-effort placeholders", () => {
    for (const label of [
      "Basic",
      "Intermediate",
      "Advanced",
      "Option 1 - Basic",
      "Option 2 — Advanced",
      "Approach A",
      "Small",
      "Large",
    ]) {
      expect(isGenericApproachLabel(label)).toBe(true);
    }
  });

  it("accepts labels that name an actual alternative", () => {
    for (const label of [
      "Build natively on the shared lakehouse foundation",
      "Use the core clinical system's native capability",
      "Extend an already-licensed product",
      "Introduce a specialised third-party platform",
    ]) {
      expect(isGenericApproachLabel(label)).toBe(false);
    }
  });
});

describe("physicalArchitectureTriggered", () => {
  it("requires all three preconditions", () => {
    expect(
      physicalArchitectureTriggered({
        platformSelected: true,
        environmentTopologyDecided: true,
        integrationPatternsDecided: true,
      }),
    ).toBe(true);
  });

  it("stays off while any decision is outstanding", () => {
    expect(
      physicalArchitectureTriggered({
        platformSelected: true,
        environmentTopologyDecided: true,
        integrationPatternsDecided: false,
      }),
    ).toBe(false);
    expect(
      physicalArchitectureTriggered({
        platformSelected: false,
        environmentTopologyDecided: true,
        integrationPatternsDecided: true,
      }),
    ).toBe(false);
  });
});

describe("describeFlowEdge", () => {
  const edge = (over: Partial<ArchitectureFlowEdge>): ArchitectureFlowEdge => ({
    source: "Clinical system",
    target: "Bronze clinical",
    status: "validated",
    ...over,
  });

  it("renders only what is actually known", () => {
    expect(
      describeFlowEdge(
        edge({
          pattern: "batch",
          cadence: "daily",
          protocol: "database_extract",
        }),
      ),
    ).toBe("Batch · daily · database_extract");
  });

  it("omits unknown properties rather than guessing them", () => {
    expect(describeFlowEdge(edge({ pattern: "cdc" }))).toBe("CDC");
  });

  it("falls back to the to-validate label when nothing is established", () => {
    expect(describeFlowEdge(edge({ status: "to_validate" }))).toBe(
      UNVALIDATED_FLOW_LABEL,
    );
  });

  it("marks an unvalidated edge even when properties are present", () => {
    expect(
      describeFlowEdge(edge({ pattern: "streaming", status: "assumed" })),
    ).toBe("Streaming (to validate)");
  });

  it("surfaces PHI and write-back, which change the review path", () => {
    expect(
      describeFlowEdge(
        edge({
          pattern: "rest_api",
          direction: "write_back",
          containsPHI: true,
        }),
      ),
    ).toBe("REST/API · write-back · PHI");
  });
});

describe("brand profile approval", () => {
  const profile = (
    approval: DocumentBrandProfile["approval"],
  ): DocumentBrandProfile => ({ ...DEFAULT_BRAND_PROFILE, approval });

  it("only lets an approved profile go client-facing", () => {
    expect(brandProfileIsClientFacing(profile("tenant_approved"))).toBe(true);
    for (const state of [
      "reference_unapproved",
      "tenant_reviewed",
      "superseded",
    ] as const) {
      expect(brandProfileIsClientFacing(profile(state))).toBe(false);
    }
  });

  it("owes a disclosure for every state except approved", () => {
    expect(brandProfileDisclosure(profile("tenant_approved"))).toBeNull();
    for (const state of [
      "reference_unapproved",
      "tenant_reviewed",
      "superseded",
    ] as const) {
      expect(brandProfileDisclosure(profile(state))).toEqual(
        expect.stringMatching(/\S/),
      );
    }
  });

  it("ships the house default as unapproved, so it can never pass as a client brand", () => {
    expect(DEFAULT_BRAND_PROFILE.approval).toBe("reference_unapproved");
    expect(brandProfileIsClientFacing(DEFAULT_BRAND_PROFILE)).toBe(false);
  });
});

describe("DOCUMENT_DESIGN_STANDARD", () => {
  it("gives the charter a decision summary and no table of contents", () => {
    const charter = documentDesignFor("charter").presentation;
    expect(charter.executiveOpening).toBe("decision_summary_only");
    expect(charter.tableOfContents).toBe("none");
    expect(charter.typicalPages.max).toBeLessThanOrEqual(3);
  });

  it("requires a table of contents on the three artifacts a reader must navigate", () => {
    for (const key of [
      "solution_approach_options",
      "solution_design",
      "business_case",
    ] as const) {
      expect(documentDesignFor(key).presentation.tableOfContents).toBe(
        "required",
      );
    }
  });

  it("makes solution_design the deepest artifact", () => {
    const design = documentDesignFor("solution_design").presentation;
    const others = (
      ["business_case", "discovery_report", "operating_model_design"] as const
    ).map((k) => documentDesignFor(k).presentation.typicalPages.max);
    for (const max of others) {
      expect(design.typicalPages.max).toBeGreaterThan(max);
    }
  });

  it("attaches solution depth only to artifacts that actually design a solution", () => {
    for (const key of [
      "solution_design",
      "target_state_architecture",
      "solution_approach_options",
    ] as const) {
      expect(requiresSolutionDepth(key)).toBe(true);
    }
    for (const key of [
      "charter",
      "business_case",
      "execution_roadmap",
    ] as const) {
      expect(requiresSolutionDepth(key)).toBe(false);
    }
  });

  it("requires real alternatives wherever a choice is actually being made", () => {
    for (const key of [
      "solution_approach_options",
      "solution_design",
      "target_state_architecture",
      "sourcing_strategy",
    ] as const) {
      const depth = documentDesignFor(key).solutionDepth;
      expect(depth?.approachesRequired).toBe(true);
      expect(depth?.minimumCredibleApproaches).toBeGreaterThanOrEqual(2);
    }
  });

  it("never requires a physical architecture outright — it is always triggered", () => {
    for (const contract of Object.values(DOCUMENT_DESIGN_STANDARD)) {
      const physical = contract?.solutionDepth?.physicalArchitecture;
      if (physical) expect(physical).not.toBe("required");
    }
  });

  it("makes runtime flow conditional on the solution being dynamic", () => {
    for (const key of [
      "solution_design",
      "target_state_architecture",
    ] as const) {
      expect(documentDesignFor(key).solutionDepth?.runtimeFlow).toBe(
        "required_when_dynamic",
      );
    }
  });

  it("requires message-led headings on every artifact, with no exceptions", () => {
    for (const contract of Object.values(DOCUMENT_DESIGN_STANDARD)) {
      expect(contract?.presentation.messageLedHeadings).toBe(true);
    }
    expect(DEFAULT_DOCUMENT_DESIGN.presentation.messageLedHeadings).toBe(true);
  });

  it("states a coherent page band for every artifact", () => {
    for (const [key, contract] of Object.entries(DOCUMENT_DESIGN_STANDARD)) {
      const { min, max } = contract!.presentation.typicalPages;
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThanOrEqual(min);
      // A "typical" band wider than 20 pages is not a band, it is a shrug.
      expect(max - min).toBeLessThanOrEqual(20);
      expect(key).toEqual(expect.stringMatching(/\S/));
    }
  });

  it("falls back conservatively for an artifact with no entry", () => {
    // Cast through unknown deliberately: the point is what happens for a key
    // the table does not cover, which by construction is not in the union yet.
    const unmapped = documentDesignFor(
      "not_yet_defined" as unknown as "charter",
    );
    expect(unmapped).toBe(DEFAULT_DOCUMENT_DESIGN);
    expect(unmapped.presentation.executiveOpening).toBe("required");
  });
});
