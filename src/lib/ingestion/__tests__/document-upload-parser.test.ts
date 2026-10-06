import { spawnSync } from 'node:child_process';
import path from 'node:path';

import JSZip from 'jszip';
import ExcelJS from 'exceljs';

const pdfGetText = jest.fn();
const pdfDestroy = jest.fn(async () => undefined);
jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({ getText: pdfGetText, destroy: pdfDestroy })),
}));

const docxExtract = jest.fn();
jest.mock('mammoth', () => ({ extractRawText: (...args: unknown[]) => docxExtract(...args) }));

import {
  isSupportedIngestionDocument,
  parseIngestionDocument,
} from '../document-upload-parser';

describe('ingestion document upload parser', () => {
  it('sniffs supported formats from extension when storage reports octet-stream', () => {
    expect(
      isSupportedIngestionDocument({
        filename: 'board-update.pptx',
        mimeType: 'application/octet-stream',
      }),
    ).toBe(true);
    expect(
      isSupportedIngestionDocument({
        filename: 'archive.zip',
        mimeType: 'application/octet-stream',
      }),
    ).toBe(false);
  });

  it('parses text documents with metadata and truncation state', async () => {
    const parsed = await parseIngestionDocument({
      filename: 'load-notes.md',
      mimeType: 'application/octet-stream',
      bytes: Buffer.from('# Load notes\n\nDecision: approve vendor contract.'),
      cacheScope: 'test:text',
    });

    expect(parsed).toMatchObject({
      text: '# Load notes\n\nDecision: approve vendor contract.',
      parseMethod: 'markdown-text',
      metadata: {
        mimeType: 'text/markdown',
        extension: 'md',
        truncated: false,
      },
    });
  });

  it('extracts slide text from PPTX packages', async () => {
    const zip = new JSZip();
    zip.file(
      'ppt/slides/slide1.xml',
      '<p:sld><p:cSld><a:t>Kyriba rollout</a:t><a:t>Cash visibility</a:t></p:cSld></p:sld>',
    );
    zip.file(
      'ppt/slides/slide2.xml',
      '<p:sld><p:cSld><a:t>Vendor risk</a:t><a:t>AI clause review</a:t></p:cSld></p:sld>',
    );
    const bytes = await zip.generateAsync({ type: 'nodebuffer' });

    const parsed = await parseIngestionDocument({
      filename: 'board-update.pptx',
      mimeType: 'application/octet-stream',
      bytes,
      cacheScope: 'test:pptx',
    });

    expect(parsed?.parseMethod).toBe('pptx-jszip');
    expect(parsed?.text).toContain('## Slide 1\nKyriba rollout\nCash visibility');
    expect(parsed?.text).toContain('## Slide 2\nVendor risk\nAI clause review');
    expect(parsed?.metadata).toMatchObject({
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
      truncated: false,
    });
  });

  it('extracts bounded PDF text through the PDF parser, not UTF-8 decoding', async () => {
    pdfGetText.mockResolvedValueOnce({ text: 'Signed service schedule', total: 2 });
    const parsed = await parseIngestionDocument({
      filename: 'schedule.pdf',
      mimeType: 'application/pdf',
      bytes: Buffer.from('%PDF-1.7\nnot plain text'),
    });
    expect(parsed.text).toBe('Signed service schedule');
    expect(parsed.parseMethod).toBe('pdf-parse');
    expect(pdfGetText).toHaveBeenCalledWith({ first: 50 });
    expect(pdfDestroy).toHaveBeenCalled();
  });

  it('extracts DOCX with mammoth and preserves warnings', async () => {
    const zip = new JSZip();
    zip.file('word/document.xml', '<w:document><w:t>Service scope</w:t></w:document>');
    docxExtract.mockResolvedValueOnce({ value: 'Service scope', messages: [{ message: 'Style ignored' }] });
    const parsed = await parseIngestionDocument({
      filename: 'scope.docx',
      bytes: await zip.generateAsync({ type: 'nodebuffer' }),
    });
    expect(parsed.text).toBe('Service scope');
    expect(parsed.parseMethod).toBe('docx-mammoth');
    expect(parsed.warnings).toContain('Style ignored');
  });

  it('extracts workbook cells with sheet context', async () => {
    const book = new ExcelJS.Workbook();
    book.addWorksheet('Rates').addRow(['Role', 'Annual fee']);
    book.getWorksheet('Rates')?.addRow(['Analyst', 120000]);
    const parsed = await parseIngestionDocument({
      filename: 'rates.xlsx',
      bytes: Buffer.from(await book.xlsx.writeBuffer()),
    });
    expect(parsed.parseMethod).toBe('xlsx-exceljs');
    expect(parsed.text).toContain('## Worksheet: Rates');
    expect(parsed.text).toContain('| Analyst | 120000 |');
  });

  it('rejects empty extraction, unsupported bytes, and oversized uploads without synthetic text', async () => {
    await expect(parseIngestionDocument({ filename: 'empty.txt', bytes: Buffer.from('  ') }))
      .rejects.toThrow('document_parse_empty');
    await expect(parseIngestionDocument({ filename: 'archive.zip', bytes: Buffer.from('PK') }))
      .rejects.toThrow('document_parse_unsupported');
    await expect(parseIngestionDocument({ filename: 'large.txt', bytes: Buffer.alloc(21 * 1024 * 1024) }))
      .rejects.toThrow('document_parse_too_large');
  });

  it('does not accept a package with no readable slide text', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<p:sld><p:cSld/></p:sld>');
    await expect(parseIngestionDocument({
      filename: 'empty.pptx',
      bytes: await zip.generateAsync({ type: 'nodebuffer' }),
    })).rejects.toThrow('document_parse_empty');
  });

  it('does not treat a workbook sheet name as extracted content', async () => {
    const book = new ExcelJS.Workbook();
    book.addWorksheet('Empty');
    await expect(parseIngestionDocument({
      filename: 'empty.xlsx',
      bytes: Buffer.from(await book.xlsx.writeBuffer()),
    })).rejects.toThrow('document_parse_empty');
  });

  it('marks extracted text as truncated at the documented limit', async () => {
    const parsed = await parseIngestionDocument({ filename: 'long.txt', bytes: Buffer.from('a'.repeat(200_001)) });
    expect(parsed.text).toHaveLength(200_000);
    expect(parsed.metadata.truncated).toBe(true);
    expect(parsed.warnings).toEqual(expect.arrayContaining([expect.stringContaining('limited')]));
  });

  it('rejects compressed package content beyond the expansion budget', async () => {
    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', `<a:t>${'x'.repeat(41 * 1024 * 1024)}</a:t>`);
    await expect(parseIngestionDocument({
      filename: 'oversized.pptx',
      bytes: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }),
    })).rejects.toThrow('document_parse_too_large');
  });

  it('fails closed when a binary signature or declared MIME contradicts the filename', async () => {
    const pdfBytes = Buffer.from('%PDF-1.7\nnot readable as plain text');
    await expect(parseIngestionDocument({ filename: 'notes.txt', mimeType: 'text/plain', bytes: pdfBytes }))
      .rejects.toThrow('document_parse_mismatch');
    await expect(parseIngestionDocument({ filename: 'notes.txt', mimeType: 'application/pdf', bytes: Buffer.from('notes') }))
      .rejects.toThrow('document_parse_mismatch');
    await expect(parseIngestionDocument({ filename: 'contract.pdf', bytes: Buffer.from('plain text') }))
      .rejects.toThrow('document_parse_mismatch');

    const zip = new JSZip();
    zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Review scope</a:t></p:sld>');
    const packageBytes = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(parseIngestionDocument({ filename: 'notes.txt', bytes: packageBytes }))
      .rejects.toThrow('document_parse_mismatch');
    await expect(parseIngestionDocument({ filename: 'wrong.docx', bytes: packageBytes }))
      .rejects.toThrow('document_parse_mismatch');
  });

  it('imports the worker consumer and extracts binary text under plain Node', () => {
    const script = `
      import JSZip from 'jszip';
      import { consumeOneMessage } from './src/lib/ingestion/azure-landing-zone-consumer.ts';
      async function main() {
        const zip = new JSZip();
        zip.file('ppt/slides/slide1.xml', '<p:sld><a:t>Review scope</a:t></p:sld>');
        const bytes = await zip.generateAsync({ type: 'nodebuffer' });
        const message = {
          schema: 'abarva.ingestion.v1', tenantClientKey: 'test-tenant',
          segmentKey: 'vendor_contracts', producedAt: '2026-09-18T00:00:00Z',
          declaredClassification: 'confidential_business',
          storage: {
            accountName: 'test-storage', containerName: 'test-container',
            blobPath: 'scope.pptx', sizeBytes: bytes.length,
            contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            sha256: '0'.repeat(64),
          },
        };
        const outcome = await consumeOneMessage(message, {
          download: async () => ({ bytes, filename: 'scope.pptx' }),
          writeAudit: async () => 'test-audit',
          runPipeline: async ({ document }) => {
            if (document?.parseMethod !== 'pptx-jszip' || !document.text.includes('Review scope')) {
              throw new Error('binary extraction did not reach pipeline');
            }
            return { chunksWritten: 1 };
          },
        });
        if (outcome.status !== 'accepted') throw new Error(JSON.stringify(outcome));
        console.log(outcome.status);
      }
      main().catch((error) => { console.error(error); process.exitCode = 1; });
    `;
    const result = spawnSync(path.join(process.cwd(), 'node_modules/.bin/tsx'), ['-e', script], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_OPTIONS: '' },
      encoding: 'utf8',
      timeout: 15_000,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('accepted');
    expect(result.stderr).toBe('');
  });
});
