import { extractSourceUploadText, MAX_UPLOAD_BODY_CHARS } from '../upload-text-extraction';

describe('extractSourceUploadText', () => {
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

  it('marks pdf and other binaries unsupported without throwing', async () => {
    const out = await extractSourceUploadText({
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46]),
      mimeType: 'application/pdf',
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
