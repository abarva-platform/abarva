// Board-grade Solution Architecture Pack — inline SVG architecture-diagram
// library.
//
// Blueprint §7 is explicit: a Solution Architecture Pack with no architecture
// diagram is a hard fail, and data sources / control points that are invisible
// are a hard fail. So these are not bar charts — they are genuine node-and-edge
// architecture diagrams: boxes for systems / components / actors, typed
// connectors for data / integration / control flows, swimlanes / zones for the
// context and boundary views, and a likelihood×impact grid for the risk
// heatmap.
//
// Every function returns a self-contained inline `<svg>` string — no external
// assets, no client JS, prints cleanly. Layout is DETERMINISTIC: positions are
// computed from the kernel's nodes / edges with fixed band geometry, so the
// same view-model always renders the same diagram with no overlap and clear
// labels. A legend names the node kinds and the edge types on every diagram.
//
// Honesty rule (blueprint §7 hard fail): a gap-state node reads AS a gap — it
// is drawn with a dashed border and a hatched fill and carries a GAP tag. The
// renderer never backfills an invented system to make a diagram look complete.
//
// The visual register is the locked AbarVa design system — cream ground, near-
// black ink, one navy accent. The module is PURE: deterministic string
// composition, no I/O, no clock.

// ---------------------------------------------------------------------------
// Palette — the locked design tokens, re-stated locally so the module is a
// pure string producer with no React / import surface (mirrors svg-charts.ts).
// ---------------------------------------------------------------------------

/** Architecture-diagram palette — the locked, restrained AbarVa colour set. */
export const ARCH = {
  ink: '#070707',
  inkSoft: '#5b5852',
  accent: '#0b4a91', // navy — the single accent
  accentSoft: '#dbe6f3',
  paper: '#ffffff',
  cream: '#f3f0e9',
  grid: '#dedacf',
  hair: '#e0dbcd',
  good: '#1B5E20',
  goodSoft: '#e2efe2',
  warn: '#7A4F01',
  warnSoft: '#f7ecd6',
  bad: '#8B1F0F',
  badSoft: '#f4ddd6',
} as const;

const FONT = '"DM Sans","Inter",system-ui,-apple-system,sans-serif';
const MONO = '"JetBrains Mono",ui-monospace,monospace';

// ---------------------------------------------------------------------------
// Primitives.
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface SvgFrameOptions {
  width: number;
  height: number;
  /** Accessible title — surfaced via <title>. */
  title: string;
}

function open({ width, height, title }: SvgFrameOptions): string {
  return (
    `<svg viewBox="0 0 ${width} ${height}" width="100%" ` +
    `preserveAspectRatio="xMidYMid meet" role="img" ` +
    `aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg" ` +
    `font-family='${FONT}'>` +
    `<title>${esc(title)}</title>`
  );
}

function txt(
  x: number,
  y: number,
  s: string,
  opts: {
    size?: number;
    weight?: number;
    fill?: string;
    anchor?: 'start' | 'middle' | 'end';
    mono?: boolean;
    upper?: boolean;
    spacing?: number;
  } = {},
): string {
  const {
    size = 11,
    weight = 500,
    fill = ARCH.ink,
    anchor = 'start',
    mono = false,
    upper = false,
    spacing,
  } = opts;
  const ls = spacing !== undefined ? ` letter-spacing="${spacing}"` : '';
  const ff = mono ? ` font-family='${MONO}'` : '';
  return (
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" ` +
    `fill="${fill}" text-anchor="${anchor}"${ff}${ls}>` +
    `${esc(upper ? s.toUpperCase() : s)}</text>`
  );
}

/**
 * Word-wrap a label into up to `maxLines` lines no wider than `maxChars`,
 * returned as plain strings. The diagram boxes are a fixed width, so the wrap
 * keeps long component / system names inside the box without overlap.
 */
function wrap(label: string, maxChars: number, maxLines: number): string[] {
  const words = label.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  // Collapse the overflow into the last allowed line with an ellipsis.
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1]}…`;
  return kept;
}

// ---------------------------------------------------------------------------
// Shared definitions — arrowhead markers and the gap hatch. Emitted once per
// diagram inside a single <defs> block.
// ---------------------------------------------------------------------------

/** A connector kind — drives the colour and dash of a typed edge. */
export type FlowKind = 'data' | 'control' | 'integration' | 'decision';

const FLOW_COLOR: Readonly<Record<FlowKind, string>> = {
  data: ARCH.accent,
  control: ARCH.warn,
  integration: ARCH.inkSoft,
  decision: ARCH.good,
};

const FLOW_LABEL: Readonly<Record<FlowKind, string>> = {
  data: 'Data / evidence flow',
  control: 'Control / governance path',
  integration: 'Integration path',
  decision: 'Decision / approval path',
};

/** The <defs> block — one arrowhead marker per flow kind, plus the gap hatch. */
function defs(): string {
  let d = '<defs>';
  (Object.keys(FLOW_COLOR) as FlowKind[]).forEach((k) => {
    d +=
      `<marker id="ah-${k}" viewBox="0 0 10 10" refX="9" refY="5" ` +
      `markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
      `<path d="M 0 0 L 10 5 L 0 10 z" fill="${FLOW_COLOR[k]}"/>` +
      `</marker>`;
  });
  // Gap hatch — a gap-state node is filled with this so it reads as a gap.
  d +=
    `<pattern id="arch-gap" width="7" height="7" ` +
    `patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="7" height="7" fill="${ARCH.warnSoft}"/>` +
    `<line x1="0" y1="0" x2="0" y2="7" stroke="${ARCH.warn}" ` +
    `stroke-width="2.2"/></pattern>`;
  d += '</defs>';
  return d;
}

// ---------------------------------------------------------------------------
// Node-box primitive — the building block of every architecture diagram.
// ---------------------------------------------------------------------------

/** The visual register of an architecture node — drives box fill / border. */
export type NodeRole =
  | 'actor' // a business user / surface
  | 'system' // a system of record / external system
  | 'context' // the context / grounding layer
  | 'broker' // the broker boundary
  | 'agent' // the AI agent / model
  | 'control' // a governance / control component
  | 'human' // a human checkpoint
  | 'tower'; // the Tower measurement spine

interface NodeStyle {
  fill: string;
  border: string;
  ink: string;
}

const NODE_STYLE: Readonly<Record<NodeRole, NodeStyle>> = {
  actor: { fill: ARCH.cream, border: ARCH.inkSoft, ink: ARCH.ink },
  system: { fill: ARCH.paper, border: ARCH.inkSoft, ink: ARCH.ink },
  context: { fill: ARCH.accentSoft, border: ARCH.accent, ink: ARCH.ink },
  broker: { fill: '#11100e', border: ARCH.ink, ink: ARCH.paper },
  agent: { fill: ARCH.accent, border: ARCH.accent, ink: ARCH.paper },
  control: { fill: ARCH.goodSoft, border: ARCH.good, ink: ARCH.ink },
  human: { fill: ARCH.warnSoft, border: ARCH.warn, ink: ARCH.ink },
  tower: { fill: ARCH.cream, border: ARCH.accent, ink: ARCH.ink },
};

const NODE_KIND_LABEL: Readonly<Record<NodeRole, string>> = {
  actor: 'Business user / surface',
  system: 'System of record',
  context: 'Context / grounding layer',
  broker: 'Broker boundary',
  agent: 'AI agent / model gateway',
  control: 'Governance control',
  human: 'Human checkpoint',
  tower: 'Tower measurement',
};

/** A laid-out architecture box — geometry plus content. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  role: NodeRole;
  title: string;
  /** A short sub-line under the title (responsibility / owner / role). */
  sub?: string;
  /** A gap-state node — drawn dashed + hatched with a GAP tag. */
  gap?: boolean;
}

/** Render one architecture node box — title, sub-line, gap treatment. */
function box(b: Box): string {
  const st = NODE_STYLE[b.role];
  const dash = b.gap ? ` stroke-dasharray="5 3"` : '';
  const fill = b.gap ? 'url(#arch-gap)' : st.fill;
  let s =
    `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" ` +
    `fill="${fill}" stroke="${b.gap ? ARCH.warn : st.border}" ` +
    `stroke-width="${b.gap ? 1.5 : 1.25}"${dash}/>`;
  // A 3px role spine on the left edge keeps the node kind legible at a glance.
  if (!b.gap) {
    s += `<rect x="${b.x}" y="${b.y}" width="3" height="${b.h}" fill="${st.border}"/>`;
  }
  const ink = b.gap ? ARCH.warn : st.ink;
  const cx = b.x + b.w / 2;
  const titleLines = wrap(b.title, b.w > 150 ? 24 : 18, b.sub ? 2 : 3);
  // Vertically centre the title block; leave room for the sub-line.
  const blockH = titleLines.length * 13 + (b.sub ? 14 : 0);
  let ty = b.y + (b.h - blockH) / 2 + 10;
  titleLines.forEach((line) => {
    s += txt(cx, ty, line, {
      size: 11,
      weight: 800,
      anchor: 'middle',
      fill: ink,
    });
    ty += 13;
  });
  if (b.sub) {
    const subLines = wrap(b.sub, b.w > 150 ? 32 : 24, 2);
    subLines.forEach((line, i) => {
      s += txt(cx, ty + 2 + i * 11, line, {
        size: 8.6,
        weight: 600,
        anchor: 'middle',
        fill: b.gap ? ARCH.warn : ARCH.inkSoft,
      });
    });
  }
  // Gap tag — top-right corner pill.
  if (b.gap) {
    const tagW = 30;
    s += `<rect x="${b.x + b.w - tagW - 5}" y="${b.y - 7}" width="${tagW}" height="14" rx="7" fill="${ARCH.warn}"/>`;
    s += txt(b.x + b.w - tagW / 2 - 5, b.y + 3, 'GAP', {
      size: 7.5,
      weight: 800,
      anchor: 'middle',
      fill: ARCH.paper,
      spacing: 0.4,
    });
  }
  return s;
}

/**
 * An orthogonal connector between two boxes — a typed flow edge. The path
 * leaves one box and enters another with a mid-point label; the colour and
 * dash encode the flow kind, and an arrowhead marks the direction.
 */
function connector(args: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  kind: FlowKind;
  label?: string;
  /** Route the path: 'h' = horizontal-first, 'v' = vertical-first, 's' = straight. */
  route?: 'h' | 'v' | 's';
}): string {
  const { from, to, kind } = args;
  const route = args.route ?? 's';
  const color = FLOW_COLOR[kind];
  const dash = kind === 'control' ? ' stroke-dasharray="6 3"' : '';
  let d: string;
  let midX: number;
  let midY: number;
  if (route === 'h') {
    const mx = (from.x + to.x) / 2;
    d = `M ${from.x} ${from.y} L ${mx} ${from.y} L ${mx} ${to.y} L ${to.x} ${to.y}`;
    midX = mx;
    midY = (from.y + to.y) / 2;
  } else if (route === 'v') {
    const my = (from.y + to.y) / 2;
    d = `M ${from.x} ${from.y} L ${from.x} ${my} L ${to.x} ${my} L ${to.x} ${to.y}`;
    midX = (from.x + to.x) / 2;
    midY = my;
  } else {
    d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    midX = (from.x + to.x) / 2;
    midY = (from.y + to.y) / 2;
  }
  let s =
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="1.6"${dash} ` +
    `marker-end="url(#ah-${kind})"/>`;
  if (args.label) {
    const lab = args.label.length > 30 ? `${args.label.slice(0, 29)}…` : args.label;
    const w = lab.length * 5.1 + 10;
    s += `<rect x="${midX - w / 2}" y="${midY - 8}" width="${w}" height="15" rx="3" fill="${ARCH.paper}" stroke="${ARCH.hair}" stroke-width="0.75"/>`;
    s += txt(midX, midY + 3, lab, {
      size: 8.2,
      weight: 600,
      anchor: 'middle',
      fill: color,
    });
  }
  return s;
}

/** A flow-kind legend strip — names each typed connector used in a diagram. */
function flowLegend(x: number, y: number, kinds: FlowKind[]): string {
  let s = '';
  let cx = x;
  kinds.forEach((k) => {
    const color = FLOW_COLOR[k];
    const dash = k === 'control' ? ' stroke-dasharray="6 3"' : '';
    s += `<line x1="${cx}" y1="${y}" x2="${cx + 22}" y2="${y}" stroke="${color}" stroke-width="2"${dash} marker-end="url(#ah-${k})"/>`;
    s += txt(cx + 28, y + 3.5, FLOW_LABEL[k], {
      size: 8.4,
      weight: 700,
      fill: ARCH.inkSoft,
    });
    cx += 28 + FLOW_LABEL[k].length * 5.0 + 22;
  });
  return s;
}

/** A node-kind legend strip — small swatches naming the box roles used. */
function nodeLegend(x: number, y: number, roles: NodeRole[]): string {
  let s = '';
  let cx = x;
  roles.forEach((r) => {
    const st = NODE_STYLE[r];
    s += `<rect x="${cx}" y="${y - 7}" width="13" height="11" rx="2" fill="${st.fill}" stroke="${st.border}" stroke-width="1"/>`;
    s += txt(cx + 18, y + 2.5, NODE_KIND_LABEL[r], {
      size: 8.3,
      weight: 700,
      fill: ARCH.inkSoft,
    });
    cx += 18 + NODE_KIND_LABEL[r].length * 4.9 + 16;
  });
  return s;
}

/** A gap-legend swatch — names the dashed-hatched gap treatment. */
function gapLegend(x: number, y: number): string {
  return (
    `<rect x="${x}" y="${y - 7}" width="13" height="11" rx="2" ` +
    `fill="url(#arch-gap)" stroke="${ARCH.warn}" stroke-width="1.25" ` +
    `stroke-dasharray="3 2"/>` +
    txt(x + 18, y + 2.5, 'Declared gap — not yet grounded', {
      size: 8.3,
      weight: 700,
      fill: ARCH.warn,
    })
  );
}

// ===========================================================================
// 1. Option scorecard (§7 slide 1) — the architecture-decision exhibit.
//    Each candidate option is a row: its agentic shape, §4 reference score as
//    a meter, production-shaped flag, and a SELECTED / REJECTED disposition.
// ===========================================================================

export interface ScorecardOption {
  name: string;
  /** Short shape label, e.g. "Retrieval copilot". */
  shapeLabel: string;
  /** §4 reference-architecture score 0..100. */
  referenceScore: number;
  /** True when every §4 component is native. */
  productionShaped: boolean;
  /** True for the option the kernel selected. */
  selected: boolean;
  /** One-line reason this option is selected, or why it was rejected. */
  disposition: string;
}

/**
 * The architecture option scorecard. The selected option is highlighted; the
 * rejected options carry the kernel's reason for rejection — so slide 1 makes
 * the chosen target-state pattern and the alternatives-considered explicit.
 */
export function optionScorecard(options: ScorecardOption[]): string {
  const W = 860;
  const rowH = 92;
  const padL = 24;
  const padR = 24;
  const padT = 44;
  const padB = 16;
  const H = padT + options.length * rowH + padB;
  const nameW = 210;
  const meterX = padL + nameW + 16;
  const meterW = 188;

  let svg = open({ width: W, height: H, title: 'Architecture option scorecard' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  // Column captions.
  svg += txt(padL, padT - 22, 'Architecture option', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });
  svg += txt(meterX, padT - 22, '§4 reference coverage', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });
  svg += txt(W - padR, padT - 22, 'Decision', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    anchor: 'end',
    fill: ARCH.inkSoft,
  });

  options.forEach((o, i) => {
    const y = padT + i * rowH;
    const cy = y + rowH / 2;
    const sel = o.selected;
    // Row card.
    svg += `<rect x="${padL}" y="${y + 6}" width="${W - padL - padR}" height="${rowH - 12}" rx="5" fill="${sel ? ARCH.accentSoft : ARCH.cream}" stroke="${sel ? ARCH.accent : ARCH.hair}" stroke-width="${sel ? 1.75 : 1}"/>`;
    if (sel) {
      svg += `<rect x="${padL}" y="${y + 6}" width="4" height="${rowH - 12}" fill="${ARCH.accent}"/>`;
    }
    // Option name + shape.
    wrap(o.name, 26, 2).forEach((line, li) => {
      svg += txt(padL + 16, cy - 8 + li * 14, line, {
        size: 12.5,
        weight: 800,
        fill: ARCH.ink,
      });
    });
    svg += txt(padL + 16, cy + 24, o.shapeLabel, {
      size: 8.6,
      weight: 700,
      upper: true,
      spacing: 0.4,
      fill: sel ? ARCH.accent : ARCH.inkSoft,
      mono: true,
    });
    // §4 reference-score meter.
    const trackY = cy - 6;
    svg += `<rect x="${meterX}" y="${trackY}" width="${meterW}" height="12" rx="6" fill="${ARCH.paper}" stroke="${ARCH.hair}" stroke-width="1"/>`;
    const fillW = Math.max(4, (o.referenceScore / 100) * meterW);
    const meterColor = o.productionShaped ? ARCH.good : ARCH.warn;
    svg += `<rect x="${meterX}" y="${trackY}" width="${fillW}" height="12" rx="6" fill="${meterColor}"/>`;
    svg += txt(meterX, trackY - 8, `${o.referenceScore} / 100`, {
      size: 10,
      weight: 800,
      fill: ARCH.ink,
      mono: true,
    });
    svg += txt(meterX + meterW, trackY - 8, o.productionShaped ? 'Product-shaped' : 'POC-shaped', {
      size: 8.4,
      weight: 800,
      anchor: 'end',
      upper: true,
      spacing: 0.3,
      fill: meterColor,
    });
    // Disposition text under the meter.
    wrap(o.disposition, 56, 2).forEach((line, li) => {
      svg += txt(meterX, trackY + 26 + li * 11, line, {
        size: 8.8,
        weight: 600,
        fill: ARCH.inkSoft,
      });
    });
    // SELECTED / REJECTED chip, right edge.
    const chipText = sel ? 'SELECTED' : 'REJECTED';
    const chipColor = sel ? ARCH.good : ARCH.bad;
    const chipW = sel ? 74 : 78;
    svg += `<rect x="${W - padR - chipW}" y="${cy - 11}" width="${chipW}" height="22" rx="11" fill="${sel ? ARCH.goodSoft : ARCH.badSoft}" stroke="${chipColor}" stroke-width="1.25"/>`;
    svg += txt(W - padR - chipW / 2, cy + 4, chipText, {
      size: 9.5,
      weight: 800,
      anchor: 'middle',
      upper: true,
      spacing: 0.6,
      fill: chipColor,
    });
  });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 2. Context diagram (§7 slide 2) — three concentric enterprise zones with
//    the solution placed in each. Systems of record are explicit (blueprint
//    §7 hard fail if absent).
// ===========================================================================

export interface ContextZoneNode {
  title: string;
  sub?: string;
  role: NodeRole;
  gap?: boolean;
}

export interface ContextDiagramInput {
  /** Outer zone — the business surface(s) and users. */
  enterprise: ContextZoneNode[];
  /** Systems of record — drawn in their own labelled band. */
  systems: ContextZoneNode[];
  /** The AbarVa solution zone — context layer, broker, agent, human, Tower. */
  solution: ContextZoneNode[];
}

/**
 * The architecture context diagram — three horizontal enterprise bands
 * (business surface, systems of record, the AbarVa solution zone) with typed
 * flows between them. The agent boundary is the framed solution band; the
 * systems-of-record band is always present and labelled.
 */
export function contextDiagram(input: ContextDiagramInput): string {
  const W = 860;
  const padX = 24;
  const bandLabelW = 96;
  const zoneX = padX + bandLabelW;
  const zoneW = W - zoneX - padX;
  const bandH = 96;
  const bandGap = 40;
  const padT = 30;
  const legendH = 56;
  const H = padT + bandH * 3 + bandGap * 2 + legendH;

  const row = (
    label: string,
    nodes: ContextZoneNode[],
    bandTop: number,
    framed: boolean,
  ): string => {
    let s = '';
    // Band frame — the solution band is framed as the agent boundary.
    if (framed) {
      s += `<rect x="${zoneX - 8}" y="${bandTop - 10}" width="${zoneW + 16}" height="${bandH + 20}" rx="6" fill="none" stroke="${ARCH.accent}" stroke-width="1.5" stroke-dasharray="3 3"/>`;
      s += `<rect x="${zoneX - 8}" y="${bandTop - 22}" width="138" height="16" rx="3" fill="${ARCH.accent}"/>`;
      s += txt(zoneX - 8 + 69, bandTop - 10, 'AbarVa agent boundary', {
        size: 8,
        weight: 800,
        anchor: 'middle',
        upper: true,
        spacing: 0.4,
        fill: ARCH.paper,
      });
    }
    // Band label, left gutter.
    wrap(label, 13, 3).forEach((line, li, arr) => {
      s += txt(
        padX + bandLabelW - 12,
        bandTop + bandH / 2 - (arr.length - 1) * 6 + li * 12 + 4,
        line,
        {
          size: 9,
          weight: 800,
          anchor: 'end',
          upper: true,
          spacing: 0.3,
          fill: ARCH.inkSoft,
        },
      );
    });
    // Evenly-spaced node boxes across the band.
    const n = nodes.length;
    const gap = 14;
    const boxW = Math.min(190, (zoneW - gap * (n - 1)) / n);
    const totalW = boxW * n + gap * (n - 1);
    const startX = zoneX + (zoneW - totalW) / 2;
    nodes.forEach((node, i) => {
      s += box({
        x: startX + i * (boxW + gap),
        y: bandTop,
        w: boxW,
        h: bandH,
        role: node.role,
        title: node.title,
        sub: node.sub,
        gap: node.gap,
      });
    });
    return s;
  };

  let svg = open({ width: W, height: H, title: 'Architecture context diagram' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  const band1 = padT;
  const band2 = padT + bandH + bandGap;
  const band3 = padT + (bandH + bandGap) * 2;

  // Inter-band flows — business → solution, systems ↔ solution. Drawn before
  // the boxes so the boxes sit on top of the connector ends.
  const midX = zoneX + zoneW / 2;
  svg += connector({
    from: { x: midX - 60, y: band1 + bandH },
    to: { x: midX - 60, y: band3 },
    kind: 'data',
    label: 'baseline + context evidence',
    route: 's',
  });
  svg += connector({
    from: { x: midX + 90, y: band2 },
    to: { x: midX + 90, y: band2 - bandGap },
    kind: 'integration',
    label: 'systems of record',
    route: 's',
  });
  svg += connector({
    from: { x: midX + 150, y: band3 },
    to: { x: midX + 150, y: band2 + bandH },
    kind: 'decision',
    label: 'approved action only',
    route: 's',
  });

  svg += row('Business surface', input.enterprise, band1, false);
  svg += row('Systems of record', input.systems, band2, false);
  svg += row('AbarVa solution zone', input.solution, band3, true);

  // Legends.
  const ly = H - legendH + 16;
  svg += nodeLegend(padX, ly, ['actor', 'system', 'context', 'broker']);
  svg += nodeLegend(padX, ly + 18, ['agent', 'human', 'tower']);
  svg += flowLegend(padX + 360, ly + 18, ['data', 'integration', 'decision']);
  svg += gapLegend(padX + 360, ly);

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 3. Layered flow diagram (§7 slides 3 & 4) — a vertical stack of stages, each
//    a node box, joined by typed connectors. Used for the logical architecture
//    (component responsibilities + ownership) and the data-flow diagram (data
//    sources, transformations, control points).
// ===========================================================================

export interface FlowStageNode {
  title: string;
  /** Responsibility / control-point note shown inside the box. */
  sub?: string;
  role: NodeRole;
  gap?: boolean;
  /** Ownership / control caption shown to the right of the box. */
  side?: string;
}

export interface LayeredFlowEdge {
  /** 0-based index of the source stage. */
  from: number;
  /** 0-based index of the target stage. */
  to: number;
  label: string;
  kind: FlowKind;
}

export interface LayeredFlowInput {
  stages: FlowStageNode[];
  edges: LayeredFlowEdge[];
  /** Optional left-side caption naming the stage column, e.g. "Component". */
  laneLabel: string;
  /** Optional right-side caption, e.g. "Ownership / control point". */
  sideLabel: string;
}

/**
 * A layered flow diagram — a single column of stage boxes joined top-to-bottom
 * by typed connectors, with an ownership / control caption beside each box.
 * Deterministic vertical layout: every stage gets an equal row, the connector
 * routes down the centre, side captions sit in a fixed right gutter.
 */
export function layeredFlow(input: LayeredFlowInput): string {
  const W = 860;
  const stageH = 64;
  const stageGap = 34;
  const padT = 40;
  const padB = 56;
  const n = input.stages.length;
  const H = padT + n * stageH + (n - 1) * stageGap + padB;
  const boxW = 304;
  const boxX = 150;
  const colCx = boxX + boxW / 2;
  const sideX = boxX + boxW + 28;

  let svg = open({ width: W, height: H, title: 'Layered architecture flow' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  // Column captions.
  svg += txt(boxX, padT - 16, input.laneLabel, {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });
  svg += txt(sideX, padT - 16, input.sideLabel, {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });

  const stageTop = (i: number): number => padT + i * (stageH + stageGap);

  // Connectors first, so boxes sit on top.
  input.edges.forEach((e) => {
    const fromY = stageTop(e.from) + stageH;
    const toY = stageTop(e.to);
    // Adjacent stages route straight down the centre; a skip routes around
    // the left of the column so it never overlaps a box.
    if (e.to === e.from + 1) {
      svg += connector({
        from: { x: colCx, y: fromY },
        to: { x: colCx, y: toY },
        kind: e.kind,
        label: e.label,
        route: 's',
      });
    } else {
      const sideRoute = boxX - 38;
      const y0 = stageTop(e.from) + stageH / 2;
      const y1 = stageTop(e.to) + stageH / 2;
      const d = `M ${boxX} ${y0} L ${sideRoute} ${y0} L ${sideRoute} ${y1} L ${boxX} ${y1}`;
      svg += `<path d="${d}" fill="none" stroke="${FLOW_COLOR[e.kind]}" stroke-width="1.6"${e.kind === 'control' ? ' stroke-dasharray="6 3"' : ''} marker-end="url(#ah-${e.kind})"/>`;
      const lw = e.label.length * 5.1 + 10;
      svg += `<rect x="${sideRoute - lw / 2}" y="${(y0 + y1) / 2 - 8}" width="${lw}" height="15" rx="3" fill="${ARCH.paper}" stroke="${ARCH.hair}" stroke-width="0.75"/>`;
      svg += txt(sideRoute, (y0 + y1) / 2 + 3, e.label, {
        size: 8.2,
        weight: 600,
        anchor: 'middle',
        fill: FLOW_COLOR[e.kind],
      });
    }
  });

  input.stages.forEach((st, i) => {
    const y = stageTop(i);
    svg += box({
      x: boxX,
      y,
      w: boxW,
      h: stageH,
      role: st.role,
      title: st.title,
      sub: st.sub,
      gap: st.gap,
    });
    if (st.side) {
      // Stage-number tick + ownership caption in the right gutter.
      const cy = y + stageH / 2;
      svg += `<circle cx="${sideX - 14}" cy="${cy}" r="9" fill="${ARCH.ink}"/>`;
      svg += txt(sideX - 14, cy + 3.5, String(i + 1), {
        size: 9.5,
        weight: 800,
        anchor: 'middle',
        fill: ARCH.paper,
      });
      wrap(st.side, 40, 3).forEach((line, li, arr) => {
        svg += txt(
          sideX,
          cy - (arr.length - 1) * 6 + li * 12 + 4,
          line,
          { size: 9, weight: 600, fill: ARCH.inkSoft },
        );
      });
    }
  });

  // Flow legend.
  const usedKinds = Array.from(
    new Set(input.edges.map((e) => e.kind)),
  ) as FlowKind[];
  svg += flowLegend(boxX, H - padB + 28, usedKinds);
  // Gap legend only when a stage is a gap.
  if (input.stages.some((s) => s.gap)) {
    svg += gapLegend(boxX, H - padB + 46);
  }

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 4. Integration map (§7 slide 5) — systems on the left, the AbarVa broker in
//    the centre, each joined by a typed path carrying its API/file/event mode,
//    owner and readiness. Gaps are explicit (blueprint §7 hard fail if hidden).
// ===========================================================================

export interface IntegrationMapRow {
  system: string;
  /** Integration mode, e.g. "API", "File export", "Event stream". */
  mode: string;
  owner: string;
  /** Readiness — a grounded integration vs a declared gap. */
  status: 'grounded' | 'gap';
  /** The role this system plays in the architecture. */
  role: string;
}

/**
 * The integration readiness map — each system is a left-hand box wired to the
 * central broker boundary by a typed path. A grounded path is solid; a gap
 * path is dashed and the system box reads as a gap. Owner and mode sit on the
 * path so readiness is legible without prose.
 */
export function integrationMap(rows: IntegrationMapRow[]): string {
  const W = 860;
  const rowH = 86;
  const padT = 38;
  const padB = 52;
  const H = padT + rows.length * rowH + padB;
  const sysW = 240;
  const sysX = 24;
  const brokerW = 150;
  const brokerX = W - 24 - brokerW;
  const brokerTop = padT + 10;
  const brokerH = H - padT - padB - 20;

  let svg = open({ width: W, height: H, title: 'Integration readiness map' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  // Captions.
  svg += txt(sysX, padT - 16, 'System / integration path', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });
  svg += txt(brokerX + brokerW, padT - 16, 'AbarVa boundary', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    anchor: 'end',
    fill: ARCH.inkSoft,
  });

  // The central broker spine — one tall box every system wires into.
  const bSt = NODE_STYLE.broker;
  svg += `<rect x="${brokerX}" y="${brokerTop}" width="${brokerW}" height="${brokerH}" rx="5" fill="${bSt.fill}" stroke="${bSt.border}" stroke-width="1.25"/>`;
  svg += txt(brokerX + brokerW / 2, brokerTop + brokerH / 2 - 6, 'AbarVa broker', {
    size: 12,
    weight: 800,
    anchor: 'middle',
    fill: ARCH.paper,
  });
  svg += txt(brokerX + brokerW / 2, brokerTop + brokerH / 2 + 10, 'Tenant-scoped', {
    size: 9,
    weight: 600,
    anchor: 'middle',
    fill: '#a39d8e',
  });
  svg += txt(brokerX + brokerW / 2, brokerTop + brokerH / 2 + 24, 'retrieval boundary', {
    size: 9,
    weight: 600,
    anchor: 'middle',
    fill: '#a39d8e',
  });

  rows.forEach((r, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const gap = r.status === 'gap';
    // System box.
    svg += box({
      x: sysX,
      y: cy - 30,
      w: sysW,
      h: 60,
      role: 'system',
      title: r.system,
      sub: r.role,
      gap,
    });
    // The typed integration path to the broker.
    const kind: FlowKind = gap ? 'data' : 'integration';
    const startX = sysX + sysW;
    const endX = brokerX;
    const dash = gap ? ' stroke-dasharray="5 3"' : '';
    const color = gap ? ARCH.warn : ARCH.inkSoft;
    svg += `<line x1="${startX}" y1="${cy}" x2="${endX}" y2="${cy}" stroke="${color}" stroke-width="1.75"${dash} marker-end="url(#ah-${kind})"/>`;
    // Mode chip on the path.
    const modeTxt = gap ? `${r.mode} · GAP` : r.mode;
    const chW = modeTxt.length * 5.4 + 16;
    const chCx = (startX + endX) / 2;
    svg += `<rect x="${chCx - chW / 2}" y="${cy - 19}" width="${chW}" height="16" rx="8" fill="${gap ? ARCH.warnSoft : ARCH.cream}" stroke="${color}" stroke-width="1"/>`;
    svg += txt(chCx, cy - 7.5, modeTxt, {
      size: 8.4,
      weight: 800,
      anchor: 'middle',
      upper: true,
      spacing: 0.3,
      fill: color,
      mono: true,
    });
    // Owner caption under the path.
    svg += txt(chCx, cy + 16, `Owner — ${r.owner}`, {
      size: 8.6,
      weight: 600,
      anchor: 'middle',
      fill: ARCH.inkSoft,
    });
  });

  // Legend.
  const ly = H - padB + 26;
  svg += flowLegend(sysX, ly, ['integration', 'data']);
  svg += gapLegend(sysX + 360, ly);

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 5. Boundary lane map (§7 slide 6) — build / buy / partner / retain swimlanes.
//    Each capability lane is placed in the column for its disposition with its
//    accountable owner; the retained column is the in-house accountability.
// ===========================================================================

export interface BoundaryLaneItem {
  lane: string;
  disposition: 'build' | 'buy' | 'partner' | 'retain';
  owner: string;
  rationale: string;
}

/**
 * The build / buy / partner / retain lane map — four labelled columns, each
 * capability placed as a card in its disposition column with the accountable
 * owner. Empty columns still render with their header so the boundary is
 * unambiguous (blueprint §7 hard fail if the boundary is unclear).
 */
export function boundaryLaneMap(items: BoundaryLaneItem[]): string {
  const W = 860;
  const padX = 24;
  const padT = 52;
  const padB = 16;
  const cols: Array<BoundaryLaneItem['disposition']> = [
    'build',
    'buy',
    'partner',
    'retain',
  ];
  const colLabel: Record<BoundaryLaneItem['disposition'], string> = {
    build: 'Build',
    buy: 'Buy',
    partner: 'Partner',
    retain: 'Retain in-house',
  };
  const colTone: Record<BoundaryLaneItem['disposition'], string> = {
    build: ARCH.accent,
    buy: ARCH.inkSoft,
    partner: ARCH.warn,
    retain: ARCH.good,
  };
  const gap = 14;
  const colW = (W - padX * 2 - gap * 3) / 4;
  const cardH = 116;
  const maxPerCol = Math.max(
    1,
    ...cols.map((c) => items.filter((it) => it.disposition === c).length),
  );
  const H = padT + maxPerCol * (cardH + 12) + padB;

  let svg = open({ width: W, height: H, title: 'Build / buy / partner boundary' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  cols.forEach((disp, ci) => {
    const cx = padX + ci * (colW + gap);
    const tone = colTone[disp];
    // Column header.
    svg += `<rect x="${cx}" y="${padT - 34}" width="${colW}" height="24" rx="4" fill="${tone}"/>`;
    svg += txt(cx + colW / 2, padT - 18, colLabel[disp], {
      size: 11,
      weight: 800,
      anchor: 'middle',
      upper: true,
      spacing: 0.5,
      fill: ARCH.paper,
    });
    // Column track behind the cards.
    svg += `<rect x="${cx}" y="${padT - 6}" width="${colW}" height="${H - padT - padB + 6}" rx="4" fill="${ARCH.cream}" stroke="${ARCH.hair}" stroke-width="1"/>`;
    // Cards in the column.
    const colItems = items.filter((it) => it.disposition === disp);
    colItems.forEach((it, ii) => {
      const y = padT + 6 + ii * (cardH + 12);
      svg += `<rect x="${cx + 8}" y="${y}" width="${colW - 16}" height="${cardH}" rx="4" fill="${ARCH.paper}" stroke="${tone}" stroke-width="1.25"/>`;
      svg += `<rect x="${cx + 8}" y="${y}" width="3" height="${cardH}" fill="${tone}"/>`;
      let ty = y + 18;
      wrap(it.lane, 22, 3).forEach((line) => {
        svg += txt(cx + 16, ty, line, {
          size: 9.8,
          weight: 800,
          fill: ARCH.ink,
        });
        ty += 12;
      });
      ty += 2;
      wrap(it.rationale, 28, 4).forEach((line) => {
        svg += txt(cx + 16, ty, line, {
          size: 7.9,
          weight: 600,
          fill: ARCH.inkSoft,
        });
        ty += 9.5;
      });
      // Owner pinned to the card foot.
      svg += `<line x1="${cx + 16}" y1="${y + cardH - 20}" x2="${cx + colW - 16}" y2="${y + cardH - 20}" stroke="${ARCH.hair}" stroke-width="0.75"/>`;
      wrap(`Owner — ${it.owner}`, 30, 1).forEach((line) => {
        svg += txt(cx + 16, y + cardH - 7, line, {
          size: 8,
          weight: 700,
          fill: tone,
        });
      });
    });
    // Empty-column note so the boundary stays unambiguous.
    if (colItems.length === 0) {
      svg += txt(cx + colW / 2, padT + 24, 'No lane in this disposition', {
        size: 8.4,
        weight: 600,
        anchor: 'middle',
        fill: ARCH.inkSoft,
      });
    }
  });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 6. Accountability map (§7 slide 7) — a two-lane agent / human swimlane with
//    the workflow steps placed in the lane that owns each one. Decision-right
//    handoffs cross between lanes; the human checkpoint is explicit.
// ===========================================================================

export interface AccountabilityStep {
  label: string;
  /** Which lane owns this step. */
  lane: 'agent' | 'human';
  /** A short caption — the decision right / approval / exception note. */
  note: string;
  /** True when this step is the consequential human checkpoint. */
  checkpoint?: boolean;
}

/**
 * The human / agent accountability map — two horizontal lanes (the agent lane
 * and the human lane) with each workflow step placed in its owning lane and a
 * connector showing the handoff. The human checkpoint is drawn emphasised so
 * the diagram shows, not asserts, where a named human stays accountable.
 */
export function accountabilityMap(steps: AccountabilityStep[]): string {
  const W = 860;
  const padX = 24;
  const laneLabelW = 92;
  const laneX = padX + laneLabelW;
  const laneW = W - laneX - padX;
  const laneH = 116;
  const laneGap = 18;
  const padT = 36;
  const legendH = 30;
  const H = padT + laneH * 2 + laneGap + legendH;

  const agentTop = padT;
  const humanTop = padT + laneH + laneGap;

  let svg = open({ width: W, height: H, title: 'Human / agent accountability map' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  // Lane backgrounds + labels.
  const lane = (top: number, label: string, tone: string, fill: string): string => {
    let s = `<rect x="${laneX}" y="${top}" width="${laneW}" height="${laneH}" rx="5" fill="${fill}" stroke="${tone}" stroke-width="1.25"/>`;
    s += `<rect x="${padX}" y="${top}" width="${laneLabelW - 8}" height="${laneH}" rx="4" fill="${tone}"/>`;
    wrap(label, 11, 3).forEach((line, li, arr) => {
      s += txt(
        padX + (laneLabelW - 8) / 2,
        top + laneH / 2 - (arr.length - 1) * 7 + li * 13 + 4,
        line,
        {
          size: 9.5,
          weight: 800,
          anchor: 'middle',
          upper: true,
          spacing: 0.3,
          fill: ARCH.paper,
        },
      );
    });
    return s;
  };
  svg += lane(agentTop, 'Agent does', ARCH.accent, ARCH.accentSoft);
  svg += lane(humanTop, 'Human owns', ARCH.warn, ARCH.warnSoft);

  // Step boxes — evenly spaced along the X axis; each sits in its owning lane.
  const n = steps.length;
  const stepGap = 16;
  const stepW = Math.min(150, (laneW - stepGap * (n + 1)) / n);
  const stepH = 78;
  const stepX = (i: number): number =>
    laneX + stepGap + i * ((laneW - stepGap * 2 - stepW) / Math.max(1, n - 1));

  // Handoff connectors between consecutive steps, drawn first.
  for (let i = 0; i < n - 1; i++) {
    const a = steps[i];
    const b = steps[i + 1];
    const ax = stepX(i) + stepW;
    const ay = (a.lane === 'agent' ? agentTop : humanTop) + laneH / 2;
    const bx = stepX(i + 1);
    const by = (b.lane === 'agent' ? agentTop : humanTop) + laneH / 2;
    const crossing = a.lane !== b.lane;
    svg += connector({
      from: { x: ax, y: ay },
      to: { x: bx, y: by },
      kind: crossing ? 'decision' : 'data',
      label: crossing ? 'decision-right handoff' : undefined,
      route: crossing ? 'h' : 's',
    });
  }

  steps.forEach((st, i) => {
    const top = st.lane === 'agent' ? agentTop : humanTop;
    const y = top + (laneH - stepH) / 2;
    svg += box({
      x: stepX(i),
      y,
      w: stepW,
      h: stepH,
      role: st.checkpoint ? 'human' : st.lane === 'agent' ? 'agent' : 'control',
      title: st.label,
      sub: st.note,
    });
    if (st.checkpoint) {
      // Checkpoint emphasis — a labelled flag above the box.
      const cx = stepX(i) + stepW / 2;
      svg += `<rect x="${cx - 56}" y="${y - 18}" width="112" height="15" rx="7.5" fill="${ARCH.warn}"/>`;
      svg += txt(cx, y - 7, 'ACCOUNTABILITY CHECKPOINT', {
        size: 7.2,
        weight: 800,
        anchor: 'middle',
        upper: true,
        spacing: 0.3,
        fill: ARCH.paper,
      });
    }
  });

  // Legend.
  svg += flowLegend(laneX, H - 8, ['data', 'decision']);

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 7. Control overlay (§7 slide 8) — the eight §4 reference components as a
//    coverage grid, each cell coloured by native / partial / missing coverage.
// ===========================================================================

export interface ControlCell {
  label: string;
  coverage: 'native' | 'partial' | 'missing';
  note: string;
}

/**
 * The reference-architecture control overlay — the §4 components as a 4×2
 * grid of cells, each toned by coverage. A native control reads green, a
 * partial control amber, a missing control red — so the production-gate
 * picture is legible at a glance.
 */
export function controlOverlay(cells: ControlCell[]): string {
  const W = 860;
  const padX = 24;
  const padT = 40;
  const padB = 40;
  const cols = 4;
  const rows = Math.ceil(cells.length / cols);
  const gap = 12;
  const cellW = (W - padX * 2 - gap * (cols - 1)) / cols;
  const cellH = 104;
  const H = padT + rows * cellH + (rows - 1) * gap + padB;

  const tone = (
    c: ControlCell['coverage'],
  ): { fill: string; border: string; ink: string; tag: string } => {
    if (c === 'native')
      return { fill: ARCH.goodSoft, border: ARCH.good, ink: ARCH.good, tag: 'Native' };
    if (c === 'partial')
      return { fill: ARCH.warnSoft, border: ARCH.warn, ink: ARCH.warn, tag: 'Partial' };
    return { fill: ARCH.badSoft, border: ARCH.bad, ink: ARCH.bad, tag: 'Missing' };
  };

  let svg = open({ width: W, height: H, title: 'Reference-architecture control overlay' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  svg += txt(padX, padT - 16, 'The eight §4 reference-architecture controls', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.5,
    fill: ARCH.inkSoft,
  });

  cells.forEach((c, i) => {
    const ci = i % cols;
    const ri = Math.floor(i / cols);
    const x = padX + ci * (cellW + gap);
    const y = padT + ri * (cellH + gap);
    const t = tone(c.coverage);
    svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="4" fill="${t.fill}" stroke="${t.border}" stroke-width="1.25"/>`;
    svg += `<rect x="${x}" y="${y}" width="${cellW}" height="3" fill="${t.border}"/>`;
    // Coverage tag, top-right.
    const tagW = 46;
    svg += `<rect x="${x + cellW - tagW - 8}" y="${y + 9}" width="${tagW}" height="15" rx="7.5" fill="${ARCH.paper}" stroke="${t.border}" stroke-width="1"/>`;
    svg += txt(x + cellW - tagW / 2 - 8, y + 19.5, t.tag, {
      size: 7.6,
      weight: 800,
      anchor: 'middle',
      upper: true,
      spacing: 0.3,
      fill: t.ink,
    });
    // Component label.
    let ty = y + 22;
    wrap(c.label, 24, 2).forEach((line) => {
      svg += txt(x + 12, ty, line, { size: 10.2, weight: 800, fill: ARCH.ink });
      ty += 12;
    });
    ty += 4;
    wrap(c.note, 34, 5).forEach((line) => {
      svg += txt(x + 12, ty, line, {
        size: 7.9,
        weight: 600,
        fill: ARCH.inkSoft,
      });
      ty += 9.6;
    });
  });

  // Coverage legend.
  const ly = H - padB + 22;
  const legendItem = (lx: number, color: string, soft: string, label: string): string => {
    let s = `<rect x="${lx}" y="${ly - 9}" width="14" height="13" rx="2" fill="${soft}" stroke="${color}" stroke-width="1.25"/>`;
    s += txt(lx + 20, ly + 1.5, label, {
      size: 8.6,
      weight: 700,
      fill: ARCH.inkSoft,
    });
    return s;
  };
  svg += legendItem(padX, ARCH.good, ARCH.goodSoft, 'Native — production-grade');
  svg += legendItem(padX + 230, ARCH.warn, ARCH.warnSoft, 'Partial — harden before the gate');
  svg += legendItem(padX + 470, ARCH.bad, ARCH.badSoft, 'Missing — POC-not-product signal');

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 8. Risk heatmap (§7 slide 8) — a 3×3 likelihood × impact grid with the
//    architecture risks plotted. Mirrors the Costed-pack heatmap geometry but
//    is re-stated here so the architecture module is self-contained.
// ===========================================================================

export interface ArchRiskPoint {
  /** 1..3 — low / medium / high. */
  likelihood: number;
  impact: number;
  /** Short risk code shown in the cell, e.g. "AR1". */
  code: string;
  /** True for a blocker — drawn as a square; a watch risk is a circle. */
  blocker: boolean;
}

/** A 3×3 likelihood × impact grid with the architecture risks plotted. */
export function archRiskHeatmap(risks: ArchRiskPoint[]): string {
  const W = 460;
  const H = 392;
  const padL = 96;
  const padR = 26;
  const padT = 30;
  const padB = 90;
  const gridW = W - padL - padR;
  const gridH = H - padT - padB;
  const cellW = gridW / 3;
  const cellH = gridH / 3;

  const tone = (l: number, im: number): string => {
    const s = l + im;
    if (s >= 5) return ARCH.badSoft;
    if (s >= 4) return ARCH.warnSoft;
    return ARCH.goodSoft;
  };

  let svg = open({ width: W, height: H, title: 'Architecture risk heatmap' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  for (let l = 0; l < 3; l++) {
    for (let im = 0; im < 3; im++) {
      const x = padL + im * cellW;
      const y = padT + (2 - l) * cellH;
      svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${tone(l + 1, im + 1)}" stroke="${ARCH.paper}" stroke-width="2"/>`;
    }
  }

  const axisLabels = ['Low', 'Medium', 'High'];
  axisLabels.forEach((lab, i) => {
    svg += txt(padL + cellW * i + cellW / 2, H - padB + 18, lab, {
      size: 9,
      anchor: 'middle',
      weight: 700,
      fill: ARCH.inkSoft,
    });
    svg += txt(padL - 10, padT + (2 - i) * cellH + cellH / 2 + 3, lab, {
      size: 9,
      anchor: 'end',
      weight: 700,
      fill: ARCH.inkSoft,
    });
  });
  svg += txt(padL + gridW / 2, H - padB + 38, 'IMPACT', {
    size: 9,
    anchor: 'middle',
    weight: 800,
    spacing: 1,
    fill: ARCH.ink,
  });
  svg += `<text x="22" y="${padT + gridH / 2}" font-size="9" font-weight="800" letter-spacing="1" fill="${ARCH.ink}" text-anchor="middle" transform="rotate(-90 22 ${padT + gridH / 2})">LIKELIHOOD</text>`;

  // Plot risks — jitter when several land in one cell.
  const cellCounts = new Map<string, number>();
  risks.forEach((r) => {
    const key = `${r.likelihood}-${r.impact}`;
    const idx = cellCounts.get(key) ?? 0;
    cellCounts.set(key, idx + 1);
    const baseX = padL + (r.impact - 1) * cellW + cellW / 2;
    const baseY = padT + (3 - r.likelihood) * cellH + cellH / 2;
    const offX = (idx % 2 === 0 ? -1 : 1) * Math.ceil(idx / 2) * 24;
    const offY = idx >= 2 ? 20 : 0;
    const cx = baseX + offX;
    const cy = baseY + offY;
    if (r.blocker) {
      svg += `<rect x="${cx - 14}" y="${cy - 14}" width="28" height="28" rx="3" fill="${ARCH.bad}"/>`;
    } else {
      svg += `<circle cx="${cx}" cy="${cy}" r="14" fill="${ARCH.ink}"/>`;
    }
    svg += txt(cx, cy + 4, r.code, {
      size: 9.5,
      anchor: 'middle',
      weight: 800,
      fill: ARCH.paper,
    });
  });

  // Marker legend.
  const ly = H - padB + 56;
  svg += `<rect x="${padL}" y="${ly - 11}" width="16" height="16" rx="3" fill="${ARCH.bad}"/>`;
  svg += txt(padL + 22, ly + 1, 'Blocker — must clear before production', {
    size: 8.3,
    weight: 700,
    fill: ARCH.inkSoft,
  });
  svg += `<circle cx="${padL + 8}" cy="${ly + 20}" r="8" fill="${ARCH.ink}"/>`;
  svg += txt(padL + 22, ly + 23, 'Watch — managed risk under monitoring', {
    size: 8.3,
    weight: 700,
    fill: ARCH.inkSoft,
  });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 9. Open-decision queue (§7 slide 9) — the unresolved architecture decisions
//    drawn as a priority queue ordered by gate impact, each with an owner and
//    a gate-impact tag.
// ===========================================================================

export interface OpenDecisionRow {
  /** The unresolved architecture decision. */
  decision: string;
  owner: string;
  /** A short gate label, e.g. "Production-readiness gate". */
  gate: string;
  /** Impact weight — drives bar width and ordering. */
  impact: number;
  /** True when this decision blocks the production gate. */
  blocksGate: boolean;
}

/**
 * The open architecture-decision queue — one row per unresolved decision,
 * ordered by gate impact (widest at the top). A gate-blocking decision is
 * drawn solid red; a non-blocking one amber. Each row carries owner and gate.
 */
export function openDecisionQueue(rows: OpenDecisionRow[]): string {
  const W = 860;
  const rowH = 64;
  const padL = 282;
  const padR = 230;
  const padT = 40;
  const padB = 16;
  const chipX = 26;
  const labelRight = padL - 14;
  const H = padT + rows.length * rowH + padB;
  const plotW = W - padL - padR;
  const ordered = rows.slice().sort((a, b) => b.impact - a.impact);
  const max = Math.max(...ordered.map((r) => r.impact), 1);

  let svg = open({ width: W, height: H, title: 'Open architecture-decision queue' });
  svg += defs();
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${ARCH.paper}"/>`;

  svg += txt(labelRight, padT - 18, 'Open architecture decision', {
    size: 9,
    anchor: 'end',
    weight: 800,
    upper: true,
    spacing: 0.4,
    fill: ARCH.inkSoft,
  });
  svg += txt(padL, padT - 18, 'Gate impact — widest is the next decision', {
    size: 9,
    weight: 600,
    fill: ARCH.inkSoft,
  });

  svg += `<line x1="${padL}" y1="${padT - 10}" x2="${padL}" y2="${H - padB}" stroke="${ARCH.ink}" stroke-width="1.5"/>`;

  ordered.forEach((row, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const w = (row.impact / max) * plotW;
    const fill = row.blocksGate ? ARCH.bad : ARCH.warn;
    const soft = row.blocksGate ? ARCH.badSoft : ARCH.warnSoft;
    // Rank chip.
    svg += `<circle cx="${chipX}" cy="${cy}" r="13" fill="${ARCH.ink}"/>`;
    svg += txt(chipX, cy + 4, String(i + 1), {
      size: 11,
      anchor: 'middle',
      weight: 800,
      fill: ARCH.paper,
    });
    // Decision label — wrapped, right-anchored against the axis.
    const labelLines = wrap(row.decision, 36, 3);
    const labelOffset =
      labelLines.length === 1 ? 4 : -(labelLines.length - 1) * 5.5;
    labelLines.forEach((line, li) => {
      svg += txt(labelRight, cy + labelOffset + li * 11, line, {
        size: 9.6,
        anchor: 'end',
        weight: 700,
      });
    });
    // Impact bar.
    svg += `<rect x="${padL}" y="${cy - 13}" width="${w}" height="26" rx="2" fill="${soft}"/>`;
    svg += `<rect x="${padL}" y="${cy - 13}" width="${w}" height="26" rx="2" fill="none" stroke="${fill}" stroke-width="1.25"/>`;
    // Gate-impact tag above the owner line.
    svg += txt(padL + w + 8, cy - 2, row.blocksGate ? 'BLOCKS GATE' : 'INFORMS GATE', {
      size: 8,
      weight: 800,
      upper: true,
      spacing: 0.3,
      fill,
    });
    // Owner + gate under the tag.
    svg += txt(padL + w + 8, cy + 11, `${row.owner} · ${row.gate}`, {
      size: 8.4,
      weight: 600,
      fill: ARCH.inkSoft,
      mono: true,
    });
  });

  svg += `</svg>`;
  return svg;
}
