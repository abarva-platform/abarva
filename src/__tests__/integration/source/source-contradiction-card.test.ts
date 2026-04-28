import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SourceContradictionCard,
  SAMPLE_CONTRADICTION,
} from '@/components/source/SourceContradictionCard';

describe('SourceContradictionCard (SRC-MOD-CONTRADICTION)', () => {
  let html: string;

  beforeAll(() => {
    html = renderToStaticMarkup(
      createElement(SourceContradictionCard, SAMPLE_CONTRADICTION)
    );
  });

  it('renders the contradiction title', () => {
    expect(html).toContain('BAFO pricing vs. baseline cost model');
  });

  it('renders the Sentinel diagnosis section label', () => {
    expect(html).toContain('Sentinel diagnosis');
  });

  it('renders the $600K delta in the diagnosis', () => {
    expect(html).toContain('$600K delta');
  });

  it('renders the recommended resolution section label', () => {
    expect(html).toContain('Recommended resolution');
  });

  it('renders the open status badge', () => {
    expect(html).toContain('Open');
  });

  it('renders both claim sources', () => {
    expect(html).toContain('Vendor C BAFO submission');
    expect(html).toContain('Internal cost model');
  });

  it('renders the severity pill', () => {
    expect(html).toContain('high');
  });
});
