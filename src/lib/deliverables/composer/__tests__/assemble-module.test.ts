import { assembleComposerModule, type SlideFunction } from '../assemble-module';
import type { SlideStoryPlanEntry } from '../presentation-packet';

const plan = (...ids: string[]): SlideStoryPlanEntry[] =>
  ids.map((slideId) => ({
    slideId,
    title: `Title ${slideId}`,
    purpose: 'p',
    decisionContribution: 'd',
    sourceFactIds: ['exec'],
    figureIds: [],
    visualIntent: 'v',
    slideType: 'content',
    designation: 'core',
  }));

const fn = (slideId: string, body = '    s = deck.add_slide()\n    s.add_title("x")'): SlideFunction => ({
  slideId,
  code: `def slide_${slideId}(deck, theme):\n${body}`,
});

describe('assembling the composer module', () => {
  it('emits every function once and calls them in plan order', () => {
    const { source, missing, malformed } = assembleComposerModule(plan('s1', 's2', 's3'), [fn('s3'), fn('s1'), fn('s2')], 'v3');
    expect(missing).toEqual([]);
    expect(malformed).toEqual([]);
    const calls = [...source.matchAll(/^\s{4}(slide_s\d)\(deck, theme\)/gm)].map((m) => m[1]);
    // The functions arrived out of order; the deck must not be.
    expect(calls).toEqual(['slide_s1', 'slide_s2', 'slide_s3']);
    expect(source).toContain('deck.save("deck.pptx")');
  });

  it('reports a slide the composer never wrote instead of silently dropping it', () => {
    const { missing, source } = assembleComposerModule(plan('s1', 's2'), [fn('s1')], 'v3');
    expect(missing).toEqual(['s2']);
    expect(source).not.toContain('slide_s2');
  });

  it('calls the function that was actually defined, not the one that was asked for', () => {
    // A renamed function would otherwise be defined and never called: the slide
    // vanishes, the module still runs, and the deck looks plausible.
    const renamed: SlideFunction = { slideId: 's1', code: 'def slide_cover_intro(deck, theme):\n    deck.add_slide()' };
    const { source, malformed } = assembleComposerModule(plan('s1'), [renamed], 'v3');
    expect(malformed).toEqual([]);
    expect(source).toContain('slide_cover_intro(deck, theme)');
  });

  it('flags a fragment that is not a function definition', () => {
    const { malformed } = assembleComposerModule(plan('s1'), [{ slideId: 's1', code: 'deck.add_slide()' }], 'v3');
    expect(malformed).toEqual(['s1']);
  });

  it('reports a function for a slide the plan does not contain', () => {
    const { extra } = assembleComposerModule(plan('s1'), [fn('s1'), fn('s9')], 'v3');
    expect(extra).toEqual(['s9']);
  });

  it('dedents a function the model returned indented', () => {
    const indented: SlideFunction = {
      slideId: 's1',
      code: '    def slide_s1(deck, theme):\n        deck.add_slide()',
    };
    const { source, malformed } = assembleComposerModule(plan('s1'), [indented], 'v3');
    expect(malformed).toEqual([]);
    expect(source).toContain('\ndef slide_s1(deck, theme):');
  });
});
