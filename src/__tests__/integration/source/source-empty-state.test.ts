import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceEmptyState } from '@/components/source/SourceEmptyState';

describe('SourceEmptyState (SRC-EMP-NO-EVENTS)', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(createElement(SourceEmptyState));
  });

  it('renders the empty state heading', () => {
    expect(html).toContain('No sourcing events yet');
  });

  it('renders the primary "start event" CTA', () => {
    expect(html).toContain('Start IT sourcing event');
  });

  it('links the primary CTA to /source/new', () => {
    expect(html).toContain('href="/source/new"');
  });

  it('renders as a single full-width panel (no orphaned agent column)', () => {
    // The earlier version dropped a fixed-width AgentColumn into AppShell's
    // column flexbox, collapsing the working pane and leaving the right of
    // the screen blank. The empty state is now one centered panel.
    expect(html).toContain('source-events-empty-state');
  });

  it('renders the next-step cards', () => {
    expect(html).toContain('Review setup connectors');
    expect(html).toContain('Portfolio guide');
  });
});
