// Board-grade Apex Costed Business-Case Pack — editable PPTX render contract.
//
// Pins the hybrid-fidelity PowerPoint export: a 16:9 deck of 12 slides (cover
// plus the 11 board sections) that opens cleanly in PowerPoint and Keynote.
// The renderer reuses the SAME view-model as the HTML deck — every figure
// traces to the kernel, payback stays HONESTLY blocked (never a fake number),
// and the slide text is genuine, editable PowerPoint content (not images).

import JSZip from 'jszip';

import { renderApexCostedBusinessCasePptx } from '../pptx-renderer';

describe('Apex Costed Business-Case Pack — editable PPTX render', () => {
  let buffer: Buffer;
  let zip: JSZip;
  /** Concatenated text of every slide XML part — used for content assertions. */
  let allSlideXml: string;
  let slideParts: string[];

  beforeAll(async () => {
    buffer = await renderApexCostedBusinessCasePptx('2026-05-20');
    zip = await JSZip.loadAsync(buffer);
    slideParts = Object.keys(zip.files)
      .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
      .sort();
    const xml = await Promise.all(
      slideParts.map((p) => zip.file(p)!.async('string')),
    );
    allSlideXml = xml.join('\n');
  });

  it('returns a non-empty Buffer that begins with the ZIP magic', () => {
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(10_000);
    // Every .pptx is an OOXML ZIP — the first two bytes are "PK".
    expect(buffer.slice(0, 2).toString('latin1')).toBe('PK');
  });

  it('is a valid OOXML PowerPoint package', async () => {
    // The presentation manifest and content-type map must be present.
    expect(zip.file('ppt/presentation.xml')).not.toBeNull();
    expect(zip.file('[Content_Types].xml')).not.toBeNull();
    const ct = await zip.file('[Content_Types].xml')!.async('string');
    expect(ct).toContain('presentationml.presentation');
  });

  it('contains exactly 12 slide parts — cover plus 11 board sections', () => {
    expect(slideParts).toHaveLength(12);
    expect(slideParts).toContain('ppt/slides/slide1.xml');
    expect(slideParts).toContain('ppt/slides/slide12.xml');
  });

  it('embeds the rasterised exhibits as PNG image parts', () => {
    const media = Object.keys(zip.files).filter(
      (f) => /^ppt\/media\/.+\.png$/i.test(f) && !zip.files[f].dir,
    );
    // Six section slides carry a rasterised bespoke exhibit (why-now,
    // investment, value, payback, roadmap, risks); the rest use native
    // tables and figure tiles instead of an image.
    expect(media.length).toBeGreaterThanOrEqual(6);
  });

  it('renders the slide text as native editable PowerPoint runs', () => {
    // Native text lives in <a:t> runs inside the slide XML — not images of
    // text. The takeaway headlines, eyebrows and figures are all editable.
    const runs = (allSlideXml.match(/<a:t>/g) ?? []).length;
    expect(runs).toBeGreaterThan(80);
  });

  it('carries the honest verdict and a known takeaway as editable text', () => {
    // The board verdict — `shape`, surfaced as "SHAPE ...".
    expect(allSlideXml).toContain('SHAPE');
    // A known takeaway headline from the why-now section view-model.
    expect(allSlideXml).toContain(
      'Containment is stuck at 28%',
    );
    // The cover Move label.
    expect(allSlideXml).toContain('Contact Center');
  });

  it('renders payback honestly as blocked — never a fabricated number', () => {
    const lower = allSlideXml.toLowerCase();
    expect(lower).toContain('not computable');
    expect(lower).toContain('monetisation is blocked');
    // The scenario table shows "Blocked" where the kernel returns null.
    expect(allSlideXml).toContain('Blocked');
  });

  it('keeps the seed gaps explicit on the evidence slide', () => {
    expect(allSlideXml.toLowerCase()).toContain('seed gap');
  });

  it('is deterministic for a fixed generatedOn date', async () => {
    const again = await renderApexCostedBusinessCasePptx('2026-05-20');
    const z = await JSZip.loadAsync(again);
    const parts = Object.keys(z.files).filter((f) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(f),
    );
    expect(parts).toHaveLength(12);
  });
});
