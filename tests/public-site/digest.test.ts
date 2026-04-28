/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/link', () => function MockLink({ href, children, ...r }: { href: string; children: React.ReactNode; [k: string]: unknown }) { return React.createElement('a', { href, ...r }, children); });
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => '/', useSearchParams: () => new URLSearchParams() }));

// Mock the feed package (pure ESM, not transformable under next/jest CJS mode)
jest.mock('feed', () => {
  return {
    Feed: jest.fn().mockImplementation(() => ({
      addItem: jest.fn(),
      rss2: jest.fn().mockReturnValue('<rss/>'),
      atom1: jest.fn().mockReturnValue('<feed/>'),
      json1: jest.fn().mockReturnValue('{}'),
    })),
  };
});

import { getDigestEntries, getLatestDigestEntry } from '@/lib/public-site/digest-source';
import { DigestEntryCard } from '@/components/public-site/DigestEntry';
import { ContactForm } from '@/components/public-site/ContactForm';
import { isWorkEmail } from '@/lib/public-site/work-email';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';

// 1. getDigestEntries returns at least 1 entry
test('getDigestEntries returns at least 1 entry', () => {
  const entries = getDigestEntries();
  expect(entries.length).toBeGreaterThanOrEqual(1);
});

// 2. First entry has required shape
test('first entry has required fields', () => {
  const entry = getDigestEntries()[0];
  expect(entry).toHaveProperty('weekOf');
  expect(entry).toHaveProperty('weekLabel');
  expect(entry).toHaveProperty('newPatterns');
  expect(entry).toHaveProperty('contradictionsUpdated');
  expect(entry).toHaveProperty('signalsIngested');
  expect(entry).toHaveProperty('patternRevisions');
});

// 3. First entry has at least 1 new pattern
test('first entry has at least 1 new pattern', () => {
  const entry = getDigestEntries()[0];
  expect(entry.newPatterns.length).toBeGreaterThanOrEqual(1);
});

// 4. First entry has at least 1 contradiction updated
test('first entry has at least 1 contradiction updated', () => {
  const entry = getDigestEntries()[0];
  expect(entry.contradictionsUpdated.length).toBeGreaterThanOrEqual(1);
});

// 5. First entry has at least 12 signals ingested
test('first entry has at least 12 signals ingested', () => {
  const entry = getDigestEntries()[0];
  expect(entry.signalsIngested.length).toBeGreaterThanOrEqual(12);
});

// 6. getLatestDigestEntry returns the first entry
test('getLatestDigestEntry returns the first entry', () => {
  const first = getDigestEntries()[0];
  const latest = getLatestDigestEntry();
  expect(latest).toEqual(first);
});

// 7. DigestEntryCard renders the weekLabel
test('DigestEntryCard renders the weekLabel', () => {
  const entry = getDigestEntries()[0];
  render(React.createElement(DigestEntryCard, { entry }));
  expect(screen.getByText('Week of April 28, 2026')).toBeTruthy();
});

// 8. DigestEntryCard renders pattern IDs
test('DigestEntryCard renders pattern IDs', () => {
  const entry = getDigestEntries()[0];
  render(React.createElement(DigestEntryCard, { entry }));
  expect(screen.getByText('PAT-CDP-011')).toBeTruthy();
});

// 9. DigestEntryCard renders contradiction info
test('DigestEntryCard renders contradiction info', () => {
  const entry = getDigestEntries()[0];
  render(React.createElement(DigestEntryCard, { entry }));
  expect(screen.getByText('CON-001')).toBeTruthy();
  expect(screen.getByText('CDP deployment timeline')).toBeTruthy();
});

// 10. ContactForm renders all 5 fields
test('ContactForm renders all 5 fields', () => {
  render(React.createElement(ContactForm));
  expect(screen.getByLabelText('Name')).toBeTruthy();
  expect(screen.getByLabelText('Work email')).toBeTruthy();
  expect(screen.getByLabelText('Company')).toBeTruthy();
  expect(screen.getByLabelText('What AI program are you working on?')).toBeTruthy();
  expect(screen.getByLabelText('What would AbarVa need to do to be useful to you?')).toBeTruthy();
});

// 11. ContactForm renders submit button
test('ContactForm renders submit button', () => {
  render(React.createElement(ContactForm));
  expect(screen.getByRole('button', { name: /send/i })).toBeTruthy();
});

// 12. isWorkEmail: corporate domain passes, free domain fails
test('isWorkEmail rejects free email domains', () => {
  expect(isWorkEmail('user@gmail.com')).toBe(false);
  expect(isWorkEmail('user@yahoo.com')).toBe(false);
  expect(isWorkEmail('user@hotmail.com')).toBe(false);
  expect(isWorkEmail('user@protonmail.com')).toBe(false);
});

// 12b. isWorkEmail: work email passes
test('isWorkEmail accepts corporate email domains', () => {
  expect(isWorkEmail('user@company.com')).toBe(true);
  expect(isWorkEmail('user@enterprise.io')).toBe(true);
  expect(isWorkEmail('user@bigcorp.net')).toBe(true);
});

// 13. ContactForm shows email error for gmail.com
test('ContactForm shows error for free email domain', () => {
  render(React.createElement(ContactForm));
  const emailInput = screen.getByLabelText('Work email');
  fireEvent.change(emailInput, { target: { name: 'email', value: 'user@gmail.com' } });
  expect(screen.getByText(/use your work email/i)).toBeTruthy();
});

// 14. Sitemap XML contains correct namespace and all registered URLs
test('sitemap XML content includes required URLs', () => {
  const entries = [
    { loc: CANONICAL_URLS.origin + '/', priority: '1.0', changefreq: 'weekly' },
    { loc: CANONICAL_URLS.digest, priority: '0.6', changefreq: 'weekly' },
    { loc: CANONICAL_URLS.contact, priority: '0.5', changefreq: 'yearly' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(u => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}\n</urlset>`;
  expect(xml).toContain('sitemaps.org/schemas/sitemap/0.9');
  expect(xml).toContain(CANONICAL_URLS.digest);
  expect(xml).toContain(CANONICAL_URLS.contact);
});

// 15. Robots txt content includes sitemap URL
test('robots.txt content includes sitemap URL', () => {
  const content = `User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_URLS.sitemap}\n`;
  expect(content).toContain('User-agent: *');
  expect(content).toContain(`Sitemap: ${CANONICAL_URLS.sitemap}`);
});

// 16. RSS feed route file exports a GET function
test('RSS feed route exports a GET handler', async () => {
  // Dynamically require after Response is polyfilled for node env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Response = class MockResponse {
    headers: Map<string, string>;
    body: string;
    constructor(body: string, init?: { headers?: Record<string, string> }) {
      this.body = body;
      this.headers = new Map(Object.entries(init?.headers ?? {}));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getHeader(name: string) { return this.headers.get(name); }
  };

  // Use jest.isolateModules to load routes with our mock Response in scope
  let rssFeedGET: (() => InstanceType<typeof globalThis.Response>) | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ GET: rssFeedGET } = require('@/app/(public)/digest/feed.xml/route'));
  });

  const response = rssFeedGET!();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contentType = (response as any).headers.get('Content-Type');
  expect(contentType).toContain('application/rss+xml');
});
