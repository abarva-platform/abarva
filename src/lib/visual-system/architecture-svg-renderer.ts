import {
  layoutArchitectureView,
  type LaidOutNode,
  type LaidOutView,
  type LayoutOptions,
} from "./layout/architecture-layout";
import type { ArchitectureView } from "./architecture-view-contract";

/**
 * Emits SVG for an ArchitectureView. String-based, matching the existing
 * `architecture-html-renderer` approach rather than introducing a second rendering technology.
 * Geometry comes from `layoutArchitectureView`; this file only paints.
 *
 * Visual grammar, all of it driven by contract fields and none of it invented here:
 *  - a CANONICAL node stands for one record: solid single border, white ground
 *  - an ABARVA_DERIVED aggregate stands for many: stacked/offset border + member count, so the
 *    difference is legible without shouting
 *  - a CANDIDATE node is dashed: proposed, not established
 *  - every edge carries its relationship verb; there are no unexplained arrows
 */

const C = {
  paper: "#faf7f1",
  cream: "#f5f1eb",
  surface: "#ffffff",
  ink: "#0c1a3a",
  slate: "#5f5e5a",
  stone: "#888780",
  rule: "rgba(136,135,128,0.30)",
  ruleStrong: "rgba(136,135,128,0.55)",
  navy: "#0c1a3a",
  blue: "#0066cc",
  amber: "#ba7517",
  amberLight: "#faeeda",
};

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nodeChrome(n: LaidOutNode): { stroke: string; dash: string; fill: string; width: number } {
  const basis = n.node.evidenceBasis;
  if (basis === "CANDIDATE") {
    return { stroke: C.ruleStrong, dash: ' stroke-dasharray="5 4"', fill: C.surface, width: 1 };
  }
  if (basis === "ABARVA_DERIVED") {
    return { stroke: C.ruleStrong, dash: "", fill: C.cream, width: 1 };
  }
  return { stroke: C.navy, dash: "", fill: C.surface, width: 1.4 };
}

function renderNode(n: LaidOutNode): string {
  const { stroke, dash, fill, width } = nodeChrome(n);
  const isAgg = Boolean(n.node.aggregation);
  // An aggregate is drawn as a slightly offset stack -- it reads as "several" at a glance
  // without needing a legend lookup.
  const stack = isAgg
    ? `<rect x="${(n.x + 4).toFixed(1)}" y="${(n.y - 4).toFixed(1)}" width="${n.width}" height="${n.height}" rx="7" fill="${C.cream}" stroke="${C.rule}" stroke-width="1"/>`
    : "";

  const lines = n.labelLines
    .map(
      (line, i) =>
        `<tspan x="${(n.x + 14).toFixed(1)}" dy="${i === 0 ? 0 : 16}">${esc(line)}</tspan>`,
    )
    .join("");

  const labelY = n.y + 14 + 12;
  const meta = n.metaLine
    ? `<text x="${(n.x + 14).toFixed(1)}" y="${(n.y + n.height - 13).toFixed(1)}" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="10" fill="${isAgg ? C.amber : C.stone}">${esc(n.metaLine)}</text>`
    : "";

  return `<g class="node" data-node-id="${esc(n.node.id)}" data-basis="${esc(n.node.evidenceBasis)}" tabindex="0" role="button" aria-label="${esc(n.node.label)}${isAgg ? `, group of ${n.node.aggregation!.memberCount}` : ""}">
    ${stack}
    <rect x="${n.x.toFixed(1)}" y="${n.y.toFixed(1)}" width="${n.width}" height="${n.height}" rx="7" fill="${fill}" stroke="${stroke}" stroke-width="${width}"${dash}/>
    <text x="${(n.x + 14).toFixed(1)}" y="${labelY.toFixed(1)}" font-family="Inter,system-ui,sans-serif" font-size="13" font-weight="${isAgg ? 500 : 600}" fill="${C.ink}">${lines}</text>
    ${meta}
  </g>`;
}

export function renderArchitectureViewSvg(
  view: ArchitectureView,
  options: LayoutOptions = {},
): { svg: string; layout: LaidOutView } {
  const layout = layoutArchitectureView(view, options);

  const lanes = layout.lanes
    .map(
      (lane) => `<g class="lane">
      <text x="40" y="${(lane.y + 13).toFixed(1)}" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="9.5" letter-spacing="1.1" fill="${C.stone}">${esc(lane.label.toUpperCase())}</text>
      <text x="${(layout.width - 40).toFixed(1)}" y="${(lane.y + 13).toFixed(1)}" text-anchor="end" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="9.5" fill="${C.stone}">${lane.nodeCount}</text>
      <line x1="40" y1="${(lane.y + 19).toFixed(1)}" x2="${(layout.width - 40).toFixed(1)}" y2="${(lane.y + 19).toFixed(1)}" stroke="${C.rule}"/>
    </g>`,
    )
    .join("");

  const edges = layout.edges
    .map((e) => {
      const derived = e.edge.evidenceBasis === "ABARVA_DERIVED";
      const verb = e.edge.label ?? "";
      const weight = e.edge.weight ? ` ${e.edge.weight}` : "";
      const text = verb ? `${verb}${weight}` : "";
      return `<g class="edge" data-edge-id="${esc(e.edge.id)}">
      <path d="${e.path}" fill="none" stroke="${derived ? C.ruleStrong : C.navy}" stroke-width="${derived ? 1.6 : 1.1}"${derived ? ' stroke-dasharray="6 3"' : ""} marker-end="url(#av-arrow)" opacity="0.75"/>
      ${text ? `<rect x="${(e.labelX - text.length * 3.1 - 5).toFixed(1)}" y="${(e.labelY - 8).toFixed(1)}" width="${(text.length * 6.2 + 10).toFixed(1)}" height="15" rx="3" fill="${C.paper}"/><text x="${e.labelX.toFixed(1)}" y="${(e.labelY + 3).toFixed(1)}" text-anchor="middle" font-family="'JetBrains Mono',ui-monospace,monospace" font-size="9" fill="${C.slate}">${esc(text)}</text>` : ""}
    </g>`;
    })
    .join("");

  const nodes = layout.nodes.map(renderNode).join("");

  const svg = `<svg viewBox="0 0 ${layout.width} ${layout.height}" width="100%" role="img" aria-label="${esc(view.title)}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="av-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${C.navy}" opacity="0.75"/>
    </marker>
  </defs>
  <rect width="${layout.width}" height="${layout.height}" fill="${C.paper}"/>
  ${lanes}
  ${edges}
  ${nodes}
</svg>`;

  return { svg, layout };
}

/** Legend + coverage strip. Reports the readable measure, never `canonicalNodePct` above L2. */
export function renderArchitectureLegend(view: ArchitectureView): string {
  const cov = view.evidenceCoverage;
  const isRollup = cov.nodesAggregated === cov.nodesTotal && cov.nodesTotal > 0;
  const coverageLine = isRollup
    ? esc(cov.aggregationSummary ?? "")
    : `${cov.canonicalNodePct}% of nodes are single canonical records · ${cov.memberTraceablePct}% traceable`;

  const items = [
    `<span class="k"><i class="sw canon"></i>Canonical record</span>`,
    `<span class="k"><i class="sw agg"></i>Grouped from a canonical field</span>`,
    `<span class="k"><i class="sw edge"></i>Recorded relationship</span>`,
    `<span class="k"><i class="sw dedge"></i>Collapsed relationships</span>`,
  ].join("");

  const limits = view.limitations.length
    ? `<ul class="limits">${view.limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`
    : "";

  return `<div class="legend"><div class="keys">${items}</div><p class="cov">${coverageLine}</p>${limits}</div>`;
}
