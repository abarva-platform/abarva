/**
 * FM #7 — Browse mode without thesis · INT-RGS
 *
 * Failure mode: J1 topic browser becomes a wiki — pages with
 * metadata but no AbarVa point of view at the top. The
 * mechanism: every topic has a `thesis` field; J1 renders the
 * thesis as the first thing on the topic page.
 */

import {
  J1_TOPICS,
  getTopicById,
  slugifyTopicTitle,
} from '@/lib/intelligence/j1-topics';

describe('FM #7 — Browse mode without thesis', () => {
  it('all 10 J1 topics exist', () => {
    expect(J1_TOPICS).toHaveLength(10);
  });

  it('every topic has a substantive thesis statement (>100 chars)', () => {
    for (const t of J1_TOPICS) {
      expect(t.thesis.length).toBeGreaterThan(100);
    }
  });

  it('every topic has a substantive whatIndustryGetsWrong statement', () => {
    for (const t of J1_TOPICS) {
      expect(t.whatIndustryGetsWrong.length).toBeGreaterThan(80);
    }
  });

  it('every topic has a substantive whatGoodLooksLike statement', () => {
    for (const t of J1_TOPICS) {
      expect(t.whatGoodLooksLike.length).toBeGreaterThan(80);
    }
  });

  it('every topic has a unique id and unique slug', () => {
    const ids = J1_TOPICS.map((t) => t.topicId);
    const slugs = J1_TOPICS.map((t) => slugifyTopicTitle(t.title));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every topic associates at least one pattern (failure-mode link is optional 0-3 per the type contract)', () => {
    for (const t of J1_TOPICS) {
      expect(t.associatedPatternIds.length).toBeGreaterThan(0);
      // associatedFailureModeIds is allowed to be empty per the
      // TopicEntry contract (0-3 ids); FM #7 cares about the
      // thesis being present, not about the failure-mode link.
      expect(t.associatedFailureModeIds.length).toBeGreaterThanOrEqual(0);
    }
  });

  it('every topic has at least one example program archetype', () => {
    for (const t of J1_TOPICS) {
      expect(t.exampleProgramArchetypes.length).toBeGreaterThan(0);
    }
  });

  it('getTopicById round-trips for every topic', () => {
    for (const t of J1_TOPICS) {
      expect(getTopicById(t.topicId)).toEqual(t);
    }
  });

  it('no topic contains "TODO" / "lorem" / "placeholder"', () => {
    for (const t of J1_TOPICS) {
      const blob = JSON.stringify(t).toLowerCase();
      expect(blob).not.toContain('todo');
      expect(blob).not.toContain('lorem');
      expect(blob).not.toContain('placeholder');
    }
  });
});
