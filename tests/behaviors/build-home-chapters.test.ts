import {
  assignVisuals,
  assignQuestions,
  assembleChapterSlices,
  type ChapterId,
} from "../../scripts/data-build/build-home-chapters";
import type { EnterpriseThesis, GroundedClaim, VisualOpportunity } from "../../scripts/data-build/build-enterprise-thesis";
import type { Signal } from "../../scripts/data-build/enterprise-signal-packet";

/**
 * The chapter writer's whole job is routing already-verified thesis content into eight buckets
 * without rediscovering the enterprise eight times -- these tests pin down that routing is
 * deterministic and doesn't silently drop or duplicate content across chapters in a way that
 * would matter (visuals must not duplicate; claims are allowed to, since Executive Brief is a
 * deliberate landing-page echo of other chapters' top material).
 */

function claim(statement: string, evidence_ids: string[] = ["sig_a", "sig_b"], claim_type: GroundedClaim["claim_type"] = "CROSS_DOMAIN_INSIGHT"): GroundedClaim {
  return { statement, evidence_ids, confidence: "medium", claim_type };
}

function visual(dataset_ref: string, priority: VisualOpportunity["priority"] = "medium"): VisualOpportunity {
  return {
    visual_type: "bar",
    title: `Title for ${dataset_ref}`,
    purpose: "p",
    dataset_ref,
    key_message: "m",
    evidence_ids: [],
    priority,
  };
}

function signal(id: string, domains: string[]): Signal {
  return { id, kind: "concentration", statement: `statement for ${id}`, domains, evidenceRefs: [] };
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
    signal("sig_tech", ["vendor_contract"]),
    signal("sig_ops", ["workforce_role"]),
  ],
  contextItems: [] as Array<{ id: string; statement: string; domains: string[] }>,
  visualDatasets: {} as Record<string, Array<Record<string, unknown>>>,
  analyticalLenses: [] as Array<{ kind: "industry_pattern" | "expert_lens"; label: string }>,
};

describe("assignVisuals", () => {
  it("routes each visual to its dataset's preferred chapter, and no chapter besides Executive Brief duplicates one", () => {
    const thesis = minimalThesis({
      visual_opportunities: [
        visual("vendor_spend_concentration", "high"),
        visual("leadership_theme_frequency", "medium"),
        visual("risk_system_concentration", "low"),
      ],
    });
    const byChapter = assignVisuals(thesis);
    expect(byChapter.technology_data.map((v) => v.dataset_ref)).toContain("vendor_spend_concentration");
    expect(byChapter.leadership_perspective.map((v) => v.dataset_ref)).toContain("leadership_theme_frequency");
    expect(byChapter.what_needs_attention.map((v) => v.dataset_ref)).toContain("risk_system_concentration");

    // Every non-Executive-Brief chapter's visuals are disjoint -- no dataset_ref appears twice
    // outside Executive Brief's deliberate landing-page echo.
    const nonBriefChapters = (Object.keys(byChapter) as ChapterId[]).filter((c) => c !== "executive_brief");
    const seen = new Set<string>();
    for (const c of nonBriefChapters) {
      for (const v of byChapter[c]) {
        expect(seen.has(v.dataset_ref)).toBe(false);
        seen.add(v.dataset_ref);
      }
    }
  });

  it("gives Executive Brief the single highest-priority visual across the whole thesis", () => {
    const thesis = minimalThesis({
      visual_opportunities: [
        visual("risk_system_concentration", "low"),
        visual("vendor_spend_concentration", "high"),
        visual("leadership_theme_frequency", "medium"),
      ],
    });
    const byChapter = assignVisuals(thesis);
    expect(byChapter.executive_brief).toHaveLength(1);
    expect(byChapter.executive_brief[0].dataset_ref).toBe("vendor_spend_concentration");
  });

  it("falls back an unmapped dataset_ref to What Needs Attention rather than dropping it", () => {
    const thesis = minimalThesis({ visual_opportunities: [visual("some_future_dataset")] });
    const byChapter = assignVisuals(thesis);
    expect(byChapter.what_needs_attention.map((v) => v.dataset_ref)).toContain("some_future_dataset");
  });
});

describe("assignQuestions", () => {
  // questions_for_management became a GroundedClaim[] (statement = the question text) after a live
  // run found questions embedding fabricated factual premises with zero evidence backing -- a
  // question is not exempt from the evidence rule just because it's phrased as a question.

  it("routes a question to the chapter whose keywords it matches", () => {
    const thesis = minimalThesis({
      questions_for_management: [
        claim("What is the funding plan for the vendor contract renewal?"),
        claim("How was the declared portfolio return calculated for this strategic priority?"),
      ],
    });
    const byChapter = assignQuestions(thesis);
    expect(byChapter.technology_data).toContain("What is the funding plan for the vendor contract renewal?");
    expect(byChapter.strategy_value_creation).toContain("How was the declared portfolio return calculated for this strategic priority?");
  });

  it("routes an unmatched question to What Needs Attention rather than dropping it", () => {
    const thesis = minimalThesis({ questions_for_management: [claim("Completely unrelated phrasing with no keyword match.")] });
    const byChapter = assignQuestions(thesis);
    expect(byChapter.what_needs_attention).toContain("Completely unrelated phrasing with no keyword match.");
  });

  it("gives Executive Brief a top slice of questions regardless of keyword, capped at 5", () => {
    const thesis = minimalThesis({
      questions_for_management: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7"].map((q) => claim(q)),
    });
    const byChapter = assignQuestions(thesis);
    expect(byChapter.executive_brief).toEqual(["Q1", "Q2", "Q3", "Q4", "Q5"]);
  });

  it("drops a null (verifier-rejected) question rather than crashing or leaking it through", () => {
    const thesis = minimalThesis({
      questions_for_management: [claim("Survivor question?"), null as unknown as GroundedClaim],
    });
    const byChapter = assignQuestions(thesis);
    // The single survivor legitimately appears twice by design (Executive Brief echoes the top
    // slice, same as visuals) -- what this test actually pins down is that the null entry never
    // appears anywhere as "null"/"undefined" text and doesn't crash the routing.
    const allRouted = Object.values(byChapter).flat();
    expect(allRouted).toContain("Survivor question?");
    expect(allRouted.every((q) => q === "Survivor question?")).toBe(true);
  });
});

describe("assembleChapterSlices", () => {
  it("splits structural_constraints into a tech bucket and an operations bucket by evidence domain", () => {
    const thesis = minimalThesis({
      structural_constraints: [
        claim("Tech constraint", ["sig_tech"], "FACT"),
        claim("Ops constraint", ["sig_ops"], "FACT"),
      ],
    });
    const slices = assembleChapterSlices(thesis, packet);
    expect(slices.technology_data.tensions.map((c) => c.statement)).toContain("Tech constraint");
    expect(slices.how_we_operate.key_insights.map((c) => c.statement)).toContain("Ops constraint");
    expect(slices.how_we_operate.key_insights.map((c) => c.statement)).not.toContain("Tech constraint");
  });

  it("routes strategic_bets to Strategy & Value Creation and nowhere else", () => {
    const thesis = minimalThesis({ strategic_bets: [claim("A strategic bet")] });
    const slices = assembleChapterSlices(thesis, packet);
    expect(slices.strategy_value_creation.key_insights.map((c) => c.statement)).toContain("A strategic bet");
    expect(slices.our_business.key_insights.map((c) => c.statement)).not.toContain("A strategic bet");
  });

  it("routes value_creation_model drivers and dependencies to Our Business", () => {
    const thesis = minimalThesis({
      value_creation_model: {
        summary: "s",
        primary_value_drivers: [claim("A value driver")],
        economic_dependencies: [claim("A dependency")],
      },
    });
    const slices = assembleChapterSlices(thesis, packet);
    const statements = slices.our_business.key_insights.map((c) => c.statement);
    expect(statements).toEqual(expect.arrayContaining(["A value driver", "A dependency"]));
  });

  it("routes leadership_consensus and leadership_disagreements to Leadership Perspective", () => {
    const thesis = minimalThesis({
      leadership_consensus: [claim("Consensus item")],
      leadership_disagreements: [claim("Disagreement item")],
    });
    const slices = assembleChapterSlices(thesis, packet);
    expect(slices.leadership_perspective.key_insights.map((c) => c.statement)).toContain("Consensus item");
    expect(slices.leadership_perspective.tensions.map((c) => c.statement)).toContain("Disagreement item");
  });

  it("copies what_needs_attention into Executive Brief without removing it from What Needs Attention", () => {
    const thesis = minimalThesis({ what_needs_attention: [claim("A material gap")] });
    const slices = assembleChapterSlices(thesis, packet);
    expect(slices.executive_brief.tensions.map((c) => c.statement)).toContain("A material gap");
    expect(slices.what_needs_attention.key_insights.map((c) => c.statement)).toContain("A material gap");
  });

  it("drops a null (verifier-rejected) claim from every chapter's slice rather than crashing", () => {
    const thesis = minimalThesis({
      // dropClaim leaves a null in place of a rejected claim -- chapters must filter it out.
      strategic_bets: [claim("Survivor"), null as unknown as GroundedClaim],
    });
    const slices = assembleChapterSlices(thesis, packet);
    expect(slices.strategy_value_creation.key_insights).toHaveLength(1);
    expect(slices.strategy_value_creation.key_insights[0].statement).toBe("Survivor");
  });
});
