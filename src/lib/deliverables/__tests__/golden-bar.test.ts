import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { meetsGoldenBar } from "../golden-bar";

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
        <h2>Decision Record and Tradeoff Table</h2>
        <table><tr><th>Decision</th><th>Tradeoff</th></tr></table>
        <h2>KPI to Capability Traceability</h2>
        <table><tr><th>KPI</th><th>Capability</th></tr></table>
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
});
