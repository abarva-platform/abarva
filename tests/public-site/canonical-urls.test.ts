/**
 * Verifies every constant in CANONICAL_URLS is a valid HTTPS URL on abarva.ai or app.abarva.ai
 */
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

const ALLOWED_HOSTS = ['abarva.ai', 'app.abarva.ai'];

function isValidCanonicalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

describe('CANONICAL_URLS', () => {
  it('exports an object', () => {
    expect(typeof CANONICAL_URLS).toBe('object');
  });

  const staticEntries = Object.entries(CANONICAL_URLS).filter(
    ([, v]) => typeof v === 'string'
  ) as [string, string][];

  const functionEntries = Object.entries(CANONICAL_URLS).filter(
    ([, v]) => typeof v === 'function'
  ) as [string, (arg: string) => string][];

  it.each(staticEntries)('%s is a valid HTTPS URL on abarva.ai / app.abarva.ai', (_, url) => {
    expect(isValidCanonicalUrl(url)).toBe(true);
  });

  it.each(functionEntries)(
    '%s(slug) returns a valid HTTPS URL on abarva.ai',
    (_, fn) => {
      const result = fn('test-slug');
      expect(isValidCanonicalUrl(result)).toBe(true);
      expect(result).toContain('test-slug');
    }
  );

  it('origin is exactly https://abarva.ai', () => {
    expect(CANONICAL_URLS.origin).toBe('https://abarva.ai');
  });

  it('app is exactly https://app.abarva.ai', () => {
    expect(CANONICAL_URLS.app).toBe('https://app.abarva.ai');
  });

  it('rssFeed points to /digest/feed.xml on abarva.ai', () => {
    const url = new URL(CANONICAL_URLS.rssFeed);
    expect(url.pathname).toBe('/digest/feed.xml');
  });

  it('atlas ends with trailing slash', () => {
    expect(CANONICAL_URLS.atlas.endsWith('/')).toBe(true);
  });

  it('contact ends with trailing slash', () => {
    expect(CANONICAL_URLS.contact.endsWith('/')).toBe(true);
  });

  it('sitemap ends with .xml', () => {
    expect(CANONICAL_URLS.sitemap.endsWith('.xml')).toBe(true);
  });
});
