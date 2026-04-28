import {
  PUBLIC_PATTERN_IDS,
  getPublicPatternBySlug,
  getPublicPatternSample,
} from '@/lib/public-patterns/curated-list';

describe('public pattern sample', () => {
  it('publishes the exact seven KF-6 pattern ids in order', () => {
    expect(getPublicPatternSample().map((pattern) => pattern.id)).toEqual([...PUBLIC_PATTERN_IDS]);
    expect(PUBLIC_PATTERN_IDS).toEqual([
      'PAT-AI-005',
      'PAT-CDP-001',
      'PAT-AI-010',
      'PAT-AI-008',
      'PAT-IND-RET-001',
      'PAT-ARCH-008',
      'PAT-META-M6',
    ]);
  });

  it('is backed by KF-1 corpus ids and public slugs', () => {
    for (const pattern of getPublicPatternSample()) {
      expect(pattern.source.corpusId).toBe(pattern.id);
      expect(pattern.source.corpusSlug).toBe(pattern.slug);
      expect(pattern.slug).toMatch(/^[a-z0-9-]+$/);
      expect(getPublicPatternBySlug(pattern.slug)?.id).toBe(pattern.id);
    }
  });

  it('keeps raw corpus internals out of the public payload', () => {
    for (const pattern of getPublicPatternSample()) {
      expect(pattern).not.toHaveProperty('body');
      expect(pattern).not.toHaveProperty('sourceDocuments');
      expect(pattern).not.toHaveProperty('derivedFromPatternIds');
      expect(pattern).not.toHaveProperty('taggedContradictionIds');
    }
  });

  it('does not leak tenant names, source paths, or specific internal examples', () => {
    const payload = JSON.stringify(getPublicPatternSample());
    const forbidden = [
      'Apex',
      'Meridian',
      'Keystone',
      'First Capital',
      'Tower Finance',
      'source-material',
      'docs/',
      'APX-',
      'M365 Copilot',
      '12,400',
      '2,950',
      '$2.4M',
      '73% of overrun',
    ];

    for (const token of forbidden) {
      expect(payload).not.toContain(token);
    }
  });
});
