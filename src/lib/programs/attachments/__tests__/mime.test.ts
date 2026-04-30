import {
  ATTACHMENT_MIME_ALLOWLIST,
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_ATTACHMENT_SIZE_BYTES,
} from '../mime';

describe('mime allowlist', () => {
  it('accepts every canonical mime in the allowlist', () => {
    for (const mime of ATTACHMENT_MIME_ALLOWLIST) {
      expect(isAllowedMimeType(mime)).toBe(true);
    }
  });

  it('rejects executable mime types', () => {
    expect(isAllowedMimeType('application/x-msdownload')).toBe(false); // .exe
    expect(isAllowedMimeType('application/x-msdos-program')).toBe(false);
    expect(isAllowedMimeType('application/x-sh')).toBe(false);
    expect(isAllowedMimeType('application/x-elf')).toBe(false);
  });

  it('rejects scriptable / interpreted mime types', () => {
    expect(isAllowedMimeType('application/javascript')).toBe(false);
    expect(isAllowedMimeType('text/javascript')).toBe(false);
    expect(isAllowedMimeType('application/x-python')).toBe(false);
    expect(isAllowedMimeType('text/html')).toBe(false);
  });

  it('rejects archive mime types (allowlist intentionally excludes archives)', () => {
    expect(isAllowedMimeType('application/zip')).toBe(false);
    expect(isAllowedMimeType('application/x-tar')).toBe(false);
    expect(isAllowedMimeType('application/x-rar-compressed')).toBe(false);
  });

  it('rejects SVG (XSS risk)', () => {
    expect(isAllowedMimeType('image/svg+xml')).toBe(false);
  });

  it('rejects octet-stream catch-all', () => {
    expect(isAllowedMimeType('application/octet-stream')).toBe(false);
  });

  it('is case-sensitive — only canonical lowercase form passes', () => {
    expect(isAllowedMimeType('Application/PDF')).toBe(false);
    expect(isAllowedMimeType('IMAGE/PNG')).toBe(false);
  });

  it('rejects empty / undefined-shaped strings', () => {
    expect(isAllowedMimeType('')).toBe(false);
    expect(isAllowedMimeType(' ')).toBe(false);
  });
});

describe('size limit', () => {
  it('exposes the 100 MB cap as a constant', () => {
    expect(MAX_ATTACHMENT_SIZE_BYTES).toBe(104_857_600);
  });

  it('rejects zero bytes', () => {
    expect(isWithinSizeLimit(0)).toBe(false);
  });

  it('rejects negative sizes', () => {
    expect(isWithinSizeLimit(-1)).toBe(false);
  });

  it('rejects sizes above 100 MB', () => {
    expect(isWithinSizeLimit(MAX_ATTACHMENT_SIZE_BYTES + 1)).toBe(false);
    expect(isWithinSizeLimit(1_073_741_824)).toBe(false); // 1 GB
  });

  it('accepts the boundary exactly at 100 MB', () => {
    expect(isWithinSizeLimit(MAX_ATTACHMENT_SIZE_BYTES)).toBe(true);
  });

  it('accepts a 1-byte file', () => {
    expect(isWithinSizeLimit(1)).toBe(true);
  });

  it('rejects non-finite values', () => {
    expect(isWithinSizeLimit(Number.NaN)).toBe(false);
    expect(isWithinSizeLimit(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
