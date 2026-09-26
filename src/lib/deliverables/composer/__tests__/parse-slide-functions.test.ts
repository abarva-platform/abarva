import { parseSlideFunctions } from '../parse-slide-functions';

describe('parsing per-slide functions from a code response', () => {
  it('pulls one function per marker', () => {
    const r = parseSlideFunctions(
      [
        'Here you go.',
        '### SLIDE s01',
        '```python',
        'def slide_s01(deck, theme):',
        '    deck.add_slide()',
        '```',
        '### SLIDE s02',
        '```python',
        'def slide_s02(deck, theme):',
        '    deck.add_slide()',
        '```',
      ].join('\n'),
    );
    expect(r.functions.map((f) => f.slideId)).toEqual(['s01', 's02']);
    expect(r.functions[0].code).toContain('def slide_s01');
    expect(r.unparsed).toEqual([]);
  });

  it('loses one slide, not the batch, when a block is truncated', () => {
    // A ceiling hit mid-function used to make the whole batch unparseable.
    const r = parseSlideFunctions(
      [
        '### SLIDE s01',
        '```python',
        'def slide_s01(deck, theme):',
        '    deck.add_slide()',
        '```',
        '### SLIDE s02',
        '```python',
        'def slide_s02(deck, theme):',
        '    deck.add_sli',
      ].join('\n'),
    );
    expect(r.functions.map((f) => f.slideId)).toEqual(['s01']);
    expect(r.unparsed).toEqual(['s02']);
  });

  it('rejects a block that is prose rather than a function', () => {
    const r = parseSlideFunctions('### SLIDE s01\n```python\n# I will do this later\n```');
    expect(r.functions).toEqual([]);
    expect(r.unparsed).toEqual(['s01']);
  });

  it('keeps a fence that appears inside the function body', () => {
    // Python can legitimately contain a triple-quoted string; the parser must
    // take the FIRST complete fence and not stop at a backtick in a comment.
    const r = parseSlideFunctions(
      ['### SLIDE s01', '```python', 'def slide_s01(deck, theme):', '    # see `sdk.add_card`', '    deck.add_slide()', '```'].join('\n'),
    );
    expect(r.functions).toHaveLength(1);
    expect(r.functions[0].code).toContain('add_card');
  });

  it('handles a response with no markers at all', () => {
    expect(parseSlideFunctions('sorry, I cannot')).toEqual({ functions: [], unparsed: [] });
  });
});
