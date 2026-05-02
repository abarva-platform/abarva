import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceOriginatePage } from '@/components/source/SourceOriginatePage';

jest.mock('next/navigation', () => ({
  usePathname: () => '/source/new',
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/shell/AppShell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => createElement('div', null, children),
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
    html = renderToStaticMarkup(createElement(SourceOriginatePage, {
      clientName: 'Apex Retail Group',
      clientShortName: 'Apex Retail',
      clientKey: 'apexretail',
    }));
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
    expect(html).toContain('Start from Apex Retail context, then fill the floor.');
  });

  it('wires intake submission to persisted Source event creation and approval', () => {
    expect(source).toContain("fetch('/api/v1/source/events'");
    expect(html).toContain('Create sourcing event');
    expect(html).toContain('tenant-admin approval');
    expect(html).not.toContain('No create mutation is wired on this route.');
  });

  it('does not hard-code Apex when rendering non-Apex tenants', () => {
    const meridianHtml = renderToStaticMarkup(createElement(SourceOriginatePage, {
      clientName: 'Meridian Health System',
      clientShortName: 'Meridian Health',
      clientKey: 'meridian',
    }));

    expect(meridianHtml).toContain('What Source already knows for Meridian Health');
    expect(meridianHtml).toContain('Start from Meridian Health context, then fill the floor.');
    expect(meridianHtml).toContain('Meridian Health context');
    expect(meridianHtml).not.toContain('What Source already knows for Apex');
    expect(meridianHtml).not.toContain('Start from Apex context');
  });
});
