import { markdownToHtml } from '@/lib/exports-shared/markdown-to-html';

describe('markdownToHtml', () => {
  it('returns an empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('renders headings 1-6 with id slugs', () => {
    expect(markdownToHtml('# Hello World')).toContain('<h1 id="hello-world">Hello World</h1>');
    expect(markdownToHtml('## Sub Section')).toContain('<h2 id="sub-section">Sub Section</h2>');
  });

  it('renders paragraphs with bold + italic + inline-code runs', () => {
    const out = markdownToHtml('This is **bold** and *italic* and `code` mix.');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<code>code</code>');
  });

  it('renders bulleted lists as <ul>', () => {
    const out = markdownToHtml(['- one', '- two'].join('\n'));
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>one</li>');
    expect(out).toContain('<li>two</li>');
    expect(out).toContain('</ul>');
  });

  it('renders ordered lists as <ol>', () => {
    const out = markdownToHtml(['1. one', '2. two'].join('\n'));
    expect(out).toContain('<ol>');
    expect(out).toContain('<li>one</li>');
    expect(out).toContain('</ol>');
  });

  it('renders blockquotes as <blockquote> wrapping a <p>', () => {
    const out = markdownToHtml('> wisdom here');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<p>wisdom here</p>');
  });

  it('renders fenced code blocks with language class', () => {
    const out = markdownToHtml(['```ts', 'const x = 1;', '```'].join('\n'));
    expect(out).toContain('<pre><code class="language-ts">');
    expect(out).toContain('const x = 1;');
  });

  it('renders GFM tables as <table> with thead + tbody', () => {
    const out = markdownToHtml(
      ['| Vendor | TCO |', '|---|---|', '| Acme | $1M |'].join('\n'),
    );
    expect(out).toContain('<table>');
    expect(out).toContain('<thead>');
    expect(out).toContain('<th>Vendor</th>');
    expect(out).toContain('<tbody>');
    expect(out).toContain('<td>Acme</td>');
  });

  it('renders thematic breaks as <hr />', () => {
    expect(markdownToHtml('---')).toContain('<hr />');
  });

  it('escapes HTML in text content', () => {
    const out = markdownToHtml('Hello <script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;');
    expect(out).not.toContain('<script>');
  });

  it('escapes raw HTML mdast nodes (defense in depth)', () => {
    // The mock parser surfaces raw HTML as a paragraph; the walker
    // escapes it instead of emitting it raw.
    const out = markdownToHtml('Plain <img src=x onerror=alert(1)>');
    expect(out).not.toContain('<img');
    expect(out).toContain('&lt;img');
  });

  it('sanitizes javascript: links', () => {
    // Link mdast: [text](javascript:alert) should not survive.
    // Our mock parser doesn't produce link nodes; this just confirms
    // the unit doesn't choke on a link-like pattern.
    const out = markdownToHtml('Click [here](javascript:alert(1))');
    // The output may not even include an <a> tag (mock doesn't parse
    // links); confirm we definitely don't emit a hostile href.
    expect(out).not.toContain('javascript:');
  });

  it('handles a realistic mixed body', () => {
    const md = [
      '# Scope Memo',
      '',
      'Tier-1 systems: Epic CIS, MyChart, Cloverleaf.',
      '',
      '## In scope',
      '- Compute migration (280 production VMs)',
      '- Storage (~2.4 PB)',
      '',
      '> Discovery phase deferred.',
      '',
      '| App | Tier |',
      '|---|---|',
      '| Epic CIS | 1 |',
      '| MyChart | 1 |',
    ].join('\n');
    const out = markdownToHtml(md);
    expect(out).toContain('<h1');
    expect(out).toContain('Epic CIS');
    expect(out).toContain('<ul>');
    expect(out).toContain('<blockquote>');
    expect(out).toContain('<table>');
  });
});
