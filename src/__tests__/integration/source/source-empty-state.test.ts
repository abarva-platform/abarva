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

  it('renders the originate CTA link', () => {
    expect(html).toContain('Originate new event');
  });

  it('renders Steward agent name', () => {
    expect(html).toContain('Steward');
  });

  it('renders the Steward quote', () => {
    expect(html).toContain('No source events have been created yet');
  });

  it('links to /source/new', () => {
    expect(html).toContain('/source/new');
  });

  it('renders the Sentinel caveat', () => {
    expect(html).toContain('Sentinel monitors events once created');
  });
});
