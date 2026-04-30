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

  it('frames Source as technology and IT sourcing only', () => {
    expect(html).toContain('Technology and IT sourcing only');
    expect(html).toContain('Application managed services');
    expect(html).toContain('Cybersecurity and enterprise software selection');
  });

  it('prefaces the intake with confirmed Apex tenant context', () => {
    expect(html).toContain('What Source already knows for Apex');
    expect(html).toContain('14');
    expect(html).toContain('403');
    expect(html).toContain('257 / 275');
    expect(html).toContain('415, embedding_status=pending');
    expect(html).toContain('Embeddings pending; no vector retrieval assumed');
  });

  it('renders the five required intake facts', () => {
    expect(html).toContain('Why now / trigger');
    expect(html).toContain('Decision owner');
    expect(html).toContain('Scope boundary');
    expect(html).toContain('Value or savings target');
    expect(html).toContain('Minimum data / baseline owner');
  });

  it('renders agent guidance without a generic chatbot posture', () => {
    expect(html).toContain('Nexus guidance');
    expect(html).toContain('Steward');
    expect(html).toContain('Sentinel');
    expect(html).toContain('Atlas');
    expect(html).toContain('Start from Apex context, then fill the floor.');
  });

  it('keeps create behavior honest as draft-only', () => {
    expect(html).toContain('No create mutation is wired on this route.');
    expect(html).toContain('Review intake draft');
    expect(html).not.toContain('Create sourcing event');
    expect(html).not.toContain('event created');
  });
});
