/**
 * markdownTokens — F0.1 verification (Programs Strict Completion v1.2)
 *
 * Verifies the pure tokenization layer: regexes for IDs and citation
 * tags, citation-chip vs ID-link rendering, citation tags' precedence
 * over bare IDs, and inline-node substitution. The full markdown
 * rendering layer (react-markdown wiring) is verified visually via the
 * dev server because next/jest doesn't transpile react-markdown's ESM.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import {
  CITATION_TAG_REGEX,
  PATTERN_ID_REGEX,
  PROGRAM_ID_REGEX,
  SOURCE_ID_REGEX,
  replaceBareIds,
  tokenize,
  tokenizeWithoutInline,
} from '../markdownTokens';

function render(nodes: ReturnType<typeof tokenize>) {
  return renderToStaticMarkup(<>{nodes}</>);
}

describe('markdownTokens · ID auto-linking', () => {
  it('links 3-segment pattern IDs to /source/patterns/[id]', () => {
    const html = render(replaceBareIds('See PAT-PRG-CDP-001 for context.', 'k'));
    expect(html).toContain('href="/source/patterns/PAT-PRG-CDP-001"');
    expect(html).toContain('PAT-PRG-CDP-001');
  });

  it('links 4-segment pattern IDs (corpus authoring format)', () => {
    const html = render(replaceBareIds('EHS pattern: PAT-SRC-CAT-EHS-001.', 'k'));
    expect(html).toContain('href="/source/patterns/PAT-SRC-CAT-EHS-001"');
  });

  it('links T#- pattern IDs', () => {
    const html = render(replaceBareIds('See T3-H01.', 'k'));
    expect(html).toContain('href="/source/patterns/T3-H01"');
  });

  it('links program IDs to /programs/[id]', () => {
    const html = render(replaceBareIds('APX-CDP-2026 is in Design.', 'k'));
    expect(html).toContain('href="/programs/APX-CDP-2026"');
  });

  it('links source event IDs to /source/[id]', () => {
    const html = render(replaceBareIds('The SRC-AMS-2026 event linked.', 'k'));
    expect(html).toContain('href="/source/SRC-AMS-2026"');
  });

  it('preserves non-ID text around the link', () => {
    const html = render(replaceBareIds('Before APX-CDP-2026 after.', 'k'));
    expect(html).toContain('Before ');
    expect(html).toContain(' after.');
  });
});

describe('markdownTokens · citation chips precedence', () => {
  it('renders [user-context: ...] as a chip with YOU label', () => {
    const html = render(
      tokenizeWithoutInline("Reasoning [user-context: based on David's CDP sponsorship].", 'k'),
    );
    expect(html).toContain('YOU');
    expect(html).toContain("based on David&#x27;s CDP sponsorship");
  });

  it('renders [tenant-specific: ...] as a chip with TENANT label', () => {
    const html = render(
      tokenizeWithoutInline('Decision [tenant-specific: 2024 Vendor C selection].', 'k'),
    );
    expect(html).toContain('TENANT');
    expect(html).toContain('2024 Vendor C selection');
  });

  it('renders [PAT-…: ...] as a clickable pattern chip and does not double-link the inner ID', () => {
    const html = render(
      tokenizeWithoutInline('Pattern [PAT-PRG-CDP-001: CDP Programme Lifecycle].', 'k'),
    );
    expect(html).toContain('href="/source/patterns/PAT-PRG-CDP-001"');
    expect(html).toContain('CDP Programme Lifecycle');
    // Exactly one link target (the chip), not two (chip + bare ID inside the bracket)
    const linkCount = (html.match(/href="\/source\/patterns\/PAT-PRG-CDP-001"/g) ?? []).length;
    expect(linkCount).toBe(1);
  });

  it('handles mixed bare ID and bracketed citation in the same string', () => {
    const html = render(
      tokenizeWithoutInline(
        'Bare APX-CDP-2026 plus [user-context: David sponsors this].',
        'k',
      ),
    );
    expect(html).toContain('href="/programs/APX-CDP-2026"');
    expect(html).toContain('YOU');
    expect(html).toContain('David sponsors this');
  });
});

describe('markdownTokens · inline-node substitution', () => {
  it('substitutes placeholder strings with provided React nodes', () => {
    const inlineNodes = new Map<string, React.ReactNode>([
      [
        '{{cite:program:apx-cdp-2026}}',
        <span key="cite-1" data-testid="cite-pill">
          [CITE]
        </span>,
      ],
    ]);
    const html = render(
      tokenize(
        'Per the program {{cite:program:apx-cdp-2026}}, scope is set.',
        'k',
        inlineNodes,
      ),
    );
    expect(html).toContain('data-testid="cite-pill"');
    expect(html).toContain('[CITE]');
    expect(html).not.toContain('{{cite:program:apx-cdp-2026}}');
  });

  it('falls back to ID and citation-tag tokenization for non-substituted segments', () => {
    const inlineNodes = new Map<string, React.ReactNode>([
      ['{{cite:program:x}}', <span key="x">⟦x⟧</span>],
    ]);
    const html = render(
      tokenize('Program APX-CDP-2026 then {{cite:program:x}} done.', 'k', inlineNodes),
    );
    expect(html).toContain('href="/programs/APX-CDP-2026"');
    expect(html).toContain('⟦x⟧');
  });

  it('handles regex-special characters in placeholder keys safely', () => {
    const inlineNodes = new Map<string, React.ReactNode>([
      ['{{cite:type:id-with.dots+plus(parens)}}', <span key="r">⟦r⟧</span>],
    ]);
    const html = render(
      tokenize(
        'See {{cite:type:id-with.dots+plus(parens)}} note.',
        'k',
        inlineNodes,
      ),
    );
    expect(html).toContain('⟦r⟧');
  });
});

describe('markdownTokens · regex unit checks', () => {
  it('PATTERN_ID_REGEX matches N-segment IDs', () => {
    PATTERN_ID_REGEX.lastIndex = 0;
    expect('PAT-PRG-CDP-001'.match(PATTERN_ID_REGEX)).toEqual(['PAT-PRG-CDP-001']);
    PATTERN_ID_REGEX.lastIndex = 0;
    expect('PAT-SRC-CAT-EHS-001'.match(PATTERN_ID_REGEX)).toEqual(['PAT-SRC-CAT-EHS-001']);
    PATTERN_ID_REGEX.lastIndex = 0;
    expect('T3-H01'.match(PATTERN_ID_REGEX)).toEqual(['T3-H01']);
  });

  it('PROGRAM_ID_REGEX matches APX- format', () => {
    PROGRAM_ID_REGEX.lastIndex = 0;
    expect('APX-CDP-2026'.match(PROGRAM_ID_REGEX)).toEqual(['APX-CDP-2026']);
  });

  it('SOURCE_ID_REGEX matches SRC- format', () => {
    SOURCE_ID_REGEX.lastIndex = 0;
    expect('SRC-AMS-2026'.match(SOURCE_ID_REGEX)).toEqual(['SRC-AMS-2026']);
  });

  it('CITATION_TAG_REGEX captures kind and detail', () => {
    CITATION_TAG_REGEX.lastIndex = 0;
    const m = CITATION_TAG_REGEX.exec('[user-context: David is the sponsor]');
    expect(m).not.toBeNull();
    expect(m![1]).toBe('user-context');
    expect(m![2].trim()).toBe('David is the sponsor');
  });

  it('CITATION_TAG_REGEX matches all three layer prefixes', () => {
    for (const head of ['user-context', 'tenant-specific', 'PAT-PRG-CDP-001']) {
      CITATION_TAG_REGEX.lastIndex = 0;
      const m = CITATION_TAG_REGEX.exec(`[${head}: detail body]`);
      expect(m).not.toBeNull();
      expect(m![1]).toBe(head);
    }
  });
});
