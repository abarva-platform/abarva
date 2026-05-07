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

  it('renders the five required intake facts', () => {
    expect(html).toContain('Why now / trigger');
    expect(html).toContain('Decision owner');
    expect(html).toContain('Scope boundary');
    expect(html).toContain('Value or savings target');
    expect(html).toContain('Minimum data / baseline owner');
  });

  it('renders the IT sourcing category picker with five canonical archetypes', () => {
    expect(html).toContain('IT sourcing category');
    expect(html).toContain('Application Managed Services');
    expect(html).toContain('Cloud &amp; Infrastructure');
    expect(html).toContain('Data, Analytics &amp; AI');
    expect(html).toContain('Enterprise Software');
    expect(html).toContain('Custom / Multi-tower');
  });

  it('renders agent guidance without generic chatbot copy', () => {
    expect(html).toContain('Agent guidance');
    expect(html).toContain('Sourcing lead');
    expect(html).toContain('Intake floor');
    expect(html).toContain('Evidence caution');
    // Substantive guidance copy from the canonical AGENT_GUIDANCE list.
    expect(html).toContain('trigger, owner, boundary, value basis, and baseline owner');
  });

  it('wires intake submission to persisted Source event creation', () => {
    expect(source).toContain("fetch('/api/v1/source/events'");
    expect(html).toContain('Open sourcing event');
  });

  it('threads the tenant name into the page header without hard-coding Apex', () => {
    const meridianHtml = renderToStaticMarkup(createElement(SourceOriginatePage, {
      clientName: 'Meridian Health System',
      clientShortName: 'Meridian Health',
      clientKey: 'meridian',
    }));
    expect(meridianHtml).toContain('Meridian Health System');
    expect(meridianHtml).toContain('Ready to stand up a new IT sourcing event for Meridian Health System');
    expect(meridianHtml).not.toContain('Ready to stand up a new IT sourcing event for Apex Retail');
  });

  it('B6 — autosaves intake to localStorage with a per-tenant key', () => {
    // Per-tenant key prefix prevents two clients drafting on the same browser
    // from overwriting each other.
    expect(source).toContain("AUTOSAVE_KEY_PREFIX = 'abarva.source.originate.intake'");
    expect(source).toMatch(/autosaveKey\(clientKey\)/);
    // Read on mount + write on every change + clear on submit.
    expect(source).toContain('readAutosavedDraft(clientKey)');
    expect(source).toContain('window.localStorage.setItem');
    expect(source).toContain('clearAutosavedDraft(clientKey)');
    // SSR-safe — typeof window guards.
    expect(source).toContain("typeof window === 'undefined'");
    // Visible "Draft restored" hint with discard button.
    expect(source).toContain('source-originate-draft-restored');
    expect(source).toContain('source-originate-draft-discard');
    // Submission clears the draft so the next visit starts clean.
    expect(source).toMatch(/clearAutosavedDraft\(clientKey\);[\s\S]+router\.push/);
  });

  it('uses the resizable splitter shell — full-bleed, no max-width cap, drag handle present', () => {
    // Splitter from the canvas package wraps both panes, exposing a known testid.
    expect(html).toContain('source-canvas-splitter');
    expect(html).toContain('source-originate-canvas');
    // Page chrome must NOT impose a hard width cap any longer — the splitter
    // distributes space across the full viewport.
    expect(source).not.toContain('maxWidth: 1440');
    // Full-viewport pin so the chat input stays sticky without page scroll.
    expect(source).toContain("height: 'calc(100vh - 64px)'");
    // Drag-resize handle in the splitter component.
    expect(html).toMatch(/role="separator"[^>]*aria-orientation="vertical"/);
  });
});
