import type { PreservedSourceFile } from '../contract';
import {
  azureBlobWriter,
  preserveOriginalToBlob,
  sanitizeFilename,
  sha256Hex,
  DEFAULT_PRESERVE_CONTAINER,
  type BlobWriter,
} from '../preserve-original';

/** In-memory BlobWriter that records every call and returns a fake URL. */
interface RecordedPut {
  container: string;
  objectKey: string;
  bytes: Uint8Array;
  contentType?: string;
}

function recordingWriter(): { writer: BlobWriter; calls: RecordedPut[] } {
  const calls: RecordedPut[] = [];
  const writer: BlobWriter = {
    async put(container, objectKey, bytes, contentType) {
      calls.push({ container, objectKey, bytes, contentType });
      return { url: `memory://${container}/${objectKey}` };
    },
  };
  return { writer, calls };
}

const FIXED_UUID = '00000000-0000-4000-8000-000000000001';
const FIXED_NOW = new Date('2026-06-07T12:34:56.000Z');

describe('sha256Hex', () => {
  it('computes the known digest for "hello world"', () => {
    expect(sha256Hex(Buffer.from('hello world'))).toBe(
      'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
    );
  });

  it('computes the known digest for empty bytes', () => {
    expect(sha256Hex(new Uint8Array(0))).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});

describe('sanitizeFilename', () => {
  it('strips directory components and unsafe characters', () => {
    expect(sanitizeFilename('../../etc/My Org Chart (final).csv')).toBe(
      'My_Org_Chart_final_.csv',
    );
  });

  it('handles windows separators', () => {
    expect(sanitizeFilename('C:\\Users\\a\\data.xlsx')).toBe('data.xlsx');
  });

  it('falls back to "file" when nothing usable remains', () => {
    expect(sanitizeFilename('///')).toBe('file');
    expect(sanitizeFilename('   ')).toBe('file');
  });
});

describe('preserveOriginalToBlob', () => {
  it('builds a deterministic objectKey and a correct PreservedSourceFile', async () => {
    const { writer, calls } = recordingWriter();
    const bytes = Buffer.from('hello world');

    const result = await preserveOriginalToBlob({
      bytes,
      filename: 'Org Chart.csv',
      tenantKey: 'apex-retail',
      contentType: 'text/csv',
      uploadedBy: 'cio@apex-retail',
      blob: writer,
      now: () => FIXED_NOW,
      uuid: () => FIXED_UUID,
    });

    const expectedObjectKey = `landing/apex-retail/inbox/${FIXED_UUID}-Org_Chart.csv`;

    const expected: PreservedSourceFile = {
      tenantKey: 'apex-retail',
      filename: 'Org_Chart.csv',
      container: DEFAULT_PRESERVE_CONTAINER,
      objectKey: expectedObjectKey,
      blobUrl: `memory://${DEFAULT_PRESERVE_CONTAINER}/${expectedObjectKey}`,
      fileHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      bytes: bytes.byteLength,
      contentType: 'text/csv',
      uploadedBy: 'cio@apex-retail',
      ingestedAt: '2026-06-07T12:34:56.000Z',
    };

    expect(result).toEqual(expected);

    // The blob writer was called exactly once with the same key + bytes.
    expect(calls).toHaveLength(1);
    expect(calls[0].container).toBe(DEFAULT_PRESERVE_CONTAINER);
    expect(calls[0].objectKey).toBe(expectedObjectKey);
    expect(calls[0].contentType).toBe('text/csv');
    expect(Buffer.from(calls[0].bytes).equals(bytes)).toBe(true);
  });

  it('honors a custom container and omits optional fields when not provided', async () => {
    const { writer, calls } = recordingWriter();
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const result = await preserveOriginalToBlob({
      bytes,
      filename: 'kpis.json',
      tenantKey: 'meridian-health',
      container: 'custom-landing',
      blob: writer,
      now: () => FIXED_NOW,
      uuid: () => FIXED_UUID,
    });

    expect(result.container).toBe('custom-landing');
    expect(result.objectKey).toBe(
      `landing/meridian-health/inbox/${FIXED_UUID}-kpis.json`,
    );
    expect(result.bytes).toBe(4);
    expect('contentType' in result).toBe(false);
    expect('uploadedBy' in result).toBe(false);
    expect(calls[0].contentType).toBeUndefined();
  });

  it('produces distinct object keys per upload when uuid is the real source', async () => {
    const { writer } = recordingWriter();
    const bytes = Buffer.from('x');

    const a = await preserveOriginalToBlob({
      bytes,
      filename: 'a.csv',
      tenantKey: 't',
      blob: writer,
      now: () => FIXED_NOW,
    });
    const b = await preserveOriginalToBlob({
      bytes,
      filename: 'a.csv',
      tenantKey: 't',
      blob: writer,
      now: () => FIXED_NOW,
    });

    expect(a.objectKey).not.toBe(b.objectKey);
    // Same bytes => same hash, even with different keys.
    expect(a.fileHash).toBe(b.fileHash);
  });
});

describe('azureBlobWriter', () => {
  it('returns a BlobWriter object with a put method (no live call)', () => {
    const writer = azureBlobWriter();
    expect(typeof writer.put).toBe('function');
  });
});
