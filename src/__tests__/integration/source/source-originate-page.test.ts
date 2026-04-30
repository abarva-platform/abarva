import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

jest.mock('next/navigation', () => ({
  usePathname: () => '/source/new',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const SOURCE_FILE = resolve(
  __dirname,
  '../../../components/source/SourceOriginatePage.tsx'
);

describe('SourceOriginatePage (SRC-FLW-INTAKE)', () => {
  let html: string;
  let source: string;

  beforeAll(() => {
    source = readFileSync(SOURCE_FILE, 'utf8');
    html = renderToStaticMarkup(createElement(SourceOriginatePage));
  });

  it("marks the file as a client component with 'use client'", () => {
    expect(source.startsWith("'use client'")).toBe(true);
  });

  it('renders step 1 label', () => {
    expect(html).toContain('1 · Pattern');
  });

  it('renders step 2 label', () => {
    expect(html).toContain('2 · Event details');
  });

  it('renders step 3 label', () => {
    expect(html).toContain('3 · Vendors');
  });

  it('renders the create heading in the agent column', () => {
    expect(html).toContain('Create sourcing event');
  });

  it('renders the submit CTA text', () => {
    expect(html).toContain('Create sourcing event');
  });
});
