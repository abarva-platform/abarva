import {
  validateStructure,
  parseThesisJson,
  dropClaim,
  type EnterpriseThesis,
  type GroundedClaim,
} from "../../scripts/data-build/build-enterprise-thesis";
import type { Signal } from "../../scripts/data-build/enterprise-signal-packet";

/**
 * The structural validator is the cheap, automatic half of the two-tier verification this layer
 * relies on (the other half, entailment checking, needs a live model call and isn't testable
 * offline). This checks the part that is: every claim must cite real evidence ids, and every claim
 * must span at least two domains — the same "a real insight connects two or more domains" bar the
 * prompt states, made mechanically enforceable rather than only requested.
 */

function signal(id: string, domains: string[]): Signal {
  return { id, kind: "concentration", statement: `statement for ${id}`, domains, evidenceRefs: [] };
}

function claim(statement: string, evidence_ids: string[]): GroundedClaim {
  return { statement, evidence_ids, confidence: "medium" };
}

function minimalThesis(overrides: Partial<EnterpriseThesis> = {}): EnterpriseThesis {
  return {
    enterprise_story: "story",
    value_creation_model: { summary: "s", primary_value_drivers: [], economic_dependencies: [], evidence_ids: [] },
    strategic_bets: [],
    structural_constraints: [],
    operating_tensions: [],
    leadership_consensus: [],
    leadership_disagreements: [],
    performance_story: { where_improving: [], where_off_track: [], where_unknown: [] },
    technology_and_data_implications: [],
    material_risks: [],
    value_realization_tensions: [],
    evidence_gaps: [],
    things_a_new_cxo_should_know: [],
    questions_for_management: [],
    ...overrides,
  };
}

const packet = {
  enterpriseIdentity: { businessModel: null, industry: null, revenue: null, employeeCount: null },
  businessEconomics: { operatingSegments: [], customerSegments: [], technologyBudget: 0, technologyBudgetShareOfRevenue: null },
  strategicPriorities: [] as string[],
  coverageManifest: {
    dimensionCoverage: [],
    leadershipToPortfolioLinkage: { resolvableRows: 0, totalRows: 0, coveragePct: 0, linkedPrograms: 0, interpretation: "" },
    vendorDocumentEvidence: { contractsWithExtraction: 0, totalContracts: 0, interpretation: "" },
    metricComparability: { comparable: 0, total: 0, inconsistentNotation: 0, interpretation: "" },
    prohibitedComparisons: [] as string[],
  },
  signals: [
    signal("sig_a", ["vendor_contract"]),
    signal("sig_b", ["risk_or_control"]),
    signal("sig_c", ["vendor_contract"]),
  ],
};

describe("validateStructure", () => {
  it("passes a claim citing evidence that spans two domains", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("cross-domain claim", ["sig_a", "sig_b"])] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toEqual([]);
  });

  it("flags a claim with no evidence_ids", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("unsupported claim", [])] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("no evidence_ids");
  });

  it("flags a claim whose evidence spans only one domain, even with multiple ids", () => {
    // Two ids, same domain -- restating one signal twice is not a cross-domain connection.
    const thesis = minimalThesis({ strategic_bets: [claim("single-domain claim", ["sig_a", "sig_c"])] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("1 domain");
  });

  it("flags a claim citing an evidence id that does not exist in the packet", () => {
    const thesis = minimalThesis({ material_risks: [claim("fabricated citation", ["sig_nonexistent"])] });
    const issues = validateStructure(thesis, packet);
    expect(issues.some((i) => i.reason.includes("unknown evidence id"))).toBe(true);
  });

  it("checks every claim category, not just the first one populated", () => {
    const thesis = minimalThesis({
      strategic_bets: [claim("ok", ["sig_a", "sig_b"])],
      material_risks: [claim("bad", [])],
      things_a_new_cxo_should_know: [claim("also bad", [])],
    });
    const issues = validateStructure(thesis, packet);
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(["material_risks[0]", "things_a_new_cxo_should_know[0]"]),
    );
  });
});

describe("parseThesisJson", () => {
  it("parses clean JSON", () => {
    const thesis = minimalThesis();
    expect(parseThesisJson(JSON.stringify(thesis))).toEqual(thesis);
  });

  it("strips a markdown code fence a model adds despite being told not to", () => {
    const thesis = minimalThesis();
    const fenced = "```json\n" + JSON.stringify(thesis) + "\n```";
    expect(parseThesisJson(fenced)).toEqual(thesis);
  });

  it("returns null rather than throwing on malformed output", () => {
    expect(parseThesisJson("not json at all")).toBeNull();
  });
});

describe("dropClaim", () => {
  it("removes a rejected claim from its array by path", () => {
    const thesis = minimalThesis({
      material_risks: [claim("keep me", ["sig_a", "sig_b"]), claim("reject me", ["sig_a"])],
    });
    dropClaim(thesis, "material_risks[1]");
    expect(thesis.material_risks.filter(Boolean)).toHaveLength(1);
    expect(thesis.material_risks.filter(Boolean)[0].statement).toBe("keep me");
  });

  it("handles a nested path like performance_story.where_improving[0]", () => {
    const thesis = minimalThesis({
      performance_story: { where_improving: [claim("reject me", ["sig_a"])], where_off_track: [], where_unknown: [] },
    });
    dropClaim(thesis, "performance_story.where_improving[0]");
    expect(thesis.performance_story.where_improving.filter(Boolean)).toHaveLength(0);
  });
});
