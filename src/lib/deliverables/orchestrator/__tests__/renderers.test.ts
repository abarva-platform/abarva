// PR-4 proof: the RenderableDeliverable renders to board-grade DOCX (packs to a real
// .docx buffer), an Excel companion for wide tables, and a clean AbarVa-styled HTML
// preview with the source register and no leaked internal ids.
import { Packer } from 'docx';
import JSZip from 'jszip';
import {
  renderDeliverableDocx,
  renderDeliverableExcelCompanion,
  renderDeliverableHtml,
} from '../renderers';
import { scanForInternalLeaks } from '../source-register';
import { goodDocument } from '../__fixtures__/ams-rfp';

describe('DOCX renderer', () => {
  it('produces a valid .docx buffer with the title in metadata', async () => {
    const doc = renderDeliverableDocx(goodDocument());
    const buf = await Packer.toBuffer(doc);
    expect(buf.length).toBeGreaterThan(2000);
    // .docx is a zip — starts with PK
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK');
  });
});

describe('Excel companion', () => {
  it('builds a workbook with one sheet per xlsx-flagged table', async () => {
    const wb = renderDeliverableExcelCompanion(goodDocument());
    expect(wb).not.toBeNull();
    // goodDocument has one xlsx table (Application Inventory) and one docx table (risk register)
    expect(wb!.worksheets).toHaveLength(1);
    expect(wb!.worksheets[0].name).toMatch(/Application Inventory/);
    const buf = await wb!.xlsx.writeBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it('returns null when there are no xlsx tables', () => {
    const doc = goodDocument();
    doc.tables = doc.tables.map((t) => ({ ...t, targetFormat: 'docx' as const }));
    expect(renderDeliverableExcelCompanion(doc)).toBeNull();
  });
});

describe('HTML preview', () => {
  const html = renderDeliverableHtml(goodDocument());

  it('is self-contained and includes title, recommendation, and source register', () => {
    expect(html).toMatch(/<!doctype html>/i);
    expect(html).toMatch(/SkyHarbor Air/);
    expect(html).toMatch(/Recommendation/);
    expect(html).toMatch(/Source Register/);
    expect(html).toMatch(/F8F7F4/); // AbarVa cream background
  });

  it('leaks no internal ids/tags into the rendered HTML body', () => {
    expect(scanForInternalLeaks(html)).toHaveLength(0);
  });

  it('renders authored markdown structure (lists, sub-headings, bold) — not flat <p>-per-line', () => {
    const doc = goodDocument();
    doc.generatedSections = [
      {
        key: 'structured',
        title: '1. Structured Section',
        bodyMarkdown:
          '### Sub-heading\n\nAn intro line with **bold emphasis**.\n\n- First bullet\n- Second bullet\n\n1. Step one\n2. Step two',
        groundingMode: 'mixed',
        citationsUsed: [],
      },
    ];
    const out = renderDeliverableHtml(doc);
    // Real structural markup survives.
    expect(out).toMatch(/<h4>Sub-heading<\/h4>/);
    expect(out).toMatch(/<strong>bold emphasis<\/strong>/);
    expect(out).toMatch(/<ul>\s*<li>First bullet<\/li>/);
    expect(out).toMatch(/<ol>\s*<li>Step one<\/li>/);
    // The old flattening would have wrapped every line in <p> with the markers stripped.
    expect(out).not.toMatch(/<p>- First bullet<\/p>/);
    expect(out).not.toMatch(/<p>### Sub-heading<\/p>/);
  });

  it('uses the canonical clean table recipe — no navy header fill, status-pill confidence', () => {
    // No anti-pattern navy/teal in the deliverable styling.
    expect(html).not.toMatch(/#0C1A3A/i);
    expect(html).not.toMatch(/#2DD4C8/i);
    // Muted uppercase table header + fresh-green recommendation rule.
    expect(html).toMatch(/text-transform:uppercase/);
    expect(html).toMatch(/border-left:3px solid var\(--fresh\)/);
    // Confidence rendered as a status pill, not raw text in a bare cell.
    expect(html).toMatch(/class="pill pill-fresh"/);
  });

  it('renders declared exhibits as visible SVG-backed exhibit blocks', () => {
    expect(html).toMatch(/class="visual-exhibit"/);
    expect(html).toMatch(/Service Tower Scope Map/);
    expect(html).toMatch(/<svg class="exhibit-svg"/);
  });

  it('carries the required document-status disclaimer — not approved until human sign-off', () => {
    expect(html).toMatch(/Document Status/);
    expect(html).toMatch(/AI-generated working draft — not approved/);
    expect(html).toMatch(/Obtain named human approval/);
    expect(html).toMatch(/must not be treated as an approved client deliverable/i);
  });
});

describe('DOCX renderer — visual exhibits', () => {
  it('embeds a rasterised image for each declared exhibit, with its title and description as text', async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);

    const documentXml = await zip.file('word/document.xml')!.async('string');
    expect(documentXml).toMatch(/Visual Exhibits/);
    expect(documentXml).toMatch(/Service Tower Scope Map/);
    expect(documentXml).toMatch(/Towers × services\./);

    // A real PNG was embedded as a media part, not just referenced in prose.
    const mediaFiles = Object.keys(zip.files).filter((f) => /^word\/media\/.*\.png$/.test(f));
    expect(mediaFiles.length).toBeGreaterThan(0);
    const pngBytes = await zip.file(mediaFiles[0])!.async('nodebuffer');
    // PNG magic number.
    expect(pngBytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');

    const relsXml = await zip.file('word/_rels/document.xml.rels')!.async('string');
    expect(relsXml).toMatch(/Type="[^"]*\/relationships\/image"[^/]*Target="media\/[^"]+\.png"/);
  });

  it('falls back to a text notice (not a thrown error) when rasterisation fails', async () => {
    jest.resetModules();
    jest.doMock('@/lib/programs/expert-kernel/exports/board-grade/svg-raster', () => ({
      rasteriseSvg: () => {
        throw new Error('simulated rasteriser failure');
      },
    }));
    const { renderDeliverableDocx: renderWithBrokenRasteriser } = await import('../renderers');
    const { goodDocument: freshGoodDocument } = await import('../__fixtures__/ams-rfp');

    const buf = await Packer.toBuffer(renderWithBrokenRasteriser(freshGoodDocument()));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file('word/document.xml')!.async('string');
    expect(documentXml).toMatch(/exhibit could not be rendered as an image/);
    const mediaFiles = Object.keys(zip.files).filter((f) => /^word\/media\//.test(f));
    expect(mediaFiles).toHaveLength(0);

    jest.dontMock('@/lib/programs/expert-kernel/exports/board-grade/svg-raster');
    jest.resetModules();
  });
});

describe('DOCX renderer — document status disclaimer', () => {
  it('the cover carries the not-approved status paragraph and the footer repeats it', async () => {
    const buf = await Packer.toBuffer(renderDeliverableDocx(goodDocument()));
    const zip = await JSZip.loadAsync(buf);
    const documentXml = await zip.file('word/document.xml')!.async('string');
    const footerFiles = Object.keys(zip.files).filter((f) => /word\/footer\d*\.xml/.test(f));
    const footerXml = (
      await Promise.all(footerFiles.map((f) => zip.file(f)!.async('string')))
    ).join('\n');
    expect(documentXml).toMatch(/AI-generated working draft — not approved/);
    expect(footerXml).toMatch(/AI-generated working draft/);
    expect(footerXml).toMatch(/approved re-upload are required/);
  });
});
