// Board-grade Costed Business-Case Pack — inline SVG exhibit library.
//
// Blueprint §2 is explicit: a financial exhibit must be a real chart, not a
// table pretending to be one. Every function here returns a self-contained
// inline `<svg>` string — no external assets, no client JS, prints cleanly.
//
// The charts are hand-built: explicit axes, gridlines, labelled bars, and a
// disciplined palette that matches the locked AbarVa design system (cream
// ground, near-black ink, one navy accent). They are PURE — deterministic
// functions of their data, no I/O, no clock.
//
// Honesty rule (blueprint §9 hard fail): when payback is blocked the payback
// chart renders the cash-flow lines that genuinely never cross zero and
// annotates the block — it never draws a fake crossing.

// ---------------------------------------------------------------------------
// Palette — locked design tokens, expressed as plain hex so the renderer is a
// pure string producer with no React/import surface.
// ---------------------------------------------------------------------------

/** Chart palette — the artifact's restrained, board-circulation colour set. */
export const CHART = {
  ink: '#070707',
  inkSoft: '#5b5852',
  accent: '#0b4a91', // navy — the single accent
  accentSoft: '#dbe6f3',
  paper: '#ffffff',
  cream: '#f3f0e9',
  grid: '#dedacf',
  good: '#1B5E20',
  goodSoft: '#e2efe2',
  warn: '#7A4F01',
  warnSoft: '#f7ecd6',
  bad: '#8B1F0F',
  badSoft: '#f4ddd6',
  positive: '#1f6f43',
  negative: '#a8533a',
} as const;

const FONT =
  '"DM Sans","Inter",system-ui,-apple-system,sans-serif';
const MONO = '"JetBrains Mono",ui-monospace,monospace';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Compact USD label, e.g. $2.2M, $940K. */
export function compactUsd(n: number): string {
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000) {
    return `${sign}$${(a / 1_000_000).toFixed(a >= 9_500_000 ? 1 : 2)}M`;
  }
  if (a >= 1_000) return `${sign}$${Math.round(a / 1_000)}K`;
  return `${sign}$${Math.round(a)}`;
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
    fill = CHART.ink,
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

// ===========================================================================
// 1. Investment waterfall (§4) — floating bars, cumulative to total.
// ===========================================================================

export interface WaterfallStep {
  label: string;
  /** Positive increment added to the running total. */
  amount: number;
}

/**
 * Floating-bar waterfall. Each step adds to a running total; a final solid
 * bar shows the cumulative total. Connector lines join the steps.
 */
export function investmentWaterfall(steps: WaterfallStep[]): string {
  const W = 720;
  const H = 320;
  const padL = 56;
  const padR = 24;
  const padT = 26;
  const padB = 72;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const total = steps.reduce((s, x) => s + x.amount, 0);
  const max = total * 1.08;
  const y = (v: number): number => padT + plotH - (v / max) * plotH;

  const n = steps.length + 1;
  const slot = plotW / n;
  const barW = Math.min(64, slot * 0.62);

  let svg = open({ width: W, height: H, title: 'Investment waterfall' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  // Gridlines + y labels.
  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const gy = y(v);
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${CHART.grid}" stroke-width="1"/>`;
    svg += txt(padL - 8, gy + 3, compactUsd(v), {
      size: 9,
      anchor: 'end',
      fill: CHART.inkSoft,
      mono: true,
    });
  }

  let running = 0;
  steps.forEach((step, i) => {
    const cx = padL + slot * i + slot / 2;
    const x = cx - barW / 2;
    const top = y(running + step.amount);
    const bottom = y(running);
    const h = Math.max(2, bottom - top);
    svg += `<rect x="${x}" y="${top}" width="${barW}" height="${h}" fill="${CHART.accent}" rx="1.5"/>`;
    // Connector to next bar.
    const nextCx = padL + slot * (i + 1) + slot / 2;
    svg += `<line x1="${x + barW}" y1="${top}" x2="${nextCx - barW / 2}" y2="${top}" stroke="${CHART.inkSoft}" stroke-width="1" stroke-dasharray="2 2"/>`;
    // Value label above the bar.
    svg += txt(cx, top - 6, `+${compactUsd(step.amount)}`, {
      size: 9,
      anchor: 'middle',
      weight: 700,
      mono: true,
    });
    // Wrapped step label below axis.
    wrapLabel(step.label, cx, padT + plotH + 16, 11).forEach((line, li) => {
      svg += txt(cx, line.y, line.text, {
        size: 9,
        anchor: 'middle',
        fill: CHART.inkSoft,
        weight: 600,
      });
      void li;
    });
    running += step.amount;
  });

  // Total bar — solid, full height from baseline.
  const tCx = padL + slot * steps.length + slot / 2;
  const tx = tCx - barW / 2;
  const tTop = y(total);
  svg += `<rect x="${tx}" y="${tTop}" width="${barW}" height="${y(0) - tTop}" fill="${CHART.ink}" rx="1.5"/>`;
  svg += txt(tCx, tTop - 6, compactUsd(total), {
    size: 10,
    anchor: 'middle',
    weight: 800,
    mono: true,
  });
  wrapLabel('Total base investment', tCx, padT + plotH + 16, 11).forEach(
    (line) => {
      svg += txt(tCx, line.y, line.text, {
        size: 9,
        anchor: 'middle',
        fill: CHART.ink,
        weight: 800,
      });
    },
  );

  // Baseline axis.
  svg += `<line x1="${padL}" y1="${y(0)}" x2="${W - padR}" y2="${y(0)}" stroke="${CHART.ink}" stroke-width="1.5"/>`;
  svg += `</svg>`;
  return svg;
}

/** Split a short label into up to two centred lines for an axis tick. */
function wrapLabel(
  label: string,
  cx: number,
  y0: number,
  lineHeight: number,
): Array<{ text: string; y: number }> {
  const words = label.split(' ');
  if (words.length <= 2 && label.length <= 16) {
    return [{ text: label, y: y0 }];
  }
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 16 && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3).map((text, i) => ({ text, y: y0 + i * lineHeight }));
}

// ===========================================================================
// 2. Cost stack (§4) — stacked horizontal bar, build / run / change.
// ===========================================================================

export interface StackSegment {
  label: string;
  value: number;
  color: string;
}

/** A single stacked horizontal bar with proportional, labelled segments. */
export function costStack(segments: StackSegment[]): string {
  const W = 720;
  const H = 150;
  const padL = 20;
  const padR = 20;
  const barY = 40;
  const barH = 46;
  const plotW = W - padL - padR;
  const total = segments.reduce((s, x) => s + x.value, 0);

  let svg = open({ width: W, height: H, title: 'Cost stack' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  let x = padL;
  segments.forEach((seg, i) => {
    const w = (seg.value / total) * plotW;
    svg += `<rect x="${x}" y="${barY}" width="${w}" height="${barH}" fill="${seg.color}"/>`;
    if (i > 0) {
      svg += `<line x1="${x}" y1="${barY}" x2="${x}" y2="${barY + barH}" stroke="${CHART.paper}" stroke-width="2"/>`;
    }
    const pct = Math.round((seg.value / total) * 100);
    const cx = x + w / 2;
    // In-bar percentage when the slice is wide enough.
    if (w > 54) {
      const onDark = seg.color === CHART.ink || seg.color === CHART.accent;
      svg += txt(cx, barY + barH / 2 + 4, `${pct}%`, {
        size: 13,
        anchor: 'middle',
        weight: 800,
        fill: onDark ? CHART.paper : CHART.ink,
      });
    }
    // Legend row below.
    const lx = padL + (plotW / segments.length) * i;
    svg += `<rect x="${lx}" y="${barY + barH + 18}" width="10" height="10" fill="${seg.color}"/>`;
    svg += txt(lx + 16, barY + barH + 27, seg.label, {
      size: 10,
      weight: 700,
    });
    svg += txt(lx + 16, barY + barH + 41, compactUsd(seg.value), {
      size: 11,
      weight: 800,
      mono: true,
      fill: CHART.inkSoft,
    });
    x += w;
  });

  svg += txt(padL, 24, 'Total base investment by lane', {
    size: 10,
    weight: 700,
    upper: true,
    spacing: 0.6,
    fill: CHART.inkSoft,
  });
  svg += txt(W - padR, 24, compactUsd(total), {
    size: 13,
    weight: 800,
    anchor: 'end',
    mono: true,
  });
  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 3. Gross-to-net value bridge (§5) — gross, downward haircut steps, net.
// ===========================================================================

export interface BridgeStep {
  label: string;
  /** Negative magnitude of the haircut (a positive number; drawn downward). */
  amount: number;
}

/** Gross value, each haircut as a downward step, ending at net value. */
export function valueBridge(
  gross: number,
  steps: BridgeStep[],
  net: number,
): string {
  const W = 720;
  const H = 340;
  const padL = 56;
  const padR = 24;
  const padT = 28;
  const padB = 84;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const max = gross * 1.06;
  const y = (v: number): number => padT + plotH - (v / max) * plotH;

  const cols = steps.length + 2; // gross + steps + net
  const slot = plotW / cols;
  const barW = Math.min(58, slot * 0.6);

  let svg = open({ width: W, height: H, title: 'Gross-to-net value bridge' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  for (let i = 0; i <= 4; i++) {
    const v = (max / 4) * i;
    const gy = y(v);
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${CHART.grid}" stroke-width="1"/>`;
    svg += txt(padL - 8, gy + 3, compactUsd(v), {
      size: 9,
      anchor: 'end',
      fill: CHART.inkSoft,
      mono: true,
    });
  }

  // Gross bar.
  const gx = padL + slot / 2 - barW / 2;
  svg += `<rect x="${gx}" y="${y(gross)}" width="${barW}" height="${y(0) - y(gross)}" fill="${CHART.ink}" rx="1.5"/>`;
  svg += txt(gx + barW / 2, y(gross) - 6, compactUsd(gross), {
    size: 10,
    anchor: 'middle',
    weight: 800,
    mono: true,
  });
  wrapLabel('Gross value (3-yr)', padL + slot / 2, padT + plotH + 16, 11).forEach(
    (line) => {
      svg += txt(padL + slot / 2, line.y, line.text, {
        size: 9,
        anchor: 'middle',
        weight: 800,
        fill: CHART.ink,
      });
    },
  );

  // Haircut steps — float down from running.
  let running = gross;
  steps.forEach((step, i) => {
    const cx = padL + slot * (i + 1) + slot / 2;
    const x = cx - barW / 2;
    const top = y(running);
    const bottom = y(running - step.amount);
    svg += `<rect x="${x}" y="${top}" width="${barW}" height="${Math.max(2, bottom - top)}" fill="${CHART.negative}" rx="1.5"/>`;
    // Connector.
    const prevCx = padL + slot * i + slot / 2;
    svg += `<line x1="${prevCx + barW / 2}" y1="${top}" x2="${x}" y2="${top}" stroke="${CHART.inkSoft}" stroke-width="1" stroke-dasharray="2 2"/>`;
    svg += txt(cx, top - 6, `-${compactUsd(step.amount)}`, {
      size: 9,
      anchor: 'middle',
      weight: 700,
      fill: CHART.negative,
      mono: true,
    });
    wrapLabel(step.label, cx, padT + plotH + 16, 11).forEach((line) => {
      svg += txt(cx, line.y, line.text, {
        size: 9,
        anchor: 'middle',
        fill: CHART.inkSoft,
        weight: 600,
      });
    });
    running -= step.amount;
  });

  // Net bar.
  const nCx = padL + slot * (steps.length + 1) + slot / 2;
  const nx = nCx - barW / 2;
  svg += `<rect x="${nx}" y="${y(net)}" width="${barW}" height="${y(0) - y(net)}" fill="${CHART.accent}" rx="1.5"/>`;
  const lastCx = padL + slot * steps.length + slot / 2;
  svg += `<line x1="${lastCx + barW / 2}" y1="${y(net)}" x2="${nx}" y2="${y(net)}" stroke="${CHART.inkSoft}" stroke-width="1" stroke-dasharray="2 2"/>`;
  svg += txt(nCx, y(net) - 6, compactUsd(net), {
    size: 10,
    anchor: 'middle',
    weight: 800,
    mono: true,
    fill: CHART.accent,
  });
  wrapLabel('Net value (3-yr)', nCx, padT + plotH + 16, 11).forEach((line) => {
    svg += txt(nCx, line.y, line.text, {
      size: 9,
      anchor: 'middle',
      weight: 800,
      fill: CHART.accent,
    });
  });

  svg += `<line x1="${padL}" y1="${y(0)}" x2="${W - padR}" y2="${y(0)}" stroke="${CHART.ink}" stroke-width="1.5"/>`;
  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 4. Adoption curve (§5) — value ramp over the horizon.
// ===========================================================================

export interface AdoptionPoint {
  /** Period label, e.g. "Year 1". */
  label: string;
  /** Adoption fraction 0..1. */
  adoption: number;
  /** Net value for the period. */
  netValue: number;
}

/** Stepped adoption ramp with the per-year net value plotted as bars. */
export function adoptionCurve(points: AdoptionPoint[]): string {
  const W = 720;
  const H = 280;
  const padL = 56;
  const padR = 56;
  const padT = 28;
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxV = Math.max(...points.map((p) => p.netValue)) * 1.12;
  const slot = plotW / points.length;
  const barW = Math.min(72, slot * 0.5);

  let svg = open({ width: W, height: H, title: 'Adoption and value ramp' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  for (let i = 0; i <= 4; i++) {
    const gy = padT + (plotH / 4) * i;
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${CHART.grid}" stroke-width="1"/>`;
    const v = (maxV / 4) * (4 - i);
    svg += txt(padL - 8, gy + 3, compactUsd(v), {
      size: 9,
      anchor: 'end',
      fill: CHART.inkSoft,
      mono: true,
    });
    svg += txt(W - padR + 8, gy + 3, `${Math.round((100 / 4) * (4 - i))}%`, {
      size: 9,
      anchor: 'start',
      fill: CHART.accent,
      mono: true,
    });
  }

  // Value bars.
  points.forEach((p, i) => {
    const cx = padL + slot * i + slot / 2;
    const x = cx - barW / 2;
    const top = padT + plotH - (p.netValue / maxV) * plotH;
    svg += `<rect x="${x}" y="${top}" width="${barW}" height="${padT + plotH - top}" fill="${CHART.accentSoft}" rx="1.5"/>`;
    svg += txt(cx, top - 6, compactUsd(p.netValue), {
      size: 10,
      anchor: 'middle',
      weight: 800,
      mono: true,
      fill: CHART.accent,
    });
    svg += txt(cx, padT + plotH + 18, p.label, {
      size: 10,
      anchor: 'middle',
      weight: 700,
    });
  });

  // Adoption line over the bars.
  const adoptionY = (a: number): number => padT + plotH - a * plotH;
  const pts = points.map((p, i) => {
    const cx = padL + slot * i + slot / 2;
    return `${cx},${ adoptionY(p.adoption) }`;
  });
  svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${CHART.accent}" stroke-width="2.5"/>`;
  points.forEach((p, i) => {
    const cx = padL + slot * i + slot / 2;
    const cy = adoptionY(p.adoption);
    svg += `<circle cx="${cx}" cy="${cy}" r="4" fill="${CHART.paper}" stroke="${CHART.accent}" stroke-width="2"/>`;
    svg += txt(cx, cy - 10, `${Math.round(p.adoption * 100)}%`, {
      size: 9,
      anchor: 'middle',
      weight: 800,
      fill: CHART.accent,
      mono: true,
    });
  });

  svg += `<line x1="${padL}" y1="${padT + plotH}" x2="${W - padR}" y2="${padT + plotH}" stroke="${CHART.ink}" stroke-width="1.5"/>`;
  // Axis captions.
  svg += txt(padL - 8, padT - 10, 'Net value', {
    size: 9,
    weight: 700,
    upper: true,
    spacing: 0.5,
    fill: CHART.inkSoft,
  });
  svg += txt(W - padR + 8, padT - 10, 'Adoption', {
    size: 9,
    weight: 700,
    upper: true,
    spacing: 0.5,
    anchor: 'end',
    fill: CHART.accent,
  });
  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 5. Sensitivity tornado (§6) — horizontal bars, widest mover at top.
// ===========================================================================

export interface TornadoBar {
  label: string;
  /** Swing magnitude — drives bar width. Larger = more case movement. */
  swing: number;
  /** True when the driver is a seed-gap proxy (rendered with a hatch). */
  isProxy: boolean;
}

/** Horizontal tornado — the assumptions that move the case, widest at top. */
export function sensitivityTornado(bars: TornadoBar[]): string {
  const W = 720;
  const rowH = 46;
  const padL = 180;
  // Right gutter holds the end tag ("SEED-GAP PROXY" is the widest). The
  // previous 80px clipped it; 148px keeps the whole tag inside the frame.
  const padR = 148;
  const padT = 40;
  const padB = 24;
  const H = padT + bars.length * rowH + padB;
  const plotW = W - padL - padR;
  const max = Math.max(...bars.map((b) => b.swing));

  let svg = open({ width: W, height: H, title: 'Sensitivity tornado' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  // Hatch pattern for proxy bars.
  svg +=
    `<defs><pattern id="proxyhatch" width="6" height="6" ` +
    `patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="6" height="6" fill="${CHART.warnSoft}"/>` +
    `<line x1="0" y1="0" x2="0" y2="6" stroke="${CHART.warn}" stroke-width="2"/>` +
    `</pattern></defs>`;

  // Centre axis.
  const axisX = padL;
  svg += `<line x1="${axisX}" y1="${padT - 8}" x2="${axisX}" y2="${H - padB}" stroke="${CHART.ink}" stroke-width="1.5"/>`;
  svg += txt(axisX, padT - 16, 'Base case', {
    size: 9,
    anchor: 'middle',
    weight: 700,
    upper: true,
    spacing: 0.5,
    fill: CHART.inkSoft,
  });
  svg += txt(W - padR, padT - 16, 'Wider = moves the case more', {
    size: 9,
    anchor: 'end',
    weight: 600,
    fill: CHART.inkSoft,
  });

  bars
    .slice()
    .sort((a, b) => b.swing - a.swing)
    .forEach((bar, i) => {
      const cy = padT + i * rowH + rowH / 2;
      const w = (bar.swing / max) * plotW;
      const fill = bar.isProxy ? 'url(#proxyhatch)' : CHART.accent;
      // Two-sided bar — both directions of the swing.
      svg += `<rect x="${axisX}" y="${cy - 11}" width="${w}" height="22" fill="${fill}" rx="1.5"/>`;
      if (bar.isProxy) {
        svg += `<rect x="${axisX}" y="${cy - 11}" width="${w}" height="22" fill="none" stroke="${CHART.warn}" stroke-width="1" rx="1.5"/>`;
      }
      // Driver label, left of axis.
      wrapLabel(bar.label, padL - 12, cy - 3, 11).forEach((line, li, arr) => {
        svg += txt(padL - 12, line.y + (arr.length === 1 ? 4 : 0), line.text, {
          size: 10,
          anchor: 'end',
          weight: 700,
        });
        void li;
      });
      // Tag at bar end.
      svg += txt(axisX + w + 8, cy + 4, bar.isProxy ? 'SEED-GAP PROXY' : 'GROUNDED', {
        size: 8,
        weight: 800,
        upper: true,
        spacing: 0.4,
        fill: bar.isProxy ? CHART.warn : CHART.positive,
      });
    });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 6. Payback range curve (§6) — base/conservative/upside cumulative cash flow.
//    HONEST: when payback is blocked the lines genuinely never cross zero.
// ===========================================================================

export interface CashFlowSeries {
  label: string;
  color: string;
  dashed?: boolean;
  /** Cumulative net cash per period — period 0 is the up-front investment. */
  cumulative: number[];
}

/**
 * Cumulative cash-flow lines. `paybackBlocked` forces the honest read: the
 * chart annotates that payback is not computable and never draws a crossing.
 */
export function paybackRangeCurve(
  series: CashFlowSeries[],
  periodLabels: string[],
  paybackBlocked: boolean,
): string {
  const W = 720;
  const H = 320;
  const padL = 60;
  const padR = 130;
  const padT = 28;
  const padB = 52;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = series.flatMap((s) => s.cumulative);
  const maxV = Math.max(...allVals, 0);
  const minV = Math.min(...allVals, 0);
  const span = maxV - minV || 1;
  const periods = periodLabels.length;
  const stepX = plotW / Math.max(1, periods - 1);
  const y = (v: number): number => padT + plotH - ((v - minV) / span) * plotH;
  const zeroY = y(0);

  let svg = open({ width: W, height: H, title: 'Payback range cash-flow' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  // Gridlines.
  for (let i = 0; i <= 4; i++) {
    const v = minV + (span / 4) * i;
    const gy = y(v);
    svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="${CHART.grid}" stroke-width="1"/>`;
    svg += txt(padL - 8, gy + 3, compactUsd(v), {
      size: 9,
      anchor: 'end',
      fill: CHART.inkSoft,
      mono: true,
    });
  }

  // Zero line — emphasised; it is the payback threshold.
  svg += `<line x1="${padL}" y1="${zeroY}" x2="${W - padR}" y2="${zeroY}" stroke="${CHART.ink}" stroke-width="1.5"/>`;
  svg += txt(W - padR + 6, zeroY + 3, 'Break-even', {
    size: 9,
    weight: 800,
    fill: CHART.ink,
  });

  // Period ticks.
  periodLabels.forEach((lab, i) => {
    const x = padL + stepX * i;
    svg += txt(x, H - padB + 18, lab, {
      size: 9,
      anchor: 'middle',
      weight: 600,
      fill: CHART.inkSoft,
    });
  });

  // Series lines.
  series.forEach((s) => {
    const pts = s.cumulative.map((v, i) => `${padL + stepX * i},${y(v)}`);
    const dash = s.dashed ? ' stroke-dasharray="5 4"' : '';
    svg += `<polyline points="${pts.join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"${dash}/>`;
    s.cumulative.forEach((v, i) => {
      svg += `<circle cx="${padL + stepX * i}" cy="${y(v)}" r="3" fill="${s.color}"/>`;
    });
    // End label.
    const last = s.cumulative[s.cumulative.length - 1];
    svg += txt(
      padL + stepX * (s.cumulative.length - 1) + 8,
      y(last) + 3,
      s.label,
      { size: 9, weight: 800, fill: s.color },
    );
  });

  // Honest blocked annotation.
  if (paybackBlocked) {
    const bx = padL + 14;
    const by = padT + 14;
    svg += `<rect x="${bx}" y="${by}" width="320" height="50" fill="${CHART.warnSoft}" stroke="${CHART.warn}" stroke-width="1" rx="3"/>`;
    svg += txt(bx + 12, by + 20, 'Payback not computable', {
      size: 11,
      weight: 800,
      fill: CHART.warn,
    });
    svg += txt(
      bx + 12,
      by + 37,
      'Monetisation blocked — lines model net value, not cash.',
      { size: 9, weight: 600, fill: CHART.warn },
    );
  }

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 7. Phased roadmap swimlane (§7) — workstreams × time, gates & milestones.
// ===========================================================================

export interface SwimlanePhase {
  label: string;
  /** Start month (0-based) and duration in months. */
  startMonth: number;
  durationMonths: number;
  /** Whether the phase is foundational (enablement-only). */
  foundational: boolean;
  /** Annual value the phase unlocks (0 for foundational). */
  valueUnlocked: number;
  /** Short milestone caption. */
  milestone: string;
  /** Gate marker label shown at phase end, e.g. "Gate G1". */
  gate: string;
}

/** Time-phased swimlane with gate diamonds and value-milestone callouts. */
export function roadmapSwimlane(
  phases: SwimlanePhase[],
  totalMonths: number,
): string {
  const W = 720;
  const rowH = 62;
  const padL = 132;
  const padR = 28;
  const padT = 46;
  const padB = 30;
  const H = padT + phases.length * rowH + padB;
  const plotW = W - padL - padR;
  const monthW = plotW / totalMonths;

  let svg = open({ width: W, height: H, title: 'Phased roadmap swimlane' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  // Month gridlines (every 6 months).
  for (let m = 0; m <= totalMonths; m += 6) {
    const x = padL + monthW * m;
    svg += `<line x1="${x}" y1="${padT - 10}" x2="${x}" y2="${H - padB}" stroke="${CHART.grid}" stroke-width="1"/>`;
    svg += txt(x, padT - 16, `M${m}`, {
      size: 9,
      anchor: 'middle',
      weight: 600,
      fill: CHART.inkSoft,
      mono: true,
    });
  }

  phases.forEach((ph, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const x = padL + monthW * ph.startMonth;
    const w = monthW * ph.durationMonths;
    const fill = ph.foundational ? CHART.cream : CHART.accentSoft;
    const stroke = ph.foundational ? CHART.inkSoft : CHART.accent;
    // Phase bar.
    svg += `<rect x="${x}" y="${cy - 15}" width="${w}" height="30" fill="${fill}" stroke="${stroke}" stroke-width="1.25" rx="3"/>`;
    // Phase label, left gutter.
    svg += txt(padL - 10, cy - 2, ph.label.split('—')[0].trim(), {
      size: 10,
      anchor: 'end',
      weight: 800,
    });
    svg += txt(padL - 10, cy + 11, `${ph.durationMonths} mo`, {
      size: 9,
      anchor: 'end',
      weight: 600,
      fill: CHART.inkSoft,
      mono: true,
    });
    // In-bar value or enablement tag. A foundational phase is short, so its
    // "Enablement · no value yet" caption would collide with the gate diamond
    // that sits at the bar end — render that caption ABOVE the bar instead.
    const inBar = ph.foundational
      ? 'Enablement · no value yet'
      : `Unlocks ~${compactUsd(ph.valueUnlocked)}/yr`;
    if (ph.foundational) {
      svg += txt(x + w / 2, cy - 21, inBar, {
        size: 9,
        anchor: 'middle',
        weight: 700,
        fill: CHART.inkSoft,
      });
    } else {
      svg += txt(x + w / 2, cy + 3, inBar, {
        size: 9,
        anchor: 'middle',
        weight: 700,
        fill: CHART.accent,
      });
    }
    // Gate diamond at phase end.
    const gx = x + w;
    svg += `<path d="M ${gx} ${cy - 9} L ${gx + 8} ${cy} L ${gx} ${cy + 9} L ${gx - 8} ${cy} Z" fill="${CHART.ink}"/>`;
    svg += txt(gx, cy + 26, ph.gate, {
      size: 8,
      anchor: 'middle',
      weight: 800,
      upper: true,
      spacing: 0.3,
      fill: CHART.ink,
    });
  });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 8. Risk / control heatmap (§8) — likelihood × impact grid.
// ===========================================================================

export interface RiskPoint {
  /** 1..3 — low / medium / high. */
  likelihood: number;
  impact: number;
  /** Short risk code shown in the cell, e.g. "R1". */
  code: string;
}

/** A 3×3 likelihood × impact grid with plotted risks. */
export function riskHeatmap(risks: RiskPoint[]): string {
  const W = 420;
  const H = 380;
  const padL = 90;
  const padR = 24;
  const padT = 30;
  const padB = 76;
  const gridW = W - padL - padR;
  const gridH = H - padT - padB;
  const cellW = gridW / 3;
  const cellH = gridH / 3;

  // Cell tone by combined severity.
  const tone = (l: number, im: number): string => {
    const s = l + im;
    if (s >= 5) return CHART.badSoft;
    if (s >= 4) return CHART.warnSoft;
    return CHART.goodSoft;
  };

  let svg = open({ width: W, height: H, title: 'Risk and control heatmap' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  for (let l = 0; l < 3; l++) {
    for (let im = 0; im < 3; im++) {
      const x = padL + im * cellW;
      // Likelihood increases upward.
      const y = padT + (2 - l) * cellH;
      svg += `<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${tone(l + 1, im + 1)}" stroke="${CHART.paper}" stroke-width="2"/>`;
    }
  }

  // Axis labels.
  const axisLabels = ['Low', 'Medium', 'High'];
  axisLabels.forEach((lab, i) => {
    // Impact (x).
    svg += txt(padL + cellW * i + cellW / 2, H - padB + 18, lab, {
      size: 9,
      anchor: 'middle',
      weight: 700,
      fill: CHART.inkSoft,
    });
    // Likelihood (y) — bottom to top.
    svg += txt(padL - 10, padT + (2 - i) * cellH + cellH / 2 + 3, lab, {
      size: 9,
      anchor: 'end',
      weight: 700,
      fill: CHART.inkSoft,
    });
  });
  svg += txt(padL + gridW / 2, H - padB + 38, 'IMPACT', {
    size: 9,
    anchor: 'middle',
    weight: 800,
    spacing: 1,
    fill: CHART.ink,
  });
  svg += `<text x="22" y="${padT + gridH / 2}" font-size="9" font-weight="800" letter-spacing="1" fill="${CHART.ink}" text-anchor="middle" transform="rotate(-90 22 ${padT + gridH / 2})">LIKELIHOOD</text>`;

  // Plot risks — jitter multiple risks in the same cell.
  const cellCounts = new Map<string, number>();
  risks.forEach((r) => {
    const key = `${r.likelihood}-${r.impact}`;
    const idx = cellCounts.get(key) ?? 0;
    cellCounts.set(key, idx + 1);
    const baseX = padL + (r.impact - 1) * cellW + cellW / 2;
    const baseY = padT + (3 - r.likelihood) * cellH + cellH / 2;
    const offX = (idx % 2 === 0 ? -1 : 1) * Math.ceil(idx / 2) * 22;
    const offY = idx >= 2 ? 18 : 0;
    const cx = baseX + offX;
    const cy = baseY + offY;
    svg += `<circle cx="${cx}" cy="${cy}" r="14" fill="${CHART.ink}"/>`;
    svg += txt(cx, cy + 4, r.code, {
      size: 10,
      anchor: 'middle',
      weight: 800,
      fill: CHART.paper,
    });
  });

  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 9. Headline economics strip (§1) — compact metric tiles for the board card.
// ===========================================================================

export interface EconomicsTile {
  label: string;
  value: string;
  /** Optional sub-line. */
  sub?: string;
  /** Tone — drives the value colour. */
  tone: 'neutral' | 'good' | 'warn' | 'bad';
}

/** A horizontal strip of headline-economics tiles. */
export function economicsStrip(tiles: EconomicsTile[]): string {
  const W = 720;
  const H = 96;
  const gap = 8;
  const tileW = (W - gap * (tiles.length - 1)) / tiles.length;

  const toneInk = (t: EconomicsTile['tone']): string =>
    t === 'good'
      ? CHART.good
      : t === 'warn'
        ? CHART.warn
        : t === 'bad'
          ? CHART.bad
          : CHART.ink;

  let svg = open({ width: W, height: H, title: 'Headline economics' });
  tiles.forEach((tile, i) => {
    const x = i * (tileW + gap);
    svg += `<rect x="${x}" y="0" width="${tileW}" height="${H}" fill="${CHART.cream}" rx="3"/>`;
    svg += `<rect x="${x}" y="0" width="3" height="${H}" fill="${toneInk(tile.tone)}"/>`;
    svg += txt(x + 14, 22, tile.label, {
      size: 8,
      weight: 800,
      upper: true,
      spacing: 0.6,
      fill: CHART.inkSoft,
    });
    svg += txt(x + 14, 52, tile.value, {
      size: tile.value.length > 13 ? 15 : 19,
      weight: 800,
      fill: toneInk(tile.tone),
    });
    if (tile.sub) {
      // Adaptive size so a long sub-line (e.g. "$8.28M–$14.3M · post-haircut")
      // stays inside the tile rather than clipping into the next one.
      const subSize =
        tile.sub.length > 24 ? 7.4 : tile.sub.length > 20 ? 8.2 : 9;
      svg += txt(x + 14, 76, tile.sub, {
        size: subSize,
        weight: 600,
        fill: CHART.inkSoft,
      });
    }
  });
  svg += `</svg>`;
  return svg;
}

// ===========================================================================
// 10. Baseline impact chart (§2) — current-state metric vs target.
// ===========================================================================

export interface BaselineBar {
  label: string;
  /** Current measured value. */
  current: number;
  /** Target value (post-Move), or null when not yet targeted. */
  target: number | null;
  unit: string;
  /** Direction of "good" — used only for tone, not arithmetic. */
  betterWhen: 'higher' | 'lower';
}

/** Paired bars — current baseline vs targeted value, per metric. */
export function baselineImpact(bars: BaselineBar[]): string {
  const W = 720;
  const rowH = 56;
  const padL = 168;
  const padR = 96;
  const padT = 36;
  const padB = 20;
  const H = padT + bars.length * rowH + padB;
  const plotW = W - padL - padR;

  let svg = open({ width: W, height: H, title: 'Baseline vs target' });
  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="${CHART.paper}"/>`;

  svg += txt(padL, padT - 14, 'Current baseline', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.4,
    fill: CHART.inkSoft,
  });
  svg += txt(W - padR, padT - 14, 'Move target', {
    size: 9,
    weight: 800,
    upper: true,
    spacing: 0.4,
    anchor: 'end',
    fill: CHART.accent,
  });

  bars.forEach((bar, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const scaleMax =
      Math.max(bar.current, bar.target ?? bar.current) * 1.15 || 1;
    const curW = (bar.current / scaleMax) * plotW;
    const tgtW = bar.target !== null ? (bar.target / scaleMax) * plotW : 0;

    // Metric label.
    wrapLabel(bar.label, padL - 14, cy - 2, 11).forEach((line, li, arr) => {
      svg += txt(padL - 14, line.y + (arr.length === 1 ? 4 : 0), line.text, {
        size: 10,
        anchor: 'end',
        weight: 700,
      });
      void li;
    });

    // Current bar.
    svg += `<rect x="${padL}" y="${cy - 13}" width="${curW}" height="11" fill="${CHART.inkSoft}" rx="1.5"/>`;
    svg += txt(padL + curW + 6, cy - 4, `${bar.current} ${bar.unit}`, {
      size: 9,
      weight: 800,
      mono: true,
      fill: CHART.ink,
    });

    // Target bar.
    if (bar.target !== null) {
      svg += `<rect x="${padL}" y="${cy + 2}" width="${tgtW}" height="11" fill="${CHART.accent}" rx="1.5"/>`;
      svg += txt(padL + tgtW + 6, cy + 11, `${bar.target} ${bar.unit}`, {
        size: 9,
        weight: 800,
        mono: true,
        fill: CHART.accent,
      });
    } else {
      svg += `<rect x="${padL}" y="${cy + 2}" width="80" height="11" fill="url(#nogap)" stroke="${CHART.warn}" stroke-width="1" rx="1.5"/>`;
      svg += txt(padL + 90, cy + 11, 'No target — seed gap', {
        size: 9,
        weight: 700,
        fill: CHART.warn,
      });
    }
  });

  svg +=
    `<defs><pattern id="nogap" width="6" height="6" ` +
    `patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` +
    `<rect width="6" height="6" fill="${CHART.warnSoft}"/>` +
    `<line x1="0" y1="0" x2="0" y2="6" stroke="${CHART.warn}" stroke-width="1.5"/>` +
    `</pattern></defs>`;
  svg += `</svg>`;
  return svg;
}
