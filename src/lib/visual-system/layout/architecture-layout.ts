import {
  LAYER_SCHEMES,
  LAYER_LABELS,
  type ArchitectureView,
  type ArchitectureViewEdge,
  type ArchitectureViewNode,
} from "../architecture-view-contract";

/**
 * Deterministic layout for an ArchitectureView. Pure: same view in, same coordinates out.
 *
 * Separated from SVG emission so the two acceptance criteria that are easy to fake by eye --
 * "no overlapping or clipped labels" and "long names remain readable" -- can be asserted in tests
 * against real tenant data rather than reviewed by squinting.
 *
 * The renderer decides geometry only. It never decides what a node is, whether two things are
 * related, or where evidence came from; all of that arrives already settled on the view.
 */

export interface LaidOutNode {
  node: ArchitectureViewNode;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Pre-wrapped label lines, so emission never has to guess whether text fits. */
  labelLines: string[];
  metaLine?: string;
}

export interface LaidOutEdge {
  edge: ArchitectureViewEdge;
  path: string;
  labelX: number;
  labelY: number;
}

export interface LaidOutLane {
  layer: string;
  label: string;
  y: number;
  height: number;
  nodeCount: number;
}

export interface LaidOutView {
  width: number;
  height: number;
  lanes: LaidOutLane[];
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
}

export interface LayoutOptions {
  width?: number;
  /** Approximate glyph width as a fraction of font size. Inter at ~0.52 for mixed case. */
  charWidthRatio?: number;
}

const PAD_X = 40;
const LANE_LABEL_H = 26;
const LANE_GAP = 34;
const NODE_GAP_X = 16;
const NODE_GAP_Y = 14;
const NODE_MIN_W = 168;
const NODE_MAX_W = 236;
const NODE_PAD = 14;
const LABEL_FONT = 13;
const META_FONT = 10.5;
const LINE_H = 16;

/** Greedy wrap on word boundaries; hard-splits a single word longer than the line. */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  const words = String(text ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!line) {
      line = word;
    } else if ((line + " " + word).length <= maxChars) {
      line += " " + word;
    } else {
      lines.push(line);
      line = word;
    }
    while (line.length > maxChars) {
      // A single token wider than the box: split it rather than let it overflow.
      lines.push(line.slice(0, maxChars - 1) + "-");
      line = line.slice(maxChars - 1);
      if (lines.length >= maxLines) break;
    }
    if (lines.length >= maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length > maxLines) lines.length = maxLines;
  // Ellipsise only the final line, and only if content was actually dropped.
  const joined = lines.join(" ");
  if (joined.length < String(text).trim().length && lines.length === maxLines) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 1 ? last.slice(0, Math.max(1, maxChars - 1)) + "…" : last;
  }
  return lines;
}

function metaFor(node: ArchitectureViewNode): string | undefined {
  if (node.aggregation) {
    const n = node.aggregation.memberCount;
    return `${n} ${n === 1 ? "system" : "systems"}`;
  }
  const bits: string[] = [];
  if (node.criticality) bits.push(node.criticality);
  if (node.lifecycle) bits.push(node.lifecycle.replace(/_/g, " "));
  return bits.length ? bits.join(" · ") : undefined;
}

export function layoutArchitectureView(
  view: ArchitectureView,
  options: LayoutOptions = {},
): LaidOutView {
  const width = options.width ?? 1280;
  const ratio = options.charWidthRatio ?? 0.52;
  const lanes = LAYER_SCHEMES[view.layerScheme] ?? [];
  const usable = width - PAD_X * 2;

  // Only lanes that actually carry nodes are drawn; an empty lane is not a fact about the estate.
  const present = lanes.filter((lane) => view.nodes.some((n) => n.layer === lane));

  const laidOutNodes: LaidOutNode[] = [];
  const laidOutLanes: LaidOutLane[] = [];
  let cursorY = PAD_X;

  for (const lane of present) {
    const inLane = view.nodes.filter((n) => n.layer === lane);
    const laneTop = cursorY;
    cursorY += LANE_LABEL_H;

    // Width from the longest label in the lane, clamped, so a lane is internally uniform and
    // boxes never disagree about their size.
    const longest = Math.max(...inLane.map((n) => n.label.length));
    const desired = Math.ceil(longest * LABEL_FONT * ratio) + NODE_PAD * 2;
    const nodeW = Math.max(NODE_MIN_W, Math.min(NODE_MAX_W, desired));
    const maxChars = Math.max(8, Math.floor((nodeW - NODE_PAD * 2) / (LABEL_FONT * ratio)));

    const perRow = Math.max(1, Math.floor((usable + NODE_GAP_X) / (nodeW + NODE_GAP_X)));
    const rows = Math.ceil(inLane.length / perRow);

    // Uniform height across the lane: the tallest label decides, so no box is clipped and no
    // two boxes in a row disagree.
    const wrapped = inLane.map((n) => wrapLabel(n.label, maxChars, 3));
    const maxLines = Math.max(1, ...wrapped.map((w) => w.length));
    const anyMeta = inLane.some((n) => metaFor(n));
    const nodeH = NODE_PAD * 2 + maxLines * LINE_H + (anyMeta ? META_FONT + 6 : 0);

    inLane.forEach((n, i) => {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const countThisRow = Math.min(perRow, inLane.length - row * perRow);
      const rowW = countThisRow * nodeW + (countThisRow - 1) * NODE_GAP_X;
      const startX = PAD_X + Math.max(0, (usable - rowW) / 2);
      laidOutNodes.push({
        node: n,
        x: startX + col * (nodeW + NODE_GAP_X),
        y: cursorY + row * (nodeH + NODE_GAP_Y),
        width: nodeW,
        height: nodeH,
        labelLines: wrapped[i],
        metaLine: metaFor(n),
      });
    });

    const laneH = rows * nodeH + (rows - 1) * NODE_GAP_Y;
    laidOutLanes.push({
      layer: lane,
      label: LAYER_LABELS[lane] ?? lane,
      y: laneTop,
      height: LANE_LABEL_H + laneH,
      nodeCount: inLane.length,
    });
    cursorY += laneH + LANE_GAP;
  }

  const byId = new Map(laidOutNodes.map((n) => [n.node.id, n]));
  const laidOutEdges: LaidOutEdge[] = [];
  for (const edge of view.edges) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) continue; // validator already rejects these; never invent a route
    const fx = from.x + from.width / 2;
    const tx = to.x + to.width / 2;
    // Anchor on facing edges so a connector never crosses its own node box.
    const fromAbove = from.y < to.y;
    const fy = fromAbove ? from.y + from.height : from.y;
    const ty = fromAbove ? to.y : to.y + to.height;
    const mid = (fy + ty) / 2;
    laidOutEdges.push({
      edge,
      path: `M${fx.toFixed(1)} ${fy.toFixed(1)} C${fx.toFixed(1)} ${mid.toFixed(1)}, ${tx.toFixed(1)} ${mid.toFixed(1)}, ${tx.toFixed(1)} ${ty.toFixed(1)}`,
      labelX: (fx + tx) / 2,
      labelY: mid,
    });
  }

  return {
    width,
    height: Math.max(cursorY - LANE_GAP + PAD_X, PAD_X * 2),
    lanes: laidOutLanes,
    nodes: laidOutNodes,
    edges: laidOutEdges,
  };
}

/** Axis-aligned overlap test, used by the layout tests and available to callers. */
export function nodesOverlap(a: LaidOutNode, b: LaidOutNode): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}
