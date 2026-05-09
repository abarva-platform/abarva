// Source learn nav · case study helper tests.
//
// The chapter shell uses caseStudyChapterNeighbors() to render the
// prev/next links at the bottom of every chapter. If the chapter
// ordering or the case-study slug coverage regresses, these tests
// catch it before the navigation breaks.

import {
  CASE_STUDY_CHAPTER_SLUGS,
  caseStudyChapterNeighbors,
  findSourceLearnNavItem,
  flatSourceLearnItems,
  SOURCE_LEARN_NAV,
} from '@/lib/source/learn/learn-nav';

describe('Source learn nav · case study', () => {
  it('contains the Meridian case study group with overview + 11 chapters', () => {
    const group = SOURCE_LEARN_NAV.find((g) => g.group === 'Meridian Case Study');
    expect(group).toBeDefined();
    expect(group!.items).toHaveLength(12); // overview + 11 chapters

    const slugs = group!.items.map((i) => i.slug);
    expect(slugs[0]).toBe('case-study');
    expect(slugs.slice(1)).toEqual([...CASE_STUDY_CHAPTER_SLUGS]);
  });

  it('exposes 11 chapter slugs in canonical lifecycle order', () => {
    expect(CASE_STUDY_CHAPTER_SLUGS).toEqual([
      'strategy',
      'scope',
      'rfp',
      'responses',
      'evaluation',
      'pricing',
      'bafo',
      'decision',
      'selection',
      'transition',
      'value',
    ]);
  });

  it('first chapter prev points to overview; last chapter next is null', () => {
    const first = caseStudyChapterNeighbors('strategy');
    expect(first.prev?.slug).toBe('case-study');
    expect(first.next?.slug).toBe('scope');

    const last = caseStudyChapterNeighbors('value');
    expect(last.prev?.slug).toBe('transition');
    expect(last.next).toBeNull();
  });

  it('middle chapter neighbors are continuous', () => {
    const pricing = caseStudyChapterNeighbors('pricing');
    expect(pricing.prev?.slug).toBe('evaluation');
    expect(pricing.next?.slug).toBe('bafo');

    const bafo = caseStudyChapterNeighbors('bafo');
    expect(bafo.prev?.slug).toBe('pricing');
    expect(bafo.next?.slug).toBe('decision');
  });

  it('returns null neighbors for non-case-study slugs', () => {
    expect(caseStudyChapterNeighbors('welcome').prev).toBeNull();
    expect(caseStudyChapterNeighbors('welcome').next).toBeNull();
    expect(caseStudyChapterNeighbors('case-study').prev).toBeNull();
    expect(caseStudyChapterNeighbors('case-study').next).toBeNull();
  });

  it('every case study slug resolves via findSourceLearnNavItem', () => {
    expect(findSourceLearnNavItem('case-study')?.label).toMatch(/Case study/i);
    for (const slug of CASE_STUDY_CHAPTER_SLUGS) {
      const item = findSourceLearnNavItem(slug);
      expect(item).not.toBeNull();
      expect(item!.label).toMatch(/^Ch\.\d{2}/);
    }
  });

  it('keeps Getting Started and Reference groups intact', () => {
    const groups = SOURCE_LEARN_NAV.map((g) => g.group);
    expect(groups).toContain('Getting Started');
    expect(groups).toContain('Reference');
    // Slugs we promised not to touch
    const slugs = flatSourceLearnItems().map((i) => i.slug);
    expect(slugs).toContain('welcome');
    expect(slugs).toContain('intake');
    expect(slugs).toContain('sentinel');
    expect(slugs).toContain('glossary');
    expect(slugs).toContain('gates');
    expect(slugs).toContain('exports');
    expect(slugs).toContain('tower');
  });
});
