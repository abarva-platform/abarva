// Board-grade Costed Business-Case Pack — SVG → PNG rasteriser.
//
// The PPTX export uses a HYBRID fidelity model: words are native, editable
// PowerPoint objects, but the bespoke financial exhibits ship as high-res
// images so they look exactly like the HTML deck. This module is the bridge —
// it takes an inline `<svg>` string from `svg-charts.ts` and produces a PNG.
//
// The rasteriser is `@resvg/resvg-js` — a pure, prebuilt-binary library with
// NO system-library dependency (unlike `librsvg` or `sharp`'s libvips). That
// keeps the export working in a slim Node container with nothing else added.
//
// It does NOT modify any SVG function — it only consumes the strings they
// already return.

import { Resvg } from '@resvg/resvg-js';

/** A rasterised exhibit — the PNG bytes plus its natural pixel dimensions. */
export interface RasterisedSvg {
  png: Buffer;
  /** Rendered pixel width (after the scale factor). */
  width: number;
  /** Rendered pixel height (after the scale factor). */
  height: number;
  /** The SVG's intrinsic aspect ratio — width / height of the viewBox. */
  aspect: number;
}

/**
 * Rasterise an inline `<svg>` string to a high-resolution PNG.
 *
 * The SVGs in `svg-charts.ts` declare a `viewBox` (e.g. `0 0 720 320`) and a
 * fluid `width="100%"`. `fitTo: { mode: 'zoom' }` scales the natural viewBox
 * by `scale` — so a 720×320 chart at scale 3 renders crisp at 2160×960.
 *
 * The cream artifact ground is painted as the background so a chart with
 * transparent edges sits flush on the slide rather than showing white.
 *
 * @param svg   An inline SVG string (self-contained, from `svg-charts.ts`).
 * @param scale Supersampling factor — 2–3 keeps text crisp when scaled into a
 *              slide. Defaults to 3.
 */
export function rasteriseSvg(svg: string, scale = 3): RasterisedSvg {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'zoom', value: scale },
    // The charts paint their own white plot panel; a transparent page lets the
    // slide's cream ground show through any margin the SVG leaves.
    background: 'rgba(0,0,0,0)',
    font: {
      // The charts request "DM Sans"/"Inter"; fall back to a serif-free system
      // sans so a slim container with no bundled fonts still renders legibly.
      loadSystemFonts: true,
      defaultFontFamily: 'Arial',
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  const width = rendered.width;
  const height = rendered.height;
  return {
    png: Buffer.from(png),
    width,
    height,
    aspect: width / height,
  };
}

/**
 * Rasterise an SVG and return a `data:` URL — the form `pptxgenjs` accepts for
 * an embedded image. The PNG is base64-encoded inline so the resulting `.pptx`
 * is fully self-contained.
 */
export function rasteriseSvgToDataUrl(
  svg: string,
  scale = 3,
): { dataUrl: string; aspect: number } {
  const { png, aspect } = rasteriseSvg(svg, scale);
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    aspect,
  };
}
