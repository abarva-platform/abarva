import type { CSSProperties, ReactElement } from "react";

// SVG <text> must be real text nodes (not laid out from an HTML span), so every
// chart label in this workspace is built through this helper instead of being
// interpolated into markup.

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  return measureCtx;
}

export function measureText(
  t: string,
  size: number,
  weight?: number,
  mono?: boolean,
): number {
  const ctx = getMeasureCtx();
  if (!ctx) return t.length * size * 0.55;
  ctx.font = `${weight || 400} ${size}px ${mono ? "'JetBrains Mono', monospace" : "Inter, system-ui, sans-serif"}`;
  return ctx.measureText(t).width;
}

// Ellipsise to the pixels actually available, never to a character count.
export function fitText(
  text: string,
  budget: number,
  size: number,
  weight?: number,
  mono?: boolean,
): string {
  if (measureText(text, size, weight, mono) <= budget) return text;
  let t = String(text);
  while (t.length > 1 && measureText(t + "…", size, weight, mono) > budget)
    t = t.slice(0, -1);
  return t.replace(/[\s,&]+$/, "") + "…";
}

export interface SVGTextOpts extends CSSProperties {
  textAnchor?: "start" | "middle" | "end";
  fontWeight?: number;
  transform?: string;
}

export function SVGT(
  key: string,
  x: number,
  y: number,
  text: string,
  o?: SVGTextOpts,
): ReactElement {
  return (
    <text
      key={key}
      x={x}
      y={y}
      fontSize={10.5}
      fill="#5f5e5a"
      fontFamily="Inter, system-ui, sans-serif"
      textAnchor={o?.textAnchor}
      fontWeight={o?.fontWeight}
      transform={o?.transform}
      style={o}
    >
      {text}
    </text>
  );
}
