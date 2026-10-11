import type { AnswerChart } from "@/lib/ava-answer/contract";
import { matrixPlot } from "../model-exhibit-layout";

it("keeps every authored option and detail within crowded categorical quadrants", () => {
  const chart = {
    xKey: "Effort",
    yKey: "Potential",
    data: Array.from({ length: 8 }, (_, i) => ({
      label: `Workflow ${i + 1} documentation assistance`,
      Effort: "low",
      Potential: "high",
      reason: `Original rationale ${i + 1}`,
      Gate: `Original gate ${i + 1}`,
    })),
  } as AnswerChart;
  const before = JSON.stringify(chart);
  const p = matrixPlot(chart);
  expect(p.entries).toHaveLength(8);
  expect(p.quadrants[0].items).toHaveLength(8);
  expect(p.quadrants.slice(1).flatMap((q) => q.items)).toHaveLength(0);
  p.quadrants[0].items.forEach((item, i) => {
    expect(item.lines.join(" ")).toBe(`Workflow ${i + 1} documentation assistance`);
    expect(item.details.map((d) => d.value)).toEqual([
      `Original rationale ${i + 1}`,
      `Original gate ${i + 1}`,
    ]);
    expect(item.y + item.lines.length * 19).toBeLessThan(p.top + p.rowHeight);
    if (i)
      expect(item.y).toBeGreaterThan(
        p.quadrants[0].items[i - 1].y +
          p.quadrants[0].items[i - 1].lines.length * 19,
      );
  });
  expect(JSON.stringify(chart)).toBe(before);
});
