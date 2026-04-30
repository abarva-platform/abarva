/**
 * J0 cold-landing failure-mode card registry · validation suite
 *
 * Per INT-1_DETAILED_DESIGN.md §10.2. Cards without sign-off,
 * with broken citation references, with marketing language, or
 * with structural defects fail CI — not warn.
 */

import { FAILURE_MODES } from '@/lib/programs/failure-modes';
import {
  CORPUS_VERSION,
  J0_FAILURE_MODE_CARDS,
  getJ0CardByFailureModeId,
  getJ0CardBySlug,
  getTotalResearchAnchorCount,
  slugifyEditorialName,
  type FailureModeNarrativeCard,
} from '@/lib/intelligence/j0-failure-mode-cards';
import { getPatternManifestEntry } from '@/lib/intelligence/pattern-manifest';

describe('J0 failure-mode card registry — structural integrity', () => {
  it('contains exactly 10 cards', () => {
    expect(J0_FAILURE_MODE_CARDS).toHaveLength(10);
  });

  it('has one card per FAILURE_MODES entry (1..10)', () => {
    const cardIds = J0_FAILURE_MODE_CARDS.map((c) => c.failureModeId).sort(
      (a, b) => a - b,
    );
    const failureModeIds = FAILURE_MODES.map((m) => m.id).sort((a, b) => a - b);
    expect(cardIds).toEqual(failureModeIds);
  });

  it('cards are in canonical order (failureModeId ascending)', () => {
    const ids = J0_FAILURE_MODE_CARDS.map((c) => c.failureModeId);
    const sorted = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sorted);
  });

  it('every failureModeId resolves to a real FAILURE_MODES entry', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const mode = FAILURE_MODES.find((m) => m.id === card.failureModeId);
      expect(mode).toBeDefined();
    }
  });
});

describe('J0 card content fields', () => {
  it('every editorialName is a non-empty string', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(typeof card.editorialName).toBe('string');
      expect(card.editorialName.trim().length).toBeGreaterThan(0);
    }
  });

  it('every oneLineHook is under 100 characters', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.oneLineHook.length).toBeLessThanOrEqual(100);
    }
  });

  it('every oneLineHook is a non-empty string', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.oneLineHook.trim().length).toBeGreaterThan(0);
    }
  });

  it('every expandedNarrative word count is between 200 and 600', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const wordCount = card.expandedNarrative.trim().split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(200);
      expect(wordCount).toBeLessThanOrEqual(600);
    }
  });

  it('every whyItKills is a non-empty string', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.whyItKills.trim().length).toBeGreaterThan(0);
    }
  });

  it('every whatGoodLooksLike is a non-empty string', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.whatGoodLooksLike.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('J0 card cited references', () => {
  it('every citedPatternIds[] entry resolves via getPatternManifestEntry', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const patternId of card.citedPatternIds) {
        const entry = getPatternManifestEntry(patternId);
        expect(entry).not.toBeNull();
      }
    }
  });

  it('every card has at least 2 citedResearch entries', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.citedResearch.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every citedResearch entry has source, citation, and lastVerifiedAt', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const research of card.citedResearch) {
        expect(research.source).toBeTruthy();
        expect(research.citation.trim().length).toBeGreaterThan(0);
        expect(research.lastVerifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('every card has at least 2 exampleScenarios', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.exampleScenarios.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every exampleScenario has industryContext and scenario text', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const example of card.exampleScenarios) {
        expect(example.industryContext.trim().length).toBeGreaterThan(0);
        expect(example.scenario.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('J0 card sign-off discipline', () => {
  it('no card has lastReviewedBy starting with "TBD"', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.lastReviewedBy.startsWith('TBD')).toBe(false);
    }
  });

  it('every card has lastReviewedBy set to a non-empty string', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.lastReviewedBy.trim().length).toBeGreaterThan(0);
    }
  });

  it('every card has lastReviewedAt as ISO date', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('J0 card slug derivation', () => {
  it('slugifyEditorialName produces expected forms', () => {
    expect(slugifyEditorialName('The Phantom Sponsor')).toBe('phantom-sponsor');
    expect(slugifyEditorialName('The Pilot-to-Production Gap')).toBe(
      'pilot-to-production-gap',
    );
    expect(slugifyEditorialName("The Workflow That Wasn't")).toBe(
      'workflow-that-wasnt',
    );
    expect(slugifyEditorialName('The Sprawl Trap')).toBe('sprawl-trap');
    expect(slugifyEditorialName('Phantom Sponsor')).toBe('phantom-sponsor');
  });

  it('all editorial names produce unique slugs', () => {
    const slugs = J0_FAILURE_MODE_CARDS.map((c) =>
      slugifyEditorialName(c.editorialName),
    );
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('every slug is non-empty and url-safe', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const slug = slugifyEditorialName(card.editorialName);
      expect(slug.length).toBeGreaterThan(0);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe('J0 card content — voice rules (no marketing language)', () => {
  // Per INT-1_DETAILED_DESIGN.md §2.2 FR-013. Senior-practitioner voice
  // rejects marketing vocabulary. Word-boundary regex avoids false
  // positives like "transformation" matching "transform" — the ban is on
  // these words used as verbs in marketing voice.
  const FORBIDDEN_PHRASES: ReadonlyArray<{ phrase: string; pattern: RegExp }> = [
    { phrase: 'unlock', pattern: /\b(?:unlock|unlocks|unlocked|unlocking)\b/i },
    {
      phrase: 'accelerate',
      pattern: /\b(?:accelerate|accelerates|accelerated|accelerating)\b/i,
    },
    {
      phrase: 'leverage',
      pattern: /\b(?:leverage|leverages|leveraged|leveraging)\b/i,
    },
    {
      phrase: 'empower',
      pattern: /\b(?:empower|empowers|empowered|empowering)\b/i,
    },
    { phrase: 'revolutionary', pattern: /\brevolutionary\b/i },
    { phrase: 'cutting-edge', pattern: /\bcutting[- ]edge\b/i },
    { phrase: 'game-changer', pattern: /\bgame[- ]chang(?:er|ing|e)\b/i },
    { phrase: 'best-in-class', pattern: /\bbest[- ]in[- ]class\b/i },
    { phrase: 'next-generation', pattern: /\bnext[- ]generation\b/i },
  ];

  it('no card content uses banned marketing language', () => {
    const checkText = (text: string, where: string, cardId: number) => {
      for (const { phrase, pattern } of FORBIDDEN_PHRASES) {
        if (pattern.test(text)) {
          throw new Error(
            `Card #${cardId} ${where} contains forbidden phrase "${phrase}":\n${text}`,
          );
        }
      }
    };

    for (const card of J0_FAILURE_MODE_CARDS) {
      checkText(card.oneLineHook, 'oneLineHook', card.failureModeId);
      checkText(
        card.expandedNarrative,
        'expandedNarrative',
        card.failureModeId,
      );
      checkText(card.whyItKills, 'whyItKills', card.failureModeId);
      checkText(
        card.whatGoodLooksLike,
        'whatGoodLooksLike',
        card.failureModeId,
      );
      for (const example of card.exampleScenarios) {
        checkText(example.scenario, 'exampleScenarios.scenario', card.failureModeId);
      }
    }
  });
});

describe('J0 helper functions', () => {
  it('getJ0CardByFailureModeId returns the right card', () => {
    const card = getJ0CardByFailureModeId(1);
    expect(card).not.toBeNull();
    expect(card?.failureModeId).toBe(1);
    expect(card?.editorialName).toBe('The Phantom Sponsor');
  });

  it('getJ0CardByFailureModeId returns null for unknown id', () => {
    expect(getJ0CardByFailureModeId(99)).toBeNull();
  });

  it('getJ0CardBySlug returns the right card', () => {
    const card = getJ0CardBySlug('pilot-to-production-gap');
    expect(card).not.toBeNull();
    expect(card?.failureModeId).toBe(8);
  });

  it('getJ0CardBySlug returns null for unknown slug', () => {
    expect(getJ0CardBySlug('does-not-exist')).toBeNull();
  });

  it('getTotalResearchAnchorCount sums correctly', () => {
    const expected = J0_FAILURE_MODE_CARDS.reduce(
      (acc, c) => acc + c.citedResearch.length,
      0,
    );
    expect(getTotalResearchAnchorCount()).toBe(expected);
  });
});

describe('J0 corpus version', () => {
  it('CORPUS_VERSION is a valid semver', () => {
    expect(CORPUS_VERSION).toMatch(/^v\d+\.\d+\.\d+$/);
  });
});

describe('J0 card audit — manual sanity', () => {
  // These are not strict tests; they fail loudly if a card has surprising
  // shape that should warrant review.

  it('every card cites at least one pattern', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.citedPatternIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every example scenario has at least 50 chars of substance', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      for (const example of card.exampleScenarios) {
        expect(example.scenario.length).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it('whatGoodLooksLike references a phase or gate concretely', () => {
    // FR-013 / voice rule: prevention mechanisms must be concrete (P0/P1/P2/P3/P4/P5/P6 or "gate" or "step").
    const concreteHints = /\b(P0|P1|P2|P3|P4|P5|P6|Phase|Gate|gate|step|advance|require)\b/;
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.whatGoodLooksLike).toMatch(concreteHints);
    }
  });
});

describe('J0 type discipline', () => {
  it('every card satisfies FailureModeNarrativeCard', () => {
    // TS structural type-check at compile time — this is a runtime echo so
    // the test surfaces if any card is missing required fields.
    for (const card of J0_FAILURE_MODE_CARDS) {
      const required: Array<keyof FailureModeNarrativeCard> = [
        'failureModeId',
        'editorialName',
        'oneLineHook',
        'expandedNarrative',
        'whyItKills',
        'whatGoodLooksLike',
        'citedPatternIds',
        'citedResearch',
        'exampleScenarios',
        'lastReviewedBy',
        'lastReviewedAt',
      ];
      for (const field of required) {
        expect(card).toHaveProperty(field);
      }
    }
  });
});
