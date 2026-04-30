/**
 * FM #2 — Empty-state collapse · INT-RGS
 *
 * Failure mode: cold load of `/intelligence` should not collapse
 * to lorem ipsum or stub content. The 10 J0 failure-mode cards
 * are the platform's contract on cold open.
 */

import {
  J0_FAILURE_MODE_CARDS,
  getCanonicalFailureMode,
  getJ0CardByFailureModeId,
  slugifyEditorialName,
} from '@/lib/intelligence/j0-failure-mode-cards';

describe('FM #2 — Empty-state collapse', () => {
  it('all 10 J0 failure-mode cards exist', () => {
    expect(J0_FAILURE_MODE_CARDS).toHaveLength(10);
  });

  it('every card has substantive content (not lorem / not TODO / not empty)', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.oneLineHook.length).toBeGreaterThan(40);
      expect(card.expandedNarrative.length).toBeGreaterThan(500);
      expect(card.whyItKills.length).toBeGreaterThan(50);
      expect(card.whatGoodLooksLike.length).toBeGreaterThan(50);
    }
  });

  it('no card contains "TODO" / "lorem" / "placeholder" / "xxxxx"', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const blob = JSON.stringify(card).toLowerCase();
      expect(blob).not.toContain('todo');
      expect(blob).not.toContain('lorem');
      expect(blob).not.toContain('placeholder');
      expect(blob).not.toContain('xxxxx');
    }
  });

  it('every card cites at least one pattern id and at least 2 research anchors', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.citedPatternIds.length).toBeGreaterThan(0);
      expect(card.citedResearch.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every card has at least 2 example scenarios', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      expect(card.exampleScenarios.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('canonical failure-mode list matches the spine doc — IDs 1..10', () => {
    const ids = J0_FAILURE_MODE_CARDS.map((c) => c.failureModeId).sort(
      (a, b) => a - b,
    );
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('every card has a unique editorial slug', () => {
    const slugs = J0_FAILURE_MODE_CARDS.map((c) =>
      slugifyEditorialName(c.editorialName),
    );
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('getCanonicalFailureMode resolves for every card', () => {
    for (const card of J0_FAILURE_MODE_CARDS) {
      const fm = getCanonicalFailureMode(card);
      expect(fm.id).toBe(card.failureModeId);
    }
  });

  it('getJ0CardByFailureModeId round-trips for every id', () => {
    for (let id = 1; id <= 10; id += 1) {
      const card = getJ0CardByFailureModeId(id);
      expect(card).toBeDefined();
      expect(card?.failureModeId).toBe(id);
    }
  });
});
