import { computeSynthesisEtag } from '../synthesis-etag';

describe('computeSynthesisEtag', () => {
  it('is stable: same input yields same etag across calls', () => {
    const key = 'ams-vendor-consolidation-2026:abc123:v1.0:sentinel';
    const a = computeSynthesisEtag(key);
    const b = computeSynthesisEtag(key);
    expect(a).toBe(b);
  });

  it('produces different etags for different inputs', () => {
    const a = computeSynthesisEtag('instance-a:hash-a:v1:sentinel');
    const b = computeSynthesisEtag('instance-b:hash-b:v1:sentinel');
    expect(a).not.toBe(b);
  });

  it('emits the weak-validator format W/"..."', () => {
    const etag = computeSynthesisEtag('any-key');
    expect(etag.startsWith('W/"')).toBe(true);
    expect(etag.endsWith('"')).toBe(true);
  });

  it('produces a fixed-length output (W/" + 40 hex + ") = 44 chars', () => {
    const a = computeSynthesisEtag('short');
    const b = computeSynthesisEtag(
      'a-substantially-longer-cache-key-that-includes:multiple:segments:and:dashes',
    );
    expect(a.length).toBe(44);
    expect(b.length).toBe(44);
  });

  it('does not escape or transform special characters in the input', () => {
    // Input containing quotes/backslashes still produces a clean hex digest;
    // the output never contains the input, so no escaping is needed.
    const etag = computeSynthesisEtag('weird"key\\with/odd:chars');
    expect(etag).toMatch(/^W\/"[a-f0-9]{40}"$/);
    expect(etag).not.toContain('"key');
    expect(etag).not.toContain('\\');
  });
});
