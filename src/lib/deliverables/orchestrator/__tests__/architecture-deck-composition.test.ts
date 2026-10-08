import {
  composeArchitectureDeckPages,
  ARCHITECTURE_HEADLINE_ORDER,
} from "@/lib/deliverables/orchestrator/architecture-deck-composition";
import {
  ARCHITECTURE_V2_EXHIBITS,
  type ArchitectureExhibitKey,
} from "@/lib/visual-system/architecture-model";
import type { ArchitectureVisualExhibit } from "@/lib/visual-system/architecture-html-renderer";

const visual = (id: ArchitectureExhibitKey): ArchitectureVisualExhibit => ({
  id,
  title: `${id} title`,
  soWhat: `${id} so-what`,
  decisionImplication: `${id} implication`,
  svg: `<svg data-id="${id}"></svg>`,
});

const all = ARCHITECTURE_V2_EXHIBITS.map(visual);
const ids = (pages: ReturnType<typeof composeArchitectureDeckPages>) =>
  pages
    .filter((p) => p.kind !== "divider")
    .map((p) => p.visual.id);

describe("composeArchitectureDeckPages", () => {
  it("returns nothing when there are no visuals", () => {
    expect(composeArchitectureDeckPages([])).toEqual([]);
  });

  it("emits every present visual exactly once (no drops, no duplicates)", () => {
    const got = ids(composeArchitectureDeckPages(all)).sort();
    const want = ARCHITECTURE_V2_EXHIBITS.slice().sort();
    expect(got).toEqual(want);
  });

  it("opens with a divider then the five headline beats in fixed order", () => {
    const pages = composeArchitectureDeckPages(all);
    expect(pages[0]).toMatchObject({
      kind: "divider",
      eyebrow: "ARCHITECTURE",
    });
    const headlineIds = pages
      .filter((p) => p.kind === "headline")
      .map((p) => p.visual.id);
    expect(headlineIds).toEqual([...ARCHITECTURE_HEADLINE_ORDER]);
  });

  it("places a body standalone right after its anchor beat", () => {
    const seq = ids(composeArchitectureDeckPages(all));
    // operating_flow follows the current-state gaps headline
    expect(seq.indexOf("current_state_operating_flow")).toBe(
      seq.indexOf("current_state_gaps_map") + 1,
    );
    // governance_audit follows the human-override headline
    expect(seq.indexOf("governance_audit_telemetry_flow")).toBe(
      seq.indexOf("human_approval_override_model") + 1,
    );
  });

  it("bounds the headline run: at most one divider + 5 headlines + 2 body standalones before the appendix divider", () => {
    const pages = composeArchitectureDeckPages(all);
    const secondDivider = pages.findIndex(
      (p, i) => p.kind === "divider" && i > 0,
    );
    // index 0 divider, then <= 7 content pages, then the reference divider
    expect(secondDivider).toBeLessThanOrEqual(1 + 7);
    expect(pages[secondDivider]).toMatchObject({
      kind: "divider",
      eyebrow: "ARCHITECTURE — REFERENCE",
    });
  });

  it("routes a body standalone to the appendix when its anchor headline is absent", () => {
    // operating_flow present, but its anchor (gaps_map) absent.
    const subset = [
      visual("current_state_operating_flow"),
      visual("target_conceptual_architecture"),
    ];
    const pages = composeArchitectureDeckPages(subset);
    const seq = ids(pages);
    // conceptual is a headline; operating_flow falls into the reference run
    const refDivider = pages.findIndex((p, i) => p.kind === "divider" && i > 0);
    expect(refDivider).toBeGreaterThan(0);
    expect(seq).toContain("current_state_operating_flow");
    expect(seq.indexOf("current_state_operating_flow")).toBeGreaterThan(
      seq.indexOf("target_conceptual_architecture"),
    );
  });

  it("uses a single plain ARCHITECTURE divider when no headline is present", () => {
    const subset = [
      visual("target_logical_architecture"),
      visual("integration_map"),
    ];
    const pages = composeArchitectureDeckPages(subset);
    const dividers = pages.filter((p) => p.kind === "divider");
    expect(dividers).toHaveLength(1);
    expect(dividers[0]).toMatchObject({
      kind: "divider",
      eyebrow: "ARCHITECTURE",
    });
    // both render as standalone, in canonical order
    expect(ids(pages)).toEqual([
      "target_logical_architecture",
      "integration_map",
    ]);
  });

  it("drops a missing headline beat without backfilling from the reference tier", () => {
    // only 3 of the 5 headline beats present, plus a reference visual
    const subset = [
      visual("current_state_gaps_map"),
      visual("ai_recommendation_control_flow"),
      visual("implementation_waves"),
      visual("integration_map"),
    ];
    const pages = composeArchitectureDeckPages(subset);
    const headlineIds = pages
      .filter((p) => p.kind === "headline")
      .map((p) => p.visual.id);
    expect(headlineIds).toEqual([
      "current_state_gaps_map",
      "ai_recommendation_control_flow",
      "implementation_waves",
    ]);
    // integration_map is NOT promoted into the headline run
    expect(headlineIds).not.toContain("integration_map");
  });
});
