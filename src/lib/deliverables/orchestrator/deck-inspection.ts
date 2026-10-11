import 'server-only';

// Inspect the PPTX we actually rendered.
//
// Every deck check in this codebase ran against the structured document — the
// thing we intended to render — and none ever opened the file. That let a
// charter ship with 64 shapes hanging off the right edge of the canvas while
// every gate stayed green, because the gate was reading a different object than
// the client opens.
//
// This reads the bytes. Same rule the product applies to evidence: inspect the
// artifact, not the intent.

import JSZip from 'jszip';

/** English Metric Units per inch — PowerPoint's internal unit. */
const EMU_PER_INCH = 914_400;
/** Rounding slack before a shape counts as off-canvas: 0.01in. */
const EDGE_TOLERANCE = EMU_PER_INCH / 100;

export interface InspectedShape {
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
  overflowRightIn: number;
  overflowBottomIn: number;
}

export interface InspectedSlide {
  index: number;
  /** Explicit renderer marker; never inferred from a slide's lack of content. */
  layoutRole?: 'divider';
  textRuns: string[];
  visibleChars: number;
  tableCount: number;
  pictureCount: number;
  chartCount: number;
  /** Object names and visible text read from the actual slide XML. */
  objectNames?: string[];
  namedText?: Record<string, string>;
  /** Notes tied to this slide through its relationship file. */
  notesText?: string;
  offCanvas: InspectedShape[];
}

export interface InspectedDeck {
  canvasWidthIn: number;
  canvasHeightIn: number;
  slideCount: number;
  slides: InspectedSlide[];
}

const T_TAG = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;
const XFRM = /<a:off x="(-?\d+)" y="(-?\d+)"\s*\/><a:ext cx="(\d+)" cy="(\d+)"\s*\/>/g;

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Read a rendered PPTX. Throws only when the buffer is not a readable PPTX. */
export async function inspectDeck(buffer: Buffer): Promise<InspectedDeck> {
  const zip = await JSZip.loadAsync(buffer);

  const presFile = zip.file('ppt/presentation.xml');
  if (!presFile) throw new Error('inspectDeck: not a PPTX — ppt/presentation.xml is absent');
  const sz = /<p:sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/.exec(await presFile.async('string'));
  if (!sz) throw new Error('inspectDeck: presentation declares no slide size');
  const W = Number(sz[1]);
  const H = Number(sz[2]);

  const names = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(/(\d+)/.exec(a)![1]) - Number(/(\d+)/.exec(b)![1]));

  const slides: InspectedSlide[] = [];
  for (const [i, name] of names.entries()) {
    const xml = await zip.file(name)!.async('string');

    const namedText: Record<string, string> = {};
    const objectNames: string[] = [];
    for (const shape of xml.matchAll(/<p:sp>[\s\S]*?<\/p:sp>/g)) {
      const objectName = /<p:cNvPr[^>]*\bname="([^"]*)"/.exec(shape[0])?.[1];
      if (!objectName) continue;
      const decodedName = decodeXml(objectName);
      objectNames.push(decodedName);
      namedText[decodedName] = [...shape[0].matchAll(T_TAG)]
        .map((match) => decodeXml(match[1] ?? '').trim())
        .filter(Boolean).join(' ');
    }
    for (const objectName of xml.matchAll(/<p:cNvPr[^>]*\bname="([^"]*)"/g)) {
      const decodedName = decodeXml(objectName[1] ?? '');
      if (!objectNames.includes(decodedName)) objectNames.push(decodedName);
    }
    const slideStem = /slide(\d+)\.xml$/.exec(name)?.[1];
    const relName = slideStem ? `ppt/slides/_rels/slide${slideStem}.xml.rels` : '';
    const relXml = relName && zip.file(relName) ? await zip.file(relName)!.async('string') : '';
    const notesTarget = /<Relationship\b(?=[^>]*\bType="[^"]*\/notesSlide")(?=[^>]*\bTarget="([^"]+)")[^>]*\/>/.exec(relXml)?.[1];
    const notesName = notesTarget ? `ppt/notesSlides/${notesTarget.split('/').pop()}` : '';
    const notesXml = notesName && zip.file(notesName) ? await zip.file(notesName)!.async('string') : '';
    const notesText = [...notesXml.matchAll(T_TAG)]
      .map((match) => decodeXml(match[1] ?? '').trim()).filter(Boolean).join(' ');

    const textRuns: string[] = [];
    for (const m of xml.matchAll(T_TAG)) {
      const t = decodeXml(m[1] ?? '').trim();
      if (t) textRuns.push(t);
    }

    const offCanvas: InspectedShape[] = [];
    for (const m of xml.matchAll(XFRM)) {
      const x = Number(m[1]);
      const y = Number(m[2]);
      const cx = Number(m[3]);
      const cy = Number(m[4]);
      const overR = x + cx - W;
      const overB = y + cy - H;
      if (
        overR > EDGE_TOLERANCE ||
        overB > EDGE_TOLERANCE ||
        x < -EDGE_TOLERANCE ||
        y < -EDGE_TOLERANCE
      ) {
        offCanvas.push({
          xIn: x / EMU_PER_INCH,
          yIn: y / EMU_PER_INCH,
          widthIn: cx / EMU_PER_INCH,
          heightIn: cy / EMU_PER_INCH,
          overflowRightIn: Math.max(0, overR) / EMU_PER_INCH,
          overflowBottomIn: Math.max(0, overB) / EMU_PER_INCH,
        });
      }
    }

    slides.push({
      index: i + 1,
      ...(xml.includes('name="abarva:layout:divider"')
        ? { layoutRole: 'divider' as const }
        : {}),
      textRuns,
      visibleChars: textRuns.join(' ').length,
      tableCount: (xml.match(/<a:tbl>/g) ?? []).length,
      pictureCount: (xml.match(/<p:pic>/g) ?? []).length,
      chartCount: (xml.match(/<c:chart[\s/>]/g) ?? []).length,
      objectNames,
      namedText,
      notesText,
      offCanvas,
    });
  }

  return {
    canvasWidthIn: W / EMU_PER_INCH,
    canvasHeightIn: H / EMU_PER_INCH,
    slideCount: slides.length,
    slides,
  };
}
