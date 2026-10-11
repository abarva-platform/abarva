import type { AnswerChart, AnswerGraph } from "@/lib/ava-answer/contract";

/** Categorical placement only; no numeric priority scores are inferred. */
export function matrixQuadrants(chart: AnswerChart) {
  const rows = chart.data as Record<string, string | number | null>[];
  return (
    [
      ["low", "high"],
      ["high", "high"],
      ["low", "low"],
      ["high", "low"],
    ] as const
  ).map(([x, y]) => ({
    x,
    y,
    rows: rows.filter(
      (row) => row[chart.xKey!] === x && row[chart.yKey!] === y,
    ),
  }));
}

/** Wrap for vector layout without removing, abbreviating or replacing text. */
function matrixLabelLines(label: string) {
  const lines: string[] = [];
  for (const word of label.split(/\s+/)) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= 29) {
      lines[last] += ` ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/** Shared categorical SVG geometry for the browser, HTML and PDF. */
export function matrixPlot(chart: AnswerChart) {
  const rows = chart.data as Record<string, string | number | null>[];
  const entries = rows.map((row, i) => ({
    index: i + 1,
    label: String(row.label),
    lines: matrixLabelLines(String(row.label)),
    xCategory: row[chart.xKey!],
    yCategory: row[chart.yKey!],
    details: Object.entries(row)
      .filter(([key]) => !["label", chart.xKey!, chart.yKey!].includes(key))
      .map(([key, value]) => ({ key, value: String(value ?? "") })),
  }));
  const rowHeight = Math.max(
    112,
    ...matrixQuadrants(chart).map(
      (q) =>
        24 +
        q.rows.reduce(
          (sum, row) =>
            sum + matrixLabelLines(String(row.label)).length * 19 + 20,
          0,
        ),
    ),
  );
  const left = 84,
    top = 22,
    cellWidth = 322;
  const quadrants = matrixQuadrants(chart).map((q, i) => {
    const x = left + (i % 2) * cellWidth;
    const y = top + Math.floor(i / 2) * rowHeight;
    let cursor = y + 24;
    const items = entries
      .filter((e) => e.xCategory === q.x && e.yCategory === q.y)
      .map((entry) => {
        const item = { ...entry, x: x + 18, y: cursor };
        cursor += entry.lines.length * 19 + 20;
        return item;
      });
    return {
      ...q,
      x,
      y,
      items,
      fill: ["#e5f4f0", "#edf2fb", "#f4f6f8", "#f2eff8"][i],
    };
  });
  return {
    entries,
    quadrants,
    left,
    top,
    cellWidth,
    rowHeight,
    width: 760,
    height: rowHeight * 2 + 92,
  };
}

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
