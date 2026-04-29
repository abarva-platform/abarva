// Phase Intelligence Packs · Surface 2 PR-A tests
//
// Locks in the contract that Codex-authored packs (PR-D) must satisfy
// AND verifies the P2 Synthesis reference pack is well-formed. The
// "schema sanity" suite runs across every authored pack so a bad pack
// can never silently degrade Nexus's posture.

import { getPhasePack, listAuthoredPhases, formatPhasePackForPrompt } from '../index';
import { P2_SYNTHESIS } from '../P2_synthesis';
import type { PhasePack } from '../types';

describe('getPhasePack', () => {
  it('returns the P2 Synthesis pack', () => {
    const pack = getPhasePack(2);
    expect(pack).toBe(P2_SYNTHESIS);
    expect(pack?.phase).toBe(2);
    expect(pack?.label).toBe('P2 Synthesis');
  });

  it('returns every authored phase pack', () => {
    expect(getPhasePack(0)?.label).toBe('P0 Originate');
    expect(getPhasePack(1)?.label).toBe('P1 Discovery');
    expect(getPhasePack(3)?.label).toBe('P3 Design');
    expect(getPhasePack(4)?.label).toBe('P4 Build');
    expect(getPhasePack(5)?.label).toBe('P5 Activate');
    expect(getPhasePack(6)?.label).toBe('P6 Operate');
  });

  it('returns null cleanly for null/undefined/out-of-range', () => {
    expect(getPhasePack(null)).toBeNull();
    expect(getPhasePack(undefined)).toBeNull();
    expect(getPhasePack(-1)).toBeNull();
    expect(getPhasePack(7)).toBeNull();
    expect(getPhasePack(99)).toBeNull();
  });
});

describe('listAuthoredPhases', () => {
  it('returns the set of phases that have packs (sorted)', () => {
    const phases = listAuthoredPhases();
    expect(phases).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('formatPhasePackForPrompt', () => {
  it('renders the P2 Synthesis pack into a coherent prompt block', () => {
    const out = formatPhasePackForPrompt(P2_SYNTHESIS);
    expect(out).toContain('ACTIVE PHASE PLAYBOOK');
    expect(out).toContain('P2 Synthesis');
    expect(out).toContain('Phase outcome');
    expect(out).toContain('Definition of done');
    expect(out).toContain('Right questions');
    expect(out).toContain('Anti-patterns');
    expect(out).toContain('Coaching arc');
    expect(out).toContain('Cross-phase dependencies');
  });

  it('marks hard-severity DoD items with [HARD] tag for Nexus disambiguation', () => {
    const out = formatPhasePackForPrompt(P2_SYNTHESIS);
    expect(out).toContain('[HARD]');
    expect(out).toContain('[SOFT]');
  });

  it('renders questions in order open → converge → close', () => {
    const out = formatPhasePackForPrompt(P2_SYNTHESIS);
    const openIdx = out.indexOf('OPEN');
    const convergeIdx = out.indexOf('CONVERGE');
    const closeIdx = out.indexOf('CLOSE');
    expect(openIdx).toBeGreaterThan(0);
    expect(convergeIdx).toBeGreaterThan(openIdx);
    expect(closeIdx).toBeGreaterThan(convergeIdx);
  });

  it('renders coaching arc entry/mid/exit posture in order', () => {
    const out = formatPhasePackForPrompt(P2_SYNTHESIS);
    const entryIdx = out.indexOf('ENTRY');
    const midIdx = out.indexOf('MID PHASE');
    const exitIdx = out.indexOf('EXIT');
    expect(entryIdx).toBeGreaterThan(0);
    expect(midIdx).toBeGreaterThan(entryIdx);
    expect(exitIdx).toBeGreaterThan(midIdx);
  });
});

// ── Schema sanity — runs over every authored pack ───────────────────────────
//
// These checks are what Codex-authored packs (PR-D) must pass. If a pack
// fails any of these, it's malformed and would cause Nexus to render a
// broken playbook. Deliberately strict.

const ALL_PACKS: PhasePack[] = listAuthoredPhases().map((p) => {
  const pack = getPhasePack(p);
  if (!pack) throw new Error(`listAuthoredPhases returned ${p} but getPhasePack returned null`);
  return pack;
});

describe('schema sanity (runs over every authored pack)', () => {
  it.each(ALL_PACKS)('$label · phase number is in [0,6]', (pack) => {
    expect(pack.phase).toBeGreaterThanOrEqual(0);
    expect(pack.phase).toBeLessThanOrEqual(6);
  });

  it.each(ALL_PACKS)('$label · outcome is non-trivial prose', (pack) => {
    expect(pack.outcome.length).toBeGreaterThan(80);
  });

  it.each(ALL_PACKS)('$label · has at least one HARD evidence item', (pack) => {
    const hard = pack.definitionOfDone.filter((d) => d.severity === 'hard');
    expect(hard.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label · every evidence item has a non-trivial evaluationHint', (pack) => {
    for (const item of pack.definitionOfDone) {
      expect(item.evaluationHint.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL_PACKS)('$label · evidence ids are unique within the pack', (pack) => {
    const ids = pack.definitionOfDone.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS)('$label · has at least one question in each arc bucket', (pack) => {
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label · every question has a non-trivial why', (pack) => {
    const all = [
      ...pack.rightQuestions.open,
      ...pack.rightQuestions.converge,
      ...pack.rightQuestions.close,
    ];
    for (const q of all) {
      expect(q.text.length).toBeGreaterThan(15);
      expect(q.why.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL_PACKS)('$label · question ids are unique across the pack', (pack) => {
    const ids = [
      ...pack.rightQuestions.open,
      ...pack.rightQuestions.converge,
      ...pack.rightQuestions.close,
    ].map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS)('$label · has at least three anti-patterns', (pack) => {
    expect(pack.antiPatterns.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ALL_PACKS)('$label · every anti-pattern has detect/flag/mitigation', (pack) => {
    for (const ap of pack.antiPatterns) {
      expect(ap.detectionHint.length).toBeGreaterThan(20);
      expect(ap.whatToFlag.length).toBeGreaterThan(20);
      expect(ap.mitigation.length).toBeGreaterThan(20);
    }
  });

  it.each(ALL_PACKS)('$label · coaching arc populated for entry/mid/exit', (pack) => {
    expect(pack.coachingArc.entry.length).toBeGreaterThan(20);
    expect(pack.coachingArc.midPhase.length).toBeGreaterThan(20);
    expect(pack.coachingArc.exit.length).toBeGreaterThan(20);
  });

  it.each(ALL_PACKS)('$label · dependencies have requires + produces', (pack) => {
    expect(pack.dependencies.requiresFromPrior.length).toBeGreaterThan(0);
    expect(pack.dependencies.producesForNext.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label · prompt format renders without throwing', (pack) => {
    expect(() => formatPhasePackForPrompt(pack)).not.toThrow();
    const out = formatPhasePackForPrompt(pack);
    expect(out.length).toBeGreaterThan(500);
  });
});
