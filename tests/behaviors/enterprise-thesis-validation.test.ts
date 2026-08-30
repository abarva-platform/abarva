import {
  validateStructure,
  parseThesisJson,
  parseJsonLoose,
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

// Defaults to CROSS_DOMAIN_INSIGHT so existing domain-span assertions keep testing that logic
// unchanged; tests targeting the new claim_type scoping pass an explicit type.
function claim(statement: string, evidence_ids: string[], claim_type: GroundedClaim["claim_type"] = "CROSS_DOMAIN_INSIGHT"): GroundedClaim {
  return { statement, evidence_ids, confidence: "medium", claim_type };
}

function minimalThesis(overrides: Partial<EnterpriseThesis> = {}): EnterpriseThesis {
  return {
    enterprise_story: "story",
    enterprise_story_claims: [],
    value_creation_model: { summary: "s", primary_value_drivers: [], economic_dependencies: [] },
    strategic_bets: [],
    structural_constraints: [],
    operating_tensions: [],
    leadership_consensus: [],
    leadership_disagreements: [],
    performance_story: { where_improving: [], where_off_track: [], where_unknown: [] },
    technology_and_data_implications: [],
    material_risks: [],
    value_realization_tensions: [],
    what_needs_attention: [],
    evidence_gaps: [],
    things_a_new_cxo_should_know: [],
    questions_for_management: [],
    visual_opportunities: [],
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
  contextItems: [{ id: "ctx_identity_001", statement: "Revenue is $1B.", domains: ["tenant_profile"] }],
  visualDatasets: { technology_spend_mix: [{ category: "Third party", amount: 100 }] } as Record<string, Array<Record<string, unknown>>>,
  sourceSummaries: [],
  analyticalLenses: [] as Array<{ kind: "industry_pattern" | "expert_lens"; label: string }>,
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

  it("does not require two domains for a FACT claim", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("single-domain fact", ["sig_a"], "FACT")] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toEqual([]);
  });

  it("does not require two domains for an OBSERVATION claim", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("single-domain observation", ["sig_a", "sig_c"], "OBSERVATION")] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toEqual([]);
  });

  it("still requires two domains for a CROSS_DOMAIN_INSIGHT claim", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("single-domain insight", ["sig_a"], "CROSS_DOMAIN_INSIGHT")] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("1 domain");
  });

  it("still requires two domains for an ADVISORY_INFERENCE claim", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("single-domain advice", ["sig_a"], "ADVISORY_INFERENCE")] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toHaveLength(1);
    expect(issues[0].reason).toContain("1 domain");
  });

  it("resolves a ctx_* evidence id the same as a sig_* one", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("identity fact", ["ctx_identity_001"], "FACT")] });
    const issues = validateStructure(thesis, packet);
    expect(issues).toEqual([]);
  });

  it("verifies enterprise_story_claims and value_creation_model claims, not just the named arrays", () => {
    const thesis = minimalThesis({
      enterprise_story_claims: [claim("bad story claim", [])],
      value_creation_model: {
        summary: "s",
        primary_value_drivers: [claim("bad driver", [])],
        economic_dependencies: [],
      },
    });
    const issues = validateStructure(thesis, packet);
    expect(issues.map((i) => i.path)).toEqual(
      expect.arrayContaining(["enterprise_story_claims[0]", "value_creation_model.primary_value_drivers[0]"]),
    );
  });

  it("flags a visual_opportunity with an unknown dataset_ref", () => {
    const thesis = minimalThesis({
      visual_opportunities: [{
        visual_type: "bar", title: "t", purpose: "p", dataset_ref: "does_not_exist",
        key_message: "m", evidence_ids: ["sig_a"], priority: "medium",
      }],
    });
    const issues = validateStructure(thesis, packet);
    expect(issues.some((i) => i.reason.includes("does not exist in visualDatasets"))).toBe(true);
  });

  it("flags a visual_opportunity with a visual_type outside the allowed grammar", () => {
    const thesis = minimalThesis({
      visual_opportunities: [{
        // @ts-expect-error -- deliberately invalid to test the allowlist check
        visual_type: "pie_of_doom", title: "t", purpose: "p", dataset_ref: "technology_spend_mix",
        key_message: "m", evidence_ids: ["sig_a"], priority: "medium",
      }],
    });
    const issues = validateStructure(thesis, packet);
    expect(issues.some((i) => i.reason.includes("not in the allowed grammar"))).toBe(true);
  });

  it("passes a valid visual_opportunity", () => {
    const thesis = minimalThesis({
      visual_opportunities: [{
        visual_type: "bar", title: "t", purpose: "p", dataset_ref: "technology_spend_mix",
        key_message: "m", evidence_ids: ["sig_a"], priority: "medium",
      }],
    });
    const issues = validateStructure(thesis, packet);
    expect(issues).toEqual([]);
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

describe("parseJsonLoose", () => {
  /**
   * The shared parser every small structured-output call in the pipeline (verifier, repair, prose
   * synthesis, chapter synthesis) now goes through. A live run found a real, non-hypothetical gap
   * here: the chapter-writer's calls hit a fenced response on 5 of 16 attempts before this helper
   * existed, and failed silently. This pins down the fence-stripping behavior generically (not just
   * for the EnterpriseThesis shape parseThesisJson wraps it for) so any future small-object call
   * site inherits the same protection by construction.
   */
  it("parses a small object shape, not just a full EnterpriseThesis", () => {
    const shape = { headline: "h", executive_synthesis: "e" };
    expect(parseJsonLoose<typeof shape>(JSON.stringify(shape), "test")).toEqual(shape);
  });

  it("strips a markdown code fence for a small object shape", () => {
    const shape = { verdict: "SUPPORTED", reasoning: "r" };
    const fenced = "```json\n" + JSON.stringify(shape) + "\n```";
    expect(parseJsonLoose<typeof shape>(fenced, "test")).toEqual(shape);
  });

  it("returns null rather than throwing on malformed output", () => {
    expect(parseJsonLoose("not json at all", "test")).toBeNull();
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
