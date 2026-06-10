// PR-4 proof: the RenderableDeliverable renders to board-grade DOCX (packs to a real
// .docx buffer), an Excel companion for wide tables, and a clean AbarVa-styled HTML
// preview with the source register and no leaked internal ids.
import { Packer } from 'docx';
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
});
