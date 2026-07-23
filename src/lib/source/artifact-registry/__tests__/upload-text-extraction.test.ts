import ExcelJS from 'exceljs';
import JSZip from 'jszip';

const mockPdfGetText = jest.fn();
const mockPdfDestroy = jest.fn();

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: mockPdfGetText,
    destroy: mockPdfDestroy,
  })),
}));

import {
  extractSourceUploadText,
  MAX_UPLOAD_BODY_CHARS,
} from '../upload-text-extraction';

describe('extractSourceUploadText', () => {
  beforeEach(() => {
    mockPdfGetText.mockReset();
    mockPdfDestroy.mockReset();
    mockPdfDestroy.mockResolvedValue(undefined);
  });

  it('decodes a markdown upload to text', async () => {
    const out = await extractSourceUploadText({
      buffer: Buffer.from('# Scope\n\nIn scope: everything.', 'utf8'),
      mimeType: 'text/markdown',
    });
    expect(out.method).toBe('text');
    expect(out.text).toContain('In scope: everything.');
    expect(out.warnings).toHaveLength(0);
  });

  it('decodes plain text and csv', async () => {
    for (const mime of ['text/plain', 'text/csv', 'text/html', 'application/json']) {
      const out = await extractSourceUploadText({ buffer: Buffer.from('hello', 'utf8'), mimeType: mime });
      expect(out.method).toBe('text');
      expect(out.text).toBe('hello');
    }
  });

  it('returns null (not empty string) for a whitespace-only file', async () => {
    const out = await extractSourceUploadText({ buffer: Buffer.from('   \n  ', 'utf8'), mimeType: 'text/plain' });
    expect(out.text).toBeNull();
  });

  it('clamps an oversized body to the char cap', async () => {
    const big = 'x'.repeat(MAX_UPLOAD_BODY_CHARS + 5000);
    const out = await extractSourceUploadText({ buffer: Buffer.from(big, 'utf8'), mimeType: 'text/plain' });
    expect(out.text).not.toBeNull();
    expect(out.text!.length).toBe(MAX_UPLOAD_BODY_CHARS);
  });

  it('extracts text from a PDF using the bounded pdf parser path', async () => {
    mockPdfGetText.mockResolvedValue({
      total: 2,
      text: 'Decision: approve the finalist slate.',
    });
    const out = await extractSourceUploadText({
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
      mimeType: 'application/pdf',
    });
    expect(out.method).toBe('pdf-parse');
    expect(out.text).toContain('approve the finalist slate');
    expect(out.warnings).toHaveLength(0);
    expect(mockPdfGetText).toHaveBeenCalledWith({ first: 50 });
    expect(mockPdfDestroy).toHaveBeenCalled();
  });

  it('extracts workbook cells into a markdown evidence body', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Workshop Notes');
    sheet.addRow(['Topic', 'Detail']);
    sheet.addRow(['Decision', 'Keep ServiceNow integration in scope']);
    sheet.addRow(['Action', 'Owner=Procurement due=2026-08-15']);
    const bytes = Buffer.from(await workbook.xlsx.writeBuffer());

    const out = await extractSourceUploadText({
      buffer: bytes,
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    expect(out.method).toBe('xlsx-exceljs');
    expect(out.text).toContain('## Worksheet: Workshop Notes');
    expect(out.text).toContain('Keep ServiceNow integration in scope');
    expect(out.warnings).toHaveLength(0);
  });

  it('extracts presentation slide text into labeled slide sections', async () => {
    const zip = new JSZip();
    zip.file(
      'ppt/slides/slide1.xml',
      '<p:sld><p:cSld><p:spTree><a:t>Decision: advance BAFO</a:t><a:t>Risk: transition capacity</a:t></p:spTree></p:cSld></p:sld>',
    );
    const bytes = await zip.generateAsync({ type: 'nodebuffer' });

    const out = await extractSourceUploadText({
      buffer: bytes,
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    expect(out.method).toBe('pptx-jszip');
    expect(out.text).toContain('## Slide 1');
    expect(out.text).toContain('Decision: advance BAFO');
  });

  it('marks unsupported binaries unsupported without throwing', async () => {
    const out = await extractSourceUploadText({
      buffer: Buffer.from([0, 1, 2, 3]),
      mimeType: 'image/png',
    });
    expect(out.method).toBe('unsupported');
    expect(out.text).toBeNull();
    expect(out.warnings[0]).toContain('No text extraction');
  });

  it('routes docx to the mammoth path and never throws on garbage bytes', async () => {
    const out = await extractSourceUploadText({
      buffer: Buffer.from('not a real docx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(out.method).toBe('docx-mammoth');
    // Garbage bytes → mammoth fails gracefully → null text + a warning, no throw.
    expect(out.text).toBeNull();
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});
