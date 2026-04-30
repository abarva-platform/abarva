/**
 * J1 oriented-browse topic registry · validation suite
 *
 * Per INT-2_DETAILED_DESIGN.md §10.2. Topics without sign-off,
 * with broken citation references, with marketing language, or
 * with structural defects fail CI — not warn.
 */

import { FAILURE_MODES } from '@/lib/programs/failure-modes';
import {
  J1_TOPICS,
  getTopicById,
  getTopicsByFailureModeId,
  getTotalAssociatedPatternCount,
  getFailureModeNamesForTopic,
  slugifyTopicTitle,
  type TopicEntry,
} from '@/lib/intelligence/j1-topics';
import { getPatternManifestEntry } from '@/lib/intelligence/pattern-manifest';

describe('J1 topic registry — structural integrity', () => {
  it('contains exactly 10 topics', () => {
    expect(J1_TOPICS).toHaveLength(10);
  });

  it('every topicId is unique', () => {
    const ids = J1_TOPICS.map((t) => t.topicId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every topicId is non-empty and url-safe', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.topicId.length).toBeGreaterThan(0);
      expect(topic.topicId).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("every topicId equals slugifyTopicTitle(title)", () => {
    for (const topic of J1_TOPICS) {
      expect(topic.topicId).toBe(slugifyTopicTitle(topic.title));
    }
  });
});

describe('J1 topic content fields', () => {
  it('every title is a non-empty string under 60 chars', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.title.trim().length).toBeGreaterThan(0);
      expect(topic.title.length).toBeLessThanOrEqual(60);
    }
  });

  it('every thesis is between 200 and 400 chars', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.thesis.length).toBeGreaterThanOrEqual(200);
      expect(topic.thesis.length).toBeLessThanOrEqual(400);
    }
  });

  it('every whatIndustryGetsWrong is non-empty (≥150 chars)', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.whatIndustryGetsWrong.length).toBeGreaterThanOrEqual(150);
    }
  });

  it('every whatGoodLooksLike is non-empty (≥150 chars)', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.whatGoodLooksLike.length).toBeGreaterThanOrEqual(150);
    }
  });

  it('every topic has at least 2 exampleProgramArchetypes', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.exampleProgramArchetypes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every exampleProgramArchetype is a non-empty string', () => {
    for (const topic of J1_TOPICS) {
      for (const arch of topic.exampleProgramArchetypes) {
        expect(arch.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe('J1 topic cited references', () => {
  it('every associatedPatternIds[] entry resolves via getPatternManifestEntry', () => {
    for (const topic of J1_TOPICS) {
      for (const patternId of topic.associatedPatternIds) {
        const entry = getPatternManifestEntry(patternId);
        expect(entry).not.toBeNull();
      }
    }
  });

  it('every topic has 1-6 associatedPatternIds', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.associatedPatternIds.length).toBeGreaterThanOrEqual(1);
      expect(topic.associatedPatternIds.length).toBeLessThanOrEqual(6);
    }
  });

  it('every topic has 0-3 associatedFailureModeIds', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.associatedFailureModeIds.length).toBeGreaterThanOrEqual(0);
      expect(topic.associatedFailureModeIds.length).toBeLessThanOrEqual(3);
    }
  });

  it('every associatedFailureModeIds entry resolves to FAILURE_MODES', () => {
    const validIds = new Set(FAILURE_MODES.map((m) => m.id));
    for (const topic of J1_TOPICS) {
      for (const id of topic.associatedFailureModeIds) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });
});

describe('J1 topic sign-off discipline', () => {
  it('no topic has lastReviewedBy starting with "TBD"', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.lastReviewedBy.startsWith('TBD')).toBe(false);
    }
  });

  it('every topic has lastReviewedBy as non-empty string', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.lastReviewedBy.trim().length).toBeGreaterThan(0);
    }
  });

  it('every topic has lastReviewedAt as ISO date', () => {
    for (const topic of J1_TOPICS) {
      expect(topic.lastReviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('J1 topic content — voice rules (no marketing language)', () => {
  // Same forbidden list as J0 cards (FR-005).
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

  it('no topic content uses banned marketing language', () => {
    const checkText = (text: string, where: string, topicId: string) => {
      for (const { phrase, pattern } of FORBIDDEN_PHRASES) {
        if (pattern.test(text)) {
          throw new Error(
            `Topic "${topicId}" ${where} contains forbidden phrase "${phrase}":\n${text}`,
          );
        }
      }
    };

    for (const topic of J1_TOPICS) {
      checkText(topic.title, 'title', topic.topicId);
      checkText(topic.thesis, 'thesis', topic.topicId);
      checkText(
        topic.whatIndustryGetsWrong,
        'whatIndustryGetsWrong',
        topic.topicId,
      );
      checkText(
        topic.whatGoodLooksLike,
        'whatGoodLooksLike',
        topic.topicId,
      );
    }
  });

  it("whatGoodLooksLike references a phase / pattern / corpus concept concretely", () => {
    // FR-006: prevention mechanisms must be concrete (P0..P6, "Phase",
    // "Gate", or a specific pattern_* token).
    const concreteHints = /\b(P0|P1|P2|P3|P4|P5|P6|Phase|Gate|gate|pattern_[a-z0-9_]+)\b/;
    for (const topic of J1_TOPICS) {
      expect(topic.whatGoodLooksLike).toMatch(concreteHints);
    }
  });
});

describe('J1 slug derivation', () => {
  it('slugifyTopicTitle produces expected forms', () => {
    expect(slugifyTopicTitle('AI use case portfolio management')).toBe(
      'ai-use-case-portfolio-management',
    );
    expect(slugifyTopicTitle('Pilot-to-production scaling')).toBe(
      'pilot-to-production-scaling',
    );
    expect(slugifyTopicTitle('Workflow and operating-model change')).toBe(
      'workflow-and-operating-model-change',
    );
    expect(slugifyTopicTitle('Talent and skills')).toBe('talent-and-skills');
  });
});

describe('J1 helper functions', () => {
  it('getTopicById returns the right topic', () => {
    const topic = getTopicById('ai-use-case-portfolio-management');
    expect(topic).not.toBeNull();
    expect(topic?.title).toBe('AI use case portfolio management');
  });

  it('getTopicById returns null for unknown id', () => {
    expect(getTopicById('does-not-exist')).toBeNull();
  });

  it('getTopicsByFailureModeId returns topics that intersect the FM', () => {
    // Failure mode #1 (sponsorship) is referenced by at least the
    // AI use case portfolio management topic + AI governance topic.
    const topics = getTopicsByFailureModeId(1);
    expect(topics.length).toBeGreaterThanOrEqual(1);
    expect(topics.every((t) => t.associatedFailureModeIds.includes(1))).toBe(
      true,
    );
  });

  it('getTopicsByFailureModeId returns empty for unmapped FMs', () => {
    // Failure mode 99 doesn't exist — empty result.
    expect(getTopicsByFailureModeId(99)).toEqual([]);
  });

  it('getTotalAssociatedPatternCount sums correctly', () => {
    const expected = J1_TOPICS.reduce(
      (acc, t) => acc + t.associatedPatternIds.length,
      0,
    );
    expect(getTotalAssociatedPatternCount()).toBe(expected);
  });

  it('getFailureModeNamesForTopic returns canonical names in order', () => {
    const topic = getTopicById('ai-use-case-portfolio-management');
    expect(topic).not.toBeNull();
    if (!topic) return;
    const names = getFailureModeNamesForTopic(topic);
    expect(names.length).toBe(topic.associatedFailureModeIds.length);
    // Each name must come from FAILURE_MODES.
    const validNames = new Set(FAILURE_MODES.map((m) => m.name));
    for (const name of names) {
      expect(validNames.has(name)).toBe(true);
    }
  });
});

describe('J1 type discipline', () => {
  it('every topic satisfies TopicEntry shape', () => {
    for (const topic of J1_TOPICS) {
      const required: Array<keyof TopicEntry> = [
        'topicId',
        'title',
        'thesis',
        'whatIndustryGetsWrong',
        'whatGoodLooksLike',
        'associatedPatternIds',
        'associatedFailureModeIds',
        'exampleProgramArchetypes',
        'lastReviewedBy',
        'lastReviewedAt',
      ];
      for (const field of required) {
        expect(topic).toHaveProperty(field);
      }
    }
  });
});
