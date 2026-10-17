import { FIRST_CAPITAL_ARCHITECTURE } from "../__fixtures__/first-capital-architecture";
import { renderArchitectureVisualExhibits } from "../architecture-html-renderer";
import { renderDeliverablePptx } from "@/lib/deliverables/orchestrator/renderers";
import { judgeArchitectureDeck } from "@/lib/deliverables/orchestrator/architecture-deck-quality";
import { goodDocument } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";

function denseModel(count: number) {
  const model = structuredClone(FIRST_CAPITAL_ARCHITECTURE);
  const level = model.architectureLevels!.logical!;
  level.nodes = Array.from({ length: count }, (_, i) => ({
    ...level.nodes[0]!,
    id: `synthetic-component-${i}`,
    label: `Component ${i}`,
  }));
  level.flows = [];
  return model;
}

describe("architecture level pagination", () => {
  it.each([12, 16, 25])(
    "keeps every component exactly once across legible panels (%i)",
    (count) => {
      const visual = renderArchitectureVisualExhibits(denseModel(count)).find(
        (item) => item.id === "target_logical_architecture",
      )!;
      const panels = [visual.svg, ...(visual.continuationSvgs ?? [])];
      expect(panels).toHaveLength(Math.ceil(count / 12));
      const ids = panels.flatMap((svg) => {
        const matches = [...svg.matchAll(/data-arch-item-id="([^"]+)"/g)].map(
          (match) => match[1],
        );
        expect(matches.length).toBeLessThanOrEqual(12);
        expect(svg).not.toContain("marker-end");
        return matches;
      });
      expect(ids).toEqual(
        Array.from({ length: count }, (_, i) => `synthetic-component-${i}`),
      );
    },
  );

  it("exports every continuation and passes the unchanged architecture quality gate", async () => {
    const model = denseModel(16);
    const buffer = await renderDeliverablePptx(goodDocument(), model);
    const verdict = await judgeArchitectureDeck(buffer, model);
    expect(verdict.findings).toEqual([]);
    expect(
      verdict.embeddedKeys.filter(
        (key) => key === "target_logical_architecture",
      ),
    ).toHaveLength(2);
  }, 60_000);
});
