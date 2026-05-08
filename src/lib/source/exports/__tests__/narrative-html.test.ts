import {
  DECISION_BRIEF_HTML_CONFIG,
  RFP_PACK_HTML_CONFIG,
  SCOPE_MEMO_HTML_CONFIG,
  SELECTION_MEMO_HTML_CONFIG,
  buildNarrativeHtml,
  type NarrativeHtmlConfig,
  type NarrativeHtmlPayload,
} from '../renderers/narrative-html';

function makePayload(
  overrides: Partial<NarrativeHtmlPayload> = {},
): NarrativeHtmlPayload {
  return {
    tenantName: 'Meridian Health',
    eventCode: 'MERI-CLOUD-2026',
    eventName: 'Meridian Health Cloud & Infrastructure',
    issuedBy: 'Janet Fischer, VP IT Ops',
    generatedAt: '2026-05-08T03:30:00.000Z',
    body: [
      '# Authored body',
      '',
      'Some narrative content with **bold** and `code`.',
      '',
      '## Section',
      '- bullet 1',
      '- bullet 2',
    ].join('\n'),
    bodyIsAuthored: true,
    ...overrides,
  };
}

describe('buildNarrativeHtml', () => {
  it('produces a complete HTML5 document with the cover block + body', () => {
    const out = buildNarrativeHtml(makePayload(), SCOPE_MEMO_HTML_CONFIG);
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('<title>Scope Memo · MERI-CLOUD-2026</title>');
    expect(out).toContain('class="source-doc__eyebrow"');
    expect(out).toContain('Scope Memo');
    expect(out).toContain('class="source-doc__title"');
    expect(out).toContain('Meridian Health Cloud &amp; Infrastructure');
    expect(out).toContain('Event code: MERI-CLOUD-2026');
    expect(out).toContain('Issued by: Janet Fischer, VP IT Ops');
  });

  it('renders the body markdown content', () => {
    const out = buildNarrativeHtml(makePayload(), RFP_PACK_HTML_CONFIG);
    expect(out).toContain('<h1 id="authored-body">Authored body</h1>');
    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<code>code</code>');
  });

  it('shows the scaffold-warning banner when bodyIsAuthored=false', () => {
    const out = buildNarrativeHtml(
      makePayload({ bodyIsAuthored: false, body: '# Scaffold' }),
      SELECTION_MEMO_HTML_CONFIG,
    );
    expect(out).toContain('Template scaffold');
    expect(out).toContain('source-doc__scaffold-warning');
  });

  it('omits the scaffold-warning banner when bodyIsAuthored=true', () => {
    const out = buildNarrativeHtml(makePayload(), DECISION_BRIEF_HTML_CONFIG);
    expect(out).not.toContain('Template scaffold');
  });

  it('emits the per-artifact confidentiality note in the footer', () => {
    const cases: Array<[NarrativeHtmlConfig, string]> = [
      [SCOPE_MEMO_HTML_CONFIG, 'distribute only to procurement panel'],
      [RFP_PACK_HTML_CONFIG, 'Confidential vendor RFP'],
      [DECISION_BRIEF_HTML_CONFIG, 'Executive review only'],
      [SELECTION_MEMO_HTML_CONFIG, 'final selection memo'],
    ];
    for (const [config, fragment] of cases) {
      const out = buildNarrativeHtml(makePayload(), config);
      expect(out).toContain(fragment);
    }
  });

  it('escapes HTML in tenant + event names', () => {
    const out = buildNarrativeHtml(
      makePayload({
        tenantName: 'Evil <script>',
        eventName: 'Title with & ampersand',
      }),
      SCOPE_MEMO_HTML_CONFIG,
    );
    expect(out).not.toContain('<script>');
    expect(out).toContain('Evil &lt;script&gt;');
    expect(out).toContain('Title with &amp; ampersand');
  });

  it('embeds the AbarVa typography stylesheet inline', () => {
    const out = buildNarrativeHtml(makePayload(), SCOPE_MEMO_HTML_CONFIG);
    expect(out).toContain('<style>');
    expect(out).toContain("'DM Sans'");
    expect(out).toContain('Georgia');
    expect(out).toContain('--bg: #F8F7F4');
  });

  it('emits a meta tag with the artifact code for tooling', () => {
    const out = buildNarrativeHtml(makePayload(), RFP_PACK_HTML_CONFIG);
    expect(out).toContain('name="x-source-artifact-code"');
    expect(out).toContain('content="d09_rfp_pack"');
  });

  it('handles a missing issuedBy without leaving an empty meta line', () => {
    const out = buildNarrativeHtml(
      makePayload({ issuedBy: undefined }),
      SCOPE_MEMO_HTML_CONFIG,
    );
    expect(out).not.toContain('Issued by:');
    expect(out).toContain('Event code:');
    expect(out).toContain('Generated:');
  });

  it('handles an empty body without throwing', () => {
    const out = buildNarrativeHtml(
      makePayload({ body: '', bodyIsAuthored: false }),
      DECISION_BRIEF_HTML_CONFIG,
    );
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('source-doc__body');
  });
});
