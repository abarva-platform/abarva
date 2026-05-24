import fs from 'node:fs';
import path from 'node:path';

import JSZip from 'jszip';

import { parseApexP18Zip } from '../apex-p18-pack-ingestion';

const packRoot = path.join(process.cwd(), 'datasets/apex-retail-synthetic-v1');

async function buildZip(files: string[]): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file, fs.readFileSync(path.join(packRoot, file)));
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
}

describe('Apex Packet 18 onboarding parser', () => {
  it('validates the persisted data-pack payload needed for commit', async () => {
    const bytes = await buildZip([
      'manifest.yaml',
      '13-context/enterprise-context-source-files.csv',
      '13-context/client-data-corpus.jsonl',
      '99-verification/expected-corpus-load.json',
    ]);

    const parsed = await parseApexP18Zip(bytes);

    expect(parsed.validationSummary.valid).toBe(true);
    expect(parsed.tenantKey).toBe('apex-retail');
    expect(parsed.rowCounts.sourceFiles).toBe(42);
    expect(parsed.rowCounts.chunks).toBe(280);
    expect(parsed.sourceFiles[0]).toHaveProperty('source_file_id');
    expect(parsed.chunks[0]).toHaveProperty('chunk_id');
  });

  it('refuses an incomplete pack before a session can be committed', async () => {
    const bytes = await buildZip(['manifest.yaml']);

    await expect(parseApexP18Zip(bytes)).rejects.toThrow('Missing required pack file');
  });
});
