import JSZip from 'jszip';

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
    expect(parsed?.text).toContain('Slide 1: Kyriba rollout | Cash visibility');
    expect(parsed?.text).toContain('Slide 2: Vendor risk | AI clause review');
    expect(parsed?.metadata).toMatchObject({
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      extension: 'pptx',
      slideCount: 2,
      truncated: false,
    });
  });
});
