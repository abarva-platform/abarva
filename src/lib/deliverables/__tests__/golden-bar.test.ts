import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { findUnsupportedQuantifiedClaims, meetsGoldenBar } from "../golden-bar";

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
        <h2>P4 Readiness Checklist</h2>
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
