import type { AnswerChart, AnswerGraph } from "@/lib/ava-answer/contract";

/** Geometry only: labels, values and relationships remain model-authored. */
export function chartPlot(chart: AnswerChart) {
  const rows = Array.isArray(chart.data)
    ? (chart.data as Record<string, string | number>[])
    : [];
  const values = rows.map((r) => Number(r[chart.yKey ?? "value"]));
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values);
  const span = max - min || 1;
  const y = (v: number) => 170 - ((v - min) / span) * 145;
  const horizontal = chart.kind === "horizontal-bar";
  const x = (v: number) => 40 + ((v - min) / span) * 420;
  const points = rows.map((r, i) => ({
    label: String(r[chart.xKey ?? "label"]),
    value: values[i],
    x: horizontal
      ? x(values[i])
      : 40 + ((i + 0.5) / Math.max(1, rows.length)) * 420,
    y: horizontal ? 25 + i * 22 : y(values[i]),
  }));
  return {
    points,
    baseline: y(0),
    baselineX: x(0),
    horizontal,
    min,
    max,
    width: 500,
    height: 210,
  };
}

export function graphPlot(graph: AnswerGraph) {
  const nodes = graph.nodes.map((node, i) => {
    const angle = (i / graph.nodes.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...node,
      index: i + 1,
      x: 250 + Math.cos(angle) * 180,
      y: 125 + Math.sin(angle) * 95,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = graph.edges.map((e) => ({
    ...e,
    fromNode: byId.get(e.from)!,
    toNode: byId.get(e.to)!,
  }));
  return { nodes, edges, width: 500, height: 250 };
}
