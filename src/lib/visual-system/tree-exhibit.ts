// Tree exhibit renderer — the biggest gap in the existing engine (spec §9 needs IssueTree,
// RootCauseTree, ValueTree, DecisionTree). One deterministic, gap-honest renderer backs all four.
//
// Pure: input → SVG string, no I/O, no clock, no randomness — same input yields identical output
// (matches the rest of the visual engine and the golden-net discipline). Gap nodes render dashed
// with a GAP tag; missing data is never invented.

const PAL = {
  paper: "#FBFAF7",
  ink: "#141414",
  muted: "#6B6B6B",
  accent: "#0B4A91",
  line: "#C9C4BA",
  gap: "#B23B2E",
};

export interface TreeNode {
  label: string;
  children?: TreeNode[];
  /** Renders dashed + GAP-tagged when the branch is unproven (no governed evidence). */
  isGap?: boolean;
}

interface Positioned {
  node: TreeNode;
  depth: number;
  row: number; // leaf-row coordinate (fractional for internal nodes)
  x: number;
  y: number;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Assign each node a (depth, row): leaves get sequential rows, parents the midpoint of children. */
function layout(node: TreeNode, depth: number, leafCounter: { n: number }, out: Positioned[]): number {
  const kids = node.children ?? [];
  let row: number;
  if (kids.length === 0) {
    row = leafCounter.n;
    leafCounter.n += 1;
  } else {
    const childRows = kids.map((k) => layout(k, depth + 1, leafCounter, out));
    row = (childRows[0] + childRows[childRows.length - 1]) / 2;
  }
  out.push({ node, depth, row, x: 0, y: 0 });
  return row;
}

/**
 * Render a left-to-right tree. Root at the left, branches to the right, connectors orthogonal.
 * Supports arbitrary depth; sized to the node count so it stays legible on a slide.
 */
export function issueTree(root: TreeNode, opts: { title?: string } = {}): string {
  const positioned: Positioned[] = [];
  const leafCounter = { n: 0 };
  layout(root, 0, leafCounter, positioned);

  const maxDepth = positioned.reduce((m, p) => Math.max(m, p.depth), 0);
  const leafCount = Math.max(1, leafCounter.n);

  const colW = 224;
  const rowH = 64;
  const padL = 20;
  const padT = 44;
  const boxW = 196;
  const boxH = 44;
  const W = padL * 2 + (maxDepth + 1) * colW;
  const H = padT + leafCount * rowH + 20;

  for (const p of positioned) {
    p.x = padL + p.depth * colW;
    p.y = padT + p.row * rowH;
  }
  const byNode = new Map(positioned.map((p) => [p.node, p]));

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title ?? "Issue tree")}">`;
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${PAL.paper}"/>`;
  if (opts.title) {
    svg += `<text x="${padL}" y="26" font-family="Georgia, serif" font-size="16" fill="${PAL.ink}">${esc(opts.title)}</text>`;
  }

  // connectors first (so boxes sit on top)
  for (const p of positioned) {
    for (const child of p.node.children ?? []) {
      const c = byNode.get(child)!;
      const x1 = p.x + boxW;
      const y1 = p.y + boxH / 2;
      const x2 = c.x;
      const y2 = c.y + boxH / 2;
      const midX = (x1 + x2) / 2;
      svg += `<path d="M${x1} ${y1} H${midX} V${y2} H${x2}" fill="none" stroke="${PAL.line}" stroke-width="1.5"/>`;
    }
  }

  // boxes
  for (const p of positioned) {
    const isGap = Boolean(p.node.isGap);
    const stroke = isGap ? PAL.gap : PAL.accent;
    const dash = isGap ? ` stroke-dasharray="5 3"` : "";
    svg += `<rect x="${p.x}" y="${p.y}" width="${boxW}" height="${boxH}" rx="6" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.5"${dash}/>`;
    const label = p.node.label.length > 30 ? `${p.node.label.slice(0, 29)}…` : p.node.label;
    svg += `<text x="${p.x + 12}" y="${p.y + boxH / 2 + 4}" font-family="-apple-system, Arial, sans-serif" font-size="12.5" fill="${PAL.ink}">${esc(label)}</text>`;
    if (isGap) {
      svg += `<text x="${p.x + boxW - 8}" y="${p.y + 13}" text-anchor="end" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="${PAL.gap}">GAP</text>`;
    }
  }

  svg += `</svg>`;
  return svg;
}
