import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  findDuplicateSectionHeadings,
  findUnsupportedQuantifiedClaims,
  meetsGoldenBar,
} from "../golden-bar";
import { premiumGoldenBarOptionsForArtifact } from "../strategic-moves-artifact-standard";

const GOLDEN_DIR = join(process.cwd(), "docs/build/golden-artifacts");

describe("golden-bar acceptance helper (Slice 0)", () => {
  it("the staged golden decks PASS the bar (real SVG, no DATA GAP, not prose-only)", () => {
    const decks = [
      "Target-State-Architecture.html",
      "Clinical-Claims-Databricks-Strategy.html",
    ];
    for (const name of decks) {
      const p = join(GOLDEN_DIR, name);
      if (!existsSync(p)) continue; // skip if not staged in this checkout
      const r = meetsGoldenBar(readFileSync(p, "utf8"));
      expect(r.svgCount).toBeGreaterThan(0);
      expect(r.hasDataGap).toBe(false);
      expect(r.proseOnly).toBe(false);
      expect(r.pass).toBe(true);
    }
  });

  it("FAILS a prose-only artifact (no visuals, no tables)", () => {
    const r = meetsGoldenBar(
      "<html><body><h1>Design Brief</h1><p>lots of prose.</p></body></html>",
    );
    expect(r.pass).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/prose-only|no rendered/i);
  });

  it("FAILS an artifact that still contains [DATA GAP]", () => {
    const r = meetsGoldenBar(
      "<html><body><svg></svg><p>Current state: [DATA GAP: tech_stack]</p></body></html>",
    );
    expect(r.hasDataGap).toBe(true);
    expect(r.pass).toBe(false);
  });

  it("checks required exhibits when an artifact key is given", () => {
    // an architecture artifact with only one diagram → missing the rest
    const r = meetsGoldenBar(
      '<html><body><svg></svg><div class="diagram">conceptual</div></body></html>',
      "target_state_architecture",
    );
    expect(r.pass).toBe(false);
    expect(r.missingVisuals.length).toBeGreaterThan(0);
  });

  it("recognizes contract exhibits when rendered as section titles plus tables", () => {
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Value Tree</text></svg>
        <svg><text>Stakeholder Map</text></svg>
        <h2>KPI Scorecard - Shell Pending Input</h2>
        <table><tr><th>Outcome Domain</th><th>Target</th></tr></table>
        <h2>Scope Boundary - In / Out / Adjacent</h2>
        <table><tr><th>Dimension</th><th>In Scope</th><th>Out of Scope</th></tr></table>
        <h2>Proceed / Hold / Stop - P0 Gate Criteria</h2>
        <table><tr><th>Decision</th><th>Criteria</th></tr></table>
      </body></html>`,
      "charter",
    );
    expect(r.missingVisuals).toEqual([]);
    expect(r.missingTables).toEqual([]);
    expect(r.pass).toBe(true);
  });

  it("accepts singular/plural variants for architecture decision-record tradeoff exhibits", () => {
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Conceptual architecture diagram</text></svg>
        <svg><text>Logical architecture diagram</text></svg>
        <svg><text>Physical deployment diagram</text></svg>
        <svg><text>Integration data flow diagram</text></svg>
        <svg><text>Native vs non-native service pattern</text></svg>
        <svg><text>Current-to-future operating concept</text></svg>
        <svg><text>Human + AI role model</text></svg>
        <svg><text>Governance / control model</text></svg>
        <h2>Decision Record and Tradeoff Table</h2>
        <table><tr><th>Decision</th><th>Tradeoff</th></tr></table>
        <h2>KPI to Capability Traceability</h2>
        <table><tr><th>KPI</th><th>Capability</th></tr></table>
        <h2>Current-to-Future Logic Table</h2>
        <table><tr><th>P2 finding</th><th>Implication</th></tr></table>
        <h2>Human + AI Role Model</h2>
        <table><tr><th>Activity</th><th>Human owner</th><th>AI role</th></tr></table>
        <h2>Workflow Option Matrix</h2>
        <table><tr><th>Option</th><th>Fit</th></tr></table>
        <h2>Control / Governance Matrix</h2>
        <table><tr><th>Control</th><th>Hook</th></tr></table>
        <h2>Implementation Work Package Table</h2>
        <table><tr><th>Objective</th><th>Owner</th></tr></table>
        <h2>Open Decision Log</h2>
        <table><tr><th>Decision</th><th>Owner</th></tr></table>
        <h2>Roadmap Planning Readiness Checklist</h2>
        <table><tr><th>Item</th><th>Status</th></tr></table>
      </body></html>`,
      "target_state_architecture",
    );

    expect(r.missingVisuals).toEqual([]);
    expect(r.missingTables).toEqual([]);
    expect(r.pass).toBe(true);
  });

  it("flags shallow premium P2 artifacts even when visuals are present", () => {
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Current-state architecture diagram</text></svg>
        <svg><text>Current-state data-flow diagram</text></svg>
        <svg><text>Current-state process map</text></svg>
        <svg><text>Root-cause map</text></svg>
        <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
        <h2>KPI Baseline Table</h2><table><tr><td>kpi</td></tr></table>
        <h2>Evidence Source Table</h2><table><tr><td>evidence</td></tr></table>
        <p>Too thin.</p>
      </body></html>`,
      "discovery_report",
      { minimumWordCount: 2500 },
    );
    expect(r.pass).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/needs depth/i);
  });

  it("blocks forbidden internal language when premium options are enabled", () => {
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Value Tree</text></svg>
        <svg><text>KPI Scorecard</text></svg>
        <svg><text>Stakeholder Map</text></svg>
        <h2>Scope Boundary Table</h2><table><tr><td>scope</td></tr></table>
        <h2>Proceed Hold Stop Gate</h2><table><tr><td>go</td></tr></table>
        <p>This mentions a blob path and source row.</p>
      </body></html>`,
      "charter",
      { forbiddenLanguage: ["blob path", "source row"] },
    );
    expect(r.pass).toBe(false);
    expect(r.forbiddenLanguageHits).toEqual(["blob path", "source row"]);
  });

  it("fails premium P2 when exact metrics exist but are not used", () => {
    const enoughWords = Array.from({ length: 2550 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Current-state architecture diagram</text></svg>
        <svg><text>Current-state data-flow diagram</text></svg>
        <svg><text>Current-state process map</text></svg>
        <svg><text>Root-cause map</text></svg>
        <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
        <h2>KPI Baseline Table</h2><table><tr><td>baseline</td></tr></table>
        <h2>Evidence Source Table</h2><table><tr><td>evidence</td></tr></table>
        <p>The AP exception process has meaningful volume and manual effort.</p>
        <p>${enoughWords}</p>
      </body></html>`,
      "discovery_report",
      {
        minimumWordCount: 2500,
        requiredExactEvidenceTerms: ["1,872", "2,345", "7.4"],
      },
    );
    expect(r.pass).toBe(false);
    expect(r.missingExactEvidenceTerms).toEqual(["1,872", "2,345", "7.4"]);
    expect(r.reasons.join(" ")).toMatch(/missing exact evidence terms/i);
  });

  it("fails premium P2 when exception taxonomy exists but is ignored", () => {
    const enoughWords = Array.from({ length: 2550 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body>
        <svg><text>Current-state architecture diagram</text></svg>
        <svg><text>Current-state data-flow diagram</text></svg>
        <svg><text>Current-state process map</text></svg>
        <svg><text>Root-cause map</text></svg>
        <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
        <h2>KPI Baseline Table</h2><table><tr><td>baseline</td></tr></table>
        <h2>Evidence Source Table</h2><table><tr><td>evidence</td></tr></table>
        <p>Exceptions should be categorized and routed.</p>
        <p>${enoughWords}</p>
      </body></html>`,
      "discovery_report",
      {
        minimumWordCount: 2500,
        requiredTaxonomyTerms: ["Missing PO", "Price mismatch", "Payment hold / control review"],
      },
    );
    expect(r.pass).toBe(false);
    expect(r.missingTaxonomyTerms).toEqual([
      "Missing PO",
      "Price mismatch",
      "Payment hold / control review",
    ]);
  });

  it("fails premium P2 when the client-facing body exposes a raw Move ID label", () => {
    const enoughWords = Array.from({ length: 2550 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body>
        <p>Move ID: 6f91c9a9</p>
        <svg><text>Current-state architecture diagram</text></svg>
        <svg><text>Current-state data-flow diagram</text></svg>
        <svg><text>Current-state process map</text></svg>
        <svg><text>Root-cause map</text></svg>
        <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
        <h2>KPI Baseline Table</h2><table><tr><td>baseline</td></tr></table>
        <h2>Evidence Source Table</h2><table><tr><td>evidence</td></tr></table>
        <p>${enoughWords}</p>
      </body></html>`,
      "discovery_report",
      {
        minimumWordCount: 2500,
        forbidClientFacingRawIds: true,
      },
    );
    expect(r.pass).toBe(false);
    expect(r.rawClientFacingIdHits).toEqual(["Move ID:"]);
  });

  it("passes evidence-specific premium P2 when exact evidence and taxonomy are used", () => {
    const enoughWords = Array.from({ length: 2550 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body>
        <p>Workstream: Vendor Invoice Exception Handling Redesign</p>
        <p>The diagnostic uses 1,872 monthly exceptions, 2,345 manual touch hours, and 7.4 average resolution days.</p>
        <svg><text>Current-state architecture diagram</text></svg>
        <svg><text>Current-state data-flow diagram</text></svg>
        <svg><text>Current-state process map</text></svg>
        <svg><text>Root-cause map</text></svg>
        <h2>Gap Matrix</h2><table><tr><td>gap</td></tr></table>
        <h2>KPI Baseline Table</h2><table><tr><td>baseline</td></tr></table>
        <h2>Evidence Source Table</h2><table><tr><td>Missing PO</td><td>Price mismatch</td><td>Payment hold / control review</td></tr></table>
        <p>${enoughWords}</p>
      </body></html>`,
      "discovery_report",
      {
        minimumWordCount: 2500,
        requiredExactEvidenceTerms: ["1,872", "2,345", "7.4"],
        requiredTaxonomyTerms: ["Missing PO", "Price mismatch", "Payment hold / control review"],
        forbidClientFacingRawIds: true,
      },
    );
    expect(r.pass).toBe(true);
  });

  it("flags running over the concision ceiling as informational only — does not fail the bar", () => {
    const longBody = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body><svg></svg><table></table><p>${longBody}</p></body></html>`,
      undefined,
      { maximumWordCount: 20 },
    );
    expect(r.overMaximumWordCount).toBe(true);
    expect(r.pass).toBe(true);
    expect(r.qualityScore).toBeLessThan(92);
  });

  it("blocks over-ceiling artifacts when the artifact contract makes concision enforceable", () => {
    const longBody = Array.from({ length: 50 }, (_, i) => `word${i}`).join(" ");
    const r = meetsGoldenBar(
      `<html><body><svg></svg><table></table><p>${longBody}</p></body></html>`,
      undefined,
      { maximumWordCount: 20, enforceMaximumWordCount: true },
    );
    expect(r.overMaximumWordCount).toBe(true);
    expect(r.pass).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/blocks acceptance/i);
  });

  it("enforces rendered-size ceilings for concise Moves decision artifacts only", () => {
    expect(
      premiumGoldenBarOptionsForArtifact("solution_design")
        .enforceMaximumWordCount,
    ).toBe(true);
    expect(
      premiumGoldenBarOptionsForArtifact("operating_model_design")
        .enforceMaximumWordCount,
    ).toBe(true);
    expect(
      premiumGoldenBarOptionsForArtifact("sourcing_strategy")
        .enforceMaximumWordCount,
    ).toBe(true);
    expect(
      premiumGoldenBarOptionsForArtifact("target_state_architecture")
        .enforceMaximumWordCount,
    ).toBeUndefined();
  });

  it("forbids internal implementation language leaking into every artifact type, including ones with no depth-band branch of their own", () => {
    // charter/discovery_report, target_state_architecture, and
    // solution_design/operating_model_design/sourcing_strategy each have
    // their own branch that already sets forbiddenLanguage — this covers the
    // remaining artifact types that fall through to the generic branch and,
    // before this fix, got no forbidden-language check at all.
    for (const artifact of [
      "business_case",
      "execution_roadmap",
      "root_cause_worksheet",
      "solution_approach_options",
      "handoff_package",
    ] as const) {
      const options = premiumGoldenBarOptionsForArtifact(artifact);
      expect(options.forbiddenLanguage?.length).toBeGreaterThan(0);
      expect(options.forbiddenLanguage).toContain("tenant key");
    }
  });

  it("a business_case containing internal implementation language fails the bar", () => {
    const r = meetsGoldenBar(
      `<html><body><svg></svg><table></table>
        <p>The recommendation is grounded in the tenant key resolved for this Move.</p>
      </body></html>`,
      undefined,
      premiumGoldenBarOptionsForArtifact("business_case"),
    );
    expect(r.forbiddenLanguageHits).toContain("tenant key");
    expect(r.pass).toBe(false);
  });

  it("does not flag overMaximumWordCount when under the ceiling", () => {
    const r = meetsGoldenBar(
      "<html><body><svg></svg><table></table><p>short body.</p></body></html>",
      undefined,
      { maximumWordCount: 20 },
    );
    expect(r.overMaximumWordCount).toBe(false);
  });

  it("flags quantified claims with no evidence-qualifying language nearby", () => {
    const r = meetsGoldenBar(
      `<html><body><svg></svg><table></table>
        <p>Automation reduces cost by 40% and saves $1.2M annually.</p>
        <p>Current evidence supports a 12% reduction in exception volume.</p>
      </body></html>`,
    );
    expect(r.unsupportedClaimSignals.length).toBe(1);
    expect(r.unsupportedClaimSignals[0]).toMatch(/40%/);
    // Unsupported claims are a quality-score signal, not a pass/fail gate.
    expect(r.pass).toBe(true);
    expect(r.qualityScore).toBeLessThan(92);
  });

  it("computes a real qualityScore instead of a fixed placeholder", () => {
    const clean = meetsGoldenBar(
      "<html><body><svg></svg><table></table><p>Current evidence supports steady state.</p></body></html>",
    );
    expect(clean.qualityScore).toBe(92);

    const failing = meetsGoldenBar(
      "<html><body><p>prose-only, no visuals or tables.</p></body></html>",
    );
    expect(failing.pass).toBe(false);
    expect(failing.qualityScore).toBeLessThan(92);
  });
});

describe("duplicate section headings (informational — does not block pass)", () => {
  it("findDuplicateSectionHeadings flags a heading repeated verbatim", () => {
    const dupes = findDuplicateSectionHeadings(
      "<h2>Current State Overview</h2><p>a</p><h2>Findings</h2><p>b</p><h2>Current State Overview</h2>",
    );
    expect(dupes).toEqual(["Current State Overview"]);
  });

  it("findDuplicateSectionHeadings is case/whitespace-insensitive and dedupes report order", () => {
    const dupes = findDuplicateSectionHeadings(
      "<h3>Risk  Register</h3><h2>Overview</h2><h3>risk register</h3><h2>Overview</h2>",
    );
    expect(dupes).toEqual(["Risk Register", "Overview"]);
  });

  it("findDuplicateSectionHeadings returns an empty array when every heading is unique", () => {
    expect(
      findDuplicateSectionHeadings("<h2>Overview</h2><h2>Findings</h2><h3>Next Steps</h3>"),
    ).toEqual([]);
  });

  it("meetsGoldenBar surfaces duplicate headings as informational — it does not fail the bar", () => {
    const r = meetsGoldenBar(
      `<html><body><svg></svg><table></table>
        <h2>Current State Overview</h2><p>text</p>
        <h2>Findings</h2><p>text</p>
        <h2>Current State Overview</h2><p>duplicate content the model re-authored</p>
      </body></html>`,
    );
    expect(r.duplicateSectionHeadings).toEqual(["Current State Overview"]);
    expect(r.reasons.join(" ")).toMatch(/repeats section headings.*Current State Overview/i);
    expect(r.pass).toBe(true);
    expect(r.qualityScore).toBeLessThan(92);
  });

  it("meetsGoldenBar reports no duplicates for a clean artifact", () => {
    const r = meetsGoldenBar(
      "<html><body><svg></svg><table></table><h2>Overview</h2><h2>Findings</h2></body></html>",
    );
    expect(r.duplicateSectionHeadings).toEqual([]);
    expect(r.reasons.join(" ")).not.toMatch(/repeats section headings/i);
  });
});

describe("findUnsupportedQuantifiedClaims", () => {
  it("ignores quantified claims paired with evidence-qualifying language", () => {
    expect(
      findUnsupportedQuantifiedClaims(
        "Evidence supports a 25% reduction. This remains an assumption until validated: $500K.",
      ),
    ).toEqual([]);
  });

  it("flags quantified claims with no qualifying language", () => {
    const hits = findUnsupportedQuantifiedClaims(
      "Savings will reach $2.5M by year two. Headcount drops by 30%.",
    );
    expect(hits.length).toBe(2);
  });
});
