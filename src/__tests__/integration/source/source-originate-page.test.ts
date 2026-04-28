import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

const SOURCE_FILE = resolve(
  __dirname,
  '../../../../components/source/SourceOriginatePage.tsx'
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
    expect(html).toContain('1 · Event details');
  });

  it('renders step 2 label', () => {
    expect(html).toContain('2 · Vendors');
  });

  it('renders step 3 label', () => {
    expect(html).toContain('3 · Confirm');
  });

  it('renders the originate heading in the agent column', () => {
    expect(html).toContain('Originate source event');
  });

  it('renders the submit CTA text', () => {
    expect(html).toContain('Create source event');
  });
});
