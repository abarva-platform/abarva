import {
  S3_RFP,
  S4_DEMO_POC,
  S5_BAFO,
  formatStagePackForPrompt,
  getStagePack,
  listAuthoredStages,
} from '../index';
import type { StagePack } from '../types';

describe('getStagePack', () => {
  it('returns the S5 BAFO reference pack', () => {
    const pack = getStagePack(5);
    expect(pack).toBe(S5_BAFO);
    expect(pack?.stage).toBe(5);
    expect(pack?.label).toBe('S5 BAFO');
  });

  it('returns the newly authored S3 and S4 packs', () => {
    expect(getStagePack(3)).toBe(S3_RFP);
    expect(getStagePack(4)).toBe(S4_DEMO_POC);
    expect(getStagePack(3)?.label).toBe('S3 RFP');
    expect(getStagePack(4)?.label).toBe('S4 Demo / POC');
  });

  it('returns null cleanly for missing or out-of-range stages', () => {
    expect(getStagePack(null)).toBeNull();
    expect(getStagePack(undefined)).toBeNull();
    expect(getStagePack(-1)).toBeNull();
    expect(getStagePack(6)).toBeNull();
    expect(getStagePack(8)).toBeNull();
    expect(getStagePack(99)).toBeNull();
  });
});

describe('listAuthoredStages', () => {
  it('returns the authored stage set sorted', () => {
    expect(listAuthoredStages()).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('formatStagePackForPrompt', () => {
  it('renders S5 BAFO into a Sentinel-readable prompt block', () => {
    const out = formatStagePackForPrompt(S5_BAFO);
    expect(out).toContain('ACTIVE SOURCING STAGE PLAYBOOK');
    expect(out).toContain('S5 BAFO');
    expect(out).toContain('Stage outcome');
    expect(out).toContain('Definition of done');
    expect(out).toContain('Right questions');
    expect(out).toContain('Anti-patterns');
    expect(out).toContain('Coaching arc');
    expect(out).toContain('Cross-stage dependencies');
  });

  it('includes source-stage mapping and corpus references without authoring corpus', () => {
    const out = formatStagePackForPrompt(S5_BAFO);
    expect(out).toContain('Source workflow mapping: evaluation, orals_bafo, selection');
    expect(out).toContain('Corpus references: PAT-SRC-AMS-001');
  });

  it('marks hard and soft evidence items distinctly', () => {
    const out = formatStagePackForPrompt(S5_BAFO);
    expect(out).toContain('[HARD]');
    expect(out).toContain('[SOFT]');
  });

  it('renders question arcs in open/converge/close order', () => {
    const out = formatStagePackForPrompt(S5_BAFO);
    const openIdx = out.indexOf('OPEN');
    const convergeIdx = out.indexOf('CONVERGE');
    const closeIdx = out.indexOf('CLOSE');
    expect(openIdx).toBeGreaterThan(0);
    expect(convergeIdx).toBeGreaterThan(openIdx);
    expect(closeIdx).toBeGreaterThan(convergeIdx);
  });
});

const ALL_PACKS: StagePack[] = listAuthoredStages().map((stage) => {
  const pack = getStagePack(stage);
  if (!pack) throw new Error(`listAuthoredStages returned ${stage} but getStagePack returned null`);
  return pack;
});

describe('schema sanity (runs over every authored sourcing stage pack)', () => {
  it.each(ALL_PACKS)('$label - stage number is in [0,7]', (pack) => {
    expect(pack.stage).toBeGreaterThanOrEqual(0);
    expect(pack.stage).toBeLessThanOrEqual(7);
  });

  it.each(ALL_PACKS)('$label - outcome is non-trivial prose', (pack) => {
    expect(pack.outcome.length).toBeGreaterThan(120);
  });

  it.each(ALL_PACKS)('$label - maps to at least one Source workflow key', (pack) => {
    expect(pack.sourceStageKeys?.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label - validates corpus pattern references when present', (pack) => {
    expect(pack.crossReferences?.sourceStageKeys.length).toBeGreaterThan(0);
    for (const id of pack.crossReferences?.patternIds ?? []) {
      expect(id).toMatch(/^PAT-SRC-/);
    }
  });

  it.each(ALL_PACKS)('$label - has at least one HARD evidence item', (pack) => {
    const hard = pack.definitionOfDone.filter((item) => item.severity === 'hard');
    expect(hard.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label - every evidence item has a non-trivial evaluationHint', (pack) => {
    for (const item of pack.definitionOfDone) {
      expect(item.evaluationHint.length).toBeGreaterThan(30);
    }
  });

  it.each(ALL_PACKS)('$label - evidence ids are unique within the pack', (pack) => {
    const ids = pack.definitionOfDone.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS)('$label - has questions in each arc bucket', (pack) => {
    expect(pack.rightQuestions.open.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.converge.length).toBeGreaterThan(0);
    expect(pack.rightQuestions.close.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label - every question has why text', (pack) => {
    const allQuestions = [
      ...pack.rightQuestions.open,
      ...pack.rightQuestions.converge,
      ...pack.rightQuestions.close,
    ];
    for (const question of allQuestions) {
      expect(question.text.length).toBeGreaterThan(20);
      expect(question.why.length).toBeGreaterThan(30);
    }
  });

  it.each(ALL_PACKS)('$label - question ids are unique across the pack', (pack) => {
    const ids = [
      ...pack.rightQuestions.open,
      ...pack.rightQuestions.converge,
      ...pack.rightQuestions.close,
    ].map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PACKS)('$label - has at least three anti-patterns', (pack) => {
    expect(pack.antiPatterns.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ALL_PACKS)('$label - every anti-pattern has detect/flag/mitigation', (pack) => {
    for (const antiPattern of pack.antiPatterns) {
      expect(antiPattern.detectionHint.length).toBeGreaterThan(30);
      expect(antiPattern.whatToFlag.length).toBeGreaterThan(30);
      expect(antiPattern.mitigation.length).toBeGreaterThan(30);
    }
  });

  it.each(ALL_PACKS)('$label - coaching arc populated for entry/mid/exit', (pack) => {
    expect(pack.coachingArc.entry.length).toBeGreaterThan(30);
    expect(pack.coachingArc.midPhase.length).toBeGreaterThan(30);
    expect(pack.coachingArc.exit.length).toBeGreaterThan(30);
  });

  it.each(ALL_PACKS)('$label - dependencies have requires and produces', (pack) => {
    expect(pack.dependencies.requiresFromPrior.length).toBeGreaterThan(0);
    expect(pack.dependencies.producesForNext.length).toBeGreaterThan(0);
  });

  it.each(ALL_PACKS)('$label - prompt format renders substantial guidance', (pack) => {
    const out = formatStagePackForPrompt(pack);
    expect(out.length).toBeGreaterThan(1200);
  });
});
